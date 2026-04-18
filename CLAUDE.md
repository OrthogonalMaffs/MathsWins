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
- `docs/payment-architecture.md` — escrow flow, burn/split, duel payment, Stripe, non-atomic settlement bug
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
