/**
 * Kakuro — Server-side puzzle generation, validation, and scoring.
 *
 * Crossword-style number puzzle on a 10x10 grid.
 * Black cells separate runs of white cells. Clue cells show target sums.
 * Each run: digits 1-9, no repeats, must sum to the clue value.
 *
 * Generation: seeded PRNG -> select template -> fill via constraint propagation
 * + backtracking -> compute clues -> validate unique solution.
 * Solution NEVER sent to client.
 *
 * Templates defined as explicit run lists. Every white cell is in exactly one
 * across run and one down run (both length 2-4).
 *
 * Scoring:
 *   Base: 5000
 *   Time: -1 pt/sec after 90s grace period
 *   Mistakes: -300 per incorrect cell on submission
 *   Hints: -500 per cell revealed (max 25% of white cells)
 *   Sum helper: if enabled, -10% penalty (multiply final by 0.9)
 *   Minimum: 0
 */

export const GAME_ID = 'kakuro';

// ── Scoring constants ───────────────────────────────────────────────────
export const BASE_SCORE = 5000;
export const GRACE_PERIOD = 90;
export const MISTAKE_COST = 300;
export const HINT_COST = 500;

// ── Seeded PRNG (mulberry32) ────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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

// ── Sum decomposition helper ────────────────────────────────────────────
const _decompCache = new Map();

export function sumDecompositions(targetSum, length) {
  const key = `${targetSum}_${length}`;
  if (_decompCache.has(key)) return _decompCache.get(key);

  const results = [];

  function search(minDigit, remaining, currentSum, combo) {
    if (remaining === 0) {
      if (currentSum === targetSum) results.push([...combo]);
      return;
    }
    const maxDigit = Math.min(9, targetSum - currentSum - (remaining - 1));
    for (let d = minDigit; d <= maxDigit; d++) {
      combo.push(d);
      search(d + 1, remaining - 1, currentSum + d, combo);
      combo.pop();
    }
  }

  search(1, length, 0, []);
  _decompCache.set(key, results);
  return results;
}

// ── Template definitions ────────────────────────────────────────────────
// Each template is defined as explicit run lists.
// R(dir, row, col, len) where dir='A' (across) or 'D' (down).
//
// Every white cell must appear in exactly one across run and one down run.
// All runs are length 2-4.
//
// Templates use a "block" approach: overlapping rectangular regions of
// white cells where across and down runs cross at every white cell.

function R(dir, r, c, len) { return { dir, r, c, len }; }

// Programmatic template generation: create grid patterns where
// rectangular blocks of white cells are placed so that every cell
// has both an across and down run crossing through it.
//
// Strategy: place 2x2, 2x3, 3x2, 3x3, 2x4, 4x2 blocks of white cells.
// Each block naturally creates across runs (rows) and down runs (cols).

function blockToRuns(topR, topC, rows, cols) {
  const runs = [];
  // Across runs: one per row of the block
  for (let r = topR; r < topR + rows; r++) {
    runs.push(R('A', r, topC, cols));
  }
  // Down runs: one per column of the block
  for (let c = topC; c < topC + cols; c++) {
    runs.push(R('D', topR, c, rows));
  }
  return runs;
}

// Verify no cell conflicts (no cell in two across or two down runs)
function validateRuns(runs) {
  const acrossMap = new Map(); // "r,c" => runIndex
  const downMap = new Map();

  for (let ri = 0; ri < runs.length; ri++) {
    const run = runs[ri];
    for (let i = 0; i < run.len; i++) {
      const r = run.dir === 'A' ? run.r : run.r + i;
      const c = run.dir === 'A' ? run.c + i : run.c;
      const key = `${r},${c}`;
      const map = run.dir === 'A' ? acrossMap : downMap;
      if (map.has(key)) return false; // cell in two runs of same direction
      map.set(key, ri);
    }
  }

  // Every cell must be in both an across and a down run
  const allKeys = new Set([...acrossMap.keys(), ...downMap.keys()]);
  for (const key of allKeys) {
    if (!acrossMap.has(key) || !downMap.has(key)) return false;
  }

  return allKeys.size >= 20;
}

