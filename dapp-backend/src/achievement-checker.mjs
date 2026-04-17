/**
 * Achievement condition checker.
 * Called after league settlement, duel completion, or session completion.
 * Gated by ACHIEVEMENTS_ACTIVE env var.
 */
import { awardAchievement, getWalletAchievements, getWalletStats, incrementWalletCounter, resetWalletCounter, upsertWalletStats, getLeagueScoresByWallet, getLeaguePuzzles, getAllLeagueScores, getGlobalRecord, setGlobalRecord, getEarnedAchievementCount, getActiveSeasonalWindows, getCompletedLeagueCount, getLeagueWinCount, getLeagueWinsByGame, getDuelWinCount, isRecentLeagueChampion, getBattleshipsRounds, getBattleshipsPlacement, getBattleshipsGameById, getBattleshipsRecord, incrementFreeGameCompletion, getDistinctFreeGamesPlayed, getDb } from './db/index.mjs';
import { checkSunk } from './games/battleships.mjs';

const ACHIEVEMENTS_ACTIVE = process.env.ACHIEVEMENTS_ACTIVE === 'true';
const DEBUG = process.env.ACHIEVEMENT_DEBUG === 'true';
const OWNER_WALLETS = (process.env.OWNER_WALLETS || '').split(',').map(function(w) { return w.trim().toLowerCase(); }).filter(Boolean);

const MILESTONE_IDS = ['collector', 'devoted', 'obsessed', 'the-complete-player'];

/**
 * Build round-based leaderboard snapshots for a league.
 * Returns an array of rounds, each a sorted array of { wallet, cumulative }.
 * Only includes rounds where all completingWallets have submitted N puzzles.
 */
function buildRoundSnapshots(allScores, completingWallets, puzzleCount) {
  var byWallet = {};
  for (var i = 0; i < allScores.length; i++) {
    var w = allScores[i].wallet;
    if (!byWallet[w]) byWallet[w] = [];
    byWallet[w].push(allScores[i]);
  }
  for (var wk in byWallet) {
    byWallet[wk].sort(function(a, b) { return a.submitted_at - b.submitted_at; });
  }

  var snapshots = [];
  for (var rn = 1; rn <= puzzleCount; rn++) {
    var round = [];
    var allHaveN = true;
    for (var ri = 0; ri < completingWallets.length; ri++) {
      var wScores = byWallet[completingWallets[ri]];
      if (!wScores || wScores.length < rn) { allHaveN = false; break; }
      var cumulative = 0;
      for (var rs = 0; rs < rn; rs++) cumulative += wScores[rs].score;
      round.push({ wallet: completingWallets[ri], cumulative: cumulative });
    }
    if (!allHaveN || round.length < 2) continue;
    round.sort(function(a, b) { return b.cumulative - a.cumulative; });
    snapshots.push(round);
  }
  return snapshots;
}

const DUEL_CAPABLE_GAMES = [
  'sudoku-duel', 'battleships', 'kenken', 'kakuro', 'countdown-numbers',
  'nonogram', 'minesweeper', 'freecell', 'poker-patience', 'cribbage-solitaire'
];

/**
 * Check Shadows trilogy achievements for a player after league settlement.
 * Called once per player from doSettleLeague, after positions are finalised.
 *
 * @param {string} wallet - player wallet address
 * @param {string} leagueId - the league being settled
 * @param {number} position - player's final position (1 = winner)
 * @param {number} settledAt - timestamp when the league was settled (passed in, not queried)
 */
export function checkShadowsAchievements(wallet, leagueId, position, settledAt) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || !leagueId || !settledAt) return [];

  var awarded = [];

  function tryAward(achievementId) {
    var result = awardAchievement(wallet, achievementId);
    if (result.awarded) {
      awarded.push(achievementId);
      if (DEBUG) console.log('Achievement awarded: ' + achievementId + ' to ' + wallet.slice(0, 8) + '...' + (result.pioneer ? ' (PIONEER)' : ''));
    }
  }

  // Get all scores for this player in this league
  var scores = getLeagueScoresByWallet(leagueId, wallet);
  var puzzles = getLeaguePuzzles(leagueId);

  // Must have completed all 10 puzzles
  if (scores.length !== puzzles.length || scores.length === 0) return awarded;

  // Check if ALL submitted_at timestamps are before settledAt
  var allBeforeSettlement = scores.every(function(s) { return s.submitted_at < settledAt; });
  if (!allBeforeSettlement) return awarded;

  // into-the-shadows: completed all puzzles before leaderboard went public
  tryAward('into-the-shadows');

  // from-the-shadows: did the above AND won the league
  if (position === 1) {
    tryAward('from-the-shadows');

    // Increment shadow_from_count and check for shadow-legend
    incrementWalletCounter(wallet, 'shadow_from_count');
    var stats = getWalletStats(wallet);
    if (stats && stats.shadow_from_count >= 5) {
      tryAward('shadow-legend');
    }
  }

  return awarded;
}

/**
 * Check The Contrarian achievement after a duel win.
 * Tracks distinct game wins and awards when all 10 duel-capable games have at least 1 win.
 *
 * @param {string} wallet - winning player's wallet address
 * @param {string} gameId - the game that was just won
 */
export function checkContrarian(wallet, gameId) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || !gameId) return [];

  var awarded = [];

  function tryAward(achievementId) {
    var result = awardAchievement(wallet, achievementId);
    if (result.awarded) {
      awarded.push(achievementId);
      if (DEBUG) console.log('Achievement awarded: ' + achievementId + ' to ' + wallet.slice(0, 8) + '...' + (result.pioneer ? ' (PIONEER)' : ''));
    }
  }

  // Read current duel_wins_by_game from wallet_stats
  var stats = getWalletStats(wallet);
  var winsJSON = (stats && stats.duel_wins_by_game) ? stats.duel_wins_by_game : '{}';
  var wins;
  try { wins = JSON.parse(winsJSON); } catch (e) { wins = {}; }

  // Increment count for this game
  wins[gameId] = (wins[gameId] || 0) + 1;

  // Write updated JSON back
  upsertWalletStats(wallet, { duel_wins_by_game: JSON.stringify(wins) });

  // Check if all 10 duel-capable games have at least 1 win
  var allGamesWon = DUEL_CAPABLE_GAMES.every(function(g) { return wins[g] && wins[g] >= 1; });
  if (allGamesWon) {
    tryAward('the-contrarian');
  }

  return awarded;
}

/**
 * Check and award achievements for a wallet based on context.
 *
 * @param {string} wallet - player wallet address
 * @param {object} context - event context:
 *   type: 'league_settle' | 'duel_complete' | 'session_complete'
 *   gameId, leagueId, duelId,
 *   score, mistakes, hints, undoCount, timeMs,
 *   won, position, (for league)
 *   leagueCount, winCount, consecutiveWins, (for volume/winning)
 * @returns {string[]} list of newly awarded achievement IDs
 */
