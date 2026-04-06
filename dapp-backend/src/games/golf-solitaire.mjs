/**
 * Golf Solitaire — Server-side game module.
 *
 * 52 cards dealt: 35 to 7 columns (5 each, all face up),
 * 17 to draw pile. Waste starts with one flipped draw card (16 remain).
 * Player removes exposed column cards that are one rank up or down
 * from waste top. If no play: draw from pile to waste.
 *
 * Ace is terminal low (plays on 2 only), King is terminal high
 * (plays on Queen only). No wraparound.
 *
 * Score = cards remaining in columns at game end (lower is better).
 * 0 = perfect clear.
 *
 * Continuous mode: server tracks full board state, validates every
 * action, persists placements for resume.
 *
 * ANSWERS NEVER LEAVE THIS FILE.
 */

export const GAME_ID = 'golf-solitaire';

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

// ── Card helpers ────────────────────────────────────────────────────────
function cardRank(c) { return c % 13; }       // 0=A, 1=2, ..., 12=K
function cardSuit(c) { return Math.floor(c / 13); } // 0=C, 1=D, 2=H, 3=S

/**
 * Check if two cards are rank-adjacent (one rank apart).
 * Ace (0) is terminal low: adjacent to 2 (1) only.
 * King (12) is terminal high: adjacent to Queen (11) only.
 * No wraparound.
 */
function isRankAdjacent(rankA, rankB) {
  return Math.abs(rankA - rankB) === 1;
}

// ── Deal generation ────────────────────────────────────────────────────
function generateDeal(seed) {
  const rng = seed != null ? mulberry32(seed) : null;
  const rand = rng || (() => Math.random());

  const deck = [];
  for (let i = 0; i < 52; i++) deck.push(i);

  // Fisher-Yates shuffle
  for (let i = 51; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }

  // 7 columns of 5 cards each (35 cards)
  const columns = [];
  for (let c = 0; c < 7; c++) {
    columns.push(deck.slice(c * 5, c * 5 + 5));
  }

  // Remaining 17 cards: first goes to waste, rest form draw pile
  const wasteTop = deck[35];
  const drawPile = deck.slice(36); // 16 cards

  return { columns, wasteTop, drawPile };
}

// ── Count remaining column cards ────────────────────────────────────────
function countRemaining(columns) {
  let total = 0;
  for (const col of columns) total += col.length;
  return total;
}

// ── Check if any column play is available ───────────────────────────────
function hasPlayableCard(columns, wasteRank) {
  for (const col of columns) {
    if (col.length > 0) {
      const topRank = cardRank(col[col.length - 1]);
      if (isRankAdjacent(topRank, wasteRank)) return true;
    }
  }
  return false;
}

// ── Session interface ──────────────────────────────────────────────────

export function selectQuestions(seed) {
  const s = seed || Math.floor(Math.random() * 1000000);
  const deal = generateDeal(s);

  return [{
    type: 'golf-solitaire',
    columns: deal.columns,
    wasteTop: deal.wasteTop,
    drawPile: deal.drawPile,
    puzzle: new Array(52).fill(0),  // dummy for framework compat
    solution: null,
    seed: s,
    moveHistory: [],
    moveCount: 0,
    undoCount: 0,
  }];
}

/**
 * Evaluate a player action.
 *
 * Actions:
 *   { action: "play", column: 0-6 }  — play top card from column to waste
 *   { action: "draw" }               — flip top draw card to waste
 *   { action: "submit" }             — end game (auto or manual)
 */
