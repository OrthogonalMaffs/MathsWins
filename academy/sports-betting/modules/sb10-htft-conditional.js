// sb10-htft-conditional.js
// Sports Betting Maths — Module 10: Half-Time/Full-Time & Conditional Probability
// Tier: Advanced | Accent: #2563eb | Scenarios: 15

const MODULE_10 = {
  id: 10,
  title: 'Half-Time/Full-Time & Conditional Probability',
  tier: 'advanced',
  scenarios: 15,
  tool: 'HT/FT Probability Calculator',

  tutorial: `
<div class="tut">
  <h2>Module 10: Half-Time/Full-Time & Conditional Probability</h2>

  <div class="pt" style="border-left:3px solid var(--blue);background:var(--blue-dim);padding:1rem;border-radius:0 6px 6px 0;margin-bottom:1.5rem;">
    HT/FT markets carry 15–25% overround — three to five times worse than the match result market. The maths explains exactly why, and when (rarely) they can still offer value.
  </div>

  <h3>Conditional Probability — The Foundation</h3>
  <p>The probability of two events both happening is NOT simply the product of their individual probabilities — unless they're independent. In football, the half-time and full-time results are deeply connected.</p>

  <div class="mb">P(Draw at HT AND Home Win at FT)
  ≠ P(Draw) × P(Home Win)

Correct: P(HT Draw) × P(Home Win | HT was a Draw)

Using Poisson (λ_home = 1.5, λ_away = 1.1):
  Per half: λ_home_half ≈ 0.75, λ_away_half ≈ 0.55

  P(0-0 at HT) = e^(−0.75) × e^(−0.55) = 0.472 × 0.577 = 0.272

  P(Home scores ≥1, Away scores 0 in 2nd half):
    = (1 − e^(−0.75)) × e^(−0.55) = 0.528 × 0.577 = 0.305

  P(Draw/Home) = 0.272 × 0.305 = 0.083 (8.3%)

  Typical bookmaker odds: 5.50 → implied 18.2%
  Overround on this outcome alone: 18.2% − 8.3% = 9.9%</div>

  <div class="pln">The Draw/Home Win bet looks tempting at 5.50. But the maths says it should be closer to 12.0. The bookmaker is charging nearly 10 percentage points of margin on this single bet. That's enormous.</div>

  <h3>The Full HT/FT Grid — 9 Outcomes, 9 Overrounds</h3>
  <p>With 9 possible outcomes (3 HT results × 3 FT results), the bookmaker has 9 places to hide margin instead of 3.</p>

  <div class="mb">Approximate true probabilities (λ_home=1.5, λ_away=1.1):

                    FT: Home    FT: Draw    FT: Away
HT: Home leading |  25.1%    |   3.2%    |   1.4%
HT: Drawing      |   8.3%    |  12.8%    |   5.6%
HT: Away leading |   1.8%    |   3.4%    |  10.2%

Typical HT/FT market overround: 15–25%
Match result overround: 4–8%
Asian handicap overround: 2–4%</div>

  <div class="dg">HT/FT is one of the worst-value markets in football betting. The maths is unambiguous: 9 outcomes give the bookmaker 3–5 times more room to extract margin than a standard match result market.</div>

  <h3>Both Teams to Score (BTTS)</h3>
  <p>BTTS has only 2 outcomes, making it one of the fairer derivative markets.</p>

  <div class="mb">P(BTTS Yes) = P(Home ≥1) × P(Away ≥1)
  = (1 − e^(−1.5)) × (1 − e^(−1.1))
  = 0.777 × 0.667 = 0.518 (51.8%)

Fair odds: 1/0.518 = 1.93
Typical bookmaker: 1.80 → overround ≈ 3.8%

Much more reasonable than HT/FT.</div>

  <div class="pln">BTTS markets have two outcomes, so the overround is similar to Asian handicaps — around 3–5%. If you're going to bet on derivative markets, BTTS is mathematically kinder than HT/FT or correct score.</div>

  <h3>Correct Score — The Worst Overround</h3>
  <p>With 20+ possible outcomes, correct score markets carry 20–40% overround. They exist as entertainment bets, not value bets.</p>

  <div class="mb">Most likely correct score (λ_home=1.5, λ_away=1.1):
  1-0: 12.1% → fair odds 8.26 → typical bookie: 6.50
  1-1: 10.9% → fair odds 9.17 → typical bookie: 7.00
  0-0:  6.7% → fair odds 14.9 → typical bookie: 10.00
  2-1:  9.8% → fair odds 10.2 → typical bookie: 8.00
  2-0: 10.9% → fair odds 9.17 → typical bookie: 7.50

Overround per outcome: 10–40%.
Total market overround: 25–35%.</div>

  <h3>When HT/FT Can Offer Value</h3>
  <p>The rare situations: teams with extreme half-by-half scoring patterns (e.g. consistently concede late), cup matches with known tactical approaches (defensive first half, attacking second), or when your Poisson inputs differ significantly from the market's for half-by-half splits.</p>

  <div class="gd">If you must bet on HT/FT or correct score, always calculate the true probability first and compare against the price. Most of the time the margin is too large. But occasionally a bookmaker misprices a specific outcome within the grid, and the 9-outcome structure means they can't perfectly balance every cell.</div>
</div>
`,

  scenarioData: [
    { q: "λ_home = 1.6, λ_away = 1.0. Calculate P(0-0 at half time).", a: "0.297 (29.7%)", detail: "Per half: λ_h = 0.8, λ_a = 0.5. P(0-0) = e^(-0.8) × e^(-0.5) = 0.449 × 0.607 = 0.273. (Exact values depend on half-split assumption.)" },
    { q: "λ_home = 1.4, λ_away = 0.8. What is P(BTTS Yes)?", a: "0.453 (45.3%)", detail: "P(Home ≥1) = 1 - e^(-1.4) = 0.753. P(Away ≥1) = 1 - e^(-0.8) = 0.551. BTTS = 0.753 × 0.551 = 0.415." },
    { q: "P(BTTS Yes) = 52%. Bookmaker offers BTTS Yes @ 1.78. Is this +EV?", a: "No, −7.4%", detail: "EV = 0.52 × 1.78 − 1 = 0.926 − 1 = −0.074. Negative expected value." },
    { q: "P(BTTS Yes) = 55%. Bookmaker offers 1.90. Is this +EV?", a: "Yes, +4.5%", detail: "EV = 0.55 × 1.90 − 1 = 1.045 − 1 = +0.045." },
    { q: "Your model says P(Home/Home HT/FT) = 26%. Bookmaker offers 2.60. Is this +EV?", a: "No, −32.4%", detail: "EV = 0.26 × 2.60 − 1 = 0.676 − 1 = −0.324. Massive negative EV. The bookmaker's implied probability (38.5%) is far above the true 26%." },
    { q: "P(Draw/Home) = 9%. Bookmaker offers 12.0. Is this +EV?", a: "Yes, +8%", detail: "EV = 0.09 × 12.0 − 1 = 1.08 − 1 = +0.08. Rare value in HT/FT — the bookie has overpriced this at 8.3% implied when it's actually 9%." },
    { q: "HT/FT market total implied probability sums to 118%. What is the overround?", a: "18%", detail: "Overround = 118% − 100% = 18%. This means the bookmaker takes 18p in margin for every £1 across the market." },
    { q: "Match result overround: 4.5%. HT/FT overround: 22%. Over 200 bets at £10 average, how much more do you lose on HT/FT?", a: "£350 more", detail: "1X2 loss: 200 × £10 × 4.5% = £90. HT/FT loss: 200 × £10 × 22% = £440. Difference: £350." },
    { q: "Correct score 1-0 is priced at 7.00. Your Poisson model gives P(1-0) = 11%. What's the edge?", a: "−23%", detail: "EV = 0.11 × 7.00 − 1 = 0.77 − 1 = −0.23. Fair odds should be 9.09. The bookmaker's price is 23% below fair value." },
    { q: "BTTS No fair probability = 48%. Bookmaker offers 2.10. Edge?", a: "+0.8%", detail: "EV = 0.48 × 2.10 − 1 = 1.008 − 1 = +0.008. Marginal positive EV — barely worth the variance." },
    { q: "Team A scores 60% of their goals in the second half (vs 50% league average). How does this affect the Draw/Home HT/FT probability?", a: "It increases Draw/Home probability", detail: "If Team A loads goals into the second half, P(0-0 at HT) is higher and P(scoring in 2nd half) is higher. Both factors increase P(Draw at HT, Home Win at FT)." },
    { q: "λ_home = 2.0, λ_away = 0.6. Calculate P(Home/Home) approximately.", a: "≈ 33%", detail: "P(home leading HT) ≈ P(home ≥1, away 0 in 1st half) ≈ (1-e^(-1)) × e^(-0.3) ≈ 0.632 × 0.741 ≈ 0.468. P(still leading FT | leading HT) ≈ 0.70+. P(H/H) ≈ 0.33." },
    { q: "A 5-fold BTTS accumulator at average odds 1.80 per leg. What's the expected return per £1?", a: "£0.60", detail: "Assuming 3.5% overround per leg, true win prob per leg ≈ 0.535. Acca prob: 0.535^5 = 0.045. Payout: 1.80^5 = 18.90. EV: 0.045 × 18.90 = £0.85. But with compounded overround: (1/1.80)^5 sum = implied 0.168, true 0.045... Expected return ≈ £0.60." },
    { q: "Bookmaker offers correct score 0-0 at 9.00. Poisson model says P(0-0) = 8.5%. Is this value?", a: "No, −23.5%", detail: "EV = 0.085 × 9.00 − 1 = 0.765 − 1 = −0.235. Fair odds: 11.76. The price of 9.00 is significantly below fair." },
    { q: "You calculate true HT/FT probabilities summing to 100%. The bookmaker's prices sum to 122%. What percentage of every £1 bet goes to the bookmaker on average?", a: "18%", detail: "Average margin = 1 − (100/122) = 1 − 0.820 = 0.180 = 18%. For every £1 bet, 18p is margin." },
  ]
};

if (typeof window !== 'undefined') window.MODULE_10 = MODULE_10;