export function checkAchievements(wallet, context) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  const awarded = [];

  function tryAward(achievementId) {
    const result = awardAchievement(wallet, achievementId);
    if (result.awarded) {
      awarded.push(achievementId);
      if (DEBUG) console.log('Achievement awarded: ' + achievementId + ' to ' + wallet.slice(0, 8) + '...' + (result.pioneer ? ' (PIONEER)' : ''));
    }
  }

  // ── Volume achievements ───────────────────────────────────────────
  if (context.leagueCount !== undefined) {
    // first-steps: completed first league
    if (context.leagueCount >= 1) {
      tryAward('first-steps');
    }
    // committed: 10 leagues completed
    if (context.leagueCount >= 10) {
      tryAward('committed');
    }
    if (context.leagueCount >= 50) tryAward('dedicated');
    if (context.leagueCount >= 100) tryAward('veteran');
    if (context.leagueCount >= 500) tryAward('legend');
  }

  // ── Winning achievements ──────────────────────────────────────────
  if (context.won) {
    // winner: won first league
    if (context.winCount !== undefined && context.winCount >= 1) {
      tryAward('winner');
    }
    // on-a-roll: 5 league wins total
    if (context.winCount !== undefined && context.winCount >= 5) {
      tryAward('on-a-roll');
    }
    if (context.winCount !== undefined && context.winCount >= 25) {
      tryAward('dominant');
    }

    // the-completionist: won a league on all 4 active league games
    var wonGames = getLeagueWinsByGame(wallet);
    var activeLeagueGames = ['sudoku-duel', 'kenken', 'minesweeper', 'freecell'];
    if (activeLeagueGames.every(function(g) { return wonGames.indexOf(g) !== -1; })) {
      tryAward('the-completionist');
    }
  }

  // ── Hat-Trick (consecutive league wins) ─────────────────────────
  if (context.type === 'league_settle') {
    if (context.position === 1) {
      incrementWalletCounter(wallet, 'consecutive_league_wins');
      var streakStats = getWalletStats(wallet);
      if (streakStats && streakStats.consecutive_league_wins >= 3) {
        tryAward('hat-trick');
      }
    } else {
      resetWalletCounter(wallet, 'consecutive_league_wins');
    }
  }

  // ── League wooden spoon achievements ─────────────────────────────
  if (context.type === 'league_settle' && context.isLast) {
    // the-fish: finish last in a Poker Patience league 3 times
    if (context.gameId === 'poker-patience') {
      incrementWalletCounter(wallet, 'poker_patience_last_place');
      var fishStats = getWalletStats(wallet);
      if (fishStats && fishStats.poker_patience_last_place >= 3) {
        tryAward('the-fish');
      }
    }
  }

  // ── Duel achievements ─────────────────────────────────────────────
  if (context.type === 'duel_complete') {
    if (context.won) {
      var duelWins = getDuelWinCount(wallet);

      // first-blood: first duel win
      if (duelWins >= 1) tryAward('first-blood');
      // duelist: 10 duel wins
      if (duelWins >= 10) tryAward('duelist');
      // gladiator: 50 duel wins
      if (duelWins >= 50) tryAward('gladiator');

      // heartbreaker: win by exactly 1 point
      if (context.winnerScore !== undefined && context.loserScore !== undefined) {
        if (Math.abs(context.winnerScore - context.loserScore) === 1) {
          tryAward('heartbreaker');
        }
      }

      // giant-slayer: beat a recent league champion (won a league in last 30 days)
      if (context.loserWallet && isRecentLeagueChampion(context.loserWallet)) {
        tryAward('giant-slayer');
      }

      // the-wall: 10 consecutive duel wins
      incrementWalletCounter(wallet, 'consecutive_duel_wins');
      var duelStreak = getWalletStats(wallet);
      if (duelStreak && duelStreak.consecutive_duel_wins >= 10) {
        tryAward('the-wall');
      }
    } else {
      // Loser: reset consecutive duel wins
      resetWalletCounter(wallet, 'consecutive_duel_wins');
    }
  }

  // ── Purity achievements ────────────────────────────────────────────
  if (context.type === 'league_settle' && context.leagueId) {
    var scores = getLeagueScoresByWallet(context.leagueId, wallet);
    var puzzles = getLeaguePuzzles(context.leagueId);
    var completedAll = scores.length === puzzles.length && scores.length > 0;

    if (completedAll) {
      // Core purity: 0 mistakes across all 10 puzzles (game-specific)
      var zeroMistakes = scores.every(function(s) { return (s.mistakes || 0) === 0; });
      if (context.gameId === 'sudoku-duel' && zeroMistakes) tryAward('pure-logic');
      if (context.gameId === 'minesweeper' && zeroMistakes) tryAward('never-triggered');
      if (context.gameId === 'freecell' && zeroMistakes) tryAward('clean-sheet');
      if (context.gameId === 'kenken' && zeroMistakes) tryAward('first-light');
      if (context.gameId === 'nonogram' && zeroMistakes) tryAward('pixel-perfect');
      if (context.gameId === 'kakuro' && zeroMistakes) tryAward('the-chain');
      if (context.gameId === 'cribbage-solitaire' && zeroMistakes) tryAward('clean-crib');
      // no-tells: poker-patience with 0 mistakes AND 0 hints
      if (context.gameId === 'poker-patience' && zeroMistakes && scores.every(function(s) { return (s.hints || 0) === 0; })) {
        tryAward('no-tells');
      }

      // clientStats-dependent purity achievements
      // the-purist: FreeCell league with 0 undos across all puzzles
      if (context.gameId === 'freecell' && scores.every(function(s) { return s.undos_used === 0; })) {
        tryAward('the-purist');
      }
      // flawless-line: Minesweeper league with 0 flags across all puzzles
      if (context.gameId === 'minesweeper' && scores.every(function(s) { return s.flags_used === 0; })) {
        tryAward('flawless-line');
      }
      // the-logician: KenKen league with 0 helper usage across all puzzles
      if (context.gameId === 'kenken' && scores.every(function(s) { return s.helper_used === 0; })) {
        tryAward('the-logician');
      }
      // hintless: Nonogram league with 0 hints across all puzzles
      if (context.gameId === 'nonogram' && scores.every(function(s) { return s.hints === 0; })) {
        tryAward('hintless');
      }
      // blind-kakuro: Kakuro league with 0 hints AND 0 helper usage across all puzzles
      if (context.gameId === 'kakuro' && scores.every(function(s) { return s.hints === 0 && s.helper_used === 0; })) {
        tryAward('blind-kakuro');
      }
    }

    // ── Mathematical Constants (individual puzzle scores) ────────────
    var constantTargets = [
      { id: 'pi',           score: 3141 },
      { id: 'euler',        score: 2718 },
      { id: 'golden-ratio', score: 1618 },
      { id: 'root-two',     score: 1414 },
      { id: 'root-three',   score: 1732 },
    ];
    for (var ci = 0; ci < constantTargets.length; ci++) {
      if (scores.some(function(s) { return s.score === constantTargets[ci].score; })) {
        tryAward(constantTargets[ci].id);
      }
    }

    // ── Squared Pi (score 3141 on Pi Day only) ──────────────────────
    var now = new Date();
    if (now.getUTCMonth() === 2 && now.getUTCDate() === 14) {
      if (scores.some(function(s) { return s.score === 3141; })) {
        tryAward('squared-pi');
      }
    }

    // ── The Tortoise (winner with slowest total time ever recorded) ──
    if (context.won) {
      var winnerTotalTime = scores.reduce(function(sum, s) { return sum + (s.time_ms || 0); }, 0);
      var record = getGlobalRecord('tortoise-slowest-win');
      if (!record || winnerTotalTime > parseInt(record.value)) {
        setGlobalRecord('tortoise-slowest-win', wallet, winnerTotalTime);
        tryAward('the-tortoise');
      }
    }

    // ── Clean Slate, The Lurker, From the Ashes (round-based snapshots) ──
    if (context.won) {
      var allScores = getAllLeagueScores(context.leagueId);
      var puzzleCount = puzzles.length;

      // Derive completing wallets from allScores
      var walletCounts = {};
      for (var wci = 0; wci < allScores.length; wci++) {
        walletCounts[allScores[wci].wallet] = (walletCounts[allScores[wci].wallet] || 0) + 1;
      }
      var completingWallets = [];
      for (var cwk in walletCounts) {
        if (walletCounts[cwk] === puzzleCount) completingWallets.push(cwk);
      }

      if (completingWallets.length >= 4) {
        var snapshots = buildRoundSnapshots(allScores, completingWallets, puzzleCount);
        var winnerWallet = wallet.toLowerCase();
        var preFinal = snapshots.slice(0, -1);

        // Clean Slate: winner never in last place (pre-final rounds)
        var neverLast = preFinal.every(function(round) {
          return round[round.length - 1].wallet !== winnerWallet;
        });
        if (neverLast) tryAward('clean-slate');

        // The Lurker: winner never in top 3 (pre-final rounds)
        var neverTop3 = preFinal.every(function(round) {
          for (var t = 0; t < Math.min(3, round.length); t++) {
            if (round[t].wallet === winnerWallet) return false;
          }
          return true;
        });
        if (neverTop3) tryAward('the-lurker');

        // From the Ashes: winner was last after round 1
        if (snapshots.length > 0) {
          var round1 = snapshots[0];
          if (round1[round1.length - 1].wallet === winnerWallet) {
            tryAward('from-the-ashes');
          }
        }
      }
    }
  }

  // ── Battleships achievements ──────────────────────────────────────
  if (context.type === 'battleships_complete' && context.gameId) {
    try {
      var bsGame = getBattleshipsGameById(context.gameId);
      var bsRounds = getBattleshipsRounds(context.gameId);
      var winnerWallet = bsGame ? (bsGame.winner_wallet || '').toLowerCase() : '';
      var isWinner = wallet.toLowerCase() === winnerWallet;
      var isCpu = bsGame && bsGame.vs_cpu;
      var opponentWallet = '';
      if (bsGame) {
        opponentWallet = bsGame.creator_wallet.toLowerCase() === wallet.toLowerCase()
          ? (bsGame.opponent_wallet || '').toLowerCase()
          : bsGame.creator_wallet.toLowerCase();
      }

      var myRounds = bsRounds.filter(function(r) { return r.wallet.toLowerCase() === wallet.toLowerCase(); });
      var oppRounds = bsRounds.filter(function(r) { return r.wallet.toLowerCase() === opponentWallet; });

      var myPlacement = getBattleshipsPlacement(context.gameId, wallet);
      var oppPlacement = getBattleshipsPlacement(context.gameId, opponentWallet);
      var myFleet = myPlacement ? JSON.parse(myPlacement.fleet) : [];
      var oppFleet = oppPlacement ? JSON.parse(oppPlacement.fleet) : [];

      // 1. FIRST STRIKE — first shot was a hit
      if (myRounds.length > 0) {
        var sorted = myRounds.slice().sort(function(a, b) { return a.round_number - b.round_number; });
        if (sorted[0].result === 'hit' || sorted[0].result === 'sunk') {
          tryAward('first-strike');
        }
      }

      if (isWinner) {
        // 2. LAST STAND — won with only 1 ship surviving
        var mySurviving = myFleet.filter(function(s) { return !checkSunk(s.ship, myFleet, oppRounds); });
        if (mySurviving.length === 1) {
          tryAward('last-stand');
        }

        // 3. THE WOLF — won with only submarine surviving
        if (mySurviving.length === 1 && mySurviving[0].ship === 'Submarine') {
          tryAward('the-wolf');
        }

        // 4. UNSINKABLE — battleship survived (track consecutive)
        var battleshipSurvived = mySurviving.some(function(s) { return s.ship === 'Battleship'; });
        if (battleshipSurvived) {
          incrementWalletCounter(wallet, 'consecutive_bs_wins_with_battleship');
          var unsinkStats = getWalletStats(wallet);
          if (unsinkStats && unsinkStats.consecutive_bs_wins_with_battleship >= 10) {
            tryAward('unsinkable');
          }
        } else {
          resetWalletCounter(wallet, 'consecutive_bs_wins_with_battleship');
        }

        // 5. THE ADMIRAL — 50+ battleships wins
        var bsRecord = getBattleshipsRecord(wallet);
        if (bsRecord && bsRecord.wins >= 50) {
          tryAward('the-admiral');
        }

        // 6. PERFECT SONAR — zero misses
        if (myRounds.length > 0 && myRounds.every(function(r) { return r.result === 'hit' || r.result === 'sunk'; })) {
          tryAward('perfect-sonar');
        }

        // 8. CARRIER SUPREMACY — carrier survived (track cumulative)
        var carrierSurvived = mySurviving.some(function(s) { return s.ship === 'Carrier'; });
        if (carrierSurvived) {
          incrementWalletCounter(wallet, 'carrier_supremacy_count');
          var carrierStats = getWalletStats(wallet);
          if (carrierStats && carrierStats.carrier_supremacy_count >= 100) {
            tryAward('carrier-supremacy');
          }
        }
      } else {
        // Loser: reset consecutive battleship streak
        resetWalletCounter(wallet, 'consecutive_bs_wins_with_battleship');
      }

      // 7. SUB HUNTER — sunk opponent's submarine (check for this wallet as attacker)
      if (oppFleet.length > 0 && checkSunk('Submarine', oppFleet, myRounds)) {
        incrementWalletCounter(wallet, 'sub_hunter_count');
        var subStats = getWalletStats(wallet);
        if (subStats && subStats.sub_hunter_count >= 100) {
          tryAward('sub-hunter');
        }
      }

      // 9. SCATTER-GUN / DO YOU EVEN AIM BRO? — all misses
      var totalShots = myRounds.length;
      var totalMisses = myRounds.filter(function(r) { return r.result === 'miss'; }).length;
      if (totalShots >= 50 && totalMisses === totalShots) {
        tryAward('scatter-gun');
      }
      if (totalShots >= 75 && totalMisses === totalShots) {
        tryAward('do-you-even-aim-bro');
      }

      // 10. TAX PAYER'S NIGHTMARE (loser only) — carrier sunk + sunk zero of opponent's ships
      if (!isWinner && oppFleet.length > 0 && myFleet.length > 0) {
        var myCarrierSunk = checkSunk('Carrier', myFleet, oppRounds);
        var oppShipsSunkByMe = oppFleet.filter(function(s) { return checkSunk(s.ship, oppFleet, myRounds); }).length;
        if (myCarrierSunk && oppShipsSunkByMe === 0) {
          tryAward('tax-payers-nightmare');
        }
      }
    } catch (e) {
      console.error('Battleships achievement check error:', e.message);
    }
  }

  // ── Free game achievements (century, explorer, personal-best) ─────
  if (context.type === 'session_complete' && context.freePlay) {
    try {
      var FREE_GAME_IDS = ['maffsy','higher-or-lower','52dle','towers-of-hanoi','dont-press-it','memory-matrix','rps-vs-machine','estimation-engine','sequence-solver','prime-or-composite','cryptarithmetic-club','battleships'];

      // Century: 100 completions of any single free game
      var completion = incrementFreeGameCompletion(wallet, context.gameId);
      if (completion && completion.count >= 100) {
        tryAward('century');
      }

      // Explorer: played all 12 free games at least once
      if (FREE_GAME_IDS.indexOf(context.gameId) !== -1) {
        var distinct = getDistinctFreeGamesPlayed(wallet);
        if (distinct && distinct.count >= 12) {
          tryAward('explorer');
        }
      }

      // Personal Best: beaten your own PB 5 times on the same game
      if (context.pbBeaten) {
        tryAward('personal-best');
      }

      // Photographic: memory-matrix with every round survived played perfectly
      if (context.gameId === 'memory-matrix' && context.roundsSurvived > 0 && context.perfectRounds === context.roundsSurvived) {
        tryAward('photographic');
      }

      // Dead Reckoning: estimation-engine with every question answered exactly
      if (context.gameId === 'estimation-engine' && context.totalQuestions > 0 && context.exactHits === context.totalQuestions) {
        tryAward('dead-reckoning');
      }

      // Next In Line: sequence-solver with 10+ consecutive correct sequences (cross-session)
      if (context.gameId === 'sequence-solver' && context.consecutiveCorrect >= 10) {
        tryAward('next-in-line');
      }

      // Unbeatable: rps-vs-machine with 10+ consecutive round wins (cross-session)
      if (context.gameId === 'rps-vs-machine' && context.winStreak >= 10) {
        tryAward('unbeatable');
      }

      // The Engineer: towers-of-hanoi solved on max difficulty (7 discs)
      if (context.gameId === 'towers-of-hanoi' && context.solved === true && context.difficulty === 7) {
        tryAward('the-engineer');
      }
    } catch (e) {
      console.error('Free game achievement check error:', e.message);
    }
  }

  // ── Skill achievements ────────────────────────────────────────────
  // the-undo-king: FreeCell game with 100+ undos and still win
  if (context.gameId === 'freecell' && context.won && context.undoCount >= 100) {
    tryAward('the-undo-king');
  }
  // lucky-number: win FreeCell deal #7777
  if (context.gameId === 'freecell' && context.won && context.dealNumber === 7777) {
    tryAward('lucky-number');
  }

  // ── Poker Patience achievements ────────────────────────────────────
  if (context.gameId === 'poker-patience' && context.finalScores) {
    var lines = context.finalScores.results || [];
    var total = context.finalScores.total || 0;
    var handNames = lines.map(function(l) { return l.name; });

    // royal-flush: any line is a Royal Flush
    if (handNames.indexOf('Royal Flush') !== -1) {
      tryAward('royal-flush');
    }
    // all-pairs: every line has at least One Pair (points >= 2)
    if (lines.length === 10 && lines.every(function(l) { return l.points >= 2; })) {
      tryAward('all-pairs');
    }
    // the-nuts: total score >= 400
    if (total >= 400) {
      tryAward('the-nuts');
    }
    // dead-mans-hand: any line is Two Pair containing aces and eights
    for (var di = 0; di < lines.length; di++) {
      if (lines[di].name === 'Two Pair' && lines[di].cards) {
        var ranks = lines[di].cards.map(function(c) { return c % 13; });
        var hasAcePair = ranks.filter(function(r) { return r === 0; }).length >= 2;
        var hasEightPair = ranks.filter(function(r) { return r === 7; }).length >= 2;
        if (hasAcePair && hasEightPair) tryAward('dead-mans-hand');
      }
    }
    // pocket-rockets: any line has a pair of aces
    for (var pi = 0; pi < lines.length; pi++) {
      if (lines[pi].cards) {
        var aceCount = lines[pi].cards.filter(function(c) { return c % 13 === 0; }).length;
        if (aceCount >= 2) { tryAward('pocket-rockets'); break; }
      }
    }
    // the-brick: opening two cards are a 2 and a 7 with no matching suit
    if (context.openingCards && context.openingCards.length === 2) {
      var c0rank = context.openingCards[0] % 13;
      var c1rank = context.openingCards[1] % 13;
      var c0suit = Math.floor(context.openingCards[0] / 13);
      var c1suit = Math.floor(context.openingCards[1] / 13);
      var hasTwoAndSeven = (c0rank === 1 && c1rank === 6) || (c0rank === 6 && c1rank === 1);
      if (hasTwoAndSeven && c0suit !== c1suit) {
        tryAward('the-brick');
      }
    }
    // bust: zero scoring hands across all rows and columns (not a single pair or better)
    if (lines.length === 10 && lines.every(function(l) { return l.points === 0; })) {
      tryAward('bust');
    }
    // mucky-hands: every line is High Card only (no pairs, flushes, straights, etc.)
    if (lines.length === 10 && lines.every(function(l) { return l.name === 'High Card'; })) {
      tryAward('mucky-hands');
    }
  }

  // ── Cribbage Solitaire achievements ───────────────────────────────
  if (context.gameId === 'cribbage-solitaire') {
    // twenty-nine: a single hand scored 29 (the perfect hand)
    if (context.maxHandScore >= 29) {
      tryAward('twenty-nine');
    }
    // crib-master: total game score >= 100
    if (context.score >= 100) {
      tryAward('crib-master');
    }
    // crib-death: total game score <= 10 (wooden spoon)
    if (context.score <= 10) {
      tryAward('crib-death');
    }
  }

  // ── Golf Solitaire achievements ───────────────────────────────────
  if (context.gameId === 'golf-solitaire' && context.remaining !== null) {
    // hole-in-one: perfect clear (0 remaining)
    if (context.remaining === 0) {
      tryAward('hole-in-one');
    }
    // albatross: 3 or fewer remaining
    if (context.remaining <= 3) {
      tryAward('albatross');
    }
    // under-par: 7 or fewer remaining
    if (context.remaining <= 7) {
      tryAward('under-par');
    }
    // back-nine: 9 consecutive Golf completions without failing
    if (context.won) {
      incrementWalletCounter(wallet, 'consecutive_golf_wins');
      var golfStats = getWalletStats(wallet);
      if (golfStats && golfStats.consecutive_golf_wins >= 9) {
        tryAward('back-nine');
      }
    } else {
      resetWalletCounter(wallet, 'consecutive_golf_wins');
    }
    // bogey: 25+ remaining (wooden spoon)
    if (context.remaining >= 25) {
      tryAward('bogey');
    }
  }

  // ── Pyramid achievements ──────────────────────────────────────────
  if (context.gameId === 'pyramid' && context.cleared !== null) {
    // perfect-pyramid: cleared all 28 cards
    if (context.cleared === 28) {
      tryAward('perfect-pyramid');
    }
    // the-archaeologist: cleared 25+
    if (context.cleared >= 25) {
      tryAward('the-archaeologist');
    }
    // kings-ransom: cleared 24+
    if (context.cleared >= 24) {
      tryAward('kings-ransom');
    }
    // tutankhamun: completed 10 Pyramid games total
    incrementWalletCounter(wallet, 'pyramid_completions');
    var pyramidStats = getWalletStats(wallet);
    if (pyramidStats && pyramidStats.pyramid_completions >= 10) {
      tryAward('tutankhamun');
    }
    // pharaohs-curse: cleared 5 or fewer (wooden spoon)
    if (context.cleared <= 5) {
      tryAward('pharaohs-curse');
    }
    // curse-of-the-mummy: cleared 3 or fewer (wooden spoon)
    if (context.cleared <= 3) {
      tryAward('curse-of-the-mummy');
    }
  }

  // ── Absurd achievements ───────────────────────────────────────────
  if (context.score !== undefined) {
    // palindrome: score reads the same forwards and backwards
    const scoreStr = String(context.score);
    if (scoreStr.length > 1 && scoreStr === scoreStr.split('').reverse().join('')) {
      tryAward('palindrome');
    }
  }
  // TODO: speedrun-to-zero not in registry, spec session needed to determine intent and add registry row. Commented 2026-04-17.
  // speedrun-to-zero: sudoku-duel score of exactly 0
  // if (context.gameId === 'sudoku-duel' && context.score === 0) {
  //   tryAward('speedrun-to-zero');
  // }

  // ── Time & Dedication achievements ────────────────────────────────
  const hour = new Date().getUTCHours();
  // night-owl: complete a game between 03:00 and 05:00 UTC
  if (hour >= 3 && hour < 5) {
    tryAward('night-owl');
  }
  // the-marathon: single session lasting over 2 hours
  if (context.timeMs >= 7200000) {
    tryAward('the-marathon');
  }

  // ── Community achievements ────────────────────────────────────────
  // TODO: onlyfans-qf — manual award only (admin endpoint)

  // ── Meta achievements ─────────────────────────────────────────────
  // TODO: pioneer-hunter — be the pioneer for 3 achievements
  // TODO: the-whale — spend 1000+ QF on mint fees

  // ── Impossible ────────────────────────────────────────────────────
  // TODO: boom — conditions TBD (admin/manual or extreme edge case)

  // ── Seasonal achievements ─────────────────────────────────────────
  try {
    var nowMs = Date.now();
    var activeWindows = getActiveSeasonalWindows(nowMs);
    for (var sw = 0; sw < activeWindows.length; sw++) {
      var win = activeWindows[sw];
      // VE Day requires Battleships specifically
      if (win.achievement_id === 've-day' && context.gameId !== 'battleships') continue;
      tryAward(win.achievement_id);
    }
  } catch (e) { /* seasonal check must never block */ }

  // ── Milestone achievements (checked after all other awards) ───────
  if (awarded.length > 0) {
    try {
      var earnedCount = getEarnedAchievementCount(wallet);
      var milestones = [
        { id: 'collector',           threshold: 10  },
        { id: 'devoted',             threshold: 25  },
        { id: 'obsessed',            threshold: 50  },
        { id: 'the-complete-player', threshold: 100 },
      ];
      for (var mi = 0; mi < milestones.length; mi++) {
        if (earnedCount >= milestones[mi].threshold) {
          var mResult = awardAchievement(wallet, milestones[mi].id);
          if (mResult.awarded) awarded.push(milestones[mi].id);
        }
      }
    } catch (e) { /* milestone check must never block */ }
  }

  return awarded;
}

