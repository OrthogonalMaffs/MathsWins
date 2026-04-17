# Achievement Condition Audit — 2026-04-17

Read-only audit of `dapp-backend/src/achievement-checker.mjs` and its calling paths. Produced for handover across a `/clear`. No code changes accompanied this audit.

## Context

Two specific bugs triggered the audit:
1. **Wrong Answer Streak** fired after only 2 correct answers (reported by Jon).
2. **Lucky Number** did not fire after Jon completed FreeCell deal 7777.

Findings below are the result of inline verification (grep + Read against every claimed orphan and every call site), NOT pattern-matching heuristics. An earlier agent-driven pass produced a ~67-item list that misclassified functions like `checkMidnight` and `checkFibonacci` as orphans when they are in fact invoked. This document supersedes that pass.

---

## 1. Registry Reconciliation

| Count | Value |
|---|---|
| Total rows in `achievement_registry` | **163** |
| Active (`active = 1`) | **162** |
| Inactive (`active = 0`) | **1** (`speed-reader`) |

**CLAUDE.md previously said "161 achievements".** The +2 are `regicide` and `detention`, added in commit `827c623` ("Add Regicide + Detention achievements and fix settlement pot calculation"). CLAUDE.md has not been updated since.

`speed-reader` is retired because 52-dle only has 6 guesses (per existing CLAUDE.md note).

---

## 2. Call-Site Inventory

### Imports from `achievement-checker.mjs` (three files)

| File | Functions imported |
|---|---|
| `routes/api.mjs:13` | `checkAchievements, checkContrarian, checkStreakAchievements, checkLeagueRegular, checkMonthlyAchievements, trackSpend, checkNightOwlSubmission, checkMinesweeperFreePlay, checkFlagEverything, checkBlindEye, checkSumOfAllFears, checkTheGrinder, checkMintMeta, checkDuelMaster, checkFlaglessAndWrong, checkMidnight, checkFibonacci, checkWrongAnswerStreak` |
| `league-settle.mjs:17` | `checkAchievements, checkShadowsAchievements, checkInsomniac, checkMonthlyAchievements, checkFreeCellLeague, checkKenKenLeague, checkNonogramLeague, checkKakuroLeague, checkSettlementBatch7, checkSlowBurnAndLastSlow, checkRegicideDetention` |
| `scoring.mjs:25` | `checkAchievements, checkMinesweeperFreePlay, checkFlagEverything, checkBlindEye, checkSumOfAllFears, checkWrongAnswerStreak, checkMidnight, checkFibonacci` |

Every imported function has at least one call site. There are **no pure import-but-never-invoked orphans at the function level**.

### Context-building paths (the two shapes that matter)

#### Path A: `buildAchContext()` — `scoring.mjs:411`
Used by `/session/evaluate` when a server-tracked session completes (i.e. games that called `/session/start`).

Populated context fields, sourced from live session state or evaluator result:

```
type: 'session_complete'
gameId, score, timeMs, won
mistakes      ← session.mistakes
hints         ← session.hintsUsed
undoCount     ← session.undoCount OR question.undoCount
moveCount     ← session.moveCount OR question.moveCount
difficulty    ← session.difficulty
finalScores   ← result.finalScores           (Poker Patience)
openingCards  ← session.questions[0].cards   (Poker Patience)
remaining     ← result.remaining             (Golf/Pyramid)
cleared       ← result.cleared               (Golf/Pyramid)
maxHandScore  ← session._maxHandScore        (Cribbage)
maxHandBreakdown ← session._maxHandBreakdown (Cribbage)
dealNumber    ← session.dealNumber           (FreeCell)
```

#### Path B: `/session/submit-freeplay` inline context — `routes/api.mjs:348-368`
Used for client-side-only games that never call `/session/start` (includes most free-play entries).

