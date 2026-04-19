# Known Issues (deferred)

Rolling list of issues identified in session but deferred — either because a fix is too invasive for the current scope, or because the issue is cosmetic / expected-to-self-resolve. See CLAUDE.md § Known Issues for the stable launch-era list; this file is for the deferred items that don't belong there yet.

## Deferred as of 2026-04-19

### 14 auto-seeded registration leagues without intent

Running `scripts/create-leagues.mjs` today (while reseeding a single cancelled sudoku-duel silver league) also seeded 14 other empty registration leagues across 7 games that previously had none. These will self-cancel at `reg_closes_at = 2026-04-26 ~14:00 UTC` if nobody joins. No funds at risk. Flagged rather than cleaned up because auto-expiry does the right thing.

**Lesson:** `create-leagues.mjs` seeds all 9 games × 2 tiers. Use `addLeaguePlayer` + direct `createLeague` inline when you only want one league, or add a `--game` / `--tier` filter to the script.

### `mint-achievement.mjs` needs ACHIEVEMENT_CONTRACT inline env

PM2's `ecosystem.config.cjs` sets `ACHIEVEMENT_CONTRACT` for the server process, but it's not in `.env` — so scripts run outside PM2 error with "ACHIEVEMENT_CONTRACT env not set" unless invoked as `ACHIEVEMENT_CONTRACT=0xc519… node scripts/mint-achievement.mjs …`. Either add to `.env`, or make the script fall back to a hardcoded constant with a warning. Low priority — the script already fails fast with a clear message.

### Broader audit of historical duel refund silent-failures

Today's fix recovered one 25 QF silent-failure from April 13 (duel `94e7842d`) and linked two April 14 refunds that had successfully hit chain but lacked `reference_id` in the ledger. **A full audit of every historical duel in `expired` status with `creator_tx` or `acceptor_tx` set, cross-referenced against `escrow_ledger` refund rows for that recipient+amount, has not been done.** If any other duels were orphaned in the pre-fix era, their funds are still sitting in escrow (and are correctly classified as obligations by the sweep script — they won't be accidentally swept). Worth sweeping through when there's time.

### Historical `refundDuel` in api.mjs

`api.mjs` imports `refundDuel` too — check whether any direct-API paths (not the server.mjs expiry sweep) call it without checking the null return. If so, those paths need the same tracking-row treatment as `server.mjs`.
