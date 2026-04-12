/**
 * Server-side score engine.
 *
 * CRITICAL: No answer data ever leaves this module.
 * Client sends ONLY: selected option index, text input, or game actions.
 * Server evaluates against stored answers and returns results.
 *
 * Supports two game modes:
 *   - Sequential (estimation engine): question → answer → next question
 *   - Continuous (sudoku): single session with multiple actions, final submit
 *
 * Continuous-mode sessions are persisted to SQLite (active_game_state) and
 * survive server restarts. The activeSessions Map is a read cache.
 */

import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import {
  createSession, getSession, completeSession, expireSession,
  getSessionCount, upsertBestScore, getEntry,
  createGameState, getGameState, getActiveGameState,
  updateGameState, completeGameState, loadActiveGameStates,
  upsertPersonalBest, awardAchievement
} from './db/index.mjs';
import { checkAchievements, checkMinesweeperFreePlay, checkFlagEverything, checkBlindEye, checkSumOfAllFears, checkWrongAnswerStreak, checkMidnight, checkFibonacci } from './achievement-checker.mjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const SESSION_PREFIX = 'sess_';

// ── Active sessions (in-memory cache, backed by SQLite for continuous mode) ──
const activeSessions = new Map();

// ── Game registrations ──────────────────────────────────────────────────────
const questionBanks = new Map();

/**
 * Register a game.
 * @param {string} gameId
 * @param {*} questions - question bank data
 * @param {Function} evaluator - (question, answer, elapsedMs, session) => result
 * @param {Function} [selectQuestions] - (seed) => array of questions for a session
 * @param {Function} [stripQuestion] - (question) => client-safe version
 * @param {string} [mode] - 'sequential' (default) or 'continuous'
 */
export function registerGame(gameId, questions, evaluator, selectQuestions, stripQuestion, mode) {
  questionBanks.set(gameId, {
    questions,
    evaluator,
    selectQuestions,
    stripQuestion,
    mode: mode || 'sequential'
  });
}

/**
 * Get current week ID (Monday 00:00 UTC → Sunday 23:59 UTC)
 */
export function getCurrentWeekId() {
  const now = new Date();
  const jan1 = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((now - jan1) / 86400000);
  const weekNum = Math.ceil((dayOfYear + jan1.getUTCDay() + 1) / 7);
  return now.getUTCFullYear() * 100 + weekNum;
}

// ── Input pattern analysis (external-solver detection) ──────────────────────
export function analyseInputPattern(placements) {
  if (!placements || placements.length < 5) return null;

  var correct = placements.filter(function(p) { return p.correct; });
  if (correct.length < 5) return null;

  var flags = [];

  // Sequential order: what % of correct placements are in monotonically increasing cell order
  var sequential = 0;
  for (var i = 1; i < correct.length; i++) {
    if (correct[i].cell > correct[i - 1].cell) sequential++;
  }
  var seqPct = Math.round((sequential / (correct.length - 1)) * 100);
  if (seqPct > 70) flags.push('sequential:' + seqPct + '%');

  // Timing uniformity: stddev of intervals between correct placements
  if (correct.length >= 3) {
    var intervals = [];
    for (var j = 1; j < correct.length; j++) {
      intervals.push(correct[j].ts - correct[j - 1].ts);
    }
    var mean = intervals.reduce(function(a, b) { return a + b; }, 0) / intervals.length;
    var variance = intervals.reduce(function(a, b) { return a + (b - mean) * (b - mean); }, 0) / intervals.length;
    var stddev = Math.sqrt(variance);
    if (stddev < 800) flags.push('timing:stddev_' + Math.round(stddev) + 'ms');
  }

  if (flags.length === 0) return null;
  return flags.join(',');
}

// ── Persist session state to SQLite ──────────────────────────────────────────
function persistSession(sessionId, session) {
  if (!session._persisted) return;
  updateGameState(
    sessionId,
    JSON.stringify(session.placements || []),
    JSON.stringify(session.hintLog || []),
    session.mistakes || 0,
    session.hintsUsed || 0
  );
}

