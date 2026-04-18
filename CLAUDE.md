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
- 22 games on dApp (8 competitive incl. 2 Coming Soon, 13 free, 1 duel-only), 13 on main site
- 6 free everyday maths courses
- 20 free parent guides
- /learn/ hub with 7 articles (poker odds, pot odds, salary sacrifice, overround, card counting, impermanent loss, pay rise/fiscal drag)
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
- **Main site:** #050709 bg, #d4a847 gold accent, #0d9488 teal secondary
- **dApp (Sabre):** #0e1013 bg, surfaces #16181c/#1e2025/#26282e, silver #b8bcc6, gold #c9a84c, muted #4a4e5a, text-white #e8eaf0, borders rgba(184,188,198,0.15)
- **Fonts (main site):** DM Mono (code), Bebas Neue (headings), Crimson Pro (italic), Outfit (UI)
- **Fonts (dApp):** JetBrains Mono (monospace/stats), Playfair Display (headings), Inter (body/UI), DM Mono (fallback)
- **Tone:** Confident, mathematical, zero-bullshit. Educational, not gambling.

## Educational Content Patterns
- `.mb` — math box (monospace formulas, worked examples)
- `.pln` — plain English explanation (cyan accent)
- `.pt` — practical tip (green accent)
- `.dg` — danger warning (red accent)

## dApp Backend (Competitive Games on QF Network)
- **Server:** Hetzner Box 1 (204.168.200.237), port 3860, PM2 `mathswins-dapp` (user jon)
- **SSH:** `root@204.168.200.237` with `~/.ssh/hetzner-vm`, PM2 via `su - jon`
- **Deploy:** `scp` files to `/home/jon/mathswins-dapp/src/games/`, `chown jon:jon`, restart PM2
- **API Base:** `https://dapp-api.mathswins.co.uk/api/dapp` (Cloudflare Tunnel 66ac7db5)
- **Box 2 (37.27.219.31):** bots, indexer, explorer, vector-graphs only — NO dApp backend
- **Local:** `http://127.0.0.1:3860/api/dapp`
- **Database:** SQLite at `/home/jon/mathswins-dapp/data/mathswins.db`
- **Frontend:** `qf-dapp/` directory, single-file HTML games, GitHub Pages
- **Wallet Module:** `qf-dapp/games/qf-wallet.js` — shared across all games, QNS reverse resolution, EIP-6963, auto-reconnect with 500ms delay. All wallet errors use styled `showWalletError()` banner (no browser alert() popups).

### Lobby Structure (4 tabs)
**Leagues tab:** 2x2 grid — Sudoku Duel (silver pulse), KenKen, Minesweeper, FreeCell. MW logo centre. Cards link directly to `/league/` lobby pages (not game hubs).
**Duels tab:** 10 duel-capable games — Sudoku Duel, Battleships, KenKen, Kakuro, Countdown Numbers, Nonogram, Minesweeper, FreeCell, Poker Patience, Cribbage Solitaire. QF stakes LIVE (variable stake, min 25 QF, client pays escrow, auto-settlement on completion). All 10 games have stake confirmation modals (creator + recipient) — wallet popup only fires after explicit confirm. Creator can set stake amount via input (default 25, min 25). Cards link to game hubs with `?mode=duel` — scrolls duel button into view with gold highlight flash.
**Free tab:** 12 free games with instant search — Maffsy, Higher or Lower, 52-dle, Towers of Hanoi, Don't Press It, Memory Matrix, RPS vs Machine, Estimation Engine, Sequence Solver, Prime or Composite, Cryptarithmetic Club, Battleships (vs CPU).
**Leaderboards tab:** Game selector (20 games, Battleships excluded), Daily/Weekly/Monthly period toggle, leaderboard table (Rank/Name/Score/Time), top 10 with "Show more" expand (all if <=25), connected wallet highlighted in gold, empty state message. Fetches from `/api/dapp/global-leaderboard/:gameId/:periodType`.

