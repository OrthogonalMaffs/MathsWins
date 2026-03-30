import { GAME_ID, selectQuestions, evaluator, stripQuestion, sumDecompositions } from './src/games/kakuro.mjs';

console.log('GAME_ID:', GAME_ID);
console.log('Decomp(10,3):', JSON.stringify(sumDecompositions(10, 3)));

const t0 = Date.now();
try {
  const q = selectQuestions(42);
  console.log('Gen time:', Date.now() - t0, 'ms');
  const p = q[0];
  console.log('White cells:', p.whiteCellCount);
  console.log('Clues:', p.clues.length);
  p.layout.forEach((row, r) => console.log(row.join('')));
  console.log('---');
  p.solution.forEach(row => console.log(row.map(v => v || '.').join(' ')));

  const wr = p.solution.findIndex(row => row.some(v => v > 0));
  const wc = p.solution[wr].findIndex(v => v > 0);
  console.log('Place:', JSON.stringify(evaluator(p, { action: 'place', row: wr, col: wc, value: p.solution[wr][wc] })));
  console.log('Hint:', JSON.stringify(evaluator(p, { action: 'hint', row: wr, col: wc })));
  console.log('Submit:', JSON.stringify(evaluator(p, { action: 'submit', grid: p.solution, mistakes: 1, hints: 2, helperUsed: true }, 150000)));

  const s = stripQuestion(p);
  console.log('Has solution?', 'solution' in s);
  console.log('Keys:', Object.keys(s).join(', '));
  console.log('Max hints:', s.scoring.maxHints);
} catch (e) {
  console.error('ERROR:', e.message);
}
