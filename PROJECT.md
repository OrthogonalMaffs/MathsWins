# MathsWins — Project Document (v4)

## Single Source of Truth
This document defines everything about mathswins.co.uk. Both Project Claude (PC) and Code Claude (CC) work from this document. If it's not in here, it hasn't been decided.

**Last updated:** 5 April 2026

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
| Backend (dApp) | Hetzner server (37.27.219.31, port 3860, PM2 `mathswins-dapp`) at dapp-api.mathswins.co.uk |
| User data (main site) | Cloudflare KV |
| User data (dApp) | SQLite at `/home/ubuntu/dapp-backend/data/mathswins.db` (Hetzner) |
| Analytics | GA4 cookieless — see Analytics section |
| Contracts | solc 0.8.26 / resolc, optimizer 200 runs, via_ir enabled |
| Wallet | ethers.js v6 (dApp only, live) |
| IPFS | Pinata (account live, JWT on Hetzner) |

---

## Current Deployed State

As confirmed by CC and CLAUDE.md (5 April 2026):

- **28 tools** with WebApplication schema and FAQ schema
- **20 parent guides** (10 KS3, 10 GCSE) at /parents/
- **13 games** (main site, MathsWins theme)
- **3 learn articles** live at /learn/
- **9 academy courses** (live with content gating)
- **6 everyday maths courses** (UK Tax fully built, 5 "Coming Soon")
- **90+ sitemap URLs**
- Full SEO: FAQ schema, WebApplication schema, Course schema, Article schema, OG tags, twitter:card tags
- Cookie consent banner on all pages with GA4 consent mode
- Google OAuth sign-in live across all pages
- Stripe payments live with upgrade credit system

**dApp deployed state:**
- **9 competitive games** in 3×3 grid (Sudoku Duel centre)
- **8 free games** in free section (including Maffsy, formerly Equatle)
- Minesweeper, FreeCell, Battleships: built and deploying
- Leagues: built, not yet publicly launched
- Achievement system: page live (teaser), contract and backend deploying
- Trophy NFTs: QFLeagueTrophy.sol compiled, 22 Forge tests passing
- Achievement NFTs: QFAchievement.sol deploying

---

## Analytics

**MathsWins measurement ID:** G-7GTLYCZMXN (confirmed live)
**MaffsGames measurement ID:** Separate property, separate ID. Zero crossover.
**Mode:** GA4 consent mode, cookieless (`storage: 'none'`, `anonymize_ip: true`).

**GA4 snippet for every HTML page:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-7GTLYCZMXN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-7GTLYCZMXN', {
    send_page_view: true,
    storage: 'none',
    anonymize_ip: true
  });
</script>
```

**RULE:** Verify the live ID from `view-source:https://mathswins.co.uk` before deploying. Do NOT use retired IDs: G-CLNF7GSB28, G-57E4YC6454, G-WEGLD3L2VQ, G-28ZYY6MXKP.

---

## Authentication & Access System (Main Site)

**Primary:** Google Sign-In (OAuth 2.0).
**Fallback:** Email magic link.
**Session:** httpOnly secure cookie, 90 days (365 for lifetime buyers).
**Backend:** Cloudflare Worker at api.mathswins.co.uk/auth
**User store:** Cloudflare KV — Google ID, email, purchases.

**Purchase flow:**
1. User signs in with Google
2. Clicks Buy → Stripe Checkout (email pre-filled)
3. Payment completes → Worker links purchase to Google account in KV
4. Session cookie updated, localStorage flags set
5. On any new device: Sign in with Google → purchases restored instantly

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

### Parent Guides (20)

Hub at /parents/. KS3 (10): Negative Numbers, Algebra, Fractions, Ratio, Sequences, Area & Perimeter, Angles, Probability, Averages, Coordinates. GCSE (10): Expanding & Factorising, Simultaneous Equations, Trigonometry, Circle Theorems, Standard Form, Indices & Surds, Graph Transformations, Pythagoras, Probability Trees, Statistics & Data.

### Learn Articles (3, live)

| Article | Slug | Funnels To |
|---------|------|-----------|
| How to Calculate Poker Odds | /learn/how-to-calculate-poker-odds/ | Poker School |
| Salary Sacrifice Explained | /learn/salary-sacrifice-explained/ | Salary Sacrifice Tool |
| Overround Explained | /learn/overround-explained/ | Sports Betting Maths |

---

## QF Games dApp

### Overview

Competitive gaming platform at mathswins.co.uk/qf-dapp/. Separate theme, separate auth, separate backend from main site.

**Status:** Leagues built, publicly launching imminently. Three new games deploying. Achievement system teaser live.

### Design — Sabre Theme

| Element | Detail |
|---------|--------|
| Aesthetic | Brushed silver/graphite on dark charcoal |
| Fonts | Playfair Display, JetBrains Mono, Inter |
| Accents | Silver |
| Card bars | All silver (unified) |

