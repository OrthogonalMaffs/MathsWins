import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDb } from './db/index.mjs';
import { expireOldDuels } from './db/index.mjs';
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
const rateLimits = new Map();
app.use('/api/dapp', (req, res, next) => {
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

// Expire stale duels every 5 minutes and refund stakes
setInterval(async () => {
  try {
    var expired = expireOldDuels();
    for (var d of expired) {
      // Refund creator stake only if they actually paid
      if (d.creator_wallet && d.stake > 0 && d.creator_tx) {
        try {
          await refundDuel(d.creator_wallet, d.stake);
          console.log('Duel ' + d.id.slice(0, 8) + '... expired — refunded ' + d.stake + ' QF to creator ' + d.creator_wallet.slice(0, 8) + '...');
        } catch (e) { console.error('Duel refund failed for creator ' + d.creator_wallet.slice(0, 8) + '...:', e.message); }
      }
      // Refund opponent stake only if they actually paid
      if (d.status === 'accepted' && d.opponent_wallet && d.stake > 0 && d.acceptor_tx) {
        try {
          await refundDuel(d.opponent_wallet, d.stake);
          console.log('Duel ' + d.id.slice(0, 8) + '... expired — refunded ' + d.stake + ' QF to opponent ' + d.opponent_wallet.slice(0, 8) + '...');
        } catch (e) { console.error('Duel refund failed for opponent ' + d.opponent_wallet.slice(0, 8) + '...:', e.message); }
      }
      // Edit channel broadcast if one was posted
      if (d.broadcast_message_id) {
        try {
          const { editDuelBroadcastExpired } = await import('./telegram.mjs');
          editDuelBroadcastExpired(d.broadcast_message_id, d);
        } catch (e) { /* must never block */ }
      }
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
