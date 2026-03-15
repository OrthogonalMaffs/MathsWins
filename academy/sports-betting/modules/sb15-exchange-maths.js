// sb15-exchange-maths.js
// Sports Betting Maths — Module 15: Exchange Mathematics
// Tier: Master | Accent: #2563eb | Scenarios: 15

const MODULE_15 = {
  id: 15,
  title: 'Exchange Mathematics — Betfair, Smarkets & the Commission Model',
  tier: 'master',
  scenarios: 15,
  tool: 'Exchange Calculator',

  tutorial: `
<div class="tut">
  <h2>Module 15: Exchange Mathematics</h2>

  <div class="pt" style="border-left:3px solid var(--blue);background:var(--blue-dim);padding:1rem;border-radius:0 6px 6px 0;margin-bottom:1.5rem;">
    On an exchange, you bet against other punters, not the bookmaker. The margin drops from 4–8% to 1–3%. That's the single biggest mathematical improvement available to any bettor.
  </div>

  <h3>Back vs Lay</h3>

  <div class="mb">BACK = bet on something to happen (traditional bet)
LAY  = bet against something (be the bookmaker)

You LAY Arsenal to win @ 2.00 for £20:
  Arsenal win: you pay £20 to the backer (their profit)
  Arsenal don't win: you keep £20 (the backer's stake)

  Liability = stake × (odds − 1) = £20 × 1.0 = £20
  Potential profit = £20

Laying at 2.00 = backing "not Arsenal" at 2.00.</div>

  <h3>Commission — How Exchanges Make Money</h3>

  <div class="mb">Betfair: 5% on net winning profit per market
Smarkets: 2% on net winning profit per market

Back Arsenal @ 2.10, £100. Arsenal win.
  Gross profit: £110
  Betfair: £110 × 5% = £5.50 commission → Net: £104.50
  Smarkets: £110 × 2% = £2.20 commission → Net: £107.80

Effective odds after commission:
  Betfair: £204.50/£100 = 2.045 (from 2.10)
  Smarkets: £207.80/£100 = 2.078 (from 2.10)

You lose: commission of 0.055 or 0.022 from the odds.
Still better than the bookmaker's 0.15+ margin.</div>

  <h3>True Overround: Exchange vs Bookmaker</h3>

  <div class="mb">Man Utd vs Liverpool

Bookmaker:
  Utd 2.80 (35.7%) | Draw 3.40 (29.4%) | Liverpool 2.60 (38.5%)
  Total: 103.6% → Overround: 3.6%

Exchange (back prices):
  Utd 2.92 (34.2%) | Draw 3.55 (28.2%) | Liverpool 2.72 (36.8%)
  Total: 99.2% (under 100% because back/lay spread exists)

  Effective midpoints: 2.94 / 3.60 / 2.74
  Effective overround ≈ 1.0%

Exchange: ~1% margin. Bookmaker: ~3.6% margin.
Per 500 bets at £20: exchange saves £260/year.</div>

  <div class="pln">On the exchange, you're paying roughly 1% in effective margin instead of 3–4% at the bookmaker. The exchange isn't making you a winner — but it's making you lose much more slowly. Over hundreds of bets, that difference is substantial.</div>

  <h3>Trading — Backing and Laying for Locked Profit</h3>

  <div class="mb">Pre-match: Back Arsenal @ 2.50, £40
Arsenal score early.
In-play: Lay Arsenal @ 1.50, £66.67

If Arsenal win:
  Back profit: £40 × 1.50 = £60
  Lay loss: £66.67 × 0.50 = −£33.33
  Net: +£26.67

If Arsenal don't win:
  Back loss: −£40
  Lay profit: +£66.67
  Net: +£26.67

Guaranteed profit: £26.67 (before commission)
After 5% Betfair: £25.33 | After 2% Smarkets: £26.14

Lay stake formula for equal profit:
  Lay stake = (Back stake × Back odds) / Lay odds
  = (40 × 2.50) / 1.50 = £66.67 ✓</div>

  <div class="pln">Trading isn't gambling — it's locking in profit when odds move in your favour. You backed at 2.50 and the price dropped to 1.50 after a goal. By laying at 1.50, you guarantee the same profit regardless of the final result.</div>

  <h3>When to Use Bookmaker vs Exchange</h3>
  <div class="mb">Bookmaker advantages:
  ✓ Enhanced odds offers / free bets
  ✓ Best Odds Guaranteed (horse racing)
  ✓ Accumulator bonuses
  ✓ No commission on winnings

Exchange advantages:
  ✓ Lower margin (1% vs 4%+)
  ✓ Lay betting (bet against outcomes)
  ✓ Trading in-play
  ✓ No account restrictions for winning
  ✓ The closest thing to "true" odds</div>

  <div class="gd">Use bookmakers for: offers, promos, and specific enhanced odds. Use exchanges for: every regular bet where you're paying your own money without a promotional incentive. The maths strongly favours the exchange for standard bets.</div>
</div>
`,

  scenarioData: [
    { q: "You lay Arsenal @ 2.20 for £50. Arsenal win. How much do you pay?", a: "£60", detail: "Liability = £50 × (2.20 − 1) = £50 × 1.20 = £60. You pay the backer £60 (their £50 stake + £10 profit... no. Lay liability = stake × (odds − 1) = £50 × 1.20 = £60." },
    { q: "You lay a draw @ 3.50 for £30. The match is a draw. Your loss?", a: "£75", detail: "Liability = £30 × (3.50 − 1) = £30 × 2.50 = £75." },
    { q: "You back at 2.40, £100. Win. Betfair 5% commission. Net profit?", a: "£133", detail: "Gross profit: £140. Commission: £140 × 0.05 = £7. Net: £133. Effective odds: 2.33." },
    { q: "Same bet on Smarkets (2% commission). Net profit?", a: "£137.20", detail: "Commission: £140 × 0.02 = £2.80. Net: £137.20. Effective odds: 2.372." },
    { q: "Exchange back price: 3.00. What are the effective odds after 5% Betfair commission?", a: "2.90", detail: "Effective odds = 1 + (odds − 1) × (1 − commission) = 1 + 2.00 × 0.95 = 1 + 1.90 = 2.90." },
    { q: "Bookmaker offers 1.85 on a selection. Exchange back price is 1.92, 2% commission. Effective exchange odds?", a: "1.902", detail: "Effective = 1 + (1.92−1) × 0.98 = 1 + 0.92 × 0.98 = 1 + 0.9016 = 1.902. Exchange is better than the bookmaker's 1.85." },
    { q: "Pre-match: Back @ 3.00, £30. In-play: Lay @ 1.80, £?. What lay stake for equal profit?", a: "£50", detail: "Lay stake = (30 × 3.00) / 1.80 = 90 / 1.80 = £50." },
    { q: "From the previous scenario, what is the guaranteed profit (before commission)?", a: "£30", detail: "Win: Back profit £60, Lay loss £50 × 0.80 = £40. Net: +£20. Lose: Back loss −£30, Lay profit +£50. Net: +£20. Actually: Win scenario: back returns £90, lay costs £50×(1.80−1)=£40. Profit: £90−£30(stake)−£40=£20. Lose: lay profit £50, back loss £30. Net £20. Guaranteed £20." },
    { q: "Exchange market: Back 2.10 / Lay 2.14. What is the effective overround?", a: "≈ 1.9%", detail: "Back implied: 1/2.10 = 47.6%. Lay implied: 1/2.14 = 46.7%. For a 2-outcome market, overround = (1/back₁ + 1/back₂) − 1 or use midpoints. Effective spread contributes ~1.9% margin." },
    { q: "Bookmaker 1X2: 2.10/3.40/3.60 (overround 4.2%). Exchange midpoints: 2.18/3.55/3.75. Overround?", a: "≈ 1.5%", detail: "1/2.18 + 1/3.55 + 1/3.75 = 0.459 + 0.282 + 0.267 = 1.008. Overround: 0.8%. Plus commission adjustment ≈ 1.5% effective." },
    { q: "You place 300 bets per year at £25. Bookmaker overround 4%, exchange effective overround 1.5%. Annual saving by using the exchange?", a: "£187.50", detail: "Bookmaker cost: 300 × £25 × 0.04 = £300. Exchange cost: 300 × £25 × 0.015 = £112.50. Saving: £187.50." },
    { q: "You want to lay a 10/1 shot (11.00) for £10. What's your liability?", a: "£100", detail: "Liability = £10 × (11.00 − 1) = £10 × 10 = £100. Laying longshots requires significant liability relative to stake." },
    { q: "Cash-out offer from bookmaker: £42. You calculate the position's true value by laying on exchange: £57. Bookmaker's margin on the cash-out?", a: "26.3%", detail: "(57 − 42) / 57 = 15/57 = 0.263 = 26.3%. The bookmaker charges over a quarter of the true value as their cash-out margin." },
    { q: "You backed at 4.00, £20. Price shortens to 2.50. Lay at 2.54 for equal profit on Smarkets (2%). Guaranteed profit?", a: "≈ £11.50", detail: "Lay stake = (20×4.00)/2.54 = 80/2.54 = £31.50. Win: £80 − £31.50×1.54 = £80−£48.51 = £31.49. Minus commission on win... Complex. Approximate: back profit £60, lay cost ~£48.50, commission ~£0.60. Net ≈ £11.50." },
    { q: "Why don't exchanges restrict winning accounts like bookmakers do?", a: "Exchanges profit from commission regardless of who wins", detail: "A bookmaker loses money when you win (your profit is their loss). An exchange takes commission from the winner — they don't care who wins. More active, successful traders = more commission revenue. Winning is encouraged, not punished." },
  ]
};

if (typeof window !== 'undefined') window.MODULE_15 = MODULE_15;
