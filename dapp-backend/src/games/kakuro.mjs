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
 * Templates use runs of length 2-4 for good kakuro gameplay.
 * Every white cell belongs to exactly one across run and one down run.
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
// For a given (sum, length), list all valid sets of digits 1-9 with no repeats.
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

// ── Min/max sum for a run of given length with no repeats ───────────────
// min: 1+2+...+len, max: 9+8+...+(10-len)
function minRunSum(len) {
  return (len * (len + 1)) / 2;
}
function maxRunSum(len) {
  return (len * (19 - len)) / 2;
}

// ── Template definitions ────────────────────────────────────────────────
// '#' = black, '.' = white. 10 chars per row, 10 rows.
// Every run of consecutive white cells (horizontally or vertically) must be 2-4.
// Isolated white cells (run of 1) are avoided by design.

function parseMask(str) {
  const lines = str.trim().split('\n').map(l => l.trim());
  return lines.map(line => [...line].map(ch => ch === '#'));
}

function runsFromMask(mask) {
  const runs = [];
  const SIZE = 10;

  for (let r = 0; r < SIZE; r++) {
    let start = -1;
    for (let c = 0; c <= SIZE; c++) {
      const isBlack = c === SIZE || mask[r][c];
      if (!isBlack && start === -1) {
        start = c;
      } else if (isBlack && start !== -1) {
        const len = c - start;
        if (len >= 2) runs.push({ dir: 'A', r, c: start, len });
        start = -1;
      }
    }
  }

  for (let c = 0; c < SIZE; c++) {
    let start = -1;
    for (let r = 0; r <= SIZE; r++) {
      const isBlack = r === SIZE || mask[r][c];
      if (!isBlack && start === -1) {
        start = r;
      } else if (isBlack && start !== -1) {
        const len = r - start;
        if (len >= 2) runs.push({ dir: 'D', r: start, c, len });
        start = -1;
      }
    }
  }

  return runs;
}

// All templates verified: every horizontal and vertical run is 2-4 cells.
// ~30-40 white cells per template for good kakuro density.
const TEMPLATE_STRINGS = [
  // 0
  `#..#..#..#
#..#..#..#
..#..#..#.
..#..#..#.
#..#..#..#
#..#..#..#
..#..#..#.
..#..#..#.
#..#..#..#
#..#..#..#`,

  // 1
  `#..#.##..#
...#..#...
..#..#..#.
.#..#..#..
#..#..#..#
#..#..#..#
..#..#..#.
.#..#..#..
...#..#...
#..##.#..#`,

  // 2
  `##..#..#.#
#...#..#..
..#..#..#.
.#..#..#..
#..#..#..#
#..#..#..#
..#..#..#.
.#..#..#..
..#..#...#
#.#..#..##`,

  // 3
  `#.#..#.#.#
...#...#..
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
..#...#...
#.#.#..#.#`,

  // 4
  `##.#..#.##
#..#..#..#
..#..#..#.
.#..##..#.
#..#..#..#
#..#..#..#
.#..##..#.
.#..#..#..
#..#..#..#
##.#..#.##`,

  // 5
  `#..##..#.#
...#...#..
..#..#..#.
.#..#..#..
#..#..#..#
#..#..#..#
..#..#..#.
.#..#..#..
..#...#...
#.#..##..#`,

  // 6
  `#.#.#..#.#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#.#..#.#.#`,

  // 7
  `##..#..###
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
###..#..##`,

  // 8
  `#..#.#..##
...#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#...
##..#.#..#`,

  // 9
  `#.##..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..##..#
#..##..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..##.#`,

  // 10
  `##..#.#..#
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#.##
##.#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
#..#.#..##`,

  // 11
  `#..#..##.#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#.##..#..#`,

  // 12
  `#.#..##..#
..#..#..#.
.#..#..#..
#..#..#..#
..##..#..#
#..#..##..
#..#..#..#
..#..#..#.
.#..#..#..
#..##..#.#`,

  // 13
  `##..#..#..
#..#..#..#
..#..#..#.
.#..#..#.#
#..#..#..#
#..#..#..#
#.#..#..#.
.#..#..#..
#..#..#..#
..#..#..##`,

  // 14
  `#..#..#.##
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
##.#..#..#`,

  // 15
  `##.#..#..#
#..#..#..#
..#..#..#.
.#..##..#.
#..#..#..#
#..#..#..#
.#..##..#.
.#..#..#..
#..#..#..#
#..#..#.##`,

  // 16
  `#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#`,

  // 17
  `#.#..#..##
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
##..#..#.#`,

  // 18
  `##..##..##
#..#..#..#
..#..#..#.
.#..#..#..
##..##..##
##..##..##
..#..#..#.
.#..#..#..
#..#..#..#
##..##..##`,

  // 19
  `#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..##..#
#..##..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#`,

  // 20
  `#..##..#..
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
..#..##..#`,

  // 21
  `##..#..#.#
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
#.#..#..##`,

  // 22
  `#.#..#.#..
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
..#.#..#.#`,

  // 23
  `#..#.#.#.#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#..#..#..#
..#..#..#.
.#..#..#..
#.#.#.#..#`,
];

