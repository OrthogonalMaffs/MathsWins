/**
 * Cribbage Solitaire — Server-side game module.
 *
 * 9 hands per session. 52 cards shuffled and dealt into 9 groups
 * (8 × 5 cards + 1 × 2 card crib). Player views each hand with a
 * starter card, taps "Score It", and server returns the cribbage
 * score breakdown. Final score = sum of all 9 hand scores.
 *
 * Card representation: card = suit * 13 + rank
 *   suit: 0=clubs, 1=diamonds, 2=hearts, 3=spades
 *   rank: 0=Ace, 1=2, ..., 12=King
 *
 * Scoring (standard cribbage):
 *   Fifteens: 2pts per unique subset summing to 15
 *   Pairs:    2pts per pair of same rank
 *   Runs:     1pt per card in runs of 3+ consecutive ranks
 *   Flush:    4pts for 4-card hand flush, 5pts if starter matches
 *             (crib: only 5-card flush counts — but crib here is 2 cards, no flush)
 *   Nobs:     1pt for Jack in hand matching starter suit
 *   Nibs:     2pts if starter is a Jack (crib only)
 *
 * Starters:
 *   Groups 1-7: starter = first card of next group
 *   Group 8:    starter = first card of group 9 (crib)
 *   Group 9:    reuses group 8's starter
 *
 * ANSWERS NEVER LEAVE THIS FILE.
 */

export const GAME_ID = 'cribbage-solitaire';
export const QUESTIONS_PER_SESSION = 9;

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

const RANK_CHARS = ['A','2','3','4','5','6','7','8','9','T','J','Q','K'];
const SUIT_CHARS = ['c','d','h','s'];
const RANK_NAMES = ['Ace','2','3','4','5','6','7','8','9','10','Jack','Queen','King'];
const SUIT_NAMES = ['Clubs','Diamonds','Hearts','Spades'];
const SUIT_SYMBOLS = ['♣','♦','♥','♠'];

function cardStr(c) {
  return RANK_CHARS[cardRank(c)] + SUIT_CHARS[cardSuit(c)];
}

function cardDisplay(c) {
  return RANK_NAMES[cardRank(c)] + ' of ' + SUIT_NAMES[cardSuit(c)];
}

function cardShort(c) {
  const r = cardRank(c);
  const label = r === 0 ? 'A' : r < 9 ? String(r + 1) : r === 9 ? '10' : RANK_CHARS[r];
  return label + SUIT_SYMBOLS[cardSuit(c)];
}

/** Card value for fifteens: A=1, 2-9=face value, 10/J/Q/K=10 */
function cardValue(c) {
  const r = cardRank(c);
  if (r === 0) return 1;   // Ace
  if (r >= 9) return 10;   // 10, J, Q, K (ranks 9-12)
  return r + 1;            // 2-9 (ranks 1-8)
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

  // Split into 9 groups: 8 × 5 + 1 × 2
  const groups = [];
  for (let g = 0; g < 8; g++) {
    groups.push(deck.slice(g * 5, g * 5 + 5));
  }
  groups.push(deck.slice(40, 42)); // crib (2 cards)

  return groups;
}

function buildQuestions(groups) {
  const questions = [];
  for (let i = 0; i < 9; i++) {
    let starter;
    if (i < 8) {
      // Groups 1-8: starter = first card of next group
      starter = groups[i + 1 < 9 ? i + 1 : 8][0];
    }
    if (i === 8) {
      // Crib: reuse group 8's starter (= groups[8][0], same as above for i=7)
      starter = groups[8][0];
    }

    questions.push({
      hand: groups[i],
      starter,
      is_crib: i === 8,
      hand_index: i,
    });
  }
  return questions;
}

// ── Cribbage scoring ───────────────────────────────────────────────────

/**
 * Find all subsets of cards that sum to 15. Returns { points, combos }.
 * combos: array of card arrays (each subset).
 */
function scoreFifteens(cards) {
  const values = cards.map(cardValue);
  const n = values.length;
  let count = 0;
  const combos = [];

  for (let mask = 1; mask < (1 << n); mask++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) sum += values[i];
    }
    if (sum === 15) {
      count++;
      const subset = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) subset.push(cards[i]);
      }
      combos.push(subset);
    }
  }

  return { points: count * 2, combos };
}

/**
 * Find all pairs of same-rank cards. Returns { points, combos }.
 */
function scorePairs(cards) {
  let points = 0;
  const combos = [];

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cardRank(cards[i]) === cardRank(cards[j])) {
        points += 2;
        combos.push([cards[i], cards[j]]);
      }
    }
  }

  return { points, combos };
}

/**
 * Score runs of 3+ consecutive ranks, accounting for duplicate ranks
 * (double runs, double-double runs, triple runs).
 *
 * Algorithm: find maximal consecutive rank sequences, multiply by
 * the product of rank multiplicities within each sequence.
 */
