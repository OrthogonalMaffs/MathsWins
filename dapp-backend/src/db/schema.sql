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

-- Duels (1v1 challenges)
CREATE TABLE IF NOT EXISTS duels (
    id              TEXT PRIMARY KEY,
    game_id         TEXT NOT NULL,
    puzzle_seed     INTEGER NOT NULL,
    difficulty      TEXT DEFAULT 'medium',
    creator_wallet  TEXT NOT NULL,
    creator_score   INTEGER,
    creator_time_ms INTEGER,
    creator_mistakes INTEGER,
    creator_hints   INTEGER,
    opponent_wallet TEXT,
    opponent_score  INTEGER,
    opponent_time_ms INTEGER,
    opponent_mistakes INTEGER,
    opponent_hints  INTEGER,
    share_code      TEXT UNIQUE NOT NULL,
    status          TEXT DEFAULT 'created',
    winner_wallet   TEXT,
    created_at      INTEGER NOT NULL,
    expires_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_duels_share_code ON duels(share_code);
CREATE INDEX IF NOT EXISTS idx_duels_creator ON duels(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_duels_status ON duels(status, expires_at);

-- Promo challenges (reusable codes like #MAFFS)
CREATE TABLE IF NOT EXISTS promo_challenges (
    id              TEXT PRIMARY KEY,
    code            TEXT UNIQUE NOT NULL,
    game_id         TEXT NOT NULL,
    puzzle_seed     INTEGER NOT NULL,
    creator_wallet  TEXT NOT NULL,
    creator_score   INTEGER NOT NULL,
    prize_per_win   INTEGER NOT NULL DEFAULT 25,
    max_claims      INTEGER NOT NULL DEFAULT 20,
    claims_count    INTEGER NOT NULL DEFAULT 0,
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS promo_claims (
    promo_id        TEXT NOT NULL,
    wallet          TEXT NOT NULL,
    score           INTEGER NOT NULL,
    won             INTEGER NOT NULL DEFAULT 0,
    tx_hash         TEXT,
    claimed_at      INTEGER NOT NULL,
    PRIMARY KEY (promo_id, wallet)
);

CREATE INDEX IF NOT EXISTS idx_promo_code ON promo_challenges(code);
CREATE INDEX IF NOT EXISTS idx_promo_claims_wallet ON promo_claims(wallet);

-- Leagues
CREATE TABLE IF NOT EXISTS leagues (
    id              TEXT PRIMARY KEY,
    game_id         TEXT NOT NULL,
    tier            TEXT NOT NULL,
    entry_fee       INTEGER NOT NULL,
    max_players     INTEGER DEFAULT 16,
    min_players     INTEGER DEFAULT 8,
    puzzle_count    INTEGER DEFAULT 10,
    status          TEXT DEFAULT 'registration',
    reg_opens_at    INTEGER NOT NULL,
    reg_closes_at   INTEGER NOT NULL,
    join_closes_at  INTEGER,
    play_closes_at  INTEGER,
    settled_at      INTEGER,
    total_pot       INTEGER DEFAULT 0,
    prize_pool      INTEGER DEFAULT 0,
    burn_amount     INTEGER DEFAULT 0,
    team_amount     INTEGER DEFAULT 0,
    created_at      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS league_players (
    league_id       TEXT NOT NULL,
    wallet          TEXT NOT NULL,
    tx_hash         TEXT,
    joined_at       INTEGER NOT NULL,
    refunded        INTEGER DEFAULT 0,
    PRIMARY KEY (league_id, wallet)
);

CREATE TABLE IF NOT EXISTS league_puzzles (
    league_id       TEXT NOT NULL,
    puzzle_index    INTEGER NOT NULL,
    puzzle_seed     INTEGER NOT NULL,
    PRIMARY KEY (league_id, puzzle_index)
);

CREATE TABLE IF NOT EXISTS league_scores (
    league_id       TEXT NOT NULL,
    wallet          TEXT NOT NULL,
    puzzle_index    INTEGER NOT NULL,
    score           INTEGER NOT NULL,
    time_ms         INTEGER,
    mistakes        INTEGER,
    hints           INTEGER,
    submitted_at    INTEGER NOT NULL,
    PRIMARY KEY (league_id, wallet, puzzle_index)
);

CREATE TABLE IF NOT EXISTS league_prizes (
    league_id       TEXT NOT NULL,
    position        INTEGER NOT NULL,
    wallet          TEXT NOT NULL,
    amount          INTEGER NOT NULL,
    tx_hash         TEXT,
    paid_at         INTEGER,
    PRIMARY KEY (league_id, position)
);

CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);
CREATE INDEX IF NOT EXISTS idx_leagues_game ON leagues(game_id, status);
CREATE INDEX IF NOT EXISTS idx_league_players_wallet ON league_players(wallet);
CREATE INDEX IF NOT EXISTS idx_league_scores_league ON league_scores(league_id, wallet);
