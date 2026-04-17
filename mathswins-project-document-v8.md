# MathsWins — Project Document (v8)

## Single Source of Truth
This document defines everything about mathswins.co.uk. Both Project Claude (PC) and Code Claude (CC) work from this document. If it's not in here, it hasn't been decided.

**Last updated:** 11 April 2026

---

## The Brand

**Name:** MathsWins
**Domain:** mathswins.co.uk
**Tagline:** The Maths Behind Every Decision
**Mission:** Teach the mathematics behind every game of chance, competitive skill, and financial decision. Not gambling — education. Not tips — arithmetic.

**What MathsWins IS:**
- A mathematical education platform with five pillars: Academy, Games, Everyday Maths, Tools, QF Games dApp
- A suite of interactive trainers teaching probability, expected value, and decision theory
- A collection of free skill-based games and financial calculators
- A competitive gaming platform on QF Network (the dApp)
- Paid via Stripe (GBP) for courses + QF tokens for competitive gaming

**What MathsWins IS NOT:**
- A gambling site, tipping service, or casino
- Connected to maffsgames.co.uk in any user-facing way (except one credibility line in About section)

**Relationship to MaffsGames:**
Completely separate. Different domains, repos, audiences, business models, and design systems. MathsWins may reference MaffsGames in the About section as a credibility signal. MaffsGames (schools, free) must NEVER reference MathsWins, academy products, or gambling content. One-way link structure: MathsWins → MaffsGames only, never the reverse.

---

## Who This Is For

**Primary:** Adults (18+) who gamble, trade, invest in crypto, or play competitive games and want to understand the mathematics.
**Secondary:** Maths enthusiasts who enjoy probability, game theory, and expected value as intellectual exercises.
**NOT for:** Children, problem gamblers seeking "winning systems," anyone looking for financial advice.

---

## Technical Stack

| Component | Detail |
|-----------|--------|
| Hosting | GitHub Pages (repo: OrthogonalMaffs/MathsWins) |
| Domain | mathswins.co.uk (DNS: IONOS) |
| Build step | None. Single-file HTML for everything. |
| Fonts (main site) | Google Fonts: DM Mono, Bebas Neue, Crimson Pro, Outfit |
| Fonts (dApp) | Playfair Display, JetBrains Mono, Inter |
| Maths rendering | KaTeX 0.16.9 CDN (where needed) |
| Payments (courses) | Stripe (live) — Payment Links + localStorage gating |
| Payments (dApp) | QF tokens on QF Network |
| Auth (main site) | Google OAuth via Cloudflare Worker |
| Auth (dApp) | MetaMask / Talisman wallet connection |
| Backend (main site) | Cloudflare Worker (`mathswins-restore`) at api.mathswins.co.uk |
| Backend (dApp) | Hetzner Box 1 (204.168.200.237), port 3860, PM2 `mathswins-dapp` (user jon) at dapp-api.mathswins.co.uk |
| User data (main site) | Cloudflare KV |
| User data (dApp) | SQLite at `/home/jon/mathswins-dapp/data/mathswins.db` |
| Analytics | GA4 cookieless — see Analytics section |
| Contracts | solc 0.8.26 / resolc, optimizer 200 runs, via_ir enabled |
| Wallet | ethers.js v6 (dApp only, live) |
| IPFS | Pinata (account live, JWT on Hetzner) |

---

## Current Deployed State

**Main site:**
- 28 tools with WebApplication + FAQ schema
- 20 parent guides (10 KS3, 10 GCSE) at /parents/
- 13 games (main site, MathsWins theme)
- 7 learn articles live at /learn/
- 9 academy courses (live with content gating)
- 6 everyday maths courses (UK Tax fully built, 5 Coming Soon)
- 90+ sitemap URLs
- Full SEO: FAQ, WebApplication, Course, Article schema, OG, twitter:card
- Cookie consent banner on all pages with GA4 consent mode
- Google OAuth sign-in live
- Stripe payments live with upgrade credit system