// Build templates from block arrangements
// Each block: [topRow, topCol, blockRows, blockCols]
// Blocks must not share cells.
const BLOCK_LAYOUTS = [
  // Layout 0: 4 blocks in corners + 1 centre
  [[0, 0, 3, 3], [0, 5, 3, 3], [5, 0, 3, 3], [5, 5, 3, 3], [3, 3, 2, 2]],

  // Layout 1: 3x3 grid of 2x2 blocks
  [[0, 0, 2, 2], [0, 4, 2, 2], [0, 8, 2, 2],
   [4, 0, 2, 2], [4, 4, 2, 2], [4, 8, 2, 2],
   [8, 0, 2, 2], [8, 4, 2, 2], [8, 8, 2, 2]],

  // Layout 2: Large L-shapes
  [[0, 0, 4, 2], [0, 4, 4, 2], [0, 8, 4, 2],
   [6, 0, 4, 2], [6, 4, 4, 2], [6, 8, 4, 2]],

  // Layout 3: Horizontal bars
  [[0, 0, 2, 4], [0, 6, 2, 4],
   [3, 1, 2, 4], [3, 6, 2, 4],
   [6, 0, 2, 4], [6, 6, 2, 4],
   [9, 2, 1, 1]], // dummy to avoid, will be filtered

  // Layout 4: Mixed sizes
  [[0, 0, 3, 4], [0, 6, 3, 4],
   [5, 0, 3, 4], [5, 6, 3, 4],
   [3, 3, 2, 4]],

  // Layout 5: Staircase
  [[0, 0, 3, 3], [0, 5, 2, 3],
   [3, 2, 3, 3], [3, 7, 2, 3],
   [6, 0, 2, 3], [6, 5, 3, 3],
   [8, 3, 2, 2]],

  // Layout 6: Compact cross
  [[0, 2, 3, 2], [0, 6, 3, 2],
   [2, 0, 2, 3], [2, 5, 2, 3],
   [5, 0, 2, 3], [5, 5, 2, 3],
   [7, 2, 3, 2], [7, 6, 3, 2]],

  // Layout 7: Big corners + cross centre
  [[0, 0, 4, 3], [0, 7, 4, 3],
   [6, 0, 4, 3], [6, 7, 4, 3],
   [4, 4, 2, 2]],

  // Layout 8: Five 2x4 bars
  [[0, 0, 2, 4], [0, 6, 2, 4],
   [3, 3, 2, 4],
   [6, 0, 2, 4], [6, 6, 2, 4],
   [9, 3, 1, 1]], // filtered

  // Layout 9: 3-row arrangement
  [[0, 0, 3, 3], [0, 4, 3, 2], [0, 7, 3, 3],
   [4, 1, 2, 3], [4, 5, 2, 4],
   [7, 0, 3, 3], [7, 4, 3, 2], [7, 7, 3, 3]],

  // Layout 10: 4x2 columns
  [[0, 0, 4, 2], [0, 3, 4, 2], [0, 6, 4, 2],
   [5, 1, 4, 2], [5, 4, 4, 2], [5, 7, 4, 2]],

  // Layout 11: Checkerboard of 2x2
  [[0, 0, 2, 2], [0, 3, 2, 2], [0, 6, 2, 2],
   [3, 1, 2, 2], [3, 4, 2, 2], [3, 7, 2, 2],
   [6, 0, 2, 2], [6, 3, 2, 2], [6, 6, 2, 2],
   [8, 1, 2, 2], [8, 4, 2, 2], [8, 8, 2, 2]],

  // Layout 12: T-shapes
  [[0, 0, 2, 4], [2, 1, 3, 2],
   [0, 6, 2, 4], [2, 7, 3, 2],
   [6, 0, 3, 2], [8, 0, 2, 4],
   [6, 7, 3, 2], [8, 6, 2, 4]],

  // Layout 13: Vertical stripes
  [[0, 0, 3, 2], [4, 0, 3, 2], [8, 0, 2, 2],
   [0, 4, 3, 2], [4, 4, 3, 2], [8, 4, 2, 2],
   [0, 8, 3, 2], [4, 8, 3, 2], [8, 8, 2, 2]],

  // Layout 14: Diagonal blocks
  [[0, 0, 3, 3],
   [1, 4, 3, 3],
   [2, 7, 3, 3],
   [5, 0, 3, 3],
   [6, 4, 3, 3],
   [7, 7, 3, 3]],

  // Layout 15: Quad + centre
  [[0, 0, 2, 3], [0, 5, 2, 3],
   [3, 0, 2, 3], [3, 5, 2, 3],
   [6, 0, 2, 3], [6, 5, 2, 3],
   [4, 3, 2, 2], [8, 2, 2, 3], [8, 7, 2, 3]],

  // Layout 16: Wide middle
  [[0, 1, 2, 3], [0, 6, 2, 3],
   [3, 0, 4, 3], [3, 5, 4, 3],
   [8, 1, 2, 3], [8, 6, 2, 3]],

  // Layout 17: Dense 2x3 grid
  [[0, 0, 2, 3], [0, 4, 2, 3], [0, 8, 2, 2],
   [3, 0, 2, 3], [3, 4, 2, 3], [3, 8, 2, 2],
   [6, 0, 2, 3], [6, 4, 2, 3], [6, 8, 2, 2],
   [9, 1, 1, 1]], // filtered

  // Layout 18: Big H
  [[0, 0, 4, 2], [0, 8, 4, 2],
   [3, 2, 2, 4],
   [6, 0, 4, 2], [6, 8, 4, 2],
   [6, 4, 2, 2]],

  // Layout 19: Scattered 3x2
  [[0, 1, 3, 2], [0, 5, 3, 2],
   [1, 8, 3, 2],
   [4, 0, 3, 2], [4, 4, 3, 2],
   [5, 8, 3, 2],
   [8, 1, 2, 2], [8, 5, 2, 2]],

  // Layout 20: Row-paired
  [[0, 0, 2, 4], [0, 5, 2, 4],
   [3, 1, 2, 3], [3, 5, 2, 4],
   [6, 0, 2, 4], [6, 5, 2, 4],
   [9, 2, 1, 1]], // filtered

  // Layout 21: Offset 3x3
  [[0, 1, 3, 3], [0, 6, 3, 3],
   [4, 0, 3, 3], [4, 5, 3, 3],
   [8, 1, 2, 3], [8, 6, 2, 3]],

  // Layout 22: Six pack of 3x2
  [[0, 0, 3, 2], [0, 4, 3, 2], [0, 8, 3, 2],
   [5, 0, 3, 2], [5, 4, 3, 2], [5, 8, 3, 2],
   [3, 2, 2, 2], [3, 6, 2, 2]],

  // Layout 23: Asymmetric cluster
  [[0, 0, 4, 3], [0, 5, 2, 4],
   [3, 6, 3, 3],
   [5, 0, 2, 4],
   [6, 5, 4, 3],
   [8, 0, 2, 3]],
];

