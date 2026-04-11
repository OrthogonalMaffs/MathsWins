import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getLeaderboard, getEntry, getPaidGames } from '../db/index.mjs';
import { createDuel, getDuelByCode, getDuelById, updateDuelCreatorScore, acceptDuel, updateDuelOpponentScore, completeDuel, expireOldDuels, getDuelsByWallet, getActiveDuelCount } from '../db/index.mjs';
import { createLeague, getLeagueById, getActiveLeagues, getAllLeagues, updateLeagueStatus, startLeague, settleLeague, cancelLeague, addLeaguePlayer, getLeaguePlayers, getLeaguePlayerCount, isLeaguePlayer, markRefunded, addLeaguePuzzle, getLeaguePuzzles, addLeagueScore, getLeagueScore, getLeagueScoresByWallet, getLeagueLeaderboard, addLeaguePrize, getLeaguePrizes, getPlayerPuzzleOrder, setPlayerPuzzleOrder, addLeagueRefund, getPendingRefunds, getFailedRefunds, getLeagueRefunds, updateRefundStatus, cancelLeagueWithReason, forceSettleLeague, getLeaguesByWallet, getOpenAndActiveLeagues, getRecentlySettledLeagues } from '../db/index.mjs';
import { createPromoChallenge, getPromoByCode, getPromoById, getPromoClaim, addPromoClaim, getPromoClaims } from '../db/index.mjs';
import { startSession, startFreeSession, evaluate, getCurrentWeekId, resumeSession } from '../scoring.mjs';
import { ethers } from 'ethers';
import { signatureVerify, decodeAddress } from '@polkadot/util-crypto';
import { getDb } from '../db/index.mjs';
import { doSettleLeague, checkEarlySettlement, recoverStuckLeagues, mintCommemorative } from '../league-settle.mjs';
import { checkAchievements } from '../achievement-checker.mjs';
import { sendQF, settleDuel, BURN_ADDRESS, TEAM_WALLET } from '../escrow.mjs';
import { createBattleshipsGame, getBattleshipsGameByCode, getBattleshipsGameById, updateBattleshipsGameStatus, saveBattleshipsPlacement, getBattleshipsPlacement, getBattleshipsPlacements, addBattleshipsRound, getBattleshipsRounds, getBattleshipsRecord, updateBattleshipsRecord, getActiveBattleshipsGames, getBattleshipsGamesByWallet } from '../db/index.mjs';
import { getAchievementRegistry, getAchievement, awardAchievement, getWalletAchievements, getAllAchievements, getGlobalRecord, getPersonalBests, getLeagueBests, getWalletStats, getWalletLeagueHistory, getWalletTrophies, getGameStateForLeaguePuzzle, getFlaggedSessions, getGlobalLeaderboard, getGlobalLeaderboardEntry, addGlobalLeaderboardEntry, getWalletLeaderboardPositions, getGameState, getGame, upsertPersonalBest } from '../db/index.mjs';
import { analyseInputPattern } from '../scoring.mjs';
import { validateFleet, calculateRange, checkHit, checkSunk, checkWin, getGameState as getBattleshipsState, cpuPlaceFleet, cpuShootRecruit, cpuShootOfficer, cpuShootAdmiral, pickSurvivingShip, FLEET } from '../games/battleships.mjs';

const router = Router();
const AUTH_SECRET = process.env.AUTH_JWT_SECRET || 'dev-auth-secret-change-me';

// ── Challenge/Verify nonce store (in-memory, 5-minute TTL) ──────────────────
const challengeStore = new Map();
const CHALLENGE_TTL = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [nonce, entry] of challengeStore) {
    if (now - entry.created > CHALLENGE_TTL) challengeStore.delete(nonce);
  }
}, 60 * 1000);

// ── Auth endpoints ──────────────────────────────────────────────────────────
router.post('/auth/challenge', (req, res) => {
  const nonce = crypto.randomBytes(32).toString('hex');
  challengeStore.set(nonce, { created: Date.now() });
  res.json({ challenge: 'Sign this message to verify your wallet on MathsWins: ' + nonce, nonce });
});

router.post('/auth/verify', (req, res) => {
  const { signature, wallet, nonce } = req.body;
  if (!signature || !wallet || !nonce) return res.status(400).json({ error: 'signature, wallet, and nonce required' });

  const entry = challengeStore.get(nonce);
  if (!entry) return res.status(400).json({ error: 'Invalid or expired challenge' });
  if (Date.now() - entry.created > CHALLENGE_TTL) {
    challengeStore.delete(nonce);
    return res.status(400).json({ error: 'Challenge expired' });
  }

  const message = 'Sign this message to verify your wallet on MathsWins: ' + nonce;

  if (wallet.startsWith('0x')) {
    // EVM path
    let recovered;
    try {
      recovered = ethers.verifyMessage(message, signature);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      return res.status(403).json({ error: 'Signature does not match wallet' });
    }
    challengeStore.delete(nonce);
    const token = jwt.sign({ wallet: wallet.toLowerCase() }, AUTH_SECRET, { expiresIn: '24h' });
    res.json({ token, wallet: wallet.toLowerCase() });
  } else {
    // Substrate path
    try {
      const publicKey = decodeAddress(wallet);
      const result = signatureVerify(message, signature, publicKey);
      if (!result.isValid) {
        return res.status(403).json({ error: 'Signature does not match wallet' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid Substrate signature or address' });
    }
    challengeStore.delete(nonce);
    const token = jwt.sign({ wallet: wallet }, AUTH_SECRET, { expiresIn: '24h' });
    res.json({ token, wallet: wallet });
  }
});

// ── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required — connect your wallet' });
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), AUTH_SECRET);
    req.wallet = payload.wallet;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired authentication — reconnect your wallet' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), AUTH_SECRET);
      req.wallet = payload.wallet;
    } catch (e) {
      req.wallet = null;
    }
  } else {
    req.wallet = null;
  }
  next();
}

function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// Legacy middleware — kept for read-only endpoints that don't need auth
function requireWallet(req, res, next) {
  if (req.wallet) return next();
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

// Optional wallet — tries JWT first, falls back to header, allows free play without either
function optionalWallet(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), AUTH_SECRET);
      req.wallet = payload.wallet;
      return next();
    } catch (e) { /* invalid JWT, fall through */ }
  }
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
    const { gameId, seed, leagueId, difficulty } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });

    const weekId = getCurrentWeekId();

    // Build context opts for persistent sessions
    const opts = { seed: seed != null ? seed : undefined, difficulty: difficulty || undefined };

    // League mode: server resolves the next puzzle — client never sees seeds
    if (leagueId && req.wallet) {
      const league = getLeagueById(leagueId);
      if (!league) return res.status(404).json({ error: 'League not found' });
      if (!isLeaguePlayer(league.id, req.wallet)) return res.status(403).json({ error: 'Not a league participant' });

      const puzzles = getLeaguePuzzles(league.id);
      const myScores = getLeagueScoresByWallet(league.id, req.wallet);
      const completedSet = new Set(myScores.map(s => s.puzzle_index));

      // Get or generate puzzle order
      var order = getPlayerPuzzleOrder(league.id, req.wallet);
      if (!order) {
        order = shuffleArray([...Array(puzzles.length).keys()]);
        var done = order.filter(i => completedSet.has(i));
        var remaining = order.filter(i => !completedSet.has(i));
        order = done.concat(remaining);
        setPlayerPuzzleOrder(league.id, req.wallet, order);
      }

      // Find next unplayed puzzle in this player's order
      var nextIdx = null;
      for (var i = 0; i < order.length; i++) {
        if (!completedSet.has(order[i])) { nextIdx = order[i]; break; }
      }
      if (nextIdx === null) return res.status(400).json({ error: 'All puzzles completed' });

      // Look up the seed server-side
      var puzzleRow = puzzles.find(p => p.puzzle_index === nextIdx);
      if (!puzzleRow) return res.status(400).json({ error: 'Puzzle not found' });

      opts.contextType = 'league';
      opts.contextId = leagueId;
      opts.puzzleIndex = nextIdx;
      opts.wallet = req.wallet;
      opts.seed = puzzleRow.puzzle_seed;

      // Minesweeper league difficulty: Bronze = intermediate, Silver = advanced
      if (gameId === 'minesweeper' && league.tier) {
        if (league.tier === 'silver') opts.difficulty = 'advanced';
        else opts.difficulty = 'intermediate';
      }

      // KenKen league difficulty: Bronze = hard, Silver = expert
      if (gameId === 'kenken' && league.tier) {
        if (league.tier === 'silver') opts.difficulty = 'expert';
        else opts.difficulty = 'hard';
      }

      const result = startFreeSession(gameId, weekId, opts);
      result.puzzleIndex = nextIdx;
      result.puzzleSequence = order.indexOf(nextIdx) + 1;
      result.totalPuzzles = puzzles.length;
      return res.json(result);
    }

    // Non-league: free play or paid entry
    if (!req.wallet) {
      const result = startFreeSession(gameId, weekId, opts);
      return res.json(result);
    }

    const entry = getEntry(req.wallet, gameId, weekId);
    if (!entry) {
      const result = startFreeSession(gameId, weekId, opts);
      return res.json(result);
    }

    const result = startSession(req.wallet, gameId, weekId);
    res.json(result);
  } catch (e) {
    if (e.message === 'ACTIVE_SESSION_EXISTS') {
      return res.status(409).json({ error: 'ACTIVE_SESSION_EXISTS', message: 'Use /session/resume instead' });
    }
    res.status(400).json({ error: e.message });
  }
});