/**
 * Start a game session after on-chain entry is confirmed.
 */
export function startSession(wallet, gameId, weekId) {
  const bank = questionBanks.get(gameId);
  if (!bank) throw new Error('Game not registered: ' + gameId);

  const entry = getEntry(wallet, gameId, weekId);
  if (!entry) throw new Error('No entry found');

  const maxAttempts = entry.tier;
  const usedAttempts = getSessionCount(wallet, gameId, weekId);
  if (usedAttempts >= maxAttempts) throw new Error('No attempts remaining');

  const attempt = usedAttempts + 1;
  const sessionId = SESSION_PREFIX + randomUUID();

  const sessionQuestions = bank.selectQuestions
    ? bank.selectQuestions()
    : (() => {
        const all = Array.isArray(bank.questions) ? bank.questions : [];
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(all.length, 10));
      })();

  const totalQuestions = sessionQuestions.length;

  createSession(sessionId, wallet, gameId, weekId, attempt);

  const isContinuous = bank.mode === 'continuous';
  const timeout = isContinuous ? 3600 : (totalQuestions * 70);

  const now = Date.now();
  const session = {
    wallet: wallet.toLowerCase(),
    gameId,
    weekId,
    attempt,
    questions: sessionQuestions,
    currentQ: 0,
    score: 0,
    startedAt: now,
    questionStartedAt: now,
    timeout: timeout * 1000,
    mode: bank.mode || 'sequential',
    _persisted: false
  };

  // For continuous games, init server-authoritative state
  if (isContinuous) {
    session.grid = [...sessionQuestions[0].puzzle];
    session.placements = [];
    session.hintLog = [];
    session.mistakes = 0;
    session.hintsUsed = 0;
  }

  activeSessions.set(sessionId, session);

  const token = jwt.sign({ sid: sessionId, wallet, gameId, weekId }, JWT_SECRET, { expiresIn: timeout + 60 });

  const q = sessionQuestions[0];
  const clientQuestion = bank.stripQuestion
    ? bank.stripQuestion(q)
    : defaultStripAnswer(q, 0);

  return {
    token,
    sessionId,
    attempt,
    maxAttempts,
    totalQuestions,
    mode: bank.mode || 'sequential',
    question: clientQuestion
  };
}

/**
 * Start a free-play session (no wallet, no on-chain entry required).
 * For continuous games with a seed, persists to SQLite for resilience.
 */