### Registered Games
**Active league games (4):** sudoku-duel, kenken, minesweeper, freecell (league lobby pages live)
**League-capable but not active (4):** kakuro, nonogram, poker-patience, cribbage-solitaire
**Duel-capable (10):** All 4 league games + battleships, kakuro, countdown-numbers, nonogram, poker-patience, cribbage-solitaire. All duel flows complete, QF stakes live (25 QF, escrow settlement).
**Free play (12):** maffsy, higher-or-lower, 52dle, towers-of-hanoi, dont-press-it, memory-matrix, rps-vs-machine, estimation-engine, sequence-solver, prime-or-composite, cryptarithmetic-club, battleships (vs CPU)
**Renamed:** Equatle → Maffsy (slug: /games/maffsy/). Old /games/equatle/ and /qf-dapp/games/equatle/ directories deleted.
**Free play backend:** POST /session/submit-freeplay — client-reported score, upserts personal_best, fires checkAchievements. All 11 free games wired (battleships uses its own API).
**Free play reskin (2026-04-11):** All 10 non-battleships free games reskinned to Silver theme (#0e1013), favicons fixed, leaderboards removed, higher-or-lower and 52dle converted from daily to random seed. Back to Lobby buttons added.
**Lobby compaction (2026-04-12):** 6 games (sudoku-duel, kenken, minesweeper, freecell, 52dle, maffsy) — removed eyebrow kicker, shrunk titles to 1.5rem left-aligned, merged HTP+scoring into single collapsed toggle, one-line descriptions.
**Mobile layout fixes (2026-04-12):** Sudoku Duel (single-row numpad, compact stats, fits 375x667 viewport), KenKen (numpad/action bar no-overflow), Maffsy (keyboard flex-fit, compact stats). Battleships radar: circular mask removed, plain rectangular grid.
**Maffsy Sabre reskin (2026-04-12):** Statistics + Settings modals restyled (#0a0d14 bg, silver borders, gold toggles, outline buttons). New Puzzle/Done buttons in end modal.
**Demoted from competitive:** countdown-numbers, cryptarithmetic-club (too short for league play)

### Shared Components
- **qf-nav.js:** Shared nav injected on all 35+ dApp pages via `<div id="qf-nav"></div>`. Links: Lobby | My Account (wallet connected).
- **My Account page:** `/qf-dapp/my-account/` — 5 tabs: My Leagues, My Duels, High Scores, Achievements, Trophies. Wallet-gated (JWT). My Duels tab shows active duels (with share code + game link) and recent completed duels (with win/loss/draw results). High Scores tab uses card-per-game layout: header (game name, difficulty badge, rank badge), 2-column stats (score with toLocaleString + date), leaderboard row (Daily/Weekly/Monthly with ranked period highlights), footer with eligibility text and Submit button (44px touch target). Ranked scores in gold. Submit requires session_id in personal_bests (pre-migration scores show "play again to submit").
- **Duel share code:** Displayed inside modal after game completion. Copy/share buttons. "Opponent has 24 hours to accept." Back to Lobby button.

### SQLite Tables (32)
| Table | Purpose |
|-------|---------|
| `games` | Game registry |
| `entries` | Paid game entries per wallet/week |
| `sessions` | Game session records (+ last_activity_at for marathon tracking) |
| `best_scores` | Leaderboard — best score per wallet/game/week (legacy, empty) |
| `settlements` | Prize settlement records |
| `duels` | 1v1 duel challenges |
| `leagues` | League instances (game, tier, fee, status, schedule, pot) |
| `league_players` | Players per league (wallet, tx, puzzle_order) |
| `league_puzzles` | Pre-generated puzzle seeds per league |
| `league_scores` | Puzzle scores per player per league (+ mistake_count, hints_used, undos_used, free_cells_used, flags_used, helper_used for achievement tracking) |
| `league_prizes` | Prize payouts per position |
| `promo_challenges` | Promo/challenge codes |
| `promo_claims` | Claims against promo challenges |
| `active_game_state` | Persistent session state for resume (league puzzles) |
| `league_refunds` | Refund tracking for cancelled leagues |
| `battleships_games` | Battleships duel instances |
| `battleships_placements` | Fleet positions per player per game |
| `battleships_rounds` | Shot history per game |
| `battleships_record` | Win/loss/draw per wallet |
| `achievement_registry` | 163 total / 162 active (v4 spec), 32 categories, tier + category columns. speed-reader retired (active=0). +2 vs earlier count: regicide, detention (commit 827c623) |
| `achievement_eligibility` | Per-wallet achievement progress and mint status |
| `global_records` | Community records (e.g. The Tortoise slowest win) |
| `wallet_stats` | Per-wallet tracking (streaks, spending, mints, consecutive wins, golf/pyramid failures) |
| `personal_bests` | Best free play score per wallet/game/difficulty (upserted on completion, includes session_id for leaderboard submission) |
| `league_bests` | Best league total score per wallet/game/tier (upserted at settlement) |
| `game_messages` | Preset messages for duels and leagues |
| `seasonal_windows` | Seasonal achievement earning windows (pre-populated per year) |
| `commemorative_mints` | Commemorative NFT mint records per league |
| `global_leaderboard_entries` | Pay-to-appear global leaderboard (50 QF, daily/weekly/monthly) |
| `free_game_completions` | Per-wallet free game play count + PB beaten tracking |

### API Endpoints (45+)
**Auth:** POST /auth/challenge, /auth/verify (challenge-sign-verify, JWT 24h)
**Sessions:** POST /session/start, /session/resume, /session/evaluate, /session/submit-freeplay
**Leaderboard:** GET /leaderboard/:gameId, /leaderboard/:gameId/:weekId, /pot/:gameId, /games, /week, /entry/:gameId
**Duels:** POST /duel/precheck, /duel/create, /duel/:code/accept, /duel/:code/submit | GET /duel/config, /duel/:code, /duels/history
**Promos:** POST /promo/create, /promo/:code/submit | GET /promo/:code
**Leagues:** GET /leagues/:gameId, /leagues/:gameId/all, /league/:leagueId, /league/:leagueId/puzzles, /league/:leagueId/my-scores | POST /league/:leagueId/join, /league/:leagueId/submit
**League v2:** GET /leagues/my, /leagues/active, /leagues/settled | POST /admin/league/:id/settle, /admin/league/:id/cancel, /admin/league/:id/refund/:wallet | GET /admin/refunds
**Battleships:** POST /battleships/create, /:code/join, /:code/place, /:code/shoot, /:code/forfeit | GET /battleships/:code, /battleships/history, /battleships/active
**Achievements:** GET /achievements/status, /achievements/all, /achievements/my, /achievements/record/:id | POST /achievement/mint | POST /admin/achievement/register, /admin/achievement/award | GET /admin/achievements
**Profile:** GET /profile/:wallet (public, no auth, 60/min rate limit — returns personal_bests, league_bests, achievements, wallet_stats, league_history, trophies, leaderboard_positions)
**Global Leaderboard:** GET /global-leaderboard/:gameId/:periodType, GET /global-leaderboard/:gameId/eligibility, POST /global-leaderboard/enter, GET /global-leaderboard/my-positions

### League System v2
- Server-authoritative: seeds never reach client, sequential random puzzle delivery
- Anti-cheat: 60s floor, rapid input detection
- Tiers: Bronze (100 QF entry), Silver (250 QF entry)
- 10 puzzles per league, 14-day play window, min 4 players (was 8)
- Top 4 share prize pool (90% prize, 5% burn, 5% team)
- Auto-create: new OPEN league created when existing one starts
- Auto-cancel: leagues with <4 players at join close
- Auto-settle: when all puzzles complete (early) or 14-day deadline
- Automatic refunds on cancel (full entry fee, no burn)
- Admin endpoints: force-settle, cancel, retry refund
- Player endpoints: /leagues/my, /leagues/active, /leagues/settled
- League-eligible games: sudoku-duel, kenken, nonogram, kakuro, minesweeper, freecell
- Builder whitelist via BUILDER_WALLETS env var (testing without payment)
- Wallet auth: challenge-sign-verify JWT (24h), persisted in localStorage
- Substrate wallet support: Talisman/Polkadot.js/SubWallet via @polkadot/extension-dapp

### Duel Payment System (all 10 games wired 2026-04-13)
- All 10 duel games require QF payment (min 25 QF, variable stake via creator input; Battleships PvP included, CPU games free)
- **Stake confirmation modals** on all 10 games: creator sees modal after precheck with chosen stake amount; recipient sees modal with actual duel stake before wallet popup fires. Cancel aborts cleanly.
- **Stake selector** on 9 games (all except cryptarithmetic-club which is free): number input above Create button, default 25, min 25, no max. Backend validates `parseInt(stake) >= 25`.
- Client checks duel status BEFORE payment (prevents farming via expired/completed links)
- sessionStorage dedup prevents double-pay on page refresh (keyed by duel code). If payment already stored, modal skipped on accept (payment already committed).
- /duel/precheck endpoint validates eligibility before create payment
- GET /duel/config returns { escrowAddress, defaultStake: 25 }
- Server stores txHash in duels.creator_tx / duels.acceptor_tx (and battleships_games equivalents)
- Settlement fires automatically when both scores submitted via QFSettlement contract (atomic)
- settleDuel() calls contract.settle(winner) — single tx, 5% burn + 5% team + 90% winner
- settleDuelDraw() calls contract.settleDraw(p1, p2) — single tx, 5% burn + 5% team + 45% each
- Only settles if both creator_tx AND acceptor_tx present (no payout for free duels)
- Battleships: bothPaid check on all 3 settlement points (win/forfeit/auto-shot)
- Achievement mint + leaderboard entry fees use contract.splitFee() — atomic 5% burn + 95% team
- QFSettlement contract: `0x475F350469Cbe5aDd04aae4686339b3b990D013E`
- Refund sweep (5min interval) only refunds if tx hash exists
- Builder-whitelisted wallets bypass payment entirely
- Lobby code input routes to correct game via duel lookup (was hardcoded to sudoku-duel)
- **BLOCKER:** On-chain verification parked — QF RPC eth_getTransactionReceipt returns null for valid transactions. Trust-the-hash until fixed.

### Wallet Auth (JWT)
- Challenge-sign-verify flow in qf-wallet.js
- JWT stored in localStorage (sign once per 24 hours)
- Server: /auth/challenge + /auth/verify, supports both EVM and Substrate signatures
- optionalWallet middleware accepts JWT or legacy X-Wallet-Address header
- @polkadot/util-crypto installed on Hetzner for Substrate signature verification

### Achievement System (v4 spec, 163 total / 162 active, ACHIEVEMENTS_ACTIVE=true)
- **Contract:** QFAchievement.sol v2 deployed at `0xc519E65Fb767DBEFC46FF0dC797Ccd0318Ae12eD` (QF Network mainnet). Adds setTokenURI (onlyOwner) and mintBatch (onlyMinter).
- **Retired contract:** `0x8DCe89b4b0BB40e9C9cb092Be91D195EFdC2C77F` — v1, no setTokenURI. Token #1 stranded, superseded by v2 re-mint.
- **Owner:** `0xB21039b9A7e360561d9AE7EE0A8B1b722f2057A3` (onlyfans.qf)
- **Minter:** `0x26b4A4115D184837530a42B34B945D5d1d2aa67e` (escrow)
- Soulbound ERC-721, mint(address, string tokenURI), same pattern as QFLeagueTrophy
- Achievements page LIVE at /qf-dapp/achievements/ — ACHIEVEMENTS_ACTIVE=true
- 32 categories: purity, volume, winning, shadows, duels, battleships, freecell, minesweeper, poker-patience, cribbage, golf, pyramid, kenken, nonogram, sudoku, comeback, per-game-volume, free-games, streaks, kakuro, time, seasonal, monthly, constants, squared-pi, loyalty, milestones, meta, absurd, founding, wooden-spoons, impossible
- 5 mint tiers: Free (0 QF), Standard (100 QF), Premium (200 QF), Elite (500 QF), Manual reward
- achievement_registry has both `tier` and `category` columns (tier for legacy compat, category for v4)
- Pioneer tag: first mint per achievement, UNIQUE constraint
- Condition checker hooks into: league settlement (all players, not just top 4), scoring.mjs evaluate() (all game completions), puzzle submission (Founding Member)
- Batch 5 live: 23 card/solitaire conditions (poker-patience, cribbage, golf, pyramid) — checkAchievements wired into scoring.mjs for all games
- Batch 6 live (2026-04-12): 8 core purity + immaculate (mint-time super). Checks SUM(mistakes)=0 across all 10 league puzzles per game.
- Batch 7 live (2026-04-12): 11 battleships + wolf-pack (mint-time super). Uses checkSunk() from battleships.mjs, fleet JSON from battleships_placements.
- Batch 8 live (2026-04-12): 3 free game (century, explorer, personal-best) + free_game_completions table. Remaining 11 free game achievements need frontend stats in submit-freeplay payload.
- speed-reader RETIRED (active=0) — 52dle only has 6 guesses
- Audit 2026-04-17: 18 structural orphans + ~20-30 likely-broken context-hardcoded conditions + 2 code-to-registry typo anomalies. See `docs/achievement-audit-2026-04-17.md` for detail. Previous "157 of 161 wired" figure is not reliable — earned via pattern-matching that misclassified several conditions.
- **Thresholds (corrected 2026-04-16):** weekend-warrior = 4 consecutive Saturdays, pioneer-hunter = 4 pioneers minted, duel-master = 10 completed duel wins (any opponent)
- **DEBUG flag:** `ACHIEVEMENT_DEBUG=true` env var to enable achievement award console.log (off by default in production). The fifty-two-thousand airdrop log remains always-on.
- 99 bespoke images uploaded to Pinata, 114 ipfs-mapping entries (2026-04-14)
- Complete sets: seasonal (10/10), constants (5/5), battleships (11/11), monthly (4/4), comeback (2/2)
- Admin endpoints live: /admin/schema (inspect live DB), /admin/ledger (escrow accounting). Auth via x-admin-key header. See ecosystem.config.cjs for ADMIN_SECRET.
- escrow_ledger table logs all sendQF calls with direction/type/amount/source/reference_id (live from 2026-04-14)
- the-fish: fires at league settlement for last-place poker-patience finishers (3 times to earn)
- Founding Member: fires on first league puzzle submission between 2026-04-11 and 2026-07-31 (env: FOUNDING_MEMBER_START/END)
- Mint endpoint: real on-chain mint via escrow wallet, fee split (5% burn, 95% team), free mints use banked credits
- On-chain tokenURI uses HTTP gateway URLs (https://gateway.pinata.cloud/ipfs/), NOT ipfs:// protocol
- 14 bespoke metadata JSONs re-pinned with HTTP gateway image URLs (commit e6d7cba)
- token_id parsed from Transfer event, stored in achievement_eligibility, returned in mint response
- Add to Wallet button (EIP-747 wallet_watchAsset) on minted achievements in My Account
- Mint reward: every 5th paid mint banks 1 free mint, every 10th banks 2 (tracked via paid_mint_count, free_mints_banked on wallet_stats)
- DB: achievement_registry, achievement_eligibility, global_records, wallet_stats
- "Boom" — the impossible achievement (first click safety means it can never be earned)
- The Grandmaster = FREE to mint, Shadow Legend = 500 QF
- 19 wooden spoons (shown as ? on teaser page until earned)
- **Batch 9/10/11 live (2026-04-17):** 5 achievements wired end-to-end — `photographic` (memory-matrix), `dead-reckoning` (estimation-engine), `next-in-line` (sequence-solver, localStorage streak), `unbeatable` (rps-vs-machine, localStorage streak), `the-engineer` (towers-of-hanoi, max-difficulty solved). Conditions in `achievement-checker.mjs` free-games block; frontend wires `clientStats` per game.
- **Super-achievement auto-award (2026-04-17):** `the-grandmaster` and `the-mathematicians-collection` now awarded post-mint when all prerequisites hold minted NFTs. Mirrors existing immaculate/the-wolf-pack pattern at `routes/api.mjs` mint handler.
- **zero-to-hero (2026-04-17):** awarded to duel winner when `winnerScore === 0`. Wired in `/duel/:code/submit` after winner determination.
- **Typo anomalies resolved (2026-04-17):** `the-mathematician` dead legacy block at `achievement-checker.mjs:676-680` removed; `speedrun-to-zero` awardAchievement commented out with TODO (not in registry, spec session needed).
- **Pioneer flags wiped 2026-04-17:** 6 rows affected. All `is_pioneer` currently 0 — Pioneer slots reserved for real paying customers from launch day forward. `achievement_registry.first_claimed_by/first_claimed_at` left intact as historical record. DB backup at `mathswins.db.pre-pioneer-wipe.20260417-195155`.
- **submit-freeplay context builder (2026-04-17):** `routes/api.mjs:350-380` forwards 22 `clientStats` fields to `checkAchievements` (was 14). Added: `exactHits`, `totalQuestions`, `roundsSurvived`, `perfectRounds`, `consecutiveCorrect`, `winStreak`, `difficulty`, `solved`. Still a hand-maintained field-list — each future per-game clientStats field requires adding to the dict. Refactor-to-spread is a future simplification.

#### Known Issues (2026-04-18, end of session)
See `docs/achievement-audit-2026-04-17.md` for the original audit. Summary of currently-live issues after today's fixes:
- **~~Global leaderboard revenue leak~~ FIXED 2026-04-18.** Both post-play prompt (`qf-leaderboard-prompt.js`) and My Account second-chance submit now pay 50 QF from user wallet before POSTing. Backend requires `txHash`. Multi-period entry: one payment writes rows for all qualifying periods (daily/weekly/monthly). Eligibility endpoint now requires `status==='completed'`, matching enter endpoint guard — gameover sessions no longer prompted.
- **Backend `ACHIEVEMENT_METADATA` dict drift.** Inline dict in `routes/api.mjs` (~80 entries) is a partial copy of the frontend `qf-dapp/achievements/ipfs-mapping.json` (161 entries). When a mint request hits an achievement missing from the backend dict, the handler falls through to a tier-fallback that pins a generic "standard-tier bronze coin" metadata JSON — the NFT is permanently soulbound to the wrong image. Fix pending: load `ipfs-mapping.json` at startup as single source of truth.
- **Token 11 (`wrong-answer-streak`, Jon's wallet) has wrong on-chain tokenURI.** Points to the tier-fallback metadata CID instead of the bespoke chimp image. Fix: call `setTokenURI(11, <correct CID>)` on QFAchievement contract after dict-drift fix lands.
- **Test-activity exclusion is not enforced.** Project doc v8 and CLAUDE.md both state test sessions are excluded from achievement and record tracking. Inline inspection of `achievement-checker.mjs` and `league-settle.mjs` finds NO enforcement. `BUILDER_WALLETS` only bypasses payment, not achievement/record writes. Architectural fix pending.
- **13 orphan achievements remain** (was 18 — 5 wired today: photographic, dead-reckoning, next-in-line, unbeatable, the-engineer). Residual categories: 2 by-design (boom, onlyfans-qf), 3 parked (all-wrong, full-hints, the-novelist), ~8 context-hardcoded (lucky-number, the-undo-king, others reading freecell dealNumber / undoCount — no longer hardcoded in submit-freeplay but need per-game frontend wiring of those fields). Super-achievements now wired (the-grandmaster, the-mathematicians-collection).
- **Wrong Answer Streak counter is lifetime.** `wallet_stats.prime_wrong_streak` persists across sessions and counts timeouts (>5s idle) as wrong answers. Spec decision 2026-04-17: behaviour confirmed, not a bug.
- **FreeCell auto-complete bug.** Does not trigger when all tableau columns are sorted descending by suit and foundations reach 8s. FreeCell UNDO button greys out mid-game — separate issue. Both investigations pending.
- **`flag-everything` is structurally impossible.** Minesweeper first-click-safety rule prevents flagging every cell (first cell opened can never be a mine). Retire or rewrite condition.
- **League settlement payout is not atomic.** `doSettleLeague` Step 4 at `league-settle.mjs:186-198` iterates `sendQF` per winner with no throw/break on falsy return. `paid_at` is per-prize, written only on success. Partial-payment states silently possible. Retry or rollback logic needed.

### Escrow Ledger & Burn Tracking (live 2026-04-17)
- **`escrow_ledger` schema:** adds `inferred INTEGER DEFAULT 0` column. `inferred=0` rows = exact amounts parsed from on-chain events. `inferred=1` rows = computed from expected splits as fallback when event parsing fails.
- **Atomic split detail rows:** `splitFee`, `settleDuel`, `settleDuelDraw` receipts parsed at call site via `logSplitFromReceipt()` in `escrow.mjs`. Writes one detail row per inner transfer (burn / team / winner / draw-payout), not a single summary row.
- **Events parsed from QFSettlement:**
  - `FeeSplit(burned, team)` — mint fees and leaderboard entries → 2 rows (burn + team)
  - `Settled(winner, winnerAmount, burned, team)` — duel + battleships wins → 3 rows (winner + burn + team)
  - `SettledDraw(p1, p2, eachAmount, burned, team)` — duel draws → 4 rows (draw-payout×2 + burn + team)
- **Fallback:** if no matching event parses, computes expected amounts from `expectedTotalQf` passed in by caller, writes rows with `inferred=1` and type suffix `-inferred` (e.g. `burn-inferred`, `team-inferred`). Operator sees the flag and investigates.
- **Legacy `type='settle'` / `type='settle-draw'` summary rows** no longer written by `settleDuel`/`settleDuelDraw`. Replaced by detail rows. Pre-2026-04-17 rows with those types remain as historical record — filter by created_at if aggregating.
- **Receipts are delivered in-band** by the node accepting the tx at submission time. Not affected by the QF RPC pruning that blocks `eth_getTransactionByHash` for historical txs.
- **Source of truth for total burn:** on-chain burn address `0x...dEaD` balance (~1953.33 QF as of 2026-04-17 pre-mint-testing). Aggregating `SUM(amount_qf) WHERE type='burn'` in escrow_ledger covers only transactions logged after this feature went live — earlier atomic splits aren't backfilled.
- **Wired call sites (5):** mint (`api.mjs:2053`), leaderboard entry (`api.mjs:2459`), duel settlement (`escrow.mjs settleDuel` — covers duel + battleships), duel draw (`escrow.mjs settleDuelDraw`).
- Verified 2026-04-17 via the-engineer mint (token 13): ledger rows id=8 burn 5.0 inferred=0, id=9 team 95.0 inferred=0, paired tx hash, source=mint.

### KenKen Scoring
- Base 5000, -1pt/sec after 60s grace, -300 per incorrect submission, -500 per hint
- 3 incorrect grid submissions = game over (pity score: correctCells x 20, no other penalties)
- Server tracks `session.submitFailures` (grid submissions) separately from `session.mistakes` (cell placement errors)
- Client mirrors with `submitFailures` variable — `mistakes` is for score preview only
- Results screen shows "Incorrect Submissions" and "Hints Used" (not "Mistakes" / "Hints")
- KenKen, Kakuro, Nonogram scoring bug FIXED (2026-04-11): now penalises grid submissions not cell errors. submitFailures tracked separately.

### Personal Bests and League Bests
- `personal_bests` table: upserted on successful free play OR league completion (paths 2 and 4 only — game-overs excluded)
- Columns: wallet, game_id, difficulty, score, time_ms, achieved_at, session_id (TEXT, nullable — added 2026-04-11)
- `session_id` stores the session that produced the personal best, enabling second-chance leaderboard submission from My Account
- Existing rows have session_id = NULL; new completions populate it automatically via scoring.mjs
- Time-primary games (minesweeper, freecell, kenken, nonogram, kakuro, sudoku-duel): lower time = better, upsert uses `<`
- Score-primary games (estimation-engine, countdown-numbers, etc.): higher score = better, upsert uses `>`
- `league_bests` table: upserted at settlement for ALL players in the league (not just top 4)
- `difficulty` field added to in-memory session object in startFreeSession and rebuildSession
- Profile endpoint: GET /api/dapp/profile/:wallet (public, 60/min rate limit)

### Global Leaderboard (Phase 4 — live 2026-04-11)
- Pay-to-appear: 50 QF per entry (server-side via escrow wallet, 2 QF burn + 48 QF team)
- Periods: daily (YYYY-MM-DD), weekly (YYYY-WNN), monthly (YYYY-MM)
- One entry per wallet per game per period — duplicate submission returns 400
- Requires valid completed session_id (anti-cheat: flagged sessions rejected)
- Lobby Leaderboards tab: game selector, period toggle, top 10 with expand, wallet highlight
- My Account High Scores: ranked scores sorted to top with star badge, eligibility check for unsubmitted scores, Submit button (requires session_id in personal_bests — pre-migration scores show "play again to submit")
- Eligibility endpoint: checks if score would rank in top 25, returns shouldPrompt + projected rank. Requires `status==='completed'` — gameover sessions return `shouldPrompt: false`.
- Time formatting: null/zero/NaN guard added to prevent MM:SS display bugs
- **Post-play submission prompt (2026-04-17 → 2026-04-18):** live via `qf-dapp/games/qf-leaderboard-prompt.js` shared helper. Wired across **21 of 23 games** (7 submit-freeplay-only, 7 mixed-path free-play branches, 7 evaluate-path with `!leagueMode && !duelMode` guards). **2 skipped** — battleships and maffsy use custom submit paths (`/battleships/:code/shoot`, `/maffsy/complete`) that don't create `active_game_state` rows; wiring them requires a separate backend pass to unify their session lifecycle. Helper does 3 parallel eligibility calls (daily/weekly/monthly), renders Sabre-themed modal only when at least one period qualifies, dedups per sessionId via sessionStorage, POSTs via JWT. Second-chance submit on My Account High Scores remains as a fallback path. **Revenue leak FIXED 2026-04-18** — both paths now pay from user wallet (trust-the-hash). **Multi-period entry LIVE 2026-04-18** — `/global-leaderboard/enter` accepts `periodTypes` array; one 50 QF payment writes rows for all qualifying periods. Both helper and My Account send all qualifying periods in one call.
- **`/session/submit-freeplay` session-row unification (2026-04-17):** handler now creates a completed `active_game_state` row (`sess_free_<uuid>`, status='completed', flagged=0, context_type='free', free_play=1) and returns `sessionId` in the response. Previously only `/session/evaluate` produced game_state rows; submit-freeplay's skip meant 14 games had no sessionId to pass to `/global-leaderboard/enter`. Enabler for post-play prompt feature. Personal-bests upsert unchanged in submit-freeplay — session_id linkage on `personal_bests` still only populated via evaluate path (separate pass).
- **`/session/evaluate` free-play persistence + sessionId response (2026-04-18):** `scoring.mjs startFreeSession` now writes an `active_game_state` row for **all** continuous-mode sessions (not just `contextType='league'` as before). `scoring.mjs evaluate` now sets `response.sessionId = payload.sid` at both return points (continuous and sequential). `api.mjs` route forwards the response verbatim. This was the precondition for the 7 evaluate-path wire-ins (sudoku-duel, kenken, kakuro, nonogram, poker-patience, cribbage-solitaire, countdown-numbers) — previously their helper calls passed the JWT `sessionToken` (the signed envelope, not the `sid`) and the server's `getGameState(sessionId)` always returned null. Both frontend and backend fixes pushed together (`cdd9758` backend, `58c54dd` frontend).

### Battleships
- Turn-based async duels only (no simultaneous — dropped to avoid WebSocket complexity)
- vs CPU free play: 3 difficulties (Recruit, Officer, Admiral)
- Admiral uses probability density map AI
- 24h auto-shot timeout, 5-minute sweep
- Settlement: 90% winner, 5% burn, 5% team
- `turn_deadline` (Unix epoch seconds, UTC) exposed in GET /battleships/:code response
- **GET /battleships/active** — returns active games where it's the authenticated wallet's turn: `[{ code, opponent, turn_deadline, started_at }]`
- **Move notifications** — hub-level (qf-dapp/index.html) popup system, fires on wallet connect + 5min poll. Thresholds: any outstanding, 12h, 4h, 1h remaining. sessionStorage tracks dismissed thresholds per game code. Naval-themed styling. CTA links to `/qf-dapp/games/battleships/?code=[CODE]`. Deep link uses `?code=` (not `?duel=`).
- Vertical ship rendering fixed: inner SVG wrapper swaps width/height before CSS rotate(90deg)

### Trophy NFTs (QFLeagueTrophy.sol)
- **Contract:** `0xBC41549872d5480b95733e4f29359b7EAB4E05b8` (QF Network mainnet)
- **Owner:** `0xB21039b9A7e360561d9AE7EE0A8B1b722f2057A3` (onlyfans.qf)
- **Minter:** `0xFc6346C5A10c51Ef6B9cE9746F436b0b7Ec3D7b6` (escrow)
- Soulbound ERC-721, compiled with resolc, 22 Forge tests passing
- All 9 games have silver + bronze trophy images in `qf-dapp/games/{slug}/assets/`
- MidJourney prompts saved as `logoprompt.md` per game
- Pinata IPFS: account set up, JWT on Hetzner

### QNS Integration
- Reverse resolution via QNS Resolver contract (`reverseResolve(address)`)
- New Resolver: `0x276b7e9343c19bea29d32dd4a8f84e6d1c183111`
- Old Resolver: `0xd5d12431b2956248861dbec5e8a9bc6023114e80`
- Leaderboard displays .qf names when available

## Relationship to Other Projects
- **maffsgames.co.uk** — sister site, schools-only. Shares 5 games. Zero branding crossover.
- **QF Network** — the blockchain. MathsWins is a dApp on QF Network (Chain ID 3426).

## Safety
- No wallet connection code without explicit approval
- 5% burn on every QF payment is non-negotiable
- No crossover with maffsgames.co.uk branding or contact
- NEVER restart PM2/server without explicit "yes" from Jon


## Task Contract

All tasks arriving from Jon (relayed from Claude chat) will be structured as follows.
Do not begin work unless all six fields are present:

TASK: [one sentence description]
ROOT CAUSE: [what is actually wrong]
EXACT CHANGE: [file, function, what changes to what]
DO NOT TOUCH: [explicit exclusions]
SUCCESS CONDITION: [how to know the task is complete]
STOP IF: [conditions that require you to halt and report back to Jon]

### Behaviour rules

- Before touching any file, state your understanding of the ROOT CAUSE in one sentence.
- If you hit something unexpected, do not improvise. Invoke STOP IF and report back.
- Do not refactor, rename, reformat, or tidy anything outside EXACT CHANGE.
- One pass. If it isn't right, stop and report — do not attempt iterative self-correction.
- If a task arrives without this structure, ask Jon for the missing fields before proceeding.
