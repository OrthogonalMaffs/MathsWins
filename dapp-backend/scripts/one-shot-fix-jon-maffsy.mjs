#!/usr/bin/env node
// One-shot data repair following the Maffsy abandon double-fire fix.
// Zeroes maffsy_abandons_today and restores maffsy_current_streak to the
// pre-bad-abandon value for Jon's wallet (0x7a3C…f8EF / notabot.qf).
// Idempotent: safe to re-run (UPDATE with fixed values).
//
// Usage: node scripts/one-shot-fix-jon-maffsy.mjs

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

const WALLET = '0x7a3c15461f89742d8416c560ba07cf8732a6f8ef';
const RESTORE_STREAK = 1;

const { getDb } = await import('../src/db/index.mjs');
const db = getDb();

const before = db.prepare(
  'SELECT wallet, maffsy_abandons_today, maffsy_abandons_date, maffsy_current_streak, maffsy_max_streak FROM wallet_stats WHERE wallet = ?'
).get(WALLET);
console.log('BEFORE:', before);

const todayUtc = new Date().toISOString().slice(0, 10);
const res = db.prepare(
  'UPDATE wallet_stats SET maffsy_abandons_today = 0, maffsy_abandons_date = ?, maffsy_current_streak = ? WHERE wallet = ?'
).run(todayUtc, RESTORE_STREAK, WALLET);
console.log('Rows updated:', res.changes);

const after = db.prepare(
  'SELECT wallet, maffsy_abandons_today, maffsy_abandons_date, maffsy_current_streak, maffsy_max_streak FROM wallet_stats WHERE wallet = ?'
).get(WALLET);
console.log('AFTER :', after);

process.exit(0);
