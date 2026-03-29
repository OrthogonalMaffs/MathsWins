-- MathsWins dApp — Score & Entry Database

-- Game registry
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,           -- e.g. 'estimation-golf'
  name TEXT NOT NULL,
  is_paid INTEGER DEFAULT 0,     -- 0 = free, 1 = paid
  server_scoring INTEGER DEFAULT 0,
  session_timeout_secs INTEGER DEFAULT 300,
  questions_per_session INTEGER DEFAULT 10
);

-- On-chain entry confirmations
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  game_id TEXT NOT NULL,
  week_id INTEGER NOT NULL,
  tier INTEGER NOT NULL,          -- 1 or 3 attempts
  tx_hash TEXT,
  block_number INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(wallet, game_id, week_id)
);

-- Game sessions (issued after on-chain payment confirmed)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,            -- UUID
  wallet TEXT NOT NULL,
  game_id TEXT NOT NULL,
  week_id INTEGER NOT NULL,
  attempt INTEGER NOT NULL,       -- 1, 2, or 3
  score INTEGER,                  -- null until completed
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  expired INTEGER DEFAULT 0       -- 1 if timed out
);

-- Best scores per wallet per game per week (denormalised for fast leaderboard)
CREATE TABLE IF NOT EXISTS best_scores (
  wallet TEXT NOT NULL,
  game_id TEXT NOT NULL,
  week_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  achieved_at TEXT NOT NULL,
  PRIMARY KEY (wallet, game_id, week_id)
);

-- Weekly settlement audit log
CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_id INTEGER NOT NULL,
  game_id TEXT NOT NULL,
  winner_wallet TEXT,
  pot_amount TEXT,                 -- stored as string (wei)
  treasury_amount TEXT,
  rolled_over INTEGER DEFAULT 0,
  tx_hash TEXT,
  settled_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entries_wallet_game ON entries(wallet, game_id, week_id);
CREATE INDEX IF NOT EXISTS idx_sessions_wallet_game ON sessions(wallet, game_id, week_id);
CREATE INDEX IF NOT EXISTS idx_best_scores_leaderboard ON best_scores(game_id, week_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_settlements_week ON settlements(week_id);
