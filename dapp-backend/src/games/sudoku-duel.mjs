/**
 * Sudoku Duel — Server-side puzzle generation, validation, and scoring.
 *
 * Puzzle generated from a seed (daily or per-challenge).
 * Solution NEVER sent to client. Client receives only the clue grid.
 * Hints served one cell at a time via the evaluate endpoint.
 * Final grid validated server-side before score is recorded.
 *
 * Scoring:
 *   Base: 5000 points
 *   Mistake penalty: -300 per mistake (max 3 before game over)
 *   Hint penalty: -200 per hint used (max 5)
 *   Time multiplier: 1 / (1 + 0.008 × ln(1 + seconds))
 *   Final = max(1, floor((base - penalties) × multiplier))
 *   DNF (3 mistakes) = 0 points
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
function generateBoard(seed) {
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

  // Remove cells — 46 removed, 35 clues remain (medium difficulty)
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

// ── Session state stored in memory alongside the scoring engine ─────────
// We use a custom approach: the "questions" array has one entry (the puzzle),
// and the evaluator handles cell placements, hints, and final submission.

// Active sudoku sessions: sessionId => { puzzle, solution, grid, mistakes, hintsUsed, startedAt }
const sudokuSessions = new Map();

/**
 * Create a Sudoku session. Called by the scoring engine's startSession.
 * Returns the puzzle grid (no solution) as the "question".
 */
export function selectQuestions(seed) {
  const s = seed || getDailySeed();
  const { puzzle, solution } = generateBoard(s);

  // Return a single "question" that contains the puzzle
  return [{
    type: 'sudoku',
    text: 'Solve the Sudoku puzzle',
    puzzle: [...puzzle],
    solution: [...solution],
    seed: s,
  }];
}

/**
 * Evaluate a Sudoku action from the client.
 *
 * Actions:
 *   { action: 'place', cell: 0-80, value: 1-9 }  — place a number
 *   { action: 'erase', cell: 0-80 }               — erase a cell
 *   { action: 'hint', cell: 0-80 }                 — request a hint
 *   { action: 'submit', grid: [81 numbers] }       — submit completed grid
 *
 * Returns: { correct, points, ... } depending on action
 */
export function evaluator(question, answer, elapsedMs) {
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

    const isCorrect = value === solution[cell];
    return {
      correct: isCorrect,
      points: 0,
      action: 'place',
      cell: cell,
      isCorrect: isCorrect,
    };
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

    return {
      correct: true,
      points: 0,
      action: 'hint',
      cell: cell,
      value: solution[cell],
    };
  }

  // ── Submit completed grid ─────────────────────────────────────────
  if (answer.action === 'submit') {
    const grid = answer.grid;
    const mistakes = answer.mistakes || 0;
    const hints = answer.hints || 0;

    if (!Array.isArray(grid) || grid.length !== 81) {
      return { correct: false, points: 0, error: 'Invalid grid' };
    }

    // Validate every cell matches solution
    let correct = true;
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== solution[i]) {
        correct = false;
        break;
      }
    }

    if (!correct) {
      return { correct: false, points: 0, error: 'Grid does not match solution' };
    }

    // Calculate score
    const secs = elapsedMs ? elapsedMs / 1000 : 0;
    const pen = mistakes * MISTAKE_COST + hints * HINT_COST;
    const mult = 1 / (1 + TIME_DECAY * Math.log(1 + secs));
    const points = Math.max(1, Math.round((BASE_SCORE - pen) * mult));

    return {
      correct: true,
      points: points,
      action: 'submit',
      time: Math.round(secs),
      mistakes: mistakes,
      hints: hints,
      multiplier: Math.round(mult * 1000) / 1000,
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
