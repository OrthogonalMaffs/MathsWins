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

import {
  GAME_ID as msId,
  evaluator as msEval,
  selectQuestions as msSelect,
  stripQuestion as msStrip,
} from './minesweeper.mjs';

import {
  GAME_ID as fcId,
  evaluator as fcEval,
  selectQuestions as fcSelect,
  stripQuestion as fcStrip,
} from './freecell.mjs';

import {
  GAME_ID as cribId,
  evaluator as cribEval,
  selectQuestions as cribSelect,
  stripQuestion as cribStrip,
  QUESTIONS_PER_SESSION as cribQPS,
} from './cribbage-solitaire.mjs';

import {
  GAME_ID as ppId,
  evaluator as ppEval,
  selectQuestions as ppSelect,
  stripQuestion as ppStrip,
} from './poker-patience.mjs';

export const BATTLESHIPS_GAME_ID = 'battleships';

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

  // Minesweeper — continuous (single puzzle, timed session)
  registerGame(msId, null, msEval, msSelect, msStrip, 'continuous');
  upsertGame({
    id: msId,
    name: 'Minesweeper',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 3600,
    questionsPerSession: 1
  });

  // FreeCell — continuous (single deal, timed session)
  registerGame(fcId, null, fcEval, fcSelect, fcStrip, 'continuous');
  upsertGame({
    id: fcId,
    name: 'FreeCell',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 3600,
    questionsPerSession: 1
  });

  // Poker Patience — continuous (25 cards, card-by-card placement)
  registerGame(ppId, null, ppEval, ppSelect, ppStrip, 'continuous');
  upsertGame({
    id: ppId,
    name: 'Poker Patience',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 3600,
    questionsPerSession: 1
  });

  // Cribbage Solitaire — sequential (9 hands, no time pressure)
  registerGame(cribId, null, cribEval, cribSelect, cribStrip, 'sequential');
  upsertGame({
    id: cribId,
    name: 'Cribbage Solitaire',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 1800,
    questionsPerSession: cribQPS
  });

  // Battleships — duel-only, no leagues, no scoring engine
  upsertGame({
    id: BATTLESHIPS_GAME_ID,
    name: 'Battleships',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 0,
    questionsPerSession: 0
  });

  console.log('Registered games:', [estId, sudId, pocId, seqId, cdnId, kenId, nonoId, kakId, msId, fcId, ppId, cribId, BATTLESHIPS_GAME_ID].join(', '));
}
