// Sequence Solver — server-side game module
// 20 questions per session from 155+ questions across 3 difficulty tiers.
// ANSWERS NEVER LEAVE THIS FILE.

export const GAME_ID = 'sequence-solver';
export const QUESTIONS_PER_SESSION = 20;

// ── Scoring ────────────────────────────────────────────────────────────────────
// 100 points base × time decay multiplier per correct answer. Wrong = 0.
// Time multiplier: 1 / (1 + 0.15 × ln(1 + seconds))
// No hard time limit per question.

export function evaluator(question, answer, elapsedMs) {
  const normalised = (typeof answer === 'string') ? answer.trim() : '';
  const correct = normalised === question.answer;

  if (!correct) return { correct: false, points: 0 };

  const seconds = Math.max(0, elapsedMs / 1000);
  const multiplier = 1 / (1 + 0.15 * Math.log(1 + seconds));
  const points = Math.round(100 * multiplier);

  return { correct: true, points };
}

// ── Question bank ──────────────────────────────────────────────────────────────

// Tier 1 — KS3: arithmetic sequences, basic geometric, counting patterns (56 questions)
const tier1 = [
  // Simple add-constant
  { text: 'Find the next term: 2, 5, 8, 11, ...', answer: '14', type: 'mc', options: ['12', '14', '15', '17'], tier: 1 },
  { text: 'Find the next term: 3, 7, 11, 15, ...', answer: '19', type: 'mc', options: ['17', '18', '19', '21'], tier: 1 },
  { text: 'Find the next term: 4, 9, 14, 19, ...', answer: '24', type: 'mc', options: ['22', '23', '24', '25'], tier: 1 },
  { text: 'Find the next term: 5, 10, 15, 20, ...', answer: '25', type: 'mc', options: ['22', '25', '30', '24'], tier: 1 },
  { text: 'Find the next term: 1, 4, 7, 10, ...', answer: '13', type: 'mc', options: ['11', '12', '13', '14'], tier: 1 },
  { text: 'Find the next term: 6, 11, 16, 21, ...', answer: '26', type: 'mc', options: ['24', '25', '26', '27'], tier: 1 },
  { text: 'Find the next term: 10, 17, 24, 31, ...', answer: '38', type: 'mc', options: ['36', '37', '38', '40'], tier: 1 },
  { text: 'Find the next term: 7, 14, 21, 28, ...', answer: '35', type: 'mc', options: ['32', '34', '35', '42'], tier: 1 },
  { text: 'Find the next term: 8, 13, 18, 23, ...', answer: '28', type: 'mc', options: ['26', '27', '28', '29'], tier: 1 },
  { text: 'Find the next term: 100, 91, 82, 73, ...', answer: '64', type: 'mc', options: ['62', '63', '64', '65'], tier: 1 },
  // Subtract-constant
  { text: 'Find the next term: 50, 45, 40, 35, ...', answer: '30', type: 'mc', options: ['25', '28', '30', '32'], tier: 1 },
  { text: 'Find the next term: 30, 26, 22, 18, ...', answer: '14', type: 'mc', options: ['12', '14', '15', '16'], tier: 1 },
  { text: 'Find the next term: 20, 17, 14, 11, ...', answer: '8', type: 'mc', options: ['6', '7', '8', '9'], tier: 1 },
  { text: 'Find the next term: 40, 33, 26, 19, ...', answer: '12', type: 'mc', options: ['10', '11', '12', '13'], tier: 1 },
  { text: 'Find the next term: 60, 52, 44, 36, ...', answer: '28', type: 'mc', options: ['26', '28', '30', '32'], tier: 1 },
  // Multiply-constant (geometric)
  { text: 'Find the next term: 3, 6, 12, 24, ...', answer: '48', type: 'mc', options: ['30', '36', '48', '96'], tier: 1 },
  { text: 'Find the next term: 2, 6, 18, 54, ...', answer: '162', type: 'mc', options: ['108', '162', '216', '72'], tier: 1 },
  { text: 'Find the next term: 5, 10, 20, 40, ...', answer: '80', type: 'mc', options: ['60', '70', '80', '100'], tier: 1 },
  { text: 'Find the next term: 1, 3, 9, 27, ...', answer: '81', type: 'mc', options: ['54', '63', '72', '81'], tier: 1 },
  { text: 'Find the next term: 4, 12, 36, 108, ...', answer: '324', type: 'mc', options: ['216', '288', '324', '432'], tier: 1 },
  { text: 'Find the next term: 2, 10, 50, 250, ...', answer: '1250', type: 'mc', options: ['500', '750', '1000', '1250'], tier: 1 },
  // Squares
  { text: 'Find the next term: 1, 4, 9, 16, ...', answer: '25', type: 'mc', options: ['20', '24', '25', '36'], tier: 1 },
  { text: 'Find the next term: 4, 9, 16, 25, ...', answer: '36', type: 'mc', options: ['30', '32', '35', '36'], tier: 1 },
  { text: 'Find the next term: 9, 16, 25, 36, ...', answer: '49', type: 'mc', options: ['42', '45', '48', '49'], tier: 1 },
  { text: 'Find the next term: 16, 25, 36, 49, ...', answer: '64', type: 'mc', options: ['56', '60', '62', '64'], tier: 1 },
  // Cubes
  { text: 'Find the next term: 1, 8, 27, 64, ...', answer: '125', type: 'mc', options: ['100', '112', '125', '128'], tier: 1 },
  { text: 'Find the next term: 8, 27, 64, 125, ...', answer: '216', type: 'mc', options: ['196', '200', '216', '256'], tier: 1 },
  // Fibonacci
  { text: 'Find the next term: 1, 1, 2, 3, 5, 8, ...', answer: '13', type: 'mc', options: ['10', '11', '12', '13'], tier: 1 },
  { text: 'Find the next term: 1, 1, 2, 3, 5, 8, 13, ...', answer: '21', type: 'mc', options: ['18', '19', '20', '21'], tier: 1 },
  { text: 'Find the next term: 2, 2, 4, 6, 10, 16, ...', answer: '26', type: 'mc', options: ['22', '24', '26', '32'], tier: 1 },
  // Triangle numbers
  { text: 'Find the next term: 1, 3, 6, 10, ...', answer: '15', type: 'mc', options: ['12', '13', '14', '15'], tier: 1 },
  { text: 'Find the next term: 1, 3, 6, 10, 15, ...', answer: '21', type: 'mc', options: ['18', '20', '21', '25'], tier: 1 },
  { text: 'Find the next term: 3, 6, 10, 15, 21, ...', answer: '28', type: 'mc', options: ['24', '26', '27', '28'], tier: 1 },
  // Powers of 2
  { text: 'Find the next term: 1, 2, 4, 8, 16, ...', answer: '32', type: 'mc', options: ['24', '28', '30', '32'], tier: 1 },
  { text: 'Find the next term: 2, 4, 8, 16, 32, ...', answer: '64', type: 'mc', options: ['48', '56', '60', '64'], tier: 1 },
  { text: 'Find the next term: 4, 8, 16, 32, 64, ...', answer: '128', type: 'mc', options: ['96', '112', '128', '256'], tier: 1 },
  // Powers of 3
  { text: 'Find the next term: 1, 3, 9, 27, 81, ...', answer: '243', type: 'mc', options: ['162', '189', '243', '324'], tier: 1 },
  // Doubling from odd start
  { text: 'Find the next term: 3, 6, 12, 24, 48, ...', answer: '96', type: 'mc', options: ['72', '84', '96', '144'], tier: 1 },
  { text: 'Find the next term: 7, 14, 28, 56, ...', answer: '112', type: 'mc', options: ['84', '98', '112', '168'], tier: 1 },
  // Even numbers
  { text: 'Find the next term: 2, 4, 6, 8, 10, ...', answer: '12', type: 'mc', options: ['11', '12', '14', '16'], tier: 1 },
  // Odd numbers
  { text: 'Find the next term: 1, 3, 5, 7, 9, ...', answer: '11', type: 'mc', options: ['10', '11', '12', '13'], tier: 1 },
  // Multiples of 3
  { text: 'Find the next term: 3, 6, 9, 12, 15, ...', answer: '18', type: 'mc', options: ['16', '17', '18', '21'], tier: 1 },
  // Multiples of 4
  { text: 'Find the next term: 4, 8, 12, 16, 20, ...', answer: '24', type: 'mc', options: ['22', '24', '26', '28'], tier: 1 },
  // Multiples of 6
  { text: 'Find the next term: 6, 12, 18, 24, ...', answer: '30', type: 'mc', options: ['28', '30', '32', '36'], tier: 1 },
  // Multiples of 9
  { text: 'Find the next term: 9, 18, 27, 36, ...', answer: '45', type: 'mc', options: ['40', '42', '45', '54'], tier: 1 },
  // Halving
  { text: 'Find the next term: 64, 32, 16, 8, ...', answer: '4', type: 'mc', options: ['2', '4', '6', '0'], tier: 1 },
  { text: 'Find the next term: 80, 40, 20, 10, ...', answer: '5', type: 'mc', options: ['2', '4', '5', '8'], tier: 1 },
  // Add increasing
  { text: 'Find the next term: 1, 2, 4, 7, 11, ...', answer: '16', type: 'mc', options: ['14', '15', '16', '17'], tier: 1 },
  { text: 'Find the next term: 2, 3, 5, 8, 12, ...', answer: '17', type: 'mc', options: ['15', '16', '17', '18'], tier: 1 },
  // Primes
  { text: 'Find the next term: 2, 3, 5, 7, 11, ...', answer: '13', type: 'mc', options: ['12', '13', '14', '15'], tier: 1 },
  { text: 'Find the next term: 2, 3, 5, 7, 11, 13, ...', answer: '17', type: 'mc', options: ['15', '16', '17', '19'], tier: 1 },
  // Simple patterns
  { text: 'Find the next term: 10, 20, 30, 40, ...', answer: '50', type: 'mc', options: ['45', '50', '55', '60'], tier: 1 },
  { text: 'Find the next term: 100, 200, 300, 400, ...', answer: '500', type: 'mc', options: ['450', '500', '550', '600'], tier: 1 },
  { text: 'Find the next term: 11, 22, 33, 44, ...', answer: '55', type: 'mc', options: ['50', '52', '55', '66'], tier: 1 },
  { text: 'Find the next term: 12, 23, 34, 45, ...', answer: '56', type: 'mc', options: ['54', '55', '56', '57'], tier: 1 },
  { text: 'Find the next term: 15, 25, 35, 45, ...', answer: '55', type: 'mc', options: ['50', '55', '60', '65'], tier: 1 },
];

