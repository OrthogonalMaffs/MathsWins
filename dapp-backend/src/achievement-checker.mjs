/**
 * Achievement condition checker.
 * Called after league settlement, duel completion, or session completion.
 * Gated by ACHIEVEMENTS_ACTIVE env var.
 */
import { awardAchievement, getWalletAchievements, getWalletStats, incrementWalletCounter, resetWalletCounter, upsertWalletStats, getLeagueScoresByWallet, getLeaguePuzzles, getAllLeagueScores, getGlobalRecord, setGlobalRecord, getEarnedAchievementCount, getActiveSeasonalWindows, getCompletedLeagueCount, getLeagueWinCount, getLeagueWinsByGame, getDuelWinCount, isRecentLeagueChampion, getBattleshipsRounds, getBattleshipsPlacement, getBattleshipsGameById, getBattleshipsRecord, incrementFreeGameCompletion, getDistinctFreeGamesPlayed } from './db/index.mjs';
import { checkSunk } from './games/battleships.mjs';

const ACHIEVEMENTS_ACTIVE = process.env.ACHIEVEMENTS_ACTIVE === 'true';

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
      console.log('Achievement awarded: ' + achievementId + ' to ' + wallet.slice(0, 8) + '...' + (result.pioneer ? ' (PIONEER)' : ''));
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
      console.log('Achievement awarded: ' + achievementId + ' to ' + wallet.slice(0, 8) + '...' + (result.pioneer ? ' (PIONEER)' : ''));
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
      console.log('Achievement awarded: ' + achievementId + ' to ' + wallet.slice(0, 8) + '...' + (result.pioneer ? ' (PIONEER)' : ''));
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
    } catch (e) {
      console.error('Free game achievement check error:', e.message);
    }
  }

  // ── Skill achievements ────────────────────────────────────────────
  // TODO: clean-sweep — minesweeper perfect score (no misclicks)
  // TODO: sub-minute — sudoku-duel completed in under 60 seconds
  // TODO: untouchable — win a league without using any hints
  // TODO: the-undo-king — freecell game with 50+ undos and still win
  // TODO: wrong-answer-streak — get 5 wrong in a row in prime-or-composite

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
    // the-mathematician: score is exactly 3141
    if (context.score === 3141) {
      tryAward('the-mathematician');
    }
    // palindrome: score reads the same forwards and backwards
    const scoreStr = String(context.score);
    if (scoreStr.length > 1 && scoreStr === scoreStr.split('').reverse().join('')) {
      tryAward('palindrome');
    }
  }
  // TODO: lucky-number — freecell game #7777
  // TODO: speedrun-to-zero — sudoku-duel score of exactly 0
  // TODO: flag-everything — flag every cell in minesweeper

  // ── Time & Dedication achievements ────────────────────────────────
  const hour = new Date().getUTCHours();
  // night-owl: complete a game between 03:00 and 05:00 UTC
  if (hour >= 3 && hour < 5) {
    tryAward('night-owl');
  }
  // TODO: weekend-warrior — play every Saturday for 4 consecutive weeks (use wallet_stats.saturday_streak)
  // TODO: the-marathon — single session lasting over 2 hours

  // ── Community achievements ────────────────────────────────────────
  // TODO: duel-master — create 10 duels that get accepted and completed
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
