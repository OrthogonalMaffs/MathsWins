/**
 * Achievement condition checker.
 * Called after league settlement, duel completion, or session completion.
 * Gated by ACHIEVEMENTS_ACTIVE env var.
 */
import { awardAchievement, getWalletAchievements, getWalletStats, incrementWalletCounter, resetWalletCounter, getLeagueScoresByWallet, getLeaguePuzzles, getAllLeagueScores, getGlobalRecord, setGlobalRecord } from './db/index.mjs';

const ACHIEVEMENTS_ACTIVE = process.env.ACHIEVEMENTS_ACTIVE === 'true';

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
    // TODO: dedicated — leagueCount >= 50
    // TODO: veteran — leagueCount >= 100
    // TODO: legend — leagueCount >= 500
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
    // TODO: dominant — winCount >= 20
    // TODO: hat-trick — won 3 different game leagues
    // TODO: the-completionist — won a league in every registered game
    // TODO: the-tortoise — won with the slowest total_time in the league
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
  if (context.type === 'duel_complete' && context.won) {
    // first-blood: first duel win
    tryAward('first-blood');
    // TODO: duelist — 10 duel wins
    // TODO: gladiator — 50 duel wins
    // TODO: heartbreaker — win by 1 point
    // TODO: giant-slayer — beat someone with more total wins
    // TODO: the-wall — win 5 consecutive duels (use wallet_stats.consecutive_duel_wins)
  }

  // ── Purity achievements (no errors) ───────────────────────────────
  // TODO: no-errors-sudoku — complete sudoku-duel league puzzle with 0 mistakes
  // TODO: no-errors-minesweeper — complete minesweeper league puzzle with 0 mistakes
  // TODO: no-errors-freecell — complete freecell league puzzle with 0 mistakes
  // TODO: no-errors-countdown — complete countdown-numbers league puzzle with 0 mistakes
  // TODO: no-errors-cryptarithmetic — complete cryptarithmetic-club league puzzle with 0 mistakes
  // TODO: no-errors-kenken — complete kenken league puzzle with 0 mistakes
  // TODO: no-errors-nonogram — complete nonogram league puzzle with 0 mistakes
  // TODO: no-errors-kakuro — complete kakuro league puzzle with 0 mistakes
  // TODO: immaculate — hold all 8 no-errors achievements (requires contract interaction)

  // ── clientStats-dependent purity achievements ─────────────────────
  if (context.type === 'league_settle' && context.leagueId) {
    var scores = getLeagueScoresByWallet(context.leagueId, wallet);
    var puzzles = getLeaguePuzzles(context.leagueId);
    var completedAll = scores.length === puzzles.length && scores.length > 0;

    if (completedAll) {
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

    // ── Clean Slate & The Lurker (round-based leaderboard reconstruction) ──
    if (context.won) {
      var allScores = getAllLeagueScores(context.leagueId);
      var puzzleCount = puzzles.length;

      // Group scores by wallet, sorted by submitted_at within each wallet
      var byWallet = {};
      for (var gi = 0; gi < allScores.length; gi++) {
        var gw = allScores[gi].wallet;
        if (!byWallet[gw]) byWallet[gw] = [];
        byWallet[gw].push(allScores[gi]);
      }
      for (var wk in byWallet) {
        byWallet[wk].sort(function(a, b) { return a.submitted_at - b.submitted_at; });
      }

      // Only include wallets that completed all puzzles
      var completingWallets = [];
      for (var cw in byWallet) {
        if (byWallet[cw].length === puzzleCount) completingWallets.push(cw);
      }

      // Build round snapshots: round N = cumulative score after each wallet's Nth submission
      var winnerWallet = wallet.toLowerCase();
      var wasEverLast = false;
      var wasEverTop3 = false;

      if (completingWallets.length >= 4) {
        for (var rn = 1; rn <= puzzleCount; rn++) {
          var round = [];
          var allHaveN = true;
          for (var ri = 0; ri < completingWallets.length; ri++) {
            var wScores = byWallet[completingWallets[ri]];
            if (wScores.length < rn) { allHaveN = false; break; }
            var cumulative = 0;
            for (var rs = 0; rs < rn; rs++) cumulative += wScores[rs].score;
            round.push({ wallet: completingWallets[ri], cumulative: cumulative });
          }
          if (!allHaveN || round.length < 2) continue;

          round.sort(function(a, b) { return b.cumulative - a.cumulative; });

          var isFinalRound = rn === puzzleCount;
          var winnerPos = -1;
          for (var wp = 0; wp < round.length; wp++) {
            if (round[wp].wallet === winnerWallet) { winnerPos = wp + 1; break; }
          }

          if (!isFinalRound) {
            if (winnerPos === round.length) wasEverLast = true;
            if (winnerPos >= 1 && winnerPos <= 3) wasEverTop3 = true;
          }
        }

        // Clean Slate: winner never appeared in last place (pre-final rounds)
        if (!wasEverLast) {
          tryAward('clean-slate');
        }

        // The Lurker: winner never appeared in top 3 until final round
        if (!wasEverTop3) {
          tryAward('the-lurker');
        }
      }
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
  // TODO: the-collector — earn 10 achievements
  // TODO: pioneer-hunter — be the pioneer for 3 achievements
  // TODO: the-whale — spend 1000+ QF on mint fees

  // ── Impossible ────────────────────────────────────────────────────
  // TODO: boom — conditions TBD (admin/manual or extreme edge case)

  return awarded;
}
