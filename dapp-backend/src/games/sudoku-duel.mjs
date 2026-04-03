/**
 * Sudoku Duel — Server-side puzzle generation, validation, and scoring.
 *
 * Puzzle generated from a seed (daily or per-challenge).
 * Solution NEVER sent to client. Client receives only the clue grid.
 * Server tracks all state: grid, mistakes, hints, placement timestamps.
 *
 * Scoring:
 *   Base: 5000 points
 *   Mistake penalty: -300 per mistake (max 3 before game over)
 *   Hint penalty: -200 per hint used (max 5)
 *   Time multiplier: 1 / (1 + 0.008 × ln(1 + seconds))
 *   Final = max(1, floor((base - penalties) × multiplier))
 *   DNF (3 mistakes) = partial credit (20 pts per correct cell)
 *
 * Anti-cheat:
 *   Hard floor: total solve < 60s → reject
 *   Soft flag: total < 120s, 0 mistakes, 0 hints → flag for review
 *   Rapid input: 10+ consecutive correct cells avg < 1.5s → flag
 *
 * SOLUTION NEVER LEAVES THIS FILE.
 */

export const GAME_ID = 'sudoku-duel';

export const BASE_SCORE = 5000;
export const MISTAKE_COST = 300;
export const HINT_COST = 200;
export const TIME_DECAY = 0.008;
export const MAX_MISTAKES = 3;
export const MAX_HINTS = 5;

// Anti-cheat thresholds
const MIN_SOLVE_MS = 60_000;
const SOFT_FLAG_MS = 120_000;
const RAPID_WINDOW = 10;
const RAPID_THRESHOLD_MS = 1500;

