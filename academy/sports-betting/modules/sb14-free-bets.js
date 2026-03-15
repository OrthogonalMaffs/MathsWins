// sb14-free-bets.js
// Sports Betting Maths — Module 14: Free Bet Mathematics
// Tier: Master | Accent: #2563eb | Scenarios: 15

const MODULE_14 = {
  id: 14,
  title: 'Free Bet Mathematics',
  tier: 'master',
  scenarios: 15,
  tool: 'Free Bet Calculator',

  tutorial: `
<div class="tut">
  <h2>Module 14: Free Bet Mathematics</h2>

  <div class="pt" style="border-left:3px solid var(--blue);background:var(--blue-dim);padding:1rem;border-radius:0 6px 6px 0;margin-bottom:1.5rem;">
    Bookmakers give away millions in free bets. Most punters waste them on accumulators. The maths of free bet extraction is precise — and the optimal strategy maximises every penny.
  </div>

  <h3>What a Free Bet Is Actually Worth</h3>

  <div class="mb">A "free £20 bet" is NOT worth £20.

SNR (Stake Not Returned) — the standard type:
  Value = Face Value × (Odds − 1) / Odds

  At 2.00: £20 × 1/2     = £10.00 (50%)
  At 3.00: £20 × 2/3     = £13.33 (67%)
  At 5.00: £20 × 4/5     = £16.00 (80%)
  At 10.00: £20 × 9/10   = £18.00 (90%)

Higher odds → higher free bet value.

SR (Stake Returned) — rare:
  Value = Face Value (at any odds) = 100%
  Use on shortest odds to minimise variance.</div>

  <div class="pln">SNR free bets: back the longshot. SR free bets: back the favourite. The optimal strategy for each is the exact opposite — and most punters don't know the difference.</div>

  <h3>Qualifying Bets — The Cost of Unlocking</h3>

  <div class="mb">"Bet £20 get £20 free" offer:

Step 1: Qualifying bet
  £20 at odds 2.00, ~5% overround
  Expected loss: £20 × 0.05 = £1.00

Step 2: Free bet (SNR)
  £20 at odds 5.00
  Expected value: £20 × 4/5 = £16.00

Net profit: £16.00 − £1.00 = £15.00
Retention: £15 / £20 = 75%

Most sign-up offers yield 60–80% of face value.</div>

  <h3>Lay-Off for Guaranteed Profit</h3>
  <p>With access to a betting exchange, convert expected value into guaranteed profit.</p>

  <div class="mb">£20 SNR free bet. Back @ 5.00, Lay @ 5.20, 2% commission.

Lay stake = £20 × (5.00−1) / [(5.20−1) + (1−0.02)]
         = 80 / [4.20 + 0.98] = 80 / 5.18 = £15.44

If selection wins:
  Bookmaker: +£80 (profit, no stake return)
  Exchange: −£15.44 × 4.20 = −£64.85
  Net: +£15.15

If selection loses:
  Bookmaker: £0
  Exchange: +£15.44 × 0.98 = +£15.13
  Net: +£15.13

Guaranteed: ~£15.14 regardless of result.
Retention: 75.7% of face value. No gambling involved.</div>

  <div class="pln">By laying off, you turn a probabilistic free bet into guaranteed cash. A £20 free bet becomes ~£15 in your pocket regardless of the result. This is arithmetic, not gambling.</div>

  <h3>Offer Types Ranked by Value</h3>

  <div class="mb">Expected retention rate by offer type:

1. "Bet X get X free" (SNR):     60–80%  ← Best standard offer
2. Enhanced odds (e.g. 30/1):     Variable, sometimes 100%+
3. "Bet X get X in small bets":   50–70%
4. "Money back if you lose":      30–50%
5. "Acca insurance":              5–15%   ← Worst. Encourages −EV accas.

Acca insurance is designed to make you feel safe
about a mathematically terrible bet. The free bet
you get back if one leg loses is worth ~60% of stake.
On a bet that already has 30%+ compounded overround,
it barely dents the expected loss.</div>

  <div class="dg">If you find yourself spending excessive time or money chasing offers, please contact the National Gambling Helpline: 0808 8020 133 (free, 24/7). Understanding the mathematics of offers is educational — but the human element matters more than the maths.</div>
</div>
`,

  scenarioData: [
    { q: "£30 SNR free bet at odds 3.00. Expected value?", a: "£20.00", detail: "EV = £30 × (3−1)/3 = £30 × 2/3 = £20.00. Retention: 66.7%." },
    { q: "£50 SNR free bet at odds 8.00. Expected value?", a: "£43.75", detail: "EV = £50 × 7/8 = £43.75. Retention: 87.5%." },
    { q: "£25 SR free bet at odds 1.50. Expected value?", a: "£25.00", detail: "SR free bets are worth face value at any odds. EV = £25.00. Use on short odds to minimise variance." },
    { q: "Qualifying bet: £20 at 1.80, 4% overround. Free bet: £20 SNR at 4.00. Net expected profit?", a: "£14.20", detail: "Qualifier cost: £20 × 0.04 = £0.80. Free bet EV: £20 × 3/4 = £15.00. Net: £15.00 − £0.80 = £14.20." },
    { q: "Qualifying bet: £10 at 2.50, 6% overround. Free bet: £10 SNR at 2.00. Net expected profit?", a: "£4.40", detail: "Qualifier cost: £10 × 0.06 = £0.60. Free bet EV: £10 × 1/2 = £5.00. Net: £5.00 − £0.60 = £4.40." },
    { q: "You use a £20 SNR free bet on a 10-fold accumulator at combined odds of 500. Is this smart?", a: "No — expected value is the same as a single bet at 500", detail: "EV = £20 × (500−1)/500 = £19.96. Retention is 99.8% which sounds great, but P(winning) = ~0.2%. You'll almost certainly get £0. A single bet at odds 5.00 gives EV = £16 with 20% chance of collecting. Same EV-per-stake-ratio, but the single bet actually pays out regularly." },
    { q: "£20 SNR free bet. Back @ 4.00, Lay @ 4.10, 5% commission. Calculate the guaranteed profit.", a: "≈ £14.30", detail: "Lay stake = 20 × 3 / (3.10 + 0.95) = 60 / 4.05 = £14.81. Win: £60 − £14.81×3.10 = £60 − £45.91 = £14.09. Lose: £14.81 × 0.95 = £14.07. Guaranteed ≈ £14.08." },
    { q: "£50 SNR free bet. Back @ 6.00, Lay @ 6.40, 2% commission. Guaranteed profit?", a: "≈ £36", detail: "Lay stake = 50 × 5 / (5.40 + 0.98) = 250 / 6.38 = £39.18. Win: £250 − £39.18×5.40 = £250 − £211.57 = £38.43. Lose: £39.18 × 0.98 = £38.40. Guaranteed ≈ £38.41." },
    { q: "The back-lay spread is 4.00/4.50. Is this good for a lay-off?", a: "Poor — the spread is too wide", detail: "A spread of 0.50 on odds of 4.00 means the lay liability is significantly higher relative to the back profit. Ideal spreads are 0.02–0.10. At 0.50, you're losing substantial value to the spread. Look for tighter markets." },
    { q: "You have 5 different bookmaker sign-up offers, each 'bet £20 get £20 free'. Total expected profit if done optimally?", a: "≈ £75", detail: "5 × ~£15 per offer = £75. Each offer costs ~£1 in qualifying bet overround and returns ~£16 from the free bet." },
    { q: "A bookmaker offers 'enhanced odds: Arsenal to win at 6.00 (was 1.80), max £10'. What is this worth?", a: "Up to £42 in extra expected value", detail: "Normal EV at 1.80: (implied 55.6% win) × £10 × 1.80 = £10.00. Enhanced EV: 0.556 × £10 × 6.00 = £33.33. Extra EV = £33.33 − £10.00 = £23.33. If you can lay at 1.82: guaranteed profit = £10×6 − lay liability = significant. Best enhanced odds offers can exceed 100% retention." },
    { q: "'Money back as free bet if your team loses by exactly 1 goal.' Your team is 1.90 to win. How often does the insurance trigger?", a: "≈ 15–20% of the time", detail: "Losing by exactly 1 goal is one specific score margin. In a typical match, this happens roughly 15–20% of the time. The 'insurance' triggers rarely, and when it does, the free bet is worth ~60% of stake. Net insurance value: ~12% of stake. Barely moves the needle." },
    { q: "You can do 20 sign-up offers across different bookmakers over a month. Average free bet: £25, average retention 70%. Monthly income?", a: "£350", detail: "20 × £25 × 0.70 = £350. This is the mathematical basis of 'matched betting' — it works because the maths is sound, but it requires discipline, record-keeping, and eventually bookmakers limit your accounts." },
    { q: "After completing all sign-up offers, reload offers average £5 free bet, 3 per week. Annual value?", a: "≈ £546", detail: "3 × £5 × 0.70 retention × 52 weeks = £546. Lower per-offer but compounds over a year." },
    { q: "Should you use free bets on accumulators?", a: "Never (for SNR free bets)", detail: "An SNR free bet has the same expected value whether used as a single or an acca. But singles give you a reasonable chance of collecting (e.g. 20% at odds 5.00) while a 10-fold acca at odds 1000 gives you 0.1% chance. Same EV, wildly different variance. Use free bets as singles on the longest odds available for consistent returns." },
  ]
};

if (typeof window !== 'undefined') window.MODULE_14 = MODULE_14;