export function evaluator(question, answer, elapsedMs, session) {
  if (typeof answer === 'string') {
    try { answer = JSON.parse(answer); } catch (e) {
      return { correct: false, points: 0, error: 'Invalid action' };
    }
  }

  if (!answer || !answer.action) {
    return { correct: false, points: 0, error: 'No action specified' };
  }

  // Ensure state survives JSON round-trip
  if (!Array.isArray(question.columns)) question.columns = [[], [], [], [], [], [], []];
  if (!Array.isArray(question.drawPile)) question.drawPile = [];
  if (typeof question.moveCount !== 'number') question.moveCount = 0;

  // ── Play column card ──────────────────────────────────────────────
  if (answer.action === 'play') {
    const colIdx = parseInt(answer.column, 10);
    if (isNaN(colIdx) || colIdx < 0 || colIdx > 6) {
      return { correct: false, points: 0, action: 'play', error: 'Invalid column' };
    }

    const col = question.columns[colIdx];
    if (col.length === 0) {
      return { correct: false, points: 0, action: 'play', error: 'Column is empty' };
    }

    const card = col[col.length - 1];
    const cardR = cardRank(card);
    const wasteR = cardRank(question.wasteTop);

    if (!isRankAdjacent(cardR, wasteR)) {
      return { correct: false, points: 0, action: 'play', error: 'Card is not rank-adjacent to waste' };
    }

    // Valid play — remove card from column, set as waste top
    col.pop();
    question.wasteTop = card;
    question.moveCount++;

    // Track placement
    if (session && session.placements) {
      session.placements.push({ action: 'play', column: colIdx, card, moveCount: question.moveCount });
    }

    const remaining = countRemaining(question.columns);
    const gameOver = remaining === 0;

    // Check if game should auto-end (no plays and no draws)
    const noPlays = !hasPlayableCard(question.columns, cardRank(question.wasteTop));
    const noDraws = question.drawPile.length === 0;
    const stuck = noPlays && noDraws && remaining > 0;

    const result = {
      correct: true,
      points: 0,
      action: 'play',
      column: colIdx,
      cardPlayed: card,
      wasteTop: question.wasteTop,
      columns: question.columns.map(c => [...c]),
      drawCount: question.drawPile.length,
      remaining,
      moveCount: question.moveCount,
    };

    if (gameOver) {
      result.gameOver = true;
      result.won = true;
      result.points = 5000 - Math.floor(elapsedMs / 1000); // time bonus for perfect clear
      if (result.points < 0) result.points = 0;
      result.remaining = 0;
    } else if (stuck) {
      result.gameOver = true;
      result.won = false;
      result.points = 0;
      result.partialScore = -remaining;
    }

    return result;
  }

  // ── Draw from pile ────────────────────────────────────────────────
  if (answer.action === 'draw') {
    if (question.drawPile.length === 0) {
      return { correct: false, points: 0, action: 'draw', error: 'Draw pile is empty' };
    }

    const card = question.drawPile.shift();
    question.wasteTop = card;
    question.moveCount++;

    // Track placement
    if (session && session.placements) {
      session.placements.push({ action: 'draw', card, moveCount: question.moveCount });
    }

    const remaining = countRemaining(question.columns);
    const noPlays = !hasPlayableCard(question.columns, cardRank(question.wasteTop));
    const noDraws = question.drawPile.length === 0;
    const stuck = noPlays && noDraws && remaining > 0;

    const result = {
      correct: true,
      points: 0,
      action: 'draw',
      cardDrawn: card,
      wasteTop: question.wasteTop,
      columns: question.columns.map(c => [...c]),
      drawCount: question.drawPile.length,
      remaining,
      moveCount: question.moveCount,
    };

    if (stuck) {
      result.gameOver = true;
      result.won = false;
      result.points = 0;
      result.partialScore = -remaining;
    }

    return result;
  }

  // ── Submit (manual end) ───────────────────────────────────────────
  if (answer.action === 'submit') {
    const remaining = countRemaining(question.columns);
    if (remaining === 0) {
      const points = 5000 - Math.floor(elapsedMs / 1000);
      return {
        correct: true,
        points: Math.max(0, points),
        action: 'submit',
        remaining: 0,
        time: Math.round(elapsedMs / 1000),
      };
    }
    return {
      correct: false,
      points: 0,
      action: 'submit',
      partialScore: -remaining,
      remaining,
    };
  }

  return { correct: false, points: 0, error: 'Unknown action: ' + answer.action };
}

/**
 * Strip question for client — all cards are face up (open information),
 * but hide draw pile contents (face down).
 */
export function stripQuestion(question) {
  return {
    type: 'golf-solitaire',
    columns: question.columns.map(c => [...c]),
    wasteTop: question.wasteTop,
    drawCount: question.drawPile.length,
    seed: question.seed,
  };
}