export function startFreeSession(gameId, weekId, opts) {
  const bank = questionBanks.get(gameId);
  if (!bank) throw new Error('Game not registered: ' + gameId);

  const seed = opts && opts.seed != null ? opts.seed : undefined;
  const contextType = (opts && opts.contextType) || 'free';
  const contextId = (opts && opts.contextId) || null;
  const puzzleIndex = (opts && opts.puzzleIndex != null) ? opts.puzzleIndex : null;
  const realWallet = (opts && opts.wallet) || null;

  // For league context, check for existing active session
  if (contextType === 'league' && realWallet && contextId != null && puzzleIndex != null) {
    const existing = getActiveGameState(realWallet, contextType, contextId, puzzleIndex);
    if (existing) {
      throw new Error('ACTIVE_SESSION_EXISTS');
    }
  }

  const sessionId = SESSION_PREFIX + 'free_' + randomUUID();
  const guestWallet = realWallet || ('0x' + randomUUID().replace(/-/g, '').slice(0, 40));

  const difficulty = (opts && opts.difficulty) || undefined;
  const sessionQuestions = bank.selectQuestions
    ? bank.selectQuestions(seed, difficulty)
    : (() => {
        const all = Array.isArray(bank.questions) ? bank.questions : [];
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(all.length, 10));
      })();

  const totalQuestions = sessionQuestions.length;
  const isContinuous = bank.mode === 'continuous';
  const timeout = isContinuous ? 3600 : (totalQuestions * 70);

  const now = Date.now();
  const session = {
    wallet: guestWallet.toLowerCase(),
    gameId,
    weekId,
    attempt: 1,
    questions: sessionQuestions,
    currentQ: 0,
    score: 0,
    startedAt: now,
    questionStartedAt: now,
    timeout: timeout * 1000,
    mode: bank.mode || 'sequential',
    freePlay: true,
    contextType,
    contextId,
    puzzleIndex,
    difficulty: difficulty || 'default',
    _persisted: false
  };

  // For continuous games, init server-authoritative state and persist
  if (isContinuous) {
    session.grid = [...sessionQuestions[0].puzzle];
    session.placements = [];
    session.hintLog = [];
    session.mistakes = 0;
    session.hintsUsed = 0;

    if (contextType === 'league') {
      const actualSeed = sessionQuestions[0].seed || seed;
      createGameState(sessionId, guestWallet, gameId, contextType, contextId, puzzleIndex, actualSeed, now, true, difficulty);
      session._persisted = true;
    }
  }

  activeSessions.set(sessionId, session);

  const token = jwt.sign({ sid: sessionId, wallet: guestWallet, gameId, weekId }, JWT_SECRET, { expiresIn: timeout + 60 });

  const q = sessionQuestions[0];
  const clientQuestion = bank.stripQuestion
    ? bank.stripQuestion(q)
    : defaultStripAnswer(q, 0);

  return {
    token,
    sessionId,
    attempt: 1,
    maxAttempts: 1,
    totalQuestions,
    mode: bank.mode || 'sequential',
    question: clientQuestion,
    freePlay: true
  };
}

/**
 * Resume an existing persistent session (league puzzle after refresh/restart).
 * Returns full state for the client to restore.
 */
export function resumeSession(wallet, contextType, contextId, puzzleIndex) {
  const row = getActiveGameState(wallet, contextType, contextId, puzzleIndex);
  if (!row) return null;

  // Check if already in memory
  let session = activeSessions.get(row.session_id);
  if (!session) {
    // Rebuild from SQLite
    session = rebuildSession(row);
    if (!session) return null;
    activeSessions.set(row.session_id, session);
  }

  // Check timeout
  if (Date.now() - session.startedAt > session.timeout) {
    activeSessions.delete(row.session_id);
    completeGameState(row.session_id, 'expired', 0, null);
    return null;
  }

  const bank = questionBanks.get(session.gameId);
  const q = session.questions[0];
  const clientQuestion = bank.stripQuestion ? bank.stripQuestion(q) : defaultStripAnswer(q, 0);

  // Issue new JWT
  const remaining = Math.ceil((session.timeout - (Date.now() - session.startedAt)) / 1000);
  const token = jwt.sign(
    { sid: row.session_id, wallet: session.wallet, gameId: session.gameId, weekId: session.weekId },
    JWT_SECRET,
    { expiresIn: remaining + 60 }
  );

  // Build hint cells list for client styling
  const hintCells = (session.hintLog || []).map(h => h.cell);

  return {
    token,
    sessionId: row.session_id,
    question: clientQuestion,
    grid: [...session.grid],
    mistakes: session.mistakes,
    hintsUsed: session.hintsUsed,
    elapsedMs: Date.now() - session.startedAt,
    hintCells,
    puzzleIndex: row.puzzle_index,
    status: 'active'
  };
}

/**
 * Rebuild an in-memory session from an active_game_state SQLite row.
 */
