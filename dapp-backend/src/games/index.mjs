/**
 * Game registry — imports all game question banks and registers them
 * with the scoring engine at startup.
 */

import { registerGame } from '../scoring.mjs';
import { upsertGame } from '../db/index.mjs';

import {
  GAME_ID as estId,
  questions as estQ,
  evaluator as estEval,
  selectQuestions as estSelect,
  QUESTIONS_PER_SESSION as estQPS
} from './estimation-engine.mjs';

import {
  GAME_ID as sudId,
  evaluator as sudEval,
  selectQuestions as sudSelect,
  stripQuestion as sudStrip,
} from './sudoku-duel.mjs';

import {
  GAME_ID as pocId,
  evaluator as pocEval,
  selectQuestions as pocSelect,
  QUESTIONS_PER_SESSION as pocQPS
} from './prime-or-composite.mjs';

import {
  GAME_ID as seqId,
  evaluator as seqEval,
  selectQuestions as seqSelect,
  stripQuestion as seqStrip,
  QUESTIONS_PER_SESSION as seqQPS
} from './sequence-solver.mjs';

import {
  GAME_ID as cdnId,
  evaluator as cdnEval,
  selectQuestions as cdnSelect,
  stripQuestion as cdnStrip,
  QUESTIONS_PER_SESSION as cdnQPS,
} from './countdown-numbers.mjs';

import {
  GAME_ID as kenId,
  evaluator as kenEval,
  selectQuestions as kenSelect,
  stripQuestion as kenStrip,
} from './kenken.mjs';

import {
  GAME_ID as nonoId,
  evaluator as nonoEval,
  selectQuestions as nonoSelect,
  stripQuestion as nonoStrip,
} from './nonogram.mjs';

import {
  GAME_ID as kakId,
  evaluator as kakEval,
  selectQuestions as kakSelect,
  stripQuestion as kakStrip,
} from './kakuro.mjs';

export function registerAllGames() {
  // Estimation Engine — sequential (10 questions, 60s each)
  registerGame(estId, estQ, estEval, estSelect, null, 'sequential');
  upsertGame({
    id: estId,
    name: 'Estimation Engine',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 660,
    questionsPerSession: estQPS
  });

  // Sudoku Duel — continuous (single puzzle, timed session)
  registerGame(sudId, null, sudEval, sudSelect, sudStrip, 'continuous');
  upsertGame({
    id: sudId,
    name: 'Sudoku Duel',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 3600,
    questionsPerSession: 1
  });

  // Prime or Composite — sequential (20 questions, 5s each, speed-only)
  registerGame(pocId, null, pocEval, pocSelect, null, 'sequential');
  upsertGame({
    id: pocId,
    name: 'Prime or Composite',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 150,
    questionsPerSession: pocQPS
  });

  // Sequence Solver — sequential (20 questions, no hard limit, time decay)
  registerGame(seqId, null, seqEval, seqSelect, seqStrip, 'sequential');
  upsertGame({
    id: seqId,
    name: 'Sequence Solver',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 600,
    questionsPerSession: seqQPS
  });

  // Countdown Numbers — sequential (5 rounds, 120s each)
  registerGame(cdnId, null, cdnEval, cdnSelect, cdnStrip, 'sequential');
  upsertGame({
    id: cdnId,
    name: 'Countdown Numbers',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 660,
    questionsPerSession: cdnQPS
  });

  // KenKen — continuous (single puzzle, timed session)
  registerGame(kenId, null, kenEval, kenSelect, kenStrip, 'continuous');
  upsertGame({
    id: kenId,
    name: 'KenKen',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 3600,
    questionsPerSession: 1
  });

  // Nonogram — continuous (single puzzle, timed session)
  registerGame(nonoId, null, nonoEval, nonoSelect, nonoStrip, 'continuous');
  upsertGame({
    id: nonoId,
    name: 'Nonogram',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 3600,
    questionsPerSession: 1
  });

  // Kakuro — continuous (single puzzle, timed session)
  registerGame(kakId, null, kakEval, kakSelect, kakStrip, 'continuous');
  upsertGame({
    id: kakId,
    name: 'Kakuro',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 3600,
    questionsPerSession: 1
  });

  console.log('Registered games:', [estId, sudId, pocId, seqId, cdnId, kenId, nonoId, kakId].join(', '));
}
