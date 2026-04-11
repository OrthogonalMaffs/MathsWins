/**
 * KenKen — Server-side puzzle generation, validation, and scoring.
 *
 * Fill an N×N grid with 1-N, no row/col repeats (Latin square).
 * Cages of cells have a target + operation — cell values must produce the target.
 *
 * Generation: seeded PRNG → Latin square → cage partition → operation assignment → unique solution check.
 * Solution NEVER sent to client.
 *
 * Scoring:
 *   Base: 5000
 *   Time: -1 pt/sec after 60s grace period
 *   Mistakes: -300 per incorrect full-grid submission
 *   Hints: -500 per cell revealed (max N hints where N = grid size)
 *   Minimum: 0
 *
 * Difficulty tiers:
 *   easy:   4×4, +/- only, 2-cell cages
 *   medium: 6×6, +/-/×, 2-3 cell cages
 *   hard:   6×6, +/-/×/÷, 2-4 cell cages (competitive default)
 *   expert: 7×7, +/-/×/÷, 2-5 cell cages
 */

export const GAME_ID = 'kenken';

// ── Seeded PRNG (mulberry32) ────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed | 0;
  return function() {
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

// ── Difficulty configs ──────────────────────────────────────────────────
const CONFIGS = {
  easy:   { size: 4, ops: ['+', '-'],           maxCage: 2, minCage: 1 },
  medium: { size: 6, ops: ['+', '-', '×'],      maxCage: 3, minCage: 1 },
  hard:   { size: 6, ops: ['+', '-', '×', '÷'], maxCage: 4, minCage: 2 },
  expert: { size: 7, ops: ['+', '-', '×', '÷'], maxCage: 5, minCage: 2 },
};

// ── Latin square generation ─────────────────────────────────────────────
function generateLatinSquare(n, rng) {
  // Start with a valid Latin square and shuffle rows/cols/symbols
  const grid = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) {
      row.push(((r + c) % n) + 1);
    }
    grid.push(row);
  }

  // Shuffle rows
  const rowOrder = shuffle([...Array(n).keys()], rng);
  const shuffledRows = rowOrder.map(r => grid[r]);

  // Shuffle columns
  const colOrder = shuffle([...Array(n).keys()], rng);
  const shuffledCols = shuffledRows.map(row => colOrder.map(c => row[c]));

  // Relabel symbols
  const symbolMap = shuffle([...Array(n).keys()].map(i => i + 1), rng);
  return shuffledCols.map(row => row.map(v => symbolMap[v - 1]));
}

// ── Cage partitioning ───────────────────────────────────────────────────
function partitionIntoCages(n, maxCage, minCage, rng) {
  const total = n * n;
  const assigned = new Array(total).fill(-1);
  const cages = [];
  let cageId = 0;

  // Process cells in random order
  const order = shuffle([...Array(total).keys()], rng);

  for (const idx of order) {
    if (assigned[idx] !== -1) continue;

    // Start a new cage from this cell
    const cage = [idx];
    assigned[idx] = cageId;

    // Grow the cage by adding adjacent unassigned cells
    const targetSize = minCage + Math.floor(rng() * (maxCage - minCage + 1));

    while (cage.length < targetSize) {
      // Find unassigned neighbours of any cell in the cage
      const neighbours = [];
      for (const cell of cage) {
        const r = Math.floor(cell / n), c = cell % n;
        if (r > 0 && assigned[cell - n] === -1) neighbours.push(cell - n);
        if (r < n - 1 && assigned[cell + n] === -1) neighbours.push(cell + n);
        if (c > 0 && assigned[cell - 1] === -1) neighbours.push(cell - 1);
        if (c < n - 1 && assigned[cell + 1] === -1) neighbours.push(cell + 1);
      }

      // Deduplicate
      const unique = [...new Set(neighbours)];
      if (unique.length === 0) break;

      const next = unique[Math.floor(rng() * unique.length)];
      cage.push(next);
      assigned[next] = cageId;
    }

    cages.push(cage);
    cageId++;
  }

  return cages;
}

// ── Assign operations and targets ───────────────────────────────────────
function assignOperations(cages, solution, n, ops, rng) {
  return cages.map(cells => {
    const values = cells.map(idx => {
      const r = Math.floor(idx / n), c = idx % n;
      return solution[r][c];
    });

    if (values.length === 1) {
      // Single cell — no operation
      return { cells, target: values[0], op: null };
    }

    // Try operations in random order until one works cleanly
    const shuffledOps = shuffle([...ops], rng);

    for (const op of shuffledOps) {
      if (op === '+') {
        const target = values.reduce((a, b) => a + b, 0);
        return { cells, target, op: '+' };
      }

      if (op === '×') {
        const target = values.reduce((a, b) => a * b, 1);
        return { cells, target, op: '×' };
      }

      if (op === '-' && values.length === 2) {
        const target = Math.abs(values[0] - values[1]);
        return { cells, target, op: '-' };
      }

      if (op === '÷' && values.length === 2) {
        const big = Math.max(values[0], values[1]);
        const small = Math.min(values[0], values[1]);
        if (small > 0 && big % small === 0) {
          return { cells, target: big / small, op: '÷' };
        }
      }
    }

    // Fallback: addition always works
    const target = values.reduce((a, b) => a + b, 0);
    return { cells, target, op: '+' };
  });
}

