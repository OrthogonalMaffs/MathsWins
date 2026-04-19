/**
 * Minesweeper — Server-side game module.
 *
 * Board generated from a seed. Mines placed after first click to guarantee
 * a safe opening zone. Server tracks all state: revealed cells, flags,
 * mine positions, adjacency numbers.
 *
 * Solution NEVER sent to client. Client receives only grid dimensions and
 * mine count.
 *
 * Scoring:
 *   Win: round(BASE × T / (T + elapsedSeconds)) — per-difficulty BASE & T (see SCORING below).
 *     Half-score at elapsed = T (the difficulty's "target" time). Harder boards have
 *     higher BASE ceilings so a solid expert run outscores a near-perfect beginner run.
 *   DNF/detonation: -(totalSafeCells - revealedSafeCells)
 *
 * Board sizes:
 *   pocket:       12×12, 20 mines
 *   beginner:      9×9,  10 mines
 *   intermediate: 16×16, 40 mines
 *   advanced:     18×18, 65 mines  (Silver league only, not in free play)
 *   expert:       30×16, 99 mines
 *
 * SOLUTION NEVER LEAVES THIS FILE.
 */

export const GAME_ID = 'minesweeper';

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

// ── Board configurations ────────────────────────────────────────────────
const CONFIGS = {
  pocket:       { width: 12, height: 12, mineCount: 20 },
  beginner:     { width:  9, height:  9, mineCount: 10 },
  intermediate: { width: 16, height: 16, mineCount: 40 },
  advanced:     { width: 18, height: 18, mineCount: 65 },
  expert:       { width: 30, height: 16, mineCount: 99 },
};

// ── Scoring ─────────────────────────────────────────────────────────────
// score = round(BASE × T / (T + elapsedSeconds)).
// Per-difficulty (BASE, T). Harder boards earn higher ceilings so skill tier
// separation on the leaderboard reflects the board you chose, not just speed.
const SCORING = {
  beginner:     { base: 2500,  t: 15  },
  pocket:       { base: 3000,  t: 20  },
  intermediate: { base: 5000,  t: 45  },
  advanced:     { base: 7500,  t: 90  },
  expert:       { base: 10000, t: 120 },
};

function calculateWinScore(difficulty, elapsedMs) {
  const cfg = SCORING[difficulty] || SCORING.beginner;
  const elapsedSeconds = elapsedMs / 1000;
  return Math.round(cfg.base * cfg.t / (cfg.t + elapsedSeconds));
}

// ── Neighbour helper ────────────────────────────────────────────────────
function getNeighbours(cell, width, height) {
  const row = Math.floor(cell / width);
  const col = cell % width;
  const neighbours = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
        neighbours.push(nr * width + nc);
      }
    }
  }
  return neighbours;
}

// ── Mine placement (first click safe zone) ──────────────────────────────
function placeMines(seed, width, height, mineCount, safeCell) {
  const rng = mulberry32(seed);
  const total = width * height;

  // Build exclusion zone: safe cell + its 8 neighbours
  const excluded = new Set();
  excluded.add(safeCell);
  for (const n of getNeighbours(safeCell, width, height)) {
    excluded.add(n);
  }

  // Build candidate list (all cells not in exclusion zone)
  const candidates = [];
  for (let i = 0; i < total; i++) {
    if (!excluded.has(i)) candidates.push(i);
  }

  // Fisher-Yates shuffle of candidates using seeded PRNG
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Take first mineCount candidates
  const mines = new Set(candidates.slice(0, mineCount));

  // Calculate adjacency numbers
  const adjacency = new Array(total).fill(0);
  for (const mine of mines) {
    for (const n of getNeighbours(mine, width, height)) {
      if (!mines.has(n)) {
        adjacency[n]++;
      }
    }
  }

  return { mines, adjacency };
}

// ── Cascade reveal ──────────────────────────────────────────────────────
function cascade(cell, width, height, mines, adjacency, revealed) {
  const queue = [cell];
  const result = [];
  while (queue.length > 0) {
    const c = queue.shift();
    if (revealed.has(c)) continue;
    revealed.add(c);
    result.push({ cell: c, value: adjacency[c] });
    if (adjacency[c] === 0) {
      for (const n of getNeighbours(c, width, height)) {
        if (!revealed.has(n) && !mines.has(n)) {
          queue.push(n);
        }
      }
    }
  }
  return result;
}