// Resume an existing persistent session (league puzzle after refresh/restart)
router.post('/session/resume', optionalWallet, (req, res) => {
  try {
    if (!req.wallet) return res.status(401).json({ error: 'Wallet required' });
    const { contextType, contextId, puzzleIndex } = req.body;
    if (!contextType || contextId == null) return res.status(400).json({ error: 'contextType and contextId required' });

    // For league resume, find the active puzzle index if not provided
    var pIdx = puzzleIndex != null ? puzzleIndex : null;
    if (contextType === 'league' && pIdx === null) {
      const db = getDb();
      const active = db.prepare(`SELECT puzzle_index FROM active_game_state WHERE wallet = ? AND context_type = 'league' AND context_id = ? AND status = 'active' LIMIT 1`)
        .get(req.wallet.toLowerCase(), contextId);
      if (active) pIdx = active.puzzle_index;
    }

    const result = resumeSession(req.wallet, contextType, contextId, pIdx);
    if (!result) return res.json({ exists: false });
    res.json({ exists: true, ...result });
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

// ── Free play score submission (client-reported, no server validation) ───────
router.post('/session/submit-freeplay', optionalWallet, (req, res) => {
  try {
    if (!req.wallet) return res.status(401).json({ error: 'Wallet required' });
    var { gameId, score, timeMs, difficulty } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });
    if (score === undefined || score === null) return res.status(400).json({ error: 'score required' });

    var game = getGame(gameId);
    if (!game) return res.status(400).json({ error: 'Unknown game: ' + gameId });

    score = Number(score) || 0;
    timeMs = Number(timeMs) || 0;
    var diff = difficulty || 'default';

    upsertPersonalBest(req.wallet, gameId, diff, score, timeMs);

    var awarded = [];
    try {
      awarded = checkAchievements(req.wallet, {
        type: 'session_complete',
        gameId: gameId,
        score: score,
        timeMs: timeMs,
        won: score > 0,
        mistakes: 0,
        hints: 0,
        undoCount: 0,
        moveCount: 0,
        finalScores: null,
        openingCards: null,
        remaining: null,
        cleared: null,
        maxHandScore: 0,
        maxHandBreakdown: null,
      });
    } catch (e) { /* achievement check must never block */ }

    res.json({ success: true, achievements: awarded });
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
router.post('/duel/create', optionalWallet, async (req, res) => {
  const wallet = req.wallet;

  const { gameId, difficulty, stake } = req.body;
  if (!gameId) return res.status(400).json({ error: 'gameId required' });

  // Validate stake
  const stakeAmount = parseInt(stake) || 25;
  if (stakeAmount < 25) return res.status(400).json({ error: 'Minimum stake is 25 QF' });

  // Check active duel cap (max 5 unaccepted duels per wallet)
  const activeCount = getActiveDuelCount(wallet);
  if (activeCount >= 5) return res.status(400).json({ error: 'Maximum 5 active duels. Wait for existing duels to be accepted or expire.' });

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

  createDuel(id, gameId, puzzleSeed, difficulty || 'medium', stakeAmount, wallet, shareCode, now, expiresAt);

  res.json({ duelId: id, shareCode, puzzleSeed, stake: stakeAmount, expiresAt });
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
router.post('/duel/:code/accept', optionalWallet, (req, res) => {
  const wallet = req.wallet;

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
router.post('/duel/:code/submit', optionalWallet, (req, res) => {
  const wallet = req.wallet;

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
    completeDuel(duel.id, winner);
    const final = getDuelById(duel.id);

    // Calculate settlement
    const totalPot = (final.stake || 25) * 2;
    const burnAmount = Math.floor(totalPot * 0.05);
    const teamAmount = Math.floor(totalPot * 0.05);
    const prizePool = totalPot - burnAmount - teamAmount;
    let settlement;
    if (winner) {
      settlement = { winner: winner, winnerPrize: prizePool, burn: burnAmount, team: teamAmount };
    } else {
      // Draw — split evenly
      const half = Math.floor(prizePool / 2);
      settlement = { winner: null, creatorPrize: half, opponentPrize: half, burn: burnAmount, team: teamAmount };
    }

    return res.json({ status: 'completed', duel: final, settlement });
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

// ── Promo Challenge Endpoints ─────────────────────────────────────────

// Look up a promo code (used by the lobby duel code input)
router.get('/promo/:code', (req, res) => {
  const code = req.params.code.toUpperCase().replace(/^#/, '');
  const promo = getPromoByCode(code);
  if (!promo) return res.status(404).json({ error: 'Promo not found' });

  const wallet = req.headers['x-wallet-address'];
  const existingClaim = wallet ? getPromoClaim(promo.id, wallet) : null;
  const alreadyWon = existingClaim ? !!existingClaim.won : false;
  const attemptsUsed = existingClaim ? (existingClaim.won ? 2 : 1) : 0;
  const spotsLeft = promo.max_claims - promo.claims_count;

  res.json({
    id: promo.id,
    code: promo.code,
    game_id: promo.game_id,
    puzzle_seed: promo.puzzle_seed,
    creator_score: promo.creator_score,
    prize_per_win: promo.prize_per_win,
    max_claims: promo.max_claims,
    claims_count: promo.claims_count,
    spots_left: spotsLeft,
    active: promo.active && spotsLeft > 0,
    already_claimed: alreadyWon,
    attempts_used: attemptsUsed,
    can_retry: existingClaim && !existingClaim.won && attemptsUsed < 2
  });
});

// Submit a promo challenge score
router.post('/promo/:code/submit', (req, res) => {
  const wallet = req.headers['x-wallet-address'];
  if (!wallet) return res.status(401).json({ error: 'Wallet required to claim prizes' });

  const code = req.params.code.toUpperCase().replace(/^#/, '');
  const promo = getPromoByCode(code);
  if (!promo) return res.status(404).json({ error: 'Promo not found' });

  if (!promo.active) return res.status(400).json({ error: 'Promo is no longer active' });
  if (promo.claims_count >= promo.max_claims) return res.status(400).json({ error: 'All prizes have been claimed' });

  // Check previous attempts — allow retry if first attempt was a loss (max 2 attempts)
  const existing = getPromoClaim(promo.id, wallet);
  if (existing && existing.won) return res.status(400).json({ error: 'You already won this challenge' });

  const { score, attempt } = req.body;
  if (score == null) return res.status(400).json({ error: 'score required' });

  const won = score > promo.creator_score;

  if (existing) {
    // Second attempt — update the existing claim
    const db = getDb();
    db.prepare('UPDATE promo_claims SET score = ?, won = ?, claimed_at = ? WHERE promo_id = ? AND wallet = ?')
      .run(score, won ? 1 : 0, Date.now(), promo.id, wallet.toLowerCase());
    if (won) {
      db.prepare('UPDATE promo_challenges SET claims_count = claims_count + 1 WHERE id = ?').run(promo.id);
    }
  } else {
    addPromoClaim(promo.id, wallet, score, won, Date.now());
  }

  if (won) {
    res.json({
      won: true,
      message: 'Well done — have a free game on me! Sending ' + promo.prize_per_win + ' QF to your wallet.',
      prize: promo.prize_per_win,
      your_score: score,
      target_score: promo.creator_score
    });
  } else {
    res.json({
      won: false,
      message: 'Not quite — you scored ' + score + ' but needed ' + (promo.creator_score + 1) + ' to win. Try a different promo next time!',
      your_score: score,
      target_score: promo.creator_score
    });
  }
});

// Create a promo (admin — requires specific wallet)
router.post('/promo/create', (req, res) => {
  const wallet = req.headers['x-wallet-address'];
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });

  const { code, gameId, puzzleSeed, creatorScore, prizePerWin, maxClaims } = req.body;
  if (!code || !gameId || !puzzleSeed || creatorScore == null) {
    return res.status(400).json({ error: 'code, gameId, puzzleSeed, and creatorScore required' });
  }

  const cleanCode = code.toUpperCase().replace(/^#/, '');
  const existingPromo = getPromoByCode(cleanCode);
  if (existingPromo) return res.status(400).json({ error: 'Code already in use' });

  const id = crypto.randomUUID();
  createPromoChallenge(id, cleanCode, gameId, parseInt(puzzleSeed), wallet, parseInt(creatorScore), prizePerWin || 25, maxClaims || 20, Date.now());

  res.json({ id, code: cleanCode, message: 'Promo challenge created' });
});

// ── League Endpoints ──────────────────────────────────────────────────

// Builder whitelist: these wallets can join leagues without payment (testing)
var BUILDER_WHITELIST = new Set(
  (process.env.BUILDER_WALLETS || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean)
);

var LEAGUE_TIERS = {
  bronze: { fee: 100, label: 'Bronze League' },
  silver: { fee: 250, label: 'Silver League' }
};
var PRIZE_SPLITS = [0.50, 0.25, 0.15, 0.10]; // top 4
var BURN_PCT = 0.05;
var TEAM_PCT = 0.05;
var REG_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days
var JOIN_WINDOW_MS = 24 * 60 * 60 * 1000;       // 24 hours after start
var PLAY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;  // 14 days

// ── Player: my leagues (must be before :gameId route) ───────────────

router.get('/leagues/my', optionalWallet, (req, res) => {
  if (!req.wallet) return res.status(401).json({ error: 'Wallet required — connect your wallet' });

  const leagues = getLeaguesByWallet(req.wallet);

  const active = [];
  const upcoming = [];
  const completed = [];

  for (const l of leagues) {
    const playerCount = getLeaguePlayerCount(l.id);
    const entry = { ...l, player_count: playerCount };

    if (l.status === 'active') {
      const myScores = getLeagueScoresByWallet(l.id, req.wallet);
      entry.puzzles_completed = myScores.length;
      entry.puzzles_total = l.puzzle_count || 10;
      entry.cumulative_score = myScores.reduce(function(sum, s) { return sum + s.score; }, 0);
      active.push(entry);
    } else if (l.status === 'registration') {
      upcoming.push(entry);
    } else {
      completed.push(entry);
    }
  }

  res.json({ active, upcoming, completed });
});

// ── Player: all active/open leagues (must be before :gameId route) ──

router.get('/leagues/active', (req, res) => {
  const gameId = req.query.gameId || null;
  const leagues = getOpenAndActiveLeagues(gameId);
  const result = leagues.map(function(l) {
    var playerCount = getLeaguePlayerCount(l.id);
    return { ...l, player_count: playerCount };
  });
  res.json(result);
});

// ── Player: recently settled leagues (must be before :gameId route) ─

router.get('/leagues/settled', (req, res) => {
  const gameId = req.query.gameId || null;
  const limit = parseInt(req.query.limit) || 20;
  const leagues = getRecentlySettledLeagues(gameId, limit);
  const result = leagues.map(function(l) {
    var playerCount = getLeaguePlayerCount(l.id);
    var leaderboard = getLeagueLeaderboard(l.id).slice(0, 3);
    var prizes = getLeaguePrizes(l.id);
    return { ...l, player_count: playerCount, top3: leaderboard, prizes };
  });
  res.json(result);
});

// List active leagues for a game
router.get('/leagues/:gameId', (req, res) => {
  const wallet = req.headers['x-wallet-address'];
  const leagues = getActiveLeagues(req.params.gameId);
  const result = leagues.map(l => {
    const playerCount = getLeaguePlayerCount(l.id);
    const is_player = wallet ? !!isLeaguePlayer(l.id, wallet) : false;
    return { ...l, player_count: playerCount, is_player };
  });
  res.json(result);
});

// List all leagues (including settled) for a game
router.get('/leagues/:gameId/all', (req, res) => {
  const leagues = getAllLeagues(req.params.gameId);
  const result = leagues.map(l => {
    const playerCount = getLeaguePlayerCount(l.id);
    return { ...l, player_count: playerCount };
  });
  res.json(result);
});

// Get single league details
router.get('/league/:leagueId', optionalWallet, (req, res) => {
  const league = getLeagueById(req.params.leagueId);
  if (!league) return res.status(404).json({ error: 'League not found' });

  const playerCount = getLeaguePlayerCount(league.id);
  const players = getLeaguePlayers(league.id);
  const wallet = req.wallet || req.headers['x-wallet-address'];
  const isPlayer = wallet ? !!isLeaguePlayer(league.id, wallet) : false;

  // Leaderboard: only show if join window closed
  let leaderboard = [];
  if (league.join_closes_at && Date.now() > league.join_closes_at) {
    leaderboard = getLeagueLeaderboard(league.id);
  }

  // Prizes if settled
  const prizes = league.status === 'settled' ? getLeaguePrizes(league.id) : [];

  res.json({
    ...league,
    player_count: playerCount,
    players: players.map(p => ({ wallet: p.wallet, joined_at: p.joined_at })),
    is_player: isPlayer,
    leaderboard,
    prizes
  });
});

// Join a league
router.post('/league/:leagueId/join', optionalWallet, (req, res) => {
  const wallet = req.wallet;

  const league = getLeagueById(req.params.leagueId);
  if (!league) return res.status(404).json({ error: 'League not found' });

  const now = Date.now();

  // Check if registration or late join window
  const inRegistration = league.status === 'registration' && now <= league.reg_closes_at;
  const inLateJoin = league.status === 'active' && league.join_closes_at && now <= league.join_closes_at;
  if (!inRegistration && !inLateJoin) {
    return res.status(400).json({ error: 'League is not accepting entries' });
  }

  // Check capacity
  const count = getLeaguePlayerCount(league.id);
  if (count >= league.max_players) return res.status(400).json({ error: 'League is full' });

  // Check not already joined
  if (isLeaguePlayer(league.id, wallet)) return res.status(400).json({ error: 'Already joined this league' });

  const isBuilder = BUILDER_WHITELIST.has(wallet.toLowerCase());
  const { txHash } = req.body;
  if (!isBuilder && !txHash) {
    return res.status(400).json({ error: 'Payment transaction hash required' });
  }
  addLeaguePlayer(league.id, wallet, isBuilder ? 'builder-whitelist' : txHash, now);

  const newCount = getLeaguePlayerCount(league.id);

  // Auto-start if hit min or max during registration
  if (league.status === 'registration' && newCount >= (league.min_players || 4)) {
    activateLeague(league);
    autoCreateLeague(league);
  }

  res.json({ joined: true, player_count: newCount });
});

// Get league puzzles (only if player and league active)
router.get('/league/:leagueId/puzzles', optionalWallet, (req, res) => {
  const wallet = req.wallet;

  const league = getLeagueById(req.params.leagueId);
  if (!league) return res.status(404).json({ error: 'League not found' });
  if (league.status !== 'active' && league.status !== 'settled') {
    return res.status(400).json({ error: 'League not yet started' });
  }
  if (!isLeaguePlayer(league.id, wallet)) {
    return res.status(403).json({ error: 'Not a league participant' });
  }

  const puzzles = getLeaguePuzzles(league.id);
  const myScores = getLeagueScoresByWallet(league.id, wallet);
  const scoreMap = {};
  myScores.forEach(s => { scoreMap[s.puzzle_index] = s; });

  // Get or generate this player's random puzzle order
  var order = getPlayerPuzzleOrder(league.id, wallet);
  if (!order) {
    order = shuffleArray([...Array(puzzles.length).keys()]);
    // For existing players, put already-completed puzzles first in order
    var completed = new Set(myScores.map(s => s.puzzle_index));
    var done = order.filter(i => completed.has(i));
    var remaining = order.filter(i => !completed.has(i));
    order = done.concat(remaining);
    setPlayerPuzzleOrder(league.id, wallet, order);
  }

  // Build result: completed puzzles show scores, next puzzle is playable, rest hidden
  var nextFound = false;
  var result = order.map(function(puzzleIdx, seqNum) {
    var isCompleted = !!scoreMap[puzzleIdx];
    var entry = {
      sequence: seqNum + 1,
      puzzle_index: puzzleIdx,
      completed: isCompleted,
      score: isCompleted ? scoreMap[puzzleIdx].score : null
    };
    if (!isCompleted && !nextFound) {
      entry.playable = true;
      nextFound = true;
    }
    // If settled league, show all as completed/missed
    if (league.status === 'settled') {
      entry.playable = false;
    }
    return entry;
  });

  res.json(result);
});

// Submit a league puzzle score
router.post('/league/:leagueId/submit', optionalWallet, (req, res) => {
  const wallet = req.wallet;

  const league = getLeagueById(req.params.leagueId);
  if (!league) return res.status(404).json({ error: 'League not found' });
  if (league.status !== 'active') return res.status(400).json({ error: 'League not active' });
  if (league.play_closes_at && Date.now() > league.play_closes_at) {
    return res.status(400).json({ error: 'Play window has closed' });
  }
  if (!isLeaguePlayer(league.id, wallet)) {
    return res.status(403).json({ error: 'Not a league participant' });
  }

  const { puzzleIndex, score, timeMs, mistakes, hints } = req.body;
  if (puzzleIndex == null || score == null) {
    return res.status(400).json({ error: 'puzzleIndex and score required' });
  }

  // Check puzzle exists
  const puzzles = getLeaguePuzzles(league.id);
  if (puzzleIndex < 0 || puzzleIndex >= puzzles.length) {
    return res.status(400).json({ error: 'Invalid puzzle index' });
  }

  // Check not already submitted
  const existing = getLeagueScore(league.id, wallet, puzzleIndex);
  if (existing) return res.status(400).json({ error: 'Already submitted this puzzle' });

  // Check for suspicious flags from active_game_state
  var suspicious = null;
  var suspiciousDetail = null;
  var gameState = getGameStateForLeaguePuzzle(wallet, league.id, puzzleIndex);
  if (gameState) {
    var flags = [];
    // Existing flag from evaluator (rapid_input, suspiciously_fast, etc.)
    if (gameState.flagged) flags.push(gameState.flagged);
    // Run pattern analysis on stored placements
    try {
      var placements = JSON.parse(gameState.placements || '[]');
      var patternFlag = analyseInputPattern(placements);
      if (patternFlag) flags.push(patternFlag);
    } catch (e) { /* malformed placements, skip */ }
    if (flags.length > 0) {
      suspicious = 'flagged';
      suspiciousDetail = flags.join(',');
    }
  }

  addLeagueScore(league.id, wallet, puzzleIndex, score, timeMs || 0, mistakes || 0, hints || 0, Date.now(), suspicious, suspiciousDetail);

  // Founding Member check — first league puzzle submission within the window
  try {
    if (process.env.ACHIEVEMENTS_ACTIVE === 'true') {
      var fmStart = process.env.FOUNDING_MEMBER_START;
      var fmEnd = process.env.FOUNDING_MEMBER_END;
      if (fmStart && fmEnd) {
        var now = Date.now();
        var startMs = new Date(fmStart + 'T00:00:00Z').getTime();
        var endMs = new Date(fmEnd + 'T23:59:59Z').getTime();
        if (now >= startMs && now <= endMs) {
          awardAchievement(wallet, 'founding-member');
        }
      }
    }
  } catch (e) { /* achievement check must never block submission */ }

  // Return player's own scores
  const myScores = getLeagueScoresByWallet(league.id, wallet);
  const total = myScores.reduce((sum, s) => sum + s.score, 0);

  res.json({ submitted: true, puzzle_index: puzzleIndex, score, cumulative: total, puzzles_played: myScores.length });

  // Check if all puzzles complete — trigger early settlement
  checkEarlySettlement(league.id);
});

// Get player's own scores in a league (always visible)
router.get('/league/:leagueId/my-scores', optionalWallet, (req, res) => {
  const wallet = req.wallet;

  const league = getLeagueById(req.params.leagueId);
  if (!league) return res.status(404).json({ error: 'League not found' });

  const scores = getLeagueScoresByWallet(league.id, wallet);
  const total = scores.reduce((sum, s) => sum + s.score, 0);
  res.json({ scores, cumulative: total, puzzles_played: scores.length });
});

// ── League lifecycle helpers ──────────────────────────────────────────

function activateLeague(league) {
  const now = Date.now();
  const joinClosesAt = now + JOIN_WINDOW_MS;
  const playClosesAt = now + PLAY_WINDOW_MS;
  const playerCount = getLeaguePlayerCount(league.id);
  const totalPot = playerCount * league.entry_fee;
  const burnAmount = Math.floor(totalPot * BURN_PCT);
  const teamAmount = Math.floor(totalPot * TEAM_PCT);
  const prizePool = totalPot - burnAmount - teamAmount;

  startLeague(league.id, joinClosesAt, playClosesAt, totalPot, prizePool, burnAmount, teamAmount);

  // Generate puzzle seeds (skip if already generated by auto-create)
  const existingPuzzles = getLeaguePuzzles(league.id);
  if (existingPuzzles.length === 0) {
    for (let i = 0; i < league.puzzle_count; i++) {
      const seed = (now + i * 7919) ^ (Math.random() * 0xFFFFFFFF >>> 0);
      addLeaguePuzzle(league.id, i, seed);
    }
  }
}

// Recalculate pot when late joiner enters (called from join endpoint indirectly via league check timer)
function recalculateLeaguePot(leagueId) {
  const league = getLeagueById(leagueId);
  if (!league || league.status !== 'active') return;
  const playerCount = getLeaguePlayerCount(leagueId);
  const totalPot = playerCount * league.entry_fee;
  const burnAmount = Math.floor(totalPot * BURN_PCT);
  const teamAmount = Math.floor(totalPot * TEAM_PCT);
  const prizePool = totalPot - burnAmount - teamAmount;
  const db = getDb();
  db.prepare('UPDATE leagues SET total_pot = ?, prize_pool = ?, burn_amount = ?, team_amount = ? WHERE id = ?')
    .run(totalPot, prizePool, burnAmount, teamAmount, leagueId);
}

// ── Refund processing ───────────────────────────────────────────────

async function processLeagueRefunds(leagueId) {
  const league = getLeagueById(leagueId);
  if (!league) return;

  const players = getLeaguePlayers(leagueId);
  const now = Date.now();

  // Insert refund rows for paid players
  for (const p of players) {
    if (p.tx_hash === 'builder-whitelist') continue;
    // Check if refund already exists for this player/league
    const existing = getLeagueRefunds(leagueId);
    const alreadyQueued = existing.find(r => r.wallet === p.wallet.toLowerCase());
    if (alreadyQueued) continue;
    addLeagueRefund(leagueId, p.wallet, league.entry_fee, now);
  }

  // Process pending refunds
  const pending = getPendingRefunds().filter(r => r.league_id === leagueId);
  for (const refund of pending) {
    try {
      const txHash = await sendQF(refund.wallet, refund.amount_qf);
      if (txHash) {
        updateRefundStatus(refund.id, 'sent', txHash, null);
        markRefunded(leagueId, refund.wallet);
        console.log('Refunded ' + refund.amount_qf + ' QF to ' + refund.wallet.slice(0, 8) + '... tx: ' + txHash);
      } else {
        updateRefundStatus(refund.id, 'failed', null, 'sendQF returned null');
        console.error('Refund failed for ' + refund.wallet.slice(0, 8) + '...: sendQF returned null');
      }
    } catch (e) {
      updateRefundStatus(refund.id, 'failed', null, e.message);
      console.error('Refund failed for ' + refund.wallet.slice(0, 8) + '...:', e.message);
    }
  }
}

// ── Auto-create successor league ────────────────────────────────────

// Games eligible for league auto-creation
var LEAGUE_GAMES = new Set(['sudoku-duel', 'kenken', 'kakuro', 'nonogram', 'cryptarithmetic-club', 'countdown-numbers']);

function autoCreateLeague(triggeredByLeague) {
  if (!LEAGUE_GAMES.has(triggeredByLeague.game_id)) return;
  const db = getDb();
  // Check if an OPEN league already exists for this game+tier
  const existing = db.prepare("SELECT id FROM leagues WHERE game_id = ? AND tier = ? AND status = 'registration'")
    .get(triggeredByLeague.game_id, triggeredByLeague.tier);
  if (existing) return;

  const now = Date.now();
  const id = crypto.randomUUID();
  const regClosesAt = now + REG_WINDOW_MS;

  createLeague(id, triggeredByLeague.game_id, triggeredByLeague.tier, triggeredByLeague.entry_fee,
    triggeredByLeague.puzzle_count || 10, now, regClosesAt, now);

  // Set auto_created_by
  db.prepare('UPDATE leagues SET auto_created_by = ? WHERE id = ?').run(triggeredByLeague.id, id);

  // Generate 10 puzzle seeds
  for (var i = 0; i < 10; i++) {
    var seed = (now + i * 7919) ^ (Math.random() * 0xFFFFFFFF >>> 0);
    addLeaguePuzzle(id, i, seed);
  }

  console.log('Auto-created league ' + id.slice(0, 8) + ' (' + triggeredByLeague.game_id + ' ' + triggeredByLeague.tier + ') triggered by ' + triggeredByLeague.id.slice(0, 8));
}

// ── League lifecycle check (called periodically from server.mjs) ─────
export function checkLeagueLifecycles() {
  const now = Date.now();

  // Recover stuck leagues (settling for >30 minutes)
  recoverStuckLeagues();

  // Get all leagues that need checking
  const db = getDb();
  const leagues = db.prepare(`SELECT * FROM leagues WHERE status IN ('registration', 'active')`).all();

  for (const league of leagues) {
    // Registration closed, check threshold
    if (league.status === 'registration' && now > league.reg_closes_at) {
      const count = getLeaguePlayerCount(league.id);
      if (count >= (league.min_players || 4)) {
        activateLeague(league);
        // Auto-create successor league
        autoCreateLeague(league);
      } else {
        cancelLeagueWithReason(league.id, 'Insufficient players (' + count + '/' + (league.min_players || 4) + ')');
        processLeagueRefunds(league.id).catch(function(e) {
          console.error('Refund processing failed for cancelled league ' + league.id + ':', e.message);
        });
      }
    }

    // Active league: join window just closed, check min players
    if (league.status === 'active' && league.join_closes_at && now > league.join_closes_at) {
      const count = getLeaguePlayerCount(league.id);
      if (count < (league.min_players || 4)) {
        cancelLeagueWithReason(league.id, 'Insufficient players after join window (' + count + '/' + (league.min_players || 4) + ')');
        processLeagueRefunds(league.id).catch(function(e) {
          console.error('Refund processing failed for cancelled active league ' + league.id + ':', e.message);
        });
        continue;
      }
    }

    // Active league: recalculate pot if still in join window (late joiners)
    if (league.status === 'active' && league.join_closes_at && now <= league.join_closes_at) {
      recalculateLeaguePot(league.id);
    }

    // Active league: play window closed, settle
    if (league.status === 'active' && league.play_closes_at && now > league.play_closes_at) {
      settleLeagueNow(league.id);
    }
  }

  // Retry failed refunds (attempted_at older than 60 seconds)
  const failedRefunds = getFailedRefunds();
  for (const refund of failedRefunds) {
    if (refund.attempted_at && (now - refund.attempted_at) > 60000) {
      retryRefund(refund);
    }
  }
}

function settleLeagueNow(leagueId) {
  doSettleLeague(leagueId).catch(function(e) {
    console.error('Deadline settlement failed for ' + leagueId + ':', e.message);
  });
}

async function retryRefund(refund) {
  try {
    const txHash = await sendQF(refund.wallet, refund.amount_qf);
    if (txHash) {
      updateRefundStatus(refund.id, 'sent', txHash, null);
      markRefunded(refund.league_id, refund.wallet);
      console.log('Retry refund succeeded: ' + refund.amount_qf + ' QF to ' + refund.wallet.slice(0, 8) + '...');
    } else {
      updateRefundStatus(refund.id, 'failed', null, 'Retry: sendQF returned null');
    }
  } catch (e) {
    updateRefundStatus(refund.id, 'failed', null, 'Retry: ' + e.message);
  }
}

// ── Admin auth ──────────────────────────────────────────────────────
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const ADMIN_WALLETS = new Set(
  (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean)
);

function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  const adminWallet = req.headers['x-admin-wallet'];
  if (ADMIN_SECRET && adminKey === ADMIN_SECRET) return next();
  if (adminWallet && ADMIN_WALLETS.has(adminWallet.toLowerCase())) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// ── Admin: manual settlement ────────────────────────────────────────

router.post('/admin/league/:leagueId/settle', requireAdmin, async (req, res) => {
  try {
    const adminWallet = req.headers['x-admin-wallet'] || req.headers['x-admin-key'] || 'admin';
    forceSettleLeague(req.params.leagueId, adminWallet);
    const result = await doSettleLeague(req.params.leagueId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: cancel league + refunds ──────────────────────────────────

router.post('/admin/league/:leagueId/cancel', requireAdmin, async (req, res) => {
  try {
    const league = getLeagueById(req.params.leagueId);
    if (!league) return res.status(404).json({ error: 'League not found' });
    if (league.status === 'settled' || league.status === 'cancelled') {
      return res.status(400).json({ error: 'League already ' + league.status });
    }

    const reason = req.body.reason || 'Admin cancelled';
    cancelLeagueWithReason(league.id, reason);
    await processLeagueRefunds(league.id);
    const refunds = getLeagueRefunds(league.id);

    res.json({ cancelled: true, league_id: league.id, reason, refunds_queued: refunds.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: retry a single failed refund ─────────────────────────────

router.post('/admin/league/:leagueId/refund/:wallet', requireAdmin, async (req, res) => {
  try {
    const refunds = getLeagueRefunds(req.params.leagueId);
    const target = refunds.find(r => r.wallet === req.params.wallet.toLowerCase() && r.status === 'failed');
    if (!target) return res.status(404).json({ error: 'No failed refund found for this wallet in this league' });

    await retryRefund(target);
    const updated = getLeagueRefunds(req.params.leagueId).find(r => r.id === target.id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: list refunds by status ───────────────────────────────────

router.get('/admin/refunds', requireAdmin, (req, res) => {
  const status = req.query.status;
  if (status === 'failed') {
    return res.json(getFailedRefunds());
  }
  if (status === 'pending') {
    return res.json(getPendingRefunds());
  }
  // Default: all failed
  res.json(getFailedRefunds());
});

// ── Admin: mint commemorative NFTs ──────────────────────────────────

router.post('/admin/commemorative/mint-all', requireAdmin, async (req, res) => {
  const leagueId = req.body.leagueId;
  if (!leagueId) return res.status(400).json({ error: 'leagueId required' });

  try {
    const result = await mintCommemorative(leagueId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Battleships Endpoints ─────────────────────────────────────────────

// Create a battleships game
router.post('/battleships/create', optionalWallet, (req, res) => {
  const wallet = req.wallet;
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });

  const stakeQf = Math.max(25, parseInt(req.body.stake_qf) || 25);
  const vsCpu = req.body.vs_cpu ? 1 : 0;
  const validDifficulties = ['recruit', 'officer', 'admiral'];
  const difficulty = vsCpu && validDifficulties.includes(req.body.difficulty) ? req.body.difficulty : 'recruit';

  let shareCode, existing;
  for (let i = 0; i < 10; i++) {
    shareCode = generateShareCode();
    existing = getBattleshipsGameByCode(shareCode);
    if (!existing) break;
  }
  if (existing) return res.status(500).json({ error: 'Could not generate unique code' });

  const id = crypto.randomUUID();
  const now = Date.now();
  createBattleshipsGame(id, stakeQf, wallet, shareCode, now, vsCpu, difficulty);

  // For CPU games: generate and place CPU fleet immediately
  if (vsCpu) {
    const seed = now ^ (parseInt(id.slice(0, 8), 16) || 0);
    const cpuFleet = cpuPlaceFleet(seed);
    saveBattleshipsPlacement(id, 'CPU', JSON.stringify(cpuFleet), now);
  }

  res.json({ share_code: shareCode, game_id: id });
});

// Get battleships game history for wallet
router.get('/battleships/history', optionalWallet, (req, res) => {
  const wallet = req.wallet;
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });

  const games = getBattleshipsGamesByWallet(wallet, 20);
  const history = games.map(g => {
    const isCreator = g.creator_wallet === wallet;
    const opponent = isCreator ? g.opponent_wallet : g.creator_wallet;
    let result = 'draw';
    if (g.winner_wallet === wallet) result = 'win';
    else if (g.winner_wallet && g.winner_wallet !== wallet) result = 'loss';
    return {
      game_id: g.id,
      share_code: g.share_code,
      opponent_wallet: opponent,
      result,
      stake_qf: g.stake_qf,
      completed_at: g.completed_at
    };
  });
  res.json(history);
});

// Join a battleships game
router.post('/battleships/:code/join', optionalWallet, (req, res) => {
  const wallet = req.wallet;
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });

  const code = req.params.code.toUpperCase();
  const game = getBattleshipsGameByCode(code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status !== 'placement') return res.status(400).json({ error: 'Game is not accepting players' });
  if (game.vs_cpu) return res.status(400).json({ error: 'Cannot join a CPU game' });
  if (game.creator_wallet === wallet) return res.status(400).json({ error: 'Cannot join your own game' });
  if (game.opponent_wallet && game.opponent_wallet !== wallet) return res.status(400).json({ error: 'Game already has an opponent' });

  if (!game.opponent_wallet) {
    updateBattleshipsGameStatus(game.id, 'placement', { opponent_wallet: wallet.toLowerCase() });
  }

  res.json({ game_id: game.id });
});

// Place fleet
router.post('/battleships/:code/place', optionalWallet, (req, res) => {
  const wallet = req.wallet;
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });

  const code = req.params.code.toUpperCase();
  const game = getBattleshipsGameByCode(code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status !== 'placement') return res.status(400).json({ error: 'Game is not in placement phase' });

  const isCreator = game.creator_wallet === wallet;
  const isOpponent = game.opponent_wallet && game.opponent_wallet === wallet;
  if (!isCreator && !isOpponent) return res.status(403).json({ error: 'Not a participant' });

  const { fleet } = req.body;
  if (!fleet) return res.status(400).json({ error: 'fleet required' });

  const validation = validateFleet(fleet);
  if (!validation.valid) return res.status(400).json({ error: validation.reason });

  const now = Date.now();
  saveBattleshipsPlacement(game.id, wallet, JSON.stringify(fleet), now);

  // Check if both players have placed
  // For vs_cpu: CPU fleet was placed on create, so check CPU placement
  const creatorPlacement = getBattleshipsPlacement(game.id, game.creator_wallet);
  const opponentPlacement = game.vs_cpu
    ? getBattleshipsPlacement(game.id, 'CPU')
    : (game.opponent_wallet ? getBattleshipsPlacement(game.id, game.opponent_wallet) : null);

  if (creatorPlacement && opponentPlacement) {
    const turnDeadline = Math.floor(now / 1000) + 86400;
    updateBattleshipsGameStatus(game.id, 'active', { current_turn: game.creator_wallet, started_at: now, turn_deadline: turnDeadline });
    return res.json({ status: 'ready' });
  }

  res.json({ status: 'waiting' });
});

// Shoot
router.post('/battleships/:code/shoot', optionalWallet, (req, res) => {
  const wallet = req.wallet;
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });

  const code = req.params.code.toUpperCase();
  const game = getBattleshipsGameByCode(code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status !== 'active') return res.status(400).json({ error: 'Game is not active' });
  if (game.current_turn !== wallet) return res.status(400).json({ error: 'Not your turn' });

  const { firing_ship, target } = req.body;
  if (!firing_ship || !target || target.x == null || target.y == null) {
    return res.status(400).json({ error: 'firing_ship and target {x, y} required' });
  }

  const targetX = parseInt(target.x);
  const targetY = parseInt(target.y);
  if (targetX < 0 || targetX > 9 || targetY < 0 || targetY > 9) {
    return res.status(400).json({ error: 'Target must be within 0-9' });
  }

  const rounds = getBattleshipsRounds(game.id);
  const opponentWallet = game.vs_cpu ? 'CPU' : (game.creator_wallet === wallet ? game.opponent_wallet : game.creator_wallet);

  // Check target not already shot at (by this player)
  const alreadyShot = rounds.find(r => r.wallet === wallet && r.target_x === targetX && r.target_y === targetY);
  if (alreadyShot) return res.status(400).json({ error: 'Already shot at this coordinate' });

  // Get shooter's fleet to validate firing ship is alive
  const shooterPlacement = getBattleshipsPlacement(game.id, wallet);
  const shooterFleet = JSON.parse(shooterPlacement.fleet);
  const firingShipData = shooterFleet.find(s => s.ship === firing_ship);
  if (!firingShipData) return res.status(400).json({ error: 'Unknown firing ship: ' + firing_ship });

  // Check firing ship is not fully sunk (by opponent's shots)
  const opponentAttackRounds = rounds.filter(r => r.wallet === opponentWallet);
  const firingShipHitCells = new Set();
  for (const r of opponentAttackRounds) {
    if (r.result === 'hit' || r.result === 'sunk') {
      firingShipHitCells.add(r.target_x + ',' + r.target_y);
    }
  }
  const firingShipAllHit = firingShipData.cells.every(c => firingShipHitCells.has(c.x + ',' + c.y));
  if (firingShipAllHit) return res.status(400).json({ error: firing_ship + ' has been sunk and cannot fire' });

  // Get opponent fleet
  const opponentPlacement = getBattleshipsPlacement(game.id, opponentWallet);
  const opponentFleet = JSON.parse(opponentPlacement.fleet);

  // Calculate range
  const range = calculateRange(firingShipData.cells, targetX, targetY);

  // Check hit
  const hitResult = checkHit(targetX, targetY, opponentFleet);

  // Determine round number
  const roundNumber = rounds.length + 1;

  // Check if the hit sunk a ship
  let resultType = hitResult.hit ? 'hit' : 'miss';
  let sunkShipCells = null;

  if (hitResult.hit) {
    // Temporarily add this shot to rounds for sunk check
    const tempRounds = [...rounds.filter(r => r.wallet === wallet), {
      wallet, target_x: targetX, target_y: targetY, result: 'hit'
    }];
    if (checkSunk(hitResult.shipName, opponentFleet, tempRounds)) {
      resultType = 'sunk';
      const sunkShip = opponentFleet.find(s => s.ship === hitResult.shipName);
      sunkShipCells = sunkShip ? sunkShip.cells : null;
    }
  }

  // Record round
  const now = Date.now();
  addBattleshipsRound(game.id, roundNumber, wallet, firing_ship, targetX, targetY, range, resultType, hitResult.shipName, false, now);

  // Check win
  const allRoundsAfterShot = getBattleshipsRounds(game.id);
  const won = checkWin(opponentFleet, allRoundsAfterShot, opponentWallet);

  const response = {
    result: resultType,
    range,
    ship_hit: hitResult.shipName,
    sunk_ship_cells: sunkShipCells,
    game_status: game.status,
    winner: null
  };

  if (won) {
    // Settle: 90% winner, 5% burn, 5% team
    const totalPot = game.stake_qf * 2;
    const burnAmount = Math.floor(totalPot * 0.05);
    const teamAmount = Math.floor(totalPot * 0.05);
    const winnerAmount = totalPot - burnAmount - teamAmount;

    updateBattleshipsGameStatus(game.id, 'completed', { winner_wallet: wallet, completed_at: now, turn_deadline: null });
    updateBattleshipsRecord(wallet, 'win');
    if (!game.vs_cpu) {
      updateBattleshipsRecord(opponentWallet, 'loss');
      settleDuel(wallet, burnAmount, teamAmount, winnerAmount).catch(e => {
        console.error('Battleships settlement failed:', e.message);
      });
    }

    response.game_status = 'completed';
    response.winner = wallet;
    try { checkAchievements(wallet, { type: 'battleships_complete', gameId: game.id, won: true, vsCpu: game.vs_cpu }); } catch (e) { /* achievement check failed */ }
  } else if (game.vs_cpu) {
    // CPU responds immediately — no turn swap, no turn_deadline change
    const cpuRounds = getBattleshipsRounds(game.id);
    const cpuShots = new Set(cpuRounds.filter(r => r.wallet === 'CPU').map(r => r.target_x + ',' + r.target_y));

    // Build data for Officer/Admiral
    const cpuHits = cpuRounds.filter(r => r.wallet === 'CPU' && (r.result === 'hit' || r.result === 'sunk'))
      .map(r => ({ x: r.target_x, y: r.target_y }));
    const cpuMisses = new Set(cpuRounds.filter(r => r.wallet === 'CPU' && r.result === 'miss')
      .map(r => r.target_x + ',' + r.target_y));

    // Pick CPU firing ship
    const cpuPlacement = getBattleshipsPlacement(game.id, 'CPU');
    const cpuFleetData = JSON.parse(cpuPlacement.fleet);
    const playerAttacks = cpuRounds.filter(r => r.wallet === wallet);
    const cpuFiringShip = pickSurvivingShip(cpuFleetData, playerAttacks, wallet);

    let cpuShotResult = null;
    if (cpuFiringShip) {
      // Choose shot based on difficulty
      let cpuTarget;
      if (game.difficulty === 'admiral') {
        // Build remaining fleet info for density map
        const playerPlacement = getBattleshipsPlacement(game.id, wallet);
        const playerFleet = JSON.parse(playerPlacement.fleet);
        const remainingFleet = playerFleet.filter(s => !checkSunk(s.ship, playerFleet, cpuRounds.filter(r => r.wallet === 'CPU')))
          .map(s => ({ name: s.ship, size: s.cells.length }));
        cpuTarget = cpuShootAdmiral(cpuShots, cpuHits, cpuMisses, remainingFleet);
      } else if (game.difficulty === 'officer') {
        cpuTarget = cpuShootOfficer(cpuShots, cpuHits, cpuMisses);
      } else {
        cpuTarget = cpuShootRecruit(cpuShots);
      }

      if (cpuTarget) {
        const playerPlacement = getBattleshipsPlacement(game.id, wallet);
        const playerFleet = JSON.parse(playerPlacement.fleet);

        const cpuRange = calculateRange(cpuFiringShip.cells, cpuTarget.x, cpuTarget.y);
        const cpuHitResult = checkHit(cpuTarget.x, cpuTarget.y, playerFleet);

        let cpuResultType = cpuHitResult.hit ? 'hit' : 'miss';
        let cpuSunkShipCells = null;

        if (cpuHitResult.hit) {
          const tempCpuRounds = [...cpuRounds.filter(r => r.wallet === 'CPU'), {
            wallet: 'CPU', target_x: cpuTarget.x, target_y: cpuTarget.y, result: 'hit'
          }];
          if (checkSunk(cpuHitResult.shipName, playerFleet, tempCpuRounds)) {
            cpuResultType = 'sunk';
            const sunkS = playerFleet.find(s => s.ship === cpuHitResult.shipName);
            cpuSunkShipCells = sunkS ? sunkS.cells : null;
          }
        }

        const cpuRoundNumber = cpuRounds.length + 1;
        addBattleshipsRound(game.id, cpuRoundNumber, 'CPU', cpuFiringShip.ship, cpuTarget.x, cpuTarget.y, cpuRange, cpuResultType, cpuHitResult.shipName, false, now);

        cpuShotResult = {
          firing_ship: cpuFiringShip.ship,
          target: cpuTarget,
          result: cpuResultType,
          range: cpuRange,
          ship_hit: cpuHitResult.shipName,
          sunk_ship_cells: cpuSunkShipCells
        };

        // Check if CPU won
        const allAfterCpu = getBattleshipsRounds(game.id);
        const cpuWon = checkWin(playerFleet, allAfterCpu, wallet);

        if (cpuWon) {
          updateBattleshipsGameStatus(game.id, 'completed', { winner_wallet: 'CPU', completed_at: now, turn_deadline: null });
          updateBattleshipsRecord(wallet, 'loss');
          response.game_status = 'completed';
          response.winner = 'CPU';
          try { checkAchievements(wallet, { type: 'battleships_complete', gameId: game.id, won: false, vsCpu: true }); } catch (e) { /* achievement check failed */ }
        }
      }
    }

    response.cpu_shot = cpuShotResult;
  } else {
    // PvP: switch turn and reset turn_deadline
    const turnDeadline = Math.floor(now / 1000) + 86400;
    updateBattleshipsGameStatus(game.id, 'active', { current_turn: opponentWallet, turn_deadline: turnDeadline });
  }

  res.json(response);
});

// Get battleships game state
router.get('/battleships/:code', optionalWallet, (req, res) => {
  const wallet = req.wallet;
  const code = req.params.code.toUpperCase();
  const game = getBattleshipsGameByCode(code);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const rounds = getBattleshipsRounds(game.id);
  const placements = getBattleshipsPlacements(game.id);

  if (wallet && (game.creator_wallet === wallet || game.opponent_wallet === wallet)) {
    const state = getBattleshipsState(game, wallet, rounds, placements);
    const record = getBattleshipsRecord(wallet);
    state.my_record = record || { wins: 0, losses: 0, draws: 0 };
    return res.json(state);
  }

  // Spectator or no wallet — return limited info
  res.json({
    game_id: game.id,
    share_code: game.share_code,
    status: game.status,
    stake_qf: game.stake_qf,
    creator_wallet: game.creator_wallet,
    opponent_wallet: game.opponent_wallet,
    current_turn: game.current_turn,
    winner_wallet: game.winner_wallet,
    created_at: game.created_at,
    started_at: game.started_at,
    completed_at: game.completed_at
  });
});

// Forfeit a battleships game
router.post('/battleships/:code/forfeit', optionalWallet, (req, res) => {
  const wallet = req.wallet;
  if (!wallet) return res.status(401).json({ error: 'Wallet required' });

  const code = req.params.code.toUpperCase();
  const game = getBattleshipsGameByCode(code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status !== 'active' && game.status !== 'placement') {
    return res.status(400).json({ error: 'Game cannot be forfeited' });
  }

  const isCreator = game.creator_wallet === wallet;
  const isOpponent = game.opponent_wallet && game.opponent_wallet === wallet;
  if (!isCreator && !isOpponent) return res.status(403).json({ error: 'Not a participant' });

  const now = Date.now();
  const opponentWallet = isCreator ? game.opponent_wallet : game.creator_wallet;

  if (game.status === 'active' && opponentWallet) {
    // Settle in favour of opponent
    const totalPot = game.stake_qf * 2;
    const burnAmount = Math.floor(totalPot * 0.05);
    const teamAmount = Math.floor(totalPot * 0.05);
    const winnerAmount = totalPot - burnAmount - teamAmount;

    updateBattleshipsGameStatus(game.id, 'completed', { winner_wallet: opponentWallet, completed_at: now });
    updateBattleshipsRecord(opponentWallet, 'win');
    updateBattleshipsRecord(wallet, 'loss');

    settleDuel(opponentWallet, burnAmount, teamAmount, winnerAmount).catch(e => {
      console.error('Battleships forfeit settlement failed:', e.message);
    });

    try { checkAchievements(opponentWallet, { type: 'battleships_complete', gameId: game.id, won: true, vsCpu: false }); } catch (e) { /* achievement check failed */ }
    try { checkAchievements(wallet, { type: 'battleships_complete', gameId: game.id, won: false, vsCpu: false }); } catch (e) { /* achievement check failed */ }
    return res.json({ status: 'forfeited', winner: opponentWallet });
  }

  // Placement phase — just cancel the game
  updateBattleshipsGameStatus(game.id, 'completed', { completed_at: now });
  res.json({ status: 'cancelled' });
});

// ── Battleships auto-shot (24h timeout) ──────────────────────────────
export function checkBattleshipsTimeouts() {
  try {
    const activeGames = getActiveBattleshipsGames();
    const nowSecs = Math.floor(Date.now() / 1000);
    const nowMs = Date.now();

    for (const game of activeGames) {
      // Skip CPU games — CPU responds instantly in the shoot route
      if (game.vs_cpu) continue;
      if (!game.current_turn) continue;
      // Use turn_deadline as single source of truth
      if (!game.turn_deadline || game.turn_deadline > nowSecs) continue;

      // Auto-shot: pick random surviving ship, random target
      const currentWallet = game.current_turn;
      const opponentWallet = game.creator_wallet === currentWallet ? game.opponent_wallet : game.creator_wallet;

      const rounds = getBattleshipsRounds(game.id);

      const shooterPlacement = getBattleshipsPlacement(game.id, currentWallet);
      if (!shooterPlacement) continue;
      const shooterFleet = JSON.parse(shooterPlacement.fleet);

      // Pick a surviving ship (not sunk by opponent)
      const opponentAttackRounds = rounds.filter(r => r.wallet === opponentWallet);
      const survivingShip = pickSurvivingShip(shooterFleet, opponentAttackRounds, opponentWallet);
      if (!survivingShip) continue;

      // Pick random unshot coordinate
      const myShots = new Set(rounds.filter(r => r.wallet === currentWallet).map(r => r.target_x + ',' + r.target_y));
      const shot = cpuShootRecruit(myShots);
      if (!shot) continue;

      // Get opponent fleet for hit check
      const opponentPlacement = getBattleshipsPlacement(game.id, opponentWallet);
      if (!opponentPlacement) continue;
      const opponentFleet = JSON.parse(opponentPlacement.fleet);

      const range = calculateRange(survivingShip.cells, shot.x, shot.y);
      const hitResult = checkHit(shot.x, shot.y, opponentFleet);

      let resultType = hitResult.hit ? 'hit' : 'miss';
      const roundNumber = rounds.length + 1;

      if (hitResult.hit) {
        const tempRounds = [...rounds.filter(r => r.wallet === currentWallet), {
          wallet: currentWallet, target_x: shot.x, target_y: shot.y, result: 'hit'
        }];
        if (checkSunk(hitResult.shipName, opponentFleet, tempRounds)) {
          resultType = 'sunk';
        }
      }

      addBattleshipsRound(game.id, roundNumber, currentWallet, survivingShip.ship, shot.x, shot.y, range, resultType, hitResult.shipName, true, nowMs);

      // Check win
      const allRoundsAfterShot = getBattleshipsRounds(game.id);
      const won = checkWin(opponentFleet, allRoundsAfterShot, opponentWallet);

      if (won) {
        const totalPot = game.stake_qf * 2;
        const burnAmount = Math.floor(totalPot * 0.05);
        const teamAmount = Math.floor(totalPot * 0.05);
        const winnerAmount = totalPot - burnAmount - teamAmount;

        updateBattleshipsGameStatus(game.id, 'completed', { winner_wallet: currentWallet, completed_at: nowMs, turn_deadline: null });
        updateBattleshipsRecord(currentWallet, 'win');
        updateBattleshipsRecord(opponentWallet, 'loss');

        settleDuel(currentWallet, burnAmount, teamAmount, winnerAmount).catch(e => {
          console.error('Battleships auto-shot settlement failed:', e.message);
        });
        try { checkAchievements(currentWallet, { type: 'battleships_complete', gameId: game.id, won: true, vsCpu: false }); } catch (e) { /* achievement check failed */ }
        try { checkAchievements(opponentWallet, { type: 'battleships_complete', gameId: game.id, won: false, vsCpu: false }); } catch (e) { /* achievement check failed */ }
      } else {
        // Swap turn and reset deadline for opponent
        const newDeadline = nowSecs + 86400;
        updateBattleshipsGameStatus(game.id, 'active', { current_turn: opponentWallet, turn_deadline: newDeadline });
      }

      console.log('Battleships auto-shot: game ' + game.id.slice(0, 8) + ', player ' + currentWallet.slice(0, 8) + ' timed out');
    }
  } catch (e) {
    console.error('Battleships timeout check error:', e.message);
  }
}

// ── Achievement endpoints ──────────────────────────────────────────────────

const ACHIEVEMENTS_ACTIVE = process.env.ACHIEVEMENTS_ACTIVE === 'true';

router.get('/achievements/status', (req, res) => {
  const registry = getAchievementRegistry();
  res.json({ active: ACHIEVEMENTS_ACTIVE, count: registry.length });
});

router.get('/achievements/all', (req, res) => {
  const registry = getAchievementRegistry();
  // Return names only, no criteria
  const list = registry.map(a => ({
    id: a.achievement_id,
    name: a.name,
    game_id: a.game_id,
    tier: a.tier,
    mint_fee_qf: a.mint_fee_qf,
    first_claimed_by: a.first_claimed_by || null,
    active: a.active === 1
  }));
  res.json({ achievements: list });
});

router.get('/achievements/my', optionalWallet, (req, res) => {
  if (!req.wallet) return res.status(401).json({ error: 'Wallet required' });
  const eligibility = getWalletAchievements(req.wallet);
  res.json({ wallet: req.wallet, achievements: eligibility });
});

router.get('/achievements/record/:id', (req, res) => {
  const record = getGlobalRecord(req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  res.json(record);
});

router.post('/achievement/mint', optionalWallet, async (req, res) => {
  if (!ACHIEVEMENTS_ACTIVE) {
    return res.json({ status: 'coming_soon' });
  }
  if (!req.wallet) return res.status(401).json({ error: 'Wallet required' });

  const { achievement_id } = req.body;
  if (!achievement_id) return res.status(400).json({ error: 'achievement_id required' });

  const registry = getAchievement(achievement_id);
  if (!registry) return res.status(404).json({ error: 'Achievement not found' });
  if (!registry.active) return res.status(400).json({ error: 'Achievement not active' });

  const eligibility = getWalletAchievements(req.wallet);
  const eligible = eligibility.find(e => e.achievement_id === achievement_id && !e.minted_at);
  if (!eligible) return res.status(400).json({ error: 'Not eligible or already minted' });

  const isPioneer = !registry.first_claimed_by;
  const db = getDb();

  if (isPioneer) {
    db.prepare('UPDATE achievement_registry SET first_claimed_by = ?, first_claimed_at = ? WHERE achievement_id = ? AND first_claimed_by IS NULL')
      .run(req.wallet, Date.now(), achievement_id);
    db.prepare('UPDATE achievement_eligibility SET is_pioneer = 1 WHERE wallet = ? AND achievement_id = ?')
      .run(req.wallet, achievement_id);
  }

  // Fee handling — paid mints get burn/team split
  const mintFee = registry.mint_fee_qf || 0;
  if (mintFee > 0) {
    // Check free mints banked
    const stats = getWalletStats(req.wallet) || {};
    const freeBanked = stats.free_mints_banked || 0;
    if (freeBanked > 0) {
      db.prepare('UPDATE wallet_stats SET free_mints_banked = free_mints_banked - 1 WHERE wallet = ?')
        .run(req.wallet.toLowerCase());
    } else {
      try {
        var burnAmount = Math.floor(mintFee * 0.05);
        var teamAmount = mintFee - burnAmount;
        await sendQF(BURN_ADDRESS, burnAmount);
        await sendQF(TEAM_WALLET, teamAmount);
      } catch (e) {
        return res.status(500).json({ error: 'Payment processing failed: ' + e.message });
      }
      // Update paid_mint_count and bank free mints
      var paidCount = (stats.paid_mint_count || 0) + 1;
      var newFree = 0;
      if (paidCount % 10 === 0) newFree = 2;
      else if (paidCount % 5 === 0) newFree = 1;
      db.prepare(`INSERT INTO wallet_stats (wallet, paid_mint_count, free_mints_banked) VALUES (?, ?, ?)
        ON CONFLICT(wallet) DO UPDATE SET paid_mint_count = paid_mint_count + 1, free_mints_banked = free_mints_banked + ?`)
        .run(req.wallet.toLowerCase(), 1, newFree, newFree);
    }
  }

  // On-chain mint via QFAchievement contract
  try {
    const ACHIEVEMENT_CONTRACT = process.env.ACHIEVEMENT_CONTRACT;
    const ACHIEVEMENT_ABI = ['function mint(address to, string uri) returns (uint256)', 'function mintBatch(address[] recipients, string[] uris)', 'function setTokenURI(uint256 tokenId, string uri)'];
    const { join } = await import('path');
    const { readFileSync } = await import('fs');
    const keyPath = join(process.cwd(), 'data', 'escrow.key');
    const key = readFileSync(keyPath, 'utf-8').trim();
    const provider = new ethers.JsonRpcProvider(process.env.QF_RPC_URL || 'https://archive.mainnet.qfnode.net/eth');
    const signer = new ethers.Wallet(key, provider);
    const contract = new ethers.Contract(ACHIEVEMENT_CONTRACT, ACHIEVEMENT_ABI, signer);

    // Bespoke achievement metadata CIDs (pre-pinned on Pinata)
    var ACHIEVEMENT_METADATA = {
      'founding-member': 'Qmc4WrJai1QzGafNBRqpPhHo9tGswHoNQFS5biRq3o5gV1',
      'the-grandmaster': 'QmTPwxE953xPZBCfVuyJxA3HmQgVrBaEUU3EcyNZHmZVa3',
      'shadow-legend': 'QmaW9gQMjmQRPGiVfn7aokJDf7wnDGus67F5kgHSNQhmEj',
      'immaculate': 'QmTfk4UEhri2dvwhCsW5xu4R4vqE1YqMFNt74hbJword92',
      'the-tortoise': 'QmUK7tTFmH5VcKYaQK35AhGuDMhHHraF4jVZYTcAXiFb8N',
      'the-mathematicians-collection': 'QmQyTQGNvJnNUNSge9dJ8PPFrJMq51ghM76K5NydvMtsvs',
      'the-complete-player': 'QmRyxQT7WG51iXnhcfwNXWBmSntGNBm7sKbqna6bkg7jzd',
      'into-the-shadows': 'QmWpkoNmDFRrzQvZMXpnmhqG1AK7gycKc2Sh6R7AuZ4Yup',
      'from-the-shadows': 'QmXEPcMmKE5FCC9fhnT3wkTWtRrUcuH7SKqS3pZ79VYXLF',
      'obsessed': 'QmeQeTLagnv7QZppRMoNTRvicWYhhXbBhqCi9jMzx4TBYX',
      'devoted': 'QmVGfNxW7xZEzPBuekQ4DkfEv8m6vNSi9DyZv9oDkkiL24',
      'collector': 'QmUZUviotCZaUS8VThdQV23oKM91SBovDVov1JfK2reiqU',
      'onlyfans-qf': 'QmRobR8sxSM3C5Tnnf5XTMRHo2wVg9zzZ1gNaMW3LEfJtu',
      'the-wolf-pack': 'QmeNzeiTuX8wsPUkU8FjJxMft7dpzErPGnUAs6GR3xtKYY',
    };
    // Tier fallback image CIDs
    var TIER_IMAGES = {
      'free': 'QmUhKP4YE1au5gSiKtMqYwGQYH8EKYKXC8aD28RRrXjdiw',
      'standard': 'QmQDdnJMpv3xDmkQ3z3bXZEUdGsrU8sXxQWR8Csny2Ciwc',
      'premium': 'QmaNx8dAwPk59UPY55csZfRx4Cp76tPmnZeuLanQYekvmu',
      'elite': 'QmNrzHDErnvVp8kyk4zmGBkbm8SNLx45md9EhXJbDPHAHB',
      'wooden-spoon': 'QmYJKWTuuTDiwaFNnMLL3wMyek11d5qPT5uYgjrJCfxUoM',
    };

    var tokenURI;
    var metadataCID;
    if (ACHIEVEMENT_METADATA[achievement_id]) {
      metadataCID = ACHIEVEMENT_METADATA[achievement_id];
      tokenURI = 'https://gateway.pinata.cloud/ipfs/' + metadataCID;
    } else {
      // Build metadata on the fly with tier fallback image
      var tierKey = registry.category === 'wooden-spoons' ? 'wooden-spoon' : (registry.tier || 'free');
      var imageCID = TIER_IMAGES[tierKey] || TIER_IMAGES['free'];
      var achName = registry.name || achievement_id;
      var achCategory = registry.category ? registry.category.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); }) : 'General';
      var metadata = {
        name: achName,
        description: achName + ' — ' + achCategory + ' achievement on QF Games.',
        image: 'https://gateway.pinata.cloud/ipfs/' + imageCID,
        attributes: [
          { trait_type: 'Category', value: registry.category || 'general' },
          { trait_type: 'Tier', value: registry.tier || 'free' },
          { trait_type: 'Pioneer', value: isPioneer ? 'Yes' : 'No' },
        ]
      };
      var pinRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.PINATA_JWT },
        body: JSON.stringify({ pinataContent: metadata, pinataMetadata: { name: 'metadata-' + achievement_id + '-' + req.wallet.slice(0,8) } })
      });
      var pinData = await pinRes.json();
      metadataCID = pinData.IpfsHash;
      tokenURI = 'https://gateway.pinata.cloud/ipfs/' + metadataCID;
    }
    const tx = await contract.mint(req.wallet, tokenURI);
    const receipt = await tx.wait();
    const txHash = receipt.hash;

    // Parse token ID from Transfer event (topic[3] is tokenId)
    var tokenId = null;
    var transferSig = ethers.id('Transfer(address,address,uint256)');
    for (var i = 0; i < receipt.logs.length; i++) {
      var log = receipt.logs[i];
      if (log.topics && log.topics[0] === transferSig) {
        tokenId = BigInt(log.topics[3]).toString();
        break;
      }
    }

    db.prepare('UPDATE achievement_eligibility SET minted_at = ?, tx_hash = ?, metadata_cid = ?, token_id = ? WHERE wallet = ? AND achievement_id = ?')
      .run(Date.now(), txHash, metadataCID, tokenId, req.wallet, achievement_id);

    res.json({ minted: true, pioneer: isPioneer, tx_hash: txHash, metadata_cid: metadataCID, token_id: tokenId });
  } catch (e) {
    res.status(500).json({ error: 'On-chain mint failed: ' + e.message });
  }
});

// ── Admin achievement endpoints ────────────────────────────────────────────

router.post('/admin/achievement/register', requireAdmin, (req, res) => {
  const { achievement_id, name, game_id, tier, mint_fee_qf } = req.body;
  if (!achievement_id || !name || !tier || mint_fee_qf === undefined) {
    return res.status(400).json({ error: 'achievement_id, name, tier, and mint_fee_qf required' });
  }
  const db = getDb();
  try {
    db.prepare('INSERT INTO achievement_registry (achievement_id, name, game_id, tier, mint_fee_qf) VALUES (?, ?, ?, ?, ?)')
      .run(achievement_id, name, game_id || null, tier, mint_fee_qf);
    res.json({ registered: true, achievement_id });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Achievement already exists' });
    }
    throw e;
  }
});

router.post('/admin/achievement/award', requireAdmin, (req, res) => {
  const { wallet, achievement_id } = req.body;
  if (!wallet || !achievement_id) return res.status(400).json({ error: 'wallet and achievement_id required' });
  const result = awardAchievement(wallet, achievement_id);
  res.json(result);
});

router.get('/admin/achievements', requireAdmin, (req, res) => {
  const all = getAllAchievements();
  const status = req.query.status;
  if (status === 'active') {
    res.json({ achievements: all.filter(a => a.active === 1) });
  } else if (status === 'inactive') {
    res.json({ achievements: all.filter(a => a.active === 0) });
  } else {
    res.json({ achievements: all });
  }
});

// ── Admin: flagged sessions ──────────────────────────────────────────────
router.get('/admin/flagged-sessions', requireAdmin, (req, res) => {
  var wallet = req.query.wallet || null;
  var leagueId = req.query.league_id || null;
  var results = getFlaggedSessions(wallet, leagueId);
  res.json({ flagged: results, count: results.length });
});

// ── Profile endpoint ──────────────────────────────────────────────────────

const profileRateLimit = new Map();
router.get('/profile/:wallet', (req, res) => {
  // Rate limit: 60 requests/minute per IP
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - 60000;
  const hits = profileRateLimit.get(ip) || [];
  const recent = hits.filter(t => t > windowStart);
  if (recent.length >= 60) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  recent.push(now);
  profileRateLimit.set(ip, recent);

  const wallet = req.params.wallet;
  if (!wallet || wallet.length < 10) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const personalBests = getPersonalBests(wallet);
  const leagueBests = getLeagueBests(wallet);
  const achievements = getWalletAchievements(wallet);
  const walletStats = getWalletStats(wallet) || {};
  const leagueHistory = getWalletLeagueHistory(wallet, 20);
  const trophies = getWalletTrophies(wallet);
  const leaderboardPositions = getWalletLeaderboardPositions(wallet);

  res.json({
    wallet: wallet.toLowerCase(),
    personal_bests: personalBests,
    league_bests: leagueBests,
    achievements,
    wallet_stats: walletStats,
    league_history: leagueHistory,
    trophies,
    leaderboard_positions: leaderboardPositions
  });
});

// ── Global Leaderboard ──────────────────────────────────────────────────

function getCurrentPeriodKey(periodType) {
  var now = new Date();
  if (periodType === 'daily') return now.toISOString().slice(0, 10);
  if (periodType === 'monthly') return now.toISOString().slice(0, 7);
  if (periodType === 'weekly') {
    var d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return now.getFullYear() + '-W' + String(week).padStart(2, '0');
  }
  return now.toISOString().slice(0, 10);
}

var TIME_PRIMARY = ['minesweeper','freecell','kenken','nonogram','kakuro','sudoku-duel'];

// Static routes first (before parameterized :gameId/:periodType)
router.get('/global-leaderboard/my-positions', optionalWallet, (req, res) => {
  if (!req.wallet) return res.status(401).json({ error: 'Wallet required' });
  var positions = getWalletLeaderboardPositions(req.wallet);
  res.json({ positions: positions });
});

router.post('/global-leaderboard/enter', optionalWallet, async (req, res) => {
  if (!req.wallet) return res.status(401).json({ error: 'Wallet required' });
  var { gameId, score, timeMs, periodType, sessionId, txHash, qnsName } = req.body;
  if (!gameId || score === undefined || !periodType || !sessionId) {
    return res.status(400).json({ error: 'gameId, score, periodType, and sessionId required' });
  }
  if (['daily', 'weekly', 'monthly'].indexOf(periodType) === -1) {
    return res.status(400).json({ error: 'Invalid periodType' });
  }
  var periodKey = getCurrentPeriodKey(periodType);
  var existing = getGlobalLeaderboardEntry(req.wallet, gameId, periodType, periodKey);
  if (existing) return res.status(400).json({ error: 'Already entered this leaderboard for the current period' });

  var gs = getGameState(sessionId);
  if (!gs) return res.status(400).json({ error: 'Session not found' });
  if (gs.status !== 'completed') return res.status(400).json({ error: 'Session not completed' });
  if (gs.flagged) return res.status(400).json({ error: 'Session flagged — not eligible' });

  var suspicious = 0;

  // Burn 5% (2.5 QF), team 95% (47.5 QF) of 50 QF entry fee
  var burnAmount = 2;
  var teamAmount = 48;
  try {
    await sendQF(BURN_ADDRESS, burnAmount);
    await sendQF(TEAM_WALLET, teamAmount);
  } catch (e) {
    return res.status(500).json({ error: 'Payment processing failed: ' + e.message });
  }

  addGlobalLeaderboardEntry(req.wallet, gameId, score, timeMs || 0, periodType, periodKey, sessionId, txHash || null, qnsName, suspicious);

  var board = getGlobalLeaderboard(gameId, periodType, periodKey);
  var rank = board.findIndex(function(r) { return r.wallet === req.wallet.toLowerCase(); }) + 1;
  res.json({ success: true, rank: rank, totalEntries: board.length, periodType: periodType, periodKey: periodKey });
});

router.get('/global-leaderboard/:gameId/eligibility', optionalWallet, (req, res) => {
  if (!req.wallet) return res.status(401).json({ error: 'Wallet required' });
  var gameId = req.params.gameId;
  var periodType = req.query.periodType || 'daily';
  var score = parseInt(req.query.score) || 0;
  var timeMs = parseInt(req.query.timeMs) || 0;
  var sessionId = req.query.sessionId;
  if (['daily', 'weekly', 'monthly'].indexOf(periodType) === -1) {
    return res.status(400).json({ error: 'Invalid periodType' });
  }
  var periodKey = getCurrentPeriodKey(periodType);
  var existing = getGlobalLeaderboardEntry(req.wallet, gameId, periodType, periodKey);
  if (existing) {
    return res.json({ shouldPrompt: false, alreadyEntered: true, periodType: periodType, periodKey: periodKey });
  }
  if (sessionId) {
    var gs = getGameState(sessionId);
    if (gs && gs.flagged) {
      return res.json({ shouldPrompt: false, alreadyEntered: false, periodType: periodType, periodKey: periodKey });
    }
  }
  var board = getGlobalLeaderboard(gameId, periodType, periodKey);
  var totalEntries = board.length;
  var isTime = TIME_PRIMARY.indexOf(gameId) !== -1;
  var rank = totalEntries + 1;
  for (var i = 0; i < board.length; i++) {
    if (isTime ? timeMs < board[i].time_ms : score > board[i].score) { rank = i + 1; break; }
  }
  var shouldPrompt = totalEntries < 25 || rank <= 25;
  res.json({ shouldPrompt: shouldPrompt, rank: rank, totalEntries: totalEntries, alreadyEntered: false, periodType: periodType, periodKey: periodKey });
});

// Parameterized route LAST (after static routes)
var glbRateLimit = new Map();
router.get('/global-leaderboard/:gameId/:periodType', (req, res) => {
  var ip = req.ip || req.connection.remoteAddress;
  var now = Date.now();
  var hits = glbRateLimit.get(ip) || [];
  var recent = hits.filter(function(t) { return t > now - 60000; });
  if (recent.length >= 60) return res.status(429).json({ error: 'Rate limit exceeded' });
  recent.push(now);
  glbRateLimit.set(ip, recent);

  var gameId = req.params.gameId;
  var periodType = req.params.periodType;
  if (['daily', 'weekly', 'monthly'].indexOf(periodType) === -1) {
    return res.status(400).json({ error: 'periodType must be daily, weekly, or monthly' });
  }
  var periodKey = getCurrentPeriodKey(periodType);
  var board = getGlobalLeaderboard(gameId, periodType, periodKey);
  var ranked = board.map(function(entry, i) {
    return { rank: i + 1, wallet: entry.wallet, qns_name: entry.qns_name, score: entry.score, time_ms: entry.time_ms, paid_at: entry.paid_at };
  });
  res.json({ game_id: gameId, period_type: periodType, period_key: periodKey, entries: ranked });
});

export default router;
