# MathsWins Sports Betting Maths — Expansion Specification

**Modules 9–16: Advanced & Master Tier Content**
**Date:** 15 March 2026
**Status:** Full build specification — ready for implementation
**Prepared for:** Jon

---

## Overview

The current Sports Betting Maths has 8 modules covering foundations: odds formats, implied probability, bookmaker overround, value identification, accumulator mathematics, and basic market analysis. This expansion adds 8 new modules taking the total to 16, with 120+ new scenarios and 8 interactive tools.

The expansion transforms Sports Betting Maths from a solid introduction into the most comprehensive mathematical betting education available in the UK. The target audience is the punter who already knows how to place a bet but doesn't understand *why* the maths is against them — and, crucially, what the small number of profitable bettors do differently.

**Key principle throughout:** We're not teaching people how to win. We're teaching the mathematics of why most people lose, and what the numbers say about the rare conditions under which an edge exists. Every module reinforces the same message: the bookmaker has a mathematical advantage, and understanding that advantage is the first step to not being destroyed by it.

---

## Updated Tier Mapping

| Tier | Modules | Price | Content |
|------|---------|-------|---------|
| Free taster | M1 only | £0 | How odds work — the foundation |
| Basic | M1–M5 | £6.99 | Foundations — odds, probability, overround, value, accumulators |
| Advanced | M1–M11 | £12.99 | + Applied markets — Asian handicaps, HT/FT, Poisson, in-play |
| Master | M1–M16 | £17.99 | + Complete — mistakes, discipline, free bets, exchanges, Kelly review |

The new modules split: M9–M11 complete the Advanced tier with applied market mathematics. M12–M16 form the Master tier with behavioural mathematics, discipline, free bet extraction, exchange maths, and a comprehensive Kelly/bankroll module specific to betting.

---

## Updated Stats Bar

| Stat | Value | Label |
|------|-------|-------|
| 16 | Modules | Foundations → Mastery |
| 160+ | Scenarios | Interactive decision training |
| 8 | Tools | Built-in calculators |
| 95% | Lose long-term | The number that matters |

---

## Existing Modules (1–8) — Summary

For reference, the current 8 modules cover:

| # | Title | Key content |
|---|-------|-------------|
| 1 | How Odds Work | Decimal, fractional, American formats. Converting between them. |
| 2 | Implied Probability | Extracting probability from odds. Why 2.00 doesn't mean 50%. |
| 3 | Bookmaker Overround | How the book is built. Calculating vig/juice on any market. |
| 4 | Value Betting | Expected value formula. When a bet is +EV. Why most bets aren't. |
| 5 | Accumulator Mathematics | Why accas multiply the overround. The combinatorial trap. |
| 6 | Market Analysis | Reading odds movements. Steam moves vs line value. |
| 7 | Staking & Bankroll Basics | Flat staking, percentage staking. Basic bankroll management. |
| 8 | Putting It Together | Multi-market analysis exercise. Building a betting approach. |

---

## Module 9: Asian Handicap Mathematics

**Tier:** Advanced
**Accent:** #2563eb (blue)
**Scenarios:** 20
**Prerequisites:** Modules 1–4

### Why this module exists

Asian handicaps are mathematically superior to traditional 1X2 markets for one reason: they eliminate the draw. By removing a third outcome, the overround drops significantly. A typical 1X2 football market carries 5–8% overround; the equivalent Asian handicap market often carries 2–4%. For a bettor looking for value, this is the single most important market to understand.

But the maths is confusing. Quarter-goal lines, split stakes, half-win/half-loss outcomes — most punters avoid Asian handicaps because they don't understand the mechanics. This module fixes that with pure mathematics.

### Tutorial content

**Section 1: Why Asian handicaps exist — the mathematics of removing the draw**

`.mb` box:
```
Traditional 1X2 market: Arsenal vs Crystal Palace
  Arsenal win: 1.50 (implied 66.7%)
  Draw: 4.20 (implied 23.8%)
  Crystal Palace win: 7.00 (implied 14.3%)
  Total implied probability: 104.8%
  Overround: 4.8%

Asian Handicap -1.5 market:
  Arsenal -1.5: 2.10 (implied 47.6%)
  Crystal Palace +1.5: 1.80 (implied 55.6%)
  Total implied probability: 103.2%
  Overround: 3.2%

Difference: 1.6 percentage points less overround.
Over 100 bets at £10/bet:
  1X2 expected loss: 100 × £10 × 4.8% = £48
  AH expected loss: 100 × £10 × 3.2% = £32
  Saving: £16 per 100 bets — just from choosing the right market.
```

`.pln` box: "Asian handicaps give the bookmaker a smaller margin on every bet. That's because with only two outcomes instead of three, there's less room to inflate the prices. Over hundreds of bets, this difference compounds into real money saved — or lost more slowly, depending on how you look at it."

**Section 2: Whole-goal handicaps (0, -1, -2)**

Explain the void/push condition. If Arsenal are -1 and win by exactly 1, the bet is void — your stake returns. This is the "insurance" that makes Asian handicaps unique.

`.mb` box:
```
Arsenal -1 Asian Handicap @ 1.95

Possible outcomes:
  Arsenal win by 2+: YOU WIN (paid at 1.95)
  Arsenal win by exactly 1: VOID (stake returned)
  Draw or Crystal Palace win: YOU LOSE

Compare to Arsenal -1 European Handicap @ 2.20:
  Arsenal win by 2+: YOU WIN
  Arsenal win by exactly 1: DRAW (you lose on a 1X2 EH bet)
  Draw or Crystal Palace win: YOU LOSE

The AH gives you a safety net at the cost of slightly lower odds.
```

**Section 3: Half-goal handicaps (-0.5, -1.5, -2.5)**

No void possible — clean win or loss. These are mathematically simplest.

`.mb` box:
```
Arsenal -1.5 @ 2.10

Win condition: Arsenal win by 2 or more goals
Lose condition: Arsenal win by 0 or 1, draw, or lose

This is identical to "Arsenal to win by 2+" in a correct score market,
but typically at better odds because:
  AH overround ≈ 3%
  Correct score overround ≈ 15-25%

Same bet. Better price. The maths is clear.
```

**Section 4: Quarter-goal handicaps — the split stake**

This is where most punters get confused. A -0.75 line (also written as -0.5, -1) means your stake is split equally across TWO bets: half on -0.5 and half on -1.0.

`.mb` box:
```
Arsenal -0.75 @ 1.95, stake £20

Your £20 is split:
  £10 on Arsenal -0.5 @ 1.95
  £10 on Arsenal -1.0 @ 1.95

Scenario 1: Arsenal win by 2+
  -0.5 bet wins: £10 × 1.95 = £19.50
  -1.0 bet wins: £10 × 1.95 = £19.50
  Total return: £39.00 (profit £19.00)
  → FULL WIN

Scenario 2: Arsenal win by exactly 1
  -0.5 bet wins: £10 × 1.95 = £19.50
  -1.0 bet voided: £10 returned
  Total return: £29.50 (profit £9.50)
  → HALF WIN

Scenario 3: Draw
  -0.5 bet loses: -£10
  -1.0 bet loses: -£10
  Total return: £0 (loss £20)
  → FULL LOSS

Scenario 4: Crystal Palace win
  Same as Scenario 3 → FULL LOSS
```