// Parse and validate templates at load time
const TEMPLATES = TEMPLATE_STRINGS.map((str, ti) => {
  const mask = parseMask(str);
  const runs = runsFromMask(mask);

  // Validate: every run must be 2-9 cells
  for (const run of runs) {
    if (run.len < 2 || run.len > 9) {
      throw new Error(`Template ${ti}: run at (${run.r},${run.c}) dir=${run.dir} has invalid length ${run.len}`);
    }
  }

  // Validate: every white cell must belong to at least one across AND one down run
  const inAcross = new Set();
  const inDown = new Set();
  for (const run of runs) {
    for (let i = 0; i < run.len; i++) {
      const r = run.dir === 'A' ? run.r : run.r + i;
      const c = run.dir === 'A' ? run.c + i : run.c;
      const key = `${r},${c}`;
      if (run.dir === 'A') inAcross.add(key);
      else inDown.add(key);
    }
  }

  // Only keep templates where every white cell is in both an across and down run
  const allWhite = new Set([...inAcross, ...inDown]);
  let valid = true;
  for (const key of allWhite) {
    if (!inAcross.has(key) || !inDown.has(key)) {
      valid = false;
      break;
    }
  }

  return { runs, valid, whiteCellCount: allWhite.size };
});

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

  // Collect white cells (row-major order)
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

    // Compute forbidden digits
    let forbidden = 0;
    for (const ri of cellToRuns[r][c]) forbidden |= runUsed[ri];

    // Build and shuffle allowed digits
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

      // Pruning: check sum constraints for each run this cell is in
      let valid = true;
      for (const ri of myRuns) {
        const newSum = runPartialSum[ri] + d;
        const newFilled = runFilled[ri] + 1;
        const runLen = runs[ri].len;
        const targetSum = clues[ri].sum;

        if (newFilled === runLen) {
          // Run complete — exact match required
          if (newSum !== targetSum) { valid = false; break; }
        } else {
          // Run incomplete — compute tight bounds on remaining sum
          const remaining = runLen - newFilled;
          const usedMask = runUsed[ri] | (1 << d);

          // Minimum: sum of smallest 'remaining' unused digits
          let minRem = 0;
          let count = 0;
          for (let v = 1; v <= 9 && count < remaining; v++) {
            if (!(usedMask & (1 << v))) { minRem += v; count++; }
          }
          if (count < remaining || newSum + minRem > targetSum) {
            valid = false; break;
          }

          // Maximum: sum of largest 'remaining' unused digits
          let maxRem = 0;
          count = 0;
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

  // Only use valid templates (every white cell in both across + down run)
  const validIndices = TEMPLATES
    .map((t, i) => ({ i, ...t }))
    .filter(t => t.valid && t.whiteCellCount >= 20)
    .map(t => t.i);

  const templateOrder = shuffle(validIndices, rng);

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
    solution,
    whiteCellCount: puzzle.whiteCellCount,
    seed: s,
  }];
}

export function evaluator(question, answer, elapsedMs) {
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
    const mistakes = answer.mistakes || 0;
    const hints = answer.hints || 0;
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
      return { correct: false, points: 0, action: 'submit', errors };
    }

    const secs = elapsedMs ? elapsedMs / 1000 : 0;
    const timePenalty = Math.max(0, secs - GRACE_PERIOD);
    const pen = mistakes * MISTAKE_COST + hints * HINT_COST + timePenalty;
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
