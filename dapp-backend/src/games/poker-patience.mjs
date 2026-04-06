/**
 * Poker Patience — Server-side game module.
 *
 * 25 cards dealt one at a time from a seeded 52-card deck.
 * Player places each card into a 5x5 grid (cells A1-E5).
 * After all 25 placed, server scores 10 poker hands:
 * 5 rows (left to right) + 5 columns (top to bottom).
 *
 * Card representation: card = suit * 13 + rank
 *   suit: 0=clubs, 1=diamonds, 2=hearts, 3=spades
 *   rank: 0=Ace, 1=2, ..., 12=King
 *
 * Continuous mode: server withholds next card until current
 * placement is confirmed. Placements array tracks state.
 *
 * Poker hand scoring:
 *   Royal Flush:    100  (10-J-Q-K-A same suit)
 *   Straight Flush:  75  (5 consecutive same suit, incl. A-2-3-4-5)
 *   Four of a Kind:  50
 *   Full House:      25
 *   Flush:           20  (all same suit)
 *   Straight:        15  (5 consecutive, Ace high or low)
 *   Three of a Kind: 10
 *   Two Pair:         5
 *   One Pair:         2
 *   High Card:        0
 *
 * ANSWERS NEVER LEAVE THIS FILE.
 */

export const GAME_ID = 'poker-patience';

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

const RANK_NAMES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUIT_NAMES = ['Clubs','Diamonds','Hearts','Spades'];
const SUIT_SYMBOLS = ['♣','♦','♥','♠'];

function cardShort(c) {
  return RANK_NAMES[cardRank(c)] + SUIT_SYMBOLS[cardSuit(c)];
}

// ── Grid helpers ────────────────────────────────────────────────────────
// Cells: "A1" to "E5". Column A-E (0-4), Row 1-5 (0-4).
// Grid stored as flat array of 25 (null or card value).
// Index = row * 5 + col.

function cellToIndex(cell) {
  if (!cell || cell.length < 2 || cell.length > 2) return -1;
  const col = cell.charCodeAt(0) - 65; // A=0, B=1, ..., E=4
  const row = parseInt(cell[1], 10) - 1; // 1=0, 2=1, ..., 5=4
  if (col < 0 || col > 4 || row < 0 || row > 4 || isNaN(row)) return -1;
  return row * 5 + col;
}

function indexToCell(idx) {
  const row = Math.floor(idx / 5);
  const col = idx % 5;
  return String.fromCharCode(65 + col) + (row + 1);
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

  // Take first 25 cards
  return deck.slice(0, 25);
}

// ── Poker hand scoring ─────────────────────────────────────────────────

function scorePokerHand(cards) {
  if (cards.length !== 5 || cards.some(c => c === null || c === undefined)) {
    return { name: 'Incomplete', points: 0 };
  }

  const ranks = cards.map(cardRank).sort((a, b) => a - b);
  const suits = cards.map(cardSuit);

  // Check flush
  const isFlush = suits.every(s => s === suits[0]);

  // Check straight
  const isStraight = checkStraight(ranks);

  // Check ace-high straight (10-J-Q-K-A = ranks [0,9,10,11,12] sorted)
  const isAceHighStraight = ranks[0] === 0 && ranks[1] === 9 && ranks[2] === 10 && ranks[3] === 11 && ranks[4] === 12;

  // Royal Flush: 10-J-Q-K-A all same suit
  if (isFlush && isAceHighStraight) {
    return { name: 'Royal Flush', points: 100 };
  }

  // Straight Flush (includes steel wheel A-2-3-4-5 suited)
  if (isFlush && isStraight) {
    return { name: 'Straight Flush', points: 75 };
  }

  // Count rank occurrences
  const rankCount = new Array(13).fill(0);
  for (const r of ranks) rankCount[r]++;
  const counts = rankCount.filter(c => c > 0).sort((a, b) => b - a);

  // Four of a Kind
  if (counts[0] === 4) {
    return { name: 'Four of a Kind', points: 50 };
  }

  // Full House
  if (counts[0] === 3 && counts[1] === 2) {
    return { name: 'Full House', points: 25 };
  }

  // Flush
  if (isFlush) {
    return { name: 'Flush', points: 20 };
  }

  // Straight
  if (isStraight) {
    return { name: 'Straight', points: 15 };
  }

  // Three of a Kind
  if (counts[0] === 3) {
    return { name: 'Three of a Kind', points: 10 };
  }

  // Two Pair
  if (counts[0] === 2 && counts[1] === 2) {
    return { name: 'Two Pair', points: 5 };
  }

  // One Pair
  if (counts[0] === 2) {
    return { name: 'One Pair', points: 2 };
  }

  return { name: 'High Card', points: 0 };
}

/**
 * Check if sorted ranks form a straight.
 * Ace plays low (A-2-3-4-5) or high (10-J-Q-K-A).
 * No wraparound.
 */
function checkStraight(sortedRanks) {
  // Normal consecutive check
  let consecutive = true;
  for (let i = 1; i < 5; i++) {
    if (sortedRanks[i] !== sortedRanks[i - 1] + 1) {
      consecutive = false;
      break;
    }
  }
  if (consecutive) return true;

  // Ace-high: ranks should be [0, 9, 10, 11, 12] after sort
  if (sortedRanks[0] === 0 && sortedRanks[1] === 9 &&
      sortedRanks[2] === 10 && sortedRanks[3] === 11 && sortedRanks[4] === 12) {
    return true;
  }

  return false;
}

/**
 * Score all 10 hands (5 rows + 5 columns) from a filled grid.
 */