// Tier 2 — GCSE: nth term, quadratic sequences, negative terms (55 questions)
const tier2 = [
  // Quadratic sequences (second difference constant)
  { text: 'Find the next term: 3, 8, 15, 24, ...', answer: '35', type: 'mc', options: ['30', '33', '35', '36'], tier: 2 },
  { text: 'Find the next term: 2, 6, 12, 20, ...', answer: '30', type: 'mc', options: ['26', '28', '30', '32'], tier: 2 },
  { text: 'Find the next term: 1, 4, 10, 19, ...', answer: '31', type: 'mc', options: ['27', '29', '31', '34'], tier: 2 },
  { text: 'Find the next term: 0, 3, 8, 15, 24, ...', answer: '35', type: 'mc', options: ['30', '33', '35', '36'], tier: 2 },
  { text: 'Find the next term: 2, 5, 10, 17, 26, ...', answer: '37', type: 'mc', options: ['33', '35', '37', '40'], tier: 2 },
  { text: 'Find the next term: 4, 7, 12, 19, 28, ...', answer: '39', type: 'mc', options: ['35', '37', '39', '42'], tier: 2 },
  { text: 'Find the next term: 5, 12, 21, 32, ...', answer: '45', type: 'mc', options: ['40', '42', '45', '48'], tier: 2 },
  { text: 'Find the next term: 1, 6, 15, 28, ...', answer: '45', type: 'mc', options: ['38', '41', '45', '50'], tier: 2 },
  { text: 'Find the next term: 3, 10, 21, 36, ...', answer: '55', type: 'mc', options: ['48', '51', '55', '60'], tier: 2 },
  { text: 'Find the next term: 6, 11, 18, 27, 38, ...', answer: '51', type: 'mc', options: ['47', '49', '51', '54'], tier: 2 },
  // Negative start, positive common difference
  { text: 'Find the next term: -5, -2, 1, 4, ...', answer: '7', type: 'mc', options: ['5', '6', '7', '8'], tier: 2 },
  { text: 'Find the next term: -10, -6, -2, 2, ...', answer: '6', type: 'mc', options: ['4', '5', '6', '8'], tier: 2 },
  { text: 'Find the next term: -8, -3, 2, 7, ...', answer: '12', type: 'mc', options: ['10', '11', '12', '14'], tier: 2 },
  { text: 'Find the next term: -12, -7, -2, 3, ...', answer: '8', type: 'mc', options: ['6', '7', '8', '10'], tier: 2 },
  { text: 'Find the next term: -20, -14, -8, -2, ...', answer: '4', type: 'mc', options: ['2', '3', '4', '6'], tier: 2 },
  // Negative common difference
  { text: 'Find the next term: 15, 11, 7, 3, ...', answer: '-1', type: 'mc', options: ['-3', '-1', '0', '1'], tier: 2 },
  { text: 'Find the next term: 20, 13, 6, -1, ...', answer: '-8', type: 'mc', options: ['-10', '-8', '-6', '-4'], tier: 2 },
  { text: 'Find the next term: 10, 4, -2, -8, ...', answer: '-14', type: 'mc', options: ['-16', '-14', '-12', '-10'], tier: 2 },
  // n(n+1) and variants
  { text: 'Find the next term: 2, 6, 12, 20, 30, ...', answer: '42', type: 'mc', options: ['36', '38', '40', '42'], tier: 2 },
  { text: 'Find the next term: 6, 12, 20, 30, 42, ...', answer: '56', type: 'mc', options: ['48', '52', '54', '56'], tier: 2 },
  // n² + n
  { text: 'Find the next term: 2, 6, 12, 20, 30, 42, ...', answer: '56', type: 'mc', options: ['48', '52', '54', '56'], tier: 2 },
  // n² - 1
  { text: 'Find the next term: 0, 3, 8, 15, 24, 35, ...', answer: '48', type: 'mc', options: ['42', '45', '48', '50'], tier: 2 },
  // 2n²
  { text: 'Find the next term: 2, 8, 18, 32, ...', answer: '50', type: 'mc', options: ['42', '46', '50', '54'], tier: 2 },
  { text: 'Find the next term: 8, 18, 32, 50, ...', answer: '72', type: 'mc', options: ['64', '68', '72', '78'], tier: 2 },
  // Alternating signs
  { text: 'Find the next term: 1, -2, 4, -8, ...', answer: '16', type: 'mc', options: ['-16', '-12', '12', '16'], tier: 2 },
  { text: 'Find the next term: -1, 3, -9, 27, ...', answer: '-81', type: 'mc', options: ['-81', '-54', '54', '81'], tier: 2 },
  { text: 'Find the next term: 2, -4, 8, -16, ...', answer: '32', type: 'mc', options: ['-32', '-24', '24', '32'], tier: 2 },
  { text: 'Find the next term: 1, -1, 1, -1, ...', answer: '1', type: 'mc', options: ['-2', '-1', '0', '1'], tier: 2 },
  // Fractional common difference
  { text: 'Find the next term: 1, 1.5, 2, 2.5, ...', answer: '3', type: 'mc', options: ['2.75', '3', '3.25', '3.5'], tier: 2 },
  { text: 'Find the next term: 0.5, 1, 1.5, 2, 2.5, ...', answer: '3', type: 'mc', options: ['2.75', '3', '3.25', '3.5'], tier: 2 },
  { text: 'Find the next term: 0.1, 0.4, 0.7, 1.0, ...', answer: '1.3', type: 'mc', options: ['1.1', '1.2', '1.3', '1.4'], tier: 2 },
  // Pentagonal numbers
  { text: 'Find the next term: 1, 5, 12, 22, 35, ...', answer: '51', type: 'mc', options: ['45', '48', '51', '55'], tier: 2 },
  // Hexagonal numbers
  { text: 'Find the next term: 1, 6, 15, 28, 45, ...', answer: '66', type: 'mc', options: ['55', '60', '66', '72'], tier: 2 },
  // n² + 1
  { text: 'Find the next term: 2, 5, 10, 17, 26, 37, ...', answer: '50', type: 'mc', options: ['46', '48', '50', '52'], tier: 2 },
  // 2n + 1
  { text: 'Find the next term: 3, 5, 7, 9, 11, 13, ...', answer: '15', type: 'mc', options: ['14', '15', '16', '17'], tier: 2 },
  // 3n - 1
  { text: 'Find the next term: 2, 5, 8, 11, 14, 17, ...', answer: '20', type: 'mc', options: ['18', '19', '20', '21'], tier: 2 },
  // n³ sequence
  { text: 'Find the next term: 1, 8, 27, 64, 125, ...', answer: '216', type: 'mc', options: ['196', '200', '216', '250'], tier: 2 },
  // Triangular + constant
  { text: 'Find the next term: 2, 4, 7, 11, 16, ...', answer: '22', type: 'mc', options: ['20', '21', '22', '23'], tier: 2 },
  { text: 'Find the next term: 3, 5, 8, 12, 17, 23, ...', answer: '30', type: 'mc', options: ['27', '28', '30', '32'], tier: 2 },
  // Geometric with r=4
  { text: 'Find the next term: 1, 4, 16, 64, ...', answer: '256', type: 'mc', options: ['128', '192', '256', '512'], tier: 2 },
  // Geometric with r=5
  { text: 'Find the next term: 3, 12, 48, 192, ...', answer: '768', type: 'mc', options: ['384', '576', '768', '960'], tier: 2 },
  // Multiply and add
  { text: 'Find the next term: 1, 5, 13, 29, 61, ...', answer: '125', type: 'mc', options: ['93', '109', '122', '125'], tier: 2 },
  { text: 'Find the next term: 2, 5, 11, 23, 47, ...', answer: '95', type: 'mc', options: ['71', '83', '94', '95'], tier: 2 },
  { text: 'Find the next term: 1, 4, 13, 40, ...', answer: '121', type: 'mc', options: ['80', '100', '121', '160'], tier: 2 },
  // Square root integers
  { text: 'Find the next term: 1, 4, 9, 16, 25, 36, ...', answer: '49', type: 'mc', options: ['42', '45', '48', '49'], tier: 2 },
  // Powers of 10
  { text: 'Find the next term: 1, 10, 100, 1000, ...', answer: '10000', type: 'mc', options: ['5000', '8000', '10000', '100000'], tier: 2 },
  // Catalan-like
  { text: 'Find the next term: 1, 2, 5, 14, ...', answer: '42', type: 'mc', options: ['28', '35', '42', '56'], tier: 2 },
  // Tetrahedral numbers
  { text: 'Find the next term: 1, 4, 10, 20, 35, ...', answer: '56', type: 'mc', options: ['48', '50', '56', '60'], tier: 2 },
  // Mixed second difference
  { text: 'Find the next term: 1, 3, 7, 13, 21, ...', answer: '31', type: 'mc', options: ['27', '29', '31', '33'], tier: 2 },
  { text: 'Find the next term: 2, 4, 8, 14, 22, ...', answer: '32', type: 'mc', options: ['28', '30', '32', '36'], tier: 2 },
  // Subtract then add pattern
  { text: 'Find the next term: 1, 3, 2, 4, 3, 5, ...', answer: '4', type: 'mc', options: ['3', '4', '5', '6'], tier: 2 },
  // n(n+2)
  { text: 'Find the next term: 3, 8, 15, 24, 35, ...', answer: '48', type: 'mc', options: ['42', '45', '48', '50'], tier: 2 },
  // (n+1)² - n
  { text: 'Find the next term: 3, 7, 13, 21, 31, ...', answer: '43', type: 'mc', options: ['39', '41', '43', '45'], tier: 2 },
  // Interleaved arithmetic
  { text: 'Find the next term: 1, 10, 2, 20, 3, 30, ...', answer: '4', type: 'mc', options: ['4', '31', '40', '33'], tier: 2 },
  { text: 'Find the next term: 1, 10, 2, 20, 3, 30, 4, ...', answer: '40', type: 'mc', options: ['5', '35', '40', '44'], tier: 2 },
];

