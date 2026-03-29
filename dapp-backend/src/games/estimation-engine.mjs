/**
 * Estimation Engine — Server-side question bank and evaluator.
 *
 * Players see a mental arithmetic question and must estimate the answer.
 * Score based on accuracy: closer = more points.
 *
 * ANSWERS NEVER LEAVE THIS FILE. Client only sees the question text.
 */

export const GAME_ID = 'estimation-engine';

export const questions = [
  { text: '47 × 23', answer: 1081, type: 'fill', tolerance: 0.1 },
  { text: '156 ÷ 12', answer: 13, type: 'fill', tolerance: 0.15 },
  { text: '√2025', answer: 45, type: 'fill', tolerance: 0.05 },
  { text: '88 × 12', answer: 1056, type: 'fill', tolerance: 0.1 },
  { text: '999 ÷ 37', answer: 27, type: 'fill', tolerance: 0.15 },
  { text: '64² (64 squared)', answer: 4096, type: 'fill', tolerance: 0.1 },
  { text: '15% of 840', answer: 126, type: 'fill', tolerance: 0.1 },
  { text: '2.5 × 3.6', answer: 9, type: 'fill', tolerance: 0.1 },
  { text: '7! ÷ 6!', answer: 7, type: 'fill', tolerance: 0.01 },
  { text: '1000 ÷ 7 (nearest integer)', answer: 143, type: 'fill', tolerance: 0.05 },
  { text: '33 × 33', answer: 1089, type: 'fill', tolerance: 0.1 },
  { text: '√1764', answer: 42, type: 'fill', tolerance: 0.05 },
  { text: '17 × 19', answer: 323, type: 'fill', tolerance: 0.1 },
  { text: '2^10', answer: 1024, type: 'fill', tolerance: 0.05 },
  { text: '360 ÷ 15', answer: 24, type: 'fill', tolerance: 0.1 },
  { text: '125% of 480', answer: 600, type: 'fill', tolerance: 0.1 },
  { text: '13 × 14', answer: 182, type: 'fill', tolerance: 0.1 },
  { text: '2^8 + 2^4', answer: 272, type: 'fill', tolerance: 0.05 },
  { text: '450 ÷ 18', answer: 25, type: 'fill', tolerance: 0.1 },
  { text: '99 × 99', answer: 9801, type: 'fill', tolerance: 0.05 },
];

/**
 * Evaluate a player's answer.
 * @param {Object} question - The question object (with answer)
 * @param {string|number} answer - Player's submitted answer
 * @returns {{ correct: boolean, points: number }}
 */
export function evaluator(question, answer) {
  const playerAnswer = parseFloat(answer);
  if (isNaN(playerAnswer)) return { correct: false, points: 0 };

  const exact = question.answer;
  const tolerance = question.tolerance || 0.1;
  const diff = Math.abs(playerAnswer - exact);
  const pctOff = diff / Math.abs(exact);

  // Scoring: 10 points for exact, scaled down by accuracy
  if (diff === 0) return { correct: true, points: 10 };
  if (pctOff <= 0.01) return { correct: true, points: 9 };
  if (pctOff <= 0.05) return { correct: true, points: 7 };
  if (pctOff <= tolerance) return { correct: true, points: 5 };
  if (pctOff <= tolerance * 2) return { correct: false, points: 2 };
  return { correct: false, points: 0 };
}