### Competitive Grid (3×3, fixed)

```
[Countdown Numbers]   [Sudoku Duel ★]      [Cryptarithmetic Club]
[Minesweeper]         [MW LOGO CELL]        [KenKen]
[FreeCell]            [Nonogram]            [Kakuro]
```

- **Sudoku Duel** — top centre, animated silver pulse, flagship
- **MW Logo cell** — centre, MathsWins logo in black and silver, silver pulse on hover, links to https://mathswins.co.uk
- All 8 game cards: league-capable, Bronze/Silver tier badges
- Minesweeper and FreeCell: Coming Soon placeholders until deployed

**League-capable games (8):** Sudoku Duel, Countdown Numbers, Cryptarithmetic Club, KenKen, Nonogram, Kakuro, Minesweeper, FreeCell.

**NOT league games:** Sequence Solver, Prime or Composite, Estimation Engine (removed from competitive grid).

### Free Games Section (8)

Maffsy (formerly Equatle), Higher or Lower, 52-dle, Towers of Hanoi, Don't Press It, Memory Matrix, RPS vs Machine, Battleships.

**Note:** Equatle renamed to Maffsy everywhere — all references, DB entries, slugs, main site games list.

### Wallet Connection

- MetaMask + Talisman (EVM mode), wallet chooser modal when both installed
- Shared wallet module: `qf-dapp/games/qf-wallet.js`
- Auto-add QF Network (chain ID 3426)
- QNS name resolution via reverseResolve
- No auto-connect
- **My Leagues tab** in wallet bar on all dApp pages (silver dot if active puzzles incomplete)
- **Achievements link** in wallet bar on all dApp pages (silver dot if unclaimed achievements)

### Duel System (Live)

- 1v1 via 6-character share codes
- Creator plays first, shares code, opponent plays same puzzle
- 24-hour expiry
- Settlement: 5% burn, 10% team, 85% to winner (via QFSettlement v2); draws split 85% evenly

### Duel Stake System (Finalised)

- Tiers: 25, 100, 250 QF, or custom (minimum 25 QF)
- Max 5 active unaccepted duels per wallet (anti-spam)
- No burn on expiry — full refund from escrow
- 3-2-1 countdown on create and accept flows

### League System

**Status:** Built, publicly launching imminently. Test leagues do not count toward any achievement or record.

- Two tiers: Bronze (100 QF) / Silver (250 QF)
- Minimum 4 players (launch threshold, revisit when volume established)
- 8–16 players per league, 7-day registration window
- 10 puzzles, 14 days to complete
- Late joining: 24 hours after start
- Leaderboard hidden during join window, live after
- Revenue: 5% burn, 10% team, 85% prize pool
- Prizes: 1st 50%, 2nd 25%, 3rd 15%, 4th 10%
- Sub-minimum cancel: full refund from escrow, no burn
- Auto-create: one new OPEN league per game+tier created when existing league starts
- Fill-first principle: players fill existing league before new one opens

### League Admin Controls

- Force-settle: admin endpoint, settles with current scores
- Cancel + refund: admin endpoint, full refund from escrow
- Manual refund retry: per-wallet endpoint for failed refunds
- Both admin wallets in ADMIN_WALLETS env var
- Failed refunds visible at GET /admin/refunds?status=failed

### My Leagues

Tab in wallet bar, all dApp pages. Shows:
- **Active:** leagues in progress with puzzle progress bar
- **Upcoming:** registered but not started
- **Completed:** last 30 days with position badge and prize

### Running Leagues Lobby Section

On /qf-dapp/ below competitive grid. Filterable by game. Each card shows game, tier, player count, spots remaining, join status, time remaining, entry fee. Join button if window open.

Recent Results section below: last 7 days of settled leagues, top 3 per league, trophy icon for 1st.

### New Games

#### Minesweeper (deploying)

- 4 board sizes: Pocket (12×12/20), Beginner (9×9/10), Intermediate (16×16/40), Expert (30×16/99)
- Free play: size selector, Microsoft deal numbers acceptable (cheatable, intentional)
- League: server-generated seeds, all validation server-side, solvability pre-verified
- First click always safe — mine placement server-side after first click position received
- Chord click supported
- Scoring: completion time (ms); DNF = negative safe cells remaining
- League mix: 3 Beginner, 4 Intermediate, 3 Expert
- Visible timer: starts on first click, format 00:00.000

#### FreeCell (deploying)

- Free play: Microsoft deal numbers 1–32,000, client-side logic, cheatable (intentional)
- League: server-generated seeds, all validation server-side, randomised deal order per player
- 4 free cells, 8 cascade columns, standard rules, supermove rule enforced
- Solvability pre-verified for all league deals
- Undo: unlimited, no scoring penalty, undo_count tracked server-side
- Auto-complete: algorithmic trigger, stops timer, cards animate to foundations
- Scoring: completion time primary, move count tiebreaker; DNF = negative cards remaining off foundations
- Move counter visible in free play, hidden in league

