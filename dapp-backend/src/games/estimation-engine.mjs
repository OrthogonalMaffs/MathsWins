/**
 * Estimation Engine — Server-side question bank and evaluator.
 *
 * 160 questions across 4 difficulty tiers (40 each).
 * Scoring: accuracy = 100 × (1 - pctError)², speed multiplier 1.0x-1.3x over 60s.
 * 60-second cutoff per question. 10 questions per session.
 *
 * ANSWERS NEVER LEAVE THIS FILE.
 */

export const GAME_ID = 'estimation-engine';

// ── Tier 1: Warm-up — single operations ─────────────────────────────────────
const tier1 = [
  { text: '25 × 12', answer: 300 },
  { text: '36 × 11', answer: 396 },
  { text: '15 × 14', answer: 210 },
  { text: '48 × 5', answer: 240 },
  { text: '72 × 8', answer: 576 },
  { text: '19 × 11', answer: 209 },
  { text: '55 × 6', answer: 330 },
  { text: '33 × 12', answer: 396 },
  { text: '44 × 25', answer: 1100 },
  { text: '16 × 15', answer: 240 },
  { text: '125 × 8', answer: 1000 },
  { text: '64 × 5', answer: 320 },
  { text: '99 × 3', answer: 297 },
  { text: '75 × 12', answer: 900 },
  { text: '28 × 25', answer: 700 },
  { text: '√900', answer: 30 },
  { text: '√400', answer: 20 },
  { text: '√2500', answer: 50 },
  { text: '√1600', answer: 40 },
  { text: '√8100', answer: 90 },
  { text: '144 ÷ 12', answer: 12 },
  { text: '225 ÷ 15', answer: 15 },
  { text: '360 ÷ 12', answer: 30 },
  { text: '480 ÷ 16', answer: 30 },
  { text: '756 ÷ 9', answer: 84 },
  { text: '10% of 450', answer: 45 },
  { text: '50% of 630', answer: 315 },
  { text: '25% of 800', answer: 200 },
  { text: '20% of 350', answer: 70 },
  { text: '75% of 200', answer: 150 },
  { text: '2⁵', answer: 32 },
  { text: '3³', answer: 27 },
  { text: '5³', answer: 125 },
  { text: '4³', answer: 64 },
  { text: '10⁴', answer: 10000 },
  { text: '12²', answer: 144 },
  { text: '15²', answer: 225 },
  { text: '20²', answer: 400 },
  { text: '11²', answer: 121 },
  { text: '30²', answer: 900 },
];

// ── Tier 2: Moderate — needs a mental trick ─────────────────────────────────
const tier2 = [
  { text: '15% of 840', answer: 126 },
  { text: '37²', answer: 1369 },
  { text: '47 × 23', answer: 1081 },
  { text: '88 × 12', answer: 1056 },
  { text: '33 × 33', answer: 1089 },
  { text: '17 × 19', answer: 323 },
  { text: '29 × 31', answer: 899 },
  { text: '45 × 45', answer: 2025 },
  { text: '55 × 55', answer: 3025 },
  { text: '65 × 65', answer: 4225 },
  { text: '√2025', answer: 45 },
  { text: '√1764', answer: 42 },
  { text: '√3969', answer: 63 },
  { text: '√5184', answer: 72 },
  { text: '√7056', answer: 84 },
  { text: '156 ÷ 12', answer: 13 },
  { text: '999 ÷ 27', answer: 37 },
  { text: '729 ÷ 27', answer: 27 },
  { text: '1024 ÷ 16', answer: 64 },
  { text: '2520 ÷ 36', answer: 70 },
  { text: '33% of 900', answer: 297 },
  { text: '12.5% of 1600', answer: 200 },
  { text: '8% of 3750', answer: 300 },
  { text: '45% of 680', answer: 306 },
  { text: '2.5% of 8000', answer: 200 },
  { text: '19²', answer: 361 },
  { text: '42²', answer: 1764 },
  { text: '25²', answer: 625 },
  { text: '13 × 14', answer: 182 },
  { text: '16 × 37', answer: 592 },
  { text: '2.5 × 3.6', answer: 9 },
  { text: '1.4 × 7.5', answer: 10.5 },
  { text: '0.8 × 1250', answer: 1000 },
  { text: '3.14 × 100', answer: 314 },
  { text: '½ of 999', answer: 499.5 },
  { text: '⅓ of 2700', answer: 900 },
  { text: '⅛ of 4000', answer: 500 },
  { text: '360 ÷ 15', answer: 24 },
  { text: '450 ÷ 18', answer: 25 },
  { text: '91 × 11', answer: 1001 },
];

