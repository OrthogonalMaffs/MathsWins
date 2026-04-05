/**
 * Achievement condition checker.
 * Called after league settlement, duel completion, or session completion.
 * Gated by ACHIEVEMENTS_ACTIVE env var.
 */
import { awardAchievement, getWalletAchievements } from './db/index.mjs';

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
  // TODO: the-purist — complete 10 freecell games with 0 undo and 0 mistakes
  // TODO: flawless-line — complete minesweeper with 0 mistakes in under 2 minutes
  // TODO: immaculate — hold all 8 no-errors achievements (requires contract interaction)

  // ── Skill achievements ────────────────────────────────────────────
  // TODO: clean-sweep — minesweeper perfect score (no misclicks)
  // TODO: sub-minute — sudoku-duel completed in under 60 seconds
  // TODO: untouchable — win a league without using any hints
  // TODO: the-undo-king — freecell game with 50+ undos and still win
  // TODO: wrong-answer-streak — get 5 wrong in a row in prime-or-composite

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
