import { Router } from 'express';
import { getLeaderboard, getEntry, getPaidGames } from '../db/index.mjs';
import { startSession, evaluate, getCurrentWeekId } from '../scoring.mjs';
import { ethers } from 'ethers';
import { getDb } from '../db/index.mjs';

const router = Router();

// ── Middleware: extract wallet from signed message ──────────────────────────
function requireWallet(req, res, next) {
  const wallet = req.headers['x-wallet-address'];
  if (!wallet || !ethers.isAddress(wallet)) {
    return res.status(401).json({ error: 'Wallet address required' });
  }
  req.wallet = wallet.toLowerCase();
  next();
}

// ── Leaderboard ─────────────────────────────────────────────────────────────

router.get('/leaderboard/:gameId', (req, res) => {
  const weekId = parseInt(req.query.weekId) || getCurrentWeekId();
  const board = getLeaderboard(req.params.gameId, weekId);
  res.json({ weekId, leaderboard: board });
});

router.get('/leaderboard/:gameId/:weekId', (req, res) => {
  const board = getLeaderboard(req.params.gameId, parseInt(req.params.weekId));
  res.json({ weekId: parseInt(req.params.weekId), leaderboard: board });
});

// ── Pot info (reads from chain via provider) ────────────────────────────────

router.get('/pot/:gameId', async (req, res) => {
  try {
    const weekId = getCurrentWeekId();
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as entries FROM entries WHERE game_id = ? AND week_id = ?')
      .get(req.params.gameId, weekId);
    // TODO: read pot balance from PrizePot contract once deployed
    res.json({ gameId: req.params.gameId, weekId, pot: '0', entries: row ? row.entries : 0 });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read pot' });
  }
});

// ── Game session ────────────────────────────────────────────────────────────

router.post('/session/start', requireWallet, (req, res) => {
  try {
    const { gameId } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });

    const weekId = getCurrentWeekId();
    const result = startSession(req.wallet, gameId, weekId);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/session/evaluate', (req, res) => {
  try {
    const { sessionToken, answer } = req.body;
    if (!sessionToken) return res.status(400).json({ error: 'sessionToken required' });

    const result = evaluate(sessionToken, answer);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Entry status ────────────────────────────────────────────────────────────

router.get('/entry/:gameId', requireWallet, (req, res) => {
  const weekId = parseInt(req.query.weekId) || getCurrentWeekId();
  const entry = getEntry(req.wallet, req.params.gameId, weekId);
  res.json({
    entered: !!entry,
    tier: entry ? entry.tier : 0,
    weekId
  });
});

// ── Games list ──────────────────────────────────────────────────────────────

router.get('/games', (req, res) => {
  const games = getPaidGames();
  const weekId = getCurrentWeekId();
  res.json({ weekId, games });
});

// ── Week info ───────────────────────────────────────────────────────────────

router.get('/week', (req, res) => {
  const weekId = getCurrentWeekId();
  // Calculate time until Sunday 23:59 UTC
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const sunday = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday,
    23, 59, 59
  ));
  const secondsRemaining = Math.max(0, Math.floor((sunday - now) / 1000));

  res.json({ weekId, secondsRemaining, settlesAt: sunday.toISOString() });
});

export default router;