// ── Solver (for unique solution validation) ─────────────────────────────
function solve(n, cagesWithOps, maxSolutions, timeoutMs) {
  const grid = Array.from({ length: n }, () => new Array(n).fill(0));
  const solutions = [];
  const deadline = timeoutMs ? Date.now() + timeoutMs : Infinity;
  let nodeCount = 0;

  // Build cage lookup and precompute cage fill counts
  const cellCage = new Array(n * n).fill(-1);
  const cageFillCount = new Array(cagesWithOps.length).fill(0);
  const cageCellCount = new Array(cagesWithOps.length).fill(0);
  cagesWithOps.forEach((cage, i) => {
    cageCellCount[i] = cage.cells.length;
    cage.cells.forEach(idx => { cellCage[idx] = i; });
  });

  // Row/col used tracking (bitmask for O(1) lookup)
  const rowUsed = new Array(n).fill(0);
  const colUsed = new Array(n).fill(0);

  // Cage partial sums/products for early pruning
  const cagePartialSum = new Array(cagesWithOps.length).fill(0);
  const cagePartialProd = new Array(cagesWithOps.length).fill(1);

  function isCageValidPartial(cageIdx) {
    const cage = cagesWithOps[cageIdx];
    const filled = cageFillCount[cageIdx];
    const total = cageCellCount[cageIdx];

    if (filled < total) {
      // Partial — prune if already exceeded target
      if (cage.op === '+') return cagePartialSum[cageIdx] <= cage.target;
      if (cage.op === '×') return cagePartialProd[cageIdx] <= cage.target;
      return true;
    }

    // Fully filled — check exact
    if (cage.op === null) {
      const idx = cage.cells[0];
      return grid[Math.floor(idx / n)][idx % n] === cage.target;
    }
    if (cage.op === '+') return cagePartialSum[cageIdx] === cage.target;
    if (cage.op === '×') return cagePartialProd[cageIdx] === cage.target;
    if (cage.op === '-') {
      const vals = cage.cells.map(idx => grid[Math.floor(idx / n)][idx % n]);
      return Math.abs(vals[0] - vals[1]) === cage.target;
    }
    if (cage.op === '÷') {
      const vals = cage.cells.map(idx => grid[Math.floor(idx / n)][idx % n]);
      const big = Math.max(vals[0], vals[1]);
      const small = Math.min(vals[0], vals[1]);
      return small > 0 && big / small === cage.target;
    }
    return false;
  }

  function backtrack(pos) {
    if (solutions.length >= maxSolutions) return;
    if (++nodeCount % 10000 === 0 && Date.now() > deadline) return;
    if (pos === n * n) {
      solutions.push(grid.map(row => [...row]));
      return;
    }

    const r = Math.floor(pos / n), c = pos % n;
    const ci = cellCage[pos];

    for (let v = 1; v <= n; v++) {
      const bit = 1 << v;
      if (rowUsed[r] & bit) continue;
      if (colUsed[c] & bit) continue;

      grid[r][c] = v;
      rowUsed[r] |= bit;
      colUsed[c] |= bit;
      cageFillCount[ci]++;
      cagePartialSum[ci] += v;
      cagePartialProd[ci] *= v;

      if (isCageValidPartial(ci)) {
        backtrack(pos + 1);
      }

      grid[r][c] = 0;
      rowUsed[r] &= ~bit;
      colUsed[c] &= ~bit;
      cageFillCount[ci]--;
      cagePartialSum[ci] -= v;
      cagePartialProd[ci] /= v;
    }
  }

  backtrack(0);
  return solutions;
}

// ── Puzzle generation ───────────────────────────────────────────────────
export function generatePuzzle(seed, difficulty) {
  const config = CONFIGS[difficulty] || CONFIGS.hard;
  const n = config.size;
  const rng = mulberry32(seed);

  // Try up to 10 times to get a unique-solution puzzle
  for (let attempt = 0; attempt < 10; attempt++) {
    const solution = generateLatinSquare(n, rng);
    const cages = partitionIntoCages(n, config.maxCage, config.minCage, rng);
    const cagesWithOps = assignOperations(cages, solution, n, config.ops, rng);

    // Validate unique solution (5s timeout for solver)
    const solutions = solve(n, cagesWithOps, 2, 5000);
    if (solutions.length === 1) {
      return {
        size: n,
        difficulty,
        cages: cagesWithOps.map(c => ({
          cells: c.cells,
          target: c.target,
          op: c.op
        })),
        solution
      };
    }
  }

  // Fallback: return the last attempt (may have multiple solutions but playable)
  const solution = generateLatinSquare(n, rng);
  const cages = partitionIntoCages(n, config.maxCage, config.minCage, rng);
  const cagesWithOps = assignOperations(cages, solution, n, config.ops, rng);
  return {
    size: n,
    difficulty,
    cages: cagesWithOps.map(c => ({ cells: c.cells, target: c.target, op: c.op })),
    solution
  };
}

