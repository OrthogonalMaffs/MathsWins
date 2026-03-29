/**
 * Game registry — imports all game question banks and registers them
 * with the scoring engine at startup.
 *
 * To add a new paid game:
 * 1. Create src/games/your-game.mjs with questions array + evaluator function
 * 2. Import and register it here
 * 3. Add it to the games table via upsertGame()
 */

import { registerGame } from '../scoring.mjs';
import { upsertGame } from '../db/index.mjs';

import { GAME_ID as estId, questions as estQ, evaluator as estEval } from './estimation-engine.mjs';

export function registerAllGames() {
  // Estimation Engine — paid competitive game
  registerGame(estId, estQ, estEval);
  upsertGame({
    id: estId,
    name: 'Estimation Engine',
    isPaid: true,
    serverScoring: true,
    sessionTimeoutSeconds: 300,
    questionsPerSession: 10
  });

  console.log('Registered games:', [estId].join(', '));
}