// Convert block layouts to run lists and validate
const TEMPLATES = [];

for (let li = 0; li < BLOCK_LAYOUTS.length; li++) {
  const blocks = BLOCK_LAYOUTS[li];
  const allRuns = [];
  let hasConflict = false;
  const occupiedCells = new Set();

  for (const [tr, tc, rows, cols] of blocks) {
    // Skip dummy blocks
    if (rows < 2 || cols < 2) continue;
    // Skip out-of-bounds
    if (tr + rows > 10 || tc + cols > 10) continue;

    // Check for cell conflicts with existing blocks
    let conflict = false;
    for (let r = tr; r < tr + rows; r++) {
      for (let c = tc; c < tc + cols; c++) {
        if (occupiedCells.has(`${r},${c}`)) { conflict = true; break; }
      }
      if (conflict) break;
    }
    if (conflict) { hasConflict = true; continue; }

    // Mark cells as occupied
    for (let r = tr; r < tr + rows; r++) {
      for (let c = tc; c < tc + cols; c++) {
        occupiedCells.add(`${r},${c}`);
      }
    }

    allRuns.push(...blockToRuns(tr, tc, rows, cols));
  }

  if (validateRuns(allRuns)) {
    TEMPLATES.push({ runs: allRuns, whiteCellCount: occupiedCells.size });
  }
}

