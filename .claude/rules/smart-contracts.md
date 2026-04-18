# Smart Contracts
QFGamesHub.sol              # Central hub — badge minting, fee discounts
  ├── QFSimpleSatellite.sol  # Base contract for score-submission games
  ├── PrimeOrCompositeSatellite.sol  # Live satellite for Prime or Composite
  └── AfterYouSatellite.sol  # Standalone queue game (see below)
IQFSatellite.sol            # Interface for satellite contracts
QFSettlement.sol            # Atomic settlement — duel/battleships payouts + fee splits (DEPLOYED)
Academy.sol                 # Planned — subscription/access contract with soulbound access NFTs
```

### QFSettlement.sol v2 (DEPLOYED 2026-04-18)
- **Address:** `0xf4C00E9CBC6fe595c4a54ae7e75E9a92D0D513d4`
- **Deployer:** `0xB21039b9A7e360561d9AE7EE0A8B1b722f2057A3` (onlyfans.qf)
- **Owner:** `0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016` (Ledger) — set via constructor
- **Team wallet:** `0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016` (settable by owner)
- **Default splits:** `burnPct=5`, `teamPct=10` → 5% burn / 10% team / 85% winner
- `settle(winner)` — duel/battleships win: `burnPct` / `teamPct` / remainder to winner
- `settleDraw(p1, p2)` — duel draw: `burnPct` / `teamPct` / remainder split evenly (42.5% each at defaults)
- `splitFee()` — **hardcoded 5% burn / 95% team**, ringfenced from `setSplits` (achievement mints + leaderboard entries)
- `setSplits(burnPct, teamPct)` — owner-only, requires `burn + team < 100`, affects duels only
- `setTeamWallet(address)` — owner-only
- `transferOwnership(address)` — owner-only
- ABI + address at `/home/jon/MathsWins/dapp-backend/contracts/QFSettlement.json`
- Compiled with resolc v0.5.0 -O2, PVM bytecode at `out-pvm/QFSettlement.sol:QFSettlement.pvm`
- Called by escrow.mjs (settleDuel, settleDuelDraw) and routes/api.mjs (mint fee, leaderboard fee)
- **v1 RETIRED:** `0x475F350469Cbe5aDd04aae4686339b3b990D013E` — hardcoded 5/5/90, no setter

### QFGamesHub.sol
- `mintBadge(player, tier)` — mint soulbound NFT badge
- `calculatePrice(baseCost, player)` — apply badge discount to entry fees

### QFSimpleSatellite.sol (SUPERSEDED by GameEntry.sol — not used in live dApp)
Base contract for score-submission games:
- `submitScore(score)` — pay entry fee, record score
- Revenue split: 70% prize/treasury, 20% protocol, 10% burn to 0xdEaD

### AfterYouSatellite.sol (written but undeployed — parked)
Standalone blockchain queue game:
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

## Authentication & Access Control

### Google Sign-In (LIVE — built 2026-03-17)
- **Google Cloud Project** with OAuth 2.0 Client ID (Web application type)
- Authorised JavaScript origins: `https://mathswins.co.uk`
- Fixed top bar on every academy page: MATHSWINS brand (left), Google sign-in / user avatar (right)
- Clicking user avatar links to `/account/` page

### Cloudflare Worker — `mathswins-restore` (deployed via Cloudflare dashboard)
- **Worker URL:** `https://mathswins-restore.jonfox78.workers.dev`
- **Custom domain:** `api.mathswins.co.uk` (route configured but DNS may need CNAME)
- **Endpoints:**
  - `POST /auth/google` — verify Google ID token, look up Stripe purchases, return 30-day session JWT