`.pln` box: "Quarter-goal lines are two bets in one. Your stake splits down the middle. If the result lands between the two lines (Arsenal win by exactly 1 in this case), you win one half and push the other. It's a halfway house between -0.5 and -1.0 — and the odds reflect that."

**Section 5: Line movement and value — when AH prices shift**

How to read Asian handicap line movements. If a line moves from -1.5 to -1.75, what does that tell you about where the money is flowing? And more importantly, does the price still offer value?

`.mb` box:
```
Opening line: Arsenal -1.5 @ 2.10 / Crystal Palace +1.5 @ 1.80
Money flows heavily on Arsenal →
New line: Arsenal -1.75 @ 2.05 / Crystal Palace +1.75 @ 1.85

What happened:
  The bookmaker moved the handicap wider to balance their book.
  They need to attract money on Crystal Palace +1.75 to offset
  the Arsenal liability.

Key question: Is Arsenal -1.75 @ 2.05 still value?

If your model says Arsenal win by 2+ goals 52% of the time
and win by exactly 2 goals 15% of the time:

  P(full win) = P(win by 3+) = 52% - 15% = 37%
  P(half win) = P(win by exactly 2) = 15%
  P(loss) = 100% - 52% = 48%

  EV = (0.37 × 1.05) + (0.15 × 0.525) + (0.48 × -1)
     = 0.389 + 0.079 - 0.48
     = -0.012

  EV = -1.2% → slight negative EV. The value has gone.

At the opening line of -1.5 @ 2.10:
  P(win) = 52%, P(loss) = 48%
  EV = (0.52 × 1.10) + (0.48 × -1) = 0.572 - 0.48 = +0.092
  EV = +9.2% → strong value.

The line moved 0.25 goals and the value disappeared entirely.
```

`.pln` box: "A quarter-goal line movement doesn't sound like much, but it can swing a bet from +9% expected value to -1%. This is why serious bettors track opening lines and act fast. By the time most punters see the odds, the value is already gone."

**Section 6: AH vs 1X2 — a complete comparison**

When to use Asian handicaps vs traditional markets. The mathematical rule: if the draw is a significant probability (>20%), AH markets offer better value because the overround is distributed across fewer outcomes.

### Interactive tool: Asian Handicap Calculator

**Inputs:**
- Handicap line (dropdown: 0, -0.25, -0.5, -0.75, -1, -1.25, -1.5, -1.75, -2, etc.)
- Odds offered
- Stake amount
- Your estimated probability of each goal difference (-3 to +3)

**Outputs:**
- Returns for every possible match outcome (listed by goal difference)
- Expected value of the bet given your probability estimates
- Comparison with equivalent 1X2 odds (if available)
- Overround comparison: AH market vs 1X2 market
- Visual: colour-coded goal difference chart showing WIN (green), HALF WIN (light green), VOID (grey), HALF LOSS (light red), LOSS (red)

### Scenarios (20)

8 basic (given a line and odds → what are the outcomes for each result?), 6 value assessment (given your probability model → is this AH bet +EV?), 4 line movement (opening line vs current line → has the value changed?), 2 AH vs 1X2 comparison (which market offers better maths?).

---

## Module 10: Half-Time/Full-Time & Conditional Probability

**Tier:** Advanced
**Accent:** #2563eb (blue)
**Scenarios:** 15
**Prerequisites:** Modules 1–4

### Why this module exists

HT/FT bets are among the most popular — and most overpriced — markets in football betting. The maths is conditional probability: P(A and B) = P(A) × P(B|A). Most punters don't understand that the probability of "draw at HT, home win at FT" requires the home team to score all their goals in the second half *and* concede none in the first. The combinatorics make this far less likely than intuition suggests.

### Tutorial content

**Section 1: Conditional probability — the foundation**

`.mb` box:
```
P(Draw at HT AND Home Win at FT) ≠ P(Draw) × P(Home Win)

Why not? Because the events aren't independent.
If it's 0-0 at half time, the second half starts from a specific state.
The home team must score AND the away team must not equalise.

Correct calculation:
P(HT draw) × P(Home win | HT was a draw)

Using Poisson model (λ_home = 1.5 goals/match, λ_away = 1.1):
  Per half: λ_home_half ≈ 0.75, λ_away_half ≈ 0.55

  P(0-0 at HT) = P(home scores 0 in 1st half) × P(away scores 0 in 1st half)
               = e^(-0.75) × e^(-0.55)
               = 0.472 × 0.577
               = 0.272 (27.2%)

  P(Home scores ≥1, Away scores 0 in 2nd half | starting 0-0):
    P(home ≥1 in 2nd half) = 1 - e^(-0.75) = 1 - 0.472 = 0.528
    P(away 0 in 2nd half) = e^(-0.55) = 0.577
    Combined: 0.528 × 0.577 = 0.305

  P(Draw/Home) = 0.272 × 0.305 = 0.083 (8.3%)

Typical bookmaker odds for Draw/Home: 5.50
Implied probability: 1/5.50 = 18.2%
Overround on this single outcome: 18.2% - 8.3% = 9.9%

The bookmaker is charging you nearly 10 percentage points
of overround on this one bet.
```

`.pln` box: "The Draw/Home Win HT/FT bet looks tempting at 5.50 — that's a big payout. But the maths says it should be closer to 12.0 (1/0.083). The bookmaker's price implies it happens 18% of the time. It actually happens about 8% of the time. That's a massive gap, and it's why HT/FT markets are so profitable for bookmakers."

**Section 2: The full HT/FT grid — 9 outcomes, 9 overrounds**

Build the complete 3×3 grid (Home/Draw/Away at HT × Home/Draw/Away at FT) and calculate the true probability of each using the Poisson model. Show the overround on each outcome.

`.mb` box:
```
HT/FT Grid — True probabilities vs bookmaker implied:

                        FT: Home    FT: Draw    FT: Away
HT: Home leading     |  25.1%    |   3.2%    |   1.4%   |
HT: Drawing          |   8.3%    |  12.8%    |   5.6%   |
HT: Away leading     |   1.8%    |   3.4%    |  10.2%   |

Total: ~71.8% (the remaining ~28.2% accounts for edge cases
in the Poisson model — this is approximate)

Typical bookmaker overround on HT/FT market: 15-25%
Compare to match result overround: 4-8%
Compare to Asian handicap overround: 2-4%

HT/FT is one of the worst-value markets available.
```

`.pln` box: "The HT/FT market has 9 possible outcomes instead of 3. More outcomes means more room for the bookmaker to hide margin. The total overround on a HT/FT market is typically 15-25% — that's three to five times worse than the match result market. The maths says: avoid it unless you have an extraordinarily strong view on the match tempo."

