# MathsWins — CLAUDE.md

## Identity
Platform: Academy (9 courses), Tools (28 calculators), Games (22 dApp + 13 main site), Everyday Maths (6 courses), Learn (articles). Separate from MaffsGames (schools site, zero crossover).
- **Site:** mathswins.co.uk (GitHub Pages) | **Repo:** OrthogonalMaffs/MathsWins
- **Contact:** contact@mathswins.co.uk | **Chain:** QF Network (Chain ID 3426)

## Reference Files (read on demand)
- `.claude/rules/` — academy courses, tools list, parents guides, games roster, smart contracts, payment config, auth flow, directory structure
- `docs/db-schema.md` — full table inventory, upsert rules, escrow_ledger events
- `docs/api-endpoints.md` — all 45+ endpoints with params
- `docs/game-roster.md` — lobby structure, all games, scoring rules, battleships detail
- `docs/achievement-system.md` — batch history, categories, mint tiers, known issues, contracts
- `docs/payment-architecture.md` — escrow flow, burn/split, duel payment, Stripe, non-atomic settlement bug, gate order in /enter
- `docs/leaderboard-architecture.md` — per-difficulty schema, batch eligibility endpoint, score-update flow, grid UI
- `docs/minesweeper-scoring.md` — per-difficulty BASE × T / (T + t) curve, constants, migration notes
- `docs/achievement-descriptions.md` — description column, reveal-on-earn policy, tone rules, Bug Hunter
- `docs/achievement-audit-2026-04-17.md` — structural orphan audit

## Tech Stack
- Single-file HTML (no build step, no framework), KaTeX CDN for maths rendering
- GitHub Pages hosting, Stripe Payment Links + localStorage (Phase 1 live)
- Cloudflare Workers + KV for auth (`api.mathswins.co.uk`)
- Google Identity Services for sign-in, GA4 consent mode (`G-7GTLYCZMXN`)

## Business Model
- **Premium:** Annual £99.99 / Lifetime £149.99 (9 core academy courses)
- **Standalone:** Options Maths, Crypto Trading (NOT in Premium)
- **Free:** Games, Everyday Maths, Tools, Parents, Module 1 of all courses
- **Upgrade credit:** spend toward individual courses credited against Premium

## Theme
- **Main site:** #050709 bg, #d4a847 gold, #0d9488 teal | Fonts: DM Mono, Bebas Neue, Crimson Pro, Outfit
- **dApp (Sabre):** #0e1013 bg, surfaces #16181c/#1e2025/#26282e, silver #b8bcc6, gold #c9a84c, muted #4a4e5a, text-white #e8eaf0, borders rgba(184,188,198,0.15) | Fonts: JetBrains Mono, Playfair Display, Inter
- **Tone:** Confident, mathematical, zero-bullshit. Educational, not gambling.
- `.mb` math box | `.pln` plain English | `.pt` practical tip | `.dg` danger warning

## dApp Backend
- **Server:** Hetzner Box 1 (204.168.200.237), port 3860, PM2 `mathswins-dapp` (user jon)
- **SSH:** `root@204.168.200.237` with `~/.ssh/hetzner-vm`, PM2 via `su - jon`
- **Deploy:** `scp` to `/home/jon/mathswins-dapp/src/games/`, `chown jon:jon`, restart PM2
- **API Base:** `https://dapp-api.mathswins.co.uk/api/dapp` | Local: `http://127.0.0.1:3860/api/dapp`
- **Database:** SQLite at `/home/jon/mathswins-dapp/data/mathswins.db` (32 tables)
- **Wallet Module:** `qf-dapp/games/qf-wallet.js` — QNS reverse resolution, EIP-6963, auto-reconnect. All wallet errors use `showWalletError()` banner (no alert() popups).
- **Box 2 (37.27.219.31):** bots/indexer/explorer/vector-graphs ONLY — NO dApp backend