function rebuildSession(row) {
  const bank = questionBanks.get(row.game_id);
  if (!bank || !bank.selectQuestions) return null;

  const sessionQuestions = bank.selectQuestions(row.seed, row.difficulty || undefined);
  const puzzle = sessionQuestions[0].puzzle;
  const solution = sessionQuestions[0].solution;

  const placements = JSON.parse(row.placements || '[]');
  const hintLog = JSON.parse(row.hints || '[]');

  // Rebuild grid from puzzle + correct placements + hints
  const grid = [...puzzle];
  for (const p of placements) {
    if (p.correct) grid[p.cell] = p.value;
  }
  for (const h of hintLog) {
    // Use stored value if available; fall back to flat solution lookup
    // (KenKen/kakuro have 2D solutions, so h.value is required for those)
    grid[h.cell] = h.value !== undefined ? h.value : solution[h.cell];
  }

  return {
    wallet: row.wallet,
    gameId: row.game_id,
    weekId: getCurrentWeekId(),
    attempt: 1,
    questions: sessionQuestions,
    currentQ: 0,
    score: 0,
    startedAt: row.started_at,
    questionStartedAt: row.started_at,
    timeout: 3600 * 1000,
    mode: 'continuous',
    freePlay: !!row.free_play,
    contextType: row.context_type,
    contextId: row.context_id,
    puzzleIndex: row.puzzle_index,
    grid,
    placements,
    hintLog,
    mistakes: row.mistakes,
    hintsUsed: row.hints_used,
    difficulty: row.difficulty || 'default',
    _persisted: true
  };
}

/**
 * Recover active sessions from SQLite after server restart.
 * Call this after registerAllGames().
 */
export function recoverSessions() {
  const rows = loadActiveGameStates();
  let recovered = 0;
  for (const row of rows) {
    if (activeSessions.has(row.session_id)) continue;
    const session = rebuildSession(row);
    if (session && (Date.now() - session.startedAt <= session.timeout)) {
      activeSessions.set(row.session_id, session);
      recovered++;
    } else if (session) {
      completeGameState(row.session_id, 'expired', 0, null);
    }
  }
  if (recovered > 0) console.log(`Recovered ${recovered} active session(s) from database`);
}

/**
 * Build achievement context from session completion data.
 */
function buildAchContext(session, result, timeMs, won) {
  // Extract opening cards from poker-patience deal if available
  var openingCards = null;
  if (session.gameId === 'poker-patience' && session.questions && session.questions[0] && session.questions[0].cards) {
    openingCards = [session.questions[0].cards[0], session.questions[0].cards[1]];
  }
  var ctx = {
    type: 'session_complete',
    gameId: session.gameId,
    score: session.score,
    timeMs: timeMs,
    won: won,
    mistakes: session.mistakes || 0,
    hints: session.hintsUsed || 0,
    undoCount: session.undoCount || (session.questions && session.questions[0] && session.questions[0].undoCount) || 0,
    moveCount: session.moveCount || (session.questions && session.questions[0] && session.questions[0].moveCount) || 0,
    difficulty: session.difficulty || 'default',
    // Poker Patience: finalScores.results array with {name, points} per line
    finalScores: result.finalScores || null,
    // Poker Patience: first two cards dealt
    openingCards: openingCards,
    // Golf/Pyramid: remaining cards, cleared cards
    remaining: result.remaining !== undefined ? result.remaining : null,
    cleared: result.cleared !== undefined ? result.cleared : null,
    // Cribbage: track max single hand score across session
    maxHandScore: session._maxHandScore || 0,
    maxHandBreakdown: session._maxHandBreakdown || null,
  };
  return ctx;
}

/**
 * Evaluate a player's answer/action.
 */