// ── Daily seed ──────────────────────────────────────────────────────────
function getDailySeed() {
  const epoch = new Date('2026-01-01');
  return Math.floor((Date.now() - epoch) / 86400000) + 200;
}

// ── Session interface ───────────────────────────────────────────────────

export function selectQuestions(seed, difficulty) {
  const s = seed != null ? seed : Math.floor(Math.random() * 1000000);
  const d = difficulty || 'beginner';
  const config = CONFIGS[d] || CONFIGS.beginner;

  return [{
    type: 'minesweeper',
    width: config.width,
    height: config.height,
    mineCount: config.mineCount,
    puzzle: new Array(config.width * config.height).fill(0),
    solution: null,
    mines: null,
    adjacency: null,
    seed: s,
    difficulty: d,
    minesPlaced: false,
    revealed: new Set(),
    flags: new Set(),
  }];
}

/**
 * Evaluate a Minesweeper action from the client.
 * Server-authoritative: question object tracks mines, revealed cells, flags.
 *
 * Actions:
 *   { action: 'firstclick', cell: index }
 *   { action: 'click', cell: index }
 *   { action: 'chord', cell: index }
 *   { action: 'flag', cell: index }
 *   { action: 'submit' }
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

  const { width, height, mineCount } = question;
  const total = width * height;
  const totalSafeCells = total - mineCount;

  // Ensure revealed and flags are Sets (may have been deserialised as arrays)
  if (!(question.revealed instanceof Set)) {
    question.revealed = new Set(question.revealed || []);
  }
  if (!(question.flags instanceof Set)) {
    question.flags = new Set(question.flags || []);
  }

  // ── First click (place mines) ───────────────────────────────────────
  if (answer.action === 'firstclick') {
    const cell = answer.cell;
    if (cell < 0 || cell >= total) {
      return { correct: false, points: 0, error: 'Invalid cell index' };
    }
    if (question.minesPlaced) {
      return { correct: false, points: 0, error: 'Mines already placed' };
    }

    const { mines, adjacency } = placeMines(question.seed, width, height, mineCount, cell);
    question.mines = mines;
    question.adjacency = adjacency;
    question.minesPlaced = true;

    const revealed = cascade(cell, width, height, mines, adjacency, question.revealed);

    // Check win (unlikely on first click but possible on small boards)
    if (question.revealed.size === totalSafeCells) {
      const points = calculateWinScore(question.difficulty, elapsedMs);
      return {
        correct: true,
        points,
        action: 'firstclick',
        revealed,
        minesPlaced: true,
        won: true,
      };
    }

    return {
      correct: true,
      points: 0,
      action: 'firstclick',
      revealed,
      minesPlaced: true,
    };
  }

  // ── Click (reveal a cell) ──────────────────────────────────────────
  if (answer.action === 'click') {
    const cell = answer.cell;
    if (cell < 0 || cell >= total) {
      return { correct: false, points: 0, error: 'Invalid cell index' };
    }
    if (!question.minesPlaced) {
      return { correct: false, points: 0, error: 'Mines not placed yet — send firstclick' };
    }
    if (question.revealed.has(cell)) {
      return { correct: false, points: 0, error: 'Cell already revealed' };
    }
    if (question.flags.has(cell)) {
      return { correct: false, points: 0, error: 'Cell is flagged — unflag first' };
    }

    // Hit a mine — game over
    if (question.mines.has(cell)) {
      const incorrectFlags = [];
      for (const f of question.flags) {
        if (!question.mines.has(f)) incorrectFlags.push(f);
      }
      const safeCellsRemaining = totalSafeCells - question.revealed.size;
      return {
        correct: false,
        points: 0,
        action: 'click',
        gameOver: true,
        detonated: cell,
        mines: [...question.mines],
        incorrectFlags,
        partialScore: -safeCellsRemaining,
      };
    }

    // Safe cell — reveal (cascade if zero)
    const revealed = cascade(cell, width, height, question.mines, question.adjacency, question.revealed);

    // Check win
    if (question.revealed.size === totalSafeCells) {
      const points = calculateWinScore(question.difficulty, elapsedMs);
      return {
        correct: true,
        points,
        action: 'click',
        revealed,
        won: true,
      };
    }

    return {
      correct: true,
      points: 0,
      action: 'click',
      revealed,
    };
  }

  // ── Chord (reveal neighbours of a numbered cell) ───────────────────
  if (answer.action === 'chord') {
    const cell = answer.cell;
    if (cell < 0 || cell >= total) {
      return { correct: false, points: 0, error: 'Invalid cell index' };
    }
    if (!question.minesPlaced) {
      return { correct: false, points: 0, error: 'Mines not placed yet' };
    }
    if (!question.revealed.has(cell)) {
      return { correct: false, points: 0, error: 'Cell not revealed' };
    }
    if (question.adjacency[cell] === 0) {
      return { correct: false, points: 0, error: 'Cannot chord a zero cell' };
    }

    const neighbours = getNeighbours(cell, width, height);
    let adjacentFlags = 0;
    for (const n of neighbours) {
      if (question.flags.has(n)) adjacentFlags++;
    }

    if (adjacentFlags !== question.adjacency[cell]) {
      return { correct: false, points: 0, action: 'chord', error: 'Incorrect flag count' };
    }

    // Reveal all unflagged unrevealed neighbours
    const toReveal = [];
    for (const n of neighbours) {
      if (!question.revealed.has(n) && !question.flags.has(n)) {
        toReveal.push(n);
      }
    }

    // Check if any unflagged neighbour is a mine (wrong flag placement)
    for (const n of toReveal) {
      if (question.mines.has(n)) {
        const incorrectFlags = [];
        for (const f of question.flags) {
          if (!question.mines.has(f)) incorrectFlags.push(f);
        }
        const safeCellsRemaining = totalSafeCells - question.revealed.size;
        return {
          correct: false,
          points: 0,
          action: 'chord',
          gameOver: true,
          detonated: n,
          mines: [...question.mines],
          incorrectFlags,
          partialScore: -safeCellsRemaining,
        };
      }
    }

    // All safe — reveal with cascade
    const revealed = [];
    for (const n of toReveal) {
      const r = cascade(n, width, height, question.mines, question.adjacency, question.revealed);
      revealed.push(...r);
    }

    // Check win
    if (question.revealed.size === totalSafeCells) {
      const points = calculateWinScore(question.difficulty, elapsedMs);
      return {
        correct: true,
        points,
        action: 'chord',
        revealed,
        won: true,
      };
    }

    return {
      correct: true,
      points: 0,
      action: 'chord',
      revealed,
    };
  }

  // ── Flag (toggle) ─────────────────────────────────────────────────
  if (answer.action === 'flag') {
    const cell = answer.cell;
    if (cell < 0 || cell >= total) {
      return { correct: false, points: 0, error: 'Invalid cell index' };
    }
    if (!question.minesPlaced) {
      return { correct: false, points: 0, error: 'Mines not placed yet' };
    }
    if (question.revealed.has(cell)) {
      return { correct: false, points: 0, error: 'Cannot flag a revealed cell' };
    }

    let flagged;
    if (question.flags.has(cell)) {
      question.flags.delete(cell);
      flagged = false;
    } else {
      question.flags.add(cell);
      flagged = true;
    }

    return {
      correct: true,
      points: 0,
      action: 'flag',
      cell,
      flagged,
    };
  }

  // ── Submit (game completion scoring) ──────────────────────────────
  if (answer.action === 'submit') {
    if (question.revealed.size === totalSafeCells) {
      const points = calculateWinScore(question.difficulty, elapsedMs);
      return {
        correct: true,
        points,
        action: 'submit',
        time: Math.round(elapsedMs / 1000),
      };
    }

    const safeCellsRemaining = totalSafeCells - question.revealed.size;
    return {
      correct: false,
      points: 0,
      action: 'submit',
      partialScore: -safeCellsRemaining,
    };
  }

  return { correct: false, points: 0, error: 'Unknown action: ' + answer.action };
}

/**
 * Strip answer data from the question before sending to client.
 * Client receives only grid dimensions and mine count — no mine positions,
 * no adjacency numbers, no solution.
 */
export function stripQuestion(question) {
  return {
    type: 'minesweeper',
    width: question.width,
    height: question.height,
    mineCount: question.mineCount,
    difficulty: question.difficulty,
    seed: question.seed,
    scoring: (SCORING[question.difficulty] || SCORING.beginner),
  };
}