// ── Tier 3: Hard — multi-step mental arithmetic ─────────────────────────────
const tier3 = [
  { text: '2⁸ + 2⁴', answer: 272 },
  { text: '999 ÷ 37', answer: 27 },
  { text: '67 × 34', answer: 2278 },
  { text: '84 × 56', answer: 4704 },
  { text: '73 × 27', answer: 1971 },
  { text: '38 × 62', answer: 2356 },
  { text: '64²', answer: 4096 },
  { text: '99 × 99', answer: 9801 },
  { text: '7.5% of 2400', answer: 180 },
  { text: '17.5% of 1200', answer: 210 },
  { text: '65% of 520', answer: 338 },
  { text: '125% of 480', answer: 600 },
  { text: '2¹⁰', answer: 1024 },
  { text: '3⁵', answer: 243 },
  { text: '5⁴', answer: 625 },
  { text: '7³', answer: 343 },
  { text: '4⁴', answer: 256 },
  { text: '9³', answer: 729 },
  { text: '11³', answer: 1331 },
  { text: '6³ + 6²', answer: 252 },
  { text: '1000 ÷ 7 (nearest integer)', answer: 143 },
  { text: '8888 ÷ 44', answer: 202 },
  { text: '3600 ÷ 48', answer: 75 },
  { text: '2¹² ÷ 2⁴', answer: 256 },
  { text: '7! ÷ 6!', answer: 7 },
  { text: '12! ÷ 11!', answer: 12 },
  { text: '144 ÷ 0.12', answer: 1200 },
  { text: '1 ÷ 0.04', answer: 25 },
  { text: '1000 × 0.035', answer: 35 },
  { text: '250 × 0.4 × 0.1', answer: 10 },
  { text: '22 ÷ 7 (to 1 d.p.)', answer: 3.1 },
  { text: '48 × 52', answer: 2496 },
  { text: '77 × 13', answer: 1001 },
  { text: '63 × 37', answer: 2331 },
  { text: '86 × 14', answer: 1204 },
  { text: '95 × 95', answer: 9025 },
  { text: '125 × 32', answer: 4000 },
  { text: '√7921', answer: 89 },
  { text: '√9409', answer: 97 },
  { text: '78²', answer: 6084 },
];

