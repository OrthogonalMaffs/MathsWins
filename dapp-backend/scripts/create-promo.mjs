#!/usr/bin/env node
/**
 * Create a promo challenge.
 *
 * Usage: node scripts/create-promo.mjs CODE GAME_ID SEED SCORE [PRIZE] [MAX_CLAIMS] [CREATOR_WALLET]
 *
 * Example: node scripts/create-promo.mjs MAFFS sudoku-duel 12345 3200 25 20 0x1234...
 */
import { getDb } from '../src/db/index.mjs';
import crypto from 'crypto';

const args = process.argv.slice(2);

if (args.length < 4) {
  console.log('Usage: node scripts/create-promo.mjs CODE GAME_ID SEED SCORE [PRIZE] [MAX_CLAIMS] [CREATOR_WALLET]');
  console.log('Example: node scripts/create-promo.mjs MAFFS sudoku-duel 12345 3200 25 20 0x1234...');
  process.exit(1);
}

const code = args[0].toUpperCase().replace(/^#/, '');
const gameId = args[1];
const puzzleSeed = parseInt(args[2]);
const creatorScore = parseInt(args[3]);
const prizePerWin = parseInt(args[4]) || 25;
const maxClaims = parseInt(args[5]) || 20;
const creatorWallet = args[6] || '0x0000000000000000000000000000000000000000';

const db = getDb();

// Check code doesn't exist
const existing = db.prepare('SELECT * FROM promo_challenges WHERE code = ?').get(code);
if (existing) {
  console.error('ERROR: Code "' + code + '" already exists.');
  process.exit(1);
}

const id = crypto.randomUUID();
const now = Date.now();

db.prepare(`INSERT INTO promo_challenges (id, code, game_id, puzzle_seed, creator_wallet, creator_score, prize_per_win, max_claims, active, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`).run(id, code, gameId, puzzleSeed, creatorWallet.toLowerCase(), creatorScore, prizePerWin, maxClaims, now);

console.log('Promo challenge created:');
console.log('  Code:      #' + code);
console.log('  Game:      ' + gameId);
console.log('  Seed:      ' + puzzleSeed);
console.log('  Score to beat: ' + creatorScore);
console.log('  Prize:     ' + prizePerWin + ' QF per win');
console.log('  Max wins:  ' + maxClaims);
console.log('  Total cost: ' + (prizePerWin * maxClaims) + ' QF');
console.log('  ID:        ' + id);

process.exit(0);