```js
{
  type: 'session_complete', gameId, score, timeMs,
  won: score > 0,
  mistakes: 0,         // HARDCODED
  hints: 0,            // HARDCODED
  undoCount: 0,        // HARDCODED
  moveCount: 0,        // HARDCODED
  finalScores: null,   // HARDCODED
  openingCards: null,  // HARDCODED
  remaining: null,     // HARDCODED
  cleared: null,       // HARDCODED
  maxHandScore: 0,     // HARDCODED
  maxHandBreakdown: null, // HARDCODED
  freePlay: true, pbBeaten
  // dealNumber: FIELD ABSENT
}
```

**Any condition reading any HARDCODED field or the missing `dealNumber` cannot fire via Path B.**

#### Path C: League settlement — `league-settle.mjs`
Uses DB-sourced context (league_scores rows, leaderboard positions, per-player stats from wallet_stats). Rich context. Not the source of problems in this audit.

### Auxiliary direct-award sites (outside `checkAchievements`)

| Location | Achievement |
|---|---|
| `routes/api.mjs:1076` | `founding-member` (on league join within window) |
| `routes/api.mjs:2228` | `immaculate` (at mint time — super) |
| `routes/api.mjs:2239` | `the-wolf-pack` (at mint time — super) |
| `routes/api.mjs:2275` | `/admin/achievement/award` (manual, any id) |
| `scoring.mjs:482` | `the-marathon` |
| `games/sudoku-duel.mjs:213` | `six-seven` |

---

## 3. DEFINITELY BROKEN — 18 Structural Orphans

Achievements present in `achievement_registry` with `active = 1` but no code path awards them (verified by grep across all `.mjs` files in `dapp-backend/src/`).

| Category | Count | IDs | Fix direction |
|---|---|---|---|
| By design / manual | 2 | `boom`, `onlyfans-qf` | Expected; `boom` impossible per spec, `onlyfans-qf` manual-only |
| Super-achievements needing meta logic | 2 | `the-grandmaster`, `the-mathematicians-collection` | Add code to award when prerequisite set completed |
| Parked per CLAUDE.md | 3 | `all-wrong`, `full-hints`, `the-novelist` | Already documented as deferred (per-cell data / variable max / no server evaluator) |
| Free-game — frontend-stats-needed | 10 | `binary-decision`, `clairvoyant`, `dead-reckoning`, `feel-no-pressure`, `next-in-line`, `on-the-nose`, `photographic`, `the-engineer`, `unbeatable`, `wordy` | Frontend must forward per-game stats in `/session/submit-freeplay` payload; server context must accept them |
| Comeback | 1 | `zero-to-hero` | Condition check needs writing (detect loss-streak → win) |

**Total: 18.**

---

## 4. LIKELY BROKEN — Context-Hardcoded Conditions (Count Not Fully Enumerated)

The audit's STOP-IF threshold (>40 broken) was tripped before individual enumeration of every context-reading condition. An estimate of 20-30 additional conditions fall into the following pattern:

**Problem:** `checkAchievements` contains inline conditions reading `context.mistakes`, `context.hints`, `context.undoCount`, `context.moveCount`, `context.finalScores`, `context.openingCards`, `context.remaining`, `context.cleared`, `context.maxHandScore`, `context.maxHandBreakdown`, `context.dealNumber`. Path B (free-play submit) hardcodes all these to `0`/`null` or omits them entirely.

**Consequence:** Every condition reading any such field fails silently when invoked from free-play. These conditions CAN fire from Path A (evaluate) or Path C (league settlement) where the fields are populated.

**Confirmed broken from free-play:**
- `lucky-number` — reads `context.dealNumber === 7777`. FreeCell free-play is client-side-only (never calls `/session/start`), so only Path B applies. `dealNumber` not in Path B context. Cannot fire.
- `the-undo-king` — reads `context.undoCount >= 100`. Hardcoded to 0 in Path B. Cannot fire via free-play.

**Suspected:** achievements reading `finalScores`/`openingCards` (Poker Patience), `remaining`/`cleared` (Golf/Pyramid), `maxHandScore`/`maxHandBreakdown` (Cribbage), `mistakes`/`hints` (Sudoku/KenKen/Kakuro/Nonogram/Minesweeper free-play). Exact enumeration deferred.