**Section 3: When HT/FT makes mathematical sense**

The rare situations where HT/FT can offer value: teams with extreme half-by-half scoring patterns, teams that consistently concede late, cup matches with known tactical approaches (park the bus first half, push second half).

**Section 4: Correct Score markets — the worst overround in football**

Extend the conditional probability analysis to correct score markets. Show why the overround is 20-40% and why these markets exist purely as entertainment bets.

**Section 5: Both Teams to Score (BTTS) — simpler conditional probability**

`.mb` box:
```
BTTS Yes probability using Poisson:

P(BTTS) = P(Home ≥1) × P(Away ≥1)
        = (1 - e^(-λ_home)) × (1 - e^(-λ_away))

With λ_home = 1.5, λ_away = 1.1:
  = (1 - 0.223) × (1 - 0.333)
  = 0.777 × 0.667
  = 0.518 (51.8%)

Fair odds: 1/0.518 = 1.93
Typical bookmaker odds: 1.80

Overround: 55.6% - 51.8% = 3.8%
(Much more reasonable than HT/FT or correct score)

BTTS is one of the fairer derivative markets because
it has only 2 outcomes.
```

`.pln` box: "BTTS markets have only two outcomes (yes or no), so the overround is similar to Asian handicaps — around 3-5%. If you're going to bet on derivative markets, BTTS is mathematically kinder than HT/FT or correct score. Still not great, but not terrible."

### Interactive tool: HT/FT Probability Calculator

**Inputs:**
- Home team expected goals per match
- Away team expected goals per match
- (Optional) First-half/second-half scoring ratio if known

**Outputs:**
- Complete 3×3 HT/FT probability grid
- Fair odds for each of the 9 outcomes
- Side-by-side comparison with bookmaker odds (if entered)
- Overround per outcome and total market overround
- BTTS probability and fair odds
- Correct score probabilities for most likely scores (0-0 through 4-3)

### Scenarios (15)

6 HT/FT value assessment (given team stats → is this HT/FT bet value?), 4 BTTS calculations (calculate probability from goal expectancies), 3 correct score analysis (why is this price so far from fair?), 2 multi-market comparison (which derivative market has the best maths?).

---

## Module 11: The Poisson Distribution — Modelling Football Goals

**Tier:** Advanced (final Advanced module)
**Accent:** #2563eb (blue)
**Scenarios:** 15
**Prerequisites:** Module 10 (conditional probability)

### Why this module exists

The Poisson distribution is the single most important mathematical model in football betting. It models the number of goals a team will score as a function of their average scoring rate. Every serious betting model starts here. Most bookmakers price their football markets using Poisson (or extensions of it) as the foundation.

This module teaches the model from first principles, shows how to use it to price any football market, and — critically — explains its limitations.

### Tutorial content

**Section 1: What the Poisson distribution is and why goals follow it**

`.mb` box:
```
The Poisson distribution gives the probability of k events
occurring in a fixed interval, given an average rate λ:

P(X = k) = (λ^k × e^(-λ)) / k!

For football goals:
  λ = expected goals for a team in a match
  k = actual number of goals scored

If Arsenal's expected goals = 1.8 per match:

  P(0 goals) = (1.8^0 × e^(-1.8)) / 0! = e^(-1.8) = 0.165 (16.5%)
  P(1 goal)  = (1.8^1 × e^(-1.8)) / 1! = 1.8 × 0.165 = 0.298 (29.8%)
  P(2 goals) = (1.8^2 × e^(-1.8)) / 2! = 3.24 × 0.165 / 2 = 0.268 (26.8%)
  P(3 goals) = (1.8^3 × e^(-1.8)) / 3! = 5.832 × 0.165 / 6 = 0.161 (16.1%)
  P(4 goals) = (1.8^4 × e^(-1.8)) / 4! = 0.072 (7.2%)
  P(5+ goals) = 1 - sum of above = 0.036 (3.6%)
```

`.pln` box: "The Poisson distribution says: if Arsenal average 1.8 goals per match, they'll score exactly 1 goal about 30% of the time, exactly 2 goals about 27% of the time, and blank entirely about 16.5% of the time. These aren't guesses — they're mathematical probabilities derived from the average rate."

**Section 2: Building a match model from Poisson**

`.mb` box:
```
To price a full match, you need TWO Poisson distributions:
one for each team.

Arsenal (home) expected goals: 1.8
Crystal Palace (away) expected goals: 0.9

Score probabilities (independent Poisson for each team):

P(Arsenal 2, Palace 0) = P(Ars=2) × P(Pal=0)
                       = 0.268 × 0.407
                       = 0.109 (10.9%)

Full score matrix (selected):
         Palace 0  Palace 1  Palace 2  Palace 3
Ars 0    0.067     0.060     0.027     0.008
Ars 1    0.121     0.109     0.049     0.015
Ars 2    0.109     0.098     0.044     0.013
Ars 3    0.065     0.059     0.027     0.008
Ars 4    0.029     0.027     0.012     0.004

From this matrix, derive any market:

P(Home win) = sum of all cells where Ars > Pal = 0.585 (58.5%)
P(Draw) = sum of diagonal = 0.067 + 0.109 + 0.044 + ... = 0.232 (23.2%)
P(Away win) = sum of all cells where Pal > Ars = 0.183 (18.3%)

Fair odds:
  Home: 1/0.585 = 1.71
  Draw: 1/0.232 = 4.31
  Away: 1/0.183 = 5.46
```

`.pln` box: "With just two numbers — each team's expected goals — you can price every market on the match. Home win, draw, away win, over/under, correct score, BTTS, Asian handicap — they all fall out of the same Poisson model. This is exactly what the bookmakers do, then they add their margin on top."

**Section 3: Over/Under markets from Poisson**

`.mb` box:
```
Total expected goals = 1.8 + 0.9 = 2.7

P(Under 2.5) = P(total goals ≤ 2)
             = P(0,0) + P(1,0) + P(0,1) + P(2,0) + P(1,1) + P(0,2)
             = 0.067 + 0.121 + 0.060 + 0.109 + 0.109 + 0.027
             = 0.493 (49.3%)

P(Over 2.5) = 1 - 0.493 = 0.507 (50.7%)

Fair odds: Over 2.5 @ 1.97, Under 2.5 @ 2.03

If the bookmaker offers Over 2.5 @ 2.10:
  Implied probability: 47.6%
  Your model: 50.7%
  Edge: 50.7% - 47.6% = 3.1%
  EV: (0.507 × 1.10) + (0.493 × -1) = 0.558 - 0.493 = +6.5%
```

**Section 4: Estimating expected goals — where the model gets its inputs**

How to estimate λ for each team. Historical scoring rates, home/away adjustments, league averages, xG (expected goals from underlying shot data). Acknowledge that the model is only as good as its inputs.

**Section 5: Limitations of Poisson — when the model breaks down**

