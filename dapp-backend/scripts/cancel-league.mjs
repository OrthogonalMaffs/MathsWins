#!/usr/bin/env node
// One-shot: cancel a league and process refunds.
// Mirrors the /admin/league/:leagueId/cancel handler logic so the refund
// goes through the same pipeline as every other cancellation.
//
// Usage: node scripts/cancel-league.mjs <leagueId> "<reason>"

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

const [, , leagueId, reasonArg] = process.argv;
if (!leagueId) {
  console.error('Usage: node scripts/cancel-league.mjs <leagueId> "<reason>"');
  process.exit(1);
}
const reason = reasonArg || 'Admin cancelled';

const {
  getLeagueById, getLeaguePlayers, getLeagueRefunds,
  cancelLeagueWithReason, addLeagueRefund, updateRefundStatus,
  markRefunded, getPendingRefunds
} = await import('../src/db/index.mjs');
const { sendQF } = await import('../src/escrow.mjs');

const league = getLeagueById(leagueId);
if (!league) { console.error('League not found:', leagueId); process.exit(1); }
if (league.status === 'settled' || league.status === 'cancelled') {
  console.error('League already', league.status); process.exit(1);
}

console.log('Cancelling', leagueId, '—', league.game_id, league.tier, 'entry_fee=' + league.entry_fee);
cancelLeagueWithReason(league.id, reason);

const players = getLeaguePlayers(league.id);
const now = Date.now();
for (const p of players) {
  if (p.tx_hash === 'builder-whitelist') continue;
  const existing = getLeagueRefunds(league.id);
  if (existing.find(r => r.wallet === p.wallet.toLowerCase())) continue;
  addLeagueRefund(league.id, p.wallet, league.entry_fee, now);
  console.log('Queued refund:', league.entry_fee, 'QF →', p.wallet);
}

const pending = getPendingRefunds().filter(r => r.league_id === league.id);
for (const refund of pending) {
  try {
    const txHash = await sendQF(refund.wallet, refund.amount_qf);
    if (txHash) {
      updateRefundStatus(refund.id, 'sent', txHash, null);
      markRefunded(league.id, refund.wallet);
      console.log('Sent', refund.amount_qf, 'QF to', refund.wallet, 'tx:', txHash);
    } else {
      updateRefundStatus(refund.id, 'failed', null, 'sendQF returned null');
      console.error('Refund failed — sendQF returned null');
    }
  } catch (e) {
    updateRefundStatus(refund.id, 'failed', null, e.message);
    console.error('Refund failed:', e.message);
  }
}

console.log('Done. Refunds queued:', getLeagueRefunds(league.id).length);
process.exit(0);