## Games Summary
- **4 active league games:** sudoku-duel, kenken, minesweeper, freecell
- **10 duel-capable games:** above 4 + battleships, kakuro, countdown-numbers, nonogram, poker-patience, cribbage-solitaire. Min 25 QF stake, variable. Trust-the-hash (RPC blocker).
- **12 free games:** maffsy, higher-or-lower, 52dle, towers-of-hanoi, dont-press-it, memory-matrix, rps-vs-machine, estimation-engine, sequence-solver, prime-or-composite, cryptarithmetic-club, battleships-cpu
- **Leaderboard prompt:** 22/23 games wired. Battleships still skipped (no server-side free-play completion path). Maffsy now issues sessionId via `/maffsy/complete`. See `docs/game-roster.md`.
- **Shared nav:** `qf-nav.js` on all 35+ pages | **My Account:** `/qf-dapp/my-account/` (5 tabs)

## League & Duel Rules
- **Leagues:** Bronze 100 QF / Silver 250 QF entry. 10 puzzles, 14-day window, min 4 players. Top 4 share 85% pot, 5% burn, 10% team. Server-authoritative seeds.
- **Duels:** Client pays escrow → server settles via QFSettlement v2 (5% burn / 10% team / 85% winner, owner-adjustable via `setSplits`). Draws split 85% evenly. Both txHashes required. Builder wallets bypass payment. Creators can broadcast to @qf_games (stake≥100) via `POST /duel/:code/broadcast`.
- **QFSettlement:** `0xf4C00E9CBC6fe595c4a54ae7e75E9a92D0D513d4` (v2 — owner-settable splits, default 5% burn / 10% team / 85% winner)

## Achievement System
- **163 active** achievements (164 registered, 1 retired — `speed-reader`). `ACHIEVEMENTS_ACTIVE=true`. Bug Hunter added at launch (community tier, free, manually awarded).
- **QFAchievement.sol v2:** `0xc519E65Fb767DBEFC46FF0dC797Ccd0318Ae12eD` | Owner: onlyfans.qf | Minter: escrow
- Full detail: `docs/achievement-system.md`

## Trophy NFTs
- **QFLeagueTrophy.sol:** `0xBC41549872d5480b95733e4f29359b7EAB4E05b8` | Owner: onlyfans.qf | Minter: `0xFc6346C5A10c51Ef6B9cE9746F436b0b7Ec3D7b6`

## QNS
- New Resolver: `0x276b7e9343c19bea29d32dd4a8f84e6d1c183111` | Old: `0xd5d12431b2956248861dbec5e8a9bc6023114e80`

## Known Issues (2026-04-18)
- **`ACHIEVEMENT_METADATA` dict drift fixed 2026-04-17** (commit 31345b5 — loads `ipfs-mapping.json` at startup). Token 11 setTokenURI fix still pending.
- **Token 11 wrong tokenURI.** `wrong-answer-streak` points to tier-fallback CID. Fix: `setTokenURI(11, <correct CID>)`.
- **Test-activity exclusion not enforced.** BUILDER_WALLETS bypasses payment only — achievement/record writes still fire. Architectural fix pending.
- **~7 orphan achievements** still need per-game frontend wiring (down from 13 — 4 Maffsy + Clairvoyant + On-the-nose wired today). See `docs/achievement-system.md`.
- **FreeCell auto-complete bug.** Does not trigger when tableau sorted descending + foundations at 8s. UNDO greying mid-game is a separate issue. Both pending.
- **League settlement not atomic.** `league-settle.mjs:186-198` — partial-payment silent failure possible. See `docs/payment-architecture.md`.
- **`onlyfans-qf` row pricing TBD** — tier='manual' but mint_fee_qf=200, contradicts "Manual reward" semantics in spec. Awaiting decision (left untouched in tier migration).
- **Admin auth not configured on Box 1** — neither `ADMIN_SECRET` nor `ADMIN_WALLETS` env var set, so `/admin/*` HTTP endpoints (incl. `/admin/telegram/test`) return 403 from outside. In-process node import works as a workaround.
- **`SqliteError: no such table: leagues at getActiveLeagues (db/index.mjs:504)`** — recurring background log spam. The `leagues` table exists and other queries against it work (`getLeagueById`, `createLeague`, etc). Suspected cause: a stray module instantiating its own `better-sqlite3` handle against a wrong path or pre-schema instance. Cosmetic only — not related to league-join flow. Investigate post-launch.
- **`flag-everything` achievement unreachable.** Minesweeper's first-click-safety means no mine positions exist until the player reveals a cell, and `toggleFlag` bails on `!minesPlaced`. Flagging every mine with zero reveals is therefore impossible by construction. Needs redefining (e.g. "flag all mines without ever mis-flagging") or retiring. Part of the deferred achievement-impossibility audit alongside `docs/achievement-audit-2026-04-17.md`.

