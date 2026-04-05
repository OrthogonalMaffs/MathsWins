/**
 * Nonogram (Picross) — Server-side puzzle generation, validation, and scoring.
 *
 * Players fill cells to reveal a hidden image (Greek letters used in mathematics).
 * Row/column clues indicate runs of consecutive filled cells.
 * Solution NEVER sent to client.
 *
 * Image bank: curated pixel art of Greek letters (α, β, γ, δ, ε, ζ, η, θ, ι, κ,
 * λ, μ, ν, ξ, π, ρ, σ, τ, φ, χ, ψ, ω, Σ, Π, Δ, Ω, Θ, Φ, Ψ, Γ)
 *
 * Scoring:
 *   Base: 5000
 *   Time: -1 pt/sec after 30s grace
 *   Mistakes: -200 per incorrect cell on submission
 *   Hints: -400 per row/column revealed
 *   Minimum: 0
 */

export const GAME_ID = 'nonogram';

// ── Seeded PRNG ─────────────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Scoring constants ───────────────────────────────────────────────────
export const BASE_SCORE = 5000;
export const GRACE_PERIOD = 30;
export const MISTAKE_COST = 200;
export const HINT_COST = 400;

// ── 10×10 Greek Letter Image Bank ───────────────────────────────────────
// Each image is a flat array of 100 values (0=empty, 1=filled), row-major.
// Carefully rendered to be recognisable at 10×10 resolution.

