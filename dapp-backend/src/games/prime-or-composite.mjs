// Prime or Composite — server-side game module
// Answers never leave this file. Client sees question text and options only.

export const GAME_ID = 'prime-or-composite';
export const QUESTIONS_PER_SESSION = 20;

const TIME_LIMIT_MS = 5000;

// --- Primality testing ---

function isPrime(n) {
  if (n < 2) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

// --- Random number in range [min, max] inclusive ---

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Question generation ---

const TIERS = [
  { start: 1,  end: 5,  min: 10,    max: 99 },
  { start: 6,  end: 10, min: 100,   max: 999 },
  { start: 11, end: 15, min: 1000,  max: 9999 },
  { start: 16, end: 20, min: 10000, max: 99999 },
];

function makeQuestion(min, max) {
  const number = randInt(min, max);
  const answer = isPrime(number) ? 'prime' : 'composite';
  return {
    text: `Is ${number} prime or composite?`,
    answer,
    number,
    type: 'mc',
    options: ['Prime', 'Composite'],
  };
}

export function selectQuestions() {
  const questions = [];
  for (const tier of TIERS) {
    const count = tier.end - tier.start + 1;
    for (let i = 0; i < count; i++) {
      questions.push(makeQuestion(tier.min, tier.max));
    }
  }
  return questions;
}

// --- Scoring ---

export function evaluator(question, answer, elapsedMs) {
  if (elapsedMs > TIME_LIMIT_MS) return { correct: false, points: 0 };

  const normalised = (typeof answer === 'string') ? answer.toLowerCase() : '';
  if (normalised !== question.answer) return { correct: false, points: 0 };

  // Speed multiplier: 1.3 at 0ms, linear decay to 1.0 at 5000ms
  const fraction = Math.min(elapsedMs, TIME_LIMIT_MS) / TIME_LIMIT_MS;
  const multiplier = 1.3 - 0.3 * fraction;
  return { correct: true, points: Math.round(100 * multiplier) };
}
