# DB Schema — SQLite at `/home/jon/mathswins-dapp/data/mathswins.db`

## Tables (32)

| Table | Purpose |
|-------|---------|
| `games` | Game registry |
| `entries` | Paid game entries per wallet/week |
| `sessions` | Game session records (+ last_activity_at for marathon tracking) |
| `best_scores` | Leaderboard — best score per wallet/game/week (legacy, empty) |
| `settlements` | Prize settlement records |
| `duels` | 1v1 duel challenges |
| `leagues` | League instances (game, tier, fee, status, schedule, pot) |
| `league_players` | Players per league (wallet, tx, puzzle_order) |
| `league_puzzles` | Pre-generated puzzle seeds per league |
| `league_scores` | Puzzle scores per player per league (+ mistake_count, hints_used, undos_used, free_cells_used, flags_used, helper_used) |
| `league_prizes` | Prize payouts per position |
| `promo_challenges` | Promo/challenge codes |
| `promo_claims` | Claims against promo challenges |
| `active_game_state` | Persistent session state for resume (league + free-play sessions) |
| `league_refunds` | Refund tracking for cancelled leagues |
| `battleships_games` | Battleships duel instances |
| `battleships_placements` | Fleet positions per player per game |
| `battleships_rounds` | Shot history per game |
| `battleships_record` | Win/loss/draw per wallet |
| `achievement_registry` | 163 total / 162 active (v4 spec), 32 categories, `tier` + `category` columns |
| `achievement_eligibility` | Per-wallet achievement progress and mint status |
| `global_records` | Community records (e.g. The Tortoise slowest win) |
| `wallet_stats` | Per-wallet tracking (streaks, spending, mints, consecutive wins, golf/pyramid failures, `maffsy_clean_streak` for feel-no-pressure) |
| `personal_bests` | Best free play score per wallet/game/difficulty. Columns: wallet, game_id, difficulty, score, time_ms, achieved_at, session_id (nullable) |
| `league_bests` | Best league total score per wallet/game/tier (upserted at settlement for ALL players) |
| `game_messages` | Preset messages for duels and leagues |
| `seasonal_windows` | Seasonal achievement earning windows (pre-populated per year) |
| `commemorative_mints` | Commemorative NFT mint records per league |
| `global_leaderboard_entries` | Pay-to-appear global leaderboard (50 QF, daily/weekly/monthly) |
| `free_game_completions` | Per-wallet free game play count + PB beaten tracking |
| `escrow_ledger` | All sendQF calls with direction/type/amount/source/reference_id. `inferred` flag (0=on-chain parsed, 1=computed fallback) |

## Key Notes

**personal_bests upsert rules:**
- Time-primary games (minesweeper, freecell, kenken, nonogram, kakuro, sudoku-duel): lower time = better
- Score-primary games (estimation-engine, countdown-numbers, etc.): higher score = better
- session_id populated via evaluate path; submit-freeplay path does NOT populate session_id on personal_bests yet

**active_game_state:**
- `startFreeSession` writes a row for all continuous-mode sessions (not just league) — enabler for leaderboard prompt
- `evaluate` sets `response.sessionId = payload.sid` at both return points
- **Gameover persistence (fixed 2026-04-18 commit 95cf734):** scoring.mjs gameover and failed-submit branches now call `persistSession` immediately before `completeGameState`. Prior behaviour: `mistakes` and `hints_used` columns froze one action behind on any gameover (because `completeGameState` only writes status/score/flagged/completed_at, and `persistSession` lived only in the regular-action else-branch). Historical rows pre-fix have stale counters by design.

**escrow_ledger event types:**
- `FeeSplit(burned, team)` → 2 rows (burn + team)
- `Settled(winner, winnerAmount, burned, team)` → 3 rows (winner + burn + team)
- `SettledDraw(p1, p2, eachAmount, burned, team)` → 4 rows (draw-payout×2 + burn + team)
- Legacy `type='settle'` / `type='settle-draw'` rows pre-2026-04-17 remain as historical record
