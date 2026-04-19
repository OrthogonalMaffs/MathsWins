// Minimal .env loader — no dotenv dep. Populates process.env from .env for
// keys NOT already set (ecosystem.config.cjs values always take precedence).
// Trims whitespace so trailing-space drift can't silently disable features.
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

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDb } from './db/index.mjs';
import { expireOldDuels, addDuelRefund, getPendingDuelRefunds, getFailedDuelRefunds, updateDuelRefundStatus } from './db/index.mjs';
import apiRoutes from './routes/api.mjs';
import { checkLeagueLifecycles, checkBattleshipsTimeouts } from './routes/api.mjs';
import { registerAllGames } from './games/index.mjs';
import { recoverSessions } from './scoring.mjs';
import { startListener } from './chain-listener.mjs';
import { initEscrow, getEscrowAddress, getEscrowBalance, refundDuel } from './escrow.mjs';
import { ethers } from 'ethers';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3860;

const app = express();

// Behind Cloudflare Tunnel: trust X-Forwarded-For so req.ip is the real client IP,
// not 127.0.0.1. Without this, every visitor shares one rate-limit bucket.
app.set('trust proxy', true);

// Disable ETag — combined with Cache-Control: no-store below, prevents browsers
// from sending If-None-Match and getting back an empty 304 that breaks res.json().
app.set('etag', false);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'https://mathswins.co.uk',
    'https://www.mathswins.co.uk',
    'https://dapp-api.mathswins.co.uk',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Wallet-Address']
}));
app.use(express.json({ limit: '16kb' }));

// Prevent Cloudflare edge from caching any API response
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// ── Rate limiting (simple in-memory, replace with Redis for production) ─────
// Read-only GETs on these prefixes are whitelisted: cheap, public, and the
// lobby grid + My Account fire 26+ parallel fetches per render.
// Matched against req.originalUrl (mirrors the timing middleware below) — req.path
// inside this mounted handler does not strip the /api/dapp prefix in this stack.
const RATE_LIMIT_GET_WHITELIST = [
  '/api/dapp/global-leaderboard/',
  '/api/dapp/profile/',
  '/api/dapp/achievements/',
  '/api/dapp/leagues/',
  '/api/dapp/league/',
];
const rateLimits = new Map();
app.use('/api/dapp', (req, res, next) => {
  if (req.method === 'GET' && RATE_LIMIT_GET_WHITELIST.some(p => req.originalUrl.startsWith(p))) {
    return next();
  }

  const key = req.ip;
  const now = Date.now();
  const window = 60000; // 1 minute
  const maxRequests = 120;

  if (!rateLimits.has(key)) rateLimits.set(key, []);
  const hits = rateLimits.get(key).filter(t => now - t < window);
  hits.push(now);
  rateLimits.set(key, hits);

  if (hits.length > maxRequests) {
    return res.status(429).json({ error: 'Rate limited' });
  }
  next();
});

// Clean up rate limits every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, hits] of rateLimits) {
    const fresh = hits.filter(t => now - t < 60000);
    if (fresh.length === 0) rateLimits.delete(key);
    else rateLimits.set(key, fresh);
  }
}, 300000);

// ── Request timing ──────────────────────────────────────────────────────────
app.use('/api/dapp', (req, res, next) => {
  const start = process.hrtime.bigint();
  const originalEnd = res.end;
  res.end = function(...args) {
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
    const path = req.originalUrl.replace('/api/dapp', '');
    const wallet = req.wallet ? req.wallet.slice(0, 8) + '...' : '-';
    console.log(`[API] ${req.method} ${path} ${res.statusCode} ${elapsed.toFixed(1)}ms wallet=${wallet}`);
    res.set('Server-Timing', 'api;dur=' + elapsed.toFixed(1));
    originalEnd.apply(res, args);
  };
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/dapp', apiRoutes);

// Health check
app.get('/health', async (req, res) => {
  const balance = await getEscrowBalance();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    escrow: {
      address: getEscrowAddress(),
      balance: ethers.formatEther(balance) + ' QF'
    }
  });
});

