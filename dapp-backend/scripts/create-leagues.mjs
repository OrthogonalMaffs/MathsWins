#!/usr/bin/env node
/**
 * Create initial Bronze + Silver leagues for all 9 competitive games.
 * Run once to seed the first leagues, then again whenever you want new ones.
 *
 * Usage: node scripts/create-leagues.mjs
 */
import { getDb } from '../src/db/index.mjs';
import crypto from 'crypto';

const GAMES = [
  'sudoku-duel',
  'estimation-engine',
  'sequence-solver',
  'countdown-numbers',
  'prime-or-composite',
  'cryptarithmetic-club',
  'kenken',
  'nonogram',
  'kakuro'
];

const TIERS = [
  { tier: 'bronze', fee: 100 },
  { tier: 'silver', fee: 250 }
];

const REG_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PUZZLE_COUNT = 10;

const db = getDb();

let created = 0;

for (const gameId of GAMES) {
  for (const { tier, fee } of TIERS) {
    // Check if there's already an active league for this game + tier
    const existing = db.prepare(
      `SELECT id FROM leagues WHERE game_id = ? AND tier = ? AND status IN ('registration', 'active')`
    ).get(gameId, tier);

    if (existing) {
      console.log(`SKIP ${gameId} ${tier} — already has active league ${existing.id}`);
      continue;
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    const regClosesAt = now + REG_WINDOW_MS;

    db.prepare(`INSERT INTO leagues (id, game_id, tier, entry_fee, puzzle_count, status, reg_opens_at, reg_closes_at, created_at)
      VALUES (?, ?, ?, ?, ?, 'registration', ?, ?, ?)`).run(id, gameId, tier, fee, PUZZLE_COUNT, now, regClosesAt, now);

    console.log(`CREATED ${gameId} ${tier} league — ${fee} QF — ID: ${id.slice(0, 8)}... — Registration open until ${new Date(regClosesAt).toISOString()}`);
    created++;
  }
}

console.log(`\nDone. ${created} leagues created.`);
process.exit(0);
