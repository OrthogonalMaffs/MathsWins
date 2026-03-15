# MathsWins — CLAUDE.md

## Origin Story
MathsWins started as the crypto/commercial half of the MaffsGames project. MaffsGames began as a single platform combining free schools games with QF Network crypto games and a gambling mathematics academy. In March 2025 we separated the two concerns:

- **maffsgames.co.uk** — schools only. Free curriculum-aligned maths games for UK classrooms. No crypto, no gambling content. Repo: `OrthogonalMaffs/maffsgames`
- **mathswins.co.uk** — this repo. QF original games + Maths Always Wins academy. Crypto-integrated but NOT crypto-exclusive. Repo: `OrthogonalMaffs/MathsWins`

The separation was a clean migration — games were moved (not rebuilt), git history for the originals lives in the maffsgames repo. The two brands must have zero crossover — separate domains, separate email, separate branding.

## What MathsWins Is
A platform with two pillars:

### 1. Games — Free skill-based maths games
Pure logic, reasoning, and number sense. No luck, no gambling. These are the "QF originals" — games built for the QF Network community but enjoyable by anyone.

### 2. Academy — "Maths Always Wins" courses
Educational deep-dives into the mathematics behind games of chance, betting, and trading. Not gambling tools — mathematical education. The thesis: understand the maths BEFORE you play. 9 courses covering casino games, sports betting, lottery, slots, and trading psychology.

## Business Model
**Dual payment — card or QF tokens:**
- Stripe (card) — full price, accessible to anyone without crypto
- QF tokens — discounted via badge tier system + 10% burn

QF holders get cheaper access AND contribute to token deflation. Games are free. Academy courses are the revenue product. This model is decided but NOT yet implemented — currently all content is freely accessible with no payment gate.

**Badge discounts (QF payments only):**
- Alpha Badge: 10% discount
- Beta Badge: 15% discount
- Lambda Badge: 20% discount
- Delta Badge: 25% discount

**Content gating approach (planned):**
- Full content committed to public repo currently — needs gating before monetisation
- Options under consideration: locked-state module cards, separate private repo for full content, or client-side access control with soulbound NFT verification
- At current price points and niche audience, threat model from git history exposure is minimal

## Current State

### Deployed
- Landing page with game cards and academy cards
- 13 free games (all playable, listed on landing page)
- 9 academy courses (all playable, no paywall yet)
- GitHub Pages enabled, CNAME set to mathswins.co.uk
- DNS configured at IONOS with A records pointing to GitHub Pages

### Not Yet Built
- `games/countdown-numbers/` — listed on landing page, not built
- Payment integration (Stripe + on-chain)
- Content gating / access control (Module 1 free, rest locked — partially implemented)
- Academy.sol subscription contract
## Directory Structure
```
index.html                          # Landing page (dark theme, nav pills)
CNAME                               # mathswins.co.uk
games/                              # Free games (single-file HTML each)
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
  blackjack/index.html              # 11 modules, 3 tiers, 78+ scenarios
  poker/index.html                  # 10 modules, 3 tiers, 75 scenarios
  sports-betting/index.html         # 8 modules, 3 tiers, live calculators
  roulette/index.html               # 5 modules, single tier, 100k-spin sims
  craps/index.html                  # 5 modules, single tier
  slots/index.html                  # 7 modules, single tier, 1k-spin sim
  lottery/index.html                # 5 modules, single tier
  baccarat/index.html               # 4 modules, single tier
  trading/index.html                # 6 modules, single tier
everyday/                           # Free everyday maths courses
  index.html                        # Everyday Maths hub page
  tax/index.html                    # 5 modules, UK income tax calculators
  compound-interest/index.html      # 4 modules, compound interest & debt calculators
  mortgages/index.html              # 5 modules, mortgage amortisation & overpayment calculator
contracts/                          # Solidity smart contracts (Foundry)
  src/
  test/
  script/
  lib/
```

## Games Roster (13)
| Game | Slug | Description |
|------|------|-------------|
| Countdown Numbers | `countdown-numbers` | NOT BUILT — listed on landing page |
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

## Academy Courses (9)

### Multi-tier courses (3 tiers: Basic → Advanced → Master)
| Course | Slug | Modules | Scenarios | Key features |
|--------|------|---------|-----------|--------------|
| Blackjack Academy | `blackjack` | 11 | 78+ | Monte Carlo sims, card counting drills, 50-hand session replay with EV analysis |
| Poker School | `poker` | 10 (+1 placeholder) | 75 | Pot odds calculator, range grid builder, GTO fundamentals, ICM tournament theory |
| Sports Betting Maths | `sports-betting` | 8 | — | Implied probability, overround calculation, value betting, live calculators |

### Single-tier courses
| Course | Slug | Modules | Key features |
|--------|------|---------|--------------|
| Roulette Reality Check | `roulette` | 5 | 100k-spin simulations demolishing Martingale, Fibonacci, D'Alembert |
| Craps Decoded | `craps` | 5 | 36 dice outcomes, odds bet (0% edge) vs proposition bets (16.67% edge) |
| Slots: The Ugly Truth | `slots` | 7 | RTP maths, volatility, near-miss programming, 1,000-spin live sim |
| Lottery Maths | `lottery` | 5 | Combinatorics, expected value per ticket, lifetime opportunity cost |
| Baccarat Breakdown | `baccarat` | 4 | Three-bet analysis, commission maths, pattern-tracking debunking |
| Trading Maths | `trading` | 6 | R:R ratios, position sizing, Kelly criterion, survivorship bias, drawdown variance |

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

## Everyday Maths (Free section — 3rd pillar)
Free courses teaching the mathematics behind everyday financial decisions. No gating, no payment — free forever. Accent colour: Sky Blue #0ea5e9.

### Deployed
| Course | Slug | Modules | Key features |
|--------|------|---------|--------------|
| UK Tax Maths | `everyday/tax` | 5 | Marginal vs effective rates, £100k trap, Scotland comparison, deductions, fiscal drag. Live calculators. |
| Compound Interest & Debt | `everyday/compound-interest` | 4 | Simple vs compound, credit card trap, APR decoded, Rule of 72. Live calculators. |
| Mortgage Maths | `everyday/mortgages` | 5 | Amortisation, term length cost, overpayments, fixed vs variable, full calculator. |

### Planned (not built)
- Compound Interest — savings, debt, pension growth
- Mortgages — amortisation, fixed vs variable, overpayments
- Pensions — workplace, SIPP, state pension, tax relief
- Inflation — purchasing power, real vs nominal returns
- Everyday Probability — weather, medical tests, risk perception

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
- Stripe for card payments (planned, not implemented)

## Safety Rules
- Never expose private keys or API keys
- No wallet connection code without explicit approval
- All token payments go through audited satellite contracts
- 10% burn on every QF payment is non-negotiable
- No crossover with maffsgames.co.uk branding or contact details

## Contact
- TBC — mathswins.co.uk email to be set up
