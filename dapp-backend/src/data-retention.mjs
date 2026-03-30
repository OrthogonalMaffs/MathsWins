/**
 * Data retention enforcement.
 * Run daily via cron: node src/data-retention.mjs
 *
 * Enforces the retention periods from the privacy notice:
 *   - Sessions: 90 days after the relevant game week ends
 *   - Scores/leaderboard: kept indefinitely (historical leaderboards)
 *   - Entries/settlements: kept indefinitely (financial audit trail)
 *   - On-chain data: permanent (blockchain, not our problem)
 */

import { getDb } from './db/index.mjs';

const SESSION_RETENTION_DAYS = 90;

function runRetention() {
  const db = getDb();
  const cutoff = new Date(Date.now() - SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);

  console.log(`[DATA-RETENTION] Running cleanup`);
  console.log(`[DATA-RETENTION] Session cutoff: ${cutoff} (${SESSION_RETENTION_DAYS} days ago)`);

  // Delete expired/completed sessions older than retention period
  const result = db.prepare(`
    DELETE FROM sessions
    WHERE (completed_at IS NOT NULL OR expired = 1)
      AND started_at < ?
  `).run(cutoff);

  console.log(`[DATA-RETENTION] Deleted ${result.changes} expired sessions`);

  // Log current table sizes for monitoring
  const counts = {
    sessions: db.prepare('SELECT COUNT(*) as c FROM sessions').get().c,
    entries: db.prepare('SELECT COUNT(*) as c FROM entries').get().c,
    best_scores: db.prepare('SELECT COUNT(*) as c FROM best_scores').get().c,
    settlements: db.prepare('SELECT COUNT(*) as c FROM settlements').get().c,
  };

  console.log(`[DATA-RETENTION] Current row counts:`, counts);
  console.log(`[DATA-RETENTION] Complete`);
}

runRetention();
