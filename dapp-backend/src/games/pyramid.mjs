/**
 * Pyramid — Server-side game module.
 *
 * 52 cards dealt: 28 into a 7-row pyramid (1+2+3+4+5+6+7),
 * 24 into draw pile. A card is exposed when both cards covering
 * it in the row below are removed. Row 7 cards start exposed.
 *
 * Player pairs two exposed cards summing to 13, or removes a
 * King (13) alone. Waste top can pair with any exposed pyramid
 * card. Two waste cards cannot pair with each other.
 *
 * Score = cards cleared from pyramid (max 28, higher is better).
 *
 * Pyramid positions: "r{row}c{col}" — r1c0 (apex) through r7c6.
 * Pyramid stored as array of 28 slots: row 1 = [0], row 2 = [1,2],
 * row 3 = [3,4,5], etc. Index = row*(row-1)/2 + col.
 *
 * ANSWERS NEVER LEAVE THIS FILE.
 */

export const GAME_ID = 'pyramid';

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
function cardSuit(c) { return Math.floor(c / 13); }

/** Card value for pairing: A=1, 2-10=face, J=11, Q=12, K=13 */
function cardValue(c) {
  return cardRank(c) + 1;
}

// ── Pyramid index helpers ──────────────────────────────────────────────
// Row r (1-based), col c (0-based within row). Row r has r cards.
// Flat index = r*(r-1)/2 + c

function posToIndex(row, col) {
  return row * (row - 1) / 2 + col;
}

function indexToPos(idx) {
  let row = 1;
  let remaining = idx;
  while (remaining >= row) {
    remaining -= row;
    row++;
  }
  return { row, col: remaining };
}

function parsePosStr(str) {
  // "r3c2" → { row: 3, col: 2 }
  if (!str || str.length < 4) return null;
  const m = str.match(/^r(\d+)c(\d+)$/);
  if (!m) return null;
  return { row: parseInt(m[1], 10), col: parseInt(m[2], 10) };
}

/**
 * Get the two child indices covering a given pyramid position.
 * A card at (row, col) is covered by (row+1, col) and (row+1, col+1).
 * Returns null for row 7 (base — always exposed).
 */
function getChildren(row, col) {
  if (row >= 7) return null;
  return [
    posToIndex(row + 1, col),
    posToIndex(row + 1, col + 1)
  ];
}

/**
 * Check if a pyramid card is exposed (both covering children removed).
 * Base row (7) cards are exposed if present.
 */
function isExposed(pyramid, idx) {
  if (pyramid[idx] === null) return false; // already removed
  const pos = indexToPos(idx);
  if (pos.row === 7) return true; // base row always exposed
  const children = getChildren(pos.row, pos.col);
  return pyramid[children[0]] === null && pyramid[children[1]] === null;
}

// ── Deal generation ────────────────────────────────────────────────────
function generateDeal(seed) {
  const rng = seed != null ? mulberry32(seed) : null;
  const rand = rng || (() => Math.random());

  const deck = [];
  for (let i = 0; i < 52; i++) deck.push(i);

  for (let i = 51; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }

  // 28 cards to pyramid, 24 to draw pile
  const pyramid = deck.slice(0, 28);
  const wasteTop = deck[28]; // first draw card flipped to waste
  const drawPile = deck.slice(29); // 23 remaining

  return { pyramid, wasteTop, drawPile };
}

// ── Game state helpers ─────────────────────────────────────────────────
function countCleared(pyramid) {
  let cleared = 0;
  for (let i = 0; i < 28; i++) {
    if (pyramid[i] === null) cleared++;
  }
  return cleared;
}

function countRemaining(pyramid) {
  return 28 - countCleared(pyramid);
}

function hasValidMoves(pyramid, wasteTop, drawPile) {
  // Collect all exposed pyramid cards
  const exposed = [];
  for (let i = 0; i < 28; i++) {
    if (isExposed(pyramid, i)) exposed.push({ idx: i, val: cardValue(pyramid[i]) });
  }

  // Single King removal
  for (const e of exposed) {
    if (e.val === 13) return true;
  }

  // Pair two exposed pyramid cards
  for (let i = 0; i < exposed.length; i++) {
    for (let j = i + 1; j < exposed.length; j++) {
      if (exposed[i].val + exposed[j].val === 13) return true;
    }
  }

  // Pair exposed pyramid card with waste top
  if (wasteTop !== null) {
    const wasteVal = cardValue(wasteTop);
    for (const e of exposed) {
      if (e.val + wasteVal === 13) return true;
    }
  }

  // Can still draw
  if (drawPile.length > 0) return true;

  return false;
}