function scoreRuns(cards) {
  const rankCount = new Array(13).fill(0);
  for (const c of cards) rankCount[cardRank(c)]++;

  let totalPoints = 0;
  const descriptions = [];

  let start = -1;
  for (let r = 0; r <= 13; r++) {
    if (r < 13 && rankCount[r] > 0) {
      if (start === -1) start = r;
    } else {
      if (start !== -1) {
        const len = r - start;
        if (len >= 3) {
          let product = 1;
          for (let k = start; k < r; k++) product *= rankCount[k];
          totalPoints += len * product;

          // Build description
          const runRanks = [];
          for (let k = start; k < r; k++) runRanks.push(RANK_CHARS[k]);
          const runStr = runRanks.join('-');
          if (product === 1) {
            descriptions.push('Run ' + runStr + ' (' + len + 'pts)');
          } else {
            descriptions.push(product + '× run ' + runStr + ' (' + totalPoints + 'pts)');
          }
        }
        start = -1;
      }
    }
  }

  return { points: totalPoints, descriptions };
}

/**
 * Score flush. Hand cards (without starter) must all be same suit.
 * 4pts for hand-only flush, 5pts if starter also matches.
 * Crib with only 2 cards: no flush possible.
 */
function scoreFlush(hand, starter, isCrib) {
  if (hand.length < 4) return { points: 0, desc: null };

  const handSuit = cardSuit(hand[0]);
  for (let i = 1; i < hand.length; i++) {
    if (cardSuit(hand[i]) !== handSuit) return { points: 0, desc: null };
  }

  if (isCrib) {
    // Crib: only counts if all cards including starter match
    if (cardSuit(starter) === handSuit) {
      return { points: 5, desc: 'Flush 5 (5pts)' };
    }
    return { points: 0, desc: null };
  }

  // Standard hand: 4pts for hand flush, 5pts if starter matches
  if (cardSuit(starter) === handSuit) {
    return { points: 5, desc: 'Flush with starter (5pts)' };
  }
  return { points: 4, desc: 'Flush in hand (4pts)' };
}

/**
 * Nobs: 1pt for Jack in hand matching starter suit.
 */
function scoreNobs(hand, starter) {
  const starterSuit = cardSuit(starter);
  for (const c of hand) {
    if (cardRank(c) === 10 && cardSuit(c) === starterSuit) { // rank 10 = Jack
      return { points: 1, card: c, desc: 'Nobs — ' + cardShort(c) + ' (1pt)' };
    }
  }
  return { points: 0, card: null, desc: null };
}

/**
 * Nibs: 2pts if starter is a Jack (crib only per spec).
 */
function scoreNibs(starter, isCrib) {
  if (isCrib && cardRank(starter) === 10) {
    return { points: 2, desc: 'Nibs — ' + cardShort(starter) + ' (2pts)' };
  }
  return { points: 0, desc: null };
}

/**
 * Score a complete hand (hand cards + starter).
 */
function scoreHand(hand, starter, isCrib) {
  const allCards = [...hand, starter];

  const fifteens = scoreFifteens(allCards);
  const pairs = scorePairs(allCards);
  const runs = scoreRuns(allCards);
  const flush = scoreFlush(hand, starter, isCrib);
  const nobs = scoreNobs(hand, starter);
  const nibs = scoreNibs(starter, isCrib);

  const total = fifteens.points + pairs.points + runs.points
    + flush.points + nobs.points + nibs.points;

  // Build human-readable combinations list
  const combinations = [];

  for (const subset of fifteens.combos) {
    const parts = subset.map(cardShort);
    combinations.push(parts.join('+') + ' = 15 (2pts)');
  }

  for (const pair of pairs.combos) {
    combinations.push('Pair ' + cardShort(pair[0]) + '+' + cardShort(pair[1]) + ' (2pts)');
  }

  for (const desc of runs.descriptions) {
    combinations.push(desc);
  }

  if (flush.desc) combinations.push(flush.desc);
  if (nobs.desc) combinations.push(nobs.desc);
  if (nibs.desc) combinations.push(nibs.desc);

  return {
    score: total,
    breakdown: {
      fifteens: fifteens.points,
      pairs: pairs.points,
      runs: runs.points,
      flush: flush.points,
      nobs: nobs.points,
      nibs: nibs.points,
    },
    combinations,
  };
}

// ── Session interface ──────────────────────────────────────────────────

export function selectQuestions(seed) {
  const s = seed || Math.floor(Math.random() * 1000000);
  const groups = generateDeal(s);
  const questions = buildQuestions(groups);
  // Store seed on first question for reproducibility
  questions[0].seed = s;
  return questions;
}

/**
 * Evaluate: score the current hand. Answer is ignored (scoring is
 * deterministic — player just triggers it). Sets question.answer
 * so the scoring engine passes it back as correctAnswer.
 */
export function evaluator(question, answer, elapsedMs) {
  const result = scoreHand(question.hand, question.starter, question.is_crib);

  // Pack into question.answer for the sequential response
  question.answer = result;

  return {
    correct: true,
    points: result.score,
    accuracy: 100,
    multiplier: 1,
  };
}

/**
 * Strip question for client — send hand cards and starter as numeric
 * card values (0-51). Client uses QFCards to render.
 */
export function stripQuestion(question) {
  return {
    num: question.hand_index + 1,
    type: 'cribbage',
    hand: question.hand,
    starter: question.starter,
    is_crib: question.is_crib,
    hand_index: question.hand_index,
  };
}
