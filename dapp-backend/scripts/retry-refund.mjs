#!/usr/bin/env node
// One-shot: retry a failed refund row. Initialises escrow before sending.
// Usage: node scripts/retry-refund.mjs <leagueId> <wallet>

import { readFileSync, existsSync } from 'fs';
import { URL as _URL } from 'url';
{
  const envPath = new _URL('../.env', import.meta.url).pathname;
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}

const [, , leagueId, wallet] = process.argv;
if (!leagueId || !wallet) {
  console.error('Usage: node scripts/retry-refund.mjs <leagueId> <wallet>');
  process.exit(1);
}

const { getLeagueRefunds, updateRefundStatus, markRefunded } = await import('../src/db/index.mjs');
const { sendQF, initEscrow } = await import('../src/escrow.mjs');

initEscrow();

const refunds = getLeagueRefunds(leagueId);
const target = refunds.find(r => r.wallet.toLowerCase() === wallet.toLowerCase());
if (!target) { console.error('No refund row found'); process.exit(1); }
if (target.status === 'sent') { console.log('Already sent. tx:', target.tx_hash); process.exit(0); }

console.log('Retrying refund:', target.amount_qf, 'QF →', target.wallet, '(prev status:', target.status + ')');
try {
  const txHash = await sendQF(target.wallet, target.amount_qf, { type: 'refund', source: 'league', referenceId: leagueId });
  if (txHash) {
    updateRefundStatus(target.id, 'sent', txHash, null);
    markRefunded(leagueId, target.wallet);
    console.log('Sent. tx:', txHash);
  } else {
    updateRefundStatus(target.id, 'failed', null, 'sendQF returned null');
    console.error('sendQF returned null');
    process.exit(1);
  }
} catch (e) {
  updateRefundStatus(target.id, 'failed', null, e.message);
  console.error('Refund failed:', e.message);
  process.exit(1);
}
process.exit(0);
