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

## 2026-04-19 audit — 36 description corrections

Full 164-row catalogue was reviewed row-by-row. 36 rows carried factual errors, wrong thresholds, or off-tone copy relative to the rest of the catalogue. Exact replacements agreed and shipped as a single idempotent migration.

**Migration file:** `docs/migrations/20260419-achievement-descriptions.sql` — one transaction, 36 UPDATEs keyed by `achievement_id` PRIMARY KEY (each affects exactly 1 row). Applied to Box 1 and committed in `7b6dc9c`.

Categories of change:

**Spend-threshold pinning (loyalty):**
- `skin-in-the-game` → "Spent 1,000 QF on the platform."
- `true-believer` → "Spent 10,000 QF on the platform."

**League volume pinning (milestones):**
- `committed` → 10 leagues
- `dedicated` → 50 leagues
- `legend` → 500 leagues
- `dominant` → 25 league wins
- `specialist` → 10 leagues on a single game
- `master-of-one` → 3 league wins on a single game

**Duel volume pinning:**
- `duelist` → 10 duels
- `gladiator` → 50 duels
- `the-wall` → 10 consecutive duel wins without a loss

**Battleships series (all numeric thresholds):**
- `scatter-gun` → fired on 50% of the grid without a hit
- `do-you-even-aim-bro` → fired on 75% of the grid without a hit
- `sub-hunter` → sunk 100 submarines
- `carrier-supremacy` → 100 games with carrier alive
- `the-admiral` → 50 wins
- `unsinkable` → 10 consecutive wins without losing the battleship

**Mathematical constants — exact pinned scores:**
- `pi` → 3,141 · `euler` → 2,718 · `golden-ratio` → 1,618 · `root-two` → 1,414 · `root-three` → 1,732

**Meta/collection achievements — explicit set descriptions:**
- `the-grandmaster` → "Held The Completionist, The Contrarian, and Shadow Legend simultaneously."
- `the-wolf-pack` → "Held The Wolf, Sub Hunter, and Carrier Supremacy simultaneously."
- `the-mathematicians-collection` → "Held all five mathematical constant achievement NFTs simultaneously."
- `immaculate` → "Held all eight purity achievement NFTs simultaneously."

**Game-specific factual corrections:**
- `crib-master`, `all-pairs`, `dead-mans-hand` (poker-patience detail)
- `the-archaeologist`, `kings-ransom`, `pharaohs-curse`, `curse-of-the-mummy`, `tutankhamun` (pyramid mechanics)
- `lucky-number` → FreeCell deal 7,777
- `next-in-line` → 10 sequence-solver puzzles without a wrong answer

This audit supersedes the earlier "no exact thresholds" guideline for the cases above — Jon's call on a row-by-row basis to expose numbers where they make the achievement *aspirational* rather than *grindable-and-trivial*. Tone rules at the top of this doc still apply to any new entries.

## Related

- `docs/achievement-system.md` — full registry structure, mint mechanics, categories, tier costs.
- `docs/achievement-audit-2026-04-17.md` — earlier orphan/wiring audit.
- `docs/migrations/20260419-achievement-descriptions.sql` — the 36-row fix.