#### Battleships (deploying)

- Turn-based async duel only (simultaneous dropped — WebSocket infrastructure not justified)
- 10×10 grid, standard fleet (Carrier 5, Battleship 4, Cruiser 3, Submarine 3, Destroyer 2)
- Manual placement with rotate and randomise
- Player selects which ship fires each turn — range (Euclidean, nearest cell) displayed
- Shorter range shot resolves and animates first
- 24-hour turn limit, auto-shot on timeout
- Silver dot notification on lobby card when player's turn
- Sunk ship outline revealed on tracking grid
- Full opponent fleet revealed on game end
- Draw: both sink last ship same turn, 90% split evenly
- vs CPU: Recruit (random), Officer (hunt+target), Admiral (probability density map)
- No league

### Trophy NFTs

- Contract: QFLeagueTrophy.sol — soulbound ERC-721, compiled with resolc
- 22 Forge tests passing
- 1st place: Silver trophy NFT. 2nd place: Bronze trophy NFT. 3rd/4th: prize only, no NFT
- Position recorded in metadata (Winner / Runner Up), same image per tier per game
- Trophy images: game-specific artwork per existing logoprompt.md files
- Existing games with images: Sudoku Duel, KenKen, Kakuro, Nonogram (confirm others)
- New games needing trophy images: Minesweeper, FreeCell, Battleships (prompts written — see NFT Prompts section)
- Pioneer tag: first wallet ever to mint each trophy type, permanently in metadata
- Pinata IPFS: account live, JWT on Hetzner, text-only metadata at launch, updateTokenURI for future image addition

### Achievement NFT System

**Contract:** QFAchievement.sol — soulbound ERC-721, separate from QFLeagueTrophy.sol
**Status:** Deploying. `ACHIEVEMENTS_ACTIVE=false` until Jon confirms launch.
**Teaser page:** Live at /qf-dapp/achievements/ — names only, no criteria, no artwork, no minting.

#### System Rules

- All achievement criteria secret — never published anywhere
- Page shows names only, locked/unlocked state per connected wallet
- 5% burn on every mint, 95% to team
- Soulbound, non-transferable
- Pioneer tag: first ever mint of each achievement (UNIQUE constraint on achievement_id where is_pioneer = 1)
- Pioneer gets gold star embossed in NFT artwork
- Text-only metadata at launch, updateTokenURI owner function for future images
- Test leagues, duels, and sessions excluded from all condition checks
- `ACHIEVEMENTS_ACTIVE` env var gates all condition checking, awarding, and minting
- Public status endpoint: GET /api/dapp/achievements/status → { active: false, achievement_count: 47 }

#### Achievement List

**Category 1 — Purity (per game, 100 QF each)**

| Name | Condition | Game |
|------|-----------|------|
| No Errors — Sudoku | Complete a full league without a single incorrect entry | Sudoku Duel |
| No Errors — Minesweeper | Complete a full league without detonating once | Minesweeper |
| No Errors — FreeCell | Complete a full league without a stuck/failed position | FreeCell |
| No Errors — Countdown | Complete a full league without a single incorrect solution | Countdown Numbers |
| No Errors — Cryptarithmetic | Complete a full league without a single incorrect answer | Cryptarithmetic Club |
| No Errors — KenKen | Complete a full league without a single incorrect entry | KenKen |
| No Errors — Nonogram | Complete a full league without a single incorrect cell | Nonogram |
| No Errors — Kakuro | Complete a full league without a single incorrect entry | Kakuro |
| The Purist | Complete a full FreeCell league without a single undo | FreeCell |
| Flawless Line | Complete a full Minesweeper league without placing a single flag | Minesweeper |

**Super NFT — Immaculate (250 QF)**
Hold all 8 No Errors NFTs. Verified on-chain before mint permitted.

**Category 2 — Volume (cross-game, 100 QF each)**

| Name | Condition |
|------|-----------|
| First Steps | Complete your first league |
| Committed | Complete 10 leagues |
| Dedicated | Complete 50 leagues |
| Veteran | Complete 100 leagues |
| Legend | Complete 500 leagues |

**Category 3 — Winning (cross-game, 100 QF each)**

| Name | Condition |
|------|-----------|
| Winner | Win your first league |
| On a Roll | Win 5 leagues |
| Dominant | Win 25 leagues |
| Hat Trick | Win 3 consecutive leagues (any game, any tier) |
| The Completionist | Win a league on every game |
| The Tortoise | Win a league with the slowest total completion time of any league winner ever recorded |

**The Tortoise:** Multiple holders over time (soulbound — previous holders keep theirs). Current record holder and time displayed on achievements page as community board. No criteria shown. Test leagues excluded.

