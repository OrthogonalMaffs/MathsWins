#!/usr/bin/env node
// Manual escrow sweep: sends any QF above (obligations + buffer) to TEAM_WALLET.
// Defaults to dry-run. Pass --execute to actually send.
//
// Obligations counted:
//   1. Active league pots — SUM(total_pot) for leagues in registration/active
//   2. Held duel stakes — creator_tx and/or acceptor_tx paid, duel not settled
//   3. Pending/failed league refunds — SUM(amount_qf) from league_refunds
//
// Floor = obligations + buffer (default 100 QF). Excess = balance - floor.
// If excess > 0 and --execute, sendQF(TEAM_WALLET, excess, ctx='team-sweep').
//
// Usage:
//   node scripts/escrow-sweep.mjs                 # dry-run, default 100 QF buffer
//   node scripts/escrow-sweep.mjs --buffer 50     # dry-run, custom buffer
//   node scripts/escrow-sweep.mjs --execute       # perform the sweep

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

const args = process.argv.slice(2);
const execute = args.includes('--execute');
const bufferIdx = args.indexOf('--buffer');
const buffer = bufferIdx !== -1 && args[bufferIdx + 1] ? Number(args[bufferIdx + 1]) : 100;

const { getDb } = await import('../src/db/index.mjs');
const { initEscrow, getEscrowAddress, getEscrowBalance, sendQF, TEAM_WALLET } = await import('../src/escrow.mjs');
const { ethers } = await import('ethers');

initEscrow();
const db = getDb();

// 1. Active league pots
const leaguePots = db.prepare(
  "SELECT COALESCE(SUM(total_pot), 0) AS t FROM leagues WHERE status IN ('registration', 'active') AND total_pot IS NOT NULL"
).get().t || 0;

// 2. Duel stakes held in escrow
//    - status='created': creator paid if creator_tx not null
//    - status='accepted' or 'completed' pending settle: both may have paid
//    - status='expired' with creator_tx/acceptor_tx → check for:
//        (a) matching reference_id ledger row (direct link), OR
//        (b) matching duel_refunds row with status='sent' (new retryable path), OR
//        (c) heuristic match to an orphan ledger row (legacy before reference_id
//            was wired — amount + recipient + within 10 min of expiry)
const duelsRaw = db.prepare(
  "SELECT id, stake, status, creator_wallet, opponent_wallet, creator_tx, acceptor_tx, expires_at FROM duels WHERE status IN ('created', 'accepted', 'expired') AND (creator_tx IS NOT NULL OR acceptor_tx IS NOT NULL)"
).all();

// Candidate pool of orphan (reference_id IS NULL) refund rows — greedy-consumed
// by the heuristic. At most one duel per orphan row. Sorted by created_at so
// an earlier-expiring duel claims an earlier ledger row.
const orphanRefunds = db.prepare(
  "SELECT id, amount_qf, recipient, created_at FROM escrow_ledger WHERE type = 'refund' AND source = 'duel' AND direction = 'out' AND (reference_id IS NULL OR reference_id = '') ORDER BY created_at ASC"
).all();
const consumedOrphanIds = new Set();

function isRefundedOnChain(duelId, wallet, amountQf, expiresAt) {
  if (!wallet || !(amountQf > 0)) return false;
  // (a) direct reference_id link
  const direct = db.prepare(
    "SELECT 1 FROM escrow_ledger WHERE reference_id = ? AND recipient = ? AND amount_qf = ? AND type = 'refund' AND source = 'duel' AND direction = 'out' LIMIT 1"
  ).get(duelId, wallet.toLowerCase(), amountQf);
  if (direct) return true;
  // (b) duel_refunds row in 'sent' state
  try {
    const tracked = db.prepare(
      "SELECT 1 FROM duel_refunds WHERE duel_id = ? AND wallet = ? AND status = 'sent' LIMIT 1"
    ).get(duelId, wallet.toLowerCase());
    if (tracked) return true;
  } catch (e) { /* table may not exist pre-migration */ }
  // (c) heuristic: orphan ledger row with matching recipient + amount + time window
  if (!expiresAt) return false;
  const windowStart = expiresAt - 60 * 1000;
  const windowEnd = expiresAt + 600 * 1000;
  for (const row of orphanRefunds) {
    if (consumedOrphanIds.has(row.id)) continue;
    if (row.recipient.toLowerCase() !== wallet.toLowerCase()) continue;
    if (Math.abs(row.amount_qf - amountQf) > 0.00001) continue;
    if (row.created_at < windowStart || row.created_at > windowEnd) continue;
    consumedOrphanIds.add(row.id);
    return true;
  }
  return false;
}