function scoreGrid(grid) {
  const results = [];
  let total = 0;

  // 5 rows
  for (let r = 0; r < 5; r++) {
    const hand = [];
    for (let c = 0; c < 5; c++) hand.push(grid[r * 5 + c]);
    const score = scorePokerHand(hand);
    score.label = 'Row ' + (r + 1);
    score.cards = hand;
    results.push(score);
    total += score.points;
  }

  // 5 columns
  for (let c = 0; c < 5; c++) {
    const hand = [];
    for (let r = 0; r < 5; r++) hand.push(grid[r * 5 + c]);
    const score = scorePokerHand(hand);
    score.label = 'Col ' + String.fromCharCode(65 + c);
    score.cards = hand;
    results.push(score);
    total += score.points;
  }

  return { results, total };
}

// ── Session interface ──────────────────────────────────────────────────

export function selectQuestions(seed) {
  const s = seed || Math.floor(Math.random() * 1000000);
  const cards = generateDeal(s);

  return [{
    type: 'poker-patience',
    cards,                          // 25 cards in deal order
    grid: new Array(25).fill(null), // 5x5 grid, null = empty
    cardIndex: 0,                   // next card to deal
    puzzle: new Array(25).fill(0),  // dummy for framework compat
    solution: null,
    seed: s,
    moveHistory: [],
    moveCount: 0,
    undoCount: 0,
  }];
}

/**
 * Evaluate a placement action.
 *
 * Actions:
 *   { action: 'place', cell: 'B3' } — place current card at cell
 *   { action: 'submit' }            — finalise (auto-triggered after card 25)
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

  // Ensure arrays survive JSON round-trip
  if (!Array.isArray(question.grid)) question.grid = new Array(25).fill(null);
  if (typeof question.cardIndex !== 'number') question.cardIndex = 0;
  if (!Array.isArray(question.moveHistory)) question.moveHistory = [];
  if (typeof question.moveCount !== 'number') question.moveCount = 0;

  // ── Place card ──────────────────────────────────────────────────────
  if (answer.action === 'place') {
    const cellStr = (answer.cell || '').toUpperCase();
    const idx = cellToIndex(cellStr);
    if (idx === -1) {
      return { correct: false, points: 0, action: 'place', error: 'Invalid cell: ' + answer.cell };
    }

    if (question.grid[idx] !== null) {
      return { correct: false, points: 0, action: 'place', error: 'Cell ' + cellStr + ' is occupied' };
    }

    if (question.cardIndex >= question.cards.length) {
      return { correct: false, points: 0, action: 'place', error: 'All cards already placed' };
    }

    // Place the card
    const card = question.cards[question.cardIndex];
    question.grid[idx] = card;
    question.cardIndex++;
    question.moveCount++;

    // Track placement for persistence
    if (session && session.placements) {
      session.placements.push({ card, cell: cellStr, cardIndex: question.cardIndex - 1 });
    }

    const allPlaced = question.cardIndex >= question.cards.length;

    // Score any completed rows/columns
    const lineScores = getCompletedLineScores(question.grid);

    const result = {
      correct: true,
      points: 0,
      action: 'place',
      cell: cellStr,
      cardPlaced: card,
      grid: [...question.grid],
      cardIndex: question.cardIndex,
      cardsRemaining: question.cards.length - question.cardIndex,
      moveCount: question.moveCount,
      lineScores,
    };

    if (allPlaced) {
      // All cards placed — return final scores for display.
      // Client must send { action: 'submit' } to finalise session.
      const finalScores = scoreGrid(question.grid);
      result.allPlaced = true;
      result.finalScores = finalScores;
    } else {
      // Reveal next card
      result.nextCard = question.cards[question.cardIndex];
    }

    return result;
  }

  // ── Submit (manual finish — shouldn't normally be needed) ───────────
  if (answer.action === 'submit') {
    const placed = question.grid.filter(c => c !== null).length;
    if (placed < 25) {
      return { correct: false, points: 0, action: 'submit', error: 'Grid not complete (' + placed + '/25 cards placed)' };
    }

    const finalScores = scoreGrid(question.grid);
    return {
      correct: true,
      points: finalScores.total,
      action: 'submit',
      finalScores,
      time: Math.round(elapsedMs / 1000),
    };
  }

  return { correct: false, points: 0, error: 'Unknown action: ' + answer.action };
}

/**
 * Get scores for any fully completed rows/columns (5 cards filled).
 * Returns array of { label, name, points } for completed lines only.
 */
function getCompletedLineScores(grid) {
  const scores = [];

  // Check rows
  for (let r = 0; r < 5; r++) {
    const hand = [];
    let complete = true;
    for (let c = 0; c < 5; c++) {
      const card = grid[r * 5 + c];
      if (card === null) { complete = false; break; }
      hand.push(card);
    }
    if (complete) {
      const s = scorePokerHand(hand);
      scores.push({ label: 'Row ' + (r + 1), name: s.name, points: s.points });
    }
  }

  // Check columns
  for (let c = 0; c < 5; c++) {
    const hand = [];
    let complete = true;
    for (let r = 0; r < 5; r++) {
      const card = grid[r * 5 + c];
      if (card === null) { complete = false; break; }
      hand.push(card);
    }
    if (complete) {
      const s = scorePokerHand(hand);
      scores.push({ label: 'Col ' + String.fromCharCode(65 + c), name: s.name, points: s.points });
    }
  }

  return scores;
}

/**
 * Strip question for client. Reveals only the current card to place
 * (not future cards) and the current grid state.
 */
export function stripQuestion(question) {
  const currentCard = question.cardIndex < question.cards.length
    ? question.cards[question.cardIndex]
    : null;

  return {
    type: 'poker-patience',
    grid: [...question.grid],
    currentCard,
    cardIndex: question.cardIndex,
    cardsTotal: question.cards.length,
    seed: question.seed,
  };
}
