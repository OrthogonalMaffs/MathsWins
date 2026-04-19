# Minesweeper — Scoring Formula

**File:** `dapp-backend/src/games/minesweeper.mjs`

## Current formula (since 2026-04-19)

```js
score = Math.round(BASE × T / (T + elapsedSeconds))
```

- `BASE` is the per-difficulty ceiling (score at `t = 0`).
- `T` is the per-difficulty "target" (score = `BASE/2` at `t = T`, asymptotic to 0 after).
- `elapsedSeconds` = `elapsedMs / 1000`.

### Per-difficulty constants — `SCORING` in `minesweeper.mjs`

| Difficulty    | BASE  | T (target s) | Score at 0s | Score at T (half-life) | Mines / board      |
|---------------|-------|--------------|-------------|------------------------|---------------------|
| beginner      | 2500  | 15           | 2500        | 1250                   | 10 mines / 9×9      |
| pocket        | 3000  | 20           | 3000        | 1500                   | 20 mines / 12×12    |
| intermediate  | 5000  | 45           | 5000        | 2500                   | 40 mines / 16×16    |
| advanced      | 7500  | 90           | 7500        | 3750                   | 65 mines / 18×18    (Silver league only — not in free play) |
| expert        | 10000 | 120          | 10000       | 5000                   | 99 mines / 30×16    |

### Sample reference points

| Input            | Output |
|------------------|--------|
| Beginner 0s      | 2500   |
| Beginner 15s     | 1250   |
| Beginner 30s     | 833    |
| Beginner 5s      | 1875   |
| Expert 120s      | 5000   |
| Expert 60s       | 6667   |
| Intermediate 45s | 2500   |

### Helper — `calculateWinScore(difficulty, elapsedMs)`

Defined in `minesweeper.mjs` alongside the `SCORING` constant. Called from all 4 win paths (placement, click, chord, flag-win). Defaults to `SCORING.beginner` if `difficulty` is missing or unknown — matches `selectQuestions` default at the bank level.

### `stripQuestion` metadata

The question object sent to the client now carries `scoring: SCORING[difficulty]` (i.e. `{base, t}`) so the client can surface "half-score at X seconds" or similar hints if desired.

## Detonation / loss path — unchanged

```
score = -(totalSafeCells - revealedSafeCells)
```

Negative score scaled by how much of the board was left. Not affected by the scoring-formula change.

## Why the old formula was replaced

**Old:** `score = max(0, round(5000 - elapsedSeconds))`

Problems:
- One point per second across every difficulty — pocket (12×12, 20 mines) and expert (30×16, 99 mines) shared the same ceiling.
- Top 30 seconds across any difficulty all landed in a 30-point band (4970–5000). Leaderboards for easy-tier games filled with 4990s, making rank-climbing meaningless and killing entry-volume from new players.
- No incentive to play harder boards — a fast beginner run scored equal or better than a slow expert run.

**New curve properties:**
- Harder boards earn higher ceilings (10000 expert vs 2500 beginner), so a solid expert run out-scores a near-perfect beginner run.
- Asymptotic shape (`BASE/(1 + t/T)`) means top-end compression happens naturally only for *elite* speedrunners, not for every casual sub-30s solve.
- Tiebreaker is `time_ms ASC` (existing leaderboard sort), so same-score tiebreaks still reward speed — the score-update endpoint lets a faster player pay 50 QF to inch above a tied-but-slower entry.

## Deployment notes

- Before the new formula went live, all pre-existing minesweeper rows were wiped from both `global_leaderboard_entries` and `personal_bests` (per `feedback_scoring-change-wipe-rows.md`). Mixing old-formula scores with new-formula scores on the same leaderboard is unfair — wipe first, then ship.
- Per-difficulty ceilings mean the leaderboard across difficulties sorts on raw score — but the frontend shows one leaderboard per difficulty (minesweeper popout has per-difficulty tabs) so cross-difficulty comparison isn't user-visible by default.

## How-to-Play copy

The in-game "How to Play & Scoring" section at `qf-dapp/games/minesweeper/index.html` describes the behaviour without leaking the `(BASE, T)` constants:

> **Scoring:** Points awarded based on difficulty and completion time. Harder boards earn higher scores. Faster completions score more — but improvement always counts. Detonation = game over (0 pts).

Updated 2026-04-19 (commit `d564162`) after the formula swap — prior copy still advertised the retired `5000 − 1pt/sec` rule. Keep constants out of player-facing copy — leaderboard behaviour reveals the shape without needing the numbers exposed.
