# Smart Contracts
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