**dApp deployed state (11 April 2026):**
- **Lobby:** 4-tab structure — Leagues | Duels | Free | Leaderboards
- **Leagues tab:** 4-corner grid (Sudoku Duel ★, KenKen, Minesweeper, FreeCell) with logo centre
- **Duels tab:** All 10 duel-capable games (free score comparisons — payment not yet wired)
- **Free tab:** All free games with search/filter
- **Leaderboards tab:** Global leaderboard, game selector, Daily/Weekly/Monthly toggle, top 10 + expand, gold highlight for connected wallet
- **My Account page:** Live at /qf-dapp/my-account/ — 4 tabs: My Leagues, High Scores, Achievements, Trophies
- **Shared nav:** qf-nav.js across all 35 dApp pages
- **Anti-cheat:** Pattern analysis (sequential input detection, timing uniformity), flag propagation to league_scores, GET /admin/flagged-sessions endpoint
- **Scoring fix:** KenKen, Kakuro, Nonogram — penalise grid submissions not cell errors (deployed 11 April)
- **Kakuro:** In-game help button (? overlay, timer unaffected)
- **League lobby pages:** All 6 active league games have lobby pages (including Minesweeper and FreeCell — fixed 11 April)
- **Global leaderboard backend:** Live — DB table, 4 endpoints, 5% burn on entry
- **Profile endpoint:** Returns personal_bests, league_bests, achievements, wallet_stats, league_history, trophies, leaderboard_positions
- DB schema: 31 tables (added global_leaderboard_entries)
- Box 1 and GitHub confirmed in sync

**In progress (11 April 2026):**
- Phase 5b — My Account High Scores upgrade (leaderboard sort, rank display, second-chance submission, NaN:NaN fix) — task sent to CC

---

## Analytics

**MathsWins measurement ID:** G-7GTLYCZMXN (confirmed live)
**MaffsGames measurement ID:** Separate property, separate ID. Zero crossover.
**Mode:** GA4 consent mode, cookieless (`storage: 'none'`, `anonymize_ip: true`).

**RULE:** Verify the live ID from `view-source:https://mathswins.co.uk` before deploying. Do NOT use retired IDs: G-CLNF7GSB28, G-57E4YC6454, G-WEGLD3L2VQ, G-28ZYY6MXKP.

---

## Authentication & Access System (Main Site)

**Primary:** Google Sign-In (OAuth 2.0).
**Fallback:** Email magic link.
**Session:** httpOnly secure cookie, 90 days (365 for lifetime buyers).
**Backend:** Cloudflare Worker at api.mathswins.co.uk/auth
**User store:** Cloudflare KV — Google ID, email, purchases.

**Upgrade credit system (live):**
- Individual course spend credited toward Premium
- £1.00 minimum charge floor
- If total spend ≥ £99.99 → annual free; if ≥ £149.99 → lifetime free
- Single-use Stripe coupons via Coupons API, cached in KV 24 hours

---

## Pricing (Confirmed — Stripe Live)

### Academy Courses

| Product | Basic | Advanced | Master | Pro |
|---------|-------|----------|--------|-----|
| Blackjack Academy | £6.99 | £12.99 | £17.99 | — |
| Poker School | £6.99 | £12.99 | £17.99 | £24.99 |
| Sports Betting Maths | £6.99 | £12.99 | £17.99 | — |
| Trading Maths | £6.99 | £12.99 | — | — |
| Roulette Reality Check | £3.99 | — | — | — |
| Craps Decoded | £3.99 | — | — | — |
| Slots: The Ugly Truth | £1.99 | — | — | — |
| Lottery Maths | £1.99 | — | — | — |
| Baccarat Breakdown | £1.99 | — | — | — |
| Options Maths | £9.99 | £17.99 | £29.99 | — |
| Crypto Trading Maths | £9.99 | £17.99 | £29.99 | — |

### MathsWins Premium

| Plan | Price | Includes |
|------|-------|---------|
| Annual | £99.99/year | Everything — all courses, all tools, all future releases |
| Lifetime | £149.99 one-time | Everything, forever |

### Free Content

All games (13 on main site), all Everyday Maths courses (6), all tools (28), Module 1 of every academy course.

---

## Product Catalogue

### Academy Courses (12)

