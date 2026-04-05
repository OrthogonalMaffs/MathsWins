/**
 * FreeCell — Server-side game module.
 *
 * Classic FreeCell solitaire with Microsoft deal compatibility (deals 1-32000).
 * All state tracked server-side: columns, free cells, foundations, move history.
 *
 * Card representation: card = suit * 13 + rank
 *   suit: 0=clubs, 1=diamonds, 2=hearts, 3=spades
 *   rank: 0=Ace, 1=2, ..., 12=King
 *   colour: clubs/spades=black(0), diamonds/hearts=red(1)
 *
 * Scoring:
 *   Win: max(0, 5000 - floor(elapsedMs / 1000)) — 5000 base minus 1 pt/sec
 *   DNF: -(52 - totalFoundationCards) — negative cards remaining
 *
 * SOLUTION NEVER LEAVES THIS FILE (game is open information, but server
 * validates all moves and tracks authoritative state).
 */

export const GAME_ID = 'freecell';

// ── Scoring constants ───────────────────────────────────────────────────
const BASE_SCORE = 5000;

// ── Card helpers ────────────────────────────────────────────────────────

function cardSuit(c) { return Math.floor(c / 13); }
function cardRank(c) { return c % 13; }
function cardColor(c) { const s = cardSuit(c); return (s === 1 || s === 2) ? 1 : 0; } // 0=black, 1=red

const SUIT_CHARS = ['c', 'd', 'h', 's'];
const RANK_CHARS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];

function cardName(c) {
  return RANK_CHARS[cardRank(c)] + SUIT_CHARS[cardSuit(c)];
}

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