/**
 * Check weekend-warrior streak achievement.
 * Call from any league puzzle submission or free play session completion.
 */
export function checkStreakAchievements(wallet) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  function tryAward(id) {
    var r = awardAchievement(wallet, id);
    if (r.awarded) {
      awarded.push(id);
      if (DEBUG) console.log('Achievement awarded: ' + id + ' to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  var now = new Date();
  if (now.getUTCDay() !== 6) return awarded; // Saturday only

  var today = now.toISOString().slice(0, 10); // YYYY-MM-DD
  var stats = getWalletStats(wallet);
  var lastPlayed = stats ? stats.saturday_last_played : null;
  var streak = stats ? (stats.saturday_streak || 0) : 0;

  if (lastPlayed === today) return awarded; // Already counted today

  if (lastPlayed) {
    var lastDate = new Date(lastPlayed + 'T00:00:00Z');
    var daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 13) {
      streak = 1; // Missed a Saturday — reset
    } else {
      streak = streak + 1;
    }
  } else {
    streak = 1;
  }

  upsertWalletStats(wallet, { saturday_streak: streak, saturday_last_played: today });

  if (streak >= 4) tryAward('weekend-warrior');

  return awarded;
}

/**
 * Check league-regular achievement (enter a league every week for 8 consecutive weeks).
 * Call at POST /league/:leagueId/join.
 */
export function checkLeagueRegular(wallet) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  function tryAward(id) {
    var r = awardAchievement(wallet, id);
    if (r.awarded) {
      awarded.push(id);
      if (DEBUG) console.log('Achievement awarded: ' + id + ' to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  var db = getDb();
  var rows = db.prepare('SELECT joined_at FROM league_players WHERE wallet = ? ORDER BY joined_at DESC LIMIT 100')
    .all(wallet.toLowerCase());

  if (rows.length < 8) return awarded;

  // Get distinct ISO weeks
  var weeks = new Set();
  for (var i = 0; i < rows.length; i++) {
    var d = new Date(rows[i].joined_at);
    var yr = d.getUTCFullYear();
    var jan1 = new Date(Date.UTC(yr, 0, 1));
    var dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1;
    var weekNum = Math.ceil((dayOfYear + jan1.getUTCDay()) / 7);
    weeks.add(yr + '-W' + String(weekNum).padStart(2, '0'));
  }

  var sorted = Array.from(weeks).sort().reverse();
  if (sorted.length < 8) return awarded;

  var consecutive = 1;
  for (var j = 1; j < sorted.length && consecutive < 8; j++) {
    var prev = parseISOWeek(sorted[j - 1]);
    var curr = parseISOWeek(sorted[j]);
    if (prev && curr && prev - curr === 1) {
      consecutive++;
    } else {
      break;
    }
  }

  if (consecutive >= 8) tryAward('league-regular');

  return awarded;
}

function parseISOWeek(weekStr) {
  var parts = weekStr.split('-W');
  return parseInt(parts[0]) * 100 + parseInt(parts[1]);
}

/**
 * Check monthly achievements (active-player, grinder, league-month, double-winner).
 * Call at league join, league settlement, and free play completion.
 */
export function checkMonthlyAchievements(wallet) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  function tryAward(id) {
    var r = awardAchievement(wallet, id);
    if (r.awarded) {
      awarded.push(id);
      if (DEBUG) console.log('Achievement awarded: ' + id + ' to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  var db = getDb();
  var now = new Date();
  var monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  var monthEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);

  var w = wallet.toLowerCase();

  // Active Player / Grinder: count free_game_completions + league_scores this month
  var freeCount = db.prepare('SELECT SUM(count) as total FROM free_game_completions WHERE wallet = ? AND last_played >= ? AND last_played < ?')
    .get(w, monthStart, monthEnd);
  var leagueCount = db.prepare('SELECT COUNT(*) as total FROM league_scores WHERE wallet = ? AND submitted_at >= ? AND submitted_at < ?')
    .get(w, monthStart, monthEnd);

  var totalGames = (freeCount ? freeCount.total || 0 : 0) + (leagueCount ? leagueCount.total || 0 : 0);
  if (totalGames >= 50) tryAward('active-player');
  if (totalGames >= 100) tryAward('grinder');

  // League Month: 4 league entries this month
  var leagueEntries = db.prepare('SELECT COUNT(*) as total FROM league_players WHERE wallet = ? AND joined_at >= ? AND joined_at < ?')
    .get(w, monthStart, monthEnd);
  if (leagueEntries && leagueEntries.total >= 4) tryAward('league-month');

  // Double Winner: 2 league wins this month
  var leagueWins = db.prepare('SELECT COUNT(*) as total FROM league_prizes WHERE wallet = ? AND position = 1 AND paid_at >= ? AND paid_at < ?')
    .get(w, monthStart, monthEnd);
  if (leagueWins && leagueWins.total >= 2) tryAward('double-winner');

  return awarded;
}

/**
 * Check loyalty achievements based on total_qf_spent.
 * Call after every total_qf_spent increment.
 */
export function checkLoyaltyAchievements(wallet) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  function tryAward(id) {
    var r = awardAchievement(wallet, id);
    if (r.awarded) {
      awarded.push(id);
      if (DEBUG) console.log('Achievement awarded: ' + id + ' to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  var stats = getWalletStats(wallet);
  var spent = stats ? (stats.total_qf_spent || 0) : 0;

  if (spent >= 1000) tryAward('skin-in-the-game');
  if (spent >= 10000) tryAward('true-believer');
  if (spent >= 52000) {
    tryAward('fifty-two-thousand');
    if (awarded.indexOf('fifty-two-thousand') !== -1) {
      console.log('[ACHIEVEMENT] fifty-two-thousand earned by ' + wallet + ' — manual 52f airdrop required');
    }
  }

  return awarded;
}

/**
 * Increment total_qf_spent and check loyalty achievements.
 * Call at all 5 payment points.
 */
export function trackSpend(wallet, amount) {
  if (!wallet || amount <= 0) return [];
  var db = getDb();
  db.prepare('INSERT INTO wallet_stats (wallet, total_qf_spent, updated_at) VALUES (?, ?, ?) ON CONFLICT(wallet) DO UPDATE SET total_qf_spent = total_qf_spent + ?, updated_at = ?')
    .run(wallet.toLowerCase(), amount, Date.now(), amount, Date.now());
  return checkLoyaltyAchievements(wallet);
}

/**
 * Check night-owl for a specific league puzzle submission timestamp.
 * Complements the existing night-owl check in checkAchievements which uses current time.
 */
export function checkNightOwlSubmission(wallet, submittedAt) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || !submittedAt) return [];

  var awarded = [];
  var hour = new Date(submittedAt).getUTCHours();
  if (hour >= 3 && hour < 5) {
    var r = awardAchievement(wallet, 'night-owl');
    if (r.awarded) {
      awarded.push('night-owl');
      if (DEBUG) console.log('Achievement awarded: night-owl to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  return awarded;
}

/**
 * Check the-insomniac: all 10 league puzzles completed between 00:00–06:00 UTC.
 * Call at league settlement, once per player.
 */
export function checkInsomniac(wallet, leagueId) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || !leagueId) return [];

  var awarded = [];
  var scores = getLeagueScoresByWallet(leagueId, wallet);
  var puzzles = getLeaguePuzzles(leagueId);
  if (scores.length !== puzzles.length || scores.length === 0) return awarded;

  var allNighttime = scores.every(function(s) {
    var hour = new Date(s.submitted_at).getUTCHours();
    return hour >= 0 && hour < 6;
  });

  if (allNighttime) {
    var r = awardAchievement(wallet, 'the-insomniac');
    if (r.awarded) {
      awarded.push('the-insomniac');
      if (DEBUG) console.log('Achievement awarded: the-insomniac to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  return awarded;
}

// ── Game-specific achievements (Batch 6) ─────────────────────────────

/**
 * Check FreeCell league achievements at settlement.
 * no-cell-used: zero free cells used across all 10 puzzles.
 */
export function checkFreeCellLeague(wallet, leagueId) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || !leagueId) return [];

  var awarded = [];
  function tryAward(id) {
    var r = awardAchievement(wallet, id);
    if (r.awarded) {
      awarded.push(id);
      if (DEBUG) console.log('Achievement awarded: ' + id + ' to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  var scores = getLeagueScoresByWallet(leagueId, wallet);
  var puzzles = getLeaguePuzzles(leagueId);
  if (scores.length !== puzzles.length || scores.length === 0) return awarded;

  var totalFreeCells = scores.reduce(function(sum, s) { return sum + (s.free_cells_used || 0); }, 0);
  if (totalFreeCells === 0) tryAward('no-cell-used');

  return awarded;
}

/**
 * Check KenKen league achievement at settlement.
 * perfect-logic: mistakes=0 AND hints=0 across all 10 puzzles.
 */
export function checkKenKenLeague(wallet, leagueId) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || !leagueId) return [];

  var awarded = [];
  function tryAward(id) {
    var r = awardAchievement(wallet, id);
    if (r.awarded) {
      awarded.push(id);
      if (DEBUG) console.log('Achievement awarded: ' + id + ' to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  var scores = getLeagueScoresByWallet(leagueId, wallet);
  var puzzles = getLeaguePuzzles(leagueId);
  if (scores.length !== puzzles.length || scores.length === 0) return awarded;

  var allPerfect = scores.every(function(s) { return (s.mistakes || 0) === 0 && (s.hints || 0) === 0; });
  if (allPerfect) tryAward('perfect-logic');

  return awarded;
}

/**
 * Check Nonogram league achievements at settlement.
 * the-artist: position=1 AND mistakes=0 AND hints=0 on all 10 puzzles.
 */
export function checkNonogramLeague(wallet, leagueId, position) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || !leagueId) return [];

  var awarded = [];
  function tryAward(id) {
    var r = awardAchievement(wallet, id);
    if (r.awarded) {
      awarded.push(id);
      if (DEBUG) console.log('Achievement awarded: ' + id + ' to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  if (position !== 1) return awarded;

  var scores = getLeagueScoresByWallet(leagueId, wallet);
  var puzzles = getLeaguePuzzles(leagueId);
  if (scores.length !== puzzles.length || scores.length === 0) return awarded;

  var allPerfect = scores.every(function(s) { return (s.mistakes || 0) === 0 && (s.hints || 0) === 0; });
  if (allPerfect) tryAward('the-artist');

  return awarded;
}

/**
 * Check Kakuro league achievements at settlement.
 * the-crossword-king: mistakes=0 AND hints=0 on all 10 puzzles.
 */
export function checkKakuroLeague(wallet, leagueId) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || !leagueId) return [];

  var awarded = [];
  function tryAward(id) {
    var r = awardAchievement(wallet, id);
    if (r.awarded) {
      awarded.push(id);
      if (DEBUG) console.log('Achievement awarded: ' + id + ' to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  var scores = getLeagueScoresByWallet(leagueId, wallet);
  var puzzles = getLeaguePuzzles(leagueId);
  if (scores.length !== puzzles.length || scores.length === 0) return awarded;

  var allPerfect = scores.every(function(s) { return (s.mistakes || 0) === 0 && (s.hints || 0) === 0; });
  if (allPerfect) tryAward('the-crossword-king');

  return awarded;
}

/**
 * Check Minesweeper achievements after free play completion.
 * clean-sweep: win Expert difficulty.
 * the-comeback: win Expert after 3+ consecutive Expert detonations.
 */
export function checkMinesweeperFreePlay(wallet, difficulty, won) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  function tryAward(id) {
    var r = awardAchievement(wallet, id);
    if (r.awarded) {
      awarded.push(id);
      if (DEBUG) console.log('Achievement awarded: ' + id + ' to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  if (difficulty === 'expert') {
    if (won) {
      tryAward('clean-sweep');
      // the-comeback: check if 3+ consecutive Expert detonations preceded this win
      var stats = getWalletStats(wallet);
      if (stats && stats.expert_detonation_streak >= 3) {
        tryAward('the-comeback');
      }
      resetWalletCounter(wallet, 'expert_detonation_streak');
    } else {
      incrementWalletCounter(wallet, 'expert_detonation_streak');
    }
  }

  return awarded;
}

/**
 * Check flag-everything achievement.
 * flags >= total cells for the given difficulty.
 */
export function checkFlagEverything(wallet, difficulty, flags) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || !flags) return [];

  var GRID_SIZES = {
    pocket: 144, beginner: 81, intermediate: 256, advanced: 324, expert: 480
  };
  var totalCells = GRID_SIZES[difficulty];
  if (!totalCells) return [];

  var awarded = [];
  if (flags >= totalCells) {
    var r = awardAchievement(wallet, 'flag-everything');
    if (r.awarded) {
      awarded.push('flag-everything');
      if (DEBUG) console.log('Achievement awarded: flag-everything to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  return awarded;
}

/**
 * Check blind-eye achievement for Nonogram.
 * Complete a puzzle with zero hints.
 */
export function checkBlindEye(wallet, hints) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  if (hints === 0) {
    var r = awardAchievement(wallet, 'blind-eye');
    if (r.awarded) {
      awarded.push('blind-eye');
      if (DEBUG) console.log('Achievement awarded: blind-eye to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  return awarded;
}

/**
 * Check sum-of-all-fears for Kakuro.
 * Every cell correct on first attempt (no duplicate cell entries with incorrect first value).
 */
export function checkSumOfAllFears(wallet, placements) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || !placements || placements.length === 0) return [];

  // Track first attempt per cell
  var firstAttempts = {};
  var anyIncorrectFirst = false;
  for (var i = 0; i < placements.length; i++) {
    var p = placements[i];
    if (firstAttempts[p.cell] === undefined) {
      firstAttempts[p.cell] = p.correct;
      if (!p.correct) { anyIncorrectFirst = true; break; }
    }
  }

  var awarded = [];
  if (!anyIncorrectFirst && Object.keys(firstAttempts).length > 0) {
    var r = awardAchievement(wallet, 'sum-of-all-fears');
    if (r.awarded) {
      awarded.push('sum-of-all-fears');
      if (DEBUG) console.log('Achievement awarded: sum-of-all-fears to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    }
  }

  return awarded;
}

// ── Batch 7: Meta, per-game volume, absurd, wooden spoons ────────────

var LEAGUE_CAPABLE_GAMES = ['sudoku-duel', 'kenken', 'minesweeper', 'freecell', 'kakuro', 'nonogram', 'poker-patience', 'cribbage-solitaire'];

var FIBONACCI_SET = new Set([1,2,3,5,8,13,21,34,55,89,144,233,377,610,987,1597,2584,4181,6765]);

function tryAwardStandalone(wallet, id) {
  var r = awardAchievement(wallet, id);
  if (r.awarded) {
    if (DEBUG) console.log('Achievement awarded: ' + id + ' to ' + wallet.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
    return true;
  }
  return false;
}

/**
 * Check per-game volume and wooden spoon achievements at league settlement.
 * Call once per player after positions are finalised.
 */
export function checkSettlementBatch7(wallet, leagueId, gameId, position, totalPlayers) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  var db = getDb();
  var w = wallet.toLowerCase();

  // ── Per-game volume ─────────────────────────────────────────────
  // specialist: 10 settled leagues on this game
  var gameLeagues = db.prepare("SELECT COUNT(*) as c FROM league_players lp JOIN leagues l ON lp.league_id = l.id WHERE lp.wallet = ? AND l.game_id = ? AND l.status = 'settled'").get(w, gameId);
  if (gameLeagues && gameLeagues.c >= 10) {
    if (tryAwardStandalone(wallet, 'specialist')) awarded.push('specialist');
  }

  // master-of-one: 3 wins on this game
  var gameWins = db.prepare("SELECT COUNT(*) as c FROM league_prizes lp JOIN leagues l ON lp.league_id = l.id WHERE lp.wallet = ? AND lp.position = 1 AND l.game_id = ?").get(w, gameId);
  if (gameWins && gameWins.c >= 3) {
    if (tryAwardStandalone(wallet, 'master-of-one')) awarded.push('master-of-one');
  }

  // world-tour: played at least one settled league on every league-capable game
  var distinctGames = db.prepare("SELECT COUNT(DISTINCT l.game_id) as c FROM league_players lp JOIN leagues l ON lp.league_id = l.id WHERE lp.wallet = ? AND l.status = 'settled' AND l.game_id IN (" + LEAGUE_CAPABLE_GAMES.map(function() { return '?'; }).join(',') + ")").get(w, ...LEAGUE_CAPABLE_GAMES);
  if (distinctGames && distinctGames.c >= 8) {
    if (tryAwardStandalone(wallet, 'world-tour')) awarded.push('world-tour');
  }

  // high-roller: silver league on every league-capable game
  var silverGames = db.prepare("SELECT COUNT(DISTINCT l.game_id) as c FROM league_players lp JOIN leagues l ON lp.league_id = l.id WHERE lp.wallet = ? AND l.tier = 'silver' AND l.game_id IN (" + LEAGUE_CAPABLE_GAMES.map(function() { return '?'; }).join(',') + ")").get(w, ...LEAGUE_CAPABLE_GAMES);
  if (silverGames && silverGames.c >= 8) {
    if (tryAwardStandalone(wallet, 'high-roller')) awarded.push('high-roller');
  }

  // ── Breadwinner (prizes > entry fees, min 10 leagues) ───────────
  var leagueCount = db.prepare("SELECT COUNT(*) as c FROM league_players WHERE wallet = ?").get(w);
  if (leagueCount && leagueCount.c >= 10) {
    var totalPrizes = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM league_prizes WHERE wallet = ?").get(w);
    var totalFees = db.prepare("SELECT COALESCE(SUM(l.entry_fee), 0) as total FROM league_players lp JOIN leagues l ON lp.league_id = l.id WHERE lp.wallet = ?").get(w);
    if (totalPrizes && totalFees && totalPrizes.total > totalFees.total) {
      if (tryAwardStandalone(wallet, 'breadwinner')) awarded.push('breadwinner');
    }
  }

  // ── Wooden spoons ───────────────────────────────────────────────
  // the-optimist: finish last in 10 leagues (with at least 1 puzzle submitted)
  if (position === totalPlayers && totalPlayers >= 4) {
    var scores = getLeagueScoresByWallet(leagueId, wallet);
    if (scores.length >= 1) {
      incrementWalletCounter(wallet, 'optimist_count');
      var optStats = getWalletStats(wallet);
      if (optStats && optStats.optimist_count >= 10) {
        if (tryAwardStandalone(wallet, 'the-optimist')) awarded.push('the-optimist');
      }
    }
  }

  // score-one: total league score = 1
  var scores = getLeagueScoresByWallet(leagueId, wallet);
  var totalScore = scores.reduce(function(s, r) { return s + r.score; }, 0);
  if (totalScore === 1) {
    if (tryAwardStandalone(wallet, 'score-one')) awarded.push('score-one');
  }

  // the-pacifist: Kakuro league, score 0 on all puzzles
  if (gameId === 'kakuro') {
    var puzzles = getLeaguePuzzles(leagueId);
    if (scores.length === puzzles.length && scores.length > 0 && totalScore === 0) {
      if (tryAwardStandalone(wallet, 'the-pacifist')) awarded.push('the-pacifist');
    }
  }

  // dnf-king: in league_players but 0 scores submitted or all scores = 0
  if (scores.length === 0) {
    if (tryAwardStandalone(wallet, 'dnf-king')) awarded.push('dnf-king');
  }

  // memory-loss: Sudoku Duel league puzzle with any mistake
  if (gameId === 'sudoku-duel') {
    var anyMistake = scores.some(function(s) { return (s.mistakes || 0) > 0; });
    if (anyMistake) {
      if (tryAwardStandalone(wallet, 'memory-loss')) awarded.push('memory-loss');
    }
  }

  // slow-burn: Minesweeper league, highest total time of anyone (all 10 submitted)
  // last-and-slow: last place AND highest total time
  // These require comparing across all players — handled separately below

  return awarded;
}

/**
 * Check slow-burn and last-and-slow at Minesweeper league settlement.
 * Must be called once per league (not per player) after all players are processed.
 */
export function checkSlowBurnAndLastSlow(leagueId, gameId, leaderboard) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (gameId !== 'minesweeper') return [];

  var awarded = [];
  var db = getDb();
  var puzzles = getLeaguePuzzles(leagueId);

  var playerTimes = [];
  for (var i = 0; i < leaderboard.length; i++) {
    var w = leaderboard[i].wallet;
    var scores = getLeagueScoresByWallet(leagueId, w);
    if (scores.length !== puzzles.length) continue;
    var totalTime = scores.reduce(function(s, r) { return s + (r.time_ms || 0); }, 0);
    playerTimes.push({ wallet: w, totalTime: totalTime, position: i + 1 });
  }

  if (playerTimes.length < 2) return awarded;

  playerTimes.sort(function(a, b) { return b.totalTime - a.totalTime; });
  var slowest = playerTimes[0];

  // slow-burn: slowest total time among those who completed all puzzles
  if (tryAwardStandalone(slowest.wallet, 'slow-burn')) awarded.push('slow-burn');

  // last-and-slow: last place AND slowest time
  var lastPosition = leaderboard.length;
  if (slowest.position === lastPosition) {
    if (tryAwardStandalone(slowest.wallet, 'last-and-slow')) awarded.push('last-and-slow');
  }

  return awarded;
}

/**
 * Check flagless-and-wrong on Minesweeper league puzzle submission.
 * flags_used = 0 AND detonated (mistakes > 0).
 */
export function checkFlaglessAndWrong(wallet, flagsUsed, mistakes) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  if (flagsUsed === 0 && mistakes > 0) {
    if (tryAwardStandalone(wallet, 'flagless-and-wrong')) awarded.push('flagless-and-wrong');
  }
  return awarded;
}

/**
 * Check the-grinder at league join (1,000 QF cumulative entry fees).
 */
export function checkTheGrinder(wallet) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var db = getDb();
  var w = wallet.toLowerCase();
  var totalFees = db.prepare("SELECT COALESCE(SUM(l.entry_fee), 0) as total FROM league_players lp JOIN leagues l ON lp.league_id = l.id WHERE lp.wallet = ?").get(w);
  var awarded = [];
  if (totalFees && totalFees.total >= 1000) {
    if (tryAwardStandalone(wallet, 'the-grinder')) awarded.push('the-grinder');
  }
  return awarded;
}

/**
 * Check pioneer-hunter and the-whale at mint time.
 */
export function checkMintMeta(wallet) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  var db = getDb();
  var w = wallet.toLowerCase();

  // pioneer-hunter: 4+ pioneer tags minted
  var pioneers = db.prepare("SELECT COUNT(*) as c FROM achievement_eligibility WHERE wallet = ? AND is_pioneer = 1 AND minted_at IS NOT NULL").get(w);
  if (pioneers && pioneers.c >= 4) {
    if (tryAwardStandalone(wallet, 'pioneer-hunter')) awarded.push('pioneer-hunter');
  }

  // the-whale: 10,000+ QF spent on minting
  var stats = getWalletStats(wallet);
  if (stats && stats.total_qf_minted >= 10000) {
    if (tryAwardStandalone(wallet, 'the-whale')) awarded.push('the-whale');
  }

  return awarded;
}

/**
 * Check duel-master on duel win.
 * 10 completed duel wins regardless of opponent.
 */
export function checkDuelMaster(wallet) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  var wins = getDuelWinCount(wallet);
  if (wins >= 10) {
    if (tryAwardStandalone(wallet, 'duel-master')) awarded.push('duel-master');
  }

  return awarded;
}

/**
 * Check midnight achievement — game completed between 00:00:00 and 00:00:59 UTC.
 */
export function checkMidnight(wallet) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var now = new Date();
  var awarded = [];
  if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
    if (tryAwardStandalone(wallet, 'midnight')) awarded.push('midnight');
  }
  return awarded;
}

/**
 * Check fibonacci streak — 5 consecutive games with a Fibonacci score.
 */
export function checkFibonacci(wallet, score) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet || score === undefined) return [];

  var awarded = [];
  if (FIBONACCI_SET.has(score)) {
    incrementWalletCounter(wallet, 'fibonacci_streak');
    var stats = getWalletStats(wallet);
    if (stats && stats.fibonacci_streak >= 5) {
      if (tryAwardStandalone(wallet, 'fibonacci')) awarded.push('fibonacci');
    }
  } else {
    resetWalletCounter(wallet, 'fibonacci_streak');
  }
  return awarded;
}

/**
 * Check wrong-answer-streak for Prime or Composite.
 * Track on the in-memory session and persist to wallet_stats.
 */
export function checkWrongAnswerStreak(wallet, correct) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!wallet) return [];

  var awarded = [];
  if (!correct) {
    incrementWalletCounter(wallet, 'prime_wrong_streak');
    var stats = getWalletStats(wallet);
    if (stats && stats.prime_wrong_streak >= 10) {
      if (tryAwardStandalone(wallet, 'wrong-answer-streak')) awarded.push('wrong-answer-streak');
    }
  } else {
    resetWalletCounter(wallet, 'prime_wrong_streak');
  }
  return awarded;
}

/**
 * Check Regicide and Detention at league settlement.
 * Regicide: finish above an OWNER_WALLET in a league.
 * Detention: finish below an OWNER_WALLET in a league.
 * Owner wallets themselves are excluded from both.
 *
 * @param {Array} leaderboard - sorted array of { wallet, total_score }, position 0 = 1st
 */
export function checkRegicideDetention(leaderboard) {
  if (!ACHIEVEMENTS_ACTIVE) return [];
  if (!leaderboard || leaderboard.length < 2) return [];
  if (OWNER_WALLETS.length === 0) return [];

  var awarded = [];

  // Find the best-placed owner wallet in this league
  var ownerPosition = -1;
  for (var i = 0; i < leaderboard.length; i++) {
    if (OWNER_WALLETS.indexOf(leaderboard[i].wallet.toLowerCase()) !== -1) {
      ownerPosition = i;
      break;
    }
  }

  // No owner wallet in this league — nothing to award
  if (ownerPosition === -1) return awarded;

  for (var j = 0; j < leaderboard.length; j++) {
    var w = leaderboard[j].wallet.toLowerCase();
    // Skip owner wallets
    if (OWNER_WALLETS.indexOf(w) !== -1) continue;

    if (j < ownerPosition) {
      // Finished above the owner — Regicide
      var r = awardAchievement(w, 'regicide');
      if (r.awarded) {
        awarded.push('regicide:' + w.slice(0, 8));
        if (DEBUG) console.log('Achievement awarded: regicide to ' + w.slice(0, 8) + '...' + (r.pioneer ? ' (PIONEER)' : ''));
      }
    } else if (j > ownerPosition) {
      // Finished below the owner — Detention
      var d = awardAchievement(w, 'detention');
      if (d.awarded) {
        awarded.push('detention:' + w.slice(0, 8));
        if (DEBUG) console.log('Achievement awarded: detention to ' + w.slice(0, 8) + '...' + (d.pioneer ? ' (PIONEER)' : ''));
      }
    }
  }

  return awarded;
}