| Course | Slug | Modules | Accent | Status |
|--------|------|---------|--------|--------|
| Blackjack Academy | blackjack | 11 | Gold #d4a847 | Live |
| Poker School | poker | 20 | Green #2dd4a0 | Live |
| Sports Betting Maths | sports-betting | 16 | Blue #2563eb | Live |
| Trading Maths | trading | 6 | Emerald #10b981 | Live |
| Roulette Reality Check | roulette | 5 | Red #ef5350 | Live |
| Craps Decoded | craps | 5 | Gold #d4a847 | Live |
| Slots: The Ugly Truth | slots | 7 | Magenta #e040fb | Live |
| Lottery Maths | lottery | 5 | Yellow #facc15 | Live |
| Baccarat Breakdown | baccarat | 4 | Dark Gold #b8860b | Live |
| Options Maths | options | 10 | Cyan #06b6d4 | M1 live, M2–6 received |
| Crypto Trading Maths | crypto-trading | 10 | Orange #f97316 | Planned |
| Card Counter Tool | — | — | Gold #d4a847 | Planned (Phase 3) |

### Everyday Maths (6, all free)

| Course | Status |
|--------|--------|
| UK Tax Maths | Built (5 modules with interactive calculators) |
| Compound Interest & Debt | Coming Soon |
| Mortgage Maths | Coming Soon |
| Pension Maths | Coming Soon |
| Inflation & Real Returns | Coming Soon |
| Everyday Probability | Coming Soon |

### Free Tools (28)

Tools hub at /tools/. All include .mb and .pln sections, cross-links, WebApplication schema, FAQ schema.

Original 9: UK Student Loan Calculator, Free Bet Calculator, Poker Odds Calculator, Mortgage Overpayment Calculator, Compound Interest Calculator, Accumulator Calculator, Impermanent Loss Calculator, Crypto Liquidation Calculator, Salary Sacrifice Calculator.

Additional 19: Debt Snowball Calculator, UK Take Home Pay Calculator, Pension Gap Calculator, Side Hustle Tax Calculator, Self-Employment Tax Calculator, Invoice Tax Reserve Calculator, IR35 Calculator, Dividend vs Salary Calculator, VAT Threshold Monitor, Mileage & Expenses Calculator, Childcare Cost Calculator, Stamp Duty Calculator, Habit Cost Calculator, Rent vs Buy Calculator, Savings Goal Calculator, Emergency Fund Calculator, Child Benefit Calculator, Life Insurance Calculator, Overround Calculator.

### Learn Articles (7, live)

Hub at /learn/. Articles on poker odds, pot odds, salary sacrifice, overround, card counting, impermanent loss, pay rise/fiscal drag.

### Parent Guides (20)

Hub at /parents/. KS3 (10): Negative Numbers, Algebra, Fractions, Ratio, Sequences, Area & Perimeter, Angles, Probability, Averages, Coordinates. GCSE (10): Expanding & Factorising, Simultaneous Equations, Trigonometry, Circle Theorems, Standard Form, Indices & Surds, Graph Transformations, Pythagoras, Probability Trees, Statistics & Data.

---

## QF Games dApp

### Overview

Competitive gaming platform at mathswins.co.uk/qf-dapp/. Separate theme, separate auth, separate backend from main site.

**Status:** Lobby restructured, leagues ready, public launch pending Jon's go-ahead.

### Design — Sabre Theme

| Element | Detail |
|---------|--------|
| Aesthetic | Brushed silver/graphite on dark charcoal |
| Fonts | Playfair Display, JetBrains Mono, Inter |
| Accents | Silver, gold #c9a84c for highlights |

### Lobby Structure (4 tabs)

**Tab 1 — Leagues:**
```
[Sudoku Duel ★]    [KenKen]
      [MW LOGO]
[Minesweeper]      [FreeCell]
```
- Sudoku Duel top-left, animated silver pulse, flagship
- Logo cell centre, links to mathswins.co.uk
- Bronze/Silver tier badges per card

**Tab 2 — Duels:**
All 10 duel-capable games as cards. Free score comparisons — QF payment not yet wired.

**Tab 3 — Free:**
All free play games with client-side text search.

**Tab 4 — Leaderboards:**
- Game selector dropdown (20 games, Battleships excluded)
- Daily | Weekly | Monthly period toggle
- Top 10 visible, expand to full list
- Connected wallet row highlighted in gold
- Empty state: "No entries yet. Be the first to appear."

### Game Rosters