// ── Session interface ──────────────────────────────────────────────────

export function selectQuestions(seed) {
  const s = seed || Math.floor(Math.random() * 1000000);
  const deal = generateDeal(s);

  return [{
    type: 'pyramid',
    pyramid: deal.pyramid,       // 28 slots (card value or null)
    wasteTop: deal.wasteTop,
    drawPile: deal.drawPile,
    puzzle: new Array(28).fill(0),
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
 *   { action: "pair", cards: ["r7c0", "r7c6"] }  — pair two pyramid cards
 *   { action: "pair", cards: ["r7c0", "waste"] }  — pair pyramid + waste
 *   { action: "pair", cards: ["r3c1"] }           — single King removal
 *   { action: "draw" }                            — flip draw card to waste
 *   { action: "submit" }                          — end game
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

  if (!Array.isArray(question.pyramid)) question.pyramid = new Array(28).fill(null);
  if (!Array.isArray(question.drawPile)) question.drawPile = [];
  if (typeof question.moveCount !== 'number') question.moveCount = 0;

  // ── Pair action ──────────────────────────────────────────────────
  if (answer.action === 'pair') {
    const cards = answer.cards;
    if (!Array.isArray(cards) || cards.length < 1 || cards.length > 2) {
      return { correct: false, points: 0, action: 'pair', error: 'Provide 1 card (King) or 2 cards to pair' };
    }

    // Single King removal
    if (cards.length === 1) {
      const pos = parsePosStr(cards[0]);
      if (!pos) return { correct: false, points: 0, action: 'pair', error: 'Invalid position: ' + cards[0] };
      const idx = posToIndex(pos.row, pos.col);
      if (idx < 0 || idx >= 28) return { correct: false, points: 0, action: 'pair', error: 'Position out of range' };
      if (question.pyramid[idx] === null) return { correct: false, points: 0, action: 'pair', error: 'Card already removed' };
      if (!isExposed(question.pyramid, idx)) return { correct: false, points: 0, action: 'pair', error: 'Card is not exposed' };
      if (cardValue(question.pyramid[idx]) !== 13) return { correct: false, points: 0, action: 'pair', error: 'Only Kings can be removed alone' };

      question.pyramid[idx] = null;
      question.moveCount++;

      if (session && session.placements) {
        session.placements.push({ action: 'king', pos: cards[0], moveCount: question.moveCount });
      }

      return buildResult(question, elapsedMs);
    }

    // Two-card pair
    const isWasteA = cards[0] === 'waste';
    const isWasteB = cards[1] === 'waste';

    if (isWasteA && isWasteB) {
      return { correct: false, points: 0, action: 'pair', error: 'Two waste cards cannot pair' };
    }

    let cardAVal, cardBVal;
    let pyramidIdxA = null, pyramidIdxB = null;
    let usesWaste = false;

    if (isWasteA || isWasteB) {
      usesWaste = true;
      const pyramidStr = isWasteA ? cards[1] : cards[0];
      const pos = parsePosStr(pyramidStr);
      if (!pos) return { correct: false, points: 0, action: 'pair', error: 'Invalid position: ' + pyramidStr };
      pyramidIdxA = posToIndex(pos.row, pos.col);
      if (pyramidIdxA < 0 || pyramidIdxA >= 28) return { correct: false, points: 0, action: 'pair', error: 'Position out of range' };
      if (question.pyramid[pyramidIdxA] === null) return { correct: false, points: 0, action: 'pair', error: 'Card already removed' };
      if (!isExposed(question.pyramid, pyramidIdxA)) return { correct: false, points: 0, action: 'pair', error: 'Card is not exposed' };
      if (question.wasteTop === null) return { correct: false, points: 0, action: 'pair', error: 'No waste card available' };

      cardAVal = cardValue(question.pyramid[pyramidIdxA]);
      cardBVal = cardValue(question.wasteTop);
    } else {
      const posA = parsePosStr(cards[0]);
      const posB = parsePosStr(cards[1]);
      if (!posA) return { correct: false, points: 0, action: 'pair', error: 'Invalid position: ' + cards[0] };
      if (!posB) return { correct: false, points: 0, action: 'pair', error: 'Invalid position: ' + cards[1] };
      pyramidIdxA = posToIndex(posA.row, posA.col);
      pyramidIdxB = posToIndex(posB.row, posB.col);
      if (pyramidIdxA < 0 || pyramidIdxA >= 28 || pyramidIdxB < 0 || pyramidIdxB >= 28) {
        return { correct: false, points: 0, action: 'pair', error: 'Position out of range' };
      }
      if (question.pyramid[pyramidIdxA] === null || question.pyramid[pyramidIdxB] === null) {
        return { correct: false, points: 0, action: 'pair', error: 'Card already removed' };
      }
      if (!isExposed(question.pyramid, pyramidIdxA) || !isExposed(question.pyramid, pyramidIdxB)) {
        return { correct: false, points: 0, action: 'pair', error: 'Card is not exposed' };
      }
      if (pyramidIdxA === pyramidIdxB) {
        return { correct: false, points: 0, action: 'pair', error: 'Cannot pair a card with itself' };
      }

      cardAVal = cardValue(question.pyramid[pyramidIdxA]);
      cardBVal = cardValue(question.pyramid[pyramidIdxB]);
    }

    if (cardAVal + cardBVal !== 13) {
      return { correct: false, points: 0, action: 'pair', error: 'Cards must sum to 13 (got ' + cardAVal + '+' + cardBVal + '=' + (cardAVal + cardBVal) + ')' };
    }

    // Valid pair — remove cards
    question.pyramid[pyramidIdxA] = null;
    if (pyramidIdxB !== null) question.pyramid[pyramidIdxB] = null;
    if (usesWaste) question.wasteTop = null; // waste card consumed
    question.moveCount++;

    if (session && session.placements) {
      session.placements.push({ action: 'pair', cards: cards, moveCount: question.moveCount });
    }

    return buildResult(question, elapsedMs);
  }

  // ── Draw ──────────────────────────────────────────────────────────
  if (answer.action === 'draw') {
    if (question.drawPile.length === 0) {
      return { correct: false, points: 0, action: 'draw', error: 'Draw pile is empty' };
    }

    const card = question.drawPile.shift();
    question.wasteTop = card;
    question.moveCount++;

    if (session && session.placements) {
      session.placements.push({ action: 'draw', card, moveCount: question.moveCount });
    }

    return buildResult(question, elapsedMs);
  }

  // ── Submit ────────────────────────────────────────────────────────
  if (answer.action === 'submit') {
    const cleared = countCleared(question.pyramid);
    if (cleared === 28) {
      const points = 5000 + cleared * 100 - Math.floor(elapsedMs / 1000);
      return { correct: true, points: Math.max(0, points), action: 'submit', cleared, time: Math.round(elapsedMs / 1000) };
    }
    return { correct: false, points: 0, action: 'submit', partialScore: cleared, cleared };
  }

  return { correct: false, points: 0, error: 'Unknown action: ' + answer.action };
}

function buildResult(question, elapsedMs) {
  const cleared = countCleared(question.pyramid);
  const remaining = 28 - cleared;
  const won = remaining === 0;
  const stuck = !won && !hasValidMoves(question.pyramid, question.wasteTop, question.drawPile);

  // Build exposed mask for client
  const exposed = [];
  for (let i = 0; i < 28; i++) {
    exposed.push(isExposed(question.pyramid, i));
  }

  const result = {
    correct: true,
    points: 0,
    action: 'update',
    pyramid: [...question.pyramid],
    exposed,
    wasteTop: question.wasteTop,
    drawCount: question.drawPile.length,
    cleared,
    remaining,
    moveCount: question.moveCount,
  };

  if (won) {
    result.gameOver = true;
    result.won = true;
    result.points = 5000 + cleared * 100 - Math.floor(elapsedMs / 1000);
    if (result.points < 0) result.points = 0;
  } else if (stuck) {
    result.gameOver = true;
    result.won = false;
    result.points = 0;
    result.partialScore = cleared;
  }

  return result;
}

/**
 * Strip question for client — show full pyramid (all face up),
 * waste top, draw count. Hide draw pile contents.
 */
export function stripQuestion(question) {
  const exposed = [];
  for (let i = 0; i < 28; i++) {
    exposed.push(isExposed(question.pyramid, i));
  }

  return {
    type: 'pyramid',
    pyramid: [...question.pyramid],
    exposed,
    wasteTop: question.wasteTop,
    drawCount: question.drawPile.length,
    seed: question.seed,
  };
}
