#!/usr/bin/env node
// One-off migration: re-seat Maffsy streak/stat semantics from daily-only to
// game-level cross-mode. Backfills new wallet_stats counters from existing
// maffsy_streaks data (daily-mode only — pre-existing free-play data was never
// recorded server-side so nothing is lost). Wipes Maffsy rows from
// global_leaderboard_entries (replaced by maffsy_alltime_leaderboard).
//
// Atomic: all work runs inside BEGIN IMMEDIATE TRANSACTION. On any error:
// ROLLBACK and non-zero exit with no sentinel written. Re-run is safe once
// the cause is fixed; sentinel short-circuits a second successful run.
//
// Usage: node scripts/migrate-maffsy-counters.mjs

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

const { getDb } = await import('../src/db/index.mjs');
const db = getDb();

// ── Self-sufficient pre-requisites (idempotent) ─────────────────────────────
// This script may run before dapp-backend/src/db/index.mjs is updated on Box 1
// (Act 1 precedes Act 2 in the deploy plan). Create every schema object the
// migration needs directly here so we don't rely on the new init path being
// live. All statements are CREATE IF NOT EXISTS or try/catch'd ALTER, so
// re-runs against an already-migrated DB are no-ops.
db.exec(`CREATE TABLE IF NOT EXISTS migrations_ran (
  name TEXT PRIMARY KEY,
  ran_at INTEGER NOT NULL
)`);

const PREREQ_ALTERS = [
  'ALTER TABLE wallet_stats ADD COLUMN maffsy_total_plays INTEGER DEFAULT 0',
  'ALTER TABLE wallet_stats ADD COLUMN maffsy_total_wins INTEGER DEFAULT 0',
  'ALTER TABLE wallet_stats ADD COLUMN maffsy_guesses_1 INTEGER DEFAULT 0',
  'ALTER TABLE wallet_stats ADD COLUMN maffsy_guesses_2 INTEGER DEFAULT 0',
  'ALTER TABLE wallet_stats ADD COLUMN maffsy_guesses_3 INTEGER DEFAULT 0',
  'ALTER TABLE wallet_stats ADD COLUMN maffsy_guesses_4 INTEGER DEFAULT 0',
  'ALTER TABLE wallet_stats ADD COLUMN maffsy_guesses_5 INTEGER DEFAULT 0',
  'ALTER TABLE wallet_stats ADD COLUMN maffsy_guesses_6 INTEGER DEFAULT 0',
  'ALTER TABLE wallet_stats ADD COLUMN maffsy_abandons_today INTEGER DEFAULT 0',
  'ALTER TABLE wallet_stats ADD COLUMN maffsy_abandons_date TEXT'
];
for (const sql of PREREQ_ALTERS) {
  try { db.exec(sql); } catch (e) { /* column already exists */ }
}

db.exec(`CREATE TABLE IF NOT EXISTS maffsy_alltime_leaderboard (
  wallet TEXT PRIMARY KEY,
  score INTEGER NOT NULL,
  paid_at INTEGER NOT NULL,
  tx_hash TEXT NOT NULL,
  qns_name TEXT,
  updated_at INTEGER NOT NULL
)`);
db.exec('CREATE INDEX IF NOT EXISTS idx_maffsy_lb_score ON maffsy_alltime_leaderboard(score DESC)');

const SENTINEL = 'MAFFSY_MIGRATION_DONE';

const existing = db.prepare('SELECT name FROM migrations_ran WHERE name = ?').get(SENTINEL);
if (existing) {
  console.log('Migration already ran — sentinel present. Nothing to do.');
  process.exit(0);
}

const nowMs = Date.now();

