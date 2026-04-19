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
  try { db.exec('ALTER TABLE active_game_state ADD COLUMN difficulty TEXT'); } catch (e) { /* already exists */ }

  // v4 achievement schema migrations
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN paid_mint_count INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN free_mints_banked INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN total_qf_spent INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN founding_member INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN consecutive_golf_wins INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN consecutive_pyramid_failures INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE sessions ADD COLUMN last_activity_at INTEGER'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE league_scores ADD COLUMN mistake_count INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE league_scores ADD COLUMN hints_used INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE league_scores ADD COLUMN undos_used INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE league_scores ADD COLUMN free_cells_used INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE league_scores ADD COLUMN flags_used INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE league_scores ADD COLUMN helper_used INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE league_scores ADD COLUMN suspicious TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE league_scores ADD COLUMN suspicious_detail TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE achievement_registry ADD COLUMN category TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE achievement_registry ADD COLUMN retired INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE achievement_registry ADD COLUMN retired_at INTEGER'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE achievement_registry ADD COLUMN description TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE personal_bests ADD COLUMN session_id TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE achievement_eligibility ADD COLUMN metadata_cid TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE achievement_eligibility ADD COLUMN token_id TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE achievement_eligibility ADD COLUMN payment_tx TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN consecutive_bs_wins_with_battleship INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN pyramid_completions INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN poker_patience_last_place INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN consecutive_league_wins INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN sub_hunter_count INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN carrier_supremacy_count INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec("ALTER TABLE wallet_stats ADD COLUMN shadow_from_count INTEGER DEFAULT 0"); } catch (e) { /* already exists */ }
  try { db.exec("ALTER TABLE wallet_stats ADD COLUMN duel_wins_by_game TEXT DEFAULT '{}'"); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN expert_detonation_streak INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN duel_master_count INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN optimist_count INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN prime_wrong_streak INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN fibonacci_streak INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN maffsy_current_streak INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN maffsy_clean_streak INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE wallet_stats ADD COLUMN maffsy_max_streak INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE duels ADD COLUMN creator_tx TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE duels ADD COLUMN acceptor_tx TEXT'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE duels ADD COLUMN broadcast_at INTEGER'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE duels ADD COLUMN broadcast_message_id INTEGER'); } catch (e) { /* already exists */ }
  try { db.exec('ALTER TABLE escrow_ledger ADD COLUMN inferred INTEGER DEFAULT 0'); } catch (e) { /* already exists */ }

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

  // ── Global leaderboard ──────────────────────────────────────────────
  db.exec(`CREATE TABLE IF NOT EXISTS global_leaderboard_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet TEXT NOT NULL,
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    time_ms INTEGER,
    period_type TEXT NOT NULL,
    period_key TEXT NOT NULL,
    session_id TEXT NOT NULL,
    paid_at INTEGER NOT NULL,
    tx_hash TEXT,
    suspicious INTEGER DEFAULT 0,
    qns_name TEXT,
    UNIQUE(wallet, game_id, period_type, period_key)
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_glb_game_period ON global_leaderboard_entries(game_id, period_type, period_key)');

  // ── Cribbage hand scores (per-hand tracking for achievements) ──────
  db.exec(`CREATE TABLE IF NOT EXISTS cribbage_hand_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    wallet TEXT NOT NULL,
    hand_index INTEGER NOT NULL,
    score INTEGER NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

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

  // Personal bests (free play completions)
  db.exec(`CREATE TABLE IF NOT EXISTS personal_bests (
    wallet TEXT NOT NULL,
    game_id TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'default',
    score INTEGER NOT NULL,
    time_ms INTEGER,
    achieved_at INTEGER NOT NULL,
    PRIMARY KEY (wallet, game_id, difficulty)
  )`);

  // League bests (materialised at settlement)
  db.exec(`CREATE TABLE IF NOT EXISTS league_bests (
    wallet TEXT NOT NULL,
    game_id TEXT NOT NULL,
    tier TEXT NOT NULL,
    best_total_score INTEGER NOT NULL,
    league_id TEXT NOT NULL,
    achieved_at INTEGER NOT NULL,
    PRIMARY KEY (wallet, game_id, tier)
  )`);

  // Free game completion tracking
  db.exec(`CREATE TABLE IF NOT EXISTS free_game_completions (
    wallet TEXT NOT NULL,
    game_id TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    pb_beaten_count INTEGER DEFAULT 0,
    last_played INTEGER,
    PRIMARY KEY (wallet, game_id)
  )`);

  // Preset messages (duels + leagues)
  db.exec(`CREATE TABLE IF NOT EXISTS game_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_wallet TEXT NOT NULL,
    recipient_wallet TEXT NOT NULL,
    context_type TEXT NOT NULL,
    context_id TEXT NOT NULL,
    message_key TEXT NOT NULL,
    sent_at INTEGER NOT NULL
  )`);

  // Seasonal achievement earning windows
  db.exec(`CREATE TABLE IF NOT EXISTS seasonal_windows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    achievement_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    window_start INTEGER NOT NULL,
    window_end INTEGER NOT NULL,
    UNIQUE(achievement_id, year)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS maffsy_streaks (
    wallet TEXT NOT NULL,
    play_date TEXT NOT NULL,
    won INTEGER DEFAULT 0,
    guesses INTEGER,
    word_id TEXT,
    UNIQUE(wallet, play_date)
  )`);

  seedAchievements(db);
  seedSeasonalWindows(db);

  return db;
}

// ── Achievement seed data ───────────────────────────────────────────────────

const ACHIEVEMENTS = [
  // ── Category 1 — Purity (200 QF, Immaculate 500 QF) ──
  { id: 'pure-logic', name: 'Pure Logic', game_id: 'sudoku-duel', category: 'purity', fee: 200 },
  { id: 'never-triggered', name: 'Never Triggered', game_id: 'minesweeper', category: 'purity', fee: 200 },
  { id: 'clean-sheet', name: 'Clean Sheet', game_id: 'freecell', category: 'purity', fee: 200 },
  { id: 'first-light', name: 'First Light', game_id: 'kenken', category: 'purity', fee: 200 },
  { id: 'pixel-perfect', name: 'Pixel Perfect', game_id: 'nonogram', category: 'purity', fee: 200 },
  { id: 'the-chain', name: 'The Chain', game_id: 'kakuro', category: 'purity', fee: 200 },
  { id: 'no-tells', name: 'No Tells', game_id: 'poker-patience', category: 'purity', fee: 200 },
  { id: 'clean-crib', name: 'Clean Crib', game_id: 'cribbage-solitaire', category: 'purity', fee: 200 },
  { id: 'the-purist', name: 'The Purist', game_id: 'freecell', category: 'purity', fee: 200 },
  { id: 'flawless-line', name: 'Flawless Line', game_id: 'minesweeper', category: 'purity', fee: 200 },
  { id: 'the-logician', name: 'The Logician', game_id: 'kenken', category: 'purity', fee: 200 },
  { id: 'hintless', name: 'Hintless', game_id: 'nonogram', category: 'purity', fee: 200 },
  { id: 'blind-kakuro', name: 'Blind Kakuro', game_id: 'kakuro', category: 'purity', fee: 200 },
  { id: 'immaculate', name: 'Immaculate', game_id: null, category: 'purity', fee: 500 },
  // ── Category 2 — Volume (200 QF) ──
  { id: 'first-steps', name: 'First Steps', game_id: null, category: 'volume', fee: 200 },
  { id: 'committed', name: 'Committed', game_id: null, category: 'volume', fee: 200 },
  { id: 'dedicated', name: 'Dedicated', game_id: null, category: 'volume', fee: 200 },
  { id: 'veteran', name: 'Veteran', game_id: null, category: 'volume', fee: 200 },
  { id: 'legend', name: 'Legend', game_id: null, category: 'volume', fee: 200 },
  // ── Category 3 — Winning (200 QF) ──
  { id: 'winner', name: 'Winner', game_id: null, category: 'winning', fee: 200 },
  { id: 'on-a-roll', name: 'On a Roll', game_id: null, category: 'winning', fee: 200 },
  { id: 'dominant', name: 'Dominant', game_id: null, category: 'winning', fee: 200 },
  { id: 'hat-trick', name: 'Hat Trick', game_id: null, category: 'winning', fee: 200 },
  { id: 'the-completionist', name: 'The Completionist', game_id: null, category: 'winning', fee: 200 },
  { id: 'the-tortoise', name: 'The Tortoise', game_id: null, category: 'winning', fee: 200 },
  { id: 'clean-slate', name: 'Clean Slate', game_id: null, category: 'winning', fee: 200 },
  { id: 'the-lurker', name: 'The Lurker', game_id: null, category: 'winning', fee: 200 },
  // ── Category 4 — Shadows (200 QF, Shadow Legend 500 QF) ──
  { id: 'into-the-shadows', name: 'Into the Shadows', game_id: null, category: 'shadows', fee: 200 },
  { id: 'from-the-shadows', name: 'From the Shadows', game_id: null, category: 'shadows', fee: 200 },
  { id: 'shadow-legend', name: 'Shadow Legend', game_id: null, category: 'shadows', fee: 500 },
  // ── Category 5 — Duels (200 QF) ──
  { id: 'first-blood', name: 'First Blood', game_id: null, category: 'duels', fee: 200 },
  { id: 'duelist', name: 'Duelist', game_id: null, category: 'duels', fee: 200 },
  { id: 'gladiator', name: 'Gladiator', game_id: null, category: 'duels', fee: 200 },
  { id: 'heartbreaker', name: 'Heartbreaker', game_id: null, category: 'duels', fee: 200 },
  { id: 'giant-slayer', name: 'Giant Slayer', game_id: null, category: 'duels', fee: 200 },
  { id: 'the-wall', name: 'The Wall', game_id: null, category: 'duels', fee: 200 },
  { id: 'the-contrarian', name: 'The Contrarian', game_id: null, category: 'duels', fee: 200 },
  // ── Category 6 — Battleships (200 QF, Wolf Pack 500 QF) ──
  { id: 'first-strike', name: 'First Strike', game_id: 'battleships', category: 'battleships', fee: 200 },
  { id: 'last-stand', name: 'Last Stand', game_id: 'battleships', category: 'battleships', fee: 200 },
  { id: 'the-wolf', name: 'The Wolf', game_id: 'battleships', category: 'battleships', fee: 200 },
  { id: 'unsinkable', name: 'Unsinkable', game_id: 'battleships', category: 'battleships', fee: 200 },
  { id: 'the-admiral', name: 'The Admiral', game_id: 'battleships', category: 'battleships', fee: 200 },
  { id: 'perfect-sonar', name: 'Perfect Sonar', game_id: 'battleships', category: 'battleships', fee: 200 },
  { id: 'sub-hunter', name: 'Sub Hunter', game_id: 'battleships', category: 'battleships', fee: 200 },
  { id: 'carrier-supremacy', name: 'Carrier Supremacy', game_id: 'battleships', category: 'battleships', fee: 200 },
  { id: 'scatter-gun', name: 'Scatter-gun', game_id: 'battleships', category: 'battleships', fee: 200 },
  { id: 'do-you-even-aim-bro', name: 'Do You Even Aim Bro?', game_id: 'battleships', category: 'battleships', fee: 200 },
  { id: 'the-wolf-pack', name: 'The Wolf Pack', game_id: 'battleships', category: 'battleships', fee: 500 },
  // ── Category 7 — FreeCell (200 QF, Lucky Number 100 QF) ──
  { id: 'the-undo-king', name: 'The Undo King', game_id: 'freecell', category: 'freecell', fee: 200 },
  { id: 'no-cell-used', name: 'No Cell Used', game_id: 'freecell', category: 'freecell', fee: 200 },
  { id: 'lucky-number', name: 'Lucky Number', game_id: 'freecell', category: 'freecell', fee: 100 },
  // ── Category 8 — Minesweeper (200 QF, Flag Everything 100 QF) ──
  { id: 'clean-sweep', name: 'Clean Sweep', game_id: 'minesweeper', category: 'minesweeper', fee: 200 },
  { id: 'flag-everything', name: 'Flag Everything', game_id: 'minesweeper', category: 'minesweeper', fee: 100 },
  { id: 'the-comeback', name: 'The Comeback', game_id: 'minesweeper', category: 'minesweeper', fee: 200 },
  // ── Category 9 — Poker Patience (200 QF, The Brick 100 QF) ──
  { id: 'royal-flush', name: 'Royal Flush', game_id: 'poker-patience', category: 'poker-patience', fee: 200 },
  { id: 'all-pairs', name: 'All Pairs', game_id: 'poker-patience', category: 'poker-patience', fee: 200 },
  { id: 'the-nuts', name: 'The Nuts', game_id: 'poker-patience', category: 'poker-patience', fee: 200 },
  { id: 'dead-mans-hand', name: "Dead Man\u2019s Hand", game_id: 'poker-patience', category: 'poker-patience', fee: 200 },
  { id: 'pocket-rockets', name: 'Pocket Rockets', game_id: 'poker-patience', category: 'poker-patience', fee: 200 },
  { id: 'the-brick', name: 'The Brick', game_id: 'poker-patience', category: 'poker-patience', fee: 100 },
  // ── Category 10 — Cribbage (200 QF) ──
  { id: 'twenty-nine', name: 'Twenty-Nine', game_id: 'cribbage-solitaire', category: 'cribbage', fee: 200 },
  { id: 'crib-master', name: 'Crib Master', game_id: 'cribbage-solitaire', category: 'cribbage', fee: 200 },
  // ── Category 11 — Golf Solitaire (200 QF) ──
  { id: 'hole-in-one', name: 'Hole in One', game_id: 'golf-solitaire', category: 'golf', fee: 200 },
  { id: 'albatross', name: 'Albatross', game_id: 'golf-solitaire', category: 'golf', fee: 200 },
  { id: 'back-nine', name: 'Back Nine', game_id: 'golf-solitaire', category: 'golf', fee: 200 },
  { id: 'under-par', name: 'Under Par', game_id: 'golf-solitaire', category: 'golf', fee: 200 },
  // ── Category 12 — Pyramid (200 QF, Tutankhamun 100 QF) ──
  { id: 'perfect-pyramid', name: 'Perfect Pyramid', game_id: 'pyramid', category: 'pyramid', fee: 200 },
  { id: 'the-archaeologist', name: 'The Archaeologist', game_id: 'pyramid', category: 'pyramid', fee: 200 },
  { id: 'tutankhamun', name: 'Tutankhamun', game_id: 'pyramid', category: 'pyramid', fee: 100 },
  { id: 'kings-ransom', name: "King\u2019s Ransom", game_id: 'pyramid', category: 'pyramid', fee: 200 },
  // ── Category 13 — KenKen (200 QF) ──
  { id: 'perfect-logic', name: 'Perfect Logic', game_id: 'kenken', category: 'kenken', fee: 200 },
  // ── Category 14 — Nonogram (200 QF) ──
  { id: 'the-artist', name: 'The Artist', game_id: 'nonogram', category: 'nonogram', fee: 200 },
  { id: 'blind-eye', name: 'Blind Eye', game_id: 'nonogram', category: 'nonogram', fee: 200 },
  // ── Category 15 — Sudoku (200 QF) ──
  { id: 'six-seven', name: '6-7', game_id: 'sudoku-duel', category: 'sudoku', fee: 200 },
  // ── Category 16 — Comeback (200 QF) ──
  { id: 'from-the-ashes', name: 'From the Ashes', game_id: null, category: 'comeback', fee: 200 },
  { id: 'zero-to-hero', name: 'Zero to Hero', game_id: null, category: 'comeback', fee: 200 },
  // ── Category 17 — Per Game Volume (200 QF) ──
  { id: 'specialist', name: 'Specialist', game_id: null, category: 'per-game-volume', fee: 200 },
  { id: 'master-of-one', name: 'Master of One', game_id: null, category: 'per-game-volume', fee: 200 },
  { id: 'world-tour', name: 'World Tour', game_id: null, category: 'per-game-volume', fee: 200 },
  { id: 'high-roller', name: 'High Roller', game_id: null, category: 'per-game-volume', fee: 200 },
  // ── Category 18 — Free Games (100 QF) ──
  { id: 'century', name: 'Century', game_id: null, category: 'free-games', fee: 100 },
  { id: 'personal-best', name: 'Personal Best', game_id: null, category: 'free-games', fee: 100 },
  { id: 'explorer', name: 'Explorer', game_id: null, category: 'free-games', fee: 100 },
  { id: 'unbeatable', name: 'Unbeatable', game_id: 'rps-vs-machine', category: 'free-games', fee: 100 },
  { id: 'the-engineer', name: 'The Engineer', game_id: 'towers-of-hanoi', category: 'free-games', fee: 100 },
  { id: 'speed-reader', name: 'Speed Reader', game_id: '52dle', category: 'free-games', fee: 100 },
  { id: 'photographic', name: 'Photographic', game_id: 'memory-matrix', category: 'free-games', fee: 100 },
  { id: 'dead-reckoning', name: 'Dead Reckoning', game_id: 'estimation-engine', category: 'free-games', fee: 100 },
  { id: 'clairvoyant', name: 'Clairvoyant', game_id: 'higher-or-lower', category: 'free-games', fee: 100 },
  { id: 'on-the-nose', name: 'On the Nose', game_id: 'countdown-numbers', category: 'free-games', fee: 100 },
  { id: 'next-in-line', name: 'Next In Line', game_id: 'sequence-solver', category: 'free-games', fee: 100 },
  { id: 'wordy', name: 'Wordy', game_id: 'maffsy', category: 'free-games', fee: 100 },
  { id: 'binary-decision', name: 'Binary Decision', game_id: 'maffsy', category: 'free-games', fee: 100 },
  { id: 'feel-no-pressure', name: 'Feel No Pressure', game_id: 'maffsy', category: 'free-games', fee: 100 },
  // ── Category 19 — Streaks (200 QF) ──
  { id: 'weekend-warrior', name: 'Weekend Warrior', game_id: null, category: 'streaks', fee: 200 },
  { id: 'the-marathon', name: 'The Marathon', game_id: null, category: 'streaks', fee: 200 },
  { id: 'league-regular', name: 'League Regular', game_id: null, category: 'streaks', fee: 200 },
  // ── Category 20 — Kakuro (200 QF) ──
  { id: 'the-crossword-king', name: 'The Crossword King', game_id: 'kakuro', category: 'kakuro', fee: 200 },
  { id: 'sum-of-all-fears', name: 'Sum of All Fears', game_id: 'kakuro', category: 'kakuro', fee: 200 },
  // ── Category 21 — Time (100 QF) ──
  { id: 'night-owl', name: 'Night Owl', game_id: null, category: 'time', fee: 100 },
  { id: 'the-insomniac', name: 'The Insomniac', game_id: null, category: 'time', fee: 100 },
  // ── Category 22 — Seasonal (100 QF) ──
  { id: 'easter', name: 'Easter', game_id: null, category: 'seasonal', fee: 100 },
  { id: 'christmas', name: 'Christmas', game_id: null, category: 'seasonal', fee: 100 },
  { id: 'new-year', name: 'New Year', game_id: null, category: 'seasonal', fee: 100 },
  { id: 'halloween', name: 'Halloween', game_id: null, category: 'seasonal', fee: 100 },
  { id: 'bonfire-night', name: 'Bonfire Night', game_id: null, category: 'seasonal', fee: 100 },
  { id: 'pancake-day', name: 'Pancake Day', game_id: null, category: 'seasonal', fee: 100 },
  { id: 'pi-day', name: 'Pi Day', game_id: null, category: 'seasonal', fee: 100 },
  { id: 've-day', name: 'VE Day', game_id: 'battleships', category: 'seasonal', fee: 100 },
  { id: 'summer-week', name: 'Summer Week', game_id: null, category: 'seasonal', fee: 100 },
  { id: 'platform-anniversary', name: 'Platform Anniversary', game_id: null, category: 'seasonal', fee: 100 },
  // ── Category 23 — Monthly (200 QF) ──
  { id: 'active-player', name: 'Active Player', game_id: null, category: 'monthly', fee: 200 },
  { id: 'grinder', name: 'Grinder', game_id: null, category: 'monthly', fee: 200 },
  { id: 'league-month', name: 'League Month', game_id: null, category: 'monthly', fee: 200 },
  { id: 'double-winner', name: 'Double Winner', game_id: null, category: 'monthly', fee: 200 },
  // ── Category 24 — Constants (500 QF) ──
  { id: 'pi', name: 'Pi', game_id: null, category: 'constants', fee: 500 },
  { id: 'euler', name: 'Euler', game_id: null, category: 'constants', fee: 500 },
  { id: 'golden-ratio', name: 'Golden Ratio', game_id: null, category: 'constants', fee: 500 },
  { id: 'root-two', name: 'Root Two', game_id: null, category: 'constants', fee: 500 },
  { id: 'root-three', name: 'Root Three', game_id: null, category: 'constants', fee: 500 },
  { id: 'the-mathematicians-collection', name: "The Mathematician\u2019s Collection", game_id: null, category: 'constants', fee: 500 },
  // ── Category 25 — Squared Pi (500 QF) ──
  { id: 'squared-pi', name: 'Squared Pi', game_id: null, category: 'squared-pi', fee: 500 },
  // ── Category 26 — Loyalty (FREE) ──
  { id: 'skin-in-the-game', name: 'Skin in the Game', game_id: null, category: 'loyalty', fee: 0 },
  { id: 'true-believer', name: 'True Believer', game_id: null, category: 'loyalty', fee: 0 },
  { id: 'fifty-two-thousand', name: '52,000', game_id: null, category: 'loyalty', fee: 0 },
  // ── Category 27 — Milestones (FREE) ──
  { id: 'collector', name: 'Collector', game_id: null, category: 'milestones', fee: 0 },
  { id: 'devoted', name: 'Devoted', game_id: null, category: 'milestones', fee: 0 },
  { id: 'obsessed', name: 'Obsessed', game_id: null, category: 'milestones', fee: 0 },
  { id: 'the-complete-player', name: 'The Complete Player', game_id: null, category: 'milestones', fee: 0 },
  { id: 'the-grandmaster', name: 'The Grandmaster', game_id: null, category: 'milestones', fee: 0 },
  // ── Category 28 — Meta (200 QF) ──
  { id: 'pioneer-hunter', name: 'Pioneer Hunter', game_id: null, category: 'meta', fee: 200 },
  { id: 'the-whale', name: 'The Whale', game_id: null, category: 'meta', fee: 200 },
  { id: 'duel-master', name: 'Duel Master', game_id: null, category: 'meta', fee: 200 },
  { id: 'breadwinner', name: 'Breadwinner', game_id: null, category: 'meta', fee: 200 },
  { id: 'the-grinder', name: 'The Grinder', game_id: null, category: 'meta', fee: 200 },
  // ── Category 29 — Absurd (mixed) ──
  { id: 'palindrome', name: 'Palindrome', game_id: null, category: 'absurd', fee: 200 },
  { id: 'wrong-answer-streak', name: 'Wrong Answer Streak', game_id: 'prime-or-composite', category: 'absurd', fee: 100 },
  { id: 'midnight', name: 'Midnight', game_id: null, category: 'absurd', fee: 100 },
  { id: 'fibonacci', name: 'Fibonacci', game_id: null, category: 'absurd', fee: 200 },
  { id: 'onlyfans-qf', name: 'onlyfans.qf', game_id: null, category: 'absurd', fee: 200 },
  // ── Category 30 — Founding (FREE) ──
  { id: 'founding-member', name: 'Founding Member', game_id: null, category: 'founding', fee: 0 },
  // ── Category 31 — Wooden Spoons (100 QF) ──
  { id: 'tax-payers-nightmare', name: "Tax Payer\u2019s Nightmare", game_id: 'battleships', category: 'wooden-spoons', fee: 100 },
  { id: 'the-optimist', name: 'The Optimist', game_id: null, category: 'wooden-spoons', fee: 100 },
  { id: 'slow-burn', name: 'Slow Burn', game_id: 'minesweeper', category: 'wooden-spoons', fee: 100 },
  { id: 'crib-death', name: 'Crib Death', game_id: 'cribbage-solitaire', category: 'wooden-spoons', fee: 100 },
  { id: 'bust', name: 'Bust', game_id: 'poker-patience', category: 'wooden-spoons', fee: 100 },
  { id: 'the-fish', name: 'The Fish', game_id: 'poker-patience', category: 'wooden-spoons', fee: 100 },
  { id: 'score-one', name: 'Score One', game_id: null, category: 'wooden-spoons', fee: 100 },
  { id: 'the-pacifist', name: 'The Pacifist', game_id: 'kakuro', category: 'wooden-spoons', fee: 100 },
  { id: 'all-wrong', name: 'All Wrong', game_id: 'kakuro', category: 'wooden-spoons', fee: 100 },
  { id: 'full-hints', name: 'Full Hints', game_id: 'kenken', category: 'wooden-spoons', fee: 100 },
  { id: 'dnf-king', name: 'DNF King', game_id: null, category: 'wooden-spoons', fee: 100 },
  { id: 'flagless-and-wrong', name: 'Flagless and Wrong', game_id: 'minesweeper', category: 'wooden-spoons', fee: 100 },
  { id: 'last-and-slow', name: 'Last and Slow', game_id: null, category: 'wooden-spoons', fee: 100 },
  { id: 'memory-loss', name: 'Memory Loss', game_id: 'sudoku-duel', category: 'wooden-spoons', fee: 100 },
  { id: 'bogey', name: 'Bogey', game_id: 'golf-solitaire', category: 'wooden-spoons', fee: 100 },
  { id: 'curse-of-the-mummy', name: 'Curse of the Mummy', game_id: 'pyramid', category: 'wooden-spoons', fee: 100 },
  { id: 'pharaohs-curse', name: "Pharaoh\u2019s Curse", game_id: 'pyramid', category: 'wooden-spoons', fee: 100 },
  { id: 'mucky-hands', name: 'Mucky Hands', game_id: 'poker-patience', category: 'wooden-spoons', fee: 100 },
  { id: 'the-novelist', name: 'The Novelist', game_id: 'maffsy', category: 'wooden-spoons', fee: 100 },
  // ── Category 32 — Impossible (FREE) ──
  { id: 'boom', name: 'Boom', game_id: null, category: 'impossible', fee: 0 },
  // ── Category 33 — Rivals (Vector achievements) ──
  { id: 'regicide', name: 'Regicide', game_id: null, category: 'meta', fee: 500 },
  { id: 'detention', name: 'Detention', game_id: null, category: 'wooden-spoons', fee: 100 },
];

// Earned-card descriptions. Surfaced via GET /achievements/my only; /achievements/all
// stays opaque to preserve the "some impossible, most secret" framing.
// Tone: one sentence, past tense, says what you did. Exact thresholds left vague
// where farmable; specifics kept where they describe a skill moment.
const ACHIEVEMENT_DESCRIPTIONS = {
  // Purity
  'pure-logic': 'Cleared an entire sudoku-duel league without a single mistake.',
  'never-triggered': 'Played an entire minesweeper league without setting off a mine.',
  'clean-sheet': 'Played an entire freecell league without a wrong move on any deal.',
  'first-light': 'Cleared a kenken league with no mistakes anywhere.',
  'pixel-perfect': 'Painted an entire nonogram league without a single misplaced cell.',
  'the-chain': 'Carried a kakuro league through to the end without a wrong sum.',
  'no-tells': 'Won a poker-patience league without a single hint or mistake.',
  'clean-crib': 'Played an entire cribbage-solitaire league without a single mistake.',
  'the-purist': 'Won a freecell league without ever using the free cells.',
  'flawless-line': 'Played a minesweeper league without ever planting a flag.',
  'the-logician': 'Solved a kenken league without touching the helper once.',
  'hintless': 'Cleared a nonogram league without asking for a single hint.',
  'blind-kakuro': 'Cleared a kakuro league with no hints and no helpers.',
  'immaculate': 'Held the line on every purity achievement across the league games.',
  // Volume
  'first-steps': 'Completed your first league.',
  'committed': 'Made the leagues a habit, not a one-off.',
  'dedicated': 'Reached a serious depth of league play.',
  'veteran': 'Stayed in the leagues long past the point most players drop off.',
  'legend': 'Reached the kind of league count almost nobody gets to.',
  // Winning
  'winner': 'Won your first league.',
  'on-a-roll': 'Strung together a meaningful run of league wins.',
  'dominant': 'Built a league win count most players never approach.',
  'hat-trick': 'Won three leagues in a row.',
  'the-completionist': 'Won a league on each of the four active league games.',
  'the-tortoise': 'Held the slowest winning total time of any league champion.',
  'clean-slate': 'Won a league without ever being last during the run.',
  'the-lurker': 'Won a league without ever appearing in the top three until the final round.',
  // Shadows
  'into-the-shadows': 'Submitted every puzzle in a league before the leaderboard went public.',
  'from-the-shadows': 'Did the same — and won the league from cover.',
  'shadow-legend': 'Made the win-from-the-shadows move a habit, not an accident.',
  // Duels
  'first-blood': 'Won your first duel.',
  'duelist': 'Banked a serious volume of duel wins.',
  'gladiator': 'Reached the kind of duel win count most players never see.',
  'heartbreaker': 'Won a duel by exactly one point.',
  'giant-slayer': 'Beat someone who had recently won a league.',
  'the-wall': 'Strung together a long run of consecutive duel wins.',
  'the-contrarian': 'Won at least one duel on every duel-capable game.',
  // Battleships
  'first-strike': 'Opened a battleships game with a hit.',
  'last-stand': 'Won a battleships game with only one ship still afloat.',
  'the-wolf': 'Won a battleships game with only the submarine still afloat.',
  'unsinkable': 'Won a long run of battleships games while keeping the battleship alive every time.',
  'the-admiral': 'Reached an enormous battleships win count.',
  'perfect-sonar': 'Won a battleships game without missing a single shot.',
  'sub-hunter': "Sunk the opponent's submarine many times across many games.",
  'carrier-supremacy': 'Kept the carrier alive across an enormous number of battleships wins.',
  'scatter-gun': 'Took a heavy volley of shots in a battleships game without landing one.',
  'do-you-even-aim-bro': 'Took an even heavier volley of shots without landing one.',
  'the-wolf-pack': 'Held the line on every standard battleships achievement.',
  // FreeCell
  'the-undo-king': 'Won a freecell deal after leaning hard on the undo button.',
  'no-cell-used': 'Won an entire freecell league without ever parking a card.',
  'lucky-number': 'Won the lucky deal.',
  // Minesweeper
  'clean-sweep': 'Won a minesweeper game on Expert difficulty.',
  'flag-everything': 'Took the policy "flag everything" to its logical conclusion.',
  'the-comeback': 'Won an Expert minesweeper game right after a brutal losing streak.',
  // Poker Patience
  'royal-flush': 'Built a Royal Flush in a poker-patience game.',
  'all-pairs': 'Built at least a pair on every line of a poker-patience game.',
  'the-nuts': 'Posted a poker-patience score that puts most players to shame.',
  'dead-mans-hand': "Built two pair containing aces and eights — the dead man's hand.",
  'pocket-rockets': 'Built a line containing a pair of aces.',
  'the-brick': 'Drew the worst possible opening hand — and committed to playing it.',
  // Cribbage
  'twenty-nine': 'Posted the perfect cribbage hand — twenty-nine.',
  'crib-master': 'Posted a cribbage-solitaire game score most players never reach.',
  // Golf
  'hole-in-one': 'Cleared every card in a golf-solitaire game.',
  'albatross': 'Finished a golf-solitaire game with almost the whole pile cleared.',
  'back-nine': 'Strung together a long run of golf-solitaire wins.',
  'under-par': 'Finished a golf-solitaire game with the table almost empty.',
  // Pyramid
  'perfect-pyramid': 'Cleared every card in a pyramid game.',
  'the-archaeologist': 'Cleared the pyramid down to a handful of cards.',
  'tutankhamun': 'Played enough pyramid games to know the pharaoh personally.',
  'kings-ransom': 'Got within a card or two of clearing the pyramid.',
  // KenKen
  'perfect-logic': 'Cleared a kenken league with no mistakes and no hints.',
  // Nonogram
  'the-artist': 'Won a nonogram league with no mistakes and no hints.',
  'blind-eye': 'Solved a nonogram puzzle without asking for a single hint.',
  // Sudoku
  'six-seven': 'Placed a correct 6 immediately followed by a correct 7.',
  // Comeback
  'from-the-ashes': 'Won a league after sitting last after the first round.',
  'zero-to-hero': 'Won a duel from a starting score of zero.',
  // Per-game volume
  'specialist': 'Settled a serious number of leagues on a single game.',
  'master-of-one': 'Won several leagues on a single game.',
  'world-tour': 'Played a settled league on every league-capable game.',
  'high-roller': 'Played a silver league on every league-capable game.',
  // Free games
  'century': 'Played a single free game enough times to make it a hundred.',
  'personal-best': 'Beat your own personal best.',
  'explorer': 'Played every free game on the platform at least once.',
  'unbeatable': "Won an extended run against the rps-vs-machine pattern detector.",
  'the-engineer': 'Solved towers-of-hanoi at maximum difficulty.',
  'speed-reader': 'Solved 52dle in record-breaking time.',
  'photographic': 'Played a perfect game of memory-matrix without fluffing a single round.',
  'dead-reckoning': 'Hit every estimation-engine question exactly on the nose.',
  'clairvoyant': 'Won every round of a higher-or-lower game.',
  'on-the-nose': 'Hit a countdown-numbers target exactly.',
  'next-in-line': 'Got a long unbroken run of correct sequences in sequence-solver.',
  'wordy': 'Won a maffsy round in three guesses or fewer.',
  'binary-decision': 'Won a maffsy round in exactly two guesses.',
  'feel-no-pressure': 'Won a long unbroken run of maffsy rounds.',
  // Streaks
  'weekend-warrior': 'Played on Saturdays for several weekends running.',
  'the-marathon': 'Held a single league session together for an extraordinary stretch.',
  'league-regular': 'Joined a league every week for a solid run of weeks.',
  // Kakuro
  'the-crossword-king': 'Won a kakuro league with no mistakes and no hints.',
  'sum-of-all-fears': 'Solved a kakuro puzzle with every cell correct on the first try.',
  // Time
  'night-owl': 'Finished a game in the small hours of the morning.',
  'the-insomniac': 'Submitted every league puzzle in the small hours.',
  // Seasonal
  'easter': 'Played during the Easter window.',
  'christmas': 'Played on Christmas Day.',
  'new-year': 'Played during the New Year window.',
  'halloween': 'Played on Halloween.',
  'bonfire-night': 'Played on Bonfire Night.',
  'pancake-day': 'Played on Shrove Tuesday.',
  'pi-day': 'Played on Pi Day.',
  've-day': 'Played battleships on VE Day.',
  'summer-week': 'Played during the height of summer.',
  'platform-anniversary': "Played on the platform's birthday.",
  // Monthly
  'active-player': 'Played enough games in a single month to count as active.',
  'grinder': 'Played a serious volume of games in a single month.',
  'league-month': 'Joined several leagues in a single month.',
  'double-winner': 'Won two leagues in a single month.',
  // Constants
  'pi': 'Posted a league puzzle score equal to a famous mathematical constant.',
  'euler': 'Posted a league puzzle score equal to a famous mathematical constant.',
  'golden-ratio': 'Posted a league puzzle score equal to a famous mathematical constant.',
  'root-two': 'Posted a league puzzle score equal to a famous mathematical constant.',
  'root-three': 'Posted a league puzzle score equal to a famous mathematical constant.',
  'the-mathematicians-collection': 'Held the full set of mathematical constant scores.',
  // Squared Pi
  'squared-pi': 'Posted the Pi score on Pi Day itself.',
  // Loyalty
  'skin-in-the-game': 'Spent enough QF on the platform to feel it.',
  'true-believer': 'Spent enough QF on the platform to feel it twice over.',
  'fifty-two-thousand': 'Reached the platform spend that triggers a 52f airdrop.',
  // Milestones
  'collector': 'Earned ten achievements.',
  'devoted': 'Earned twenty-five achievements.',
  'obsessed': 'Earned fifty achievements.',
  'the-complete-player': 'Earned one hundred achievements.',
  'the-grandmaster': 'Held all three cross-game super-achievements at once.',
  // Meta
  'pioneer-hunter': 'Held the pioneer tag on several minted achievements.',
  'the-whale': 'Spent an enormous amount of QF on minting achievements.',
  'duel-master': 'Reached a meaningful duel win count.',
  'breadwinner': 'Earned more from leagues than you ever paid in entry fees.',
  'the-grinder': 'Paid an enormous amount in cumulative league entry fees.',
  // Absurd
  'palindrome': 'Posted a score that reads the same forwards and backwards.',
  'wrong-answer-streak': 'Got a long unbroken run of wrong answers in prime-or-composite.',
  'midnight': 'Finished a game in the very first minute of UTC midnight.',
  'fibonacci': 'Posted Fibonacci-sequence scores across several games in a row.',
  'onlyfans-qf': 'Awarded by hand. The recipient knows why.',
  // Founding
  'founding-member': "Submitted a league puzzle during the platform's opening window.",
  // Wooden spoons
  'tax-payers-nightmare': 'Lost a battleships game with the carrier sunk and zero opponent ships taken down.',
  'the-optimist': 'Finished last in many leagues without ever losing the will to enter the next one.',
  'slow-burn': 'Held the slowest total time in a settled minesweeper league.',
  'crib-death': 'Posted a cribbage-solitaire score barely worth counting.',
  'bust': 'Posted zero scoring hands across an entire poker-patience game.',
  'the-fish': 'Finished last in poker-patience leagues several times over.',
  'score-one': 'Finished a league with a total score of one.',
  'the-pacifist': 'Posted zero on every puzzle of a kakuro league.',
  'all-wrong': 'Got every kakuro cell wrong on the first attempt.',
  'full-hints': 'Solved a kenken puzzle by leaning on every available hint.',
  'dnf-king': 'Joined a league and never submitted a single puzzle.',
  'flagless-and-wrong': 'Detonated a minesweeper without planting a single flag.',
  'last-and-slow': 'Finished a minesweeper league last and slowest.',
  'memory-loss': 'Made at least one mistake in a sudoku-duel league.',
  'bogey': 'Finished a golf-solitaire game with the table still piled high.',
  'curse-of-the-mummy': 'Cleared barely any of the pyramid before the run ended.',
  'pharaohs-curse': 'Cleared not many more than that.',
  'mucky-hands': 'Posted High Card on every line of a poker-patience game.',
  'the-novelist': 'Took the maximum number of guesses to lose a maffsy round.',
  // Impossible
  'boom': 'The achievement that cannot be earned.',
  // Rivals
  'regicide': 'Finished above an owner wallet in a league.',
  'detention': 'Finished below an owner wallet in a league.',
  // Community (manually awarded)
  'bug-hunter': 'Found and reported something that made the platform better.',
};

function seedAchievements(db) {
  const insert = db.prepare(`INSERT OR IGNORE INTO achievement_registry (achievement_id, name, game_id, tier, mint_fee_qf, category)
    VALUES (?, ?, ?, ?, ?, ?)`);
  const updateCat = db.prepare(`UPDATE achievement_registry SET category = ?, mint_fee_qf = ? WHERE achievement_id = ? AND (category IS NULL OR category != ?)`);
  for (const a of ACHIEVEMENTS) {
    const tier = a.fee === 0 ? 'free' : a.fee <= 100 ? 'standard' : a.fee <= 200 ? 'premium' : 'elite';
    insert.run(a.id, a.name, a.game_id || null, tier, a.fee, a.category);
    updateCat.run(a.category, a.fee, a.id, a.category);
  }
  // Retire speed-reader (52dle only has 6 guesses, condition was impossible)
  db.prepare('UPDATE achievement_registry SET active = 0 WHERE achievement_id = ?').run('speed-reader');

  // Fill description if NULL — covers seed array entries plus rows added directly
  // to DB (e.g. bug-hunter). Re-run safe: only writes where description is missing.
  const updateDesc = db.prepare('UPDATE achievement_registry SET description = ? WHERE achievement_id = ? AND description IS NULL');
  for (const id in ACHIEVEMENT_DESCRIPTIONS) {
    updateDesc.run(ACHIEVEMENT_DESCRIPTIONS[id], id);
  }
}

function seedSeasonalWindows(db) {
  var count = db.prepare('SELECT COUNT(*) as c FROM seasonal_windows').get();
  if (count && count.c > 0) return;

  var insert = db.prepare('INSERT INTO seasonal_windows (achievement_id, year, window_start, window_end) VALUES (?, ?, ?, ?)');

  // Helper: UTC day start/end in epoch ms
  function dayStart(y, m, d) { return Date.UTC(y, m - 1, d, 0, 0, 0); }
  function dayEnd(y, m, d) { return Date.UTC(y, m - 1, d, 23, 59, 59); }

  // Fixed dates per year
  var fixed = [
    { id: 'christmas',    m: 12, d: 25 },
    { id: 'halloween',    m: 10, d: 31 },
    { id: 'bonfire-night', m: 11, d: 5 },
    { id: 'pi-day',       m: 3,  d: 14 },
    { id: 've-day',       m: 5,  d: 8 },
  ];

  // Easter: Good Friday + Easter Sunday (pre-calculated 2026–2030)
  var easter = {
    2026: [[4,3],[4,5]], 2027: [[3,26],[3,28]], 2028: [[4,14],[4,16]],
    2029: [[3,30],[4,1]], 2030: [[4,19],[4,21]]
  };

  // Pancake Day (Shrove Tuesday, pre-calculated 2026–2030)
  var pancake = { 2026: [2,17], 2027: [2,9], 2028: [2,29], 2029: [2,13], 2030: [3,5] };

  for (var y = 2026; y <= 2030; y++) {
    // Fixed dates
    for (var fi = 0; fi < fixed.length; fi++) {
      insert.run(fixed[fi].id, y, dayStart(y, fixed[fi].m, fixed[fi].d), dayEnd(y, fixed[fi].m, fixed[fi].d));
    }

    // New Year spans midnight: 31 Dec 23:00 to 1 Jan 01:00
    insert.run('new-year', y, Date.UTC(y - 1, 11, 31, 23, 0, 0), Date.UTC(y, 0, 1, 1, 0, 0));

    // Easter — single window spanning Good Friday to Easter Sunday
    if (easter[y]) {
      var gf = easter[y][0]; // Good Friday
      var es = easter[y][1]; // Easter Sunday
      insert.run('easter', y, dayStart(y, gf[0], gf[1]), dayEnd(y, es[0], es[1]));
    }

    // Pancake Day
    if (pancake[y]) {
      insert.run('pancake-day', y, dayStart(y, pancake[y][0], pancake[y][1]), dayEnd(y, pancake[y][0], pancake[y][1]));
    }
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
  return db.prepare('SELECT e.*, r.name, r.mint_fee_qf, r.description FROM achievement_eligibility e LEFT JOIN achievement_registry r ON e.achievement_id = r.achievement_id WHERE e.wallet = ? ORDER BY e.earned_at DESC')
    .all(wallet.toLowerCase());
}

export function getDuelWinCount(wallet) {
  const db = getDb();
  var row = db.prepare("SELECT COUNT(*) as count FROM duels WHERE winner = ? AND status = 'completed'").get(wallet.toLowerCase());
  return row ? row.count : 0;
}

export function isRecentLeagueChampion(wallet) {
  const db = getDb();
  var cutoff = Date.now() - (30 * 24 * 3600 * 1000);
  var row = db.prepare('SELECT COUNT(*) as count FROM league_prizes lp JOIN leagues l ON l.id = lp.league_id WHERE lp.wallet = ? AND lp.position = 1 AND l.settled_at >= ?')
    .get(wallet.toLowerCase(), cutoff);
  return row && row.count > 0;
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

export function getEarnedAchievementCount(wallet) {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM achievement_eligibility WHERE wallet = ?').get(wallet.toLowerCase());
  return row ? row.count : 0;
}

export function getActiveSeasonalWindows(nowMs) {
  const db = getDb();
  return db.prepare('SELECT * FROM seasonal_windows WHERE window_start <= ? AND window_end >= ?').all(nowMs, nowMs);
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

export function getCompletedLeagueCount(wallet) {
  const db = getDb();
  var row = db.prepare('SELECT COUNT(DISTINCT league_id) as count FROM league_scores WHERE wallet = ?').get(wallet.toLowerCase());
  return row ? row.count : 0;
}

export function getLeagueWinCount(wallet) {
  const db = getDb();
  var row = db.prepare('SELECT COUNT(*) as count FROM league_prizes WHERE wallet = ? AND position = 1').get(wallet.toLowerCase());
  return row ? row.count : 0;
}

export function getLeagueWinsByGame(wallet) {
  const db = getDb();
  var rows = db.prepare('SELECT DISTINCT l.game_id FROM league_prizes lp JOIN leagues l ON l.id = lp.league_id WHERE lp.wallet = ? AND lp.position = 1').all(wallet.toLowerCase());
  return rows.map(function(r) { return r.game_id; });
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

export function incrementWalletCounter(wallet, column) {
  const db = getDb();
  const w = wallet.toLowerCase();
  const now = Date.now();
  db.prepare('INSERT INTO wallet_stats (wallet, ' + column + ', updated_at) VALUES (?, 1, ?) ON CONFLICT(wallet) DO UPDATE SET ' + column + ' = ' + column + ' + 1, updated_at = ?')
    .run(w, now, now);
}

export function resetWalletCounter(wallet, column) {
  const db = getDb();
  const w = wallet.toLowerCase();
  const now = Date.now();
  db.prepare('INSERT INTO wallet_stats (wallet, ' + column + ', updated_at) VALUES (?, 0, ?) ON CONFLICT(wallet) DO UPDATE SET ' + column + ' = 0, updated_at = ?')
    .run(w, now, now);
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
  var expiring = db.prepare(`SELECT id, game_id, share_code, creator_wallet, opponent_wallet, stake, status, creator_tx, acceptor_tx, broadcast_message_id FROM duels WHERE status IN ('created', 'accepted') AND expires_at < ?`).all(now);
  if (expiring.length > 0) {
    db.prepare(`UPDATE duels SET status = 'expired' WHERE status IN ('created', 'accepted') AND expires_at < ?`).run(now);
  }
  return expiring;
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

export function getPaidLeaguePlayerCount(leagueId) {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM league_players WHERE league_id = ? AND refunded = 0 AND tx_hash IS NOT NULL AND tx_hash != 'builder-whitelist'").get(leagueId);
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

export function addLeagueScore(leagueId, wallet, puzzleIndex, score, timeMs, mistakes, hints, submittedAt, suspicious, suspiciousDetail, undosUsed, freeCellsUsed, flagsUsed, helperUsed) {
  const db = getDb();
  db.prepare(`INSERT INTO league_scores (league_id, wallet, puzzle_index, score, time_ms, mistakes, hints, submitted_at, suspicious, suspicious_detail, undos_used, free_cells_used, flags_used, helper_used)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(leagueId, wallet.toLowerCase(), puzzleIndex, score, timeMs, mistakes, hints, submittedAt, suspicious || null, suspiciousDetail || null, undosUsed || 0, freeCellsUsed || 0, flagsUsed || 0, helperUsed || 0);
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

export function getAllLeagueScores(leagueId) {
  const db = getDb();
  return db.prepare('SELECT wallet, score, puzzle_index, submitted_at FROM league_scores WHERE league_id = ? ORDER BY submitted_at ASC')
    .all(leagueId);
}

export function getLeagueLeaderboard(leagueId) {
  const db = getDb();
  return db.prepare(`
    SELECT wallet, SUM(score) as total_score, COUNT(*) as puzzles_played,
           SUM(time_ms) as total_time, SUM(mistakes) as total_mistakes, SUM(hints) as total_hints
    FROM league_scores WHERE league_id = ? AND suspicious IS NULL
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

export function createGameState(sessionId, wallet, gameId, contextType, contextId, puzzleIndex, seed, startedAt, freePlay, difficulty) {
  const db = getDb();
  db.prepare(`INSERT INTO active_game_state (session_id, wallet, game_id, context_type, context_id, puzzle_index, seed, started_at, free_play, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(sessionId, wallet.toLowerCase(), gameId, contextType, contextId, puzzleIndex, seed, startedAt, freePlay ? 1 : 0, difficulty || null);
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
  const cutoff = Date.now() - (86400 * 1000);
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

export function createBattleshipsGame(id, stakeQf, creatorWallet, shareCode, createdAt, vsCpu = 0, difficulty = 'recruit') {
  const db = getDb();
  db.prepare(`INSERT INTO battleships_games (id, stake_qf, creator_wallet, share_code, created_at, vs_cpu, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, stakeQf, creatorWallet.toLowerCase(), shareCode, createdAt, vsCpu, difficulty);
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

export function getActiveBattleshipsForWallet(wallet) {
  const db = getDb();
  const w = wallet.toLowerCase();
  return db.prepare(`SELECT * FROM battleships_games WHERE (creator_wallet = ? OR opponent_wallet = ?) AND status = 'active' AND current_turn = ?`)
    .all(w, w, w);
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

// ── Personal bests ─────────────────────────────────────────────────────────

export const TIME_PRIMARY_GAMES = new Set(['minesweeper', 'freecell', 'nonogram', 'kakuro']);
// minesweeper and freecell were incorrectly classified here — both store
// `5000 − seconds` as their score (higher is better), which the reverse
// branch handles correctly. The set is kept (empty) as a slot for any
// future game that genuinely stores raw-time-as-score.
const PURE_TIME_GAMES = new Set();

export function upsertPersonalBest(wallet, gameId, difficulty, score, timeMs, sessionId) {
  const db = getDb();
  const now = Date.now();
  const diff = difficulty || 'default';
  const w = wallet.toLowerCase();
  const sid = sessionId || null;

  if (PURE_TIME_GAMES.has(gameId)) {
    // Pure time games: time IS the score, lower is better
    db.prepare(`INSERT INTO personal_bests (wallet, game_id, difficulty, score, time_ms, achieved_at, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(wallet, game_id, difficulty) DO UPDATE SET
        score = excluded.score,
        time_ms = excluded.time_ms,
        achieved_at = excluded.achieved_at,
        session_id = excluded.session_id
      WHERE excluded.score < personal_bests.score`)
      .run(w, gameId, diff, score, timeMs, now, sid);
  } else {
    // Higher score is better
    db.prepare(`INSERT INTO personal_bests (wallet, game_id, difficulty, score, time_ms, achieved_at, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(wallet, game_id, difficulty) DO UPDATE SET
        score = excluded.score,
        time_ms = excluded.time_ms,
        achieved_at = excluded.achieved_at,
        session_id = excluded.session_id
      WHERE excluded.score > personal_bests.score`)
      .run(w, gameId, diff, score, timeMs, now, sid);
  }
}

export function getPersonalBests(wallet) {
  const db = getDb();
  return db.prepare('SELECT * FROM personal_bests WHERE wallet = ? ORDER BY game_id, difficulty')
    .all(wallet.toLowerCase());
}

export function getPersonalBest(wallet, gameId, difficulty) {
  const db = getDb();
  return db.prepare('SELECT * FROM personal_bests WHERE wallet = ? AND game_id = ? AND difficulty = ?')
    .get(wallet.toLowerCase(), gameId, difficulty || 'default');
}

// ── Free game completions ─────────────────────────────────────────────────

export function incrementFreeGameCompletion(wallet, gameId) {
  const db = getDb();
  const w = wallet.toLowerCase();
  const now = Date.now();
  db.prepare(`INSERT INTO free_game_completions (wallet, game_id, count, last_played) VALUES (?, ?, 1, ?)
    ON CONFLICT(wallet, game_id) DO UPDATE SET count = count + 1, last_played = ?`)
    .run(w, gameId, now, now);
  return db.prepare('SELECT * FROM free_game_completions WHERE wallet = ? AND game_id = ?').get(w, gameId);
}

export function incrementPbBeatenCount(wallet, gameId) {
  const db = getDb();
  const w = wallet.toLowerCase();
  const now = Date.now();
  db.prepare(`INSERT INTO free_game_completions (wallet, game_id, pb_beaten_count, last_played) VALUES (?, ?, 1, ?)
    ON CONFLICT(wallet, game_id) DO UPDATE SET pb_beaten_count = pb_beaten_count + 1, last_played = ?`)
    .run(w, gameId, now, now);
  return db.prepare('SELECT pb_beaten_count FROM free_game_completions WHERE wallet = ? AND game_id = ?').get(w, gameId);
}

export function getDistinctFreeGamesPlayed(wallet) {
  const db = getDb();
  return db.prepare('SELECT COUNT(DISTINCT game_id) as count FROM free_game_completions WHERE wallet = ?')
    .get(wallet.toLowerCase());
}

export function retireAchievement(achievementId) {
  const db = getDb();
  db.prepare('UPDATE achievement_registry SET active = 0 WHERE achievement_id = ?').run(achievementId);
}

// ── League bests ───────────────────────────────────────────────────────────

export function upsertLeagueBest(wallet, gameId, tier, totalScore, leagueId) {
  const db = getDb();
  const now = Date.now();
  const w = wallet.toLowerCase();
  db.prepare(`INSERT INTO league_bests (wallet, game_id, tier, best_total_score, league_id, achieved_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(wallet, game_id, tier) DO UPDATE SET
      best_total_score = excluded.best_total_score,
      league_id = excluded.league_id,
      achieved_at = excluded.achieved_at
    WHERE excluded.best_total_score > league_bests.best_total_score`)
    .run(w, gameId, tier, totalScore, leagueId, now);
}

export function getLeagueBests(wallet) {
  const db = getDb();
  return db.prepare('SELECT * FROM league_bests WHERE wallet = ? ORDER BY game_id, tier')
    .all(wallet.toLowerCase());
}

// ── Profile endpoint queries ───────────────────────────────────────────────

export function getWalletLeagueHistory(wallet, limit) {
  const db = getDb();
  const w = wallet.toLowerCase();
  return db.prepare(`
    SELECT
      l.id as league_id,
      l.game_id,
      l.tier,
      l.settled_at,
      COALESCE(SUM(ls.score), 0) as total_score,
      lpr.position,
      lpr.amount as prize_amount
    FROM leagues l
    JOIN league_players lp ON l.id = lp.league_id
    LEFT JOIN league_scores ls ON l.id = ls.league_id AND ls.wallet = ?
    LEFT JOIN league_prizes lpr ON l.id = lpr.league_id AND lpr.wallet = ?
    WHERE lp.wallet = ? AND l.status = 'settled'
    GROUP BY l.id
    ORDER BY l.settled_at DESC
    LIMIT ?
  `).all(w, w, w, limit || 20);
}

export function getWalletTrophies(wallet) {
  const db = getDb();
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='commemorative_mints'").get();
  if (!tableExists) return [];
  return db.prepare('SELECT * FROM commemorative_mints WHERE wallet = ? ORDER BY minted_at DESC')
    .all(wallet.toLowerCase());
}

export function getGameStateForLeaguePuzzle(wallet, leagueId, puzzleIndex) {
  const db = getDb();
  return db.prepare(`SELECT * FROM active_game_state WHERE wallet = ? AND context_type = 'league' AND context_id = ? AND puzzle_index = ? ORDER BY started_at DESC LIMIT 1`)
    .get(wallet.toLowerCase(), leagueId, puzzleIndex);
}

export function getFlaggedSessions(walletFilter, leagueFilter) {
  const db = getDb();
  let sql = `
    SELECT ls.*, ags.flagged as ags_flagged, ags.game_id
    FROM league_scores ls
    LEFT JOIN active_game_state ags
      ON ags.wallet = ls.wallet AND ags.context_type = 'league' AND ags.context_id = ls.league_id AND ags.puzzle_index = ls.puzzle_index
    WHERE (ls.suspicious IS NOT NULL OR ags.flagged IS NOT NULL)
  `;
  var params = [];
  if (walletFilter) { sql += ' AND ls.wallet = ?'; params.push(walletFilter.toLowerCase()); }
  if (leagueFilter) { sql += ' AND ls.league_id = ?'; params.push(leagueFilter); }
  sql += ' ORDER BY ls.submitted_at DESC LIMIT 200';
  return db.prepare(sql).all(...params);
}

// ── Global leaderboard queries ──────────────────────────────────────────

export function getGlobalLeaderboard(gameId, periodType, periodKey) {
  const db = getDb();
  var isTime = TIME_PRIMARY_GAMES.has(gameId);
  var orderBy = isTime ? 'time_ms ASC, score DESC' : 'score DESC, time_ms ASC';
  return db.prepare(
    'SELECT wallet, qns_name, score, time_ms, paid_at FROM global_leaderboard_entries WHERE game_id = ? AND period_type = ? AND period_key = ? AND suspicious = 0 ORDER BY ' + orderBy
  ).all(gameId, periodType, periodKey);
}

export function getGlobalLeaderboardEntry(wallet, gameId, periodType, periodKey) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM global_leaderboard_entries WHERE wallet = ? AND game_id = ? AND period_type = ? AND period_key = ?'
  ).get(wallet.toLowerCase(), gameId, periodType, periodKey);
}

export function addGlobalLeaderboardEntry(wallet, gameId, score, timeMs, periodType, periodKey, sessionId, txHash, qnsName, suspicious) {
  const db = getDb();
  db.prepare(
    'INSERT INTO global_leaderboard_entries (wallet, game_id, score, time_ms, period_type, period_key, session_id, paid_at, tx_hash, qns_name, suspicious) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(wallet.toLowerCase(), gameId, score, timeMs || 0, periodType, periodKey, sessionId, Date.now(), txHash || null, qnsName || null, suspicious || 0);
}

export function updateGlobalLeaderboardEntry(wallet, gameId, score, timeMs, periodType, periodKey, sessionId, txHash, qnsName, suspicious) {
  const db = getDb();
  db.prepare(
    'UPDATE global_leaderboard_entries SET score = ?, time_ms = ?, session_id = ?, paid_at = ?, tx_hash = ?, qns_name = ?, suspicious = ? WHERE wallet = ? AND game_id = ? AND period_type = ? AND period_key = ?'
  ).run(score, timeMs || 0, sessionId, Date.now(), txHash || null, qnsName || null, suspicious || 0, wallet.toLowerCase(), gameId, periodType, periodKey);
}

export function getWalletLeaderboardPositions(wallet) {
  const db = getDb();
  var w = wallet.toLowerCase();
  var now = new Date();
  var dailyKey = now.toISOString().slice(0, 10);
  var weekKey = now.getFullYear() + '-W' + String(getISOWeek(now)).padStart(2, '0');
  var monthKey = now.toISOString().slice(0, 7);

  var entries = db.prepare(
    'SELECT * FROM global_leaderboard_entries WHERE wallet = ? AND ((period_type = ? AND period_key = ?) OR (period_type = ? AND period_key = ?) OR (period_type = ? AND period_key = ?))'
  ).all(w, 'daily', dailyKey, 'weekly', weekKey, 'monthly', monthKey);

  return entries.map(function(e) {
    var board = getGlobalLeaderboard(e.game_id, e.period_type, e.period_key);
    var rank = board.findIndex(function(r) { return r.wallet === w; }) + 1;
    return { game_id: e.game_id, period_type: e.period_type, rank: rank, score: e.score, total_entries: board.length };
  });
}

// ── Maffsy streaks ─────────────────────────────────────────────────────────

export function recordMaffsyResult(wallet, playDate, won, guesses, wordId) {
  const db = getDb();
  const w = wallet.toLowerCase();
  db.prepare(
    `INSERT INTO maffsy_streaks (wallet, play_date, won, guesses, word_id)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(wallet, play_date) DO UPDATE SET won = excluded.won, guesses = excluded.guesses, word_id = excluded.word_id`
  ).run(w, playDate, won ? 1 : 0, guesses, wordId);

  // Calculate current streak: consecutive won=1 days backwards from today
  var rows = db.prepare(
    'SELECT play_date, won FROM maffsy_streaks WHERE wallet = ? ORDER BY play_date DESC'
  ).all(w);

  var currentStreak = 0;
  var expected = new Date(playDate);
  for (var i = 0; i < rows.length; i++) {
    var rowDate = rows[i].play_date;
    var expStr = expected.toISOString().slice(0, 10);
    if (rowDate === expStr && rows[i].won === 1) {
      currentStreak++;
      expected.setDate(expected.getDate() - 1);
    } else if (rowDate === expStr && rows[i].won === 0) {
      break;
    } else if (rowDate < expStr) {
      // Missed a day — streak broken
      break;
    }
  }

  // Calculate max streak: scan all rows chronologically
  var allRows = db.prepare(
    'SELECT play_date, won FROM maffsy_streaks WHERE wallet = ? ORDER BY play_date ASC'
  ).all(w);
  var maxStreak = 0;
  var run = 0;
  for (var j = 0; j < allRows.length; j++) {
    if (allRows[j].won === 1) {
      run++;
      if (run > maxStreak) maxStreak = run;
    } else {
      run = 0;
    }
  }

  // Update wallet_stats
  upsertWalletStats(w, { maffsy_current_streak: currentStreak, maffsy_max_streak: maxStreak });

  return { currentStreak, maxStreak, played: allRows.length, won: allRows.filter(r => r.won === 1).length };
}

export function getMaffsyStats(wallet) {
  const db = getDb();
  const w = wallet.toLowerCase();
  var rows = db.prepare('SELECT play_date, won, guesses FROM maffsy_streaks WHERE wallet = ? ORDER BY play_date ASC').all(w);
  var played = rows.length;
  var won = rows.filter(r => r.won === 1).length;
  var dist = [0, 0, 0, 0, 0, 0];
  rows.forEach(r => { if (r.won === 1 && r.guesses >= 1 && r.guesses <= 6) dist[r.guesses - 1]++; });

  var stats = getWalletStats(w) || {};
  return {
    played: played,
    won: won,
    streak: stats.maffsy_current_streak || 0,
    maxStreak: stats.maffsy_max_streak || 0,
    dist: dist
  };
}

function getISOWeek(d) {
  var date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}
