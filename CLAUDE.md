# MathsWins — CLAUDE.md

## What This Is
Platform with 5 pillars: Academy (paid courses), Tools (28 free calculators), Games (13 free), Everyday Maths (6 free courses), Learn (articles). Separate from MaffsGames (schools site).

- **Site:** mathswins.co.uk (GitHub Pages)
- **Repo:** OrthogonalMaffs/MathsWins
- **Contact:** contact@mathswins.co.uk
- **BMC:** buymeacoffee.com/maffsgames (shared account)
- **Tagline:** "The Maths Behind Every Decision"

## Reference Files
- Academy courses (modules, pricing, tiers): see `.claude/rules/academy-courses.md`
- Tools list (28 calculators): see `.claude/rules/tools-list.md`
- Parents guides (20 guides): see `.claude/rules/parents-guides.md`
- Games roster (13 games): see `.claude/rules/games-roster.md`
- Smart contracts: see `.claude/rules/smart-contracts.md`
- Payment config (Stripe, pricing, upgrades): see `.claude/rules/payment-config.md`
- Auth flow (Google Sign-In, Workers, JWT): see `.claude/rules/auth-flow.md`
- Directory structure: see `.claude/rules/directory-structure.md`

## Origin
Split from MaffsGames in March 2025. MaffsGames = free schools games. MathsWins = academy + tools + everything commercial. Zero crossover in branding or contact.

## Tech Stack
- Single-file HTML (no build step, no framework)
- KaTeX CDN for math rendering
- GitHub Pages hosting
- Stripe for payments (Payment Links + localStorage, Phase 1 live)
- Cloudflare Workers + KV for auth (`api.mathswins.co.uk`)
- Google Identity Services for sign-in
- GA4 with consent mode (`G-7GTLYCZMXN`)

## Business Model (Brief)
- **MathsWins Premium:** Annual £99.99/year, Lifetime £149.99 (9 core academy courses)
- **Standalone:** Options Maths, Crypto Trading (NOT in Premium)
- **Free:** Games, Everyday Maths, Tools, Parents, Module 1 of all courses, Learn articles
- **Upgrade credit:** Users who bought individual courses get credit toward Premium
- **Phase 3 (future):** QF token payments + Academy.sol

## Current State
- 9 academy courses with Stripe payments (Module 1 free)
- 28 free tools (finance, self-employment, property, family, betting, crypto)
- 13 free games
- 6 free everyday maths courses
- 20 free parent guides
- /learn/ hub with 3 articles (poker odds, salary sacrifice, overround explained)
- /about/ page with BMC
- Google Sign-In + purchase restoration + upgrade credit live
- Cookie consent banner on all pages

## SEO
- Sitemap: 90+ URLs
- All pages: title, meta description, canonical, OG tags, twitter:card
- All tools: WebApplication + FAQPage schema
- All courses: Course schema
- Learn articles: Article + FAQPage schema
- Homepage cards are `<a>` tags (converted from onclick divs, 2026-03-28)
- OG image: `assets/og-image.png` (1200x630)

## Theme
- **Dark:** #050709 bg, #d4a847 gold accent, #0d9488 teal secondary
- **Fonts:** DM Mono (code), Bebas Neue (headings), Crimson Pro (italic), Outfit (UI)
- **Tone:** Confident, mathematical, zero-bullshit. Educational, not gambling.

## Educational Content Patterns
- `.mb` — math box (monospace formulas, worked examples)
- `.pln` — plain English explanation (cyan accent)
- `.pt` — practical tip (green accent)
- `.dg` — danger warning (red accent)

## dApp Backend (Competitive Games on QF Network)
- **Server:** Hetzner 37.27.219.31, port 3860, PM2 `mathswins-dapp`
- **API Base:** `https://dapp-api.mathswins.co.uk/api/dapp` (Cloudflare Tunnel)
- **Local:** `http://127.0.0.1:3860/api/dapp`
- **Database:** SQLite at `/home/ubuntu/dapp-backend/data/mathswins.db`
- **Frontend:** `qf-dapp/` directory, single-file HTML games, GitHub Pages
- **Wallet Module:** `qf-dapp/games/qf-wallet.js` — shared across all games, QNS reverse resolution, EIP-6963, auto-reconnect with 500ms delay

