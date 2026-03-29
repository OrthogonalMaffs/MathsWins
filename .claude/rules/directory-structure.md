# MathsWins Directory Structure
- Blackjack, Sports Betting: Basic £6.99, Advanced £12.99, Master £17.99
- Poker School: Basic £6.99 (M1-7), Advanced £12.99 (M1-14), Master £17.99 (M1-17), Pro £24.99 (M1-20)
- Options Maths: Basic £9.99, Advanced £17.99, Master £29.99 (STANDALONE — NOT in Premium)
- Crypto Trading Maths: Basic £9.99, Advanced £14.99, Master £24.99 (STANDALONE — NOT in Premium)
- **MathsWins Premium:** Annual £99.99/year, Lifetime £149.99 (all 9 core academy courses)
- FREE: Games, Everyday Maths, Module 1 of all academy courses, Tools

**Badge discounts (QF payments only — Phase 3):**
- Alpha Badge: 10% discount
- Beta Badge: 15% discount
- Lambda Badge: 20% discount
- Delta Badge: 25% discount

**Upgrade Credit System (LIVE — built 2026-03-17):**
- Users who bought individual courses get credit toward Premium upgrade
- Worker endpoint `GET /auth/upgrade-credit` calculates total spend (refund-aware), creates single-use Stripe coupons
- Promo codes auto-applied via `?prefilled_promo_code=CODE` on Payment Links
- Four UI states on account page: no spend, partial credit, annual free (spend >= £99.99), lifetime free (spend >= £149.99)
- `mw-auth.js` injects promo codes into all Premium Stripe links site-wide when user is signed in
- Stripe API key requires Coupons (Write) + Promotion Codes (Write) permissions
- Both Premium Payment Links have "Allow promotion codes" enabled in Stripe dashboard
- Results cached in KV for 24 hours, invalidated on purchase refresh

**Payment phases:**
- Phase 1: Stripe Payment Links + localStorage (LIVE)
- Phase 1.5: Google login + Cloudflare Worker auth + purchase restoration + upgrade credit (LIVE — built 2026-03-17)
- Phase 2: Cloudflare Workers for server-side payment verification (api.mathswins.co.uk)
- Phase 3: QF token payments via Academy.sol + soulbound access NFTs

## Current State

### Tagline
"The Maths Behind Every Decision" (updated 23 March 2026, was "The Mathematics Behind Every Game of Chance")

### Deployed & Live
- Landing page with game cards, academy cards, everyday cards, tools, parents
- 13 free games (all built and playable)
- 9 academy courses with Stripe payment integration (Module 1 free on each)
- Academy hub page with MathsWins Premium (£149.99 lifetime / £99.99 annual)
- Options Maths standalone course page (Module 1 free, M2-10 coming soon)
- 6 Everyday Maths courses (all live, free forever)
- **28 free tools** (finance, self-employment, property, family, lifestyle, betting, crypto) — see Tools section below
- **20 parent guides** (10 KS3 + 10 GCSE) — "Help Your Child With Maths" at /parents/
- Terms of Use page (17 sections, UK law, noindex)
- GitHub Pages enabled, CNAME set to mathswins.co.uk
- DNS configured at IONOS with A records pointing to GitHub Pages
- HTTPS enforced
- **Google Sign-In** on ALL pages site-wide (fixed top bar)
- **Account page** (`/account/`) — profile, owned courses, available courses, server-side upgrade pricing
- **Upgrade Credit System** — server-side spend calculation, Stripe coupon generation, auto-applied promo codes
- **Access restoration** via email magic link (`/restore/`) or automatic on Google login
- **Cloudflare Worker** (`mathswins-restore`) — auth, restore, upgrade credit endpoints (deployed via dashboard)
- **Cookie consent banner** on all pages — GA4 with consent mode (defaults denied, upgrades to granted on accept)
- **About page** (`/about/`) — four pillars, BMC link (buymeacoffee.com/maffsgames), MaffsGames credibility line
- **Learn hub** (`/learn/`) — educational articles with CollectionPage schema
- **3 Learn articles** — poker odds, salary sacrifice, overround explained
- **Full SEO** on all 90+ pages — title, description, canonical, OG tags, twitter:card, FAQ schema on tools, WebApplication schema on tools
- **SEO fix (28 March 2026):** homepage cards converted from onclick divs to `<a>` tags (40 cards)

### Not Yet Built / In Progress
- Stripe redirect URLs (need to set `?session_id=` on all 18 Payment Links in Stripe dashboard)
- Options Maths M2-10 (M2-6 content received, M7-10 TBC)
- Options Maths pricing (TBC)
- Card Counter Tool (£4.99/month or £29.99/year, requires BJ Master — build after Phase 1 verified)
- FPL Maths (build April 2026, launch August 2026)
- Phase 3: QF token payments + Academy.sol

## Directory Structure
```
index.html                          # Landing page (dark theme, nav pills)
CNAME                               # mathswins.co.uk
auth/
  mw-auth.js                       # Shared auth module — Google Sign-In, session management, purchase gating
account/
  index.html                        # My Account page — profile, purchases, upgrade prompts
