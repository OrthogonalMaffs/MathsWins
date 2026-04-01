import { Router } from 'express';
import crypto from 'crypto';
import { getLeaderboard, getEntry, getPaidGames } from '../db/index.mjs';
import { createDuel, getDuelByCode, getDuelById, updateDuelCreatorScore, acceptDuel, updateDuelOpponentScore, completeDuel, expireOldDuels, getDuelsByWallet } from '../db/index.mjs';
import { startSession, startFreeSession, evaluate, getCurrentWeekId } from '../scoring.mjs';
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

// Optional wallet — allows free play without a connected wallet
function optionalWallet(req, res, next) {
  const wallet = req.headers['x-wallet-address'];
  if (wallet && ethers.isAddress(wallet)) {
    req.wallet = wallet.toLowerCase();
  } else {
    req.wallet = null;
  }
  next();
}

router.post('/session/start', optionalWallet, (req, res) => {
  try {
    const { gameId } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });

    const weekId = getCurrentWeekId();

    // Free play: no wallet or no on-chain entry — guest session
    if (!req.wallet) {
      const result = startFreeSession(gameId, weekId);
      return res.json(result);
    }

    // Check for paid entry
    const entry = getEntry(req.wallet, gameId, weekId);
    if (!entry) {
      // Wallet connected but no entry — allow free play anyway
      const result = startFreeSession(gameId, weekId);
      return res.json(result);
    }

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

// ── Duel Endpoints ────────────────────────────────────────────────────

// Generate 6-char alphanumeric share code
function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) code += chars[bytes[i] % chars.length];
  return code;
}

// Create a duel
router.post('/duel/create', async (req, res) => {
  const wallet = req.headers['x-wallet-address'];
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });

  const { gameId, difficulty } = req.body;
  if (!gameId) return res.status(400).json({ error: 'gameId required' });

  // Generate unique seed for this duel (not the daily seed)
  const puzzleSeed = Date.now() ^ (Math.random() * 0xFFFFFFFF >>> 0);

  // Generate unique share code
  let shareCode, existing;
  for (let i = 0; i < 10; i++) {
    shareCode = generateShareCode();
    existing = getDuelByCode(shareCode);
    if (!existing) break;
  }
  if (existing) return res.status(500).json({ error: 'Could not generate unique code' });

  const id = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

  createDuel(id, gameId, puzzleSeed, difficulty || 'medium', wallet, shareCode, now, expiresAt);

  res.json({ duelId: id, shareCode, puzzleSeed, expiresAt });
});

// Get duel status by share code
router.get('/duel/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const duel = getDuelByCode(code);
  if (!duel) return res.status(404).json({ error: 'Duel not found' });

  // Never expose puzzle seed to opponent before they accept
  const safe = { ...duel };
  const wallet = req.headers['x-wallet-address'];
  if (wallet && wallet.toLowerCase() !== duel.creator_wallet.toLowerCase() && duel.status === 'created') {
    delete safe.puzzle_seed;
  }

  res.json(safe);
});

// Accept a duel (opponent joins)
router.post('/duel/:code/accept', (req, res) => {
  const wallet = req.headers['x-wallet-address'];
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });

  const code = req.params.code.toUpperCase();
  const duel = getDuelByCode(code);
  if (!duel) return res.status(404).json({ error: 'Duel not found' });
  if (duel.status === 'expired' || duel.expires_at < Date.now()) return res.status(410).json({ error: 'Duel expired' });
  if (duel.status === 'completed') return res.status(410).json({ error: 'Duel already completed' });
  if (wallet.toLowerCase() === duel.creator_wallet.toLowerCase()) return res.status(400).json({ error: 'Cannot duel yourself' });
  if (duel.opponent_wallet && duel.opponent_wallet.toLowerCase() !== wallet.toLowerCase()) {
    return res.status(403).json({ error: 'Duel already accepted by another player' });
  }

  if (duel.status === 'created') {
    acceptDuel(duel.id, wallet);
  }

  res.json({ duelId: duel.id, puzzleSeed: duel.puzzle_seed, gameId: duel.game_id, difficulty: duel.difficulty });
});

// Submit duel score (both creator and opponent use this)
router.post('/duel/:code/submit', (req, res) => {
  const wallet = req.headers['x-wallet-address'];
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });

  const code = req.params.code.toUpperCase();
  const duel = getDuelByCode(code);
  if (!duel) return res.status(404).json({ error: 'Duel not found' });
  if (duel.status === 'expired') return res.status(410).json({ error: 'Duel expired' });

  const { score, timeMs, mistakes, hints } = req.body;
  if (score == null) return res.status(400).json({ error: 'score required' });

  const isCreator = wallet.toLowerCase() === duel.creator_wallet.toLowerCase();
  const isOpponent = duel.opponent_wallet && wallet.toLowerCase() === duel.opponent_wallet.toLowerCase();

  if (!isCreator && !isOpponent) return res.status(403).json({ error: 'Not a participant in this duel' });

  if (isCreator) {
    if (duel.creator_score != null) return res.status(400).json({ error: 'Score already submitted' });
    updateDuelCreatorScore(duel.id, score, timeMs, mistakes, hints);
  } else {
    if (duel.opponent_score != null) return res.status(400).json({ error: 'Score already submitted' });
    updateDuelOpponentScore(duel.id, score, timeMs, mistakes, hints);
  }

  // Refresh duel state and check if both have submitted
  const updated = getDuelById(duel.id);
  if (updated.creator_score != null && updated.opponent_score != null) {
    let winner = null;
    if (updated.creator_score > updated.opponent_score) winner = updated.creator_wallet;
    else if (updated.opponent_score > updated.creator_score) winner = updated.opponent_wallet;
    // null winner = draw
    completeDuel(duel.id, winner);
    const final = getDuelById(duel.id);
    return res.json({ status: 'completed', duel: final });
  }

  res.json({ status: 'waiting', message: 'Waiting for opponent to finish' });
});

// Get duel history for a wallet
router.get('/duels/history', (req, res) => {
  const wallet = req.headers['x-wallet-address'];
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });
  const duels = getDuelsByWallet(wallet, 20);
  res.json(duels);
});

export default router;
