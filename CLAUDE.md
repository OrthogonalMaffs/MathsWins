# MathsWins — CLAUDE.md

## What This Is
Platform with 5 pillars: Academy (paid courses), Tools (28 free calculators), Games (13 free), Everyday Maths (6 free courses), Learn (articles). Separate from MaffsGames (schools site).

- **Site:** mathswins.co.uk (GitHub Pages)
- **Repo:** OrthogonalMaffs/MathsWins
- **Contact:** contact@mathswins.co.uk
- **BMC:** buymeacoffee.com/maffsgames (shared account)
- **Tagline:** "The Maths Behind Every Decision"

## Reference Files
- Academy courses (modules, pricing, tiers): see `.claude/rules/academy-courses.md`
- Tools list (28 calculators): see `.claude/rules/tools-list.md`
- Parents guides (20 guides): see `.claude/rules/parents-guides.md`
- Games roster (13 games): see `.claude/rules/games-roster.md`
- Smart contracts: see `.claude/rules/smart-contracts.md`
- Payment config (Stripe, pricing, upgrades): see `.claude/rules/payment-config.md`
- Auth flow (Google Sign-In, Workers, JWT): see `.claude/rules/auth-flow.md`
- Directory structure: see `.claude/rules/directory-structure.md`

## Origin
Split from MaffsGames in March 2025. MaffsGames = free schools games. MathsWins = academy + tools + everything commercial. Zero crossover in branding or contact.

## Tech Stack
- Single-file HTML (no build step, no framework)
- KaTeX CDN for math rendering
- GitHub Pages hosting
- Stripe for payments (Payment Links + localStorage, Phase 1 live)
- Cloudflare Workers + KV for auth (`api.mathswins.co.uk`)
- Google Identity Services for sign-in
- GA4 with consent mode (`G-7GTLYCZMXN`)

## Business Model (Brief)
- **MathsWins Premium:** Annual £99.99/year, Lifetime £149.99 (9 core academy courses)
- **Standalone:** Options Maths, Crypto Trading (NOT in Premium)
- **Free:** Games, Everyday Maths, Tools, Parents, Module 1 of all courses, Learn articles
- **Upgrade credit:** Users who bought individual courses get credit toward Premium
- **Phase 3 (future):** QF token payments + Academy.sol

## Current State
- 9 academy courses with Stripe payments (Module 1 free)
- 28 free tools (finance, self-employment, property, family, betting, crypto)
- 13 free games
- 6 free everyday maths courses
- 20 free parent guides
- /learn/ hub with 3 articles (poker odds, salary sacrifice, overround explained)
- /about/ page with BMC
- Google Sign-In + purchase restoration + upgrade credit live
- Cookie consent banner on all pages

## SEO
- Sitemap: 90+ URLs
- All pages: title, meta description, canonical, OG tags, twitter:card
- All tools: WebApplication + FAQPage schema
- All courses: Course schema
- Learn articles: Article + FAQPage schema
- Homepage cards are `<a>` tags (converted from onclick divs, 2026-03-28)
- OG image: `assets/og-image.png` (1200x630)

## Theme
- **Dark:** #050709 bg, #d4a847 gold accent, #0d9488 teal secondary
- **Fonts:** DM Mono (code), Bebas Neue (headings), Crimson Pro (italic), Outfit (UI)
- **Tone:** Confident, mathematical, zero-bullshit. Educational, not gambling.

## Educational Content Patterns
- `.mb` — math box (monospace formulas, worked examples)
- `.pln` — plain English explanation (cyan accent)
- `.pt` — practical tip (green accent)
- `.dg` — danger warning (red accent)

## Relationship to Other Projects
- **maffsgames.co.uk** — sister site, schools-only. Shares 5 games. Zero branding crossover.
- **QF Network** — the blockchain. MathsWins is a dApp on QF Network.

## Safety
- No wallet connection code without explicit approval
- 10% burn on every QF payment is non-negotiable
- No crossover with maffsgames.co.uk branding or contact
