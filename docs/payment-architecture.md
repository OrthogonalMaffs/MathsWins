# Payment Architecture

## Escrow & Settlement

**QFSettlement contract (v2):** `0xf4C00E9CBC6fe595c4a54ae7e75E9a92D0D513d4`
- Defaults: `burnPct=5`, `teamPct=10` (owner-settable via `setSplits`)
- `settle(winner)` — duel/battleships win: 5% burn + 10% team + 85% winner (at defaults)
- `settleDraw(p1, p2)` — duel draw: 5% burn + 10% team + 42.5% each (at defaults)
- `splitFee()` — achievement mints + leaderboard entries: **hardcoded 5% burn + 95% team** (ringfenced from setSplits)
- `setSplits(burnPct, teamPct)` — owner-only, duel splits only, requires `burn + team < 100`
- **Owner (setSplits authority):** `0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016` (Jon's Ledger). `teamWallet()` on the contract returns the same address.
- Called by `escrow.mjs` (duel/battleships) and `routes/api.mjs` (mint, leaderboard)
- **v1 retired:** `0x475F350469Cbe5aDd04aae4686339b3b990D013E` (hardcoded 5/5/90)

**Trust-the-hash:** QF RPC `eth_getTransactionReceipt` returns null for valid txs. Server trusts txHash from client, does not verify on-chain. Blocker until RPC fixed.

**Escrow wallet:** `0x26b4A4115D184837530a42B34B945D5d1d2aa67e` (minter)
**Team wallet:** `0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016` (settable by owner)
**Burn address:** `0x000...dEaD` (~1953.33 QF as of 2026-04-17 pre-mint-testing)

## Duel Payment Flow
1. Creator: precheck → modal → wallet pays stake to escrow → POST /duel/create with txHash
2. Recipient: load duel → modal → wallet pays stake to escrow → POST /duel/:code/accept with txHash
3. Both submit scores → server calls `settleDuel()` or `settleDuelDraw()` atomically
4. Settlement only fires if both `creator_tx` AND `acceptor_tx` present (no payout for free duels)
5. sessionStorage dedup prevents double-pay on page refresh (keyed by duel code)
6. Builder-whitelisted wallets bypass payment entirely (BUILDER_WALLETS env var)

**Refund sweep:** 5-min interval, only refunds if tx hash exists. League refunds: full entry fee, no burn.

## Global Leaderboard Payment
- 50 QF per entry (user wallet → escrow, split: 2.5 QF burn + 47.5 QF team via `splitFee()`)
- `POST /global-leaderboard/enter` requires txHash, accepts `periodTypes` array — one payment writes all qualifying periods
- **Gate order (post-2026-04-19 orphan fix):** periodType valid → session valid (getGameState: not flagged, status=completed) → classify periods (insert / better-update / notBetter via `isBetterEntry` comparator in `routes/api.mjs`) → if all notBetter return 400 "Your current leaderboard entry already beats this score" → **THEN** require txHash and call `splitFee()`. Every pre-payment gate now returns 400 before the user is asked to sign on-chain, eliminating the class of orphan where an invalid session used to pay before validation.
- **Score updates** accepted: if the new submission beats the existing row per the ranking rule (higher score; tiebreak on time_ms ASC; TIME_PRIMARY_GAMES sort direction inverted) the existing row is overwritten with the new score + txHash. Exact tie = not better, rejected before payment.
- **Per-difficulty entries** (post-2026-04-19 schema): `global_leaderboard_entries` has `difficulty TEXT DEFAULT 'default'` with `UNIQUE(wallet, game_id, difficulty, period_type, period_key)`. The /enter handler derives difficulty from the session (`gs.difficulty`) so the in-game prompt doesn't need to pass it. Multi-difficulty games (minesweeper) get one entry per (difficulty, period). Single-tier games land on `'default'`.
- Dedup via sessionStorage `qf_lb_prompted_<sessionId>`
- See `docs/leaderboard-architecture.md` for the full grid UI + batch eligibility flow.

## Escrow Ledger (`escrow_ledger` table)
- Logs all sendQF calls: direction, type, amount_qf, source, reference_id
- `inferred=0`: exact amounts from on-chain event parsing
- `inferred=1`: computed from expected splits when event parsing fails (type suffix `-inferred`)
- Wired call sites (5): mint, leaderboard entry, settleDuel (covers battleships), settleDuelDraw
- **Receipts delivered in-band** by node at submission — not affected by RPC pruning of historical txs

## League Settlement
- Tiers: Bronze (100 QF), Silver (250 QF)
- Split: 85% prize pool, 5% burn, 10% team
- Top 4 share prize pool
- **Non-atomic settlement bug:** `doSettleLeague` at `league-settle.mjs:186-198` iterates `sendQF` per winner with no throw/break on falsy return. Partial-payment states silently possible. Retry/rollback logic needed.

## Achievement Mint Payment
- Free mints: 0 QF (use banked credits from `wallet_stats.free_mints_banked`)
- Standard: 100 QF, Premium: 200 QF, Elite: 500 QF
- Every 5th paid mint banks 1 free; every 10th banks 2
- `splitFee()` called on each paid mint → 5% burn, 95% team, atomic

## Stripe (Academy — Phase 1 live)
- Payment Links + localStorage
- `mw_access_SLUG` per course, `mw_access_all` for All Access
- Upgrade credit: server-side spend calculation, Stripe coupon generation, auto-applied via `?prefilled_promo_code=CODE`
- Worker: `api.mathswins.co.uk` (Cloudflare Worker `mathswins-restore`)
- Phase 3 (future): QF token payments via Academy.sol
