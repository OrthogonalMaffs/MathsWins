# MathsWins — CLAUDE.md

## Origin Story
MathsWins started as the crypto/commercial half of the MaffsGames project. MaffsGames began as a single platform combining free schools games with QF Network crypto games and a gambling mathematics academy. In March 2025 we separated the two concerns:

- **maffsgames.co.uk** — schools only. Free curriculum-aligned maths games for UK classrooms. No crypto, no gambling content. Repo: `OrthogonalMaffs/maffsgames`
- **mathswins.co.uk** — this repo. QF original games + Maths Always Wins academy. Crypto-integrated but NOT crypto-exclusive. Repo: `OrthogonalMaffs/MathsWins`

The separation was a clean migration — games were moved (not rebuilt), git history for the originals lives in the maffsgames repo. The two brands must have zero crossover — separate domains, separate email, separate branding.

## What MathsWins Is
A platform with four pillars:

### 1. Games — Free skill-based maths games (13, all live)
Pure logic, reasoning, and number sense. No luck, no gambling. These are the "QF originals" — games built for the QF Network community but enjoyable by anyone.

### 2. Academy — "Maths Always Wins" courses (9 courses, All Access £39.99)
Educational deep-dives into the mathematics behind games of chance, betting, and trading. Not gambling tools — mathematical education. The thesis: understand the maths BEFORE you play.

### 3. Everyday Maths — Free financial literacy courses (6 courses, all live)
The mathematics behind everyday financial decisions. Tax, mortgages, pensions, compound interest, inflation, probability. Free forever.

### 4. Tools — Free standalone calculators (1 live)
Focused single-purpose tools. Currently: UK Student Loan Calculator.

## Business Model
**Dual payment — card or QF tokens:**
- Stripe (card) — full price, accessible to anyone without crypto
- QF tokens — discounted via badge tier system + 10% burn

**Stripe payment integration (Phase 1 — LIVE):**
- 10 products, 19 prices, 18 Payment Links created
- localStorage-based access: `mw_access_SLUG` per course, `mw_access_all` for All Access
- Buy buttons on all 9 academy course pages + Academy hub
- Redirect URL pattern: `?session_id={CHECKOUT_SESSION_ID}` (deferred — not yet set in Stripe dashboard)
- Phase 1 is client-side only — any payment unlocks all content for that course

**Confirmed pricing:**
- Slots, Lottery, Baccarat: £1.99 (single tier)
- Roulette, Craps: £3.99 (single tier)
- Trading: Basic £6.99, Advanced £12.99
- Blackjack, Sports Betting: Basic £6.99, Advanced £12.99, Master £17.99
- Poker School: Basic £6.99 (M1-7), Advanced £12.99 (M1-14), Master £17.99 (M1-17), Pro £24.99 (M1-20)
- All Access Pass: £39.99 (all 9 academy courses, lifetime)
- Options Maths: TBC (standalone, NOT in All Access)
- FREE: Games, Everyday Maths, Module 1 of all academy courses, Tools

**Badge discounts (QF payments only — Phase 3):**
- Alpha Badge: 10% discount
- Beta Badge: 15% discount
- Lambda Badge: 20% discount
- Delta Badge: 25% discount

**Payment phases:**
- Phase 1: Stripe Payment Links + localStorage (LIVE)
- Phase 2: Cloudflare Workers (api.mathswins.co.uk/verify, signed JWT, tier-specific unlocking)
- Phase 3: QF token payments via Academy.sol + soulbound access NFTs

## Current State

### Deployed & Live
- Landing page with game cards, academy cards, everyday cards
- 13 free games (all built and playable)
- 9 academy courses with Stripe payment integration (Module 1 free on each)
- Academy hub page with All Access Pass (£39.99)
- Options Maths standalone course page (Module 1 free, M2-10 coming soon)
- 6 Everyday Maths courses (all live, free forever)
- UK Student Loan Calculator tool
- Terms of Use page (17 sections, UK law, noindex)
- GitHub Pages enabled, CNAME set to mathswins.co.uk
- DNS configured at IONOS with A records pointing to GitHub Pages
- HTTPS enforced

### Not Yet Built / In Progress
- Stripe redirect URLs (need to set `?session_id=` on all 18 Payment Links in Stripe dashboard)
- Options Maths M2-10 (M2-6 content received, M7-10 TBC)
- Options Maths pricing (TBC)
- Card Counter Tool (£4.99/month or £29.99/year, requires BJ Master — build after Phase 1 verified)
- FPL Maths (build April 2026, launch August 2026)
- Phase 2: Cloudflare Workers for payment verification
- Phase 3: QF token payments + Academy.sol
- Content gating hardening (currently localStorage, not secure)

