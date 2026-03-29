# Authentication & Access Control
  - `POST /auth/google` — verify Google ID token, look up Stripe purchases, return 30-day session JWT
  - `GET /auth/session` — validate existing session, return user info + products
  - `POST /auth/refresh-purchases` — force Stripe re-lookup (call after new purchase), invalidates upgrade credit cache
  - `GET /auth/upgrade-credit` — calculate total spend (refund-aware), create Stripe coupon + promo code, return personalised pricing
  - `POST /request` — send magic-link email for access restoration (legacy)
  - `GET /verify` — redeem magic-link token (legacy)
- **Environment secrets** (set via Cloudflare dashboard → Settings → Variables and Secrets):
  - `STRIPE_SECRET_KEY` — Stripe key (needs Read: Checkout Sessions, Customers; Write: Coupons, Promotion Codes)
  - `RESEND_API_KEY` — transactional email
  - `HMAC_SECRET` — 256-bit hex for token signing
  - `GOOGLE_CLIENT_ID` — Google OAuth Client ID
- **KV namespace:** `RESTORE_KV` — rate limiting, single-use tokens, purchase caching

### Frontend Auth Module — `auth/mw-auth.js`
- Loaded on ALL pages site-wide (50+ pages)
- Google Identity Services (GIS) renders sign-in button
- On login: calls `/auth/google`, stores session JWT in localStorage (`mw_session`), sets all `mw_access_*` flags, reloads page
- **Purchase gating:** both `#mw-buy-section` (course pages) and `#mw-premium-section` (academy hub) gated behind login
- **Promo code injection:** when signed in, calls `/auth/upgrade-credit` and injects promo codes + effective prices into all Premium Stripe links on the page
- Session auto-restored on page load from cached user data
- Public API: `mwAuth.getUser()`, `mwAuth.isSignedIn()`, `mwAuth.hasAccess(slug)`, `mwAuth.signOut()`, `mwAuth.refreshPurchases()`

### Account Page — `/account/`
- Profile card with Google avatar, name, email, membership badge
- "Your Courses" section — owned courses with tier labels
- "Available Courses" section — courses not yet purchased with pricing
- **Server-side upgrade banner** — calls `/auth/upgrade-credit` for real spend data (refund-aware), shows personalised pricing with auto-applied promo codes
- Four upgrade states: no spend (standard pricing), partial credit (effective price shown), annual free (spend >= £99.99), lifetime free (spend >= £149.99)
- "Free Content" section — Everyday Maths, Games, Tools
- Sign-in prompt if not logged in

### Access Flow
1. User visits academy course page → sees fixed auth bar at top
2. Buy section shows "Sign in to purchase" with Google button
3. User signs in → worker verifies Google token, looks up Stripe purchases, returns session JWT
4. Frontend sets localStorage flags (`mw_access_SLUG`, `mw_premium`, etc.) → page reloads
5. If user owns the course: buy section hidden, locked modules unlocked
6. If user doesn't own: buy section shows Stripe Payment Link buttons
7. After Stripe purchase: `?session_id=` redirect sets localStorage, `mwAuth.refreshPurchases()` syncs to server

## SEO (Updated 28 March 2026)
- Sitemap: 90+ URLs (`sitemap.xml`)
- All 90+ pages have: title, meta description, canonical, OG tags, twitter:card
- All 28 tools have: FAQPage schema, WebApplication schema
- Learn hub and articles indexed and in sitemap (previously /learn/ was noindex, fixed 28 March)
- Homepage cards converted from onclick divs to semantic `<a>` tags (40 cards, 28 March)
- Broken /about/ links fixed across 9 pages (28 March)
- OG image: `assets/og-image.png` (1200x630 PNG, dark theme with gold branding)
- 12 tools have GOV.UK links for direct entitlement/application access

## Analytics (Updated 23 March 2026)
GA4 (`G-7GTLYCZMXN`) with **cookie consent banner** on all pages — **separate property from maffsgames.co.uk** (zero crossover). Consent mode defaults to denied; upgrades to granted when user accepts. Cookie consent persisted in localStorage (`mw_cookies`). Collects full session data when accepted, modelled data when declined.

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
- Cloudflare Workers + KV for auth and access restoration