`.dg` danger box: "Poisson assumes goals are independent events — scoring one goal doesn't affect the probability of scoring another. In reality, a team that goes 1-0 up may sit back and defend (reducing both teams' scoring rates), or a team that goes 1-0 down may push forward aggressively (increasing both). This correlation between the two teams' goal outputs is called covariance, and basic Poisson ignores it. More advanced models (bivariate Poisson, Dixon-Coles) address this, but basic Poisson gets you 80% of the way there."

### Interactive tool: Poisson Match Modeller

**Inputs:**
- Home team expected goals (λ_home)
- Away team expected goals (λ_away)

**Outputs:**
- Full score probability matrix (0-0 through 5-5)
- Match result probabilities (Home/Draw/Away) with fair odds
- Over/Under probabilities for 0.5, 1.5, 2.5, 3.5, 4.5
- BTTS probability
- Asian handicap probabilities for common lines
- Most likely correct scores (ranked)
- Input field for bookmaker odds → highlights +EV opportunities in green

### Scenarios (15)

5 model building (given team stats → calculate match probabilities), 5 market pricing (given probabilities → which market offers value?), 3 over/under analysis (calculate O/U probabilities for specific goal expectancies), 2 model limitation awareness (when should you NOT trust the Poisson output?).

---

## Module 12: The Mistakes the Average Punter Makes

**Tier:** Master
**Accent:** #2563eb (blue)
**Scenarios:** 15
**Prerequisites:** Modules 1–8

### Why this module exists

This is the module that holds up a mirror. Every common betting behaviour has a mathematical consequence, and almost every popular behaviour is -EV. This module quantifies the cost of each mistake with precise calculations. No judgement — just numbers.

### Tutorial content

**Section 1: The accumulator addiction — a mathematical autopsy**

`.mb` box:
```
The average UK punter's Saturday acca: 5 selections, each at ~2.00

Individual overround per selection: ~5%

Perceived probability of winning: (0.50)^5 = 3.1%
Fair odds: 1/0.031 = 32.0

Actual probability after overround: (0.50/1.05)^5 = (0.476)^5 = 2.44%
Bookmaker odds offered: ~25.0

Expected return per £1:
  P(win) × payout = 0.0244 × 25 = £0.61

Expected loss: £1 - £0.61 = £0.39 = 39% loss rate

On a 10-fold acca at 2.00 per leg:
  Fair probability: (0.50)^10 = 0.098%
  After overround: (0.476)^10 = 0.058%
  Expected return per £1 ≈ £0.37

A 10-fold acca loses 63p in every pound. Over a year of
£10 accas every Saturday: £10 × 52 × 0.63 = £328 lost.
```

`.pln` box: "Every leg you add to an accumulator multiplies the bookmaker's edge. A single bet at 5% overround costs you 5p per pound. A 5-fold costs 39p per pound. A 10-fold costs 63p per pound. The acca isn't a value bet — it's a lottery ticket with worse odds than the actual lottery."

**Section 2: The favourite-longshot bias — why short prices aren't safe**

`.mb` box:
```
Research across millions of bets shows a consistent pattern:

Odds range     | Implied prob | Actual win % | Overround
1.10–1.30      | 77-91%       | 79-89%       | 2-5%
1.50–2.00      | 50-67%       | 48-64%       | 3-6%
3.00–5.00      | 20-33%       | 18-29%       | 4-8%
10.00–20.00    | 5-10%        | 3-7%         | 6-15%
50.00+         | <2%          | <1%          | 10-40%

The pattern: the bigger the price, the worse the value.
Longshots are systematically overpriced relative to their
true probability. The bookmaker takes the largest margin
on the least likely outcomes.

Why? Because recreational punters love longshots.
They buy the dream. The bookmaker charges a premium for it.
```

`.pln` box: "Backing heavy favourites isn't safe — you still face 2-5% overround. But backing longshots is mathematically worse. The bookmaker's margin increases as the odds get bigger. The 100/1 shot isn't 100/1 against — it's more like 150/1 against. The dream price is the worst price."

**Section 3: "I'm due a winner" — the gambler's fallacy**

Prove mathematically that previous results don't affect future probabilities (for independent events). Show the calculation: if you've lost 10 bets in a row, the probability of losing the 11th is exactly the same as it was for the 1st.

**Section 4: Chasing losses — the exponential cost**

`.mb` box:
```
Starting bankroll: £500
Loss #1: £50 bet loses. Balance: £450.
"I'll win it back" → doubles stake.
Loss #2: £100 bet loses. Balance: £350.
Doubles again.
Loss #3: £200 bet loses. Balance: £150.
Can't double again (only £150 left).
Loss #4: £150 all-in. Loses. Balance: £0.

Total lost: £500 in 4 bets.
Time taken: perhaps 2 hours.

Without chasing (flat £50 stakes):
  4 losses = £200 lost. Balance: £300.
  Bankroll survives. Can continue betting tomorrow.

The cost of chasing: £300 more than flat staking.
Or put another way: chasing accelerated bankruptcy by
eliminating the bankroll in 4 bets instead of 10.
```

**Section 5: Betting what you know vs betting what's on TV**

The mathematical case for specialisation. If you know League One football deeply, your probability estimates for League One matches are more accurate than your estimates for La Liga. Better estimates = better value identification = higher edge. Betting on everything dilutes your edge.

**Section 6: Confirmation bias in betting — remembering the winners, forgetting the losers**

Show how a bettor who backs 100 selections at average odds of 4.00, winning 20%, feels like they're doing well (20 winners!) but is actually losing money (expected return: 80% × -£1 + 20% × £3 = -£0.20 per bet).

### Interactive tool: Mistake Cost Calculator

**Inputs:**
- Number of bets per week
- Average stake
- Average odds
- Accumulator size (if applicable)
- Percentage of bets on longshots (>10.00)

**Outputs:**
- Expected annual loss from overround
- Additional loss from accumulator compounding
- Additional loss from longshot bias
- Total expected annual loss
- Comparison: "If you bet singles instead of 5-fold accas, your expected annual loss drops from £X to £Y"
- "Break-even win rate required" for each betting pattern

### Scenarios (15)

5 accumulator cost analysis (calculate the true cost of various acca sizes), 4 favourite-longshot bias (identify which end of the market is being overcharged), 3 chasing losses simulation (model the bankroll trajectory of a chaser vs flat staker), 3 specialisation value (compare edge estimates for known vs unknown leagues).

---

## Module 13: Discipline, Focus & the Mathematics of Selectivity

**Tier:** Master
**Accent:** #2563eb (blue)
**Scenarios:** 15
**Prerequisites:** Module 12 (mistakes), Module 7 (bankroll basics)

### Why this module exists

The single most important mathematical principle in profitable betting is selectivity. Betting less, not more. This module proves it with numbers: the Kelly Criterion applied to betting, the mathematics of why 3 bets at 5% edge beats 30 bets at 0.5% edge, and the variance implications of overexposure.

### Tutorial content

**Section 1: The Kelly Criterion for betting**