## Directory Structure
```
index.html                          # Landing page (dark theme, nav pills)
CNAME                               # mathswins.co.uk
games/                              # Free games (single-file HTML each)
  countdown-numbers/index.html      # Classic 6-number target challenge with solver
  52dle/index.html                  # Also on maffsgames.co.uk
  equatle/index.html                # Also on maffsgames.co.uk
  sudoku-duel/index.html
  higher-or-lower/index.html
  prime-or-composite/index.html     # Also on maffsgames.co.uk
  estimation-engine/index.html      # Also on maffsgames.co.uk
  sequence-solver/index.html        # Also on maffsgames.co.uk
  towers-of-hanoi/index.html
  cryptarithmetic-club/index.html
  memory-matrix/index.html
  dont-press-it/index.html
  rps-vs-machine/index.html
academy/                            # Paid courses (single-file HTML each)
  index.html                        # Academy hub page with All Access Pass (£39.99)
  blackjack/index.html              # 11 modules, 3 tiers, 78+ scenarios
  poker/index.html                  # 20 modules, 4 tiers, 350+ scenarios, 10 interactive tools
  sports-betting/index.html         # 8 modules, 3 tiers, live calculators
  roulette/index.html               # 5 modules, single tier, 100k-spin sims
  craps/index.html                  # 5 modules, single tier
  slots/index.html                  # 7 modules, single tier, 1k-spin sim
  lottery/index.html                # 5 modules, single tier
  baccarat/index.html               # 4 modules, single tier
  trading/index.html                # 6 modules, single tier
  options/index.html                # STANDALONE (NOT All Access). 10 modules planned, M1 free live
  options/modules/                  # JS module files (M1-M6 received, M7-M10 TBC)
everyday/                           # Free everyday maths courses
  index.html                        # Everyday Maths hub page
  tax/index.html                    # 5 modules, UK income tax calculators
  compound-interest/index.html      # 4 modules, compound interest & debt calculators
  mortgages/index.html              # 5 modules, mortgage amortisation & overpayment calculator
  pensions/index.html               # 4 modules, tax relief, compound growth, lump sum, calculator
  inflation/index.html              # 3 modules, purchasing power, real vs nominal, shrinkflation
  probability/index.html            # 4 modules, base rates, Bayes, Monty Hall, birthday problem
terms/index.html                    # Terms of Use (noindex, 17 sections, UK law)
tools/                              # Free standalone tools
  student-loan/index.html           # UK student loan calculator, all 5 plans, year-by-year schedule
contracts/                          # Solidity smart contracts (Foundry)
  src/
  test/
  script/
  lib/
```

## Games Roster (13 — all built and live)
| Game | Slug | Description |
|------|------|-------------|
| Countdown Numbers | `countdown-numbers` | Classic 6-number target challenge with solver |
| 52-dle | `52dle` | Daily number deduction puzzle |
| Equatle | `equatle` | Wordle-style equation guessing |
| Sudoku Duel | `sudoku-duel` | Speed Sudoku with hints and scoring |
| Higher or Lower | `higher-or-lower` | Streak-based number comparison |
| Prime or Composite | `prime-or-composite` | Rapid number classification |
| Estimation Engine | `estimation-engine` | Mental arithmetic with tolerance |
| Sequence Solver | `sequence-solver` | Pattern recognition, escalating difficulty |
| Towers of Hanoi | `towers-of-hanoi` | Recursive logic puzzle |
| Cryptarithmetic Club | `cryptarithmetic-club` | Letter-to-digit substitution |
| Memory Matrix | `memory-matrix` | Visual memory grid |
| Don't Press It | `dont-press-it` | Risk/reward self-control game |
| RPS vs Machine | `rps-vs-machine` | Rock-paper-scissors vs pattern-learning AI |

**Shared with maffsgames.co.uk:** 52dle, equatle, prime-or-composite, estimation-engine, sequence-solver. These exist in both repos independently.

## Academy Courses — All Access Pass (9 courses, £39.99)

