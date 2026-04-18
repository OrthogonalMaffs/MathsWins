# API Endpoints — `https://dapp-api.mathswins.co.uk/api/dapp`

Local dev: `http://127.0.0.1:3860/api/dapp`

## Auth
- `POST /auth/challenge` — get sign challenge
- `POST /auth/verify` — verify signature, return JWT (24h)

## Sessions
- `POST /session/start` — start game session (params: gameId, difficulty, leagueId)
- `POST /session/resume` — resume existing session (contextType, contextId)
- `POST /session/evaluate` — submit move/answer, returns sessionId in response
- `POST /session/submit-freeplay` — submit free play score, creates active_game_state row, returns sessionId

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
- `POST /global-leaderboard/enter` — 50 QF entry, requires txHash, accepts periodTypes array (one payment, multiple periods)
- `GET /global-leaderboard/my-positions`
