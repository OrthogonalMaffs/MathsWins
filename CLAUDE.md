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
- **Leaderboard prompt:** 21/23 games wired. 2 skipped: battleships + maffsy (custom submit paths). See `docs/game-roster.md`.
- **Shared nav:** `qf-nav.js` on all 35+ pages | **My Account:** `/qf-dapp/my-account/` (5 tabs)

## League & Duel Rules
- **Leagues:** Bronze 100 QF / Silver 250 QF entry. 10 puzzles, 14-day window, min 4 players. Top 4 share 90% pot, 5% burn, 5% team. Server-authoritative seeds.
- **Duels:** Client pays escrow → server settles via QFSettlement (90/5/5). Both txHashes required. Builder wallets bypass payment.
- **QFSettlement:** `0x475F350469Cbe5aDd04aae4686339b3b990D013E`

## Achievement System
- **162 active** achievements (163 registered, 1 retired). `ACHIEVEMENTS_ACTIVE=true`
- **QFAchievement.sol v2:** `0xc519E65Fb767DBEFC46FF0dC797Ccd0318Ae12eD` | Owner: onlyfans.qf | Minter: escrow
- Full detail: `docs/achievement-system.md`

## Trophy NFTs
- **QFLeagueTrophy.sol:** `0xBC41549872d5480b95733e4f29359b7EAB4E05b8` | Owner: onlyfans.qf | Minter: `0xFc6346C5A10c51Ef6B9cE9746F436b0b7Ec3D7b6`

## QNS
- New Resolver: `0x276b7e9343c19bea29d32dd4a8f84e6d1c183111` | Old: `0xd5d12431b2956248861dbec5e8a9bc6023114e80`

## Known Issues (2026-04-18)
- **`ACHIEVEMENT_METADATA` dict drift.** `routes/api.mjs` inline dict (~80 entries) vs `ipfs-mapping.json` (161 entries). Missing entries mint wrong image (tier-fallback generic coin — permanently soulbound). Fix: load JSON at startup.
- **Token 11 wrong tokenURI.** `wrong-answer-streak` points to tier-fallback CID. Fix: `setTokenURI(11, <correct CID>)` after dict-drift fix.
- **Test-activity exclusion not enforced.** BUILDER_WALLETS bypasses payment only — achievement/record writes still fire. Architectural fix pending.
- **13 orphan achievements.** 2 by-design, 3 parked, ~8 needing per-game frontend wiring. See `docs/achievement-system.md`.
- **FreeCell auto-complete bug.** Does not trigger when tableau sorted descending + foundations at 8s. UNDO greying mid-game is a separate issue. Both pending.
- **League settlement not atomic.** `league-settle.mjs:186-198` — partial-payment silent failure possible. See `docs/payment-architecture.md`.

## Recent Fixes (2026-04-18)
- **Minesweeper stake UI** (`qf-dapp/games/minesweeper/index.html`): `duel-stake-wrap` hidden by default, shown only on `?mode=duel`. Commit 915d7ef.
- **Minesweeper context menu + leaderboard prompt** (`minesweeper/index.html` + `qf-leaderboard-prompt.js`): `contextmenu` preventDefault added to board container; 150ms `backdropReady` delay on leaderboard backdrop click listener. Commit d0a3eaf.

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