### Multi-tier courses
| Course | Slug | Modules | Tiers | Scenarios | Key features |
|--------|------|---------|-------|-----------|--------------|
| Blackjack Academy | `blackjack` | 11 | 3 (Basic/Advanced/Master) | 78+ | Monte Carlo sims, card counting drills, 50-hand session replay with EV analysis |
| Poker School | `poker` | 20 | 4 (Basic/Advanced/Master/Pro) | 350+ | 10 interactive tools per module, combinatorics, Kelly criterion, bluffing frequency, exploitative maths, variance simulation |
| Sports Betting Maths | `sports-betting` | 8 | 3 (Basic/Advanced/Master) | — | Implied probability, overround calculation, value betting, live calculators |
| Trading Maths | `trading` | 6 | 2 (Basic/Advanced) | — | R:R ratios, position sizing, Kelly criterion, survivorship bias, drawdown variance |

### Single-tier courses
| Course | Slug | Modules | Price | Key features |
|--------|------|---------|-------|--------------|
| Roulette Reality Check | `roulette` | 5 | £3.99 | 100k-spin simulations demolishing Martingale, Fibonacci, D'Alembert |
| Craps Decoded | `craps` | 5 | £3.99 | 36 dice outcomes, odds bet (0% edge) vs proposition bets (16.67% edge) |
| Slots: The Ugly Truth | `slots` | 7 | £1.99 | RTP maths, volatility, near-miss programming, 1,000-spin live sim |
| Lottery Maths | `lottery` | 5 | £1.99 | Combinatorics, expected value per ticket, lifetime opportunity cost |
| Baccarat Breakdown | `baccarat` | 4 | £1.99 | Three-bet analysis, commission maths, pattern-tracking debunking |

### Poker School — Module Breakdown (20 modules)
| Tier | Modules | Price | Content |
|------|---------|-------|---------|
| Basic | M1-7 | £6.99 | Hand rankings, pot odds, position, post-flop, equity vs range, implied odds, bet sizing |
| Advanced | M8-14 | £12.99 | Opponent profiling, GTO, tournaments/ICM, combinatorics, short stack, deal maths, chip leader |
| Master | M15-17 | £17.99 | Optimal bluffing frequency, advanced bet sizing, exploitative mathematics |
| Pro | M18-20 | £24.99 | Bankroll/Kelly, variance/downswings, tilt/psychology/EV of discipline |

Each module M11-20 includes an interactive tool (combo counter, push/fold advisor, deal calculator, bubble factor calculator, bluff frequency calculator, geometric sizing calculator, Bayesian bluff detector, Kelly calculator, variance simulator, tilt cost calculator).

### Standalone Courses (NOT in All Access Pass)
| Course | Slug | Modules | Status | Key features |
|--------|------|---------|--------|--------------|
| Options Maths | `options` | 10 planned | M1 free live, M2-6 stored, M7-10 TBC | Black-Scholes, Greeks, implied volatility, multi-leg strategies |

**Options Maths module status:**
| # | Title | Tier | Status |
|---|-------|------|--------|
| 1 | What Options Actually Are | Free | LIVE |
| 2 | Probability & Expected Value | Basic | Content received, not yet integrated |
| 3 | The Binomial Model | Basic | Content received, not yet integrated |
| 4 | Black-Scholes | Basic | Content received, not yet integrated |
| 5 | Delta | Basic | Content received, not yet integrated |
| 6 | The Greeks | Basic | Content received, not yet integrated |
| 7 | Implied Volatility | TBC | Not yet written |
| 8 | Multi-leg Strategies | TBC | Not yet written |
| 9 | TBA | TBC | Not yet written |
| 10 | Real-world Scenarios | TBC | Not yet written |

### Course accent colours
| Course | Accent |
|--------|--------|
| Blackjack | Gold #d4a847 |
| Poker | Green #2dd4a0 |
| Roulette | Red #ef5350 |
| Sports Betting | Blue #2563eb |
| Craps | Gold #d4a847 |
| Slots | Magenta #e040fb |
| Lottery | Yellow #facc15 |
| Baccarat | Dark Gold #b8860b |
| Trading | Emerald #10b981 |
| Options | Cyan #06b6d4 |

## Everyday Maths (Free — 3rd pillar, 6 courses, all live)
Free courses teaching the mathematics behind everyday financial decisions. No gating, no payment — free forever. Accent colour: Sky Blue #0ea5e9.