// ── Seeded PRNG ─────────────────────────────────────────────────────────
function seededRand(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Puzzle generation ───────────────────────────────────────────────────
export function generateBoard(seed) {
  const rng = seededRand(seed);
  const board = Array(81).fill(0);

  function isValid(b, pos, num) {
    const row = Math.floor(pos / 9), col = pos % 9;
    const boxR = Math.floor(row / 3) * 3, boxC = Math.floor(col / 3) * 3;
    for (let i = 0; i < 9; i++) {
      if (b[row * 9 + i] === num) return false;
      if (b[i * 9 + col] === num) return false;
      if (b[(boxR + Math.floor(i / 3)) * 9 + (boxC + i % 3)] === num) return false;
    }
    return true;
  }

  function solve(b, pos) {
    if (pos === undefined) pos = 0;
    while (pos < 81 && b[pos] !== 0) pos++;
    if (pos === 81) return true;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    for (const n of nums) {
      if (isValid(b, pos, n)) {
        b[pos] = n;
        if (solve(b, pos + 1)) return true;
        b[pos] = 0;
      }
    }
    return false;
  }

  solve(board);
  const solution = [...board];

  const positions = shuffle([...Array(81).keys()], rng);
  const puzzle = [...board];
  let removed = 0;
  for (const pos of positions) {
    if (removed >= 46) break;
    puzzle[pos] = 0;
    removed++;
  }

  return { puzzle, solution };
}

// ── Seed generation ─────────────────────────────────────────────────────
export function getDailySeed() {
  const epoch = new Date('2026-01-01');
  return Math.floor((Date.now() - epoch) / 86400000) + 42;
}

/**
 * Create a Sudoku session. Called by the scoring engine's startSession.
 * Returns the puzzle grid (no solution) as the "question".
 */
export function selectQuestions(seed) {
  const s = seed || getDailySeed();
  const { puzzle, solution } = generateBoard(s);

  return [{
    type: 'sudoku',
    text: 'Solve the Sudoku puzzle',
    puzzle: [...puzzle],
    solution: [...solution],
    seed: s,
  }];
}

// ── Anti-cheat checks ───────────────────────────────────────────────────
function checkAntiCheat(session, elapsedMs) {
  let flagged = null;

  if (elapsedMs < MIN_SOLVE_MS) {
    return 'solve_too_fast';
  }

  if (elapsedMs < SOFT_FLAG_MS && session.mistakes === 0 && session.hintsUsed === 0) {
    flagged = 'suspiciously_fast';
  }

  const correctPlacements = session.placements.filter(p => p.correct);
  if (correctPlacements.length >= RAPID_WINDOW) {
    for (let i = 0; i <= correctPlacements.length - RAPID_WINDOW; i++) {
      const windowMs = correctPlacements[i + RAPID_WINDOW - 1].ts - correctPlacements[i].ts;
      if (windowMs / RAPID_WINDOW < RAPID_THRESHOLD_MS) {
        flagged = flagged || 'rapid_input';
        break;
      }
    }
  }

  return flagged;
}

/**
 * Evaluate a Sudoku action from the client.
 * Server-authoritative: session object tracks grid, mistakes, hints, placements.
 *
 * Actions:
 *   { action: 'place', cell: 0-80, value: 1-9 }
 *   { action: 'hint', cell: 0-80 }
 *   { action: 'submit' }
 */
export function evaluator(question, answer, elapsedMs, session) {
  if (typeof answer === 'string') {
    try { answer = JSON.parse(answer); } catch(e) {
      return { correct: false, points: 0, error: 'Invalid action' };
    }
  }

  if (!answer || !answer.action) {
    return { correct: false, points: 0, error: 'No action specified' };
  }

  const puzzle = question.puzzle;
  const solution = question.solution;
  const now = Date.now();

  // Initialise server-authoritative state on session if not present
  if (!session.grid) session.grid = [...puzzle];
  if (!session.placements) session.placements = [];
  if (!session.hintLog) session.hintLog = [];
  if (session.mistakes === undefined) session.mistakes = 0;
  if (session.hintsUsed === undefined) session.hintsUsed = 0;

  // ── Place a number ──────────────────────────────────────────────────
  if (answer.action === 'place') {
    const cell = answer.cell;
    const value = answer.value;

    if (cell < 0 || cell > 80 || value < 1 || value > 9) {
      return { correct: false, points: 0, error: 'Invalid cell or value' };
    }
    if (puzzle[cell] !== 0) {
      return { correct: false, points: 0, error: 'Cannot modify given cell' };
    }
    if (session.grid[cell] !== 0) {
      // Idempotent: if client re-sends the same correct value, just confirm it
      if (session.grid[cell] === value) {
        return { correct: true, points: 0, action: 'place', cell, isCorrect: true, mistakes: session.mistakes, hintsUsed: session.hintsUsed };
      }
      return { correct: false, points: 0, error: 'Cell already filled' };
    }

    const isCorrect = value === solution[cell];

    session.placements.push({ cell, value, correct: isCorrect, ts: now });

    if (isCorrect) {
      session.grid[cell] = value;
    } else {
      session.mistakes++;
    }

    const result = {
      correct: isCorrect,
      points: 0,
      action: 'place',
      cell: cell,
      isCorrect: isCorrect,
      mistakes: session.mistakes,
      hintsUsed: session.hintsUsed,
    };

    // Auto game-over on 3 mistakes
    if (session.mistakes >= MAX_MISTAKES) {
      let correctCells = 0;
      for (let i = 0; i < 81; i++) {
        if (puzzle[i] === 0 && session.grid[i] === solution[i]) correctCells++;
      }
      result.gameOver = true;
      result.partialScore = correctCells * 20;
    }

    return result;
  }

  // ── Request a hint ────────────────────────────────────────────────
  if (answer.action === 'hint') {
    const cell = answer.cell;
    if (cell < 0 || cell > 80) {
      return { correct: false, points: 0, error: 'Invalid cell' };
    }
    if (puzzle[cell] !== 0) {
      return { correct: false, points: 0, error: 'Cell is already given' };
    }
    if (session.grid[cell] !== 0) {
      return { correct: false, points: 0, error: 'Cell already filled' };
    }
    if (session.hintsUsed >= MAX_HINTS) {
      return { correct: false, points: 0, error: 'No hints remaining' };
    }

    session.hintsUsed++;
    session.grid[cell] = solution[cell];
    session.hintLog.push({ cell, ts: now });

    return {
      correct: true,
      points: 0,
      action: 'hint',
      cell: cell,
      value: solution[cell],
      mistakes: session.mistakes,
      hintsUsed: session.hintsUsed,
    };
  }

  // ── Submit (check completion) ─────────────────────────────────────
  if (answer.action === 'submit') {
    // Check if grid is complete and correct (using server grid, not client)
    let complete = true;
    for (let i = 0; i < 81; i++) {
      if (session.grid[i] !== solution[i]) {
        complete = false;
        break;
      }
    }

    if (!complete) {
      // Partial credit for game-over or incomplete submit
      let correctCells = 0;
      for (let i = 0; i < 81; i++) {
        if (puzzle[i] === 0 && session.grid[i] === solution[i]) correctCells++;
      }
      const partialScore = correctCells * 20;
      return { correct: false, points: partialScore, action: 'submit', partialCredit: true, correctCells: correctCells };
    }

    // Anti-cheat
    const flagged = checkAntiCheat(session, elapsedMs);
    if (flagged === 'solve_too_fast') {
      return { correct: false, points: 0, action: 'submit', error: 'Solve time too fast', flagged: 'solve_too_fast' };
    }

    // Calculate score using server-authoritative state
    const secs = elapsedMs ? elapsedMs / 1000 : 0;
    const pen = session.mistakes * MISTAKE_COST + session.hintsUsed * HINT_COST;
    const mult = 1 / (1 + TIME_DECAY * Math.log(1 + secs));
    const points = Math.max(1, Math.round((BASE_SCORE - pen) * mult));

    return {
      correct: true,
      points: points,
      action: 'submit',
      time: Math.round(secs),
      mistakes: session.mistakes,
      hints: session.hintsUsed,
      multiplier: Math.round(mult * 1000) / 1000,
      flagged: flagged,
    };
  }

  return { correct: false, points: 0, error: 'Unknown action: ' + answer.action };
}

/**
 * Strip answer data from the puzzle before sending to client.
 * Client receives only the clue grid, never the solution.
 */
export function stripQuestion(question) {
  return {
    type: 'sudoku',
    text: question.text,
    puzzle: question.puzzle,
    seed: question.seed,
    scoring: {
      base: BASE_SCORE,
      mistakeCost: MISTAKE_COST,
      hintCost: HINT_COST,
      maxMistakes: MAX_MISTAKES,
      maxHints: MAX_HINTS,
    }
  };
}