## Launch-Night Changes (2026-04-18 evening)
- **League team tax 5% → 10%, prize pool 90% → 85%.** Burn stays 5%. Single constant change at `api.mjs:867` (`TEAM_PCT=0.10`). Prize pool derives automatically. Frontend copy + docs swept. Commit `98efde8`.
- **QFSettlement v2 deployed at `0xf4C00E9CBC6fe595c4a54ae7e75E9a92D0D513d4`.** Owner-settable duel splits via `setSplits(burnPct, teamPct)` — default 5/10/85. `splitFee()` hardcoded at 5/95 (achievement mint + leaderboard ringfenced from setSplits). `transferOwnership` added. Owner = Ledger (0x8a54…3016). Deployer = onlyfans.qf. v1 (`0x475F…D013E`) retired. Commit `ac7c960`.
- **8 fresh registration leagues seeded** (sudoku-duel/kenken/minesweeper/freecell × bronze/silver). 6 old leagues cancelled — all builder-whitelist, zero real funds at risk. Pioneer tags cleared (`first_claimed_by` nulled on 7 achievements + `is_pioneer=0` on 1 eligibility row).
- **`LEAGUE_GAMES` whitelist** now includes minesweeper + freecell so their leagues auto-chain successors. Commit `5dc42c8`.
- **Duel broadcast to @qf_games** — new `POST /duel/:code/broadcast` (JWT, creator-only, stake≥100, 5/wallet/24h). Bot edits the post on accept / expire / settle. 9 standard duel games wired (battleships excluded — separate state machine). New shared helper `qf-duel-broadcast.js`. Commit `c590dd5`.
- **`.env` loader added to `server.mjs`** (minimal built-in parser, no dotenv dep). Root cause of "notifications_disabled": `ecosystem.config.cjs` env block never listed TELEGRAM_*, and dotenv wasn't loaded — so the existing queued notifications (league_open, daily digest) were also silently broken. Now loaded with `.trim()` on every value. Commit `eb13dac`.
- **Self-accept funds-risk blocked** across 9 games. Creator clicking their own duel link used to prompt for stake payment before backend 400'd — orphaning QF until 24h refund. Now pre-payment creator-wallet check bails with a friendly message. Commit `eb13dac`.
- **Creator-resume flow** on 9 games. After self-accept block landed, creators who navigated away had nowhere to go. `loadDuelAccept` / `showAcceptScreen` now detect `creator_wallet === connected AND creator_score IS NULL` and render a "Your Duel — Start Playing" panel instead of the Accept panel. Commit `96b9bba`. Also waits up to 3s for wallet auto-reconnect before deciding. Commit `e3f14ca`.
- **Duel copy 90% → 85%** swept across 11 games (static modal text + runtime JS strings). Commit `ed0fdb2`.
- **Sudoku-duel `checkComplete` defensive fix** — scans `grid[]` directly instead of relying on `confirmedCells.size`, preventing premature submit-on-incomplete-grid gameovers. Commit `487e6e6`.
- **Bug Hunter achievement wired** (tier=free, mint_fee=0, category=community, active). Image + metadata pinned to IPFS. 162→163 active achievements. Awarded post-launch via `POST /admin/achievement/award`. Commit `3bee78d`.