`.mb` box:
```
Kelly formula for a single bet:

f* = (bp - q) / b

where:
  f* = fraction of bankroll to stake
  b = decimal odds - 1 (net odds)
  p = your estimated true probability
  q = 1 - p

Example: You believe Arsenal win probability is 60%.
Bookmaker odds: 1.90 (b = 0.90).

f* = (0.90 × 0.60 - 0.40) / 0.90
   = (0.54 - 0.40) / 0.90
   = 0.14 / 0.90
   = 0.156 (15.6% of bankroll)

If your edge were smaller — say you estimate 53%:
f* = (0.90 × 0.53 - 0.47) / 0.90
   = (0.477 - 0.47) / 0.90
   = 0.007 / 0.90
   = 0.008 (0.8% of bankroll)

Small edge → tiny stake.
No edge → Kelly says don't bet at all (f* ≤ 0).
```

`.pln` box: "Kelly tells you something profound: the size of your bet should be proportional to your edge. Big edge, bigger bet. Small edge, tiny bet. No edge, don't bet. Most punters do the opposite — they bet the same amount regardless of how confident they are, and they bet on markets where they have no edge at all."

**Section 2: Why fewer bets with bigger edges beats more bets with smaller edges**

`.mb` box:
```
Strategy A: 3 bets per weekend, each with 5% edge
  Average odds: 2.00
  Kelly stake per bet: ~5% of bankroll
  Expected profit per weekend: 3 × £50 × 0.05 = £7.50
  Variance: relatively low (only 3 independent outcomes)

Strategy B: 30 bets per weekend, each with 0.5% edge
  Average odds: 2.00
  Kelly stake per bet: ~0.5% of bankroll
  Expected profit per weekend: 30 × £5 × 0.005 = £0.75
  Variance: much higher (30 small bets, many correlated)

Strategy A earns 10× more expected profit with less variance.
Why? Because Kelly allocates capital proportionally to edge.
High-edge bets get real money. Low-edge bets get dust.

If the 0.5% edge bets are actually 0% edge (you just think
they're 0.5%):
  Strategy B expected profit: £0 (or negative after overround)
  You've done 30 bets for nothing.
```

`.pln` box: "The maths is unambiguous: betting on 3 things you genuinely understand is worth more than betting on 30 things you half-understand. Every additional market you bet on without a genuine edge is a donation to the bookmaker. Selectivity isn't about willpower — it's about mathematics."

**Section 3: Correlated bets — the hidden variance multiplier**

`.mb` box:
```
If you bet on 5 Premier League matches on a Saturday,
your bets are NOT independent.

Correlation sources:
- Weather affecting all matches (heavy rain → fewer goals)
- Referee tendencies (same referee pool)
- League-wide form patterns
- Your own biases (you might overrate home teams today)

If bets are 20% correlated:
  Independent variance: σ² per bet
  Correlated variance: σ² × [n + n(n-1)ρ]
  With n=5, ρ=0.2: 5 + 5×4×0.2 = 5 + 4 = 9
  Effective independent bets: 5²/9 = 2.8

You think you have 5 independent bets.
You actually have ~2.8.
Your risk is 78% higher than you calculated.
```

`.pln` box: "Five bets on the same Saturday's football aren't five independent bets. They share conditions, and they share your biases. The maths says you're taking on nearly twice the risk you think. This is why bookmakers love it when you bet on everything — you're overexposing yourself without realising it."

**Section 4: The mathematics of saying no**

The expected value of NOT betting. If a market is -EV, the act of not betting is a +EV decision. Quantify how much money "doing nothing" saves over a year.

**Section 5: Building a staking plan — flat stakes, percentage stakes, Kelly stakes**

Compare the three approaches mathematically. Show that Kelly maximises long-run growth but requires accurate probability estimation. Flat staking is suboptimal but robust to estimation errors. Percentage staking is a reasonable middle ground.

### Interactive tool: Selectivity Analyser

**Inputs:**
- Number of bets per week at each confidence level (high edge / medium edge / low edge / no edge)
- Estimated edge percentage for each level
- Average odds
- Current staking approach (flat / percentage / Kelly)
- Bankroll size

**Outputs:**
- Expected annual profit from each confidence tier
- Expected annual loss from no-edge bets
- Net expected annual return
- "If you eliminated low/no edge bets, your expected return would increase by £X"
- Kelly-optimal staking plan showing stake per bet at each confidence level
- Projected bankroll growth curves (with and without low-edge bets)

### Scenarios (15)