**Category 4 — Duels (cross-game, 100 QF each)**

| Name | Condition |
|------|-----------|
| First Blood | Win your first duel |
| Duelist | Win 10 duels |
| Gladiator | Win 50 duels |
| Heartbreaker | Win a duel by a single point |
| Giant Slayer | Win a duel against a current league champion |
| The Wall | Win 10 consecutive duels without a loss |

**Category 5 — Skill (100 QF each)**

| Name | Condition | Game |
|------|-----------|------|
| Clean Sweep | Clear Expert Minesweeper (30×16, 99 mines) in under 120 seconds | Minesweeper |
| Sub-Minute | Complete a Sudoku Duel puzzle in under 60 seconds | Sudoku Duel |
| Untouchable | Complete 5 consecutive league puzzles with zero mistakes across all 5 | Any |
| The Undo King | Use 100+ undos in a single FreeCell game and still win | FreeCell |
| Wrong Answer Streak | Get 10 consecutive wrong answers in Prime or Composite | Prime or Composite |

**Category 6 — Time & Dedication (100 QF each)**

| Name | Condition |
|------|-----------|
| Night Owl | Complete a league puzzle between 03:00 and 05:00 UTC |
| Weekend Warrior | Play at least one game every Saturday for 8 consecutive weeks |
| The Marathon | Active playing session of 4+ continuous hours (no gap over 15 minutes) |

**Category 7 — Absurd / Easter Egg (100 QF each)**

| Name | Condition |
|------|-----------|
| The Mathematician | Score exactly 3141 in any game |
| Lucky Number | Win FreeCell free play deal #7777 |
| Palindrome | Finish any game with a score that reads the same forwards and backwards |
| Speedrun to Zero | Complete a Sudoku Duel league with the lowest possible score across all 10 puzzles |
| Flag Everything | Flag every single cell on a Minesweeper board before any reveal |

**Category 8 — Community (100 QF each)**

| Name | Condition |
|------|-----------|
| Duel Master | Win a duel against 10 different wallets that each hold at least one achievement NFT |
| Night Owl | See Category 6 |
| onlyfans.qf | Manually awarded by Jon. Win a league while connected with a QNS name that makes the moderator laugh. No criteria. No appeal. |

**Recruiter** — parked. Needs referral tracking infrastructure first.

**Category 9 — Meta (100 QF each)**

| Name | Condition |
|------|-----------|
| The Collector | Hold 20+ achievement NFTs simultaneously |
| Pioneer Hunter | Hold 5+ Pioneer tags across different achievements |
| The Whale | Spend 10,000+ QF on achievement minting fees (cumulative) |

**Category 10 — The Impossible (50 QF)**

| Name | Reality |
|------|---------|
| Boom | Listed on page by name only. No category, no tier, no hint. Cannot be earned — first click is always safe by design. Jon can manually award via admin endpoint. Pioneer slot permanently empty. |

**Wooden Spoon Category**
Not named on page at launch. Shown as question marks only. Specced separately. 50 QF to mint. Auto-awarded at settlement, player pays to mint.

#### Achievements Page (/qf-dapp/achievements/)

**Teaser state (ACHIEVEMENTS_ACTIVE=false):**
- All achievement names visible
- All locked (no wallet can show unlocked)
- Mint buttons disabled
- Tortoise community board: "No record set yet"
- Wooden spoon section: question marks, count hidden
- Boom listed with no category, no tier, no hint — just the name
- Hero text: "Achievements are coming. Some will be found. Some may never be."
- Achievement count shown: "47 achievements. Some impossible. Most secret. All yours forever."

**Live state (ACHIEVEMENTS_ACTIVE=true):**
- Locked/unlocked per connected wallet
- Silver dot on nav if unclaimed achievements exist
- Mint button for eligible unclaimed achievements
- Tortoise community board shows current record holder and time
- Discovery popup on first qualification (full screen cinematic)
- Pioneer variant: gold "You are the first. Ever." line

#### Achievement DB Tables

```sql
CREATE TABLE achievement_eligibility (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  earned_at DATETIME NOT NULL,
  minted_at DATETIME,
  tx_hash TEXT,
  is_pioneer INTEGER DEFAULT 0,
  UNIQUE(wallet, achievement_id)
);

CREATE TABLE achievement_registry (
  achievement_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  game_id TEXT,
  tier TEXT NOT NULL,
  mint_fee_qf INTEGER NOT NULL,
  first_claimed_by TEXT,
  first_claimed_at DATETIME,
  active INTEGER DEFAULT 1
);

CREATE TABLE global_records (
  record_id TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  value TEXT NOT NULL,
  achieved_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

#### Additional Wallet Tracking Required

- `saturday_streak INTEGER DEFAULT 0` per wallet
- `saturday_last_played DATE` per wallet
- `total_qf_minted INTEGER DEFAULT 0` per wallet (cumulative, for The Whale)
- `consecutive_duel_wins INTEGER DEFAULT 0` per wallet (reset on loss)
- `last_activity_at` on sessions table
- `mistake_count INTEGER DEFAULT 0` on league_scores table

### Promo Challenge System (Built)

- Custom short codes (e.g. #MAFFS) for free promotional challenges
- Creator plays, sets benchmark. Beat it → win 25 QF
- 1 claim per wallet, 2 attempts, max 20 winners per promo

### dApp Backend (Hetzner)

**Server:** 37.27.219.31, port 3860, PM2 `mathswins-dapp`
**API base:** `https://dapp-api.mathswins.co.uk/api/dapp`
**Database:** SQLite at `/home/ubuntu/dapp-backend/data/mathswins.db`

