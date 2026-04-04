import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getLeaderboard, getEntry, getPaidGames } from '../db/index.mjs';
import { createDuel, getDuelByCode, getDuelById, updateDuelCreatorScore, acceptDuel, updateDuelOpponentScore, completeDuel, expireOldDuels, getDuelsByWallet, getActiveDuelCount } from '../db/index.mjs';
import { createLeague, getLeagueById, getActiveLeagues, getAllLeagues, updateLeagueStatus, startLeague, settleLeague, cancelLeague, addLeaguePlayer, getLeaguePlayers, getLeaguePlayerCount, isLeaguePlayer, markRefunded, addLeaguePuzzle, getLeaguePuzzles, addLeagueScore, getLeagueScore, getLeagueScoresByWallet, getLeagueLeaderboard, addLeaguePrize, getLeaguePrizes, getPlayerPuzzleOrder, setPlayerPuzzleOrder } from '../db/index.mjs';
import { createPromoChallenge, getPromoByCode, getPromoById, getPromoClaim, addPromoClaim, getPromoClaims } from '../db/index.mjs';
import { startSession, startFreeSession, evaluate, getCurrentWeekId, resumeSession } from '../scoring.mjs';
import { ethers } from 'ethers';
import { getDb } from '../db/index.mjs';

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
    const { gameId, seed, leagueId } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });

    const weekId = getCurrentWeekId();

    // Build context opts for persistent sessions
    const opts = { seed: seed != null ? seed : undefined };

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

  // Auto-start if hit max during registration
  if (league.status === 'registration' && newCount >= league.max_players) {
    activateLeague(league);
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

  addLeagueScore(league.id, wallet, puzzleIndex, score, timeMs || 0, mistakes || 0, hints || 0, Date.now());

  // Return player's own scores
  const myScores = getLeagueScoresByWallet(league.id, wallet);
  const total = myScores.reduce((sum, s) => sum + s.score, 0);

  res.json({ submitted: true, puzzle_index: puzzleIndex, score, cumulative: total, puzzles_played: myScores.length });
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

  // Generate puzzle seeds
  for (let i = 0; i < league.puzzle_count; i++) {
    const seed = (now + i * 7919) ^ (Math.random() * 0xFFFFFFFF >>> 0);
    addLeaguePuzzle(league.id, i, seed);
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

// ── League lifecycle check (called periodically from server.mjs) ─────
export function checkLeagueLifecycles() {
  const now = Date.now();

  // Get all leagues that need checking
  const db = getDb();
  const leagues = db.prepare(`SELECT * FROM leagues WHERE status IN ('registration', 'active')`).all();

  for (const league of leagues) {
    // Registration closed, check threshold
    if (league.status === 'registration' && now > league.reg_closes_at) {
      const count = getLeaguePlayerCount(league.id);
      if (count >= league.min_players) {
        activateLeague(league);
      } else {
        cancelLeague(league.id);
        // Mark all players for refund
        const players = getLeaguePlayers(league.id);
        for (const p of players) {
          markRefunded(league.id, p.wallet);
        }
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
}

function settleLeagueNow(leagueId) {
  const league = getLeagueById(leagueId);
  if (!league || league.status !== 'active') return;

  const leaderboard = getLeagueLeaderboard(leagueId);

  // Award prizes to top 4
  for (let i = 0; i < Math.min(4, leaderboard.length); i++) {
    const amount = Math.floor(league.prize_pool * PRIZE_SPLITS[i]);
    addLeaguePrize(leagueId, i + 1, leaderboard[i].wallet, amount);
  }

  settleLeague(leagueId);
}

export default router;
