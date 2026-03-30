/**
 * Countdown Numbers — Server-side puzzle generation, expression validation, and scoring.
 *
 * 5 rounds per session. Each round: 6 numbers drawn from large/small pools,
 * target between 101-999. Player submits a mathematical expression.
 * Server validates expression uses only provided numbers (each at most once),
 * evaluates it with BODMAS, and scores based on proximity to target.
 *
 * Scoring (same system as Estimation Engine):
 *   accuracy = 100 × (1 - |result - target| / target)², clamped 0-100
 *   Exact match (diff === 0) = 100 accuracy
 *   Speed multiplier: flat 1.3x for first 5s, then linear decay to 1.0x at 120s
 *   Points per round = accuracy × multiplier
 *   Max per round = 130 (exact + instant), max per session = 650
 *
 * ANSWERS NEVER LEAVE THIS FILE.
 */

export const GAME_ID = 'countdown-numbers';
export const QUESTIONS_PER_SESSION = 5;

const LARGE_POOL = [25, 50, 75, 100];
const SMALL_POOL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

// ── Number selection ───────────────────────────────────────────────────────

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick 6 numbers: numLarge from the large pool, rest from the small pool.
 * Default: 2 large + 4 small.
 */
function pickNumbers(numLarge = 2) {
  numLarge = Math.max(0, Math.min(4, numLarge));
  const numSmall = 6 - numLarge;
  const large = shuffled(LARGE_POOL).slice(0, numLarge);
  const small = shuffled(SMALL_POOL).slice(0, numSmall);
  return shuffled([...large, ...small]);
}

/**
 * Generate a target between 101 and 999 inclusive.
 */
function pickTarget() {
  return 101 + Math.floor(Math.random() * 899);
}

// ── BODMAS expression parser ───────────────────────────────────────────────

/**
 * Token types: 'number', 'op', 'lparen', 'rparen'
 */
function tokenize(expr) {
  const tokens = [];
  let i = 0;
  const s = expr.replace(/\s+/g, '');

  while (i < s.length) {
    const ch = s[i];

    // Number (integer only — no decimals allowed in Countdown)
    if (ch >= '0' && ch <= '9') {
      // Implied multiplication: ')' followed by number
      if (tokens.length > 0 && tokens[tokens.length - 1].type === 'rparen') {
        tokens.push({ type: 'op', value: '*' });
      }
      let num = '';
      while (i < s.length && s[i] >= '0' && s[i] <= '9') {
        num += s[i];
        i++;
      }
      tokens.push({ type: 'number', value: parseInt(num, 10) });
      // Implied multiplication: number immediately followed by '('
      if (i < s.length && s[i] === '(') {
        tokens.push({ type: 'op', value: '*' });
      }
      continue;
    }

    if (ch === '(') {
      // Implied multiplication: ')(' or number already pushed
      if (tokens.length > 0) {
        const prev = tokens[tokens.length - 1];
        if (prev.type === 'rparen') {
          tokens.push({ type: 'op', value: '*' });
        }
      }
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      // Implied multiplication: ')number' — handled when we read the number next
      // ')(' handled above when we see '('
      continue;
    }

    // Operators: + - * × · / ÷
    if (ch === '+' || ch === '-') {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    if (ch === '*' || ch === '×' || ch === '·') {
      tokens.push({ type: 'op', value: '*' });
      i++;
      continue;
    }
    if (ch === '/' || ch === '÷') {
      tokens.push({ type: 'op', value: '/' });
      i++;
      continue;
    }

    // Unicode multiplication sign (×) is 2 bytes in some encodings
    // Skip unknown characters
    i++;
  }

  return tokens;
}

/**
 * Extract all number literals from the token stream.
 */
function extractNumbers(tokens) {
  return tokens.filter(t => t.type === 'number').map(t => t.value);
}

/**
 * Validate that every number in the expression exists in the provided set,
 * each used at most once. Returns { valid, reason }.
 */
function validateNumbers(usedNumbers, availableNumbers) {
  const pool = [...availableNumbers];
  for (const n of usedNumbers) {
    const idx = pool.indexOf(n);
    if (idx === -1) {
      return { valid: false, reason: `Number ${n} is not available or used too many times` };
    }
    pool.splice(idx, 1);
  }
  return { valid: true };
}

/**
 * Recursive descent parser for BODMAS expressions.
 * Grammar:
 *   expr     → term (('+' | '-') term)*
 *   term     → factor (('*' | '/') factor)*
 *   factor   → '(' expr ')' | NUMBER
 *
 * Division must yield an exact integer at every intermediate step.
 * Returns { value, error }.
 */
function parseExpression(tokens) {
  let pos = 0;

  function peek() {
    return pos < tokens.length ? tokens[pos] : null;
  }

  function consume() {
    return tokens[pos++];
  }

  function parseFactor() {
    const t = peek();
    if (!t) return { error: 'Unexpected end of expression' };

    if (t.type === 'lparen') {
      consume(); // eat '('
      const result = parseExpr();
      if (result.error) return result;
      const closing = peek();
      if (!closing || closing.type !== 'rparen') {
        return { error: 'Missing closing bracket' };
      }
      consume(); // eat ')'
      return result;
    }

    if (t.type === 'number') {
      consume();
      return { value: t.value };
    }

    return { error: `Unexpected token: ${JSON.stringify(t)}` };
  }

  function parseTerm() {
    let result = parseFactor();
    if (result.error) return result;

    while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
      const op = consume().value;
      const right = parseFactor();
      if (right.error) return right;

      if (op === '*') {
        result = { value: result.value * right.value };
      } else {
        // Division must be exact — no fractions
        if (right.value === 0) return { error: 'Division by zero' };
        if (result.value % right.value !== 0) {
          return { error: `Division ${result.value} ÷ ${right.value} does not yield an integer` };
        }
        result = { value: result.value / right.value };
      }
    }

    return result;
  }

  function parseExpr() {
    let result = parseTerm();
    if (result.error) return result;

    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const right = parseTerm();
      if (right.error) return right;

      if (op === '+') {
        result = { value: result.value + right.value };
      } else {
        result = { value: result.value - right.value };
      }
    }

    return result;
  }

  const result = parseExpr();
  if (result.error) return result;

  // Verify all tokens consumed
  if (pos < tokens.length) {
    return { error: `Unexpected token after expression: ${JSON.stringify(tokens[pos])}` };
  }

  return result;
}