5 Kelly sizing (given probability estimates and odds → what should the stake be?), 4 selectivity analysis (given a week's worth of potential bets → which ones are mathematically worth placing?), 3 correlation awareness (are these bets truly independent?), 3 "should you bet at all?" decisions (is the edge genuine or are you fooling yourself?).

---

## Module 14: Free Bet Mathematics

**Tier:** Master
**Accent:** #2563eb (blue)
**Scenarios:** 15
**Prerequisites:** Modules 1–4

### Why this module exists

Bookmakers give away millions in free bets as sign-up offers and promotions. Most punters waste them on accumulators. The mathematics of free bet extraction is precise: there's an optimal strategy that maximises the expected cash value of every free bet. This module teaches it.

### Tutorial content

**Section 1: What a free bet is actually worth**

`.mb` box:
```
A "free £20 bet" is NOT worth £20.

If you use a £20 free bet at odds of 2.00:
  Win (50%): you receive £20 profit (stake not returned — it's "free")
  Lose (50%): you receive £0

Expected value: 0.50 × £20 + 0.50 × £0 = £10

A £20 free bet at 2.00 is worth £10 in expectation.
That's 50% of face value.

At longer odds (5.00):
  Win (20%): you receive £80 profit
  Lose (80%): you receive £0
  EV: 0.20 × £80 = £16 (80% of face value)

At shorter odds (1.50):
  Win (67%): you receive £10 profit
  Lose (33%): you receive £0
  EV: 0.67 × £10 = £6.70 (33.5% of face value)

General formula for SNR (Stake Not Returned) free bet:
  Value = face value × (odds - 1) / odds

At odds 2.00: £20 × 1/2 = £10 (50%)
At odds 5.00: £20 × 4/5 = £16 (80%)
At odds 10.00: £20 × 9/10 = £18 (90%)

Higher odds → higher free bet value as a percentage.
```

`.pln` box: "Your £20 free bet is worth between £6 and £18 in real money, depending on what odds you use it on. Longer odds give you more value from a free bet. This is the opposite of normal betting, where shorter odds have lower overround. For free bets, back the longshot."

**Section 2: Stake Returned (SR) vs Stake Not Returned (SNR)**

`.mb` box:
```
SR free bet (rare — your "free stake" is returned with winnings):
  £20 SR free bet at 2.00:
  Win: £40 return (£20 profit + £20 stake)
  Lose: £0
  EV: 0.50 × £40 = £20 = 100% of face value at any odds!

  An SR free bet at odds of 1.10:
  Win: £22 return
  Lose: £0
  EV: 0.909 × £22 = £20 (still 100%!)

SR free bets are worth their full face value.
Use them on the shortest odds you can find to minimise variance.

SNR free bet (standard — stake is not included in return):
  Use on the longest odds available to maximise value.
  At odds 4.00+: worth 75%+ of face value.
```

`.pln` box: "SR free bets are golden — they're worth 100% of face value regardless of odds. SNR free bets (the standard type) are worth more at higher odds. The optimal strategy for each is the exact opposite: SR bets → back the favourite. SNR bets → back the longshot."

**Section 3: Qualifying bets — the cost of unlocking the free bet**

Most offers require a qualifying bet: "Bet £20 and get a £20 free bet." The qualifying bet itself has an expected loss.

`.mb` box:
```
"Bet £20 get £20 free" offer.

Step 1: Qualifying bet
  Place £20 at odds 2.00 (typical requirement: min odds 1.50+)
  Expected loss on qualifying bet: £20 × 5% overround = £1.00

Step 2: Free bet (SNR)
  Use £20 free bet at odds 5.00
  Expected value: £20 × 4/5 = £16

Net expected profit from the offer:
  Free bet value - qualifying bet cost = £16 - £1 = £15

Retention rate: £15 / £20 face value = 75%

Most sign-up offers yield 60-80% of face value when
executed optimally. The qualifying bet cost is the "price"
of the free bet.
```

**Section 4: Lay-off strategy for guaranteed profit (using exchanges)**

If you have access to a betting exchange (Betfair, Smarkets), you can guarantee a profit by laying off the qualifying bet.

`.mb` box:
```
Qualifying bet: Back Arsenal @ 2.00, £20 (with bookmaker)
Lay bet: Lay Arsenal @ 2.02, £19.80 (on exchange)

If Arsenal win:
  Bookmaker: +£20 profit
  Exchange: -(£19.80 × 1.02) = -£20.20 (lay liability)
  Net: -£0.20

If Arsenal lose:
  Bookmaker: -£20
  Exchange: +£19.80 (lay stake received)
  Net: -£0.20

Guaranteed loss on qualifier: £0.20 (regardless of result)

Now use the £20 free bet:
  Back longshot @ 6.00, £20 SNR free bet
  Lay @ 6.10, £16.39 on exchange

If longshot wins:
  Bookmaker: +£100 (free bet, SNR)
  Exchange: -(£16.39 × 5.10) = -£83.59
  Net: +£16.41

If longshot loses:
  Bookmaker: £0
  Exchange: +£16.39
  Net: +£16.39

Guaranteed profit from free bet: ~£16.40

Total guaranteed profit from offer: £16.40 - £0.20 = £16.20
```

`.pln` box: "By using a betting exchange to lay off both the qualifying bet and the free bet, you can turn a '£20 free bet' into a guaranteed £16.20 in real cash, regardless of whether your selections win or lose. This isn't gambling — it's arithmetic. The bookmaker gives away value in the free bet; you're capturing it mathematically."

**Section 5: Offer types ranked by mathematical value**

Rank common offer types by expected retention rate:
- "Bet £X get £X free" (SNR): 60-80% retention
- "Money back as free bet if you lose": 30-50% retention
- "Enhanced odds" offers: variable, sometimes 100%+
- "Acca insurance" (free bet if one leg loses): minimal value, encourages accas
- "Bet £X get £X in free bets (in smaller denominations)": 50-70% retention

### Interactive tool: Free Bet Calculator

**Inputs:**
- Free bet face value (£)
- Type: SNR or SR
- Odds for the free bet
- (Optional) Lay odds on exchange
- (Optional) Exchange commission rate (%)
- Qualifying bet details (stake, odds, lay odds)

**Outputs:**
- Expected value of the free bet
- If exchange available: guaranteed profit calculation
- Qualifying bet cost (or guaranteed qualifying loss)
- Net profit from the complete offer
- Retention rate as percentage
- "Optimal odds range" recommendation

### Scenarios (15)

5 free bet valuation (given bet type and odds → what's it worth?), 4 qualifying bet analysis (given an offer → what's the total expected profit?), 4 lay-off calculations (given back and lay odds → calculate guaranteed profit), 2 offer comparison (given two different promotions → which has better maths?).

---

## Module 15: Exchange Mathematics — Betfair, Smarkets & the Commission Model

**Tier:** Master
**Accent:** #2563eb (blue)
**Scenarios:** 15
**Prerequisites:** Modules 1–4

### Why this module exists

Betting exchanges are mathematically superior to bookmakers for one reason: you bet against other punters, not against the house. The exchange takes a commission on winning bets (typically 2-5%) instead of building overround into the odds. The effective margin on exchanges is typically 1-3%, compared to 4-8% at bookmakers. Understanding exchange mathematics — back, lay, commission, implied probability — is essential for any serious bettor.

### Tutorial content

**Section 1: Back vs Lay — the mathematics of being the bookmaker**

`.mb` box:
```
Traditional betting: you BACK a selection (bet on it to win)
Exchange betting: you can also LAY a selection (bet against it)

Laying is being the bookmaker.

You lay Arsenal to win @ 2.00 for £20.

If Arsenal win: you pay out £20 (the backer's profit)
If Arsenal lose: you keep £20 (the backer's stake)

Your liability = stake × (odds - 1) = £20 × 1.0 = £20
Your potential profit = £20 (the backer's stake)

Laying at 2.00 is mathematically identical to backing
"not Arsenal" at 2.00.

But lay odds and back odds differ. On an exchange:
  Back Arsenal: 2.02 (you need to "buy" at the ask price)
  Lay Arsenal: 2.00 (you need to "sell" at the bid price)

The gap (2.02 vs 2.00) is the exchange's effective spread.
This is much tighter than bookmaker overround.
```

`.pln` box: "On an exchange, every bet has someone on the other side. When you back Arsenal, another punter is laying Arsenal. The exchange just matches you up and takes a small commission. There's no bookmaker building in a 5% margin — just two punters disagreeing about the probability."

**Section 2: Commission — the exchange's revenue model**

`.mb` box:
```
Betfair commission: 5% on net winning profit per market
Smarkets commission: 2% on net winning profit per market

You back Arsenal @ 2.10, £100. Arsenal win.
Gross profit: £110
Betfair commission: £110 × 5% = £5.50
Net profit: £104.50

Effective odds after commission:
  You staked £100, received £204.50 back
  Effective odds: 204.50/100 = 2.045

The commission reduces your odds from 2.10 to 2.045.

At Smarkets (2% commission):
  Net profit: £110 × 0.98 = £107.80
  Effective odds: 207.80/100 = 2.078

For the SAME back price of 2.10:
  Bookmaker: you get 2.10
  Betfair: you effectively get 2.045
  Smarkets: you effectively get 2.078

But bookmaker 2.10 includes their overround.
Exchange 2.10 is closer to the true price.
```

**Section 3: True overround on exchanges vs bookmakers**

`.mb` box:
```
Manchester United vs Liverpool

Bookmaker market:
  Man Utd: 2.80 (35.7%)
  Draw: 3.40 (29.4%)
  Liverpool: 2.60 (38.5%)
  Total implied: 103.6%
  Overround: 3.6%

Exchange market (Betfair, back prices):
  Man Utd: 2.92 (34.2%)
  Draw: 3.55 (28.2%)
  Liverpool: 2.72 (36.8%)
  Total implied: 99.2%

Wait — under 100%? Yes. Because the back prices on an exchange
represent what backers are demanding. The lay prices are slightly
tighter. The effective market:

  Back Man Utd: 2.92 / Lay Man Utd: 2.96
  Effective midpoint: 2.94 (34.0%)

  Back Draw: 3.55 / Lay Draw: 3.65
  Effective midpoint: 3.60 (27.8%)

  Back Liverpool: 2.72 / Lay Liverpool: 2.76
  Effective midpoint: 2.74 (36.5%)

  Total: 98.3% + commission adjustment → ~100.5-101%
  Effective overround: 0.5-1%

Exchange overround: ~1%
Bookmaker overround: ~3.6%
Difference: 2.6 percentage points per bet.
```

`.pln` box: "On the exchange, you're paying roughly 1% in effective margin instead of 3-4% at the bookmaker. Over 500 bets a year at £20 average stake, that's £500 × 2.6% = £260 saved. The exchange isn't making you a winner — but it's making you lose much more slowly."

**Section 4: When to use bookmaker vs exchange**

Bookmakers are better for: enhanced odds offers, free bets, best odds guaranteed on horses, accumulator bonuses.
Exchanges are better for: trading in-play, laying selections, lower margins on popular markets, avoiding account restrictions.

**Section 5: The trading model — backing and laying for profit**

`.mb` box:
```
Pre-match: Back Arsenal @ 2.50, £40
  Arsenal score early.
In-play: Lay Arsenal @ 1.50, £66.67

If Arsenal win:
  Back profit: £40 × 1.50 = £60
  Lay loss: £66.67 × 0.50 = -£33.33
  Net: +£26.67

If Arsenal don't win:
  Back loss: -£40
  Lay profit: +£66.67
  Net: +£26.67

Guaranteed profit: £26.67 (before commission)
After 5% commission on £26.67: £26.67 × 0.95 = £25.33

This is "trading" — it's not gambling, it's locking in profit
when the odds move in your favour.

The lay stake to guarantee equal profit:
  Lay stake = (Back stake × Back odds) / Lay odds
  = (40 × 2.50) / 1.50
  = 100 / 1.50
  = 66.67 ✓
```

### Interactive tool: Exchange Calculator

**Inputs:**
- Back odds and stake
- Lay odds
- Commission rate (%)
- Mode toggle: "Calculate lay stake for equal profit" / "Calculate guaranteed profit"

**Outputs:**
- Optimal lay stake
- Profit if selection wins
- Profit if selection loses
- Net profit after commission
- "Break-even lay odds" — at what lay price does profit become zero?

### Scenarios (15)

5 back vs lay decisions (when should you use the exchange?), 4 commission impact (calculate effective odds after commission), 3 trading calculations (lock in profit after an odds movement), 3 exchange vs bookmaker comparison (which gives better value for this specific market?).

---

## Module 16: In-Play Mathematics & Live Betting Traps

**Tier:** Master (final module)
**Accent:** #2563eb (blue)
**Scenarios:** 15
**Prerequisites:** Module 11 (Poisson), Module 15 (exchanges)

### Why this module exists

In-play betting is the fastest-growing segment of the betting industry. It's also where the bookmaker's mathematical advantage is largest. Prices update every few seconds based on models that account for match state, time remaining, and current score. The average punter is betting against algorithms — and the algorithms are faster and better-informed.

This module teaches the mathematics of how in-play odds move, why the bookmaker's edge increases during live matches, and the very narrow conditions under which in-play betting can be mathematically sound.

### Tutorial content

**Section 1: How in-play odds are calculated**

`.mb` box:
```
Pre-match: Arsenal vs Crystal Palace
  Arsenal win: 1.70 (58.8%)
  Draw: 3.80 (26.3%)
  Palace win: 5.00 (20.0%)

10 minutes in, 0-0:
  Remaining time: 80/90 = 88.9%
  Adjusted λ_home (per remaining time) = 1.8 × 0.889 = 1.60
  Adjusted λ_away = 0.9 × 0.889 = 0.80

  Updated probabilities using adjusted Poisson:
  Arsenal win: ~55% (odds lengthen slightly to ~1.82)
  Draw: ~28% (shortens to ~3.57)
  Palace win: ~17% (lengthens to ~5.88)

35 minutes in, Arsenal 1-0 up:
  Remaining time: 55/90 = 61.1%
  Current state: Arsenal leading by 1

  For Arsenal to win, they need Palace to score 0 in remaining time
  OR outscore any Palace goals.
  
  P(Palace scores 0 in 55 min) = e^(-0.9 × 0.611) = e^(-0.55) = 0.577
  
  Much more complex calculation needed for full model,
  but the key insight:

  Arsenal win probability jumps to ~78%
  New odds: ~1.28
  Draw: ~14% (odds: ~7.14)
  Palace win: ~8% (odds: ~12.5)

  The model instantly repriced. By the time you see these
  odds and click "bet", the model may have updated again.
```

`.pln` box: "In-play odds aren't set by humans — they're calculated by algorithms that reprice every few seconds based on a mathematical model of the match state. The model knows the score, the time, and the expected goal rates. It's updating faster than you can process what's happening on screen."

**Section 2: The suspension trap — why bookmakers suspend at key moments**

`.mb` box:
```
Bookmaker suspends betting when:
  - A goal appears likely (corner, penalty, dangerous attack)
  - A red card is about to be shown
  - Any event that would dramatically shift probabilities

Why? Because during these moments, the true probability
is changing faster than the model can reprice.

A corner kick:
  P(goal from corner) ≈ 3.5%
  Before corner: Arsenal to score next @ 1.55
  During corner: TRUE probability shifts to ~1.50
  
  If the bookmaker doesn't suspend:
    You could back "Arsenal next goal" at 1.55
    when the true price should be 1.50
    Edge: 3.3% for 10 seconds of action
    
  Over 1000 corners backed this way: guaranteed profit.
  The bookmaker suspends to prevent this.
  
When they DON'T suspend (or are slow to):
  Exchange traders exploit the delay.
  This is why exchange in-play markets are
  much more efficient than bookmaker in-play markets.
```

`.pln` box: "The bookmaker suspends betting whenever they think someone could exploit a pricing delay. Every time you see 'suspended' during a match, that's the bookmaker admitting their model can't keep up with reality. And when the market reopens, the new prices have already absorbed the information you thought you could exploit."

**Section 3: The increased overround on in-play markets**

`.mb` box:
```
Pre-match overround on match result: 3-5%
In-play overround on match result: 6-10%

Why higher?
  1. The bookmaker needs to compensate for pricing uncertainty
  2. Suspensions create asymmetric information risk
  3. Punters betting in-play are less price-sensitive
     (emotional, watching the match, reactive)
  4. The bookmaker knows in-play bettors are typically
     less sophisticated than pre-match bettors

At 8% in-play overround vs 4% pre-match:
  The bookmaker makes twice the margin per bet.
  You lose twice as fast.
```

**Section 4: When in-play betting makes mathematical sense**

The narrow conditions: you have information the model doesn't (watching the match and noticing a tactical shift the algorithm can't see), you're trading on an exchange (not betting against the bookmaker), or you're closing a position (locking in profit on a pre-match bet).

