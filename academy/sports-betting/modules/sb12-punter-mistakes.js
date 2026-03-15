// sb12-punter-mistakes.js
// Sports Betting Maths — Module 12: The Mistakes the Average Punter Makes
// Tier: Master | Accent: #2563eb | Scenarios: 15

const MODULE_12 = {
  id: 12,
  title: 'The Mistakes the Average Punter Makes',
  tier: 'master',
  scenarios: 15,
  tool: 'Mistake Cost Calculator',

  tutorial: `
<div class="tut">
  <h2>Module 12: The Mistakes the Average Punter Makes</h2>

  <div class="pt" style="border-left:3px solid var(--red);background:var(--red-dim);padding:1rem;border-radius:0 6px 6px 0;margin-bottom:1.5rem;">
    Every common betting behaviour has a mathematical cost. This module quantifies each one in pounds and pence. No judgement — just numbers.
  </div>

  <h3>Mistake 1: The Accumulator Addiction</h3>

  <div class="mb">5-fold acca, each selection @ 2.00, overround 5% per leg:

Perceived probability: (0.50)^5 = 3.1%
Actual probability: (0.50/1.05)^5 = (0.476)^5 = 2.44%
Bookmaker odds: ~25.0
Fair odds: 1/0.0244 = 41.0

Expected return per £1: 0.0244 × 25.0 = £0.61
Expected loss: 39p per £1 staked

10-fold at 2.00 per leg:
  Actual probability: (0.476)^10 = 0.058%
  Expected return per £1 ≈ £0.37
  Expected loss: 63p per £1 staked

Year of £10 accas every Saturday (5-fold):
  52 × £10 × 0.39 = £203 expected loss.</div>

  <div class="pln">Every leg multiplies the bookmaker's edge. A single bet at 5% overround costs 5p per pound. A 5-fold costs 39p. A 10-fold costs 63p. The accumulator isn't a value bet — it's a lottery ticket with worse odds than the actual lottery.</div>

  <h3>Mistake 2: The Favourite-Longshot Bias</h3>

  <div class="mb">Research across millions of bets:

Odds range    | Implied prob | Actual win % | Overround
1.10–1.30     | 77–91%       | 79–89%       | 2–5%
1.50–2.00     | 50–67%       | 48–64%       | 3–6%
3.00–5.00     | 20–33%       | 18–29%       | 4–8%
10.00–20.00   | 5–10%        | 3–7%         | 6–15%
50.00+        | <2%          | <1%          | 10–40%

Pattern: the bigger the price, the worse the value.
Longshots are systematically overpriced.</div>

  <div class="pln">Backing heavy favourites isn't safe — you still face 2–5% overround. But backing longshots is mathematically worse. The bookmaker's margin increases as the odds get bigger. The 100/1 shot isn't 100/1 against — it's more like 150/1 against.</div>

  <h3>Mistake 3: The Gambler's Fallacy</h3>
  <p>Previous results do not affect future probabilities for independent events.</p>

  <div class="mb">You've lost 10 bets in a row. Each had a 50% win probability.

P(losing the 11th bet) = 50%

Not 40%. Not 30%. Exactly 50%.

The sequence LLLLLLLLLL has the same probability as
WLWLWLWLWL — each individual bet is independent.

P(10 losses in a row) = 0.50^10 = 0.098%
This WILL happen roughly once every 1,024 sequences of 10.
It doesn't mean the next one is "due".</div>

  <h3>Mistake 4: Chasing Losses</h3>

  <div class="mb">Bankroll: £500. Flat stake: £50.

Chasing (doubling after each loss):
  Loss 1: £50 → balance £450
  Loss 2: £100 → balance £350
  Loss 3: £200 → balance £150
  Loss 4: £150 (all-in) → balance £0
  Total time to ruin: 4 bets

Flat staking:
  4 losses: £200 lost → balance £300
  Bankroll survives. Continue tomorrow.

Cost of chasing: £300 accelerated loss.</div>

  <h3>Mistake 5: Betting Everything on TV</h3>

  <div class="mb">Your edge estimate accuracy by knowledge level:

League you follow closely: ±3% probability error
League you watch occasionally: ±8% probability error
League you never watch: ±15% probability error

With 5% overround to overcome:
  Close knowledge: your ±3% error can find +2% edges
  Occasional: your ±8% error drowns the 5% signal
  No knowledge: pure noise, guaranteed −5%+

10 bets on known leagues at +2% edge: EV = +£2/£100
10 bets on unknown leagues at −5%: EV = −£5/£100
Net: −£3. The unknown bets wiped out the edge.</div>

  <div class="pln">If you know League One inside out, your probability estimates for League One are far more accurate than for La Liga. Better estimates = better value identification. Betting on everything dilutes your edge with noise.</div>

  <h3>Mistake 6: Ignoring the Overround</h3>
  <p>Most punters never calculate the overround on a market. They compare odds between bookmakers but never ask: "What is the total margin I'm paying?"</p>

  <div class="mb">Three bookmakers on the same match:

Bookie A: 2.10 / 3.40 / 3.60  → overround 4.2%
Bookie B: 2.05 / 3.30 / 3.50  → overround 5.8%
Bookie C: 2.00 / 3.20 / 3.80  → overround 5.1%

Bookie A charges you 4.2p per £1.
Bookie B charges you 5.8p per £1.
Bookie C charges you 5.1p per £1.

Difference between best and worst: 1.6p per £1.
Over 500 bets: £8 difference. Not huge — but it compounds.</div>

  <div class="gd">The single best habit you can develop: before placing any bet, calculate the market overround. If it's above 6%, the bookmaker is taking too much. Look for the same market at a lower-margin bookmaker or on an exchange.</div>
</div>
`,

  scenarioData: [
    { q: "A 4-fold accumulator with 5% overround per leg. What is the effective overround on the acca?", a: "≈ 18.5%", detail: "Effective return = (1-0.05)^4 = 0.815. Effective overround = 1 - 0.815 = 0.185 = 18.5%." },
    { q: "A 7-fold acca at average odds of 1.80 per leg. What is the expected return per £1?", a: "≈ £0.52", detail: "Assuming ~5% overround: true prob per leg ≈ 1/(1.80×1.05) = 0.529. Acca prob: 0.529^7 = 0.0062. Payout: 1.80^7 = 61.2. EV: 0.0062 × 61.2 = £0.38. (Exact depends on precise overround.)" },
    { q: "You bet £10 every Saturday on a 5-fold acca. Over a year, what is your expected loss if average overround per leg is 5%?", a: "≈ £203", detail: "Per bet expected loss rate ≈ 39% (from acca compounding). Annual: 52 × £10 × 0.39 = £203." },
    { q: "A horse is priced at 33.00 (implied 3%). Historical data shows horses at this price win 1.8% of the time. What is the real overround?", a: "40%", detail: "Overround = (3% - 1.8%) / 1.8% = 66.7%. Or expressed as margin on implied: (3 - 1.8) / 3 = 40%. The bookmaker claims 3% but the true probability is only 1.8%." },
    { q: "You've lost 8 bets in a row on 50/50 propositions. What's the probability of winning the 9th?", a: "50%", detail: "Each bet is independent. Previous results have zero effect on future probability. P(win on 9th) = 50%, regardless of the losing streak." },
    { q: "A punter starts with £1,000 and doubles their stake after every loss, starting at £50. How many consecutive losses until they're bust?", a: "5 losses", detail: "Loss 1: £50 (bal: £950). Loss 2: £100 (bal: £850). Loss 3: £200 (bal: £650). Loss 4: £400 (bal: £250). Loss 5: can't place £800, goes all-in with £250. 5 losses to ruin." },
    { q: "Flat staking £50 from a £1,000 bankroll. How many consecutive losses to bust?", a: "20 losses", detail: "£1,000 / £50 = 20 bets. Bankroll survives 20 consecutive losses." },
    { q: "Market A overround: 3.2%. Market B overround: 7.8%. You plan to place 200 bets on each at £20/bet. How much more do you lose on Market B?", a: "£184 more", detail: "Market A: 200 × £20 × 3.2% = £128. Market B: 200 × £20 × 7.8% = £312. Difference: £184." },
    { q: "You bet on 30 matches per weekend across 6 leagues. Your edge is +3% on 5 matches (your specialist league) and −5% on the other 25. Net EV per weekend at £10/bet?", a: "−£11.00", detail: "+EV bets: 5 × £10 × 0.03 = +£1.50. −EV bets: 25 × £10 × 0.05 = −£12.50. Net: −£11.00. The unfocused betting destroys the edge." },
    { q: "Same scenario but you only bet on your 5 specialist matches. Net EV?", a: "+£1.50", detail: "5 × £10 × 0.03 = +£1.50 per weekend. Annual: +£78. Selectivity turns a loss into a profit." },
    { q: "A BTTS acca (4 legs, each 1.80). Expected return per £1?", a: "≈ £0.77", detail: "With ~4% overround per BTTS leg: true prob ≈ 0.535. Acca: 0.535^4 = 0.082. Payout: 1.80^4 = 10.50. EV: 0.082 × 10.50 = £0.86. (Varies by exact margin.)" },
    { q: "Bookmaker offers 'Acca Insurance: money back as free bet if one leg loses'. Does this change the maths significantly?", a: "No — the free bet is worth ~50-70% of face value", detail: "If one leg loses, you get a free bet (SNR) worth roughly 60% of your stake. On a 5-fold at £10: the insurance adds ~£0.60 in expected value to a bet that already loses £3.90 in expectation. It softens the loss slightly but doesn't fix the fundamental compounding problem." },
    { q: "Odds of 1.20 imply 83.3% probability. Actual win rate is 81%. Is this good or bad value?", a: "Bad value (−2.8% edge)", detail: "EV = 0.81 × 1.20 − 1 = 0.972 − 1 = −0.028. Even though 81% sounds like a near-certainty, the price doesn't compensate for the 19% of the time you lose." },
    { q: "You track 100 bets at average odds of 3.50. You win 22 times. Is this above or below the break-even rate?", a: "Below (need 28.6%)", detail: "Break-even win rate = 1/3.50 = 28.6%. You won 22% — well below break-even. 22 wins × £3.50 = £77 return per £100 staked. Loss: £23." },
    { q: "A punter says 'I won £500 on a 10-fold this weekend!' Their annual spend on accas is £2,000. Are they profitable?", a: "Almost certainly not", detail: "Expected annual loss on £2,000 of 10-folds: ~£2,000 × 0.63 = £1,260. One £500 win reduces this to £760 loss. They'd need to win £1,260+ in accas per year to break even, which requires extraordinary luck given the 63% expected loss rate." },
  ]
};

if (typeof window !== 'undefined') window.MODULE_12 = MODULE_12;
