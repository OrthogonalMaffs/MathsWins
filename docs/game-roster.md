# Game Roster & Lobby Structure

## Lobby (qf-dapp/index.html) — 4 tabs

**Leagues tab:** 2×2 grid — Sudoku Duel (silver pulse), KenKen, Minesweeper, FreeCell. MW logo centre. Cards link to `/league/` lobby pages.

**Duels tab:** 10 duel-capable games — Sudoku Duel, Battleships, KenKen, Kakuro, Countdown Numbers, Nonogram, Minesweeper, FreeCell, Poker Patience, Cribbage Solitaire. Variable stake (min 25 QF). Cards link with `?mode=duel` — scrolls duel button into view with gold flash.

**Free tab:** 12 free games with instant search — Maffsy, Higher or Lower, 52-dle, Towers of Hanoi, Don't Press It, Memory Matrix, RPS vs Machine, Estimation Engine, Sequence Solver, Prime or Composite, Cryptarithmetic Club, Battleships (vs CPU).

**Leaderboards tab:** Game selector (20 games, Battleships excluded), Daily/Weekly/Monthly toggle, top 10 + expand. Fetches from `/api/dapp/global-leaderboard/:gameId/:periodType`.

## Game Registry

| Game | Slug | League | Duel | Free | Notes |
|------|------|--------|------|------|-------|
| Sudoku Duel | sudoku-duel | ✓ active | ✓ | – | |
| KenKen | kenken | ✓ active | ✓ | – | |
| Minesweeper | minesweeper | ✓ active | ✓ | – | |
| FreeCell | freecell | ✓ active | ✓ | – | |
| Kakuro | kakuro | capable | ✓ | – | |
| Nonogram | nonogram | capable | ✓ | – | |
| Poker Patience | poker-patience | capable | ✓ | – | |
| Cribbage Solitaire | cribbage-solitaire | capable | ✓ | – | |
| Battleships | battleships | – | ✓ PvP | ✓ CPU | Deep link: `?code=` not `?duel=` |
| Countdown Numbers | countdown-numbers | – | ✓ | ✓ | Demoted from competitive |
| Maffsy | maffsy | – | – | ✓ | Renamed from Equatle. `/maffsy/complete` now issues sessionId; leaderboard prompt + 4 achievements wired (2026-04-18) |
| Higher or Lower | higher-or-lower | – | – | ✓ | |
| 52-dle | 52dle | – | – | ✓ | |
| Towers of Hanoi | towers-of-hanoi | – | – | ✓ | |
| Don't Press It | dont-press-it | – | – | ✓ | |
| Memory Matrix | memory-matrix | – | – | ✓ | |
| RPS vs Machine | rps-vs-machine | – | – | ✓ | |
| Estimation Engine | estimation-engine | – | – | ✓ | |
| Sequence Solver | sequence-solver | – | – | ✓ | |
| Prime or Composite | prime-or-composite | – | – | ✓ | |
| Cryptarithmetic Club | cryptarithmetic-club | – | – | ✓ | Demoted from competitive |

**Leaderboard prompt wiring:** 22 of 23 games wired (Maffsy added 2026-04-18). **1 skipped:** battleships free-play (vs CPU) — no server-side completion path, no sessionId. Battleships still needs a new backend endpoint or extension of submit-freeplay with a battleships-CPU schema; score field also needs definition (binary win/loss has no numeric score). Duel/PvP battleships goes through QFSettlement, not the leaderboard.

## Scoring Rules

**KenKen:** Base 5000, −1pt/sec after 60s grace, −300 per incorrect grid submission, −500 per hint. 3 incorrect submissions = game over (pity score: correctCells × 20). Server tracks `submitFailures` (grid submissions) separately from `mistakes` (cell errors).

**KenKen / Kakuro / Nonogram:** Scoring bug fixed 2026-04-11 — penalises grid submissions, not cell errors.

**Minesweeper:** Base 5000, −1pt/sec. Detonation = game over (0 pts). First click always safe (mines placed after).

**Global leaderboard upsert rules:**
- Time-primary games: lower time = better (minesweeper, freecell, kenken, nonogram, kakuro, sudoku-duel)
- Score-primary games: higher score = better

## Battleships Detail
- Turn-based async duels (no simultaneous)
- vs CPU: 3 difficulties (Recruit, Officer, Admiral — Admiral uses probability density map)
- 24h auto-shot timeout, 5-min sweep
- Settlement: 90% winner, 5% burn, 5% team
- `turn_deadline` exposed in GET /battleships/:code
- Move notifications: hub-level popup (wallet connect + 5min poll), thresholds at 12h/4h/1h