// ── QF Migration Tracker (static HTML, relaxed CSP for inline + cross-origin fetch) ──
app.get(['/qf-migration', '/qf-migration/'], (req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://qf-explorer.mathswins.co.uk; img-src 'self' data: https:; font-src 'self' data:;"
  );
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.sendFile(path.join(__dirname, '../public/qf-migration.html'));
});

// ── Start ───────────────────────────────────────────────────────────────────
const db = getDb(); // initialise DB + run schema
console.log('Database initialised');

const escrowAddr = initEscrow();

registerAllGames();
console.log('Game banks loaded');

recoverSessions();
console.log('Session recovery complete');

startListener();
console.log('Chain listener started');

// Expire stale duels every 5 minutes. Queue refund rows first (so RPC
// failures are retryable), then attempt them immediately, then try any
// still-pending/failed rows from previous runs.
async function sendOneDuelRefund(row) {
  try {
    const txHash = await refundDuel(row.wallet, row.amount_qf, row.duel_id);
    if (txHash) {
      updateDuelRefundStatus(row.id, 'sent', txHash, null);
      console.log('Duel ' + row.duel_id.slice(0, 8) + '... refunded ' + row.amount_qf + ' QF to ' + row.role + ' ' + row.wallet.slice(0, 8) + '... tx: ' + txHash);
    } else {
      updateDuelRefundStatus(row.id, 'failed', null, 'sendQF returned null');
      console.error('Duel refund failed for ' + row.duel_id.slice(0, 8) + '... (' + row.role + ', ' + row.wallet.slice(0, 8) + '...): sendQF returned null');
    }
  } catch (e) {
    updateDuelRefundStatus(row.id, 'failed', null, e.message);
    console.error('Duel refund threw for ' + row.duel_id.slice(0, 8) + '... (' + row.role + '):', e.message);
  }
}

setInterval(async () => {
  try {
    var expired = expireOldDuels();
    var now = Date.now();
    for (var d of expired) {
      // Queue pending refund rows up-front so the intent is persisted
      // even if the server crashes mid-sweep or an RPC call fails.
      if (d.creator_wallet && d.stake > 0 && d.creator_tx) {
        addDuelRefund(d.id, d.creator_wallet, 'creator', d.stake, now);
      }
      if (d.status === 'accepted' && d.opponent_wallet && d.stake > 0 && d.acceptor_tx) {
        addDuelRefund(d.id, d.opponent_wallet, 'opponent', d.stake, now);
      }
      if (d.broadcast_message_id) {
        try {
          const { editDuelBroadcastExpired } = await import('./telegram.mjs');
          editDuelBroadcastExpired(d.broadcast_message_id, d);
        } catch (e) { /* must never block */ }
      }
    }

    // Process all pending + previously-failed refunds. Retrying failed rows
    // here gives RPC-blip recovery without needing a separate timer.
    var pending = getPendingDuelRefunds();
    for (var r1 of pending) await sendOneDuelRefund(r1);
    var failed = getFailedDuelRefunds();
    for (var r2 of failed) {
      if (r2.attempted_at && (now - r2.attempted_at) < 60000) continue;
      await sendOneDuelRefund(r2);
    }
  } catch (e) { console.error('Duel expiry sweep error:', e); }
}, 5 * 60 * 1000);

// Check league lifecycles every 2 minutes
setInterval(() => { try { checkLeagueLifecycles(); } catch (e) { console.error('League lifecycle check error:', e); } }, 2 * 60 * 1000);

// Check battleships 24h auto-shot timeouts every 5 minutes
setInterval(() => { try { checkBattleshipsTimeouts(); } catch (e) { console.error('Battleships timeout check error:', e); } }, 5 * 60 * 1000);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`MathsWins dApp backend listening on port ${PORT}`);
});