// ── Daily seed ──────────────────────────────────────────────────────────
export function getDailySeed() {
  const epoch = new Date('2026-01-01');
  return Math.floor((Date.now() - epoch) / 86400000) + 100;
}

// ── Scoring constants ───────────────────────────────────────────────────
export const BASE_SCORE = 5000;
export const GRACE_PERIOD = 60; // seconds before time penalty starts
export const MISTAKE_COST = 300;
export const HINT_COST = 500;

// ── Session interface ───────────────────────────────────────────────────

export function selectQuestions(seed, difficulty) {
  const s = seed || getDailySeed();
  const d = difficulty || 'hard';
  const puzzle = generatePuzzle(s, d);

  return [{
    type: 'kenken',
    text: 'Solve the KenKen puzzle',
    size: puzzle.size,
    difficulty: puzzle.difficulty,
    cages: puzzle.cages,
    puzzle: new Array(puzzle.size * puzzle.size).fill(0),
    solution: puzzle.solution,
    seed: s,
  }];
}

export function evaluator(question, answer, elapsedMs, session) {
  if (typeof answer === 'string') {
    try { answer = JSON.parse(answer); } catch(e) {
      return { correct: false, points: 0, error: 'Invalid action' };
    }
  }

  if (!answer || !answer.action) {
    return { correct: false, points: 0, error: 'No action specified' };
  }

  const n = question.size;
  const solution = question.solution;

  // Initialise server-authoritative state on session if not present
  if (session && !session.placements) session.placements = [];
  if (session && !session.hintLog) session.hintLog = [];
  if (session && session.mistakes === undefined) session.mistakes = 0;
  if (session && session.hintsUsed === undefined) session.hintsUsed = 0;
  if (session && session.submitFailures === undefined) session.submitFailures = 0;

  // ── Place a number ──────────────────────────────────────────────
  if (answer.action === 'place') {
    const { row, col, value } = answer;
    if (row < 0 || row >= n || col < 0 || col >= n) {
      return { correct: false, points: 0, error: 'Invalid cell' };
    }
    if (value < 1 || value > n) {
      return { correct: false, points: 0, error: 'Invalid value' };
    }
    const cell = row * n + col;
    const isCorrect = value === solution[row][col];

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
    if (row < 0 || row >= n || col < 0 || col >= n) {
      return { correct: false, points: 0, error: 'Invalid cell' };
    }
    const cell = row * n + col;

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

    if (!Array.isArray(grid) || grid.length !== n) {
      return { correct: false, points: 0, error: 'Invalid grid' };
    }

    // Validate against solution
    let correct = true;
    const errors = [];
    for (let r = 0; r < n; r++) {
      if (!Array.isArray(grid[r]) || grid[r].length !== n) {
        return { correct: false, points: 0, error: 'Invalid grid row ' + r };
      }
      for (let c = 0; c < n; c++) {
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
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            if (grid[r][c] === solution[r][c]) correctCells++;
          }
        }
        const finalScore = correctCells * 20;
        return { correct: false, points: finalScore, action: 'validate', errors, failedOut: true, correctCells };
      }
      return { correct: false, points: 0, action: 'validate', errors };
    }

    // Calculate score — penalty is per incorrect GRID SUBMISSION, not per cell error
    const submitFails = session ? session.submitFailures : (answer.submitFailures || 0);
    const secs = elapsedMs ? elapsedMs / 1000 : 0;
    const timePenalty = Math.max(0, secs - GRACE_PERIOD);
    const pen = submitFails * MISTAKE_COST + hints * HINT_COST + timePenalty;
    const points = Math.max(0, Math.round(BASE_SCORE - pen));

    return {
      correct: true,
      points,
      action: 'submit',
      time: Math.round(secs),
      mistakes: submitFails,
      hints,
    };
  }

  return { correct: false, points: 0, error: 'Unknown action' };
}

export function stripQuestion(question) {
  return {
    type: 'kenken',
    text: question.text,
    size: question.size,
    difficulty: question.difficulty,
    cages: question.cages,
    seed: question.seed,
    scoring: {
      base: BASE_SCORE,
      gracePeriod: GRACE_PERIOD,
      mistakeCost: MISTAKE_COST,
      hintCost: HINT_COST,
      maxHints: question.size,
    }
  };
}
