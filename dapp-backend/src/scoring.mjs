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
 */

import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { createSession, getSession, completeSession, expireSession, getSessionCount, upsertBestScore, getEntry } from './db/index.mjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const SESSION_PREFIX = 'sess_';

// ── Active sessions (in-memory for fast access during gameplay) ─────────────
const activeSessions = new Map();

// ── Game registrations ──────────────────────────────────────────────────────
// gameId => { questions, evaluator, selectQuestions, stripQuestion, mode }
const questionBanks = new Map();

/**
 * Register a game.
 * @param {string} gameId
 * @param {*} questions - question bank data
 * @param {Function} evaluator - (question, answer, elapsedMs) => result
 * @param {Function} [selectQuestions] - () => array of questions for a session
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

  // Pick questions for this session
  const sessionQuestions = bank.selectQuestions
    ? bank.selectQuestions()
    : (() => {
        const all = Array.isArray(bank.questions) ? bank.questions : [];
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(all.length, 10));
      })();

  const totalQuestions = sessionQuestions.length;

  // Store in DB
  createSession(sessionId, wallet, gameId, weekId, attempt);

  // Determine timeout based on game mode
  const isContinuous = bank.mode === 'continuous';
  const timeout = isContinuous ? 3600 : (totalQuestions * 70); // 1hr for sudoku, 70s per q for sequential

  const now = Date.now();
  activeSessions.set(sessionId, {
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
    mode: bank.mode || 'sequential'
  });

  // Sign JWT
  const token = jwt.sign({ sid: sessionId, wallet, gameId, weekId }, JWT_SECRET, { expiresIn: timeout + 60 });

  // Strip question for client
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
    throw new Error('Session timed out');
  }

  const bank = questionBanks.get(session.gameId);
  const now = Date.now();

  // ── Continuous mode (Sudoku) ────────────────────────────────────────
  if (session.mode === 'continuous') {
    const q = session.questions[0]; // single puzzle for entire session
    const elapsedMs = now - session.startedAt;
    const result = bank.evaluator(q, answer, elapsedMs);

    // Spread any extra fields from result into response
    const response = {
      ...result,
      totalScore: session.score,
      finished: false
    };

    // If this was a final submit with points, complete the session
    if (result.action === 'submit' && result.correct) {
      session.score = result.points;
      completeSession(payload.sid, session.score);
      upsertBestScore(session.wallet, session.gameId, session.weekId, session.score);
      activeSessions.delete(payload.sid);
      response.totalScore = session.score;
      response.finalScore = session.score;
      response.finished = true;
    }

    // If game over (3 mistakes reported by client via submit with 0 points)
    if (result.action === 'submit' && !result.correct) {
      session.score = 0;
      completeSession(payload.sid, 0);
      activeSessions.delete(payload.sid);
      response.totalScore = 0;
      response.finalScore = 0;
      response.finished = true;
    }

    return response;
  }

  // ── Sequential mode (Estimation Engine, etc.) ──────────────────────
  const q = session.questions[session.currentQ];
  const questionStarted = session.questionStartedAt || session.startedAt;
  const elapsedMs = now - questionStarted;

  const result = bank.evaluator(q, answer, elapsedMs);
  session.score += result.points || 0;

  session.currentQ++;
  session.questionStartedAt = Date.now();
  const finished = session.currentQ >= session.questions.length;

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
    completeSession(payload.sid, session.score);
    upsertBestScore(session.wallet, session.gameId, session.weekId, session.score);
    activeSessions.delete(payload.sid);
    response.finalScore = session.score;
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
    }
  }
}, 30000);