**Active league games (4):** Sudoku Duel, KenKen, Minesweeper, FreeCell

**League lobby pages exist for:** Sudoku Duel, KenKen, Kakuro, Nonogram, Minesweeper, FreeCell

**Duel-capable (10, all flows complete):**
Sudoku Duel, Battleships, KenKen, Kakuro, Countdown Numbers, Nonogram, Minesweeper, FreeCell, Poker Patience, Cribbage Solitaire

**Free play only:** Maffsy, Higher or Lower, 52-dle, Towers of Hanoi, Don't Press It, Memory Matrix, RPS vs Machine, Estimation Engine, Sequence Solver, Prime or Composite, Cryptarithmetic Club, Battleships (vs CPU)

**Demoted from leagues (free/duel only):** Countdown Numbers, Cryptarithmetic Club

### Shared Nav Component

- **File:** `qf-dapp/qf-nav.js` — injected via `<div id="qf-nav"></div>` on all 35 dApp pages
- Links: Lobby | My Account (wallet connected only) | wallet connect button
- All CSS injected by JS

### My Account Page

**URL:** `/qf-dapp/my-account/index.html`
**Auth:** Wallet-gated — redirects to /qf-dapp/ if no JWT
**LocalStorage keys:** `qf_auth_token` (JWT), `qf_wallet_id` (EVM), `qf_substrate_addr` (Substrate)

**Four tabs:**

| Tab | Source |
|-----|--------|
| My Leagues | GET /leagues/my (JWT auth) |
| High Scores | profile.personal_bests + profile.league_bests + profile.leaderboard_positions |
| Achievements | GET /achievements/status + profile.achievements |
| Trophies | profile.trophies |

**High Scores tab (Phase 5b — in progress):**
- Scores on global leaderboard float to top, sorted by rank
- ⭐ Rank N — [period] shown next to ranked scores
- Eligible unsubmitted scores show "Would rank Nth — Submit for 50 QF" button
- Second-chance submission triggers wallet signing flow
- NaN:NaN time display bug fix included

### Global Leaderboard System

**Payment:** 50 QF to appear. 5% burn (2.5 QF), 95% team (47.5 QF). No prize pool.
**Surfaces:** Daily | Weekly | Monthly. No all-time.
**Prompt logic:**
- Fewer than 25 entries on that leaderboard: always prompt
- 25 or more entries: only prompt if score would place in top 25
- Prompt shown post-game (player sees score first, then decides)
- Suspicious sessions silently excluded from leaderboard eligibility

**Display:** Top 10 visible, "Show more" expands full list. Mobile first.
**One entry per wallet per game per period.**

### Anti-Cheat System

Pattern analysis runs at league puzzle submission. Checks:
1. **Sequential order:** % of placements in monotonically increasing cell index order. Flag if >70%.
2. **Timing uniformity:** Standard deviation of intervals between placements. Flag if stddev <800ms.

Flagged sessions:
- Score written to league_scores normally (player sees no difference)
- Silently excluded from leaderboard queries and achievement eligibility
- `suspicious` and `suspicious_detail` columns written to league_scores
- Visible to Jon at GET /admin/flagged-sessions (supports ?wallet= and ?league_id= filters)
- Applies to: Sudoku Duel, KenKen, Kakuro (grid-based games)
- Global leaderboard entries also exclude suspicious sessions

### Duel System

- 1v1 via 6-character share codes
- All 10 games have complete duel flows
- **Stakes: UI stripped — duels are currently free score comparisons**
- Duel payment architecture (on-chain escrow or server-side balance) needs a spec session before building
- Share code visible inside modal (fixed 11 April)
- Back button on all duel game pages

### League System

**Status:** Built, test leagues active. Public launch pending Jon's go-ahead.

- Two tiers: Bronze (100 QF) / Silver (250 QF)
- Minimum 4 players, 10 puzzles, 14 days to complete
- Revenue: 5% burn, 5% team, 90% prize pool
- Prizes: 1st 50%, 2nd 25%, 3rd 15%, 4th 10%
- Test leagues excluded from all achievement and record tracking
- **Scoring (fixed 11 April):** KenKen, Kakuro, Nonogram penalise grid submissions (-300 each), not cell placement errors

### Wallet Connection

