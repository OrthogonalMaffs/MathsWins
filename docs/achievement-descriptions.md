# Achievement Descriptions

## Schema

`achievement_registry.description TEXT` — added 2026-04-18 via idempotent ALTER in `db/index.mjs`. All 164 active rows populated at seed-loop time from the `ACHIEVEMENT_DESCRIPTIONS` map in `db/index.mjs`; the loop fills description WHERE NULL so re-running is safe and a manual override (via direct SQL) won't be clobbered on restart. Bug Hunter (the 164th active achievement) is also covered by the same map despite being inserted into the DB directly rather than via the seed array.

Count as of 2026-04-19:
- **164 total rows** (includes retired `speed-reader`)
- **164 rows have a description** (0 NULL)
- **163 active** (`active=1`), 1 retired

## Reveal policy — earned-card only

The description is returned from `GET /achievements/my` only — the wallet-scoped "what I've earned" endpoint. The catalogue endpoint (`GET /achievements/all`) and the teaser page at `/qf-dapp/achievements/` stay opaque — they return names only. Rationale: preserves the "some impossible, most secret" framing for undiscovered achievements while giving players a clear "earned for" line on the ones they already hold.

Implementation: `getWalletAchievements` in `db/index.mjs` does `SELECT e.*, r.name, r.mint_fee_qf, r.description FROM achievement_eligibility e LEFT JOIN achievement_registry r ON e.achievement_id = r.achievement_id`. No public catalogue query includes `description`.

## Copy rules (baked into the map itself)

- One sentence per achievement.
- Past tense — says what the player *did*, not what the condition *was*.
- No exact thresholds where grinding the exact number would trivialise the achievement (e.g. "100 leagues" wording becomes "stayed in the leagues long past the point most players drop off").
- Specifics kept where they describe a skill moment, not a grindable count: "Built a Royal Flush", "in three guesses or fewer", "on Pi Day".
- Bug Hunter is slightly warmer than the rest — manually awarded, so the copy can acknowledge intent: *"Found and reported something that made the platform better."*

Tone approved by Jon after a 5-row sample on 2026-04-18 before the full 164 were populated.

## Rendering — `qf-dapp/my-account/index.html`

Earned-card layout shows the description beneath the name, in a smaller muted typeface:

```
<div class="ach-name">{name}</div>
<div class="ach-desc">Earned for: {description}</div>
<div class="ach-date">Earned {date}</div>
```

`.ach-desc` CSS: `font-family: 'Inter', sans-serif; font-size: .6rem; color: var(--silver); line-height: 1.35`. Conditional — only rendered when `a.description` is present (defensive guard; should always be present post-seed).

## Bug Hunter

- `achievement_id = 'bug-hunter'`, `tier = 'free'`, `mint_fee_qf = 0`, `category = 'community'`.
- Description: **"Found and reported something that made the platform better."**
- Awarded manually via `POST /admin/achievement/award { wallet, achievement_id: 'bug-hunter' }`.
- Not in the `ACHIEVEMENTS` seed array at `db/index.mjs:231` — inserted directly into the DB at launch prep. The description map covers it so re-seeds of the description loop still populate it correctly.

## Adding a new achievement description

1. Add the `id: 'description'` entry to `ACHIEVEMENT_DESCRIPTIONS` in `db/index.mjs`.
2. On next PM2 restart, the seed loop runs `UPDATE achievement_registry SET description = ? WHERE achievement_id = ? AND description IS NULL`.
3. If you need to overwrite an existing description, do it via manual `UPDATE` on Box 1 (the seed loop never overwrites non-NULL descriptions).
4. Follow the tone rules above. A 5-row sample before populating the rest is Jon's established pre-flight check.

## Related

- `docs/achievement-system.md` — full registry structure, mint mechanics, categories, tier costs.
- `docs/achievement-audit-2026-04-17.md` — earlier orphan/wiring audit.
