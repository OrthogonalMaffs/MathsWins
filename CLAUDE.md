# MathsWins — CLAUDE.md

## Origin Story
MathsWins started as the crypto/commercial half of the MaffsGames project. MaffsGames began as a single platform combining free schools games with QF Network crypto games and a gambling mathematics academy. In March 2025 we separated the two concerns:

- **maffsgames.co.uk** — schools only. Free curriculum-aligned maths games for UK classrooms. No crypto, no gambling content. Repo: `OrthogonalMaffs/maffsgames`
- **mathswins.co.uk** — this repo. QF original games + Maths Always Wins academy. Crypto-integrated but NOT crypto-exclusive. Repo: `OrthogonalMaffs/MathsWins`

The separation was a clean migration — games were moved (not rebuilt), git history for the originals lives in the maffsgames repo.

## What MathsWins Is
A platform with two pillars:

### 1. Games — Free skill-based maths games
Pure logic, reasoning, and number sense. No luck, no gambling. These are the "QF originals" — games built for the QF Network community but enjoyable by anyone.

### 2. Academy — "Maths Always Wins" courses
Educational deep-dives into the mathematics behind games of chance. Not gambling tools — mathematical education. Blackjack basic strategy, roulette system debunking, sports betting probability, craps odds analysis. The thesis: understand the maths BEFORE you play.

## Business Model
**Dual payment — card or QF tokens:**
- Stripe (card) — full price, accessible to anyone
- QF tokens — discounted via badge tier system + 10% burn

QF holders get cheaper access AND contribute to token deflation. Games are free. Academy courses are the revenue product. This model is decided but NOT yet implemented — currently all content is freely accessible with no payment gate.

**Pricing intent (not yet live):**
- Full academy courses (Blackjack, Poker, Sports Betting): from £9.99 / 500 QF
- Single-tier courses (Roulette, Craps): from £4.99 / 250 QF
- Badge discounts: Alpha 10%, Beta 15%, Lambda 20%, Delta 25%

## Current State (March 2025)

### Live
- Landing page with game cards and academy cards
- 13 free games (all playable)
- 4 academy courses (all playable, no paywall yet)
- GitHub Pages deployed, CNAME set to mathswins.co.uk
- DNS not yet configured (accessible via orthogonalmaffs.github.io/MathsWins until then)

### Not Yet Built
- `academy/poker/` — Poker School (listed on landing page, not built)
- `games/countdown-numbers/` — Countdown Numbers (listed on landing page, not built)
- Payment integration (Stripe + on-chain)
- Content gating / access control
- User accounts / authentication

## Directory Structure
```
index.html                          # Landing page (dark theme, nav pills)
CNAME                               # mathswins.co.uk
games/                              # Free games (single-file HTML each)
  52dle/index.html
  equatle/index.html
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
  blackjack/index.html              # 11 modules, 78 scenarios, Monte Carlo sims
  roulette/index.html               # System debunking with 100k-spin sims
  craps/index.html                  # Odds analysis, bet comparison
  sports-betting/index.html         # Implied probability, overround, value betting
contracts/                          # Solidity smart contracts (Foundry)
  src/
  test/
  script/
  lib/
```

## Games Roster (13)
| Game | Slug | Description |
|------|------|-------------|
| Countdown Numbers | `countdown-numbers` | NOT BUILT YET — listed on landing page |
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

**Shared with maffsgames.co.uk:** prime-or-composite, estimation-engine, sequence-solver, equatle, 52dle. These exist in both repos independently.

## Academy Courses (5)
| Course | Slug | Status | Modules |
|--------|------|--------|---------|
| Blackjack Academy | `blackjack` | Built | 11 modules, 3 tiers, 78+ scenarios, Monte Carlo sims, session replay |
| Poker School | `poker` | NOT BUILT | Listed on landing page |
| Roulette Reality Check | `roulette` | Built | 5 modules, single tier, 100k-spin simulations |
| Sports Betting Maths | `sports-betting` | Built | 8 modules, 3 tiers, live calculators |
| Craps Decoded | `craps` | Built | 5 modules, single tier, 36-outcome analysis |

## Smart Contracts

### Chain
- QF Network (Chain ID 42)
- ~0.1s block times
- PolkaVM runtime
- Compiler: solc 0.8.26, optimizer 200 runs, via_ir enabled

### Contract Architecture: Hub + Satellites
```
QFGamesHub.sol              # Central hub — badge minting, fee discounts
  ├── QFSimpleSatellite.sol  # Base contract for score-submission games
  ├── PrimeOrCompositeSatellite.sol  # Live satellite for Prime or Composite
  └── AfterYouSatellite.sol  # Standalone queue game (see below)
IQFSatellite.sol            # Interface for satellite contracts
```

### QFGamesHub.sol
- `mintBadge(player, tier)` — mint soulbound NFT badge
- `calculatePrice(baseCost, player)` — apply badge discount to entry fees
- Badge tiers: Alpha (10%), Beta (15%), Lambda (20%), Delta (25%)

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
- **Schools cross-link:** About section links to maffsgames.co.uk/schools

## Analytics
GA4 cookieless mode (G-CLNF7GSB28) — same property as maffsgames.co.uk. No personal data collected.

## Relationship to Other Projects
- **maffsgames.co.uk** — sister site, schools-only. Shares 5 games. Different repo, different branding, different audience.
- **QF Network** — the blockchain. MathsWins is a dApp on QF Network. Payments in QF tokens.
- **Project 52F** — broader QF ecosystem. MathsWins games feed into project52f.uk.
- **Diamond Lock** — separate QF project (token locking/vesting). No direct relationship.

## Tech Stack
- Single-file HTML games (no build step, no framework)
- KaTeX CDN for math rendering where needed
- Foundry for smart contracts
- GitHub Pages for hosting
- Stripe for card payments (planned, not implemented)

## Safety Rules
- Never expose private keys or API keys
- No wallet connection code without explicit approval
- All token payments go through audited satellite contracts
- 10% burn on every QF payment is non-negotiable

## Contact
- TBC — mathswins.co.uk email to be set up