- MetaMask + Talisman (EVM), wallet chooser modal when both installed
- Shared wallet module: `qf-dapp/games/qf-wallet.js`
- Auto-add QF Network (chain ID 3426)
- QNS name resolution via reverseResolve
- No auto-connect
- Auth: `Authorization: Bearer <token>` (JWT preferred) or legacy `X-Wallet-Address`

### QNS Integration

- New Resolver: `0x276b7e9343c19bea29d32dd4a8f84e6d1c183111`
- Old Resolver: `0xd5d12431b2956248861dbec5e8a9bc6023114e80`

### QF Payment Burn Rules

**5% burn on every QF payment. Non-negotiable.**

| Payment type | Burn | Team | Player/Prize |
|-------------|------|------|-------------|
| League entry | 5% | 5% | 90% prize pool |
| Duel entry | 5% | 5% | 90% to winner (not yet wired) |
| Achievement mint | 5% | 95% | — |
| Trophy mint | 5% | 95% | — |
| Leaderboard entry | 5% | 95% | — |

### Trophy NFTs

- Contract: QFLeagueTrophy.sol — `0xBC41549872d5480b95733e4f29359b7EAB4E05b8`
- Owner: `0x76E00079d96A9AFe44D9883fA23A5B6e0297903E` (onlyfans.qf)
- Minter: `0xFc6346C5A10c51Ef6B9cE9746F436b0b7Ec3D7b6` (escrow)
- Soulbound ERC-721, 22 Forge tests passing
- 1st place: Silver. 2nd place: Bronze. 3rd/4th: prize only.
- Trophy data served from DB (commemorative_mints) via profile endpoint

**Trophy image status:**

| Game | Silver | Bronze |
|------|--------|--------|
| Sudoku Duel | ✓ | ✓ |
| KenKen | ✓ | ✓ |
| Kakuro | ✓ | ✓ |
| Nonogram | ✓ | ✓ |
| Countdown Numbers | ✓ | ✓ |
| Cryptarithmetic Club | ✓ | ✓ |
| Poker Patience | ✓ (ChatGPT) | ✓ (ChatGPT) |
| Cribbage Solitaire | ✓ | ✓ |
| Golf Solitaire | ✓ | ✓ |
| Pyramid | ✓ | ✓ |
| Battleships | ✓ | ✓ |
| Minesweeper | ✓ (ChatGPT) | ✓ |
| FreeCell | Deferred | Deferred |

### Achievement NFT System

**Contract:** QFAchievement.sol — soulbound ERC-721
**Status:** ACHIEVEMENTS_ACTIVE=false. Teaser page live at /qf-dapp/achievements/.
**Spec:** achievement-system-spec-v5 (see separate document)

Key rules:
- All criteria secret
- 5% burn, 95% team
- Pioneer tag: first mint per achievement
- Test sessions excluded
- 161 achievements, 32 categories
- Mint reward: every 5th paid mint free, every 10th gives 2 free mints

**Achievement system v5 changes (specced, not yet built):**
- No Errors redesigned: 10 consecutive free play games, zero errors, 8 games (Sudoku Duel, KenKen, Minesweeper, FreeCell, Kakuro, Nonogram, Countdown Numbers, Cryptarithmetic Club)
- Immaculate: requires all 8 No Errors NFTs, self-scaling
- New Leaderboard category: On the Board, Regular, Dedicated Competitor (free mint at 25 entries), Century Club (free mint at 100 entries), Top of the World, Podium, Daily Grinder
- The Contrarian updated: duel roster now 10 games
- All achievement checks exclude suspicious-flagged sessions

### dApp Backend

**Box 1:** 204.168.200.237, port 3860, PM2 `mathswins-dapp` (user jon)
**SSH:** `root@204.168.200.237` with `~/.ssh/hetzner-vm`, PM2 via `su - jon`
**Deploy:** `scp` files to `/home/jon/mathswins-dapp/src/` (backend) or `/src/games/` (game files)
**API base:** `https://dapp-api.mathswins.co.uk/api/dapp`
**Database:** SQLite at `/home/jon/mathswins-dapp/data/mathswins.db`
**Box 2 (37.27.219.31):** bots, indexer, explorer only — NO dApp backend

### SQLite Tables (31)

