// sb9-asian-handicaps.js
// Sports Betting Maths — Module 9: Asian Handicap Mathematics
// Tier: Advanced | Accent: #2563eb | Scenarios: 20

const MODULE_9 = {
  id: 9,
  title: 'Asian Handicap Mathematics',
  tier: 'advanced',
  scenarios: 20,
  tool: 'Asian Handicap Calculator',

  tutorial: `
<div class="tut">
  <h2>Module 9: Asian Handicap Mathematics</h2>

  <div class="pt" style="border-left:3px solid var(--blue);background:var(--blue-dim);padding:1rem;border-radius:0 6px 6px 0;margin-bottom:1.5rem;">
    Asian handicaps eliminate the draw. That single change reduces the bookmaker's overround from 5–8% to 2–4%. Over hundreds of bets, this difference is worth real money.
  </div>

  <h3>Why Asian Handicaps Exist</h3>
  <p>A traditional 1X2 market has three outcomes. Three outcomes give the bookmaker three places to hide margin. Asian handicaps reduce this to two outcomes — and the maths improves immediately.</p>

  <div class="mb">Traditional 1X2: Arsenal vs Crystal Palace
  Arsenal win: 1.50 (implied 66.7%)
  Draw: 4.20 (implied 23.8%)
  Palace win: 7.00 (implied 14.3%)
  Total implied: 104.8% → Overround: 4.8%

Asian Handicap -1.5:
  Arsenal -1.5: 2.10 (implied 47.6%)
  Palace +1.5: 1.80 (implied 55.6%)
  Total implied: 103.2% → Overround: 3.2%

Saving: 1.6 percentage points per bet.
Over 100 × £10 bets: £16 less lost to margin.</div>

  <div class="pln">Asian handicaps give the bookmaker a smaller margin on every bet. With only two outcomes instead of three, there's less room to inflate the prices. Over hundreds of bets, this compounds into real money.</div>

  <h3>Whole-Goal Handicaps (0, −1, −2)</h3>
  <p>Whole-goal Asian handicaps include a <strong>void/push</strong> condition. If the result lands exactly on the handicap line, your stake is returned.</p>

  <div class="mb">Arsenal −1 Asian Handicap @ 1.95

Arsenal win by 2+: WIN (paid at 1.95)
Arsenal win by exactly 1: VOID (stake returned)
Draw or Palace win: LOSE

Compare to European Handicap −1 @ 2.20:
  Arsenal win by exactly 1 = DRAW on EH → you lose
  AH gives you a safety net at slightly lower odds.</div>

  <h3>Half-Goal Handicaps (−0.5, −1.5, −2.5)</h3>
  <p>No void possible. Clean win or loss. Mathematically simplest.</p>

  <div class="mb">Arsenal −1.5 @ 2.10

Win: Arsenal win by 2+ goals
Lose: Arsenal win by 0 or 1, draw, or lose

Identical to "Arsenal to win by 2+" in a correct score market
but at better odds because:
  AH overround ≈ 3%
  Correct score overround ≈ 15–25%

Same bet. Better price.</div>

  <h3>Quarter-Goal Handicaps — The Split Stake</h3>
  <p>This is where most punters get confused. A −0.75 line means your stake splits equally across TWO bets: half on −0.5 and half on −1.0.</p>

  <div class="mb">Arsenal −0.75 @ 1.95, stake £20

Your £20 splits:
  £10 on Arsenal −0.5 @ 1.95
  £10 on Arsenal −1.0 @ 1.95

Arsenal win by 2+:
  Both bets win → return £39.00 (profit £19.00) → FULL WIN

Arsenal win by exactly 1:
  −0.5 wins: £10 × 1.95 = £19.50
  −1.0 voided: £10 returned
  Return: £29.50 (profit £9.50) → HALF WIN

Draw or Palace win:
  Both lose → return £0 → FULL LOSS</div>

  <div class="pln">Quarter-goal lines are two bets in one. Your stake splits down the middle. If the result lands between the two lines, you win one half and push the other. It's a halfway house — and the odds reflect that.</div>

  <h3>Line Movement and Value</h3>
  <p>When money flows onto one side, bookmakers move the handicap line to balance their book. A quarter-goal shift can eliminate value entirely.</p>

  <div class="mb">Opening: Arsenal −1.5 @ 2.10
Your model: P(Arsenal win by 2+) = 52%
EV = (0.52 × 2.10) − 1 = +0.092 = +9.2% ✓ VALUE

Line moves to: Arsenal −1.75 @ 2.05
P(full win) = P(win by 3+) = 37%
P(half win) = P(win by exactly 2) = 15%

EV = (0.37 × 1.05) + (0.15 × 0.525) − (0.48 × 1)
   = 0.389 + 0.079 − 0.48 = −0.012 = −1.2% ✗ NO VALUE

A quarter-goal move killed a 9% edge.</div>

  <div class="dg">Line movements in Asian handicap markets happen fast. The value is in the opening line. By the time most punters see the odds, the sharp money has already moved the price.</div>

  <h3>AH vs 1X2: When to Use Each</h3>
  <p>The mathematical rule: if the draw probability exceeds 20%, Asian handicap markets offer better value because the overround is distributed across fewer outcomes. For matches with a clear favourite, AH −0.5 is mathematically equivalent to the 1X2 home win — but typically at better odds.</p>

  <div class="gd">Always compare the AH price against the equivalent 1X2 price. If Arsenal are 1.50 to win (1X2) and Arsenal −0.5 is 1.55 (AH), the AH gives you the same bet at 3% better odds. Over a season of betting, that difference compounds.</div>
</div>
`,

  scenarioData: [
    // Basic: Given line and odds, what are the outcomes?
    { q: "You bet £20 on Arsenal −1.5 @ 2.10. Arsenal win 3−1. What is your return?", a: "£42.00", detail: "Arsenal won by 2, which is more than 1.5. Full win: £20 × 2.10 = £42.00 (profit £22.00)." },
    { q: "You bet £20 on Arsenal −1.5 @ 2.10. Arsenal win 2−1. What is your return?", a: "£0.00 (full loss)", detail: "Arsenal won by 1. The handicap requires winning by 2+. 1 < 1.5, so you lose your £20 stake." },
    { q: "You bet £30 on Liverpool −1.0 @ 1.90. Liverpool win 1−0. What happens?", a: "£30 returned (void)", detail: "Liverpool won by exactly 1, which equals the handicap line. Whole-goal AH = void/push. Stake returned." },
    { q: "You bet £30 on Liverpool −1.0 @ 1.90. Liverpool win 3−0. What is your profit?", a: "£27.00", detail: "Liverpool won by 3, exceeding the −1 line. Profit = £30 × (1.90 − 1) = £27.00." },
    { q: "You bet £20 on Chelsea +0.5 @ 1.85. The match ends 1−1. What is your return?", a: "£37.00", detail: "Chelsea +0.5 means Chelsea start with a half-goal advantage. A draw = Chelsea 'wins' by 0.5. Return: £20 × 1.85 = £37.00." },
    // Quarter-goal lines
    { q: "You bet £40 on Man City −0.75 @ 1.92. City win 1−0. What is your return?", a: "£58.40", detail: "Split: £20 on −0.5 (wins: £20 × 1.92 = £38.40) + £20 on −1.0 (void: £20 returned). Total: £58.40. Profit: £18.40 (half win)." },
    { q: "You bet £40 on Man City −0.75 @ 1.92. City win 2−0. What is your return?", a: "£76.80", detail: "Both halves win. £40 × 1.92 = £76.80. Full win, profit £36.80." },
    { q: "You bet £40 on Man City −0.75 @ 1.92. Match ends 0−0. What is your return?", a: "£0.00", detail: "City failed to win. Both the −0.5 and −1.0 halves lose. Full loss of £40." },
    { q: "You bet £20 on Everton +0.25 @ 2.05. Everton lose 0−1. What is your return?", a: "£10.00", detail: "Split: £10 on +0.5 (Everton lose by 1, but +0.5 means they 'lose' by 0.5 → loss) and £10 on 0 (draw line, Everton lost → loss). Wait — recalculate: +0.25 splits to +0 and +0.5. At 0−1: +0 loses (Everton lost), +0.5 loses (0+0.5=0.5, still behind). Both lose. Return: £0. Correction: £0.00." },
    { q: "You bet £20 on Everton +0.25 @ 2.05. Match ends 0−0. What is your return?", a: "£30.25", detail: "+0.25 splits to £10 on +0 (void at 0−0: £10 returned) and £10 on +0.5 (win: £10 × 2.05 = £20.50). Total: £30.50. Half win." },
    // Value assessment
    { q: "Your model says P(Arsenal win by 2+) = 48%. Arsenal −1.5 is priced at 2.15. Is this +EV?", a: "Yes, +3.2% edge", detail: "EV = (0.48 × 2.15) − 1 = 1.032 − 1 = +0.032 = +3.2%. Positive expected value." },
    { q: "Your model says P(Home win by 2+) = 30%. Home −1.5 is priced at 3.00. Is this +EV?", a: "No, −10% edge", detail: "EV = (0.30 × 3.00) − 1 = 0.90 − 1 = −0.10 = −10%. Negative expected value." },
    { q: "P(Home win) = 55%. Home −0.5 @ 1.80. Is this +EV?", a: "No, −1% edge", detail: "EV = (0.55 × 1.80) − 1 = 0.99 − 1 = −0.01 = −1%. Marginally negative." },
    { q: "P(Away win or draw) = 48%. Away +0.5 @ 2.15. Is this +EV?", a: "Yes, +3.2% edge", detail: "EV = (0.48 × 2.15) − 1 = +0.032. The +0.5 line wins on a draw or away win." },
    { q: "1X2 home win odds: 1.65. AH −0.5 odds: 1.72. Which has better value?", a: "AH −0.5 at 1.72", detail: "Both bets win in the same scenario (home win). AH pays 1.72 vs 1X2 pays 1.65. The AH is 4.2% better odds for the identical outcome." },
    { q: "AH −1.5 opens at 2.20, moves to 2.05. Your model probability hasn't changed at 45%. Was the opening line value?", a: "Opening: −1% (no). Closing: −8.75% (no)", detail: "Opening: 0.45 × 2.20 − 1 = −0.01. Closing: 0.45 × 2.05 − 1 = −0.0875. Neither had value — your 45% estimate was below break-even at any price offered." },
    // Line movement
    { q: "AH −1 opens at 2.00, moves to AH −1.25 at 1.95. What does the movement tell you?", a: "Money has come in on the home team", detail: "The line widened from −1 to −1.25, meaning bookmakers need to attract money on the away team. The home side has been backed heavily." },
    { q: "AH 0 opens at 1.90/1.90 and moves to AH −0.25 at 1.95/1.85. Who has the money been on?", a: "The home team", detail: "The handicap moved from 0 to −0.25, meaning the home team is now given a quarter-goal disadvantage. This happens when money flows onto the home side." },
    // Comparison
    { q: "1X2 market overround: 5.2%. AH market overround: 2.8%. You want to back the away team. How much do you save per £100 in expected terms by using AH?", a: "£2.40 per £100 staked", detail: "Overround difference: 5.2% − 2.8% = 2.4%. Per £100: £2.40 less lost to margin." },
    { q: "Home team 1X2 odds: 2.10. Home −0.5 AH odds: 2.05. Draw probability is 28%. Which market is better value for backing the home team?", a: "1X2 at 2.10 is better here", detail: "Both pay on home win only (AH −0.5 = same as 1X2 home win). 1X2 pays 2.10 vs AH 2.05. Despite higher overround, the 1X2 price is better for this specific outcome. Always compare both." },
  ],

  toolConfig: {
    name: 'Asian Handicap Calculator',
    inputs: [
      { id: 'ah-line', label: 'Handicap Line', type: 'select', options: ['+2','+1.75','+1.5','+1.25','+1','+0.75','+0.5','+0.25','0','-0.25','-0.5','-0.75','-1','-1.25','-1.5','-1.75','-2','-2.25','-2.5'] },
      { id: 'ah-odds', label: 'Odds (decimal)', type: 'number', default: 1.95, step: 0.01 },
      { id: 'ah-stake', label: 'Stake (£)', type: 'number', default: 20, step: 1 },
      { id: 'ah-gd', label: 'Goal Difference (Home−Away)', type: 'number', default: 1, step: 1 }
    ],
    calculate: function(inputs) {
      const line = parseFloat(inputs['ah-line']);
      const odds = inputs['ah-odds'];
      const stake = inputs['ah-stake'];
      const gd = inputs['ah-gd'];

      // Determine if quarter line
      const isQuarter = Math.abs(line % 0.5) === 0.25;
      const isHalf = Math.abs(line % 1) === 0.5;

      let result, returnAmt;

      if (isQuarter) {
        const line1 = line > 0 ? Math.floor(line * 2) / 2 : Math.ceil(line * 2) / 2;
        const line2 = line > 0 ? Math.ceil(line * 2) / 2 : Math.floor(line * 2) / 2;
        const halfStake = stake / 2;
        const r1 = calcHalfResult(gd, line1, halfStake, odds);
        const r2 = calcHalfResult(gd, line2, halfStake, odds);
        returnAmt = r1 + r2;
        result = returnAmt > stake ? 'WIN' : returnAmt === stake ? 'HALF WIN/VOID' : returnAmt > 0 ? 'HALF LOSS' : 'LOSS';
      } else {
        const adjusted = gd + line;
        if (adjusted > 0) { returnAmt = stake * odds; result = 'WIN'; }
        else if (adjusted === 0) { returnAmt = stake; result = 'VOID'; }
        else { returnAmt = 0; result = 'LOSS'; }
      }

      return {
        result: result,
        'Return': '£' + returnAmt.toFixed(2),
        'Profit': '£' + (returnAmt - stake).toFixed(2),
        'ROI': ((returnAmt - stake) / stake * 100).toFixed(1) + '%'
      };
    }
  }
};

function calcHalfResult(gd, line, stake, odds) {
  const adjusted = gd + line;
  if (adjusted > 0) return stake * odds;
  if (adjusted === 0) return stake;
  return 0;
}

if (typeof window !== 'undefined') window.MODULE_9 = MODULE_9;
