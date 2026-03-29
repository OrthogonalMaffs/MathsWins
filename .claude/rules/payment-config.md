# Payment Configuration
- Do not interpret tool output — show raw output and wait for instruction
- When stuck or uncertain — say so immediately with what you know and what you don't
- Bad news delivered immediately is better than a problem discovered later

### Division of Labour
- Jon owns all architecture, mathematics, and financial decisions
- Pretty Claude (architecture instance) owns design and approach decisions
- Claude Code implements what is specified by Jon and Pretty Claude
- If you think a better approach exists — state it once clearly, then implement what Jon decides

### Platform Content Policy
- Words "idiot" and "stupid" must never appear anywhere on any platform. "Muppet" is actively encouraged where appropriate.

---

## Origin Story
MathsWins started as the crypto/commercial half of the MaffsGames project. MaffsGames began as a single platform combining free schools games with QF Network crypto games and a gambling mathematics academy. In March 2025 we separated the two concerns:

- **maffsgames.co.uk** — schools only. Free curriculum-aligned maths games for UK classrooms. No crypto, no gambling content. Repo: `OrthogonalMaffs/maffsgames`
- **mathswins.co.uk** — this repo. QF original games + Maths Always Wins academy. Crypto-integrated but NOT crypto-exclusive. Repo: `OrthogonalMaffs/MathsWins`

The separation was a clean migration — games were moved (not rebuilt), git history for the originals lives in the maffsgames repo. The two brands must have zero crossover — separate domains, separate email, separate branding.

## What MathsWins Is
A platform with four pillars:

### 1. Games — Free skill-based maths games (13, all live)
Pure logic, reasoning, and number sense. No luck, no gambling. These are the "QF originals" — games built for the QF Network community but enjoyable by anyone.

### 2. Academy — "Maths Always Wins" courses (9 core + 2 standalone, Premium £149.99 lifetime)
Educational deep-dives into the mathematics behind games of chance, betting, and trading. Not gambling tools — mathematical education. The thesis: understand the maths BEFORE you play.

### 3. Everyday Maths — Free financial literacy courses (6 courses, all live)
The mathematics behind everyday financial decisions. Tax, mortgages, pensions, compound interest, inflation, probability. Free forever.

### 4. Tools — Free standalone calculators (28 live)
Focused single-purpose tools. Finance, self-employment, property, family, lifestyle, betting, crypto.

### 5. Learn — Free educational articles
SEO-focused articles explaining mathematical concepts. Hub at `/learn/` with CollectionPage schema.

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
- **Purchases gated behind Google login** — buy buttons replaced with "Sign in to purchase" when not logged in

**Confirmed pricing:**
- Slots, Lottery, Baccarat: £1.99 (single tier)
- Roulette, Craps: £3.99 (single tier)
- Trading: Basic £6.99, Advanced £12.99