**Section 5: The psychology of live betting — why it's designed to make you bet badly**

Cash-out is a mathematical trap. The cash-out price always favours the bookmaker. Show the calculation: a cash-out offer is always worse than the equivalent back/lay position because the bookmaker adds margin to the cash-out price.

`.mb` box:
```
You backed Arsenal to win the league at 10.00, £20.
They're now second with 5 games left. Current odds: 3.50.

Bookmaker cash-out offer: £42

What it SHOULD be worth:
  Your bet's current value = £20 × (10.00/3.50) = £57.14
  Or equivalently: you'd win £200 if Arsenal win.
  P(Arsenal win league) = 1/3.50 = 28.6%
  EV = 0.286 × £200 = £57.14

Cash-out offer: £42
True value: £57.14
Bookmaker's margin on cash-out: (57.14 - 42) / 57.14 = 26.5%

The cash-out button charges you 26.5% margin.
If you want to lock in profit, lay on an exchange instead.
```

`.pln` box: "Cash-out looks convenient. The bookmaker presents it as 'securing your profit.' But the cash-out price is always below the true value of your bet — typically by 15-30%. If you want to lock in profit, place a lay bet on an exchange. Same result, much less margin taken."

### Interactive tool: In-Play Odds Modeller

**Inputs:**
- Pre-match expected goals (home and away)
- Current score
- Minutes elapsed
- (Optional) Red cards, significant tactical info