| Course | Slug | Modules | Key features |
|--------|------|---------|--------------|
| UK Tax Maths | `everyday/tax` | 5 | Marginal vs effective rates, £100k trap, Scotland comparison, deductions, fiscal drag. Live calculators. |
| Compound Interest & Debt | `everyday/compound-interest` | 4 | Simple vs compound, credit card trap, APR decoded, Rule of 72. Live calculators. |
| Mortgage Maths | `everyday/mortgages` | 5 | Amortisation, term length cost, overpayments, fixed vs variable, full calculator. |
| Pension Maths | `everyday/pensions` | 4 | Tax relief by band, compound growth, 25% lump sum, annuity vs drawdown, pension calculator. |
| Inflation & Real Returns | `everyday/inflation` | 3 | Purchasing power erosion, real vs nominal returns, shrinkflation maths. Live calculators. |
| Everyday Probability | `everyday/probability` | 4 | Base rate neglect, Bayes' theorem, Monty Hall (interactive game), birthday problem. Live calculators. |

## Tools (Free)
| Tool | Slug | Key features |
|------|------|--------------|
| UK Student Loan Calculator | `tools/student-loan` | All 5 plans (1, 2, 4, 5, Postgraduate), 2025/26 thresholds, year-by-year amortisation, write-off vs payoff verdict, combined marginal rate analysis |

## Smart Contracts

### Chain
- QF Network (Chain ID 42)
- ~0.1s block times
- PolkaVM runtime
- Compiler: solc 0.8.26, optimizer 200 runs, via_ir enabled

### Contract Architecture
```
QFGamesHub.sol              # Central hub — badge minting, fee discounts
  ├── QFSimpleSatellite.sol  # Base contract for score-submission games
  ├── PrimeOrCompositeSatellite.sol  # Live satellite for Prime or Composite
  └── AfterYouSatellite.sol  # Standalone queue game (see below)
IQFSatellite.sol            # Interface for satellite contracts
Academy.sol                 # Planned — subscription/access contract with soulbound access NFTs
```

### QFGamesHub.sol
- `mintBadge(player, tier)` — mint soulbound NFT badge
- `calculatePrice(baseCost, player)` — apply badge discount to entry fees

### QFSimpleSatellite.sol
Base contract for score-submission games:
- `submitScore(score)` — pay entry fee, record score
- Revenue split: 70% prize/treasury, 20% protocol, 10% burn to 0xdEaD

### AfterYouSatellite.sol
Standalone blockchain queue game — the flagship earner:
- Players join a queue, pay periodic heartbeats to hold position
- Nudge others backward, try to hold position 1 when hidden timer fires
- State machine: OPEN → COMMITTING → REVEALING → RESOLVING → FINISHED → auto-reset
- Commit-reveal randomness for winner determination
- Payout: 70% winner, 20% treasury, 10% burn
- Bootstrap bonus: first 10 wins with 5+ players get +5 QF from reserve

### Academy.sol (planned, not built)
Subscription contract for academy access:
- Soulbound access NFTs as course credentials
- Integrates with QFGamesHub for badge discounts
- Handles QF token payments with 10% burn

### Build & Test
```bash
cd contracts
forge build
forge test -vv
```

## Branding
- **Theme:** Dark (#050709 bg), gold (#d4a847) accent, teal (#0d9488) secondary
- **Fonts:** DM Mono (code/stats), Bebas Neue (headings), Crimson Pro (body italic), Outfit (UI)
- **Tone:** Confident, mathematical, zero-bullshit. "The maths always wins" is the thesis.
- **Schools cross-link:** About section links to maffsgames.co.uk/schools (one-way — maffsgames does NOT link back to MathsWins)

## Analytics
GA4 cookieless mode (G-CLNF7GSB28) — same property as maffsgames.co.uk. No personal data collected.

## Relationship to Other Projects
- **maffsgames.co.uk** — sister site, schools-only. Shares 5 games. Different repo, different branding, different audience. Zero crossover in branding or contact details.
- **QF Network** — the blockchain. MathsWins is a dApp on QF Network. Payments in QF tokens (with card alternative).
- **Project 52F** — broader QF ecosystem. MathsWins games feed into project52f.uk.
- **Diamond Lock** — separate QF project (token locking/vesting). No direct relationship.

## Tech Stack
- Single-file HTML games and courses (no build step, no framework)
- KaTeX CDN for math rendering where needed
- Foundry for smart contracts
- GitHub Pages for hosting
- Stripe for card payments (Phase 1 live — Payment Links + localStorage)

## Safety Rules
- Never expose private keys or API keys
- No wallet connection code without explicit approval
- All token payments go through audited satellite contracts
- 10% burn on every QF payment is non-negotiable
- No crossover with maffsgames.co.uk branding or contact details

## Contact
- contact@mathswins.co.uk