#### SQLite Tables (18+)

| Table | Purpose |
|-------|---------|
| `games` | Game registry |
| `entries` | Paid game entries |
| `sessions` | Game session records |
| `best_scores` | Leaderboard |
| `settlements` | Prize settlement records |
| `duels` | 1v1 duel challenges |
| `leagues` | League instances |
| `league_players` | Players per league (includes deal_order for FreeCell) |
| `league_puzzles` | Pre-generated puzzle seeds |
| `league_scores` | Puzzle scores per player (includes mistake_count) |
| `league_prizes` | Prize payouts |
| `league_refunds` | Refund tracking (pending/sent/failed) |
| `promo_challenges` | Promo codes |
| `promo_claims` | Claims against promos |
| `active_game_state` | Persistent session state |
| `battleships_games` | Battleships game instances |
| `battleships_placements` | Fleet placements per game |
| `battleships_rounds` | Shot records per round |
| `battleships_record` | Win/loss/draw per wallet |
| `achievement_eligibility` | Earned achievements per wallet |
| `achievement_registry` | Achievement definitions |
| `global_records` | The Tortoise and future global records |

### dApp — Not Yet Done

- Achievement system activation (ACHIEVEMENTS_ACTIVE=false until Jon says go)
- First public Bronze + Silver leagues launched per game
- League settlement script (manual for now)
- Promo settlement (sending 25 QF prizes)
- Trophy NFT deployment to QF Network + IPFS metadata upload
- Achievement NFT artwork (text-only metadata at launch)
- Community Cup knockout tournaments (future)
- Recruiter achievement (needs referral infrastructure)

---

## QF Network Details

```
Chain ID:   3426
RPC:        https://archive.mainnet.qfnode.net/eth
Block time: ~0.1s
Gas:        near-zero
Compiler:   solc 0.8.26 / resolc, optimizer 200 runs, via_ir enabled
```

---

## NFT Prompts

### Trophy NFT Prompts — New Games

**Minesweeper Silver:**
A premium collectible digital trophy on a deep charcoal-black background. A single naval mine rendered in polished silver — a perfect sphere with sharp conical spike protrusions radiating outward at precise intervals, each spike tip catching dramatic studio light. The mine's surface is smooth and reflective with subtle panel lines. Behind it, a faint Minesweeper grid in dim silver lines, a few cells showing revealed numbers, one flagged cell. Grid softly fades into darkness. Strictly monochrome: only silver and black tones. No text other than cell numbers, no logos, no banners. Photorealistic metallic rendering, ultra-detailed, high contrast. Square composition. `--v 6.1 --ar 1:1 --style raw --s 250`

**Bronze swap:** Dark aged bronze sphere, matte weathered finish. `--no gold golden yellow warm glow polished shiny brass`

**FreeCell Silver:**
A premium collectible digital trophy on a deep charcoal-black background. Four playing cards fanned in an arc, rendered in polished silver — suit symbols (spade, heart, club, diamond) engraved in precise silver metalwork, card edges bevelled and gleaming. Behind, four free cell slots and four foundation pile outlines in faint silver lines, receding into darkness. Dramatic studio lighting from above. Strictly monochrome: only silver and black tones. No text, no logos, no banners. Photorealistic metallic rendering, ultra-detailed, high contrast. Square composition. `--v 6.1 --ar 1:1 --style raw --s 250`

**Battleships Silver:**
A premium collectible digital trophy on a deep charcoal-black background. A sleek warship rendered in polished silver — angular hull, precise deck details, gun turrets in brushed steel, viewed from three-quarter elevated angle. Beneath, a coordinate grid of fine silver lines on charcoal, A–J rows and 1–10 columns faintly suggested, two or three hit markers as small raised silver circles. Ship floats above grid casting controlled shadow. Dramatic studio lighting from above. Strictly monochrome: only silver and black tones. No text other than coordinate labels, no logos, no banners. Photorealistic metallic rendering, ultra-detailed, high contrast. Square composition. `--v 6.1 --ar 1:1 --style raw --s 250`

### Achievement Tier Prompts

