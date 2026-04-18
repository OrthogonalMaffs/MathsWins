# Achievement System — v4 spec

## Contracts
- **QFAchievement.sol v2:** `0xc519E65Fb767DBEFC46FF0dC797Ccd0318Ae12eD` (QF Network mainnet)
  - Owner: `0xB21039b9A7e360561d9AE7EE0A8B1b722f2057A3` (onlyfans.qf)
  - Minter: `0x26b4A4115D184837530a42B34B945D5d1d2aa67e` (escrow)
  - Adds `setTokenURI(onlyOwner)` and `mintBatch(onlyMinter)` vs v1
- **v1 RETIRED:** `0x8DCe89b4b0BB40e9C9cb092Be91D195EFdC2C77F` — no setTokenURI, token #1 stranded

## Registry
- **163 total / 162 active** (speed-reader retired, active=0)
- **32 categories:** purity, volume, winning, shadows, duels, battleships, freecell, minesweeper, poker-patience, cribbage, golf, pyramid, kenken, nonogram, sudoku, comeback, per-game-volume, free-games, streaks, kakuro, time, seasonal, monthly, constants, squared-pi, loyalty, milestones, meta, absurd, founding, wooden-spoons, impossible
- **5 mint tiers:** Free (0 QF), Standard (100 QF), Premium (200 QF), Elite (500 QF), Manual reward
- `achievement_registry` has both `tier` and `category` columns (tier for legacy compat)
- Pioneer tag: first mint per achievement, UNIQUE constraint
- **Pioneer flags wiped 2026-04-17:** all `is_pioneer=0` — reserved for real paying customers. `first_claimed_by/first_claimed_at` left as historical record. DB backup: `mathswins.db.pre-pioneer-wipe.20260417-195155`
- **Tier+fee migration applied 2026-04-18** (see `docs/migrations/20260418-achievement-tier-fix.sql`): 22 standard-tier rows had `mint_fee_qf=200`, corrected to 100; `immaculate` retiered obsidian→elite; `pioneer-hunter`, `the-whale`, `dominant`, `legend`, `the-completionist` retiered obsidian/meta→premium. Mint handler reads `mint_fee_qf` directly (no tier→price lookup), so DB is authoritative. `onlyfans-qf` left as `manual/200` pending decision. DB backup: `mathswins.db.pre-tier-fix.20260418-082930`.

## Mint Mechanics
- Real on-chain mint via escrow wallet
- Fee split: 5% burn, 95% team (via `splitFee()` on QFSettlement)
- Free mints use banked credits (every 5th paid mint = 1 free, every 10th = 2; tracked in `wallet_stats.paid_mint_count/free_mints_banked`)
- tokenURI uses HTTP gateway URLs (`https://gateway.pinata.cloud/ipfs/`), NOT `ipfs://`
- token_id parsed from Transfer event, stored in `achievement_eligibility`
- Add to Wallet button (EIP-747 wallet_watchAsset) on minted achievements in My Account
- **BACKEND DICT DRIFT BUG:** Inline `ACHIEVEMENT_METADATA` dict in `routes/api.mjs` (~80 entries) is partial copy of `qf-dapp/achievements/ipfs-mapping.json` (161 entries). Missing entries fall through to tier-fallback (generic bronze coin image — permanently wrong). Fix: load `ipfs-mapping.json` at startup.
- **Token 11 (`wrong-answer-streak`):** wrong on-chain tokenURI (tier-fallback CID). Fix: `setTokenURI(11, <correct CID>)` after dict-drift fix lands.

## Images & IPFS
- 99 bespoke images on Pinata, 114 ipfs-mapping entries (2026-04-14)
- Complete sets: seasonal (10/10), constants (5/5), battleships (11/11), monthly (4/4), comeback (2/2)
- Pinata JWT: Box 1 `.env` as `PINATA_JWT`, key name MathsWins3, expires 2027-04-08

## Condition Checker Hooks
- League settlement (all players, not just top 4)
- `scoring.mjs evaluate()` (all game completions)
- `/duel/:code/submit` (zero-to-hero: awarded when winnerScore === 0)
- Founding Member: first league puzzle submission 2026-04-11 to 2026-07-31 (env: FOUNDING_MEMBER_START/END)
- `submit-freeplay` forwards 22 clientStats fields (hand-maintained dict in `routes/api.mjs:350-380`)

## Super-Achievement Auto-Award
- `the-grandmaster` (FREE to mint) and `the-mathematicians-collection` awarded post-mint when all prerequisites hold minted NFTs
- Mirrors immaculate / the-wolf-pack pattern at `routes/api.mjs` mint handler

## Batch History
| Batch | Date | Content |
|-------|------|---------|
| 1–4 | pre-2026-04-12 | Core conditions |
| 5 | 2026-04-12 | 23 card/solitaire (poker-patience, cribbage, golf, pyramid) |
| 6 | 2026-04-12 | 8 core purity + immaculate super (SUM(mistakes)=0 across 10 league puzzles) |
| 7 | 2026-04-12 | 11 battleships + wolf-pack super |
| 8 | 2026-04-12 | 3 free game (century, explorer, personal-best) + free_game_completions table |
| 9/10/11 | 2026-04-17 | 5 free-game achievements: photographic, dead-reckoning, next-in-line, unbeatable, the-engineer |
| 12 | 2026-04-18 | 6 wirings: 4 Maffsy (wordy, binary-decision, the-novelist, feel-no-pressure) via `maffsy_complete` context.type + new `wallet_stats.maffsy_clean_streak` counter; Clairvoyant (HoL `perfectGame`) + On-the-nose (Countdown `exactHit`) via submit-freeplay clientStats |

## Known Issues (as of 2026-04-18)
- **~7 orphan achievements remain** (down from 13 — Batch 12 wired 4 Maffsy + Clairvoyant + On-the-nose). 2 by-design (boom, onlyfans-qf), 2 parked (all-wrong, full-hints), ~3 context-hardcoded needing per-game frontend wiring (lucky-number, the-undo-king, freecell dealNumber/undoCount fields).
- **Test-activity exclusion not enforced.** BUILDER_WALLETS bypasses payment only — achievement/record writes still fire for test wallets. Architectural fix pending.
- **`flag-everything` is structurally impossible.** First-click safety prevents flagging every cell. Retire or rewrite condition.
- **Wrong Answer Streak counter is lifetime.** `wallet_stats.prime_wrong_streak` persists across sessions. Confirmed spec behaviour, not a bug.
- **DEBUG flag:** `ACHIEVEMENT_DEBUG=true` env var enables award logs (off by default). The fifty-two-thousand airdrop log is always-on.
- **`onlyfans-qf` row** has `tier='manual'` but `mint_fee_qf=200` — contradicts "Manual reward" semantics. Left as-is in tier migration pending decision.

## Special Achievements
- "Boom" — the impossible achievement (first click safety means it can never be earned)
- The Grandmaster = FREE to mint
- Shadow Legend = 500 QF
- 19 wooden spoons (shown as `?` on teaser page until earned)
- the-fish: fires at league settlement for last-place poker-patience finishers (3 times to earn)

## Outstanding / Deferred
- **Fear of Commitment** — wooden spoons, standard tier (100 QF). Condition: exit 50 free games without completing (cumulative, not consecutive). Tracking needed: `incomplete_exits` counter on `wallet_stats` + frontend exit hook on every free game to increment on unmount-without-completion.
