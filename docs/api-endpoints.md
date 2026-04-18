# API Endpoints — `https://dapp-api.mathswins.co.uk/api/dapp`

Local dev: `http://127.0.0.1:3860/api/dapp`

## Auth
- `POST /auth/challenge` — get sign challenge
- `POST /auth/verify` — verify signature, return JWT (24h)

## Sessions
- `POST /session/start` — start game session (params: gameId, difficulty, leagueId)
- `POST /session/resume` — resume existing session (contextType, contextId)
- `POST /session/evaluate` — submit move/answer, returns sessionId in response
- `POST /session/submit-freeplay` — submit free play score, creates active_game_state row, returns sessionId. clientStats forwards 24 fields incl. `perfectGame` (HoL Clairvoyant) and `exactHit` (Countdown On-the-nose)

## Maffsy
- `POST /maffsy/complete` — record daily Maffsy result (won, guesses, wordId). Returns `{ success, sessionId, streak, maxStreak, played, won }`. sessionId enables global-leaderboard prompt. Fires achievement checks (wordy, binary-decision, the-novelist, feel-no-pressure).
- `GET /maffsy/stats` — wallet's maffsy streak history

## Leaderboard (legacy weekly)
- `GET /leaderboard/:gameId`
- `GET /leaderboard/:gameId/:weekId`
- `GET /pot/:gameId`
- `GET /games`
- `GET /week`
- `GET /entry/:gameId`

## Duels
- `POST /duel/precheck` — validate eligibility before payment
- `POST /duel/create` — create duel (requires txHash)
- `POST /duel/:code/accept` — accept duel (requires txHash)
- `POST /duel/:code/submit` — submit duel score
- `GET /duel/config` — returns { escrowAddress, defaultStake: 25 }
- `GET /duel/:code` — duel status
- `GET /duels/history` — wallet duel history

## Promos
- `POST /promo/create`
- `POST /promo/:code/submit`
- `GET /promo/:code`

## Leagues
- `GET /leagues/:gameId` — open leagues for game
- `GET /leagues/:gameId/all`
- `GET /league/:leagueId`
- `GET /league/:leagueId/puzzles`
- `GET /league/:leagueId/my-scores`
- `POST /league/:leagueId/join`
- `POST /league/:leagueId/submit`

## League v2 (player-facing)
- `GET /leagues/my`
- `GET /leagues/active`
- `GET /leagues/settled`

## League v2 (admin)
- `POST /admin/league/:id/settle`
- `POST /admin/league/:id/cancel`
- `POST /admin/league/:id/refund/:wallet`
- `GET /admin/refunds`

## Battleships
- `POST /battleships/create`
- `POST /battleships/:code/join`
- `POST /battleships/:code/place`
- `POST /battleships/:code/shoot`
- `POST /battleships/:code/forfeit`
- `GET /battleships/:code`
- `GET /battleships/history`
- `GET /battleships/active` — games where it's the wallet's turn: `[{ code, opponent, turn_deadline, started_at }]`

## Achievements
- `GET /achievements/status`
- `GET /achievements/all`
- `GET /achievements/my`
- `GET /achievements/record/:id`
- `POST /achievement/mint` — real on-chain mint, fee split (5% burn 95% team), free mints use banked credits
- `POST /admin/achievement/register`
- `POST /admin/achievement/award`
- `GET /admin/achievements`
- `GET /admin/schema` — inspect live DB
- `GET /admin/ledger` — escrow accounting (auth: x-admin-key header)

## Profile
- `GET /profile/:wallet` — public, no auth, 60/min rate limit. Returns: personal_bests, league_bests, achievements, wallet_stats, league_history, trophies, leaderboard_positions

## Global Leaderboard
- `GET /global-leaderboard/:gameId/:periodType` — top entries
- `GET /global-leaderboard/:gameId/eligibility?periodType=&score=&timeMs=` — checks top 25, requires status==='completed'
- `POST /global-leaderboard/enter` — 50 QF entry, requires txHash, accepts periodTypes array (one payment, multiple periods). Body now includes `qnsName` from connected wallet (cached `qfWallet.qfName` with `resolveAny()` fallback).
- `GET /global-leaderboard/my-positions`

## Platform Stats
- `GET /stats/platform` — public, no auth. Returns `{ games_played, qf_burned }`. games_played = SUM(free_game_completions.count) + COUNT(league_scores) + COUNT(duels.completed) + COUNT(battleships_games.complete). qf_burned = SUM escrow_ledger out/burn.

## Telegram (admin)
- `GET /admin/telegram/test?type=X` — fires sample notification (admin-gated). Types: league_open, league_closed, league_minimum_reached, league_settled, achievement_minted, achievement_pioneer. Returns `{ queued, text, enabled }`. **Note:** admin auth not configured on Box 1 — endpoint returns 403 externally; in-process node import bypasses for testing.
