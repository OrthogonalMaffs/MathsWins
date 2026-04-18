-- 20260418 — Achievement registry tier name and mint fee corrections
--
-- Problem: batch insert populated tier strings ('obsidian', 'meta') not in spec,
-- and 22 standard-tier rows had mint_fee_qf=200 instead of the spec'd 100.
-- Spec: docs/achievement-system.md — Free 0 / Standard 100 / Premium 200 / Elite 500 / Manual reward
--
-- Applied to /home/jon/mathswins-dapp/data/mathswins.db on Box 1
-- DB backup: mathswins.db.pre-tier-fix.20260418-082930
--
-- Pre/post row counts verified — see commit message for the run output.
-- 22 standard@200 → standard@100, 1 immaculate obsidian → elite (fee already 500),
-- 5 obsidian/meta → premium (fees already 200).
-- onlyfans-qf row left untouched (manual / 200) — pricing semantics for manual
-- tier still TBD.

BEGIN TRANSACTION;

UPDATE achievement_registry
   SET mint_fee_qf = 100
 WHERE tier = 'standard' AND mint_fee_qf = 200;
-- Expected: 22 rows changed.

UPDATE achievement_registry
   SET tier = 'elite'
 WHERE achievement_id = 'immaculate';
-- Expected: 1 row changed. mint_fee_qf already 500 (matches elite).

UPDATE achievement_registry
   SET tier = 'premium'
 WHERE achievement_id IN (
   'pioneer-hunter',
   'the-whale',
   'dominant',
   'legend',
   'the-completionist'
 );
-- Expected: 5 rows changed. mint_fee_qf already 200 (matches premium).

COMMIT;

-- Post-conditions:
--   * 0 rows with tier='obsidian' OR tier='meta'
--   * 0 rows with tier='standard' AND mint_fee_qf=200
--   * onlyfans-qf still tier='manual', mint_fee_qf=200 (untouched)