export function evaluate(sessionToken, answer) {
  let payload;
  try {
    payload = jwt.verify(sessionToken, JWT_SECRET);
  } catch (e) {
    throw new Error('Invalid or expired session');
  }

  const session = activeSessions.get(payload.sid);
  if (!session) throw new Error('Session not found or expired');

  if (Date.now() - session.startedAt > session.timeout) {
    activeSessions.delete(payload.sid);
    expireSession(payload.sid);
    if (session._persisted) completeGameState(payload.sid, 'expired', 0, null);
    throw new Error('Session timed out');
  }

  const bank = questionBanks.get(session.gameId);
  const now = Date.now();

  // ── Marathon tracking (4+ hours continuous, no 15-min gap) ──────────
  try {
    if (process.env.ACHIEVEMENTS_ACTIVE === 'true' && session.wallet) {
      var prevActivity = session.lastActivityAt || null;
      if (prevActivity !== null) {
        var gap = now - prevActivity;
        if (gap > 900000) { // 15 minutes
          session.marathonBroken = true;
        }
      }
      session.lastActivityAt = now;

      var duration = now - session.startedAt;
      if (duration >= 14400000 && !session.marathonBroken) { // 4 hours
        awardAchievement(session.wallet, 'the-marathon');
      }
    }
  } catch (e) { /* marathon check must never block */ }

  // ── Continuous mode (Sudoku) ────────────────────────────────────────
  if (session.mode === 'continuous') {
    const q = session.questions[0];
    const elapsedMs = now - session.startedAt;
    const result = bank.evaluator(q, answer, elapsedMs, session);

    const response = {
      ...result,
      totalScore: session.score,
      finished: false
    };

    // Auto game-over from evaluator (3 mistakes)
    if (result.gameOver) {
      const partialScore = result.partialScore || 0;
      session.score = partialScore;
      if (!session.freePlay) completeSession(payload.sid, partialScore);
      if (session._persisted) completeGameState(payload.sid, 'gameover', partialScore, null);
      activeSessions.delete(payload.sid);
      response.totalScore = partialScore;
      response.finalScore = partialScore;
      response.finished = true;
      if (session.freePlay) response.freePlay = true;
      try { checkAchievements(session.wallet, buildAchContext(session, result, now - session.startedAt, false)); } catch (e) { /* achievement check must never block */ }
      // Minesweeper detonation tracking
      if (session.gameId === 'minesweeper' && result.detonated !== undefined) {
        try { checkMinesweeperFreePlay(session.wallet, session.difficulty, false); } catch (e) { /* must never block */ }
      }
      // Flag-everything check on Minesweeper game over
      if (session.gameId === 'minesweeper' && session.questions[0] && session.questions[0].flags) {
        try { checkFlagEverything(session.wallet, session.difficulty, session.questions[0].flags.size || 0); } catch (e) { /* must never block */ }
      }
    }
    // Successful submit
    else if (result.action === 'submit' && result.correct) {
      // Run input pattern analysis on placements
      var patternFlag = analyseInputPattern(session.placements);
      if (patternFlag) {
        result.flagged = result.flagged ? result.flagged + ',' + patternFlag : patternFlag;
      }
      session.score = result.points;
      if (!session.freePlay) {
        completeSession(payload.sid, session.score);
        upsertBestScore(session.wallet, session.gameId, session.weekId, session.score);
      }
      if (session._persisted) completeGameState(payload.sid, 'completed', session.score, result.flagged || null);
      // Personal best — successful completion only
      const completionTimeMs = now - session.startedAt;
      upsertPersonalBest(session.wallet, session.gameId, session.difficulty, session.score, completionTimeMs);
      activeSessions.delete(payload.sid);
      response.totalScore = session.score;
      response.finalScore = session.score;
      response.finished = true;
      if (session.freePlay) response.freePlay = true;
      try { checkAchievements(session.wallet, buildAchContext(session, result, completionTimeMs, true)); } catch (e) { /* achievement check must never block */ }
      // Minesweeper win
      if (session.gameId === 'minesweeper' && result.won) {
        try { checkMinesweeperFreePlay(session.wallet, session.difficulty, true); } catch (e) { /* must never block */ }
      }
      // Nonogram blind-eye (no hints used)
      if (session.gameId === 'nonogram') {
        try { checkBlindEye(session.wallet, session.hintsUsed || 0); } catch (e) { /* must never block */ }
      }
      // Kakuro sum-of-all-fears (every cell correct on first attempt)
      if (session.gameId === 'kakuro' && session.placements) {
        try { checkSumOfAllFears(session.wallet, session.placements); } catch (e) { /* must never block */ }
      }
    }
    // Failed submit (incomplete grid)
    else if (result.action === 'submit' && !result.correct) {
      var failPatternFlag = analyseInputPattern(session.placements);
      if (failPatternFlag) {
        result.flagged = result.flagged ? result.flagged + ',' + failPatternFlag : failPatternFlag;
      }
      const partialScore = result.points || 0;
      session.score = partialScore;
      if (!session.freePlay) completeSession(payload.sid, partialScore);
      if (session._persisted) completeGameState(payload.sid, 'gameover', partialScore, result.flagged || null);
      activeSessions.delete(payload.sid);
      response.totalScore = partialScore;
      response.finalScore = partialScore;
      response.finished = true;
      if (session.freePlay) response.freePlay = true;
      try { checkAchievements(session.wallet, buildAchContext(session, result, now - session.startedAt, false)); } catch (e) { /* achievement check must never block */ }
    }
    // Regular action (place/hint) — persist state
    else if (session._persisted) {
      persistSession(payload.sid, session);
    }

    return response;
  }

  // ── Sequential mode (Estimation Engine, etc.) ──────────────────────
  const q = session.questions[session.currentQ];
  const questionStarted = session.questionStartedAt || session.startedAt;
  const elapsedMs = now - questionStarted;

  const result = bank.evaluator(q, answer, elapsedMs);
  session.score += result.points || 0;

  // Track max single hand/question score for cribbage achievements
  if ((result.points || 0) > (session._maxHandScore || 0)) {
    session._maxHandScore = result.points;
    session._maxHandBreakdown = q.answer && q.answer.breakdown ? q.answer.breakdown : null;
  }

  session.currentQ++;
  session.questionStartedAt = Date.now();
  const finished = session.currentQ >= session.questions.length;

  // Prime or Composite wrong-answer-streak
  if (session.gameId === 'prime-or-composite') {
    try { checkWrongAnswerStreak(session.wallet, result.correct); } catch (e) { /* must never block */ }
  }

  const response = {
    correct: result.correct,
    points: result.points || 0,
    accuracy: result.accuracy,
    speedBonus: result.speedBonus,
    multiplier: result.multiplier,
    correctAnswer: q.answer,
    totalScore: session.score,
    questionNum: session.currentQ,
    totalQuestions: session.questions.length,
    finished
  };

  if (finished) {
    if (!session.freePlay) {
      completeSession(payload.sid, session.score);
      upsertBestScore(session.wallet, session.gameId, session.weekId, session.score);
    }
    // Personal best — sequential mode completion
    const completionTimeMs = now - session.startedAt;
    upsertPersonalBest(session.wallet, session.gameId, session.difficulty, session.score, completionTimeMs);
    activeSessions.delete(payload.sid);
    response.finalScore = session.score;
    if (session.freePlay) response.freePlay = true;
    try { checkAchievements(session.wallet, buildAchContext(session, result, completionTimeMs, true)); } catch (e) { /* achievement check must never block */ }
    try { checkMidnight(session.wallet); } catch (e) { /* must never block */ }
    try { checkFibonacci(session.wallet, session.score); } catch (e) { /* must never block */ }
  } else {
    const nextQ = session.questions[session.currentQ];
    response.question = bank.stripQuestion
      ? bank.stripQuestion(nextQ)
      : defaultStripAnswer(nextQ, session.currentQ);
  }

  return response;
}

/**
 * Default strip function for sequential games.
 */
function defaultStripAnswer(question, index) {
  return {
    num: index + 1,
    text: question.text,
    type: question.type,
    options: question.options || undefined,
    timeLimit: question.timeLimit || undefined
  };
}

// ── Cleanup expired sessions periodically ───────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of activeSessions) {
    if (now - session.startedAt > session.timeout) {
      activeSessions.delete(id);
      expireSession(id);
      if (session._persisted) completeGameState(id, 'expired', 0, null);
    }
  }
}, 30000);