/**
 * Evaluate an expression string. Returns { value, error }.
 * Validates that only provided numbers are used (each at most once).
 * Division must be exact at every intermediate step.
 */
function evaluateExpression(expr, availableNumbers) {
  if (!expr || typeof expr !== 'string') {
    return { error: 'Empty or invalid expression' };
  }

  const tokens = tokenize(expr);
  if (tokens.length === 0) {
    return { error: 'Empty expression' };
  }

  // Validate numbers used
  const usedNumbers = extractNumbers(tokens);
  if (usedNumbers.length === 0) {
    return { error: 'Expression contains no numbers' };
  }

  const validation = validateNumbers(usedNumbers, availableNumbers);
  if (!validation.valid) {
    return { error: validation.reason };
  }

  // Parse and evaluate
  const result = parseExpression(tokens);
  return result;
}

// ── Question generation ────────────────────────────────────────────────────

/**
 * Generate a single round: 6 numbers + target.
 */
function generateRound() {
  const numbers = pickNumbers(2);
  const target = pickTarget();
  return {
    type: 'countdown',
    numbers,
    target,
    text: `Make ${target}`
  };
}

/**
 * Select 5 rounds for a session.
 */
export function selectQuestions() {
  const rounds = [];
  for (let i = 0; i < QUESTIONS_PER_SESSION; i++) {
    rounds.push(generateRound());
  }
  return rounds;
}

/**
 * Strip a question for the client — remove nothing secret (there is no
 * pre-computed solution), but format it consistently.
 */
export function stripQuestion(question, index) {
  return {
    num: (typeof index === 'number' ? index : 0) + 1,
    type: 'countdown',
    text: question.text,
    numbers: question.numbers,
    target: question.target
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

/**
 * Evaluate a player's submitted expression for a round.
 *
 * @param {Object} question - { numbers, target, ... }
 * @param {Object} answer - { expression: string }
 * @param {number} [elapsedMs] - Time taken in milliseconds
 * @returns {{ correct: boolean, points: number, accuracy: number, multiplier: number, result: number, target: number }}
 */
export function evaluator(question, answer, elapsedMs) {
  const noScore = {
    correct: false,
    points: 0,
    accuracy: 0,
    multiplier: 1,
    result: null,
    target: question.target
  };

  // Parse JSON string if needed
  if (typeof answer === 'string') {
    try { answer = JSON.parse(answer); } catch (e) {
      return noScore;
    }
  }

  if (!answer || typeof answer.expression !== 'string') {
    return noScore;
  }

  const evalResult = evaluateExpression(answer.expression, question.numbers);
  if (evalResult.error) {
    return { ...noScore, error: evalResult.error };
  }

  const result = evalResult.value;
  const target = question.target;
  const diff = Math.abs(result - target);

  // Accuracy: 100 × (1 - |result - target| / target)², clamped 0-100
  // Exact match = 100
  let accuracy;
  if (diff === 0) {
    accuracy = 100;
  } else {
    const rawAccuracy = 100 * Math.pow(Math.max(0, 1 - diff / target), 2);
    accuracy = Math.round(Math.min(100, Math.max(0, rawAccuracy)));
  }

  // Speed multiplier: flat 1.3x for first 5s, then linear decay to 1.0x at 120s
  let multiplier = 1.0;
  if (elapsedMs !== undefined) {
    const seconds = Math.max(0, elapsedMs / 1000);
    if (seconds <= 5) {
      multiplier = 1.3;
    } else if (seconds >= 120) {
      multiplier = 1.0;
    } else {
      // Linear decay from 1.3 at 5s to 1.0 at 120s
      multiplier = 1.3 - (0.3 * (seconds - 5) / (120 - 5));
    }
  }

  const points = Math.round(accuracy * multiplier);
  const correct = diff === 0;

  return {
    correct,
    points,
    accuracy,
    multiplier: Math.round(multiplier * 100) / 100,
    result,
    target
  };
}