// ── Microsoft FreeCell deal algorithm (deals 1-32000) ───────────────────
function msDeal(dealNum) {
  let seed = dealNum;
  function msRand() {
    seed = (seed * 214013 + 2531011) & 0x7FFFFFFF;
    return (seed >> 16) & 0x7FFF;
  }
  // Build deck 0-51
  const deck = [];
  for (let i = 0; i < 52; i++) deck.push(i);
  // Fisher-Yates shuffle with MS random
  for (let i = 51; i > 0; i--) {
    const j = msRand() % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  // Deal into 8 columns left-to-right
  const columns = [[], [], [], [], [], [], [], []];
  for (let i = 0; i < 52; i++) {
    columns[i % 8].push(deck[i]);
  }
  return columns;
}

// ── Seeded deal (for league play) ───────────────────────────────────────
function seededDeal(seed) {
  const rng = mulberry32(seed);
  const deck = [];
  for (let i = 0; i < 52; i++) deck.push(i);
  // Fisher-Yates shuffle
  for (let i = 51; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const columns = [[], [], [], [], [], [], [], []];
  for (let i = 0; i < 52; i++) {
    columns[i % 8].push(deck[i]);
  }
  return columns;
}

// ── Deep clone state for move history ───────────────────────────────────
function cloneState(q) {
  return {
    columns: q.columns.map(col => [...col]),
    freeCells: [...q.freeCells],
    foundations: [...q.foundations],
  };
}

// ── Restore state from history entry ────────────────────────────────────
function restoreState(q, state) {
  q.columns = state.columns.map(col => [...col]);
  q.freeCells = [...state.freeCells];
  q.foundations = [...state.foundations];
}

// ── Count empty free cells and cascades ─────────────────────────────────
function countEmptyFreeCells(q) {
  let count = 0;
  for (let i = 0; i < 4; i++) {
    if (q.freeCells[i] === null) count++;
  }
  return count;
}

function countEmptyCascades(q) {
  let count = 0;
  for (let i = 0; i < 8; i++) {
    if (q.columns[i].length === 0) count++;
  }
  return count;
}

// ── Total foundation cards ──────────────────────────────────────────────
function totalFoundationCards(q) {
  return q.foundations[0] + q.foundations[1] + q.foundations[2] + q.foundations[3];
}

// ── Validate a descending alternating-colour sequence at tail of cascade ─
function isValidCascadeSequence(cards, startIndex) {
  for (let i = startIndex; i < cards.length - 1; i++) {
    const current = cards[i];
    const next = cards[i + 1];
    if (cardColor(current) === cardColor(next)) return false;
    if (cardRank(current) !== cardRank(next) + 1) return false;
  }
  return true;
}

// ── Check if card can go on foundation ──────────────────────────────────
function canGoToFoundation(card, foundations) {
  const suit = cardSuit(card);
  const rank = cardRank(card);
  return rank === foundations[suit];
}

// ── Auto-complete detection ─────────────────────────────────────────────
// A position is auto-completable when for every card not yet on a foundation,
// all cards of lower rank in opposite colours are already on foundations.
function isAutoCompletable(q) {
  // Check all cards in cascades and free cells
  const allCards = [];
  for (const col of q.columns) {
    for (const card of col) allCards.push(card);
  }
  for (const cell of q.freeCells) {
    if (cell !== null) allCards.push(cell);
  }

  for (const card of allCards) {
    const rank = cardRank(card);
    const color = cardColor(card);
    // For this card, all cards of lower rank in opposite colour must be on foundations
    for (let s = 0; s < 4; s++) {
      const sColor = (s === 1 || s === 2) ? 1 : 0;
      if (sColor !== color) {
        // Opposite colour suit — its foundation count must be >= this card's rank
        if (q.foundations[s] < rank) return false;
      }
    }
  }
  return true;
}

// ── Auto-complete execution ─────────────────────────────────────────────
function executeAutoComplete(q) {
  const sequence = [];
  let moved = true;
  while (moved) {
    moved = false;
    // Check free cells first
    for (let i = 0; i < 4; i++) {
      if (q.freeCells[i] !== null && canGoToFoundation(q.freeCells[i], q.foundations)) {
        const card = q.freeCells[i];
        q.foundations[cardSuit(card)]++;
        q.freeCells[i] = null;
        sequence.push({ card, suit: cardSuit(card) });
        moved = true;
      }
    }
    // Check cascade tops
    for (let i = 0; i < 8; i++) {
      const col = q.columns[i];
      if (col.length > 0 && canGoToFoundation(col[col.length - 1], q.foundations)) {
        const card = col.pop();
        q.foundations[cardSuit(card)]++;
        sequence.push({ card, suit: cardSuit(card) });
        moved = true;
      }
    }
  }
  return sequence;
}

// ── Ensure arrays survive JSON round-trip ───────────────────────────────
function ensureState(question) {
  if (!Array.isArray(question.columns)) {
    question.columns = [[], [], [], [], [], [], [], []];
  }
  if (!Array.isArray(question.freeCells)) {
    question.freeCells = [null, null, null, null];
  }
  if (!Array.isArray(question.foundations)) {
    question.foundations = [0, 0, 0, 0];
  }
  if (!Array.isArray(question.moveHistory)) {
    question.moveHistory = [];
  }
  if (typeof question.moveCount !== 'number') {
    question.moveCount = 0;
  }
  if (typeof question.undoCount !== 'number') {
    question.undoCount = 0;
  }
}

// ── Session interface ───────────────────────────────────────────────────

export function selectQuestions(seed, difficulty) {
  const s = seed || Math.floor(Math.random() * 32000) + 1;

  // For league play (difficulty provided), use seeded PRNG deal
  // For free play, use MS deal if seed is 1-32000, otherwise seeded deal
  let columns;
  if (difficulty) {
    // League play — seeded PRNG, never MS numbering
    columns = seededDeal(s);
  } else if (s >= 1 && s <= 32000) {
    columns = msDeal(s);
  } else {
    columns = seededDeal(s);
  }

  return [{
    type: 'freecell',
    columns,
    freeCells: [null, null, null, null],
    foundations: [0, 0, 0, 0],
    puzzle: new Array(52).fill(0),
    solution: null,
    seed: s,
    moveHistory: [],
    moveCount: 0,
    undoCount: 0,
  }];
}

/**
 * Evaluate a FreeCell action from the client.
 * Server-authoritative: question object tracks columns, free cells,
 * foundations, move history.
 *
 * Actions:
 *   { action: 'move', from: { type, index }, to: { type, index }, count: N }
 *   { action: 'undo' }
 *   { action: 'autocomplete' }
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

  ensureState(question);

  // ── Move ─────────────────────────────────────────────────────────────
  if (answer.action === 'move') {
    const { from, to, count } = answer;
    if (!from || !to || !from.type || !to.type) {
      return { correct: false, points: 0, action: 'move', error: 'Invalid move parameters' };
    }

    const moveCount = count || 1;

    // Get the card(s) being moved
    let movingCards = [];
    let sourceDescription = '';

    if (from.type === 'cascade') {
      const colIdx = from.index;
      if (colIdx < 0 || colIdx > 7 || question.columns[colIdx].length === 0) {
        return { correct: false, points: 0, action: 'move', error: 'Invalid source cascade' };
      }
      const col = question.columns[colIdx];
      if (moveCount > col.length || moveCount < 1) {
        return { correct: false, points: 0, action: 'move', error: 'Invalid card count' };
      }
      movingCards = col.slice(col.length - moveCount);
      sourceDescription = 'cascade';
    } else if (from.type === 'freecell') {
      if (from.index < 0 || from.index > 3 || question.freeCells[from.index] === null) {
        return { correct: false, points: 0, action: 'move', error: 'Invalid source free cell' };
      }
      if (moveCount !== 1) {
        return { correct: false, points: 0, action: 'move', error: 'Can only move one card from free cell' };
      }
      movingCards = [question.freeCells[from.index]];
      sourceDescription = 'freecell';
    } else {
      return { correct: false, points: 0, action: 'move', error: 'Invalid source type' };
    }

    // Validate multi-card sequence (must be descending alternating colour)
    if (moveCount > 1) {
      if (!isValidCascadeSequence(movingCards, 0)) {
        return { correct: false, points: 0, action: 'move', error: 'Illegal move' };
      }
    }

    // Validate destination and legality
    if (to.type === 'cascade') {
      const destIdx = to.index;
      if (destIdx < 0 || destIdx > 7) {
        return { correct: false, points: 0, action: 'move', error: 'Invalid destination cascade' };
      }

      const destCol = question.columns[destIdx];
      const topMovingCard = movingCards[0];

      if (destCol.length > 0) {
        const destTop = destCol[destCol.length - 1];
        // Must be opposite colour and one rank higher
        if (cardColor(topMovingCard) === cardColor(destTop) || cardRank(destTop) !== cardRank(topMovingCard) + 1) {
          return { correct: false, points: 0, action: 'move', error: 'Illegal move' };
        }
      }
      // Empty column: any card(s) can go there

      // Supermove validation for multi-card moves
      if (moveCount > 1) {
        const emptyFreeCells = countEmptyFreeCells(question);
        let emptyCascades = countEmptyCascades(question);
        // Exclude destination if it is empty
        if (destCol.length === 0) emptyCascades--;
        // Exclude source cascade from empty count (it will become empty after move if all cards taken)
        // No — source is not empty yet during the move, and we already check destCol
        const maxMovable = (emptyFreeCells + 1) * Math.pow(2, Math.max(0, emptyCascades));
        if (moveCount > maxMovable) {
          return { correct: false, points: 0, action: 'move', error: 'Illegal move' };
        }
      }

      // Legal — execute
      const prevState = cloneState(question);
      if (from.type === 'cascade') {
        question.columns[from.index].splice(question.columns[from.index].length - moveCount, moveCount);
      } else {
        question.freeCells[from.index] = null;
      }
      for (const card of movingCards) {
        question.columns[destIdx].push(card);
      }
      question.moveHistory.push(prevState);
      question.moveCount++;

    } else if (to.type === 'freecell') {
      if (moveCount !== 1) {
        return { correct: false, points: 0, action: 'move', error: 'Can only place one card in free cell' };
      }
      const destIdx = to.index;
      if (destIdx < 0 || destIdx > 3 || question.freeCells[destIdx] !== null) {
        return { correct: false, points: 0, action: 'move', error: 'Free cell not empty' };
      }

      const prevState = cloneState(question);
      if (from.type === 'cascade') {
        question.columns[from.index].pop();
      } else {
        question.freeCells[from.index] = null;
      }
      question.freeCells[destIdx] = movingCards[0];
      question.moveHistory.push(prevState);
      question.moveCount++;

    } else if (to.type === 'foundation') {
      if (moveCount !== 1) {
        return { correct: false, points: 0, action: 'move', error: 'Can only place one card on foundation' };
      }
      const card = movingCards[0];
      const suit = cardSuit(card);
      const destIdx = to.index;

      // Allow destination index to match suit, or auto-detect
      if (destIdx !== undefined && destIdx !== suit) {
        return { correct: false, points: 0, action: 'move', error: 'Wrong foundation for this suit' };
      }

      if (!canGoToFoundation(card, question.foundations)) {
        return { correct: false, points: 0, action: 'move', error: 'Illegal move' };
      }

      const prevState = cloneState(question);
      if (from.type === 'cascade') {
        question.columns[from.index].pop();
      } else {
        question.freeCells[from.index] = null;
      }
      question.foundations[suit]++;
      question.moveHistory.push(prevState);
      question.moveCount++;

    } else {
      return { correct: false, points: 0, action: 'move', error: 'Invalid destination type' };
    }

    // Check win
    const won = totalFoundationCards(question) === 52;
    const autoComplete = !won && isAutoCompletable(question);

    const result = {
      correct: true,
      points: 0,
      action: 'move',
      columns: question.columns,
      freeCells: question.freeCells,
      foundations: question.foundations,
      moveCount: question.moveCount,
      won,
      autoComplete,
    };

    if (won) {
      result.points = Math.max(0, BASE_SCORE - Math.floor(elapsedMs / 1000));
    }

    return result;
  }

  // ── Undo ─────────────────────────────────────────────────────────────
  if (answer.action === 'undo') {
    if (question.moveHistory.length === 0) {
      return { correct: false, points: 0, action: 'undo', error: 'Nothing to undo' };
    }

    const prevState = question.moveHistory.pop();
    restoreState(question, prevState);
    question.moveCount--;
    question.undoCount++;

    return {
      correct: true,
      points: 0,
      action: 'undo',
      columns: question.columns,
      freeCells: question.freeCells,
      foundations: question.foundations,
      moveCount: question.moveCount,
      undoCount: question.undoCount,
    };
  }

  // ── Autocomplete ─────────────────────────────────────────────────────
  if (answer.action === 'autocomplete') {
    if (!isAutoCompletable(question)) {
      return { correct: false, points: 0, action: 'autocomplete', error: 'Position is not auto-completable' };
    }

    const sequence = executeAutoComplete(question);
    const points = Math.max(0, BASE_SCORE - Math.floor(elapsedMs / 1000));

    return {
      correct: true,
      points,
      action: 'autocomplete',
      foundations: [...question.foundations],
      won: true,
      sequence,
    };
  }

  // ── Submit ───────────────────────────────────────────────────────────
  if (answer.action === 'submit') {
    const foundationTotal = totalFoundationCards(question);
    if (foundationTotal === 52) {
      const points = Math.max(0, BASE_SCORE - Math.floor(elapsedMs / 1000));
      return {
        correct: true,
        points,
        action: 'submit',
        time: Math.round(elapsedMs / 1000),
      };
    }

    const partialScore = -(52 - foundationTotal);
    return {
      correct: false,
      points: 0,
      action: 'submit',
      partialScore,
    };
  }

  return { correct: false, points: 0, error: 'Unknown action: ' + answer.action };
}

/**
 * Strip server-internal data from question before sending to client.
 * FreeCell is open information — all cards are face-up — so columns,
 * free cells, and foundations are all visible.
 */
export function stripQuestion(question) {
  return {
    type: 'freecell',
    columns: question.columns,
    freeCells: question.freeCells,
    foundations: question.foundations,
    seed: question.seed,
    scoring: { base: BASE_SCORE, timeDecay: '1pt/sec' },
  };
}