---

## 5. Code-to-Registry Anomalies

Two achievement IDs are awarded in code but not present in the registry:

| Code line | Awarded id | Registry has | Status |
|---|---|---|---|
| `achievement-checker.mjs:679` | `the-mathematician` (score === 3141) | only `the-mathematicians-collection` exists | Silent drift — award INSERT succeeds (no FK), but no teaser/mint UI. Possible typo: should be `the-mathematicians-collection`, or a new entry is needed |
| `achievement-checker.mjs:689` | `speedrun-to-zero` (sudoku-duel score === 0) | not present | Needs registry entry or code removal |

`tortoise-slowest-win` also appears via `setGlobalRecord(...)` but that's a `global_records` key, not an `achievement_id`. Not an anomaly.

---

## 6. Wrong Answer Streak — Diagnosis Outcome

Reported symptom: achievement fired after 2 correct answers.

Code review conclusion: **code is structurally correct.** Function at `achievement-checker.mjs:1478` only awards inside the `!correct` branch. Correct answers reset the counter via `resetWalletCounter`.

**Most likely explanation:** `wallet_stats.prime_wrong_streak` persists across sessions. Evidence: wallet `0x08baa2…` currently holds `prime_wrong_streak=20` despite earning the achievement days ago. Also note: `evaluator` in `prime-or-composite.mjs:62` counts timeouts (`elapsedMs > 5000`) as wrong answers. Accumulated timeouts from idle tabs could push a lifetime counter past the threshold silently.

**Spec decision (2026-04-17): lifetime counter is defensible, confirmed behaviour not bug.**

---

## 7. Headline Numbers

| Bucket | Count |
|---|---|
| DEFINITELY BROKEN (structural orphans) | **18** |
| LIKELY BROKEN (context-hardcoded, unenumerated) | ~20-30 estimated |
| CLEAN (awarded and fireable from ≥1 path) | ≥114 |
| Code-to-registry typo anomalies | **2** (`the-mathematician`, `speedrun-to-zero`) |
| Registry discrepancy vs CLAUDE.md | **+2** (`regicide`, `detention` from commit 827c623) |

---

## 8. Open Questions for Next Session

1. **Enumerate LIKELY BROKEN precisely** — walk every `context.X` reference and tick off which ones have Path-A-only coverage vs Path-B (free-play) coverage.
2. **Decide strategy on 18 orphans** — retire via `active=0` vs implement vs defer. Some (`boom`, `onlyfans-qf`) are already-intended. Others need either code or a registry-strip.
3. **Fix submit-freeplay context shape + frontend** — the free-play game clients need to forward per-game state; the server context needs to accept it. Major frontend+backend change; should be scoped separately.
4. **Resolve `the-mathematician` / `speedrun-to-zero` anomalies** — add registry entries or remove the code.
5. **Independent issues to track** (outside achievement-checker.mjs):
   - FreeCell auto-complete does not trigger when all tableau columns sort descending by suit and foundations reach 8s (per Jon).
   - FreeCell UNDO button greys out mid-game — investigation pending.
   - Flag Everything achievement is structurally impossible under Minesweeper first-click-safety rule. Retire or rewrite condition.
   - League settlement payout (`doSettleLeague` Step 4 at `league-settle.mjs:186-198`) is NOT atomic — `sendQF` loop continues on falsy return, `paid_at` updates are per-prize. Partial-payment silent failures possible. Needs retry or rollback logic.
   - Test-activity exclusion rule (stated in project doc v8 and CLAUDE.md as "test sessions excluded from all achievement and record tracking") is **NOT enforced anywhere in `achievement-checker.mjs` or `league-settle.mjs`**. `BUILDER_WALLETS` currently only bypasses payment, not achievement/record writes. This is a separate architectural fix, outside the scope of this audit.
