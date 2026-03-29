/**
 * Server-side score engine.
 *
 * CRITICAL: No answer data ever leaves this module.
 * Client sends ONLY: selected option index, text input, or timing events.
 * Server evaluates against stored answers and returns { correct, score }.
 */

import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { createSession, getSession, completeSession, expireSession, getSessionCount, upsertBestScore, getEntry } from './db/index.mjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const SESSION_PREFIX = 'sess_';

// ── Active sessions (in-memory for fast access during gameplay) ─────────────
// sessionId => { wallet, gameId, weekId, attempt, questions, currentQ, score, startedAt, timeout }
const activeSessions = new Map();

// ── Game question banks (loaded at startup, NEVER sent to client) ───────────
// gameId => { questions: [...], evaluator: fn }
const questionBanks = new Map();

/**
 * Register a game's question bank.
 * Called at server startup for each game.
 */
export function registerGame(gameId, questions, evaluator) {
  questionBanks.set(gameId, { questions, evaluator });
}

/**
 * Get current week ID (Monday 00:00 UTC → Sunday 23:59 UTC)
 */
export function getCurrentWeekId() {
  const now = new Date();
  const jan1 = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((now - jan1) / 86400000);
  // ISO week number
  const weekNum = Math.ceil((dayOfYear + jan1.getUTCDay() + 1) / 7);
  return now.getUTCFullYear() * 100 + weekNum; // e.g. 202614
}

/**
 * Start a game session after on-chain entry is confirmed.
 * Returns a signed JWT session token + first question (text only, no answer).
 */
export function startSession(wallet, gameId, weekId) {
  const bank = questionBanks.get(gameId);
  if (!bank) throw new Error('Game not registered: ' + gameId);

  const entry = getEntry(wallet, gameId, weekId);
  if (!entry) throw new Error('No entry found');

  const maxAttempts = entry.tier; // 1 or 3
  const usedAttempts = getSessionCount(wallet, gameId, weekId);
  if (usedAttempts >= maxAttempts) throw new Error('No attempts remaining');

  const attempt = usedAttempts + 1;
  const sessionId = SESSION_PREFIX + randomUUID();

  // Pick questions for this session (shuffle a subset)
  const gameConfig = bank.questions;
  const questionCount = Math.min(gameConfig.length, 10);
  const shuffled = [...gameConfig].sort(() => Math.random() - 0.5);
  const sessionQuestions = shuffled.slice(0, questionCount);

  // Store in DB
  createSession(sessionId, wallet, gameId, weekId, attempt);

  // Store in memory for fast access during gameplay
  const timeout = 300; // 5 minutes default
  activeSessions.set(sessionId, {
    wallet: wallet.toLowerCase(),
    gameId,
    weekId,
    attempt,
    questions: sessionQuestions,
    currentQ: 0,
    score: 0,
    startedAt: Date.now(),
    timeout: timeout * 1000
  });

  // Sign JWT
  const token = jwt.sign({ sid: sessionId, wallet, gameId, weekId }, JWT_SECRET, { expiresIn: timeout + 60 });

  // Return first question (text only)
  const q = sessionQuestions[0];
  return {
    token,
    sessionId,
    attempt,
    maxAttempts,
    totalQuestions: questionCount,
    question: stripAnswer(q, 0)
  };
}

/**
 * Evaluate a player's answer for the current question.
 * Client sends: { sessionToken, answer } where answer is option index, text, or timing data.
 * Returns: { correct, score, totalScore, questionNum, totalQuestions, nextQuestion?, finished? }
 */
export function evaluate(sessionToken, answer) {
  // Verify JWT
  let payload;
  try {
    payload = jwt.verify(sessionToken, JWT_SECRET);
  } catch (e) {
    throw new Error('Invalid or expired session');
  }

  const session = activeSessions.get(payload.sid);
  if (!session) throw new Error('Session not found or expired');

  // Check timeout
  if (Date.now() - session.startedAt > session.timeout) {
    activeSessions.delete(payload.sid);
    expireSession(payload.sid);
    throw new Error('Session timed out');
  }

  // Get current question and evaluate
  const q = session.questions[session.currentQ];
  const bank = questionBanks.get(session.gameId);
  const result = bank.evaluator(q, answer);

  if (result.correct) {
    session.score += result.points || 1;
  }

  session.currentQ++;
  const finished = session.currentQ >= session.questions.length;

  const response = {
    correct: result.correct,
    points: result.points || (result.correct ? 1 : 0),
    totalScore: session.score,
    questionNum: session.currentQ,
    totalQuestions: session.questions.length,
    finished
  };

  if (finished) {
    // Session complete — persist score
    completeSession(payload.sid, session.score);
    upsertBestScore(session.wallet, session.gameId, session.weekId, session.score);
    activeSessions.delete(payload.sid);
    response.finalScore = session.score;
  } else {
    // Send next question (text only, no answer)
    response.question = stripAnswer(session.questions[session.currentQ], session.currentQ);
  }

  return response;
}

/**
 * Strip answer data from a question before sending to client.
 * Returns only what the player should see.
 */
function stripAnswer(question, index) {
  return {
    num: index + 1,
    text: question.text,
    type: question.type, // 'mc', 'fill', 'score', 'timing'
    options: question.options || undefined, // MC option labels (not which is correct)
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
}, 30000); // every 30s
