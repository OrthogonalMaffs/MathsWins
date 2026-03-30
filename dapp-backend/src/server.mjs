import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDb } from './db/index.mjs';
import apiRoutes from './routes/api.mjs';
import { registerAllGames } from './games/index.mjs';
import { startListener } from './chain-listener.mjs';

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

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/dapp', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Start ───────────────────────────────────────────────────────────────────
const db = getDb(); // initialise DB + run schema
console.log('Database initialised');

registerAllGames();
console.log('Game banks loaded');

startListener();
console.log('Chain listener started');

app.listen(PORT, '127.0.0.1', () => {
  console.log(`MathsWins dApp backend listening on port ${PORT}`);
});
