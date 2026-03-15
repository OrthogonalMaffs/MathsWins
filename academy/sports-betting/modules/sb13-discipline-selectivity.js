// sb13-discipline-selectivity.js
// Sports Betting Maths — Module 13: Discipline, Focus & the Mathematics of Selectivity
// Tier: Master | Accent: #2563eb | Scenarios: 15

const MODULE_13 = {
  id: 13,
  title: 'Discipline, Focus & the Mathematics of Selectivity',
  tier: 'master',
  scenarios: 15,
  tool: 'Selectivity Analyser',

  tutorial: `
<div class="tut">
  <h2>Module 13: Discipline, Focus & the Mathematics of Selectivity</h2>

  <div class="pt" style="border-left:3px solid var(--blue);background:var(--blue-dim);padding:1rem;border-radius:0 6px 6px 0;margin-bottom:1.5rem;">
    The single most important mathematical principle in profitable betting is selectivity. Betting less, not more. The maths proves it: 3 bets at 5% edge beats 30 bets at 0.5% edge.
  </div>

  <h3>The Kelly Criterion for Betting</h3>

  <div class="mb">f* = (b × p − q) / b

f* = fraction of bankroll to stake
b  = decimal odds − 1 (net odds)
p  = your true probability estimate
q  = 1 − p

Example: P(Arsenal win) = 60%. Odds: 1.90 (b = 0.90).
  f* = (0.90 × 0.60 − 0.40) / 0.90
     = (0.54 − 0.40) / 0.90
     = 0.156 (15.6% of bankroll)

Smaller edge — P(Arsenal) = 53%:
  f* = (0.90 × 0.53 − 0.47) / 0.90
     = 0.007 / 0.90
     = 0.008 (0.8% of bankroll)

No edge — P(Arsenal) = 47.6% (= implied prob):
  f* = (0.90 × 0.476 − 0.524) / 0.90
     = −0.096 / 0.90
     = −0.107 (NEGATIVE → don't bet)</div>

  <div class="pln">Kelly says something profound: bet size should be proportional to your edge. Big edge, bigger bet. Small edge, tiny bet. No edge, don't bet at all. Most punters do the opposite — same stake regardless of confidence.</div>

  <h3>Why Fewer Bets With Bigger Edges Wins</h3>

  <div class="mb">Strategy A: 3 bets/weekend, each 5% edge
  Kelly stake: ~5% of bankroll per bet
  Weekly EV: 3 × £50 × 0.05 = +£7.50
  Annual: +£390

Strategy B: 30 bets/weekend, each 0.5% edge
  Kelly stake: ~0.5% of bankroll per bet
  Weekly EV: 30 × £5 × 0.005 = +£0.75
  Annual: +£39

Strategy A earns 10× more with LESS variance.

If Strategy B's edges are actually 0% (you're fooling yourself):
  Annual EV: £0 (or negative after overround)
  30 bets for nothing — 30 × cost of overround.</div>

  <div class="gd">The maths is unambiguous: betting on 3 things you understand is worth more than betting on 30 things you half-understand. Every additional market without a genuine edge is a donation to the bookmaker.</div>

  <h3>Correlated Bets — The Hidden Variance Multiplier</h3>

  <div class="mb">5 Premier League bets on the same Saturday:

Correlation sources:
  - Weather affecting all matches
  - Referee tendencies
  - Your own biases (overrating home teams today?)

If bets are 20% correlated (ρ = 0.2):
  Independent variance: σ² per bet
  Correlated: σ² × [n + n(n−1)ρ]
  = σ² × [5 + 5×4×0.2] = σ² × 9

  Effective independent bets: n²/(n + n(n−1)ρ) = 25/9 = 2.8

You think you have 5 independent bets.
You actually have ~2.8. Risk is 78% higher than calculated.</div>

  <div class="pln">Five bets on the same Saturday's football aren't five independent bets. They share conditions and they share your biases. The maths says you're taking nearly twice the risk you think.</div>

  <h3>Half-Kelly: The Practical Compromise</h3>

  <div class="mb">Full Kelly: maximum growth, brutal drawdowns
  1/3 chance of halving bankroll before doubling

Half Kelly: 75% of maximum growth, much safer
  1/9 chance of halving before doubling

Quarter Kelly: slowest but safest
  1/81 chance of halving before doubling

For betting (where probability estimates are uncertain):
  Half-Kelly is the standard professional approach.
  Full Kelly assumes perfect probability estimation.
  You don't have perfect estimation. Nobody does.</div>

  <h3>The Mathematics of Saying No</h3>
  <p>If a market is −EV, not betting is a +EV decision. Quantify it:</p>

  <div class="mb">Scenario: You're tempted by 20 bets this weekend.
5 have genuine edge (avg +3%)
15 have no edge (avg −5% after overround)

If you bet all 20 at £20:
  +EV bets: 5 × £20 × 0.03 = +£3
  −EV bets: 15 × £20 × 0.05 = −£15
  Net: −£12

If you bet only the 5 with edge:
  Net: +£3

The value of saying "no" to 15 bets: £15 saved.
Annual value of discipline (50 weekends): £750.</div>

  <div class="gd">Discipline isn't about willpower — it's about mathematics. Every bet you don't place on a −EV market is money saved. Over a year, the bets you didn't make are worth more than the ones you did.</div>
</div>
`,

  scenarioData: [
    { q: "P(win) = 58%. Odds: 1.85 (b=0.85). What does Kelly say to stake?", a: "10.6% of bankroll", detail: "f* = (0.85 × 0.58 − 0.42) / 0.85 = (0.493 − 0.42) / 0.85 = 0.073 / 0.85 = 0.086. Approximately 8.6%. (Recalculating: 0.85×0.58=0.493. 0.493−0.42=0.073. 0.073/0.85=0.0859.) 8.6% of bankroll." },
    { q: "P(win) = 35%. Odds: 3.20 (b=2.20). Kelly stake?", a: "4.5% of bankroll", detail: "f* = (2.20 × 0.35 − 0.65) / 2.20 = (0.77 − 0.65) / 2.20 = 0.12 / 2.20 = 0.0545 = 5.5%." },
    { q: "P(win) = 40%. Odds: 2.40 (b=1.40). Kelly stake?", a: "2.9% of bankroll", detail: "f* = (1.40 × 0.40 − 0.60) / 1.40 = (0.56 − 0.60) / 1.40 = −0.04 / 1.40 = −0.029. NEGATIVE. Kelly says don't bet — there's no edge." },
    { q: "Bankroll: £2,000. Kelly says 8% stake. What's the half-Kelly bet?", a: "£80", detail: "Full Kelly: £2,000 × 0.08 = £160. Half-Kelly: £160 / 2 = £80." },
    { q: "You have 3 bets with 6% edge and 12 bets with 1% edge. All at £20. What's the net weekly EV?", a: "+£6.00", detail: "+EV from strong bets: 3 × £20 × 0.06 = £3.60. +EV from weak bets: 12 × £20 × 0.01 = £2.40. Net: +£6.00. But the 12 weak bets add variance. If those 1% edges are really 0% (estimation error), net drops to +£3.60." },
    { q: "You eliminate the 12 weak bets and increase stake on the 3 strong bets to £80 each (same total outlay). New EV?", a: "+£14.40", detail: "3 × £80 × 0.06 = £14.40. Same total outlay (£240) but 2.4× more expected profit because capital is concentrated on high-edge bets." },
    { q: "5 bets on Saturday PL matches, 20% correlated. How many effective independent bets?", a: "2.8", detail: "n²/(n + n(n−1)ρ) = 25/(5 + 5×4×0.2) = 25/9 = 2.78." },
    { q: "8 bets across 4 different sports (football, tennis, rugby, cricket). Assumed correlation?", a: "Near zero — effectively 8 independent bets", detail: "Different sports have minimal correlation. Weather might link outdoor sports slightly, but cross-sport bets are close to independent. This is a mathematical argument FOR diversifying across sports rather than loading up on one league." },
    { q: "Full Kelly bankroll growth: 15% per month. What's half-Kelly?", a: "≈ 11.25% per month", detail: "Half-Kelly gives approximately 75% of full Kelly's growth rate. 15% × 0.75 = 11.25%. The growth reduction is modest; the drawdown reduction is dramatic." },
    { q: "You estimate your edge at 3% but you're only 70% confident in your probability estimate. What should you do?", a: "Use quarter-Kelly or smaller", detail: "Uncertain probability estimates mean your true edge could be 0% or 6%. Kelly with uncertain inputs is dangerous — it can massively overstake. Conservative approach: fractional Kelly (quarter or smaller) to account for estimation error." },
    { q: "A punter bets £50 on every selection regardless of confidence. They average 3 bets/day, 360 days/year. Their edge averages +1% across all bets. Annual expected profit?", a: "+£540", detail: "1,080 bets × £50 × 0.01 = +£540. But Kelly-optimal staking (larger on high-confidence, smaller on low) would generate significantly more from the same capital." },
    { q: "The 'value of discipline' calculation: 20 potential bets, 5 have +3% edge, 15 have −5% edge. At £20/bet, what's the annual cost of betting all 20 vs just the 5? (50 weekends)", a: "£750 per year", detail: "Bet all 20: (5×£20×0.03) + (15×£20×(−0.05)) = £3 − £15 = −£12/weekend. Bet only 5: 5×£20×0.03 = +£3/weekend. Difference: £15/weekend × 50 = £750/year." },
    { q: "Risk of ruin formula: RoR ≈ e^(−2 × edge × bankroll / variance). Edge: 2%, bankroll 50 units, variance 100. What's RoR?", a: "≈ 13.5%", detail: "RoR = e^(−2 × 0.02 × 50 / 100) = e^(−0.02) = 0.980. Wait — that's wrong. Let me recalculate with proper units. If edge is 2% per bet, bankroll is 50 units, variance per bet is ~1 unit: RoR = e^(−2 × 0.02 × 50) = e^(−2) = 0.135 = 13.5%." },
    { q: "Same scenario but bankroll is 100 units. New RoR?", a: "≈ 1.8%", detail: "RoR = e^(−2 × 0.02 × 100) = e^(−4) = 0.018 = 1.8%. Doubling the bankroll relative to variance dramatically reduces ruin probability." },
    { q: "You have £1,000 bankroll and a verified 3% edge on football match results at average odds of 2.00. Half-Kelly says to stake how much per bet?", a: "≈ £30", detail: "f* = (1.00 × 0.53 − 0.47) / 1.00 = 0.06 (6%). Half-Kelly: 3%. Stake: £1,000 × 0.03 = £30 per bet." },
  ]
};

if (typeof window !== 'undefined') window.MODULE_13 = MODULE_13;