**Bronze:** Solid bronze medal, circular, matte weathered surface, oxidation and patina in recessed areas. Face features abstract relief of mathematical symbols (sigma, pi, integral sign, probability curve). Strictly duotone: dark bronze-copper and black only. `--v 6.1 --ar 1:1 --style raw --s 250 --no gold golden yellow warm glow polished shiny brass`

**Silver:** Same composition in polished silver. Strictly monochrome: silver and black only. `--v 6.1 --ar 1:1 --style raw --s 250`

**Gold:** Same composition in rich warm gold — Olympic gold medal quality, not decorative. Strictly duotone: warm gold and black only. No silver, no bronze. `--v 6.1 --ar 1:1 --style raw --s 250`

**Obsidian:** Same composition in volcanic obsidian — almost black, cold violet and teal iridescent reflections on edges only. Maximum drama, minimum light. `--v 6.1 --ar 1:1 --style raw --s 250`

**Pioneer variant:** Add to any tier prompt before final sentence: "A small five-pointed star is embossed at the top centre of the medal face — the single most luminous point in the image."

**Wooden Spoon:** Single wooden spoon, unvarnished, slightly warped, visible grain and cracks. Flat unflattering light. Compositionally mirrors the medal format but in wood. No text, no logos. `--v 6.1 --ar 1:1 --style raw --s 250`

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
| --teal-bright | #2dd4bf | Highlights |
| --green-bright | #2dd4a0 | Positive values, Poker |
| --red-bright | #ef5350 | Negative values, Roulette |
| --blue | #2563eb | Sports Betting |
| --purple | #7c3aed | Slots |
| --accent-yellow | #facc15 | Lottery |
| --accent-darkgold | #b8860b | Baccarat |
| --accent-emerald | #10b981 | Trading |
| --accent-cyan | #06b6d4 | Options |
| --accent-orange | #f97316 | Crypto Trading |
| --accent-sky | #0ea5e9 | Everyday Maths |
| --text | #c8cdd8 | Body text |
| --text-bright | #e8ecf4 | Headings |
| --muted | #4a5568 | Secondary text |

### Typography

| Font | Usage |
|------|-------|
| Bebas Neue | Headlines, product titles, hero text, wordmark |
| DM Mono | Numbers, stats, code, data, calculations |
| Crimson Pro | Body prose, plain English translations (always italic) |
| Outfit | UI text, buttons, labels, navigation |

### Component Patterns

- **Stats bar:** Grid of stat cells at top of each product. Number in DM Mono (accent colour), label in small caps.
- **.mb (maths box):** DM Mono, dark background, for formulas and calculations.
- **.pln (plain English):** Crimson Pro italic, cyan, translates maths into everyday language.
- **.pt (key point):** Accent left border, accent-dim background.
- **.dg (danger/warning):** Red left border.
- **.gd (positive/good):** Green left border.

### Design Rules

- Dark theme everywhere. No light mode.
- Every mathematical claim backed by a calculation in a .mb box.
- Every .mb calculation has a .pln plain English translation.
- No marketing language. Maths language only.
- Every tool usable by someone who has never seen the terminology.
- Responsible gambling helpline on every gambling product.
- FCA risk warning on every crypto/trading product.
- "Not financial advice" on Trading, Options, and Crypto Trading content.

---

## SEO Status

**Key query clusters (GSC, March 2026):**
- Salary sacrifice: 171 impressions
- Poker odds: 130 impressions (position 7 for "poker chances calculator")
- Mortgage overpayment: 83 impressions
- Overround: position 44.6 — low competition, now live as tool + article

**Critical fix deployed:** 48 homepage cards converted from onclick to `<a>` tags (2026-03-28).

**Strategy:** Tools → traffic, articles → education, courses → conversion.

---

## Working Pattern

### Roles

| Role | Who | Responsibility |
|------|-----|---------------|
| Jon | Human | Decisions, priorities, content review, deployment, domain/DNS, Stripe, Google Cloud |
| Project Claude (PC) | This project | Planning, specs, content, scenarios, tools, design, strategy |
| Code Claude (CC) | Separate Claude Code project | Implementation — file integration, repo commits, deployment, infrastructure |

### How Work Flows

```
PC builds content/specs → Jon reviews → sends to CC → CC implements → Jon verifies live
```

### Communication Rules

- Do not guess. If you don't know, say so.
- Do not ramble. Get to the point.
- No cheerleading. Respond with substance, not praise.
- Lead with the best solution.
- Challenge preconceptions. If Jon's wrong, say so with evidence.
- British English throughout.
- Manners matter.

### Two-Instance Model

- **PC (Project Claude)** — this instance: strategy, planning, architecture, content, specs, this document.
- **CC (Code Claude)** — separate Claude Code project: implementation and deployment.
- **CLAUDE.md** is the canonical source for deployed state.
- **This project document** is the canonical source for decisions.

---

## Handover Protocol (PC → CC)