**Outputs:**
- Updated win/draw/loss probabilities
- Fair in-play odds for each outcome
- Remaining expected goals per team
- Over/Under probabilities adjusted for current state
- "Next goal" probabilities
- Cash-out valuation: "Your bet is currently worth £X. If the bookmaker offers less, don't take it."

### Scenarios (15)

5 in-play repricing (given match state → calculate updated probabilities), 4 cash-out evaluation (is the cash-out offer fair?), 3 suspension analysis (why did the market suspend and what does that tell you?), 3 in-play vs pre-match edge comparison (where is your edge larger?).

---

## Build Summary

| Module | Title | Tier | Scenarios | Tool |
|--------|-------|------|-----------|------|
| 9 | Asian Handicap Mathematics | Advanced | 20 | Asian Handicap Calculator |
| 10 | Half-Time/Full-Time & Conditional Probability | Advanced | 15 | HT/FT Probability Calculator |
| 11 | The Poisson Distribution | Advanced | 15 | Poisson Match Modeller |
| 12 | Mistakes the Average Punter Makes | Master | 15 | Mistake Cost Calculator |
| 13 | Discipline, Focus & Selectivity | Master | 15 | Selectivity Analyser |
| 14 | Free Bet Mathematics | Master | 15 | Free Bet Calculator |
| 15 | Exchange Mathematics | Master | 15 | Exchange Calculator |
| 16 | In-Play Mathematics & Live Betting Traps | Master | 15 | In-Play Odds Modeller |
| **TOTAL** | | | **125** | **8 tools** |

Combined with existing Modules 1–8 (40+ scenarios):
**Grand total: 16 modules, 165+ scenarios, 8+ interactive tools.**

---

## Stripe Updates Required

Sports Betting Maths currently has 3 tiers (Basic £6.99, Advanced £12.99, Master £17.99). The new modules map to the existing tier structure — no price changes needed. But the Stripe product description and the landing page stats need updating:

**Updated Stripe description:**
`16 modules teaching the mathematics behind sports betting — implied probability, Asian handicaps, Poisson modelling, free bet extraction, exchange mathematics, and why 95% of bettors lose. 165+ scenarios. Module 1 free.`

**Updated meta tags:**
```html
<title>Sports Betting Maths — 16 Modules of Pure Betting Mathematics | MathsWins</title>
<meta name="description" content="16 modules teaching sports betting mathematics: implied probability, Asian handicaps, Poisson goal modelling, free bet extraction, exchange maths, and the mistakes that cost punters thousands. 165+ scenarios. Module 1 free.">
```

---

## SEO Keyword Targets for New Modules

| Module | Primary keywords | Competition |
|--------|-----------------|-------------|
| Asian Handicaps | "asian handicap explained", "AH betting maths", "quarter goal handicap" | Medium |
| HT/FT | "half time full time odds explained", "HT/FT probability" | Low-Medium |
| Poisson | "poisson distribution football", "goal scoring model betting", "expected goals model" | Medium |
| Punter Mistakes | "why do bettors lose", "accumulator maths", "favourite longshot bias" | Low |
| Discipline | "kelly criterion betting", "bankroll management sports betting" | Medium |
| Free Bets | "free bet calculator", "how to use free bets", "matched betting maths" | High |
| Exchanges | "betfair commission explained", "back lay calculator", "exchange vs bookmaker" | Medium |
| In-Play | "in play odds calculation", "live betting maths", "cash out value" | Low-Medium |

The **free bet module** has the highest SEO potential — "free bet calculator" is a highly searched term. Consider making the free bet calculator tool accessible from the landing page (even if the tutorial content is locked) as an SEO asset.

---

## Build Order

Recommended build sequence:

**Batch 1:** M11 (Poisson — foundational for M10 and M16), M14 (Free Bets — standalone, high SEO value)
**Batch 2:** M9 (Asian Handicaps), M12 (Punter Mistakes)
**Batch 3:** M10 (HT/FT — needs Poisson from M11), M15 (Exchanges)
**Batch 4:** M13 (Discipline — needs M12 concepts), M16 (In-Play — needs M11 and M15)

Each module is a single JS file following the same pattern as the existing sports betting chunks.

---

## Responsible Gambling Note

This expansion includes more content about actual betting strategy (free bet extraction, exchange trading, in-play maths) than the existing modules. Every module must include:

- "This is mathematical education, not betting advice."
- National Gambling Helpline: 0808 8020 133 (free, 24/7)
- GamCare: www.gamcare.org.uk
- BeGambleAware: www.begambleaware.org

The free bet extraction module in particular should note: "Understanding the mathematics of free bet offers is educational. If you find yourself spending excessive time or money chasing offers, please contact the National Gambling Helpline."

---

## Cross-Link Updates

The cross-link spec needs updating. Sports Betting now has enough content to link to:
- **Poker School** (same probability concepts — implied odds, expected value, bankroll management)
- **Lottery Maths** (accumulators are the lottery of sports betting — the combinatorics explain why)
- **Trading Maths** (bookmaker overround and market spread — two names for the same mathematical edge)
- **Options Maths** (the Poisson model and Black-Scholes both model uncertainty over time — different domains, same mathematical foundations)

---

*End of specification. Ready for build.*