const migrate = db.transaction(() => {
  // 1. Promote maffsy_clean_streak forward into current/max if higher.
  //    Keeps pre-existing daily-streak wins intact; adds any clean-streak
  //    progress (which was game-level but daily-mode-only before the gate fix).
  const streakUpdate = db.prepare(`
    UPDATE wallet_stats
       SET maffsy_current_streak = MAX(COALESCE(maffsy_current_streak, 0), COALESCE(maffsy_clean_streak, 0)),
           maffsy_max_streak     = MAX(COALESCE(maffsy_max_streak, 0),     COALESCE(maffsy_clean_streak, 0))
     WHERE COALESCE(maffsy_clean_streak, 0) > 0
  `).run();

  // 2. Backfill total_plays / total_wins / guesses_N from maffsy_streaks (daily data only).
  //    Aggregate per wallet, then merge into wallet_stats.
  const agg = db.prepare(`
    SELECT wallet,
           COUNT(*) AS plays,
           SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) AS wins,
           SUM(CASE WHEN won = 1 AND guesses = 1 THEN 1 ELSE 0 END) AS g1,
           SUM(CASE WHEN won = 1 AND guesses = 2 THEN 1 ELSE 0 END) AS g2,
           SUM(CASE WHEN won = 1 AND guesses = 3 THEN 1 ELSE 0 END) AS g3,
           SUM(CASE WHEN won = 1 AND guesses = 4 THEN 1 ELSE 0 END) AS g4,
           SUM(CASE WHEN won = 1 AND guesses = 5 THEN 1 ELSE 0 END) AS g5,
           SUM(CASE WHEN won = 1 AND guesses = 6 THEN 1 ELSE 0 END) AS g6
      FROM maffsy_streaks
     GROUP BY wallet
  `).all();

  const upsertCounters = db.prepare(`
    INSERT INTO wallet_stats (wallet, maffsy_total_plays, maffsy_total_wins,
                              maffsy_guesses_1, maffsy_guesses_2, maffsy_guesses_3,
                              maffsy_guesses_4, maffsy_guesses_5, maffsy_guesses_6,
                              updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(wallet) DO UPDATE SET
      maffsy_total_plays = excluded.maffsy_total_plays,
      maffsy_total_wins  = excluded.maffsy_total_wins,
      maffsy_guesses_1   = excluded.maffsy_guesses_1,
      maffsy_guesses_2   = excluded.maffsy_guesses_2,
      maffsy_guesses_3   = excluded.maffsy_guesses_3,
      maffsy_guesses_4   = excluded.maffsy_guesses_4,
      maffsy_guesses_5   = excluded.maffsy_guesses_5,
      maffsy_guesses_6   = excluded.maffsy_guesses_6,
      updated_at         = excluded.updated_at
  `);
  for (const row of agg) {
    upsertCounters.run(row.wallet, row.plays || 0, row.wins || 0,
      row.g1 || 0, row.g2 || 0, row.g3 || 0, row.g4 || 0, row.g5 || 0, row.g6 || 0, nowMs);
  }

  // 3. Wipe any maffsy rows from the global leaderboard (replaced by maffsy_alltime_leaderboard).
  const glbDelete = db.prepare("DELETE FROM global_leaderboard_entries WHERE game_id = 'maffsy'").run();

  // 4. Write sentinel — guards against re-runs.
  db.prepare('INSERT INTO migrations_ran (name, ran_at) VALUES (?, ?)').run(SENTINEL, nowMs);

  return {
    streakUpdateChanges: streakUpdate.changes,
    walletsBackfilled: agg.length,
    glbDeleted: glbDelete.changes
  };
});

try {
  const summary = migrate();
  console.log('Migration complete:');
  console.log('  wallets with clean_streak forward-promoted:', summary.streakUpdateChanges);
  console.log('  wallets backfilled with counters:         ', summary.walletsBackfilled);
  console.log('  global_leaderboard_entries rows deleted:  ', summary.glbDeleted);
  console.log('  sentinel written:', SENTINEL);
  process.exit(0);
} catch (e) {
  console.error('Migration failed — ROLLBACK performed, no sentinel written.');
  console.error('Error:', e.message);
  console.error('Stack:', e.stack);
  process.exit(1);
}