let duelStakes = 0;
const duelDetail = { created: 0, accepted: 0, expiredPendingRefund: 0 };
// Sort expired duels by expires_at ascending so the heuristic pairs earliest first
duelsRaw.sort((a, b) => (a.expires_at || 0) - (b.expires_at || 0));
for (const d of duelsRaw) {
  const stake = d.stake || 0;
  const creatorPaid = d.creator_tx ? stake : 0;
  const acceptorPaid = d.acceptor_tx ? stake : 0;
  if (d.status === 'created') {
    duelStakes += creatorPaid + acceptorPaid;
    duelDetail.created += creatorPaid + acceptorPaid;
  } else if (d.status === 'accepted') {
    duelStakes += creatorPaid + acceptorPaid;
    duelDetail.accepted += creatorPaid + acceptorPaid;
  } else if (d.status === 'expired') {
    if (creatorPaid > 0 && !isRefundedOnChain(d.id, d.creator_wallet, stake, d.expires_at)) {
      duelStakes += stake;
      duelDetail.expiredPendingRefund += stake;
    }
    if (acceptorPaid > 0 && !isRefundedOnChain(d.id, d.opponent_wallet, stake, d.expires_at)) {
      duelStakes += stake;
      duelDetail.expiredPendingRefund += stake;
    }
  }
}

// 3. Pending / failed league refunds
const leagueRefunds = db.prepare(
  "SELECT COALESCE(SUM(amount_qf), 0) AS t FROM league_refunds WHERE status IN ('pending', 'failed')"
).get().t || 0;

const obligations = leaguePots + duelStakes + leagueRefunds;
const balWei = await getEscrowBalance();
const balance = Number(ethers.formatEther(balWei));
const floor = obligations + buffer;
const excess = balance - floor;

console.log('─── ESCROW SWEEP ───');
console.log('Escrow wallet:   ', getEscrowAddress());
console.log('Team wallet:     ', TEAM_WALLET);
console.log('');
console.log('Obligations:');
console.log('  Active league pots:       ', leaguePots.toFixed(2), 'QF');
console.log('  Duel stakes (created):    ', duelDetail.created.toFixed(2), 'QF');
console.log('  Duel stakes (accepted):   ', duelDetail.accepted.toFixed(2), 'QF');
console.log('  Expired pending refund:   ', duelDetail.expiredPendingRefund.toFixed(2), 'QF');
console.log('  League refunds pending:   ', leagueRefunds.toFixed(2), 'QF');
console.log('  ─────────────────────────');
console.log('  Total obligations:        ', obligations.toFixed(2), 'QF');
console.log('');
console.log('Balance:                    ', balance.toFixed(6), 'QF');
console.log('Buffer:                     ', buffer.toFixed(2), 'QF');
console.log('Floor (obligations+buffer): ', floor.toFixed(2), 'QF');
console.log('Excess (sweepable):         ', excess.toFixed(6), 'QF');
console.log('');

if (excess <= 0) {
  console.log('Nothing to sweep — balance is at or below floor.');
  process.exit(0);
}

if (!execute) {
  console.log('DRY-RUN. Pass --execute to send', excess.toFixed(6), 'QF to', TEAM_WALLET);
  process.exit(0);
}

console.log('Sending', excess.toFixed(6), 'QF to', TEAM_WALLET, '...');
const txHash = await sendQF(TEAM_WALLET, excess, { type: 'team-sweep', source: 'escrow-maintenance', referenceId: null });
if (!txHash) {
  console.error('Sweep failed — sendQF returned null');
  process.exit(1);
}
console.log('Sent. tx:', txHash);
process.exit(0);