Every handover MUST include:
1. **Handover document:** file list, exact deployment paths, modifications needed, dependencies, checklist
2. **Files:** all in one batch, clearly named
3. **Context:** why it matters, what it connects to, what comes next

---

## Task Contract Format (PC → CC)

```
TASK: [one sentence]
ROOT CAUSE: [what is actually wrong]
EXACT CHANGE: [file, function, what changes to what]
DO NOT TOUCH: [explicit exclusions]
SUCCESS CONDITION: [how to know it's done]
STOP IF: [conditions requiring Jon's input before proceeding]
```

All six fields required. CC must not begin work unless all six are present.

---

## Deployment Checklist

```
PRE-DEPLOYMENT CHECKLIST
========================

Page: ________________
Path: ________________
Date: ________________

[ ] GA4 measurement ID is G-7GTLYCZMXN
[ ] Canonical URL matches exact page URL (https, trailing slash)
[ ] <title> under 60 chars, includes "| MathsWins"
[ ] <meta name="description"> under 155 chars, primary keyword included
[ ] OG tags present (og:title, og:description, og:url, og:image)
[ ] twitter:card tags present
[ ] Google Fonts loaded (DM Mono, Bebas Neue, Crimson Pro, Outfit)
[ ] Dark theme (--bg: #050709) — no light mode
[ ] Mobile responsive (tested at 375px width)
[ ] All internal links working, using <a> tags (not onclick handlers)
[ ] Nav bar present with MathsWins branding
[ ] Footer present with site links and copyright
[ ] Cookie consent banner present with GA4 consent mode
[ ] Google Sign-In bar present (if applicable)

CONTENT-SPECIFIC CHECKS:

[ ] Gambling content: Responsible gambling notice
    (Helpline 0808 8020 133, GamCare, BeGambleAware)
[ ] Crypto/trading content: FCA risk warning
    ("Cryptoassets are not regulated in the UK. Capital at risk.")
[ ] Trading/options content: "Not financial advice" disclaimer
[ ] Tools: layman's explanation of all technical terms
[ ] Tools: cross-link to relevant academy/everyday course
[ ] Tools: WebApplication schema + FAQ schema
[ ] Academy courses: Module 1 free, remaining gated
[ ] Academy courses: pricing displayed correctly

SEO CHECKS:

[ ] Page added to sitemap.xml
[ ] Structured data (JSON-LD) present
[ ] Cross-links to 2-3 related pages
[ ] No duplicate content
[ ] Images have alt text
[ ] No JavaScript-only navigation (use <a> tags)

POST-DEPLOYMENT:

[ ] Page loads correctly on live site
[ ] GA4 real-time shows the page view
[ ] Request indexing in Google Search Console
[ ] Sitemap resubmitted if new pages added
```

---

## Quality Gates

### Before Any Push to Main

1. All HTML files pass W3C validation (no critical errors)
2. All JavaScript executes without console errors
3. GA4 measurement ID is G-7GTLYCZMXN across ALL files
4. No hardcoded test data, placeholder text, or TODO comments
5. Canonical URLs match actual deployed URLs
6. Sitemap updated for any new pages
7. All navigation uses `<a>` tags, not onclick handlers

### Before League Public Launch

1. Test leagues confirmed excluded from all achievement and record tracking
2. ACHIEVEMENTS_ACTIVE=false confirmed
3. Admin wallets confirmed in ADMIN_WALLETS env var
4. At least one Bronze + one Silver league created per game
5. Refund flow tested end-to-end on a cancelled test league
6. Force-settle tested on a test league

### Before Achievement System Launch (ACHIEVEMENTS_ACTIVE=true)

1. All condition checks tested against real league data
2. Pioneer UNIQUE constraint tested (concurrent award attempt)
3. Boom confirmed unawardable via normal play
4. Immaculate on-chain ownership check confirmed working
5. Discovery popup tested on all viewport sizes
6. Jon explicitly confirms go-ahead

---

## On the Horizon

### Immediate

1. Minesweeper, FreeCell, Battleships — deploy and test
2. First public leagues launched per game (Jon confirms go)
3. Achievement system activation (Jon confirms go, separately from leagues)
4. League settlement script (currently manual)
5. Trophy NFT deployment to QF Network + IPFS upload

### Short-Term

6. Continue /learn/ articles (target: 2 per week)
7. FPL Maths planning (build April, launch August 2026)
8. Promo settlement system (25 QF prizes to winners)
9. Games categorisation (Jon sends full list to PC)
10. MathsWins GA4 proper data review

### Deferred (Phase 3)

- Wooden spoon achievement spec and build
- Recruiter achievement (needs referral infrastructure)
- Community Cup knockout tournaments
- QF token payments for academy courses via Academy.sol
- Soulbound access/completion NFTs (academy)
- Card Counter Tool
- After You (The Queue) contract
- Sudoku Duel native app
- Badge-based QF discounts
- Achievement artwork (MidJourney, per tier template)

