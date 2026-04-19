#!/usr/bin/env node
// One-shot duel refund. Used to recover from the pre-fix silent-failure
// path where server.mjs marked a duel expired without checking sendQF's
// return value. Logs to escrow_ledger with the duel id as reference_id
// so sweeps treat it correctly.
//
// Usage: node scripts/one-shot-duel-refund.mjs <duelId> <wallet> <amountQF>

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

const [, , duelId, wallet, amountStr] = process.argv;
if (!duelId || !wallet || !amountStr) {
  console.error('Usage: node scripts/one-shot-duel-refund.mjs <duelId> <wallet> <amountQF>');
  process.exit(1);
}
const amount = Number(amountStr);
if (!(amount > 0)) { console.error('amount must be > 0'); process.exit(1); }

const { initEscrow, sendQF } = await import('../src/escrow.mjs');
initEscrow();

console.log('Refunding', amount, 'QF →', wallet, 'for duel', duelId);
const txHash = await sendQF(wallet, amount, { type: 'refund', source: 'duel', referenceId: duelId });
if (!txHash) { console.error('sendQF returned null — refund failed'); process.exit(1); }
console.log('Sent. tx:', txHash);
process.exit(0);