### Registered Games (8 league-capable)
estimation-engine, sudoku-duel, prime-or-composite, sequence-solver, countdown-numbers, kenken, nonogram, kakuro

### SQLite Tables (14)
| Table | Purpose |
|-------|---------|
| `games` | Game registry |
| `entries` | Paid game entries per wallet/week |
| `sessions` | Game session records |
| `best_scores` | Leaderboard — best score per wallet/game/week |
| `settlements` | Prize settlement records |
| `duels` | 1v1 duel challenges |
| `leagues` | League instances (game, tier, fee, status, schedule, pot) |
| `league_players` | Players per league (wallet, tx, puzzle_order) |
| `league_puzzles` | Pre-generated puzzle seeds per league |
| `league_scores` | Puzzle scores per player per league |
| `league_prizes` | Prize payouts per position |
| `promo_challenges` | Promo/challenge codes |
| `promo_claims` | Claims against promo challenges |
| `active_game_state` | Persistent session state for resume (league puzzles) |

### API Endpoints (27)
**Sessions:** POST /session/start, /session/resume, /session/evaluate
**Leaderboard:** GET /leaderboard/:gameId, /leaderboard/:gameId/:weekId, /pot/:gameId, /games, /week, /entry/:gameId
**Duels:** POST /duel/create, /duel/:code/accept, /duel/:code/submit | GET /duel/:code, /duels/history
**Promos:** POST /promo/create, /promo/:code/submit | GET /promo/:code
**Leagues:** GET /leagues/:gameId, /leagues/:gameId/all, /league/:leagueId, /league/:leagueId/puzzles, /league/:leagueId/my-scores | POST /league/:leagueId/join, /league/:leagueId/submit

### League System
- Server-authoritative: seeds never reach client, sequential random puzzle delivery
- Anti-cheat: 60s floor, rapid input detection
- Tiers: Bronze (100 QF entry), Silver (250 QF entry)
- 10 puzzles per league, 14-day play window, 8-16 players
- Top 4 share prize pool (90% prize, 5% burn, 5% team)
- Builder whitelist via BUILDER_WALLETS env var (testing without payment)
- Wallet must be connected before session starts (race condition fixed 2026-04-04)
- Score submit is awaited with error alerts (fire-and-forget bug fixed 2026-04-04)

### Trophy NFTs (QFLeagueTrophy.sol)
- **Contract:** `0xBC41549872d5480b95733e4f29359b7EAB4E05b8` (QF Network mainnet)
- **Owner:** `0x76E00079d96A9AFe44D9883fA23A5B6e0297903E` (onlyfans.qf)
- **Minter:** `0xFc6346C5A10c51Ef6B9cE9746F436b0b7Ec3D7b6` (escrow)
- Soulbound ERC-721, compiled with resolc, 22 Forge tests passing
- All 9 games have silver + bronze trophy images in `qf-dapp/games/{slug}/assets/`
- MidJourney prompts saved as `logoprompt.md` per game
- Pinata IPFS: account set up, JWT on Hetzner

### QNS Integration
- Reverse resolution via QNS Resolver contract (`reverseResolve(address)`)
- New Resolver: `0x276b7e9343c19bea29d32dd4a8f84e6d1c183111`
- Old Resolver: `0xd5d12431b2956248861dbec5e8a9bc6023114e80`
- Leaderboard displays .qf names when available

## Relationship to Other Projects
- **maffsgames.co.uk** — sister site, schools-only. Shares 5 games. Zero branding crossover.
- **QF Network** — the blockchain. MathsWins is a dApp on QF Network (Chain ID 3426).

## Safety
- No wallet connection code without explicit approval
- 10% burn on every QF payment is non-negotiable
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