## Launch-Day Changes (2026-04-19)
- **`global_leaderboard_entries.difficulty` column added** + composite `UNIQUE(wallet, game_id, difficulty, period_type, period_key)`. Migration is idempotent on `db/index.mjs` init (table-rebuild path, SQLite can't ALTER UNIQUE). `/enter` derives difficulty from `gs.difficulty`; `TIME_PRIMARY_GAMES` exported. See `docs/leaderboard-architecture.md`.
- **`POST /global-leaderboard/eligibility` (batch) added.** Single-tuple GET unchanged (in-game prompt). Batch used by My Account for per-(game, difficulty, period) probing in one call. My Account now surfaces one submit button per eligible combination — per-period billing (50 QF per click). Post-launch cleanup: migrate `qf-leaderboard-prompt.js` off the legacy GET.
- **Leaderboard UI rebuilt.** Dropdown + flat table replaced by grid of 20 game cards + click-to-popout modal. Minesweeper card = 4 difficulty rows; modal = per-difficulty tabs. Period toggle re-fetches all cards in parallel. `LB_DIFFICULTIES`, `LB_TIME_PRIMARY` in `qf-dapp/index.html`. Commit `8e893ac`.
- **Minesweeper scoring curve replaced.** `score = round(BASE × T / (T + elapsedSeconds))` with per-difficulty `(BASE, T)` in `SCORING` at `minesweeper.mjs`. Old flat `5000 − seconds` dropped. See `docs/minesweeper-scoring.md`. Commit `9d217a2`.
- **Orphan gate-order fix in `/global-leaderboard/enter`.** Session validation, period validation, and `isBetterEntry` classification now run *before* the `txHash required` check. Rejected-pre-payment flows no longer orphan 50 QF in escrow. See `docs/payment-architecture.md` § Global Leaderboard Payment. Commit `d036f46`.
- **Score-update flow added.** Beating an existing leaderboard row costs another 50 QF and overwrites the row (new score + txHash). Exact tie = not better, rejected pre-payment. Mirrors the sort's direction + tiebreaker.
- **PURE_TIME_GAMES inversion fix** — minesweeper and freecell store `5000 − seconds` (higher-is-better), never raw time. Removed both from the set so `upsertPersonalBest` uses the higher-score path. Commit `07699a3`.
- **Submit-freeplay difficulty wiring** — minesweeper client now sends `difficulty: difficulty` in the POST body. Freecell / nonogram / sudoku-duel don't need it (single-tier / deal-based / duel-only difficulty). Kenken + kakuro already send via `/session/start`. Commit `52a1705`.
- **Achievement descriptions.** `achievement_registry.description TEXT` column + 164-row `ACHIEVEMENT_DESCRIPTIONS` map. Reveal-on-earn only (`/achievements/my` joins description; `/achievements/all` and teaser page stay opaque). See `docs/achievement-descriptions.md`. Bug Hunter text: "Found and reported something that made the platform better."
- **BUILDER_WALLETS env cleared.** `ecosystem.config.cjs` now `BUILDER_WALLETS: ''` — every wallet pays every trust-the-hash endpoint. `OWNER_WALLETS` kept (3 wallets: onlyfans.qf, Ledger, 0x08ba…70c3) — those still bypass mint fees only, not leagues/duels/leaderboard. Launch state.
- **Minesweeper PB / leaderboard rows wiped** before the new scoring curve went live. Platform-wide stale `default`-difficulty rows with NULL session_id also cleared (32 rows, 14 games). All `.bak*` and `.pre-*` files on Box 1 swept (17 files). Standing rule: no backup/snapshot files on Box 1 — see global `feedback_no-bak-files.md`.
- **4 UX niggles fixed pre-launch** (commit `f55e97c`): Sudoku wrong-entry race on cell re-selection, Minesweeper native context menu leak on chord, Estimation Engine Start Game button prominence, Maffsy leaderboard metric switched to current-streak. Sequence Solver answer-reveal deferred — needs PC-authored rule strings for 155+ questions.

## Launch-Day Evening (2026-04-19)

- **Live league prize display — `league_players.amount_paid` column added.** `recalculateLeaguePot` rewritten to sum actual QF received per join (not `paidCount × entry_fee`, which miscounts builder joins and discounted pays). Single source of truth at all league stages. `GET /league/:leagueId` and `GET /leagues/:gameId` now return a `prizes {first, second, third, fourth, pot, fixed}` object; settled-winner ledger moved to `prizes_settled`. 11 league lobby pages render a state-aware prize table on cards + inline prize column on leaderboard rows 1–4. Settlement unchanged — still reads stored `total_pot`. Commit `572824c`.
- **Minesweeper How to Play copy** — updated to reflect the new difficulty-aware curve without exposing `(BASE, T)` constants. Commit `d564162`.
- **`session_id` threaded to every `upsertPersonalBest` call site.** Every PB row was landing with `session_id=NULL`, which (a) broke the My Account second-chance submit (frontend hides the button on null-sid rows) and (b) made those rows collateral in the morning's default-NULL wipe. Fixed at `scoring.mjs:{507,539,629}`, `api.mjs` submit-freeplay, `api.mjs` maffsy `/complete` (session issuance reordered above the PB upsert). Jon's sudoku-duel PB reconstructed from the surviving GLE row (`sess_free_aea75…`) in a wallet-scoped backfill. Commit `8d66c02`.
- **Achievement description audit — 36 rows corrected.** Full 164-row review, row-by-row factual fixes (spend thresholds, league/duel volume pinning, battleships numerics, exact constants for pi/euler/phi/√2/√3, meta-set descriptions). Single idempotent migration at `docs/migrations/20260419-achievement-descriptions.sql`. See `docs/achievement-descriptions.md` § 2026-04-19 audit. Commit `7b6dc9c`.
- **My Account second-chance leaderboard submit — batched.** Previously rendered one 50 QF button per period; a PB qualifying for all three cost 150 QF. Now one "Submit to Leaderboard — Daily Nth · Weekly Mth · Monthly Kth — 50 QF" button per PB row, matching the post-game prompt. Backend already supported `periodTypes` array; frontend caught up. Commit `212107a`. See `docs/leaderboard-architecture.md` § Payment model.
- **Escrow ops scripts** — three helpers written to work around the 403-return on admin HTTP (neither `ADMIN_SECRET` nor `ADMIN_WALLETS` set in env): `scripts/cancel-league.mjs` (mirrors `/admin/league/:leagueId/cancel`), `scripts/retry-refund.mjs` (single-row failed-refund retry, now passes ctx so the retry lands in `escrow_ledger`), `scripts/one-shot-duel-refund.mjs` (manual duel refund backstop). Commit `689518b`.
- **Escrow commitment-aware sweep.** `scripts/escrow-sweep.mjs` computes obligations = active league pots + held duel stakes + pending refunds, keeps a 100 QF buffer, sends anything above that to the pinned `TEAM_WALLET`. Dry-run default; `--execute` required. Recipient is env-fixed — no arbitrary addresses. Commit `689518b`. See `docs/escrow-accounting.md`.
- **Duel refund persistence — `duel_refunds` table.** Mirrors `league_refunds` (pending/sent/failed + tx_hash + failed_reason). `server.mjs` expiry sweep writes intent up-front, calls `refundDuel(wallet, amount, duel_id)` so ledger rows carry `reference_id`, treats null return from `sendQF` as a recoverable failure (retried every 5-minute tick, 60s debounce on failed). Pre-fix, a silent `sendQF` null return on April 13 had orphaned 25 QF; recovered via `one-shot-duel-refund.mjs`. Commit `1c64bb8`.
- **Sweep script three-way refund match** — direct `reference_id` / `duel_refunds` sent-state / heuristic (amount + recipient + 10-min window around expires_at, greedy-earliest). After today's backfill, zero orphan ledger rows — heuristic is a defensive no-op on current data. Commit `1c64bb8`.
- **Direct on-chain mint helper — `scripts/mint-achievement.mjs`.** Replicates the four steps from the `POST /achievement/mint` route: `awardAchievement` (eligibility + pioneer tag), tokenURI from pre-pinned `ipfs-mapping.json`, `contract.mint` via the minter, parse tokenId from the Transfer log, update eligibility row. Requires `ACHIEVEMENT_CONTRACT=0x… node scripts/…` inline env (PM2 sets it but `.env` doesn't). Used today to mint **Bug Hunter token #18 (Pioneer) to `0x7a3C…f8EF`** — tx `0x1e734004…4246d1`. Commit `60978ea`.
- **Accounting reconciliation.** 250 QF league refund retro-filled into `escrow_ledger` (inferred=1). Two April 14 duel refund rows backfilled with correct `reference_id`. 25 QF orphan refund sent to `0x08baa2…70C3` for duel `94e7842d-bf1d…`. Escrow swept to exactly `obligations + 100 QF` baseline — 100.895728 QF to team wallet, tx `0x89444ce0…f620`.
- **Rate-limiter overhaul — three-issue fix for My Account / lobby blanking under real use.** Symptoms: lobby grid blanks after ~2.5 period toggles, My Account "Failed to load leagues" on revisit. Three causes, all in one commit `480620f`:
  1. **ETag/304 trap** — Express's default ETag middleware contradicted `Cache-Control: no-store`, so a second visit to the same URL returned 304 with empty body and `res.json()` threw. `app.set('etag', false)` in `server.mjs`. (Earlier commit `8b4b3fa`.)
  2. **Whitelist read GETs from global limiter** — lobby grid fires ~26 parallel fetches per render; 3 toggles tripped the global 120/min/IP cap. `RATE_LIMIT_GET_WHITELIST` in `server.mjs` skips `/api/dapp/{global-leaderboard,profile,achievements,leagues,league}/*` for GETs. Matched against `req.originalUrl` (mirrors timing middleware) — `req.path` does NOT strip `/api/dapp` mount in this stack.
  3. **Two redundant per-route 60/min limiters deleted** at `routes/api.mjs:2489` (`/profile/:wallet`) and `routes/api.mjs:2765` (`/global-leaderboard/:gameId/:periodType`). They contradicted the whitelist and were strictly worse than the global limiter (60/min vs 120/min). Global limiter + whitelist now the single source of rate-limit truth for reads.
  4. **`app.set('trust proxy', true)`** in `server.mjs` — without this, behind Cloudflare Tunnel `req.ip` was `127.0.0.1` for every request, so all visitors shared one limiter bucket. Verified: a single client now gets the full 120/min budget. Launch-day blocker — without it, the first ~120 requests across all real users would 429 the rest.

  Verification: 4 toggles × 26 parallel = 104 GETs all returned 200; 130 POSTs to non-whitelisted endpoint returned exactly 120 × 401 + 10 × 429 (proves global limiter at 120/IP is firing per real client IP). Browser-confirmed by Jon. The unrelated POST `/duel/:code/broadcast` per-wallet 5/24h limiter at `routes/api.mjs:776` is intentionally untouched (anti-abuse, per-wallet not per-IP).

## Late-night 2026-04-19 → 2026-04-20

- **`OWNER_WALLETS` expanded to 4.** Added `0x7a3C15461f89742d8416c560Ba07CF8732a6f8EF` (notabot.qf) to the list in `ecosystem.config.cjs` so Regicide/Detention trigger when Jon's primary wallet places in a league. `.env` also carries the same value but is overridden by the PM2 env block (see `server.mjs` .env-loader comment: "ecosystem.config.cjs values always take precedence"). Lands on overnight 03:05 restart.
- **Founding Member window narrowed.** `FOUNDING_MEMBER_START=2026-04-19`, `FOUNDING_MEMBER_END=2026-06-18` (60 full days from launch). Read live on every league-puzzle submission at `api.mjs:1205-1219`. Pre-launch testers who minted `founding-member` between April 11–18 keep their NFTs — see memory `mathswins-founding-member-window.md`. Lands on overnight 03:05 restart.
- **Maffsy default flipped to free play.** `qf-dapp/games/maffsy/index.html:564` — new users now land in unlimited-puzzle mode. Existing users keep their stored `PREFS.free`. Commit `a7db4d3`. **Known bug exposed:** free play short-circuits at `index.html:933` *before* posting to `/maffsy/complete`, so wins in free play don't trigger `wordy` / `binary-decision` / `feel-no-pressure` achievements, streak counter, or leaderboard prompt. Pre-existing — flip amplified exposure. Needs design review with PC before fix (see below).
- **Bug Hunter minted to Kyle (`0xA3DE…347b`)** — token #20, tx `0x5d29a9e6…35bbe1c8`. Standard mint (Jon holds #18 Pioneer for Bug Hunter, earned).
- **Wordy earned + minted to notabot.qf** — token #22, tx `0x6095dffb…90171717`. Initially Pioneer; subsequently cleared per new rule (see below).
- **Pioneer tags cleared on notabot.qf for `league-month` (#21) and `wordy` (#22).** Only `bug-hunter` (#18) Pioneer retained — that one was legitimately earned.

## Change Required (picked up with PC, 2026-04-20)

- **`PIONEER_EXCLUDED_WALLETS` env + `awardAchievement` guard.** Hard rule: notabot.qf (`0x7a3C…f8EF`) must never be Pioneer on any NFT (exception: the already-minted `bug-hunter` #18). Implementation sketch: new env var in `ecosystem.config.cjs` following the `OWNER_WALLETS` pattern; `awardAchievement` in `dapp-backend/src/db/index.mjs:758` reads list and skips the `UPDATE achievement_registry SET first_claimed_by` + `UPDATE achievement_eligibility SET is_pioneer = 1` block when wallet matches. No on-chain change (pioneer is DB-only). Memory rule `feedback_notabot-no-pioneer.md` is the interim safety net. PC to review before code lands.
- **Box 1 drift audit (defer).** Box 1 `/home/jon/mathswins-dapp/src/` has 21 files that local GitHub clone doesn't — legacy `api.mjs`/`index.mjs`/`estimation-engine.mjs`/`kenken.mjs` at src root, plus a duplicate `src/games/games/` subtree of all 16 game files. Likely dead code from earlier refactors but requires per-file import audit before deletion. Not restart-adjacent; separate session.

## Maffsy gate fix + all-time leaderboard (2026-04-20)

- **Cross-mode game-level streak semantics.** `maffsy_current_streak` / `maffsy_max_streak` now track consecutive games without a loss across both free-play and daily modes. `maffsy_clean_streak` deprecated (no longer written — scheduled for column drop). `feel-no-pressure` threshold reads `maffsy_current_streak`.
- **New counters on `wallet_stats`:** `maffsy_total_plays`, `maffsy_total_wins`, `maffsy_guesses_1`…`_6`, `maffsy_abandons_today` + `maffsy_abandons_date` (UTC).
- **Abandon detection.** New `POST /maffsy/start` creates an `active_game_state` row per puzzle. Second `/start` without intervening `/complete` marks prior row `abandoned` and increments `maffsy_abandons_today`. Third abandon in a UTC day resets `maffsy_current_streak` to 0. Counter auto-resets at UTC midnight via `maffsy_abandons_date` comparison. Whole sequence runs inside a `better-sqlite3` `db.transaction()` for concurrency safety.
- **All-time leaderboard.** New `maffsy_alltime_leaderboard` table (PK wallet). New `POST /maffsy/leaderboard-submit` (50 QF pattern, 5% burn / 95% team via QFSettlement, tx_hash uniqueness via `isMaffsyLbTxHashUsed`). Submit uses `wallet_stats.maffsy_max_streak` as score (server-read; no client override). Resubmit-to-beat-own-PB costs another 50 QF. `GET /maffsy/leaderboard` returns top-100 + yourRow. Maffsy excluded from `global_leaderboard_entries`; migration wipes any pre-existing rows.
- **Frontend:** `qf-dapp/games/maffsy/index.html` — removed `PREFS.free` gate on `/maffsy/complete`; added `/maffsy/start` call on new puzzles, `nextFree`, `setFree`, and initial load; `isNewMax` flag from server drives the 🔥 PB line in end modal; unconnected-wallet disclaimers on status bar (persistent) and end modal (once per session). My Account High Scores tab has a new Maffsy card with current max vs submitted score and a 50 QF submit button when max > submitted.
- **Migration:** `scripts/migrate-maffsy-counters.mjs` — atomic, transaction-wrapped, idempotent via `migrations_ran` sentinel. Forward-promotes `maffsy_clean_streak` into `_current_streak` / `_max_streak` via MAX(), backfills `_total_plays` / `_total_wins` / `_guesses_N` from `maffsy_streaks`, wipes Maffsy rows from `global_leaderboard_entries`.
- **Deploy discipline:** attended two-act — Act 1 Jon runs migration script on Box 1 watching output; Act 2 code scp'd + attended PM2 restart (no silent cron for this one).

## Minesweeper mobile long-press fix (2026-04-20)

- **Mobile flagging was unusable.** `onCellTouchMove` cancelled the long-press timer on any movement, so sub-pixel finger jitter during the 300ms hold killed the timer before it fired. Jon reported 6/6 failures on his phone.
- **Fix in `qf-dapp/games/minesweeper/index.html`:** record touchstart x/y, only cancel the timer when movement exceeds `LONG_PRESS_MOVE_TOLERANCE_PX = 10`, bumped `LONG_PRESS_MS` 300 → 500 (platform convention). `toggleFlag` now surfaces "Reveal a cell first, then flag." via `setMsg` when `!minesPlaced` instead of silently bailing. Commit `f52feb0`.
- **Desktop right-click path untouched** — mouse handlers, chord, and game engine unchanged.

## Standing rules added 2026-04-19

- **Escrow floor:** wallet must always hold at least `obligations + 100 QF`. Obligations = active league pots + held duel stakes + pending refunds. `scripts/escrow-sweep.mjs` is the canonical tool; manual drains below that floor are unsafe.
- **`sendQF` caller contract:** every caller passes `ctx = { type, source, referenceId }` AND checks the return value. `null` is a recoverable failure that must be persisted to a tracking row (e.g. `league_refunds` / `duel_refunds` status=failed); never log success unconditionally. Silent failures orphan real user funds.
- **PB write contract:** `upsertPersonalBest` requires the 6th `sessionId` arg. Any new caller that omits it makes the row ineligible for the second-chance submit flow.
- **Rate-limiter contract:** the global limiter in `server.mjs` is the single source of truth for `/api/dapp/*`. Any new per-route limiter that calls `res.status(429)` is a bug — it bypasses the whitelist and double-counts. Anti-abuse on writes belongs in the global limiter (or per-wallet not per-IP for things like `/duel/:code/broadcast`). `app.set('trust proxy', true)` is non-negotiable: without it, `req.ip = 127.0.0.1` and all visitors share one bucket.

## Recent Fixes (2026-04-18)
- **Stake UI sweep** across 9 free-play game pages: `duel-stake-wrap` hidden by default, shown only on `?mode=duel` (kenken, countdown-numbers, sudoku-duel, cribbage-solitaire, nonogram, kakuro, poker-patience, freecell, battleships). Commit 7e6cb1c.
- **qnsName populated on global leaderboard entries** — both submit call sites now read `qfWallet.qfName` (with `resolveAny()` fallback) and pass to `/global-leaderboard/enter`. Commit 85663b7.
- **KenKen free-play removes per-cell red feedback.** Gate `!leagueMode` → `duelMode`. Free-play and league now no feedback; duel preserved. Commit 6237b5a.
- **Telegram broadcast notifications** to @qf_games (`-1003968909110`). 6 event types + daily 08:00 UTC digest. `src/telegram.mjs`, gated by `TELEGRAM_NOTIFICATIONS_ENABLED`. Live on Box 1.
- **Achievement registry tier+fee migration:** 22 standard@200→100, 5 obsidian/meta→premium, immaculate→elite. SQL at `docs/migrations/20260418-achievement-tier-fix.sql`. DB backup `mathswins.db.pre-tier-fix.20260418-082930` on Box 1.
- **Maffsy fully wired:** sessionId issuance from `/maffsy/complete` enables leaderboard prompt; 4 achievements activated (wordy, binary-decision, the-novelist, feel-no-pressure). New `wallet_stats.maffsy_clean_streak` column.
- **Lobby header platform stats:** `GET /stats/platform` (no auth) — games_played + qf_burned chips on lobby hero.
- **Clairvoyant** (HoL, perfectGame===true) and **On-the-nose** (Countdown, exactHit===true) wired via submit-freeplay clientStats.
- **Sudoku Duel three-fix** (commit 95cf734): persistSession before completeGameState in scoring.mjs gameover/failed-submit branches (DB mistakes column was freezing one-behind on gameover); useHint respects inputLocked; endGame(true) checks data.correct before showing win modal.

## Relationship to Other Projects
- **maffsgames.co.uk** — sister site, schools-only. Shares 5 games. Zero branding crossover.
- **QF Network** — the blockchain. MathsWins is a dApp on QF Network (Chain ID 3426).

## Safety
- No wallet connection code without explicit approval
- 5% burn on every QF payment is non-negotiable
- No crossover with maffsgames.co.uk branding or contact
- NEVER restart PM2/server without explicit "yes" from Jon

## Task Contract

All tasks arriving from Jon (relayed from Claude chat) will be structured as follows.
Do not begin work unless all six fields are present:

TASK: [one sentence description]
ROOT CAUSE: [what is actually wrong]
EXACT CHANGE: [file, function, what changes to what]
DO NOT TOUCH: [explicit exclusions]
SUCCESS CONDITION: [how to know the task is complete]
STOP IF: [conditions that require you to halt and report back to Jon]

### Behaviour rules
- Before touching any file, state your understanding of the ROOT CAUSE in one sentence.
- If you hit something unexpected, do not improvise. Invoke STOP IF and report back.
- Do not refactor, rename, reformat, or tidy anything outside EXACT CHANGE.
- One pass. If it isn't right, stop and report — do not attempt iterative self-correction.
- If a task arrives without this structure, ask Jon for the missing fields before proceeding.
