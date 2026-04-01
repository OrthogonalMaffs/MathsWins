import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db;

export function getDb() {
  if (db) return db;
  const dbPath = process.env.DB_PATH || join(__dirname, '../../data/mathswins.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run schema
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);

  return db;
}

// ── Entry queries ───────────────────────────────────────────────────────────

export function recordEntry(wallet, gameId, weekId, tier, txHash, blockNumber) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO entries (wallet, game_id, week_id, tier, tx_hash, block_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(wallet.toLowerCase(), gameId, weekId, tier, txHash, blockNumber);
}

export function getEntry(wallet, gameId, weekId) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM entries WHERE wallet = ? AND game_id = ? AND week_id = ?
  `).get(wallet.toLowerCase(), gameId, weekId);
}

// ── Session queries ─────────────────────────────────────────────────────────

export function createSession(id, wallet, gameId, weekId, attempt) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO sessions (id, wallet, game_id, week_id, attempt)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, wallet.toLowerCase(), gameId, weekId, attempt);
}

export function getSession(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
}

export function completeSession(id, score) {
  const db = getDb();
  return db.prepare(`
    UPDATE sessions SET score = ?, completed_at = datetime('now') WHERE id = ?
  `).run(score, id);
}

export function expireSession(id) {
  const db = getDb();
  return db.prepare(`
    UPDATE sessions SET expired = 1, completed_at = datetime('now') WHERE id = ?
  `).run(id);
}

export function getSessionCount(wallet, gameId, weekId) {
  const db = getDb();
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM sessions
    WHERE wallet = ? AND game_id = ? AND week_id = ? AND expired = 0
  `).get(wallet.toLowerCase(), gameId, weekId);
  return row.count;
}

// ── Best scores ─────────────────────────────────────────────────────────────

export function upsertBestScore(wallet, gameId, weekId, score) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO best_scores (wallet, game_id, week_id, score, achieved_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(wallet, game_id, week_id)
    DO UPDATE SET score = ?, achieved_at = datetime('now')
    WHERE ? > best_scores.score
  `).run(wallet.toLowerCase(), gameId, weekId, score, score, score);
}

export function getLeaderboard(gameId, weekId, limit = 10) {
  const db = getDb();
  return db.prepare(`
    SELECT wallet, score, achieved_at
    FROM best_scores
    WHERE game_id = ? AND week_id = ?
    ORDER BY score DESC, achieved_at ASC
    LIMIT ?
  `).all(gameId, weekId, limit);
}

export function getTopScorer(gameId, weekId) {
  const db = getDb();
  return db.prepare(`
    SELECT wallet, score, achieved_at
    FROM best_scores
    WHERE game_id = ? AND week_id = ?
    ORDER BY score DESC, achieved_at ASC
    LIMIT 1
  `).get(gameId, weekId);
}

// ── Games ───────────────────────────────────────────────────────────────────

export function getGame(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM games WHERE id = ?').get(id);
}

export function getPaidGames() {
  const db = getDb();
  return db.prepare('SELECT * FROM games WHERE is_paid = 1').all();
}

export function upsertGame(game) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO games (id, name, is_paid, server_scoring, session_timeout_secs, questions_per_session)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      is_paid = excluded.is_paid,
      server_scoring = excluded.server_scoring,
      session_timeout_secs = excluded.session_timeout_secs,
      questions_per_session = excluded.questions_per_session
  `).run(game.id, game.name, game.isPaid ? 1 : 0, game.serverScoring ? 1 : 0,
         game.sessionTimeoutSeconds || 300, game.questionsPerSession || 10);
}

// ── Settlements ─────────────────────────────────────────────────────────────

export function recordSettlement(weekId, gameId, winnerWallet, potAmount, treasuryAmount, rolledOver, txHash) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO settlements (week_id, game_id, winner_wallet, pot_amount, treasury_amount, rolled_over, tx_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(weekId, gameId, winnerWallet, potAmount, treasuryAmount, rolledOver ? 1 : 0, txHash);
}

// ── Duel queries ──────────────────────────────────────────────────────
export function createDuel(id, gameId, puzzleSeed, difficulty, creatorWallet, shareCode, createdAt, expiresAt) {
  const db = getDb();
  db.prepare(`INSERT INTO duels (id, game_id, puzzle_seed, difficulty, creator_wallet, share_code, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, 'created', ?, ?)`).run(id, gameId, puzzleSeed, difficulty, creatorWallet, shareCode, createdAt, expiresAt);
}

export function getDuelByCode(code) {
  const db = getDb();
  return db.prepare('SELECT * FROM duels WHERE share_code = ?').get(code);
}

export function getDuelById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM duels WHERE id = ?').get(id);
}

export function updateDuelCreatorScore(duelId, score, timeMs, mistakes, hints) {
  const db = getDb();
  db.prepare(`UPDATE duels SET creator_score = ?, creator_time_ms = ?, creator_mistakes = ?, creator_hints = ? WHERE id = ?`)
    .run(score, timeMs, mistakes, hints, duelId);
}

export function acceptDuel(duelId, opponentWallet) {
  const db = getDb();
  db.prepare(`UPDATE duels SET opponent_wallet = ?, status = 'accepted' WHERE id = ? AND status = 'created'`)
    .run(opponentWallet, duelId);
}

export function updateDuelOpponentScore(duelId, score, timeMs, mistakes, hints) {
  const db = getDb();
  db.prepare(`UPDATE duels SET opponent_score = ?, opponent_time_ms = ?, opponent_mistakes = ?, opponent_hints = ? WHERE id = ?`)
    .run(score, timeMs, mistakes, hints, duelId);
}

export function completeDuel(duelId, winnerWallet) {
  const db = getDb();
  db.prepare(`UPDATE duels SET status = 'completed', winner_wallet = ? WHERE id = ?`)
    .run(winnerWallet, duelId);
}

export function expireOldDuels() {
  const db = getDb();
  const now = Date.now();
  db.prepare(`UPDATE duels SET status = 'expired' WHERE status IN ('created', 'accepted') AND expires_at < ?`).run(now);
}

export function getDuelsByWallet(wallet, limit) {
  const db = getDb();
  return db.prepare(`SELECT * FROM duels WHERE (creator_wallet = ? OR opponent_wallet = ?) ORDER BY created_at DESC LIMIT ?`)
    .all(wallet, wallet, limit || 20);
}