| Table | Purpose |
|-------|---------|
| `games` | Game registry |
| `entries` | Paid game entries |
| `sessions` | Game session records |
| `best_scores` | Legacy leaderboard (empty) |
| `settlements` | Prize settlement records |
| `duels` | 1v1 duel challenges |
| `leagues` | League instances |
| `league_players` | Players per league |
| `league_puzzles` | Pre-generated puzzle seeds |
| `league_scores` | Puzzle scores (+ mistake_count, hints_used, undos_used, free_cells_used, flags_used, helper_used, suspicious, suspicious_detail) |
| `league_prizes` | Prize payouts |
| `promo_challenges` | Promo/challenge codes |
| `promo_claims` | Promo claims |
| `active_game_state` | Session state for resume |
| `league_refunds` | Refund tracking |
| `battleships_games` | Battleships duel instances |
| `battleships_placements` | Fleet positions |
| `battleships_rounds` | Shot history |
| `battleships_record` | Win/loss/draw per wallet |
| `achievement_registry` | 161 achievements |
| `achievement_eligibility` | Per-wallet progress and mint status |
| `global_records` | Community records |
| `wallet_stats` | Per-wallet tracking |
| `personal_bests` | Best free play score per wallet/game/difficulty |
| `league_bests` | Best league total score per wallet/game/tier |
| `game_messages` | Preset messages |
| `seasonal_windows` | Seasonal achievement windows |
| `commemorative_mints` | Trophy NFT mint records |
| `global_leaderboard_entries` | Global leaderboard paid entries (NEW) |

### API Endpoints (50+)

**Auth:** POST /auth/challenge, /auth/verify
**Sessions:** POST /session/start, /session/resume, /session/evaluate
**Leaderboard (legacy weekly):** GET /leaderboard/:gameId, /leaderboard/:gameId/:weekId, /pot/:gameId, /games, /week, /entry/:gameId
**Global Leaderboard (new):** GET /global-leaderboard/:gameId/:periodType | GET /global-leaderboard/:gameId/eligibility | GET /global-leaderboard/my-positions | POST /global-leaderboard/enter
**Duels:** POST /duel/create, /duel/:code/accept, /duel/:code/submit | GET /duel/:code, /duels/history
**Promos:** POST /promo/create, /promo/:code/submit | GET /promo/:code
**Leagues:** GET /leagues/:gameId, /leagues/:gameId/all, /league/:leagueId, /league/:leagueId/puzzles, /league/:leagueId/my-scores | POST /league/:leagueId/join, /league/:leagueId/submit
**League admin:** GET /leagues/my, /leagues/active, /leagues/settled | POST /admin/league/:id/settle, /admin/league/:id/cancel, /admin/league/:id/refund/:wallet | GET /admin/refunds
**Battleships:** POST /battleships/create, /:code/join, /:code/place, /:code/shoot, /:code/forfeit | GET /battleships/:code, /battleships/history
**Achievements:** GET /achievements/status, /achievements/all, /achievements/my, /achievements/record/:id | POST /achievement/mint | POST /admin/achievement/register, /admin/achievement/award | GET /admin/achievements
**Anti-cheat:** GET /admin/flagged-sessions (supports ?wallet= and ?league_id= filters)
**Profile:** GET /profile/:wallet (public, 60/min — returns personal_bests, league_bests, achievements, wallet_stats, league_history, trophies, leaderboard_positions)

### Minesweeper Board Sizes

| Name | Grid | Mines | Mobile |
|------|------|-------|--------|
| Pocket | 12×12 | 20 | Yes |
| Beginner | 9×9 | 10 | Yes |
| Intermediate | 16×16 | 40 | Yes |
| Expert | 30×16 | 99 | No (disabled <768px) |

League: Bronze = Intermediate (16×16, 40 mines). Silver = Advanced (18×18, 65 mines — server-side only).

### KenKen / Kakuro / Nonogram Scoring

- KenKen: Base 5000, -1pt/sec after 60s, -300 per incorrect grid submission, -500 per hint
- Kakuro/Nonogram: same penalty structure — penalise grid submissions not cell errors (fixed 11 April)
- 3 incorrect grid submissions = game over

---

## QF Network Details