// ── Helper: get cells in a run ──────────────────────────────────────────
function getRunCells(run) {
  const cells = [];
  for (let i = 0; i < run.len; i++) {
    const r = run.dir === 'A' ? run.r : run.r + i;
    const c = run.dir === 'A' ? run.c + i : run.c;
    cells.push([r, c]);
  }
  return cells;
}

// ── Grid filling via backtracking ───────────────────────────────────────
function fillGrid(runs, rng, maxNodes) {
  const SIZE = 10;
  const grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
  const limit = maxNodes || 200000;

  const runCells = runs.map(r => getRunCells(r));

  const cellToRuns = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => [])
  );
  runs.forEach((run, ri) => {
    for (const [r, c] of runCells[ri]) {
      cellToRuns[r][c].push(ri);
    }
  });

  const whiteCells = [];
  const isWhite = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
  for (const rc of runCells) {
    for (const [r, c] of rc) {
      if (!isWhite[r][c]) {
        isWhite[r][c] = true;
        whiteCells.push([r, c]);
      }
    }
  }
  whiteCells.sort((a, b) => a[0] * SIZE + a[1] - (b[0] * SIZE + b[1]));

  const runUsed = new Array(runs.length).fill(0);
  let solved = false;
  let nodeCount = 0;

  function backtrack(idx) {
    if (solved || ++nodeCount > limit) return;
    if (idx === whiteCells.length) {
      solved = true;
      return;
    }

    const [r, c] = whiteCells[idx];

    let forbidden = 0;
    for (const ri of cellToRuns[r][c]) forbidden |= runUsed[ri];

    const allowed = [];
    for (let d = 1; d <= 9; d++) {
      if (!(forbidden & (1 << d))) allowed.push(d);
    }
    const shuffled = shuffle(allowed, rng);

    for (const d of shuffled) {
      grid[r][c] = d;
      const bit = 1 << d;
      const myRuns = cellToRuns[r][c];
      for (const ri of myRuns) runUsed[ri] |= bit;

      backtrack(idx + 1);
      if (solved) return;

      grid[r][c] = 0;
      for (const ri of myRuns) runUsed[ri] &= ~bit;
    }
  }

  backtrack(0);
  return solved ? grid : null;
}

// ── Compute clues from filled grid ──────────────────────────────────────
function computeClues(runs, grid) {
  return runs.map(run => {
    const cells = getRunCells(run);
    const sum = cells.reduce((acc, [r, c]) => acc + grid[r][c], 0);
    return { dir: run.dir, r: run.r, c: run.c, len: run.len, sum };
  });
}

