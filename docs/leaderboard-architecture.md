# Leaderboard Architecture

## Schema — `global_leaderboard_entries`

```
id          INTEGER PRIMARY KEY AUTOINCREMENT
wallet      TEXT NOT NULL
game_id     TEXT NOT NULL
difficulty  TEXT DEFAULT 'default'        -- added 2026-04-19
score       INTEGER NOT NULL
time_ms     INTEGER
period_type TEXT NOT NULL                 -- daily | weekly | monthly
period_key  TEXT NOT NULL                 -- YYYY-MM-DD / YYYY-W## / YYYY-MM
session_id  TEXT NOT NULL
paid_at     INTEGER NOT NULL
tx_hash     TEXT
suspicious  INTEGER DEFAULT 0
qns_name    TEXT
UNIQUE(wallet, game_id, difficulty, period_type, period_key)
```

Composite UNIQUE includes `difficulty` so a wallet can hold one entry per (game, difficulty, period) — e.g. separate beginner and expert minesweeper rows for the same day. Pre-existing rows were migrated to `difficulty='default'` via a table rebuild (SQLite can't add UNIQUE via ALTER). The migration is idempotent on `db/index.mjs` init — checks `sqlite_master` for the `difficulty` column and skips if present.

**Sort direction (`db/index.mjs:getGlobalLeaderboard`):**
- `TIME_PRIMARY_GAMES = {minesweeper, freecell, nonogram, kakuro}` → `ORDER BY time_ms ASC, score DESC`
- Everything else → `ORDER BY score DESC, time_ms ASC`

`TIME_PRIMARY_GAMES` is exported and shared between the sort, the `isBetterEntry` comparator, and the frontend grid's `LB_TIME_PRIMARY` lookup — single source of truth.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET  | `/global-leaderboard/:gameId/:periodType` | Ranked list. Optional `?difficulty=` filter. No filter → cross-difficulty. |
| GET  | `/global-leaderboard/:gameId/eligibility` | Single-tuple eligibility probe (in-game prompt). Server derives difficulty from session. |
| POST | `/global-leaderboard/eligibility` | **Batch** — accepts `{ tuples: [{gameId, difficulty, score, timeMs, sessionId}, ...] }` (max 50). Returns per-period results `{shouldPrompt, alreadyEntered, wouldUpdate, rank, totalEntries, periodKey}` per tuple. Used by My Account for per-difficulty × 3 periods probing in one round-trip. |
| POST | `/global-leaderboard/enter` | Pay 50 QF. Handles new entries AND better-than-existing updates. See gate order in `docs/payment-architecture.md`. |
| GET  | `/global-leaderboard/my-positions` | Wallet's current ranks across all games/periods. |

GET endpoints in this section are **whitelisted from the global rate limiter** — the lobby grid renders ~26 cards and fires one fetch per card per period toggle, so a normal user blows past any per-route IP cap within seconds. POST `/enter` falls under the global 120/min/IP limit (see `docs/api-endpoints.md` § Rate Limiting).

## `isBetterEntry` comparator — `routes/api.mjs` (module scope)

Mirrors the sort, including tiebreaker. Imported `TIME_PRIMARY_GAMES` from `db/index.mjs`.

```js
function isBetterEntry(newScore, newTimeMs, existing, gameId) {
  var isTime = TIME_PRIMARY_GAMES.has(gameId);
  if (isTime) {
    if (newTimeMs < existing.time_ms) return true;
    if (newTimeMs > existing.time_ms) return false;
    return newScore > existing.score;          // tiebreak
  }
  if (newScore > existing.score) return true;
  if (newScore < existing.score) return false;
  return newTimeMs < existing.time_ms;         // tiebreak
}
```

Exact tie on both = not better (rejected before payment in /enter).

## Frontend — Lobby "Leaderboards" tab (`qf-dapp/index.html`)

Grid of 20 game cards replacing the old dropdown + flat table.

- Period toggle (Daily / Weekly / Monthly) affects every card simultaneously. `lbRenderGrid()` fires on period click and triggers 23 parallel `GET /:gameId/:periodType` calls (20 games + 3 extra for minesweeper's per-difficulty rows).
- Minesweeper card = 4 rows (`LB_DIFFICULTIES['minesweeper']`: beginner / pocket / intermediate / expert — `advanced` is Silver-league only so no free-play entries to show). Each row = one `GET ?difficulty=<d>` call.
- Other cards = 1 row with the top entry only (no difficulty filter).
- Connected wallet row highlighted in gold via `.lb-card-row.highlight`.
- Clicking any card opens `#lbModalBackdrop` (modal):
  - Minesweeper modal: difficulty tabs (Beginner default active), each tab lazy-loads its own entries
  - Other modals: single top-10 table with "Show more (N total)" expansion
  - Esc and backdrop-click dismiss
- CSS: `.lb-grid { repeat(auto-fill, minmax(300px, 1fr)) }` → 1 column at 375px mobile, 2–3 columns on desktop
- `LB_GAMES = 20 entries` — `battleships`, `golf-solitaire`, `pyramid` excluded (no free-play submit path wired)

## Frontend — My Account "Personal Bests" (`qf-dapp/my-account/index.html`)

Shows every PB row with per-period submit opportunities. Per game, per difficulty, 3 periods = up to 9 submit buttons per game.

- One batch call at render time: `POST /global-leaderboard/eligibility` with all PB tuples where `session_id` is present (backend requires it for session validation).
- Per-period cell states:
  - **Eligible new** → gold button "Daily — would rank Nth — 50 QF"
  - **Eligible update** → green button "Weekly — update to Nth — 50 QF"
  - **Already ranked (not improvable)** → gold pill "Daily ⭐ Nth"
  - **Worse than existing** → muted "Monthly — already better"
  - **No live session** → muted "Daily — play again to submit"
  - **Outside top 25** → muted "Monthly — outside top 25"
- Each button submits a single period via `POST /enter` with `periodTypes: [p]` — 50 QF per click (per-period billing).
- On success the button morphs in place to "⭐ Ranked/Updated P · Nth" and stays disabled; no card-level footer anymore.

## In-game prompt — `qf-dapp/games/qf-leaderboard-prompt.js`

Unchanged tonight. Still calls `GET /:gameId/eligibility` 3× (once per period) at game end. Server derives difficulty from the session, so this helper does not need to pass it. **Post-launch cleanup backlog:** migrate this to the new POST batch endpoint.

## Submit-freeplay difficulty flow

Games that use `/session/submit-freeplay` (minesweeper, freecell, plus the pure-free games) must include `difficulty` in the POST body for the per-difficulty leaderboard to work. Backend path: `req.body.difficulty` → `createGameState(..., diff)` → `active_game_state.difficulty` → `gs.difficulty` at `/enter` time → row lands with correct difficulty.

As of 2026-04-19:
- minesweeper: client now sends `difficulty: difficulty` (fixed)
- freecell / nonogram / sudoku-duel: no difficulty concept in free play (single tier or deal-number based) — `'default'` is correct
- kenken / kakuro: use `/session/start` + evaluate flow, difficulty already passed through `startBody.difficulty`

## Known issues / backlog

- **Trust-the-hash** — server does not verify on-chain payment amount; blocker is QF archive RPC `eth_getTransactionReceipt` returning null for valid txs. Platform-wide, not leaderboard-specific.
- **`no such table: leagues`** background log spam — cosmetic, a stray `getActiveLeagues` caller hits a handle outside the main `getDb()` singleton. Not blocking any flow. Tracked in CLAUDE.md Known Issues.
- **qf-leaderboard-prompt.js → batch endpoint** — post-launch cleanup task.

## Payment model — one 50 QF covers all eligible periods

Both submit paths (post-game prompt, My Account second-chance) pay **exactly once** for a given score, regardless of how many of daily/weekly/monthly it qualifies for. Server accepts a `periodTypes` array (max 3) in the `/global-leaderboard/enter` POST body and runs a single `splitFee({ value: ethers.parseEther('50') })` on QFSettlement — 5% burn / 95% team — then loops the insert/update for each listed period using the already-paid txHash. There is no per-period charging path in the backend.

**Post-game prompt** (`qf-dapp/games/qf-leaderboard-prompt.js`): builds `allPeriods = qualifying.map(q => q.period)` after the per-period eligibility probe, sends one `sendTransaction({ value: 50 QF })`, POSTs once with `periodTypes: allPeriods`.

**My Account second-chance** (`qf-dapp/my-account/index.html`): originally rendered one button per period, each triggering its own 50 QF payment — a PB eligible for all three cost 150 QF to fully submit. Fixed 2026-04-19 commit `212107a`:
- `eligible[]` collects `{p, pCap, rank, wouldUpdate}` for every period where `shouldPrompt === true`.
- Ineligible periods still render as inline status chips (ranked / already-better / outside top 25 / play-again).
- A single button follows, reading `Submit to Leaderboard — <P1 Nth · P2 Nth · …> — 50 QF`.
- On click, `submitToLeaderboard(btn)` reads `data-periods` off the button, issues one `sendTransaction`, POSTs with every eligible period in `periodTypes`, then replaces the button with one ranked chip per entered period (slotting alongside any pre-existing chips).

Same backend, same wallet prompt count, same 50 QF total — the two paths are now behaviourally symmetric.

## PB write path — `session_id` must thread through

Every `upsertPersonalBest` caller must pass `sessionId` as the 6th arg. Before 2026-04-19 commit `8d66c02` none did — every PB row landed with `session_id = NULL`, which (a) caused the My Account batch-eligibility probe at `my-account/index.html:576` to skip every PB (no submit button ever rendered), and (b) made those rows eligible for the morning's "default-difficulty rows with NULL session_id" wipe, taking valid PBs down with the stale ones. Fixed at:

- `scoring.mjs:507` — gameover-win path → `payload.sid`
- `scoring.mjs:539` — submit-correct path → `payload.sid`
- `scoring.mjs:629` — sequential-mode completion → `payload.sid`
- `api.mjs` submit-freeplay route → local `sessionId` (the `sess_free_*` one the route just created)
- `api.mjs` maffsy `/complete` route → session issuance reordered above the `upsertPersonalBest` call so the sid exists before the PB is written