const IMAGES_10 = [
  // α (alpha) — lowercase
  { name: 'α', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,1,1,1,0,1,0,0,
    0,0,1,0,0,0,1,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,1,1,0,0,
    0,0,1,1,1,1,0,1,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // β (beta) — lowercase
  { name: 'β', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,1,1,1,0,0,0,0,0,
    0,0,1,0,0,1,0,0,0,0,
    0,0,1,0,0,1,0,0,0,0,
    0,0,1,1,1,0,0,0,0,0,
    0,0,1,0,0,1,0,0,0,0,
    0,0,1,0,0,1,0,0,0,0,
    0,0,1,1,1,0,0,0,0,0,
    0,0,1,0,0,0,0,0,0,0,
    0,0,1,0,0,0,0,0,0,0,
  ]},
  // γ (gamma) — lowercase
  { name: 'γ', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,0,1,0,1,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // δ (delta) — lowercase
  { name: 'δ', grid: [
    0,0,0,0,1,1,0,0,0,0,
    0,0,0,1,0,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // ε (epsilon) — lowercase
  { name: 'ε', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,1,0,0,0,0,0,0,0,
    0,0,1,1,1,0,0,0,0,0,
    0,0,1,0,0,0,0,0,0,0,
    0,0,1,0,0,0,0,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // θ (theta) — lowercase
  { name: 'θ', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,1,1,1,1,1,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // λ (lambda) — lowercase
  { name: 'λ', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,1,0,0,0,0,0,0,0,0,
    0,0,1,0,0,0,0,0,0,0,
    0,0,0,1,0,0,0,0,0,0,
    0,0,0,1,1,0,0,0,0,0,
    0,0,0,1,0,1,0,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // μ (mu) — lowercase
  { name: 'μ', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,1,0,0,1,1,0,0,0,
    0,0,1,1,1,0,1,0,0,0,
    0,0,1,0,0,0,0,0,0,0,
    0,0,1,0,0,0,0,0,0,0,
  ]},
  // π (pi) — lowercase
  { name: 'π', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,1,1,1,1,1,1,1,0,0,
    0,0,0,1,0,0,1,0,0,0,
    0,0,0,1,0,0,1,0,0,0,
    0,0,0,1,0,0,1,0,0,0,
    0,0,0,1,0,0,1,0,0,0,
    0,0,0,1,0,0,1,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // σ (sigma) — lowercase
  { name: 'σ', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,1,1,1,1,1,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,1,0,0,0,0,0,0,0,0,
    0,1,0,0,0,0,0,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // τ (tau) — lowercase
  { name: 'τ', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,1,1,1,1,1,1,1,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,0,1,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // φ (phi) — lowercase
  { name: 'φ', grid: [
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,1,0,1,0,1,0,0,0,
    0,1,0,0,1,0,0,1,0,0,
    0,1,0,0,1,0,0,1,0,0,
    0,0,1,0,1,0,1,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
  ]},
  // ψ (psi) — lowercase
  { name: 'ψ', grid: [
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,1,0,0,1,0,0,1,0,0,
    0,1,0,0,1,0,0,1,0,0,
    0,1,0,0,1,0,0,1,0,0,
    0,0,1,0,1,0,1,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // ω (omega) — lowercase
  { name: 'ω', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,1,0,0,1,0,0,
    0,1,0,1,0,1,0,1,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // Σ (Sigma) — uppercase
  { name: 'Σ', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,1,1,1,1,1,1,1,0,0,
    0,1,0,0,0,0,0,0,0,0,
    0,0,1,0,0,0,0,0,0,0,
    0,0,0,1,0,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,1,0,0,0,0,0,0,
    0,0,1,0,0,0,0,0,0,0,
    0,1,0,0,0,0,0,0,0,0,
    0,1,1,1,1,1,1,1,0,0,
  ]},
  // Π (Pi) — uppercase
  { name: 'Π', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,1,1,1,1,1,1,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // Δ (Delta) — uppercase
  { name: 'Δ', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,1,0,1,0,0,0,0,
    0,0,0,1,0,1,0,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,1,1,1,1,1,1,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // Ω (Omega) — uppercase
  { name: 'Ω', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,0,1,0,1,0,0,0,0,
    0,1,1,0,0,0,1,1,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // Θ (Theta) — uppercase
  { name: 'Θ', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,1,1,1,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,0,1,0,0,0,1,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
  // Φ (Phi) — uppercase
  { name: 'Φ', grid: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,1,0,1,0,1,0,0,0,
    0,1,0,0,1,0,0,1,0,0,
    0,0,1,0,1,0,1,0,0,0,
    0,0,0,1,1,1,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]},
];

// ── Clue computation ────────────────────────────────────────────────────
function computeClues(grid, size) {
  const rowClues = [];
  const colClues = [];

  for (let r = 0; r < size; r++) {
    const runs = [];
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (grid[r * size + c] === 1) { count++; }
      else { if (count > 0) runs.push(count); count = 0; }
    }
    if (count > 0) runs.push(count);
    rowClues.push(runs.length > 0 ? runs : [0]);
  }

  for (let c = 0; c < size; c++) {
    const runs = [];
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r * size + c] === 1) { count++; }
      else { if (count > 0) runs.push(count); count = 0; }
    }
    if (count > 0) runs.push(count);
    colClues.push(runs.length > 0 ? runs : [0]);
  }

  return { rowClues, colClues };
}

// ── Line solver (for validating uniqueness) ─────────────────────────────
function solveLine(clues, lineLength) {
  // Returns all valid arrangements for a single line
  const results = [];

  function generate(clueIdx, pos, line) {
    if (clueIdx === clues.length) {
      // Fill remaining with empty
      const rest = line.concat(new Array(lineLength - line.length).fill(0));
      if (rest.length === lineLength) results.push(rest);
      return;
    }

    const clue = clues[clueIdx];
    const remaining = clues.slice(clueIdx + 1).reduce((a, b) => a + b, 0) + (clues.length - clueIdx - 1);
    const maxStart = lineLength - remaining - clue;

    for (let start = line.length; start <= maxStart; start++) {
      const newLine = line.concat(
        new Array(start - line.length).fill(0),
        new Array(clue).fill(1)
      );
      if (clueIdx < clues.length - 1) newLine.push(0); // gap after run
      generate(clueIdx + 1, start + clue + 1, newLine);
    }
  }

  if (clues.length === 1 && clues[0] === 0) {
    results.push(new Array(lineLength).fill(0));
  } else {
    generate(0, 0, []);
  }
  return results;
}

function validateUniqueSolution(grid, size) {
  const { rowClues, colClues } = computeClues(grid, size);

  // Use constraint propagation to check uniqueness
  const cells = new Array(size * size).fill(-1); // -1 = unknown, 0 = empty, 1 = filled

  let changed = true;
  let iterations = 0;
  while (changed && iterations < 100) {
    changed = false;
    iterations++;

    // Process rows
    for (let r = 0; r < size; r++) {
      const arrangements = solveLine(rowClues[r], size).filter(arr => {
        for (let c = 0; c < size; c++) {
          if (cells[r * size + c] !== -1 && cells[r * size + c] !== arr[c]) return false;
        }
        return true;
      });

      if (arrangements.length === 0) return false; // no valid solution

      for (let c = 0; c < size; c++) {
        if (cells[r * size + c] !== -1) continue;
        const allSame = arrangements.every(a => a[c] === arrangements[0][c]);
        if (allSame) {
          cells[r * size + c] = arrangements[0][c];
          changed = true;
        }
      }
    }

    // Process columns
    for (let c = 0; c < size; c++) {
      const colLine = [];
      for (let r = 0; r < size; r++) colLine.push(cells[r * size + c]);

      const arrangements = solveLine(colClues[c], size).filter(arr => {
        for (let r = 0; r < size; r++) {
          if (colLine[r] !== -1 && colLine[r] !== arr[r]) return false;
        }
        return true;
      });

      if (arrangements.length === 0) return false;

      for (let r = 0; r < size; r++) {
        if (cells[r * size + c] !== -1) continue;
        const allSame = arrangements.every(a => a[r] === arrangements[0][r]);
        if (allSame) {
          cells[r * size + c] = arrangements[0][r];
          changed = true;
        }
      }
    }
  }

  // Check if fully solved by line logic alone
  return cells.every(c => c !== -1);
}

// ── Puzzle selection ────────────────────────────────────────────────────
export function getDailySeed() {
  const epoch = new Date('2026-01-01');
  return Math.floor((Date.now() - epoch) / 86400000) + 200;
}

export function selectQuestions(seed) {
  const s = seed || getDailySeed();
  const rng = mulberry32(s);
  const size = 10;

  // Select image from bank using seed
  const idx = Math.floor(rng() * IMAGES_10.length);
  const image = IMAGES_10[idx];
  const { rowClues, colClues } = computeClues(image.grid, size);

  return [{
    type: 'nonogram',
    text: 'Reveal the Greek letter',
    size,
    puzzle: new Array(size * size).fill(0),
    solution: [...image.grid],
    rowClues,
    colClues,
    letterName: image.name,
    seed: s,
  }];
}

export function evaluator(question, answer, elapsedMs) {
  if (typeof answer === 'string') {
    try { answer = JSON.parse(answer); } catch(e) {
      return { correct: false, points: 0, error: 'Invalid action' };
    }
  }

  if (!answer || !answer.action) {
    return { correct: false, points: 0, error: 'No action specified' };
  }

  const size = question.size;
  const solution = question.solution;

  // ── Hint: reveal a row or column ──────────────────────────────
  if (answer.action === 'hint') {
    const { direction, index } = answer;
    if (index < 0 || index >= size) return { correct: false, points: 0, error: 'Invalid index' };

    const cells = [];
    if (direction === 'row') {
      for (let c = 0; c < size; c++) cells.push({ row: index, col: c, filled: solution[index * size + c] === 1 });
    } else if (direction === 'col') {
      for (let r = 0; r < size; r++) cells.push({ row: r, col: index, filled: solution[r * size + index] === 1 });
    } else {
      return { correct: false, points: 0, error: 'Invalid direction' };
    }

    return { correct: true, points: 0, action: 'hint', cells };
  }

  // ── Submit grid ───────────────────────────────────────────────
  if (answer.action === 'submit') {
    const grid = answer.grid;
    const mistakes = answer.mistakes || 0;
    const hints = answer.hints || 0;

    if (!Array.isArray(grid) || grid.length !== size * size) {
      return { correct: false, points: 0, error: 'Invalid grid' };
    }

    let errorCount = 0;
    const errors = [];
    for (let i = 0; i < size * size; i++) {
      const expected = solution[i];
      const got = grid[i] ? 1 : 0;
      if (expected !== got) {
        errorCount++;
        errors.push({ row: Math.floor(i / size), col: i % size });
      }
    }

    if (errorCount > 0) {
      return { correct: false, points: 0, action: 'submit', errorCount, errors: errors.slice(0, 20) };
    }

    const secs = elapsedMs ? elapsedMs / 1000 : 0;
    const timePenalty = Math.max(0, secs - GRACE_PERIOD);
    const pen = mistakes * MISTAKE_COST + hints * HINT_COST + timePenalty;
    const points = Math.max(0, Math.round(BASE_SCORE - pen));

    return {
      correct: true,
      points,
      action: 'submit',
      time: Math.round(secs),
      mistakes,
      hints,
      letterName: question.letterName,
    };
  }

  return { correct: false, points: 0, error: 'Unknown action' };
}

export function stripQuestion(question) {
  return {
    type: 'nonogram',
    text: question.text,
    size: question.size,
    rowClues: question.rowClues,
    colClues: question.colClues,
    seed: question.seed,
    scoring: {
      base: BASE_SCORE,
      gracePeriod: GRACE_PERIOD,
      mistakeCost: MISTAKE_COST,
      hintCost: HINT_COST,
    }
  };
}