// ── Tier 4: Brutal — chain operations, multi-step reasoning ─────────────────
const tier4 = [
  { text: '√(52000 × 16)', answer: 912 },
  { text: '75² − 74²', answer: 149 },
  { text: '100³ ÷ 100²', answer: 100 },
  { text: '(48 × 25) + (52 × 25)', answer: 2500 },
  { text: '999 × 999 ÷ 999', answer: 999 },
  { text: '17³', answer: 4913 },
  { text: '13⁴', answer: 28561 },
  { text: '√(144 × 225)', answer: 180 },
  { text: '(2⁸ × 2⁴) ÷ 2⁶', answer: 64 },
  { text: '15% of (200 × 30)', answer: 900 },
  { text: '(99 × 101)', answer: 9999 },
  { text: '47² − 43²', answer: 360 },
  { text: '(3.14 × 25²) (nearest integer)', answer: 1963 },
  { text: '√(10000 − 3600)', answer: 80 },
  { text: '1 ÷ 0.007 (nearest integer)', answer: 143 },
  { text: '(⅔ × 450) + (¼ × 360)', answer: 390 },
  { text: '88 × 88 − 12 × 12', answer: 7600 },
  { text: '(17 × 17) + (17 × 3)', answer: 340 },
  { text: '2⁵ × 3²', answer: 288 },
  { text: '√(81 × 49 × 4)', answer: 126 },
  { text: '(250 ÷ 0.5) × 0.1', answer: 50 },
  { text: '(15² + 20²) (then √)', answer: 25 },
  { text: '0.75 × 0.75 × 10000', answer: 5625 },
  { text: '(11¹¹ ÷ 11⁹)', answer: 121 },
  { text: '33.33% of 33.33% of 900', answer: 100 },
  { text: '(64 × 125) ÷ 1000', answer: 8 },
  { text: '7⁴ ÷ 7²', answer: 49 },
  { text: '(45 × 44) ÷ 2', answer: 990 },
  { text: '√(625 × 64)', answer: 200 },
  { text: '(999 − 1) × (999 + 1) ÷ 999 (nearest integer)', answer: 999 },
  { text: '(2.718 × 1000) (nearest integer)', answer: 2718 },
  { text: '(3⁶ ÷ 3²)', answer: 81 },
  { text: '14² + 48²  (then √)', answer: 50 },
  { text: '(0.125 × 888)', answer: 111 },
  { text: '17 × 23 × 2', answer: 782 },
  { text: '(256 × 3) + (256 × 7)', answer: 2560 },
  { text: '(80² − 79²) × 3', answer: 477 },
  { text: '60% of 60% of 1000', answer: 360 },
  { text: '(1111 × 9) + 2', answer: 10001 },
  { text: '√(12² + 16²) × 10', answer: 200 },
];

export const questions = { tier1, tier2, tier3, tier4 };

export const QUESTIONS_PER_SESSION = 10;
export const TIME_LIMIT_MS = 60000; // 60 seconds per question

/**
 * Select questions for a session: 3 from tier 1, 3 from tier 2, 3 from tier 3, 1 from tier 4.
 * Returns a flat array of 10 questions in order.
 */
export function selectQuestions() {
  const pick = (arr, n) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  };

  return [
    ...pick(tier1, 3),
    ...pick(tier2, 3),
    ...pick(tier3, 3),
    ...pick(tier4, 1),
  ];
}

/**
 * Evaluate a player's answer.
 *
 * Accuracy: 100 × (1 - pctError)²  (smooth curve, 0-100)
 * Speed multiplier: 1.0x at 60s → 1.3x at 0s (linear)
 * Final = accuracy × multiplier
 *
 * @param {Object} question - The question object (with answer)
 * @param {string|number} answer - Player's submitted answer
 * @param {number} [elapsedMs] - Time taken in milliseconds
 * @returns {{ correct: boolean, points: number, accuracy: number, multiplier: number }}
 */
export function evaluator(question, answer, elapsedMs) {
  const playerAnswer = parseFloat(answer);
  if (isNaN(playerAnswer)) return { correct: false, points: 0, accuracy: 0, multiplier: 1 };

  const exact = question.answer;
  const diff = Math.abs(playerAnswer - exact);
  const pctError = exact === 0 ? (diff > 0 ? 1 : 0) : diff / Math.abs(exact);

  // Accuracy: 100 × (1 - pctError)², clamped to 0-100
  const rawAccuracy = 100 * Math.pow(Math.max(0, 1 - pctError), 2);
  const accuracy = Math.round(Math.min(100, rawAccuracy));

  // Speed multiplier: 1.3x at 0s, linear decay to 1.0x at 60s
  let multiplier = 1.0;
  if (elapsedMs !== undefined) {
    const seconds = Math.min(60, Math.max(0, elapsedMs / 1000));
    multiplier = 1.3 - (0.3 * seconds / 60);
  }

  const points = Math.round(accuracy * multiplier);
  const correct = pctError <= 0.1; // within 10% counts as "correct"

  return { correct, points, accuracy, multiplier: Math.round(multiplier * 100) / 100 };
}