---

## Retired / Deprecated

| Item | Replaced By |
|------|-------------|
| Equatle | Maffsy (renamed everywhere) |
| Estimation Engine (competitive) | Moved to free games section |
| Sequence Solver (league) | High score / pay to play only |
| Prime or Composite (league) | High score / pay to play only |
| Simultaneous Battleships format | Turn-based async only (WebSocket infrastructure not justified) |
| /builders/ page | /qf-dapp/ |
| Weekly open format (dApp) | Leagues only |
| QF token-only payments (courses) | Stripe (GBP) |
| QF Network Chain ID 42 | Chain ID 3426 |
| localStorage-only content gating | Google OAuth + localStorage |
| PostgreSQL (dApp) | SQLite at `/home/ubuntu/dapp-backend/data/mathswins.db` |
| GA4 ID G-CLNF7GSB28 | G-7GTLYCZMXN |
| GA4 ID G-57E4YC6454 | G-7GTLYCZMXN |
| GA4 ID G-WEGLD3L2VQ | G-7GTLYCZMXN |
| GA4 ID G-28ZYY6MXKP | G-7GTLYCZMXN |

---

## Separation From MaffsGames

CRITICAL. Completely separate: different domains, repos, GA4 properties, audiences, business models, design systems, contact emails. If anything crosses between the two sites, it is a bug. Fix immediately.

Parent guides at /parents/ are the one intentional bridge — MathsWins → MaffsGames only, never the reverse.

---

## Safety Rules

- **Never** expose private keys, API keys, or wallet credentials in committed files
- **Never** suggest `cat .env` or full-file exposure commands
- **Never** restart PM2 or the Hetzner server without explicit "yes" from Jon
- **No** wallet connection code on main site without Jon's explicit approval
- **No** financial advice, trade recommendations, or outcome predictions
- **No** marketing to under-18s
- Responsible gambling messaging on ALL gambling-related content
- FCA risk warning on ALL crypto/trading content
- Do NOT use `£` as a JavaScript function name — use `fmt` or similar
- Do NOT use non-ASCII characters in JavaScript function or variable names
- 10% burn on every QF payment is non-negotiable
- Test leagues/duels/sessions never count toward achievements, records, or Pioneer tags

---

## Lessons Learned

| What happened | Rule going forward |
|--------------|-------------------|
| GA4 measurement IDs got mixed between sites | Each site has its own GA4 property. Verify live ID from page source before deploying. |
| Multiple GA4 properties created accidentally | One property per site. Delete/archive extras immediately. |
| localStorage gating proposed for £150 product | Always recommend the modern, standard solution first (Google OAuth). |
| Magic link proposed as primary auth | Magic links are fallbacks. Google Sign-In is primary. |
| Files delivered without deployment instructions | Every handover includes file list, paths, changes needed, checklist. |
| Canonical URL mismatch blocked indexing | Canonical URLs must exactly match live URL: https, correct path, trailing slash. |
| `function £()` caused JS syntax errors | Never use non-ASCII characters in JS function or variable names. |
| Tools used jargon without explanation | Every tool must work for someone who doesn't know the terminology. |
| Worse solutions presented first | Lead with the best solution. One recommendation, clearly stated. |
| 48 homepage cards used onclick instead of `<a>` tags | All navigation must use crawlable `<a>` tags. |
| Jon reviewed MaffsGames GA4 data thinking it was MathsWins | Always confirm which project is in scope before analysis. |
| GA4 near-zero on current day caused alarm | Current-day near-zero is processing lag. Data finalises after midnight. |
| Cloudflare Worker route caught all traffic, returned 403 | Worker route must only handle api.mathswins.co.uk/*, not mathswins.co.uk/*. |
| dApp footer claimed "no data stored" while collecting wallet addresses | Footer must accurately reflect what data is collected. |
| /learn/ section set to noindex | Verify index/noindex status before adding pages to sitemap. |
| CC restarted PM2 without permission via SSH string wrapping | PM2/server restart requires explicit "yes" from Jon. Hook patterns must match ssh.*pm2 commands. |
| League session fired before wallet connected | When ?league= in URL and no saved wallet ID, show connect prompt. Never fall through to free-play silently. |
| buildNumpad() called multiple times, duplicate buttons | buildNumpad() must clear existing buttons before appending. |
| dApp recorded as PostgreSQL in project document | dApp database is SQLite at /home/ubuntu/dapp-backend/data/mathswins.db. |
| Simultaneous Battleships specced before WebSocket infrastructure assessed | Always assess infrastructure requirements before committing to a real-time feature. |
| Achievement system specced before all dependent games were built | Build order: games first, achievements after all games live and tested. |

---

*End of project document. This is the single source of truth. Both Project Claude and Code Claude work from this.*
