# Escrow Accounting

Single escrow/minter wallet — `0x26b4A4115D184837530a42B34B945D5d1d2aa67e` — receives inbound payments and signs outbound refunds, prize payouts, QFSettlement `splitFee`/`settle` calls, and achievement NFT mints. Key at `/home/jon/mathswins-dapp/data/escrow.key` on Box 1. Loaded via `escrow.mjs:initEscrow()` at server startup and by every out-of-process operational script.

## Ledger table — `escrow_ledger`

```
id           INTEGER PRIMARY KEY AUTOINCREMENT
direction    TEXT NOT NULL        -- 'in' | 'out'
type         TEXT NOT NULL        -- stake-create | stake-accept | leaderboard-fee |
                                  --   mint-fee | refund | team | burn | prize | team-sweep
amount_qf    REAL NOT NULL
recipient    TEXT
sender       TEXT
tx_hash      TEXT
source       TEXT                 -- 'league' | 'duel' | 'mint' | 'leaderboard' | ...
reference_id TEXT                 -- league_id | duel_id | achievement_id | ...
created_at   INTEGER NOT NULL
inferred     INTEGER DEFAULT 0    -- 1 if retro-filled by a maintenance script
```

**Writer contract — `sendQF(to, amount, ctx)`:** only logs a row when `ctx` is passed. Scripts invoking `sendQF` must pass `{ type, source, referenceId }` or the write goes unrecorded. One known retro-fill exists (ledger row id=1, inferred=1, for the 250 QF league refund on 2026-04-19 that was sent via a pre-fix `retry-refund.mjs` without ctx).

## Obligations model — what the escrow balance must always cover

Escrow balance must be ≥ `obligations + 100 QF buffer` at all times. Obligations are the three categories of funds that users have paid in but not yet had returned or distributed:

| Obligation | Query | Notes |
|---|---|---|
| Active league pots | `SELECT COALESCE(SUM(total_pot),0) FROM leagues WHERE status IN ('registration','active')` | `total_pot` is rewritten on every call to `recalculateLeaguePot(leagueId)` as `SUM(amount_paid) FROM league_players WHERE refunded = 0` — single source of truth across all league stages (see `routes/api.mjs`). Builder joins record `amount_paid = 0`. |
| Duel stakes held | `duels` rows in `status IN ('created','accepted')` where `creator_tx IS NOT NULL` or `acceptor_tx IS NOT NULL`; plus `status = 'expired'` rows that haven't been refunded yet | Each tx_hash represents one stake. If both parties paid, obligation = 2 × stake. |
| Pending/failed league refunds | `SELECT SUM(amount_qf) FROM league_refunds WHERE status IN ('pending','failed')` | Retried automatically in the 2-minute `checkLeagueLifecycles` tick. |

## Duel refund tracking — `duel_refunds`

Mirrors `league_refunds`. Added 2026-04-19 after a silent-failure case where `sendQF` returned `null` from an RPC hiccup but `server.mjs` didn't check the return value — `expireOldDuels` had already flipped the duel to `status='expired'`, so the `WHERE status IN ('created','accepted')` filter on the next sweep excluded it forever. 25 QF orphaned until manually recovered.

```
id            INTEGER PRIMARY KEY AUTOINCREMENT
duel_id       TEXT NOT NULL
wallet        TEXT NOT NULL
role          TEXT NOT NULL          -- 'creator' | 'opponent'
amount_qf     REAL NOT NULL
status        TEXT NOT NULL          -- 'pending' | 'sent' | 'failed'
tx_hash       TEXT
attempted_at  INTEGER
sent_at       INTEGER
failed_reason TEXT
created_at    INTEGER NOT NULL
UNIQUE(duel_id, wallet)
```

Expiry sweep in `server.mjs` now:
1. Inserts `pending` rows up-front (intent persisted even if the server crashes mid-refund).
2. Calls `refundDuel(wallet, amount, duel_id)` — 3rd arg is the `referenceId` that lands in `escrow_ledger`.
3. On `sendQF` success → `UPDATE duel_refunds SET status='sent', tx_hash=?, sent_at=?`.
4. On `null` return or throw → `UPDATE duel_refunds SET status='failed', failed_reason=?` — retried on the next 5-minute tick (60s debounce).

**Standing pattern for every new `sendQF` caller:** treat `null` return as a recoverable failure. Write a tracking row before calling, update its status based on the actual return value, never log success unconditionally.

## Sweep script — `scripts/escrow-sweep.mjs`

Manual excess-to-team sweep. Computes obligations, adds the 100 QF buffer, sends anything above that to `TEAM_WALLET`. Defaults to dry-run; `--execute` required to send. `--buffer N` overrides the default.

Three-way match when classifying expired duels as refunded-or-not (prevents double-counting):
1. **Direct `reference_id` link** — ledger row with `reference_id = duel_id`.
2. **`duel_refunds` row in `sent` state** — parallel tracking via the new table.
3. **Heuristic fallback** — orphan (null-ref_id) ledger row with matching `recipient`, `amount_qf`, and `created_at` within `[expires_at − 60s, expires_at + 600s]`. Greedy-earliest pairing; each orphan row consumed by at most one duel. Kept as a defensive no-op; all current rows have reference_ids after the 2026-04-19 backfill.

**Recipient is pinned** — sweep only ever sends to the env-configured `TEAM_WALLET`. No arbitrary addresses.

## Operational scripts (admin HTTP is 403 without ADMIN_SECRET/ADMIN_WALLETS)

- `scripts/escrow-sweep.mjs` — commitment-aware team sweep (dry-run default).
- `scripts/cancel-league.mjs <leagueId> "<reason>"` — mirrors `POST /admin/league/:leagueId/cancel`.
- `scripts/retry-refund.mjs <leagueId> <wallet>` — retries a single `failed` league refund. Now passes `ctx` to `sendQF` so the retry lands in the ledger.
- `scripts/one-shot-duel-refund.mjs <duelId> <wallet> <amountQF>` — for out-of-band duel refund recovery (shouldn't be needed under the new tracking model, but kept as a backstop).
- `scripts/mint-achievement.mjs <achievement_id> <wallet>` — direct achievement NFT mint. Requires `ACHIEVEMENT_CONTRACT=0x… node scripts/…` when run outside PM2's inherited env.

## Reconciliation on 2026-04-19

- Retro-filled ledger row for a 250 QF league refund (inferred=1, reference_id of cancelled sudoku-duel silver league).
- Backfilled `reference_id` on two April 14 duel refund ledger rows (rows id=3, id=4) to the correct duel IDs.
- Sent 25 QF to `0x08baa2…70C3` for duel `94e7842d-bf1d…` that had been logged as refunded but never hit chain (RPC failure during April 13 sweep, no retry). New ledger row id=42 with proper reference_id.
- Sweep executed post-reconciliation: 100.895728 QF to TEAM_WALLET. Escrow now reads exactly `obligations + 100` with zero drift — the clean baseline from which future drift is immediately visible.