// Tier 3 — A-Level: GP formulae, convergence, recurrence, sigma notation (55 questions)
const tier3 = [
  // GP with fractional ratio
  { text: 'Find the next term: 1, 1/2, 1/4, 1/8, ...', answer: '1/16', type: 'mc', options: ['1/10', '1/12', '1/16', '1/32'], tier: 3 },
  { text: 'Find the next term: 1, 1/3, 1/9, 1/27, ...', answer: '1/81', type: 'mc', options: ['1/36', '1/54', '1/81', '1/243'], tier: 3 },
  { text: 'Find the next term: 2, 1, 1/2, 1/4, ...', answer: '1/8', type: 'mc', options: ['1/6', '1/8', '1/10', '1/16'], tier: 3 },
  { text: 'Find the next term: 8, 4, 2, 1, 1/2, ...', answer: '1/4', type: 'mc', options: ['1/3', '1/4', '1/6', '1/8'], tier: 3 },
  { text: 'Find the next term: 3, 3/4, 3/16, 3/64, ...', answer: '3/256', type: 'mc', options: ['3/128', '3/192', '3/256', '3/512'], tier: 3 },
  { text: 'Find the next term: 16, 8, 4, 2, 1, ...', answer: '1/2', type: 'mc', options: ['0', '1/4', '1/2', '1/3'], tier: 3 },
  { text: 'Find the next term: 81, 27, 9, 3, ...', answer: '1', type: 'mc', options: ['0', '1', '1/3', '3/2'], tier: 3 },
  // GP with negative ratio
  { text: 'Find the next term: 2, -6, 18, -54, ...', answer: '162', type: 'mc', options: ['-162', '108', '162', '-108'], tier: 3 },
  { text: 'Find the next term: 1, -2, 4, -8, 16, ...', answer: '-32', type: 'mc', options: ['-32', '-24', '24', '32'], tier: 3 },
  { text: 'Find the next term: -3, 6, -12, 24, ...', answer: '-48', type: 'mc', options: ['-48', '-36', '36', '48'], tier: 3 },
  { text: 'Find the next term: 5, -10, 20, -40, ...', answer: '80', type: 'mc', options: ['-80', '-60', '60', '80'], tier: 3 },
  { text: 'Find the next term: -1, 4, -16, 64, ...', answer: '-256', type: 'mc', options: ['-256', '-128', '128', '256'], tier: 3 },
  // 2^n - 1
  { text: 'Find the next term: 1, 3, 7, 15, 31, ...', answer: '63', type: 'mc', options: ['47', '55', '62', '63'], tier: 3 },
  // 2^n + 1
  { text: 'Find the next term: 3, 5, 9, 17, 33, ...', answer: '65', type: 'mc', options: ['49', '57', '64', '65'], tier: 3 },
  // n!
  { text: 'Find the next term: 1, 1, 2, 6, 24, 120, ...', answer: '720', type: 'mc', options: ['240', '360', '480', '720'], tier: 3 },
  { text: 'Find the next term: 1, 2, 6, 24, 120, 720, ...', answer: '5040', type: 'mc', options: ['1440', '2880', '3600', '5040'], tier: 3 },
  // n!/n (derangement-related)
  { text: 'Find the next term: 1, 1, 2, 6, 24, ...', answer: '120', type: 'mc', options: ['48', '72', '96', '120'], tier: 3 },
  // 1/n!
  { text: 'Find the next term: 1, 1, 1/2, 1/6, 1/24, ...', answer: '1/120', type: 'mc', options: ['1/48', '1/72', '1/120', '1/720'], tier: 3 },
  // Sum of first n natural numbers (triangular)
  { text: 'The sum of the first n natural numbers gives: 1, 3, 6, 10, 15, 21, 28, ...', answer: '36', type: 'mc', options: ['32', '34', '36', '40'], tier: 3 },
  // Sum of first n squares
  { text: 'Find the next term: 1, 5, 14, 30, 55, ...', answer: '91', type: 'mc', options: ['70', '80', '85', '91'], tier: 3 },
  // Recurrence: a(n) = 2a(n-1) + 1
  { text: 'If a₁ = 1 and aₙ = 2aₙ₋₁ + 1, find a₅. Sequence: 1, 3, 7, 15, ...', answer: '31', type: 'mc', options: ['23', '27', '30', '31'], tier: 3 },
  // Recurrence: a(n) = a(n-1) + a(n-2)  (generalised Fibonacci)
  { text: 'If a₁ = 2, a₂ = 5, aₙ = aₙ₋₁ + aₙ₋₂, find a₆. Sequence: 2, 5, 7, 12, 19, ...', answer: '31', type: 'mc', options: ['24', '26', '31', '38'], tier: 3 },
  { text: 'If a₁ = 3, a₂ = 4, aₙ = aₙ₋₁ + aₙ₋₂, find a₆. Sequence: 3, 4, 7, 11, 18, ...', answer: '29', type: 'mc', options: ['22', '25', '29', '36'], tier: 3 },
  // Recurrence: a(n) = 3a(n-1) - 2
  { text: 'If a₁ = 1 and aₙ = 3aₙ₋₁ - 2, find a₅. Sequence: 1, 1, 1, 1, ...', answer: '1', type: 'mc', options: ['-1', '0', '1', '3'], tier: 3 },
  // Recurrence: a(n) = a(n-1)²
  { text: 'If a₁ = 2 and aₙ = (aₙ₋₁)², find a₄. Sequence: 2, 4, 16, ...', answer: '256', type: 'mc', options: ['64', '128', '256', '512'], tier: 3 },
  // Partial sums of GP
  { text: 'Sum of GP: S = 1 + 2 + 4 + 8 + 16 + 32 = ?', answer: '63', type: 'mc', options: ['48', '56', '63', '64'], tier: 3 },
  { text: 'Sum of GP: S = 1 + 3 + 9 + 27 + 81 = ?', answer: '121', type: 'mc', options: ['100', '111', '120', '121'], tier: 3 },
  { text: 'Sum of GP: S = 2 + 6 + 18 + 54 = ?', answer: '80', type: 'mc', options: ['72', '76', '80', '84'], tier: 3 },
  // Sum to infinity
  { text: 'Sum to infinity: 1 + 1/2 + 1/4 + 1/8 + ... = ?', answer: '2', type: 'mc', options: ['1', '1.5', '2', '4'], tier: 3 },
  { text: 'Sum to infinity: 3 + 1 + 1/3 + 1/9 + ... = ?', answer: '4.5', type: 'mc', options: ['3.5', '4', '4.5', '6'], tier: 3 },
  { text: 'Sum to infinity: 8 + 4 + 2 + 1 + ... = ?', answer: '16', type: 'mc', options: ['12', '14', '15', '16'], tier: 3 },
  { text: 'Sum to infinity: 10 + 5 + 2.5 + 1.25 + ... = ?', answer: '20', type: 'mc', options: ['15', '18', '20', '25'], tier: 3 },
  // Convergence identification
  { text: 'Which GP converges? a = 5, r = ?', answer: '1/3', type: 'mc', options: ['1/3', '1', '2', '3'], tier: 3 },
  { text: 'A GP has first term 4 and sum to infinity 8. What is r?', answer: '1/2', type: 'mc', options: ['1/4', '1/3', '1/2', '2/3'], tier: 3 },
  // n-th term of GP
  { text: 'GP with a = 3, r = 2. Find the 7th term.', answer: '192', type: 'mc', options: ['96', '128', '192', '384'], tier: 3 },
  { text: 'GP with a = 5, r = 3. Find the 5th term.', answer: '405', type: 'mc', options: ['135', '270', '405', '1215'], tier: 3 },
  { text: 'GP with a = 2, r = -2. Find the 6th term.', answer: '-64', type: 'mc', options: ['-64', '-32', '32', '64'], tier: 3 },
  // Sigma notation
  { text: 'Evaluate: Σ(k=1 to 5) k² = ?', answer: '55', type: 'mc', options: ['30', '45', '55', '91'], tier: 3 },
  { text: 'Evaluate: Σ(k=1 to 4) 2k = ?', answer: '20', type: 'mc', options: ['16', '18', '20', '24'], tier: 3 },
  { text: 'Evaluate: Σ(k=1 to 6) k = ?', answer: '21', type: 'mc', options: ['15', '18', '21', '28'], tier: 3 },
  { text: 'Evaluate: Σ(k=0 to 4) 3^k = ?', answer: '121', type: 'mc', options: ['81', '100', '121', '243'], tier: 3 },
  { text: 'Evaluate: Σ(k=1 to 5) (2k - 1) = ?', answer: '25', type: 'mc', options: ['15', '20', '25', '30'], tier: 3 },
  { text: 'Evaluate: Σ(k=1 to 4) k³ = ?', answer: '100', type: 'mc', options: ['64', '81', '100', '120'], tier: 3 },
  { text: 'Evaluate: Σ(k=1 to 3) k! = ?', answer: '9', type: 'mc', options: ['6', '7', '9', '12'], tier: 3 },
  // Power sequences
  { text: 'Find the next term: 1, 4, 27, 256, ...', answer: '3125', type: 'mc', options: ['1024', '1296', '3125', '7776'], tier: 3 },
  // n^n
  { text: 'Find the next term: 1, 4, 27, 256, 3125, ...', answer: '46656', type: 'mc', options: ['15625', '32768', '46656', '65536'], tier: 3 },
  // Harmonic-related
  { text: 'Find the next term (as fraction): 1, 1/2, 1/3, 1/4, 1/5, ...', answer: '1/6', type: 'mc', options: ['1/6', '1/7', '1/8', '1/10'], tier: 3 },
  // Partial sums of 1/2^n
  { text: 'Find the next term: 1/2, 3/4, 7/8, 15/16, ...', answer: '31/32', type: 'mc', options: ['16/17', '29/30', '31/32', '63/64'], tier: 3 },
  // Lucas numbers
  { text: 'Find the next term: 2, 1, 3, 4, 7, 11, ...', answer: '18', type: 'mc', options: ['14', '16', '18', '22'], tier: 3 },
  { text: 'Find the next term: 2, 1, 3, 4, 7, 11, 18, ...', answer: '29', type: 'mc', options: ['25', '27', '29', '36'], tier: 3 },
  // Pell numbers
  { text: 'Find the next term: 0, 1, 2, 5, 12, 29, ...', answer: '70', type: 'mc', options: ['58', '65', '70', '84'], tier: 3 },
  // Compound sequences: n² + 2^n (n=1,2,3,...)
  { text: 'Find the next term: 3, 8, 17, 32, 57, ...', answer: '100', type: 'mc', options: ['82', '89', '100', '114'], tier: 3 },
  // Arithmetic-geometric
  { text: 'Find the next term: 1, 4, 12, 32, 80, ...', answer: '192', type: 'mc', options: ['128', '160', '192', '240'], tier: 3 },
  // Stern-Brocot related
  { text: 'Find the next term: 1, 1, 2, 1, 3, 2, 3, ...', answer: '1', type: 'mc', options: ['1', '2', '3', '4'], tier: 3 },
  // Centered square numbers
  { text: 'Find the next term: 1, 5, 13, 25, 41, ...', answer: '61', type: 'mc', options: ['53', '57', '61', '65'], tier: 3 },
];

// ── All questions combined ─────────────────────────────────────────────────────

const ALL_QUESTIONS = [...tier1, ...tier2, ...tier3];

// ── Shuffle utility (Fisher-Yates) ─────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Question selection ─────────────────────────────────────────────────────────
// 7 from tier 1, 7 from tier 2, 6 from tier 3 = 20 total.
// Questions within each tier are shuffled, then tiers are interleaved
// so difficulty ramps up naturally across the session.

export function selectQuestions() {
  const t1 = shuffle(tier1).slice(0, 7);
  const t2 = shuffle(tier2).slice(0, 7);
  const t3 = shuffle(tier3).slice(0, 6);

  // Interleave: tier1 first, then tier2, then tier3
  return [...t1, ...t2, ...t3];
}