// ── Unique solution validator ───────────────────────────────────────────
function hasUniqueSolution(runs, clues, maxNodes) {
  const SIZE = 10;
  const limit = maxNodes || 500000;

  const runCells = runs.map(r => getRunCells(r));
  const cellToRuns = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => [])
  );
  runs.forEach((_, ri) => {
    for (const [r, c] of runCells[ri]) {
      cellToRuns[r][c].push(ri);
    }
  });

  const whiteCells = [];
  const seen = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
  for (const rc of runCells) {
    for (const [r, c] of rc) {
      if (!seen[r][c]) {
        seen[r][c] = true;
        whiteCells.push([r, c]);
      }
    }
  }
  whiteCells.sort((a, b) => a[0] * SIZE + a[1] - (b[0] * SIZE + b[1]));

  const grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
  const runUsed = new Array(runs.length).fill(0);
  const runPartialSum = new Array(runs.length).fill(0);
  const runFilled = new Array(runs.length).fill(0);

  let solutionCount = 0;
  let nodeCount = 0;

  function backtrack(idx) {
    if (solutionCount >= 2 || ++nodeCount > limit) return;

    if (idx === whiteCells.length) {
      solutionCount++;
      return;
    }

    const [r, c] = whiteCells[idx];
    const myRuns = cellToRuns[r][c];

    let forbidden = 0;
    for (const ri of myRuns) forbidden |= runUsed[ri];

    for (let d = 1; d <= 9; d++) {
      if (forbidden & (1 << d)) continue;

      let valid = true;
      for (const ri of myRuns) {
        const newSum = runPartialSum[ri] + d;
        const newFilled = runFilled[ri] + 1;
        const runLen = runs[ri].len;
        const targetSum = clues[ri].sum;

        if (newFilled === runLen) {
          if (newSum !== targetSum) { valid = false; break; }
        } else {
          const remaining = runLen - newFilled;
          const usedMask = runUsed[ri] | (1 << d);

          let minRem = 0, count = 0;
          for (let v = 1; v <= 9 && count < remaining; v++) {
            if (!(usedMask & (1 << v))) { minRem += v; count++; }
          }
          if (count < remaining || newSum + minRem > targetSum) {
            valid = false; break;
          }

          let maxRem = 0; count = 0;
          for (let v = 9; v >= 1 && count < remaining; v--) {
            if (!(usedMask & (1 << v))) { maxRem += v; count++; }
          }
          if (newSum + maxRem < targetSum) {
            valid = false; break;
          }
        }
      }
      if (!valid) continue;

      grid[r][c] = d;
      const bit = 1 << d;
      for (const ri of myRuns) {
        runUsed[ri] |= bit;
        runPartialSum[ri] += d;
        runFilled[ri]++;
      }

      backtrack(idx + 1);

      grid[r][c] = 0;
      for (const ri of myRuns) {
        runUsed[ri] &= ~bit;
        runPartialSum[ri] -= d;
        runFilled[ri]--;
      }

      if (solutionCount >= 2) return;
    }
  }

  backtrack(0);
  return solutionCount === 1;
}

// ── Build the layout info for client ────────────────────────────────────
function buildLayout(runs) {
  const SIZE = 10;
  const isWhite = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
  for (const run of runs) {
    for (const [r, c] of getRunCells(run)) {
      isWhite[r][c] = true;
    }
  }

  const layout = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => isWhite[r][c] ? 'W' : 'B')
  );

  return { layout, isWhite };
}

// ── Puzzle generation ───────────────────────────────────────────────────
function generatePuzzle(seed) {
  const rng = mulberry32(seed);

  if (TEMPLATES.length === 0) {
    throw new Error('Kakuro: no valid templates available');
  }

  const templateOrder = shuffle([...Array(TEMPLATES.length).keys()], rng);

  for (const ti of templateOrder) {
    const { runs } = TEMPLATES[ti];

    const localRng = mulberry32(seed ^ (ti * 7919));
    const grid = fillGrid(runs, localRng, 300000);
    if (!grid) continue;

    const clues = computeClues(runs, grid);

    if (hasUniqueSolution(runs, clues, 500000)) {
      const { layout, isWhite } = buildLayout(runs);
      return {
        templateIndex: ti,
        grid,
        runs,
        clues,
        layout,
        isWhite,
        whiteCellCount: TEMPLATES[ti].whiteCellCount,
      };
    }
  }

  // Fallback: use first template that fills (skip uniqueness check)
  for (const ti of templateOrder) {
    const { runs } = TEMPLATES[ti];
    const localRng = mulberry32(seed ^ (ti * 7919));
    const grid = fillGrid(runs, localRng, 500000);
    if (grid) {
      const clues = computeClues(runs, grid);
      const { layout, isWhite } = buildLayout(runs);
      return {
        templateIndex: ti,
        grid,
        runs,
        clues,
        layout,
        isWhite,
        whiteCellCount: TEMPLATES[ti].whiteCellCount,
      };
    }
  }

  throw new Error('Kakuro: failed to generate puzzle from any template');
}