```
Chain ID:   3426
RPC:        https://archive.mainnet.qfnode.net/eth
Block time: ~0.1s
Gas:        near-zero
```

---

## Design System — Main Site

### Palette

| Token | Value | Usage |
|-------|-------|-------|
| --bg | #050709 | Page background |
| --surface | #0a0d14 | Card backgrounds |
| --surface2 | #0f1319 | Elevated surfaces |
| --border | #161c28 | Primary borders |
| --border2 | #1e2638 | Secondary borders |
| --gold | #d4a847 | Primary accent |
| --teal | #0d9488 | Brand secondary |
| --text | #c8cdd8 | Body text |
| --text-bright | #e8ecf4 | Headings |
| --muted | #4a5568 | Secondary text |

### Typography

| Font | Usage |
|------|-------|
| Bebas Neue | Headlines, product titles, hero text |
| DM Mono | Numbers, stats, code, calculations |
| Crimson Pro | Body prose, plain English translations (always italic) |
| Outfit | UI text, buttons, labels, navigation |

### Design Rules

- Dark theme everywhere. No light mode.
- Every mathematical claim backed by a .mb calculation.
- Every .mb has a .pln plain English translation.
- No marketing language. Maths language only.
- Every tool usable by someone who doesn't know the terminology.
- Responsible gambling helpline on every gambling product.
- FCA risk warning on every crypto/trading product.
- "Not financial advice" on Trading, Options, Crypto Trading.

---

## Working Pattern

### Roles

| Role | Who | Responsibility |
|------|-----|---------------|
| Jon | Human | Decisions, priorities, content review, deployment |
| Project Claude (PC) | This project | Planning, specs, content, architecture, this document |
| Code Claude (CC) | Separate Claude Code project | Implementation, commits, deployment |

### Two-Instance Model

PC writes specs and strategy. CC implements. Jon relays between them. CLAUDE.md is CC's ground truth for deployed state. This document is the canonical source for decisions.

### Communication Rules

- Do not guess. Say so if you don't know.
- Do not ramble. Get to the point.
- No cheerleading.
- Lead with the best solution.
- Challenge preconceptions with evidence.
- British English throughout.
- Manners matter.

---

## Task Contract Format

```
TASK: [one sentence]
ROOT CAUSE: [what is actually wrong]
EXACT CHANGE: [file, function, what changes to what]
DO NOT TOUCH: [explicit exclusions]
SUCCESS CONDITION: [how to know it's done]
STOP IF: [conditions requiring Jon's input]
```

All six fields required. CC must not begin without all six.

---

## Deployment Checklist

```
PRE-DEPLOYMENT CHECKLIST
========================

[ ] GA4 measurement ID is G-7GTLYCZMXN
[ ] Canonical URL matches exact page URL (https, trailing slash)
[ ] <title> under 60 chars, includes "| MathsWins"
[ ] <meta name="description"> under 155 chars
[ ] OG tags present
[ ] Dark theme (--bg: #050709)
[ ] Mobile responsive (tested at 375px)
[ ] All links use <a> tags, not onclick
[ ] Nav bar present
[ ] Footer present
[ ] Cookie consent banner present

CONTENT-SPECIFIC:
[ ] Gambling: responsible gambling notice (0808 8020 133)
[ ] Crypto/trading: FCA risk warning
[ ] Trading/options: "Not financial advice"
[ ] Tools: layman's explanation of all terms

SEO:
[ ] Page in sitemap.xml
[ ] Structured data present
[ ] Cross-links to 2-3 related pages

POST-DEPLOY:
[ ] Page loads correctly on live site
[ ] GA4 real-time confirms page view
[ ] Search Console indexing requested
```

---

## Quality Gates

### Before Any Push to Main
1. No console errors
2. GA4 ID is G-7GTLYCZMXN across ALL files
3. No hardcoded test data or TODO comments
4. All navigation uses `<a>` tags

### Before League Public Launch
1. Test leagues excluded from achievements and records
2. ACHIEVEMENTS_ACTIVE=false confirmed
3. At least one Bronze + Silver league per active game
4. Refund flow tested on cancelled test league
5. Anti-cheat confirmed active

### Before Achievement System Launch
1. All condition checks tested against real data
2. Pioneer UNIQUE constraint tested
3. Boom confirmed unawardable
4. Jon explicitly confirms go-ahead

