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

  // Migrations — add columns that may not exist on older DBs
  try { db.exec('ALTER TABLE league_players ADD COLUMN puzzle_order TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE leagues ADD COLUMN auto_created_by TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE leagues ADD COLUMN cancelled_at INTEGER'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE leagues ADD COLUMN cancel_reason TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE leagues ADD COLUMN force_settled_at INTEGER'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE leagues ADD COLUMN force_settled_by TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE active_game_state ADD COLUMN undo_count INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }

  // League refunds table
  db.exec(`CREATE TABLE IF NOT EXISTS league_refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    league_id TEXT NOT NULL,
    wallet TEXT NOT NULL,
    amount_qf INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    tx_hash TEXT,
    attempted_at INTEGER,
    sent_at INTEGER,
    failed_reason TEXT,
    created_at INTEGER NOT NULL
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_league_refunds_status ON league_refunds(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_league_refunds_league ON league_refunds(league_id)');

  // ── Achievement tables ──────────────────────────────────────────────
  db.exec(`CREATE TABLE IF NOT EXISTS achievement_registry (
    achievement_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    game_id TEXT,
    tier TEXT NOT NULL,
    mint_fee_qf INTEGER NOT NULL,
    first_claimed_by TEXT,
    first_claimed_at INTEGER,
    active INTEGER DEFAULT 1
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS achievement_eligibility (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    earned_at INTEGER NOT NULL,
    minted_at INTEGER,
    tx_hash TEXT,
    is_pioneer INTEGER DEFAULT 0,
    UNIQUE(wallet, achievement_id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS global_records (
    record_id TEXT PRIMARY KEY,
    wallet TEXT NOT NULL,
    value TEXT NOT NULL,
    achieved_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS wallet_stats (
    wallet TEXT PRIMARY KEY,
    saturday_streak INTEGER DEFAULT 0,
    saturday_last_played TEXT,
    total_qf_minted INTEGER DEFAULT 0,
    consecutive_duel_wins INTEGER DEFAULT 0,
    updated_at INTEGER
  )`);

  seedAchievements(db);

  return db;
}

// ── Achievement seed data ───────────────────────────────────────────────────

const ACHIEVEMENTS = [
  // Purity (per game)
  { id: 'no-errors-sudoku', name: 'No Errors — Sudoku', game_id: 'sudoku-duel', tier: 'standard', fee: 100 },
  { id: 'no-errors-minesweeper', name: 'No Errors — Minesweeper', game_id: 'minesweeper', tier: 'standard', fee: 100 },
  { id: 'no-errors-freecell', name: 'No Errors — FreeCell', game_id: 'freecell', tier: 'standard', fee: 100 },
  { id: 'no-errors-countdown', name: 'No Errors — Countdown', game_id: 'countdown-numbers', tier: 'standard', fee: 100 },
  { id: 'no-errors-cryptarithmetic', name: 'No Errors — Cryptarithmetic', game_id: 'cryptarithmetic-club', tier: 'standard', fee: 100 },
  { id: 'no-errors-kenken', name: 'No Errors — KenKen', game_id: 'kenken', tier: 'standard', fee: 100 },
  { id: 'no-errors-nonogram', name: 'No Errors — Nonogram', game_id: 'nonogram', tier: 'standard', fee: 100 },
  { id: 'no-errors-kakuro', name: 'No Errors — Kakuro', game_id: 'kakuro', tier: 'standard', fee: 100 },
  { id: 'the-purist', name: 'The Purist', game_id: 'freecell', tier: 'standard', fee: 100 },
  { id: 'flawless-line', name: 'Flawless Line', game_id: 'minesweeper', tier: 'standard', fee: 100 },
  // Super
  { id: 'immaculate', name: 'Immaculate', game_id: null, tier: 'obsidian', fee: 250 },
  // Volume
  { id: 'first-steps', name: 'First Steps', game_id: null, tier: 'standard', fee: 100 },
  { id: 'committed', name: 'Committed', game_id: null, tier: 'standard', fee: 100 },
  { id: 'dedicated', name: 'Dedicated', game_id: null, tier: 'standard', fee: 100 },
  { id: 'veteran', name: 'Veteran', game_id: null, tier: 'standard', fee: 100 },
  { id: 'legend', name: 'Legend', game_id: null, tier: 'obsidian', fee: 100 },
  // Winning
  { id: 'winner', name: 'Winner', game_id: null, tier: 'standard', fee: 100 },
  { id: 'on-a-roll', name: 'On a Roll', game_id: null, tier: 'standard', fee: 100 },
  { id: 'dominant', name: 'Dominant', game_id: null, tier: 'obsidian', fee: 100 },
  { id: 'hat-trick', name: 'Hat Trick', game_id: null, tier: 'standard', fee: 100 },
  { id: 'the-completionist', name: 'The Completionist', game_id: null, tier: 'obsidian', fee: 100 },
  { id: 'the-tortoise', name: 'The Tortoise', game_id: null, tier: 'standard', fee: 100 },
  // Duels
  { id: 'first-blood', name: 'First Blood', game_id: null, tier: 'standard', fee: 100 },
  { id: 'duelist', name: 'Duelist', game_id: null, tier: 'standard', fee: 100 },
  { id: 'gladiator', name: 'Gladiator', game_id: null, tier: 'standard', fee: 100 },
  { id: 'heartbreaker', name: 'Heartbreaker', game_id: null, tier: 'standard', fee: 100 },
  { id: 'giant-slayer', name: 'Giant Slayer', game_id: null, tier: 'standard', fee: 100 },
  { id: 'the-wall', name: 'The Wall', game_id: null, tier: 'standard', fee: 100 },
  // Skill
  { id: 'clean-sweep', name: 'Clean Sweep', game_id: 'minesweeper', tier: 'standard', fee: 100 },
  { id: 'sub-minute', name: 'Sub-Minute', game_id: 'sudoku-duel', tier: 'standard', fee: 100 },
  { id: 'untouchable', name: 'Untouchable', game_id: null, tier: 'standard', fee: 100 },
  { id: 'the-undo-king', name: 'The Undo King', game_id: 'freecell', tier: 'standard', fee: 100 },
  { id: 'wrong-answer-streak', name: 'Wrong Answer Streak', game_id: 'prime-or-composite', tier: 'standard', fee: 100 },
  // Time & Dedication
  { id: 'night-owl', name: 'Night Owl', game_id: null, tier: 'standard', fee: 100 },
  { id: 'weekend-warrior', name: 'Weekend Warrior', game_id: null, tier: 'standard', fee: 100 },
  { id: 'the-marathon', name: 'The Marathon', game_id: null, tier: 'standard', fee: 100 },
  // Absurd
  { id: 'the-mathematician', name: 'The Mathematician', game_id: null, tier: 'standard', fee: 100 },
  { id: 'lucky-number', name: 'Lucky Number', game_id: 'freecell', tier: 'standard', fee: 100 },
  { id: 'palindrome', name: 'Palindrome', game_id: null, tier: 'standard', fee: 100 },
  { id: 'speedrun-to-zero', name: 'Speedrun to Zero', game_id: 'sudoku-duel', tier: 'standard', fee: 100 },
  { id: 'flag-everything', name: 'Flag Everything', game_id: 'minesweeper', tier: 'standard', fee: 100 },
  // Community
  { id: 'duel-master', name: 'Duel Master', game_id: null, tier: 'standard', fee: 100 },
  { id: 'onlyfans-qf', name: 'onlyfans.qf', game_id: null, tier: 'manual', fee: 100 },
  // Meta
  { id: 'the-collector', name: 'The Collector', game_id: null, tier: 'meta', fee: 100 },
  { id: 'pioneer-hunter', name: 'Pioneer Hunter', game_id: null, tier: 'meta', fee: 100 },
  { id: 'the-whale', name: 'The Whale', game_id: null, tier: 'meta', fee: 100 },
  // Impossible
  { id: 'boom', name: 'Boom', game_id: null, tier: 'impossible', fee: 50 },
];

function seedAchievements(db) {
  const stmt = db.prepare(`INSERT OR IGNORE INTO achievement_registry (achievement_id, name, game_id, tier, mint_fee_qf)
    VALUES (?, ?, ?, ?, ?)`);
  for (const a of ACHIEVEMENTS) {
    stmt.run(a.id, a.name, a.game_id || null, a.tier, a.fee);
  }
}

// ── Achievement queries ─────────────────────────────────────────────────────

export function getAchievementRegistry() {
  const db = getDb();
  return db.prepare('SELECT * FROM achievement_registry ORDER BY achievement_id').all();
}

export function getAchievement(achievementId) {
  const db = getDb();
  return db.prepare('SELECT * FROM achievement_registry WHERE achievement_id = ?').get(achievementId);
}

export function awardAchievement(wallet, achievementId) {
  const db = getDb();
  const now = Date.now();
  const w = wallet.toLowerCase();

  // Insert eligibility row — UNIQUE constraint handles dupes
  try {
    db.prepare(`INSERT INTO achievement_eligibility (wallet, achievement_id, earned_at) VALUES (?, ?, ?)`)
      .run(w, achievementId, now);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE' || (e.message && e.message.includes('UNIQUE'))) {
      return { awarded: false, reason: 'already_earned' };
    }
    throw e;
  }

  // Check if this wallet is the pioneer (first to earn)
  const reg = db.prepare('SELECT first_claimed_by FROM achievement_registry WHERE achievement_id = ?').get(achievementId);
  if (reg && !reg.first_claimed_by) {
    db.prepare('UPDATE achievement_registry SET first_claimed_by = ?, first_claimed_at = ? WHERE achievement_id = ? AND first_claimed_by IS NULL')
      .run(w, now, achievementId);
    db.prepare('UPDATE achievement_eligibility SET is_pioneer = 1 WHERE wallet = ? AND achievement_id = ?')
      .run(w, achievementId);
    return { awarded: true, pioneer: true };
  }

  return { awarded: true, pioneer: false };
}

export function getWalletAchievements(wallet) {
  const db = getDb();
  return db.prepare('SELECT * FROM achievement_eligibility WHERE wallet = ? ORDER BY earned_at DESC')
    .all(wallet.toLowerCase());
}

export function getAllAchievements() {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, COALESCE(e.earned_count, 0) as earned_count
    FROM achievement_registry r
    LEFT JOIN (SELECT achievement_id, COUNT(*) as earned_count FROM achievement_eligibility GROUP BY achievement_id) e
      ON r.achievement_id = e.achievement_id
    ORDER BY r.achievement_id
  `).all();
}

export function getGlobalRecord(recordId) {
  const db = getDb();
  return db.prepare('SELECT * FROM global_records WHERE record_id = ?').get(recordId);
}

export function setGlobalRecord(recordId, wallet, value) {
  const db = getDb();
  const now = Date.now();
  db.prepare(`INSERT INTO global_records (record_id, wallet, value, achieved_at, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(record_id) DO UPDATE SET wallet = excluded.wallet, value = excluded.value, updated_at = excluded.updated_at`)
    .run(recordId, wallet.toLowerCase(), String(value), now, now);
}

export function getWalletStats(wallet) {
  const db = getDb();
  return db.prepare('SELECT * FROM wallet_stats WHERE wallet = ?').get(wallet.toLowerCase());
}

export function upsertWalletStats(wallet, fields) {
  const db = getDb();
  const w = wallet.toLowerCase();
  const now = Date.now();
  const existing = db.prepare('SELECT * FROM wallet_stats WHERE wallet = ?').get(w);
  if (!existing) {
    const cols = ['wallet', 'updated_at'];
    const vals = [w, now];
    for (const [key, val] of Object.entries(fields)) {
      cols.push(key);
      vals.push(val);
    }
    db.prepare('INSERT INTO wallet_stats (' + cols.join(', ') + ') VALUES (' + cols.map(() => '?').join(', ') + ')').run(...vals);
  } else {
    const sets = [];
    const vals = [];
    for (const [key, val] of Object.entries(fields)) {
      sets.push(key + ' = ?');
      vals.push(val);
    }
    sets.push('updated_at = ?');
    vals.push(now);
    vals.push(w);
    db.prepare('UPDATE wallet_stats SET ' + sets.join(', ') + ' WHERE wallet = ?').run(...vals);
  }
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
export function createDuel(id, gameId, puzzleSeed, difficulty, stake, creatorWallet, shareCode, createdAt, expiresAt) {
  const db = getDb();
  db.prepare(`INSERT INTO duels (id, game_id, puzzle_seed, difficulty, stake, creator_wallet, share_code, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'created', ?, ?)`).run(id, gameId, puzzleSeed, difficulty, stake, creatorWallet, shareCode, createdAt, expiresAt);
}

export function getActiveDuelCount(wallet) {
  const db = getDb();
  const row = db.prepare(`SELECT COUNT(*) as count FROM duels WHERE creator_wallet = ? AND status = 'created'`).get(wallet.toLowerCase());
  return row.count;
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

// ── Promo challenge queries ───────────────────────────────────────────

export function createPromoChallenge(id, code, gameId, puzzleSeed, creatorWallet, creatorScore, prizePerWin, maxClaims, createdAt) {
  const db = getDb();
  db.prepare(`INSERT INTO promo_challenges (id, code, game_id, puzzle_seed, creator_wallet, creator_score, prize_per_win, max_claims, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, code.toUpperCase(), gameId, puzzleSeed, creatorWallet.toLowerCase(), creatorScore, prizePerWin, maxClaims, createdAt);
}

export function getPromoByCode(code) {
  const db = getDb();
  return db.prepare('SELECT * FROM promo_challenges WHERE code = ? AND active = 1').get(code.toUpperCase());
}

export function getPromoById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM promo_challenges WHERE id = ?').get(id);
}

export function getPromoClaim(promoId, wallet) {
  const db = getDb();
  return db.prepare('SELECT * FROM promo_claims WHERE promo_id = ? AND wallet = ?').get(promoId, wallet.toLowerCase());
}

export function addPromoClaim(promoId, wallet, score, won, claimedAt) {
  const db = getDb();
  db.prepare('INSERT INTO promo_claims (promo_id, wallet, score, won, claimed_at) VALUES (?, ?, ?, ?, ?)')
    .run(promoId, wallet.toLowerCase(), score, won ? 1 : 0, claimedAt);
  if (won) {
    db.prepare('UPDATE promo_challenges SET claims_count = claims_count + 1 WHERE id = ?').run(promoId);
  }
}

export function getPromoClaims(promoId) {
  const db = getDb();
  return db.prepare('SELECT * FROM promo_claims WHERE promo_id = ? ORDER BY claimed_at DESC').all(promoId);
}

// ── League queries ────────────────────────────────────────────────────

export function createLeague(id, gameId, tier, entryFee, puzzleCount, regOpensAt, regClosesAt, createdAt) {
  const db = getDb();
  db.prepare(`INSERT INTO leagues (id, game_id, tier, entry_fee, puzzle_count, status, reg_opens_at, reg_closes_at, created_at)
    VALUES (?, ?, ?, ?, ?, 'registration', ?, ?, ?)`).run(id, gameId, tier, entryFee, puzzleCount, regOpensAt, regClosesAt, createdAt);
}

export function getLeagueById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM leagues WHERE id = ?').get(id);
}

export function getActiveLeagues(gameId) {
  const db = getDb();
  return db.prepare(`SELECT * FROM leagues WHERE game_id = ? AND status IN ('registration', 'active') ORDER BY created_at DESC`).all(gameId);
}

export function getAllLeagues(gameId) {
  const db = getDb();
  return db.prepare('SELECT * FROM leagues WHERE game_id = ? ORDER BY created_at DESC LIMIT 20').all(gameId);
}

export function updateLeagueStatus(leagueId, status) {
  const db = getDb();
  db.prepare('UPDATE leagues SET status = ? WHERE id = ?').run(status, leagueId);
}

export function startLeague(leagueId, joinClosesAt, playClosesAt, totalPot, prizePool, burnAmount, teamAmount) {
  const db = getDb();
  db.prepare(`UPDATE leagues SET status = 'active', join_closes_at = ?, play_closes_at = ?, total_pot = ?, prize_pool = ?, burn_amount = ?, team_amount = ? WHERE id = ?`)
    .run(joinClosesAt, playClosesAt, totalPot, prizePool, burnAmount, teamAmount, leagueId);
}

export function settleLeague(leagueId) {
  const db = getDb();
  db.prepare(`UPDATE leagues SET status = 'settled', settled_at = ? WHERE id = ?`).run(Date.now(), leagueId);
}

export function cancelLeague(leagueId) {
  const db = getDb();
  db.prepare(`UPDATE leagues SET status = 'cancelled' WHERE id = ?`).run(leagueId);
}

export function addLeaguePlayer(leagueId, wallet, txHash, joinedAt) {
  const db = getDb();
  db.prepare(`INSERT INTO league_players (league_id, wallet, tx_hash, joined_at) VALUES (?, ?, ?, ?)`)
    .run(leagueId, wallet.toLowerCase(), txHash, joinedAt);
}

export function getPlayerPuzzleOrder(leagueId, wallet) {
  const db = getDb();
  const row = db.prepare('SELECT puzzle_order FROM league_players WHERE league_id = ? AND wallet = ?')
    .get(leagueId, wallet.toLowerCase());
  return row && row.puzzle_order ? JSON.parse(row.puzzle_order) : null;
}

export function setPlayerPuzzleOrder(leagueId, wallet, order) {
  const db = getDb();
  db.prepare('UPDATE league_players SET puzzle_order = ? WHERE league_id = ? AND wallet = ?')
    .run(JSON.stringify(order), leagueId, wallet.toLowerCase());
}

export function getLeaguePlayers(leagueId) {
  const db = getDb();
  return db.prepare('SELECT * FROM league_players WHERE league_id = ? AND refunded = 0 ORDER BY joined_at ASC').all(leagueId);
}

export function getLeaguePlayerCount(leagueId) {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM league_players WHERE league_id = ? AND refunded = 0').get(leagueId);
  return row.count;
}

export function isLeaguePlayer(leagueId, wallet) {
  const db = getDb();
  return db.prepare('SELECT * FROM league_players WHERE league_id = ? AND wallet = ? AND refunded = 0').get(leagueId, wallet.toLowerCase());
}

export function markRefunded(leagueId, wallet) {
  const db = getDb();
  db.prepare('UPDATE league_players SET refunded = 1 WHERE league_id = ? AND wallet = ?').run(leagueId, wallet.toLowerCase());
}

export function addLeaguePuzzle(leagueId, puzzleIndex, puzzleSeed) {
  const db = getDb();
  db.prepare('INSERT INTO league_puzzles (league_id, puzzle_index, puzzle_seed) VALUES (?, ?, ?)').run(leagueId, puzzleIndex, puzzleSeed);
}

export function getLeaguePuzzles(leagueId) {
  const db = getDb();
  return db.prepare('SELECT * FROM league_puzzles WHERE league_id = ? ORDER BY puzzle_index ASC').all(leagueId);
}

export function addLeagueScore(leagueId, wallet, puzzleIndex, score, timeMs, mistakes, hints, submittedAt) {
  const db = getDb();
  db.prepare(`INSERT INTO league_scores (league_id, wallet, puzzle_index, score, time_ms, mistakes, hints, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(leagueId, wallet.toLowerCase(), puzzleIndex, score, timeMs, mistakes, hints, submittedAt);
}

export function getLeagueScore(leagueId, wallet, puzzleIndex) {
  const db = getDb();
  return db.prepare('SELECT * FROM league_scores WHERE league_id = ? AND wallet = ? AND puzzle_index = ?')
    .get(leagueId, wallet.toLowerCase(), puzzleIndex);
}

export function getLeagueScoresByWallet(leagueId, wallet) {
  const db = getDb();
  return db.prepare('SELECT * FROM league_scores WHERE league_id = ? AND wallet = ? ORDER BY puzzle_index ASC')
    .all(leagueId, wallet.toLowerCase());
}

export function getLeagueLeaderboard(leagueId) {
  const db = getDb();
  return db.prepare(`
    SELECT wallet, SUM(score) as total_score, COUNT(*) as puzzles_played,
           SUM(time_ms) as total_time, SUM(mistakes) as total_mistakes, SUM(hints) as total_hints
    FROM league_scores WHERE league_id = ?
    GROUP BY wallet
    ORDER BY total_score DESC, total_time ASC
  `).all(leagueId);
}

export function addLeaguePrize(leagueId, position, wallet, amount) {
  const db = getDb();
  db.prepare('INSERT INTO league_prizes (league_id, position, wallet, amount) VALUES (?, ?, ?, ?)')
    .run(leagueId, position, wallet.toLowerCase(), amount);
}

export function getLeaguePrizes(leagueId) {
  const db = getDb();
  return db.prepare('SELECT * FROM league_prizes WHERE league_id = ? ORDER BY position ASC').all(leagueId);
}

// ── Active game state (persistent sessions) ──────────────────────────

export function createGameState(sessionId, wallet, gameId, contextType, contextId, puzzleIndex, seed, startedAt, freePlay) {
  const db = getDb();
  db.prepare(`INSERT INTO active_game_state (session_id, wallet, game_id, context_type, context_id, puzzle_index, seed, started_at, free_play)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(sessionId, wallet.toLowerCase(), gameId, contextType, contextId, puzzleIndex, seed, startedAt, freePlay ? 1 : 0);
}

export function getGameState(sessionId) {
  const db = getDb();
  return db.prepare('SELECT * FROM active_game_state WHERE session_id = ?').get(sessionId);
}

export function getActiveGameState(wallet, contextType, contextId, puzzleIndex) {
  const db = getDb();
  return db.prepare(`SELECT * FROM active_game_state WHERE wallet = ? AND context_type = ? AND context_id = ? AND puzzle_index = ? AND status = 'active'`)
    .get(wallet.toLowerCase(), contextType, contextId, puzzleIndex);
}

export function updateGameState(sessionId, placements, hints, mistakes, hintsUsed) {
  const db = getDb();
  db.prepare(`UPDATE active_game_state SET placements = ?, hints = ?, mistakes = ?, hints_used = ? WHERE session_id = ?`)
    .run(placements, hints, mistakes, hintsUsed, sessionId);
}

export function completeGameState(sessionId, status, score, flagged) {
  const db = getDb();
  db.prepare(`UPDATE active_game_state SET status = ?, score = ?, flagged = ?, completed_at = ? WHERE session_id = ?`)
    .run(status, score, flagged, Date.now(), sessionId);
}

export function loadActiveGameStates() {
  const db = getDb();
  const cutoff = Date.now() - (3600 * 1000);
  return db.prepare(`SELECT * FROM active_game_state WHERE status = 'active' AND started_at > ?`).all(cutoff);
}

// ── League refund queries ────────────────────────────────────────────

export function addLeagueRefund(leagueId, wallet, amountQf, createdAt) {
  const db = getDb();
  db.prepare('INSERT INTO league_refunds (league_id, wallet, amount_qf, status, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(leagueId, wallet.toLowerCase(), amountQf, 'pending', createdAt);
}

export function getPendingRefunds() {
  const db = getDb();
  return db.prepare("SELECT * FROM league_refunds WHERE status = 'pending'").all();
}

export function getFailedRefunds() {
  const db = getDb();
  return db.prepare("SELECT * FROM league_refunds WHERE status = 'failed'").all();
}

export function getLeagueRefunds(leagueId) {
  const db = getDb();
  return db.prepare('SELECT * FROM league_refunds WHERE league_id = ? ORDER BY created_at ASC').all(leagueId);
}

export function updateRefundStatus(id, status, txHash, failedReason) {
  const db = getDb();
  const now = Date.now();
  if (status === 'sent') {
    db.prepare('UPDATE league_refunds SET status = ?, tx_hash = ?, sent_at = ? WHERE id = ?')
      .run(status, txHash, now, id);
  } else if (status === 'failed') {
    db.prepare('UPDATE league_refunds SET status = ?, failed_reason = ?, attempted_at = ? WHERE id = ?')
      .run(status, failedReason, now, id);
  } else {
    db.prepare('UPDATE league_refunds SET status = ?, attempted_at = ? WHERE id = ?')
      .run(status, now, id);
  }
}

export function cancelLeagueWithReason(leagueId, reason) {
  const db = getDb();
  db.prepare("UPDATE leagues SET status = 'cancelled', cancelled_at = ?, cancel_reason = ? WHERE id = ?")
    .run(Date.now(), reason, leagueId);
}

export function forceSettleLeague(leagueId, settledBy) {
  const db = getDb();
  db.prepare('UPDATE leagues SET force_settled_at = ?, force_settled_by = ? WHERE id = ?')
    .run(Date.now(), settledBy, leagueId);
}

export function getLeaguesByWallet(wallet) {
  const db = getDb();
  return db.prepare(`
    SELECT l.*, lp.joined_at, lp.refunded
    FROM leagues l
    JOIN league_players lp ON l.id = lp.league_id
    WHERE lp.wallet = ? AND lp.refunded = 0
    ORDER BY l.created_at DESC
  `).all(wallet.toLowerCase());
}

export function getOpenAndActiveLeagues(gameId) {
  const db = getDb();
  if (gameId) {
    return db.prepare("SELECT * FROM leagues WHERE game_id = ? AND status IN ('registration', 'active') ORDER BY created_at DESC").all(gameId);
  }
  return db.prepare("SELECT * FROM leagues WHERE status IN ('registration', 'active') ORDER BY created_at DESC").all();
}

// ── Battleships queries ──────────────────────────────────────────────

export function createBattleshipsGame(id, stakeQf, creatorWallet, shareCode, createdAt) {
  const db = getDb();
  db.prepare(`INSERT INTO battleships_games (id, stake_qf, creator_wallet, share_code, created_at)
    VALUES (?, ?, ?, ?, ?)`).run(id, stakeQf, creatorWallet.toLowerCase(), shareCode, createdAt);
}

export function getBattleshipsGameByCode(code) {
  const db = getDb();
  return db.prepare('SELECT * FROM battleships_games WHERE share_code = ?').get(code);
}

export function getBattleshipsGameById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM battleships_games WHERE id = ?').get(id);
}

export function updateBattleshipsGameStatus(id, status, fields) {
  const db = getDb();
  const sets = ['status = ?'];
  const vals = [status];
  if (fields) {
    for (const [key, val] of Object.entries(fields)) {
      sets.push(key + ' = ?');
      vals.push(val);
    }
  }
  vals.push(id);
  db.prepare('UPDATE battleships_games SET ' + sets.join(', ') + ' WHERE id = ?').run(...vals);
}

export function saveBattleshipsPlacement(gameId, wallet, fleetJson, confirmedAt) {
  const db = getDb();
  db.prepare(`INSERT INTO battleships_placements (game_id, wallet, fleet, confirmed_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(game_id, wallet) DO UPDATE SET fleet = excluded.fleet, confirmed_at = excluded.confirmed_at`)
    .run(gameId, wallet.toLowerCase(), fleetJson, confirmedAt);
}

export function getBattleshipsPlacement(gameId, wallet) {
  const db = getDb();
  return db.prepare('SELECT * FROM battleships_placements WHERE game_id = ? AND wallet = ?')
    .get(gameId, wallet.toLowerCase());
}

export function getBattleshipsPlacements(gameId) {
  const db = getDb();
  return db.prepare('SELECT * FROM battleships_placements WHERE game_id = ?').all(gameId);
}

export function addBattleshipsRound(gameId, roundNum, wallet, firingShip, targetX, targetY, range, result, shipHit, autoShot, createdAt) {
  const db = getDb();
  db.prepare(`INSERT INTO battleships_rounds (game_id, round_number, wallet, firing_ship, target_x, target_y, range_distance, result, ship_hit, auto_shot, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(gameId, roundNum, wallet.toLowerCase(), firingShip, targetX, targetY, range, result, shipHit, autoShot ? 1 : 0, createdAt);
}

export function getBattleshipsRounds(gameId) {
  const db = getDb();
  return db.prepare('SELECT * FROM battleships_rounds WHERE game_id = ? ORDER BY round_number ASC, id ASC').all(gameId);
}

export function getBattleshipsRecord(wallet) {
  const db = getDb();
  return db.prepare('SELECT * FROM battleships_record WHERE wallet = ?').get(wallet.toLowerCase());
}

export function updateBattleshipsRecord(wallet, result) {
  const db = getDb();
  const w = wallet.toLowerCase();
  const now = Date.now();
  const existing = db.prepare('SELECT * FROM battleships_record WHERE wallet = ?').get(w);
  if (!existing) {
    const wins = result === 'win' ? 1 : 0;
    const losses = result === 'loss' ? 1 : 0;
    const draws = result === 'draw' ? 1 : 0;
    db.prepare('INSERT INTO battleships_record (wallet, wins, losses, draws, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(w, wins, losses, draws, now);
  } else {
    const col = result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws';
    db.prepare('UPDATE battleships_record SET ' + col + ' = ' + col + ' + 1, updated_at = ? WHERE wallet = ?')
      .run(now, w);
  }
}

export function getActiveBattleshipsGames() {
  const db = getDb();
  return db.prepare("SELECT * FROM battleships_games WHERE status = 'active'").all();
}

export function getBattleshipsGamesByWallet(wallet, limit) {
  const db = getDb();
  return db.prepare(`SELECT * FROM battleships_games WHERE (creator_wallet = ? OR opponent_wallet = ?) AND status = 'completed' ORDER BY completed_at DESC LIMIT ?`)
    .all(wallet.toLowerCase(), wallet.toLowerCase(), limit || 20);
}

export function getRecentlySettledLeagues(gameId, limit) {
  const db = getDb();
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  if (gameId) {
    return db.prepare("SELECT * FROM leagues WHERE game_id = ? AND status = 'settled' AND settled_at > ? ORDER BY settled_at DESC LIMIT ?")
      .all(gameId, cutoff, limit || 20);
  }
  return db.prepare("SELECT * FROM leagues WHERE status = 'settled' AND settled_at > ? ORDER BY settled_at DESC LIMIT ?")
    .all(cutoff, limit || 20);
}