// ── Daily seed ──────────────────────────────────────────────────────────
export function getDailySeed() {
  const epoch = new Date('2026-01-01');
  return Math.floor((Date.now() - epoch) / 86400000) + 200;
}

// ── Session interface ───────────────────────────────────────────────────

export function selectQuestions(seed, difficulty) {
  const s = seed || getDailySeed();
  const puzzle = generatePuzzle(s);

  const solution = Array.from({ length: 10 }, () => new Array(10).fill(0));
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      solution[r][c] = puzzle.isWhite[r][c] ? puzzle.grid[r][c] : 0;
    }
  }

  return [{
    type: 'kakuro',
    text: 'Solve the Kakuro puzzle',
    layout: puzzle.layout,
    clues: puzzle.clues.map(cl => ({
      dir: cl.dir,
      r: cl.r,
      c: cl.c,
      len: cl.len,
      sum: cl.sum,
    })),
    puzzle: new Array(100).fill(0),
    solution,
    whiteCellCount: puzzle.whiteCellCount,
    seed: s,
  }];
}

export function evaluator(question, answer, elapsedMs, session) {
  if (typeof answer === 'string') {
    try { answer = JSON.parse(answer); } catch (e) {
      return { correct: false, points: 0, error: 'Invalid action' };
    }
  }

  if (!answer || !answer.action) {
    return { correct: false, points: 0, error: 'No action specified' };
  }

  const solution = question.solution;
  const layout = question.layout;

  // Initialise server-authoritative state on session if not present
  if (session && !session.placements) session.placements = [];
  if (session && !session.hintLog) session.hintLog = [];
  if (session && session.mistakes === undefined) session.mistakes = 0;
  if (session && session.hintsUsed === undefined) session.hintsUsed = 0;
  if (session && session.submitFailures === undefined) session.submitFailures = 0;

  // ── Place a number ──────────────────────────────────────────────
  if (answer.action === 'place') {
    const { row, col, value } = answer;
    if (row < 0 || row >= 10 || col < 0 || col >= 10) {
      return { correct: false, points: 0, error: 'Invalid cell' };
    }
    if (layout[row][col] !== 'W') {
      return { correct: false, points: 0, error: 'Not a white cell' };
    }
    if (value < 1 || value > 9) {
      return { correct: false, points: 0, error: 'Invalid value (must be 1-9)' };
    }
    const isCorrect = value === solution[row][col];
    const cell = row * 10 + col;

    if (session) {
      session.placements.push({ cell, value, correct: isCorrect, ts: Date.now() });
      if (isCorrect) {
        session.grid[cell] = value;
      } else {
        session.mistakes++;
      }
    }

    return { correct: isCorrect, points: 0, action: 'place', row, col, isCorrect };
  }

  // ── Hint ────────────────────────────────────────────────────────
  if (answer.action === 'hint') {
    const { row, col } = answer;
    if (row < 0 || row >= 10 || col < 0 || col >= 10) {
      return { correct: false, points: 0, error: 'Invalid cell' };
    }
    if (layout[row][col] !== 'W') {
      return { correct: false, points: 0, error: 'Not a white cell' };
    }
    const cell = row * 10 + col;

    if (session) {
      session.hintLog.push({ cell, value: solution[row][col], ts: Date.now() });
      session.grid[cell] = solution[row][col];
      session.hintsUsed++;
    }

    return {
      correct: true,
      points: 0,
      action: 'hint',
      row, col,
      value: solution[row][col],
    };
  }

  // ── Submit full grid ────────────────────────────────────────────
  if (answer.action === 'submit') {
    const grid = answer.grid;
    const mistakes = session ? session.mistakes : (answer.mistakes || 0);
    const hints = session ? session.hintsUsed : (answer.hints || 0);
    const helperUsed = !!answer.helperUsed;

    if (!Array.isArray(grid) || grid.length !== 10) {
      return { correct: false, points: 0, error: 'Invalid grid' };
    }

    let correct = true;
    const errors = [];
    for (let r = 0; r < 10; r++) {
      if (!Array.isArray(grid[r]) || grid[r].length !== 10) {
        return { correct: false, points: 0, error: 'Invalid grid row ' + r };
      }
      for (let c = 0; c < 10; c++) {
        if (layout[r][c] !== 'W') continue;
        if (grid[r][c] !== solution[r][c]) {
          correct = false;
          errors.push({ row: r, col: c });
        }
      }
    }

    if (!correct) {
      if (session) session.submitFailures++;
      const submitFails = session ? session.submitFailures : ((answer.submitFailures || 0) + 1);
      // 3rd failed submission = fail-out
      if (submitFails >= 3) {
        let correctCells = 0;
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            if (layout[r][c] !== 'W') continue;
            if (grid[r][c] === solution[r][c]) correctCells++;
          }
        }
        const pityScore = correctCells * 20;
        const secs = elapsedMs ? elapsedMs / 1000 : 0;
        const timePenalty = Math.max(0, secs - GRACE_PERIOD);
        const pen = submitFails * MISTAKE_COST + hints * HINT_COST + timePenalty;
        const timeScore = Math.max(0, Math.round(BASE_SCORE - pen));
        const finalScore = Math.min(pityScore, timeScore);
        return { correct: false, points: finalScore, action: 'submit', errors, failedOut: true, correctCells };
      }
      return { correct: false, points: 0, action: 'submit', errors };
    }

    const submitFails = session ? session.submitFailures : (answer.submitFailures || 0);
    const secs = elapsedMs ? elapsedMs / 1000 : 0;
    const timePenalty = Math.max(0, secs - GRACE_PERIOD);
    const pen = submitFails * MISTAKE_COST + hints * HINT_COST + timePenalty;
    let points = Math.max(0, Math.round(BASE_SCORE - pen));

    if (helperUsed) {
      points = Math.max(0, Math.round(points * 0.9));
    }

    return {
      correct: true,
      points,
      action: 'submit',
      time: Math.round(secs),
      mistakes,
      hints,
      helperUsed,
    };
  }

  // ── Sum decomposition lookup ────────────────────────────────────
  if (answer.action === 'decompose') {
    const { sum, length } = answer;
    if (!sum || !length || sum < 1 || length < 1 || length > 9) {
      return { correct: true, points: 0, action: 'decompose', combos: [] };
    }
    const combos = sumDecompositions(sum, length);
    return { correct: true, points: 0, action: 'decompose', combos };
  }

  return { correct: false, points: 0, error: 'Unknown action' };
}

export function stripQuestion(question) {
  const maxHints = Math.floor(question.whiteCellCount * 0.25);

  return {
    type: 'kakuro',
    text: question.text,
    layout: question.layout,
    clues: question.clues,
    seed: question.seed,
    whiteCellCount: question.whiteCellCount,
    scoring: {
      base: BASE_SCORE,
      gracePeriod: GRACE_PERIOD,
      mistakeCost: MISTAKE_COST,
      hintCost: HINT_COST,
      helperPenalty: 0.1,
      maxHints,
    },
  };
}