---

## On the Horizon

### Immediate
1. Phase 5b — My Account High Scores upgrade (in progress with CC)
2. Achievement system v5 build (No Errors streaks, leaderboard achievements)
3. Duel payment architecture spec session
4. FreeCell trophy images (ChatGPT prompts ready)
5. First public leagues launched (Jon confirms go)
6. CLAUDE.md update to reflect all 11 April changes

### Short-Term
7. Achievement system activation (Jon confirms go)
8. Trophy NFT deployment to QF Network + IPFS
9. Continue /learn/ articles (target: 2 per week)
10. QF7 FPL Maths (build April, launch August 2026)
11. Promo settlement system (25 QF prizes)
12. Deploy pipeline (rsync script to prevent partial deploys)

### Deferred (Phase 3)
- Duel payment wiring (on-chain escrow or server-side balance)
- Fiat credits + custodial wallet system
- Community Cup knockout tournaments
- QF token payments for academy courses
- Card Counter Tool
- Sudoku Duel native app
- Achievement artwork (prompts ready)

---

## Retired / Deprecated

| Item | Replaced By |
|------|-------------|
| Equatle | Maffsy |
| Old competitive grid (8 games) | 4-tab lobby structure |
| My Leagues tab in wallet bar | My Account page + nav link |
| Per-page inline nav HTML (35 files) | qf-nav.js |
| Countdown Numbers (league) | Free/duel only |
| Cryptarithmetic Club (league) | Free only |
| Duel QF stake UI | Stripped — free score comparisons until payment built |
| All-time global leaderboard | Daily/Weekly/Monthly only |
| GA4 IDs G-CLNF7GSB28, G-57E4YC6454, G-WEGLD3L2VQ, G-28ZYY6MXKP | G-7GTLYCZMXN |

---

## Safety Rules

- **Never** expose private keys, API keys, or wallet credentials in committed files
- **Never** restart PM2 without explicit "yes" from Jon
- **No** wallet connection code on main site without Jon's approval
- **No** financial advice or outcome predictions
- **No** marketing to under-18s
- Responsible gambling messaging on ALL gambling content
- FCA risk warning on ALL crypto/trading content
- Do NOT use `£` as a JavaScript function name
- **5% burn on every QF payment is non-negotiable**
- Test sessions never count toward achievements, records, or Pioneer tags

---

## Lessons Learned

| What happened | Rule going forward |
|--------------|-------------------|
| GA4 IDs mixed between sites | Verify live ID from page source before deploying |
| localStorage gating proposed for £150 product | Always recommend the modern solution first |
| Files delivered without deployment instructions | Every handover includes file list, paths, checklist |
| Canonical URL mismatch blocked indexing | Canonical URLs must exactly match live URL |
| Tools used jargon without explanation | Every tool must work for someone new to the terminology |
| 48 homepage cards used onclick | All navigation must use crawlable `<a>` tags |
| CC restarted PM2 without permission | PM2 restart requires explicit "yes" from Jon |
| League session fired before wallet connected | Show connect prompt when ?league= in URL and no wallet |
| dApp recorded as PostgreSQL | SQLite at /home/jon/mathswins-dapp/data/mathswins.db |
| Simultaneous Battleships specced before infrastructure assessed | Assess infrastructure before committing to real-time features |
| 10% burn recorded — incorrect | Burn is 5%. Team 5%. Player/prize pool 90% |
| CC deployed partial update — imports but no files | Verify imported files exist on target before deploying |
| db/index.mjs rewritten without all CREATE TABLEs — 9 tables lost | Schema must be self-healing. Line-by-line comparison before any rewrite. |
| Nav HTML duplicated across 35 files | Shared UI goes in a single JS file. Never duplicate structural HTML. |
| Duel stakes shown in UI but never collected | Never show payment UI for a system that isn't wired. Strip or disable until built. |
| KenKen/Kakuro/Nonogram penalising cell errors not grid submissions | Scoring penalises grid submissions. Cell placement errors are feedback only. |
| Sudoku duel share code hidden behind results overlay | Z-index and display order must be verified for all modal/overlay combinations. |

---

*End of project document v8. Single source of truth. Both Project Claude and Code Claude work from this.*
