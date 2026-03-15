// crypto-m10-risk.js
// Module 10: Risk Management for Fat-Tailed Markets
// Crypto Trading Maths — MathsWins Academy
// Tier: Master | Accent: #f97316

const CRYPTO_MODULE_10 = {
  id: 10,
  title: 'Risk Management for Fat-Tailed Markets',
  tier: 'master',
  accent: '#f97316',

  tutorial: `
    <div class="tut">
      <h2>Module 10: Risk Management for Fat-Tailed Markets</h2>

      <div class="dg">
        This is the module that ties everything together. Crypto doesn't follow normal distributions. Standard risk models from traditional finance systematically underestimate the probability and severity of extreme events. This module builds a risk management framework from the ground up, designed for the actual statistical properties of crypto markets — not the convenient assumptions of textbook finance.
      </div>

      <h3>Why Normal Distribution Fails — The Evidence</h3>
      <div class="mb">
If BTC returns were normally distributed (daily σ = 3.5%):

  Observed vs Expected extreme events (2017-2025):

  Move size  | Normal expects | Actually happened | Ratio
  >2σ (>7%)  | ~17/year       | ~15/year          | 0.9× (close)
  >3σ (>10%) | ~1/year        | ~4.4/year         | 4.4× (off)
  >4σ (>14%) | 1 per 44yr     | ~1.5/year         | 66× (very off)
  >5σ (>17%) | 1 per 4,500yr  | ~0.9/year         | 4,050× (broken)

  The model works for moderate moves and fails catastrophically
  for extreme moves. This is the definition of fat tails.

Power law distribution:
  P(|r| > x) ∝ x^(-α)

  For BTC: α ≈ 2.5-3.5 (estimated from tail data)
  At α = 3:
    P(>5σ) is ~100× more likely than normal predicts
    P(>10σ) is ~10,000× more likely

  Implication: "once in a lifetime" events happen
  every 2-3 years in crypto.

  VaR (Value at Risk) models using normal distribution
  underestimate the 99% daily VaR by 40-60%.
  They underestimate the 99.9% VaR by 100-200%.

  Your risk model is wrong at exactly the moment
  it matters most — during extreme moves.
      </div>

      <h3>Expected Shortfall (CVaR) — When Things Go Wrong, HOW Wrong?</h3>
      <div class="mb">
VaR asks: "What's the maximum loss on 95% of days?"
CVaR asks: "On the 5% of days that exceed VaR, how bad is it?"

For BTC ($100,000 position):
  Normal distribution:
    95% VaR: $5,760 (5.76%)
    CVaR: $7,200 (7.2%) — on bad days, expect ~7.2% loss

  Power law adjusted:
    95% VaR: $8,640 (8.64%)
    CVaR: $14,400 (14.4%) — on bad days, expect ~14.4% loss

  The fat-tail CVaR is DOUBLE the normal CVaR.
  On the worst 5% of days, you should expect to lose
  14.4% of your BTC position — not 7.2%.

  For a leveraged position at 5×:
    CVaR = 14.4% × 5 = 72% of margin on the worst days.
    At 10×: 144% → guaranteed liquidation.
      </div>

      <h3>Kelly Criterion for Crypto</h3>
      <div class="mb">
Kelly optimal fraction: f* = (μ - r) / σ²

where:
  μ = expected return
  r = risk-free rate
  σ = volatility

For BTC:
  μ = 50% (historical average — NOT guaranteed)
  r = 5% (stablecoin lending)
  σ = 70%

  f* = (0.50 - 0.05) / 0.70² = 0.45 / 0.49 = 0.918

  Kelly says: allocate 91.8% to BTC.
  That seems aggressive. And it is — because:

Problems with Kelly in crypto:
  1. μ is uncertain. If true μ = 20% instead of 50%:
     f* = 0.15/0.49 = 30.6%. Massive difference.
  2. Fat tails mean σ understates true risk.
     Adjusted σ = 100% (fat-tail equivalent):
     f* = 0.45/1.00 = 45%. Half the original.
  3. Kelly maximises long-run growth but tolerates
     HUGE drawdowns (-50% to -80%) along the way.

  Practical rule: use HALF-Kelly or QUARTER-Kelly.
    Half-Kelly at adjusted σ: 45% / 2 = 22.5% allocation
    Quarter-Kelly: 11.25%

  This is why most quantitative funds allocate
  5-20% of portfolio to crypto — it matches
  Kelly-based sizing with conservative μ estimates.
      </div>

      <h3>Stress Testing Against Real Crashes</h3>
      <div class="mb">
Historical crypto crash scenarios:

1. March 2020 "COVID crash"
   BTC: -50% in 2 days
   ETH: -60% in 2 days
   All alts: -60% to -80%
   Correlation spike to 0.95+

2. May 2021 "China ban + leverage flush"
   BTC: -53% in 14 days ($58k → $27k)
   ETH: -59%
   $8.6 billion liquidated

3. November 2022 "FTX collapse"
   BTC: -26% in 7 days
   SOL: -68% (FTX held large SOL position)
   FTT: -97%
   $4.4 billion liquidated
   Counterparty risk realised: exchange insolvency

4. May 2022 "UST/LUNA"
   LUNA: -99.99%
   UST: -98%
   Contagion: BTC -25%, ETH -35%
   $40 billion in value destroyed

For ANY portfolio, calculate:
  "If scenario X happens again, what is my P&L?"

  $50,000 portfolio: 60% BTC, 30% ETH, 10% SOL
  March 2020 scenario:
    BTC: $30,000 × -50% = -$15,000
    ETH: $15,000 × -60% = -$9,000
    SOL: $5,000 × -75% = -$3,750
    Portfolio: -$27,750 (-55.5%)

  Can you survive that? If no, the portfolio is too aggressive.
      </div>

      <h3>Position Sizing for Crypto — Practical Framework</h3>
      <div class="mb">
Step 1: Define maximum acceptable portfolio drawdown.
  Example: I can tolerate -30% on my total portfolio.

Step 2: Stress test against worst historical scenario.
  Worst crypto crash: -50% to -85% for BTC, -95% for alts.
  If max crypto allocation × -85% = -30%:
    Max crypto allocation = 30% / 85% = 35.3%

Step 3: Apply within-crypto diversification.
  Of the 35% crypto allocation:
    BTC: 60% (least volatile, most liquid)
    ETH: 30% (moderate vol)
    Alts: 10% (highest vol, highest drawdown risk)

Step 4: Never leverage beyond Kelly.
  Kelly (conservative): ~20% of total portfolio in crypto.
  If your total portfolio is £100,000:
    Crypto: £20,000-35,000
    Of that: £12-21k BTC, £6-10k ETH, £2-3.5k alts
    Remaining £65-80k: equities, bonds, cash

Step 5: Rebalance quarterly.
  Sell crypto when it outperforms (take profits automatically).
  Buy crypto when it underperforms (average in at lower prices).

This isn't exciting. It's mathematically sound.
The exciting approaches are the ones that blow up.
      </div>

      <h3>Exit Strategy Mathematics</h3>
      <div class="mb">
Three exit frameworks, each with mathematical properties:

1. Laddered selling
   Sell 25% at 2× entry, 25% at 3×, 25% at 5×, hold 25%.
   Expected return if asset reaches 3×:
     0.25×2 + 0.25×3 + 0.50×3 (remaining held at 3×)
     = 0.50 + 0.75 + 1.50 = 2.75× average exit

   If it reaches 5×:
     0.25×2 + 0.25×3 + 0.25×5 + 0.25×5 = 3.75×

   Laddering guarantees you capture some profit
   at each level. You'll never sell perfectly.
   But you'll never sell nothing either.

2. Trailing stop
   Sell if price drops X% from the peak.
   At 20% trailing stop:
     If BTC hits $100k, stop at $80k.
     If BTC hits $120k, stop rises to $96k.

   Problem in crypto: vol is high. 20% drops are NORMAL.
   BTC has pulled back 20-30% multiple times during bull runs.
   A 20% trailing stop exits you during normal corrections.
   30-40% works better for crypto's volatility profile.

3. Time-based exit
   "I sell 10% of my crypto position on the 1st of each month."
   Dollar-cost AVERAGING OUT. Systematic. Removes emotion.
   Optimal? No. Emotional? No. Practical? Very.
      </div>

      <div class="pt" style="border-left-color:#f97316; background:rgba(249,115,22,0.08);">
        <strong>The final lesson:</strong> risk management isn't about maximising returns. It's about surviving long enough for the returns to compound. The mathematically optimal strategy means nothing if a single crash wipes you out. In a fat-tailed market like crypto, survival IS the strategy. Everything else is secondary.
      </div>

      <div class="dg" style="margin-top:1.5rem;">
        <strong>FCA risk warning:</strong> Cryptoassets are not regulated in the UK. The value of cryptoassets can go down as well as up, and you could lose all the money you invest. Past performance is not indicative of future results. Risk models are approximations and may underestimate actual losses. Capital at risk. This is mathematical education, not financial advice.
      </div>
    </div>
  `,

  scenarios: [
    { id:'r1', type:'calculation', question:'BTC position: $80,000. Daily σ=3.5%. Calculate 1-day 95% VaR under (a) normal, (b) power law adjusted (1.5× multiplier). Then calculate 99% VaR for both.', answer:'(a) Normal 95%: $80,000×1.645×3.5%=$4,606. 99%: $80,000×2.326×3.5%=$6,513. (b) Fat-tail 95%: $4,606×1.5=$6,909. 99%: $6,513×1.5=$9,770. On the worst 1% of days, you should expect to lose ~$9,770 (12.2% of position). With 5× leverage: $48,850 — more than half your margin. The normal model says $6,513; reality says closer to $9,770.' },
    { id:'r2', type:'calculation', question:'Apply Kelly criterion. Estimated BTC annual return: 30% (conservative). Risk-free: 5%. BTC vol: 70%. Calculate full Kelly and half Kelly allocation for a £200,000 portfolio.', answer:'f* = (0.30-0.05)/0.70² = 0.25/0.49 = 51.0%. Full Kelly: £200,000×51%=£102,000 in BTC. Half Kelly: £51,000. Quarter Kelly: £25,500. At conservative μ=30% and σ=70%, full Kelly is aggressively high. Half Kelly (£51k, ~25.5%) is a reasonable starting point. If you believe μ=20%: f*=0.15/0.49=30.6%. Half=15.3%=£30,600. Kelly is highly sensitive to μ estimates — use conservative μ and fractional Kelly.' },
    { id:'r3', type:'calculation', question:'Stress test: £100,000 portfolio with 40% BTC, 20% ETH, 10% SOL, 30% bonds. Apply March 2020 crash: BTC -50%, ETH -60%, SOL -75%, bonds +5%. Portfolio P&L?', answer:'BTC: £40,000×-50%=-£20,000. ETH: £20,000×-60%=-£12,000. SOL: £10,000×-75%=-£7,500. Bonds: £30,000×+5%=+£1,500. Total: -£38,000 = -38%. If max tolerable is -30%: this portfolio is too aggressive. Fix: reduce crypto to 50% total: 30% BTC, 15% ETH, 5% SOL, 50% bonds. Rerun: -£15,000-£9,000-£3,750+£2,500=-£25,250=-25.3%. Within tolerance.' },
    { id:'r4', type:'calculation', question:'You bought 1 BTC at $30,000 and it\'s now $90,000. Design a laddered exit: sell 20% at $100k, 20% at $120k, 20% at $150k, hold 40%. Calculate average exit price if BTC peaks at $130,000.', answer:'At $100k: sell 0.2 BTC for $20,000. At $120k: sell 0.2 BTC for $24,000. BTC peaks at $130k but doesn\'t reach $150k. The 0.2 at $150k and 0.4 held → value at $130k: 0.6×$130,000=$78,000 (unrealised). Cash received: $44,000 for 0.4 BTC. Average exit price for sold portion: $44,000/0.4=$110,000. If BTC then crashes to $60,000: remaining 0.6 BTC = $36,000. Total value: $44,000+$36,000=$80,000. vs holding 1 BTC: $60,000. Laddering protected $20,000. vs selling all at $90k: $90,000. Laddering underperformed a perfect top call but outperformed holding through the crash.' },
    { id:'r5', type:'judgement', question:'A trader says "I use 95% VaR for my risk limits." For crypto specifically, why is this insufficient?', answer:'95% VaR in crypto misses the events that actually destroy portfolios. (1) 95% VaR is exceeded on ~18 days/year — it tells you nothing about those 18 days. (2) The distribution of losses BEYOND VaR is what matters, and in crypto it\'s fat-tailed — losses on those 18 days can be 3-5× the VaR amount. (3) 99% VaR is better but still inadequate because crypto\'s 1% tail is heavier than normal. (4) Expected Shortfall (CVaR) is mathematically superior — it averages the losses BEYOND the VaR threshold. (5) No single risk metric is sufficient for crypto. Proper risk management uses: VaR + CVaR + stress testing against historical crashes + max drawdown limits + position-level stop losses.' },
    { id:'r6', type:'calculation', question:'Calculate the probability that a 60/40 BTC/stablecoin portfolio (no leverage) experiences a drawdown >40% within 1 year. BTC max historical annual drawdown: -73%.', answer:'Portfolio max drawdown = BTC drawdown × BTC weight = -73% × 60% = -43.8%. This exceeds 40%. So if a year like 2022 repeats: yes, >40% drawdown happens. Probability estimate: crypto bear markets of -70%+ have occurred in ~3 of the last 10 years. Rough P = 30%/year. Not all bear markets reach -73% from peak within a calendar year. Adjusting: P(>40% portfolio drawdown in any 1-year period) ≈ 15-25%. That\'s a 1-in-4 to 1-in-6 chance per year. If that\'s unacceptable: reduce BTC to 40%: max drawdown = -29.2%. Or 30%: -21.9%.' },
    { id:'r7', type:'calculation', question:'A trailing stop of 25% on BTC. BTC rises from $60k to $100k then drops 25% to $75k, triggering the stop. Calculate: (a) your profit, (b) what if BTC then rallies to $150k?', answer:'(a) Entry $60k, exit $75k (stop triggered). Profit: $15,000/BTC = +25%. (b) If BTC then rallies to $150k: you missed $75k of additional gain per BTC. The trailing stop captured +25% but missed a total of +150%. This is the mathematical trade-off: a 25% trailing stop protects against crashes but exits during normal crypto corrections (25% pullbacks happen ~2-3× per bull cycle). For crypto\'s volatility: 35-40% trailing stops are more appropriate, or use laddered exits which don\'t exit entirely.' },
    { id:'r8', type:'calculation', question:'Your crypto portfolio has 5 tokens with the following weights and betas to BTC: BTC(40%, β=1.0), ETH(25%, β=1.3), SOL(15%, β=1.8), LINK(10%, β=1.5), DOGE(10%, β=3.5). What is the portfolio\'s effective beta to BTC?', answer:'Portfolio β = Σ(weight × β) = 0.40×1.0 + 0.25×1.3 + 0.15×1.8 + 0.10×1.5 + 0.10×3.5 = 0.40+0.325+0.27+0.15+0.35 = 1.495. If BTC drops 20%: expected portfolio drop = 20%×1.495 = 29.9%. Your "diversified" 5-token portfolio amplifies BTC\'s drops by 50%. The DOGE allocation alone (10% weight, β=3.5) contributes 0.35 to portfolio beta — as much as 25% in ETH. High-beta positions disproportionately drive portfolio risk.' },
    { id:'r9', type:'judgement', question:'You have 10% of your net worth in crypto. After a bull run, it\'s now 45% of your net worth. What does mathematical risk management say to do?', answer:'Rebalance. The position has grown from your intended 10% to 45% through appreciation — the risk has grown 4.5× without any conscious decision. At 45% crypto, a 50% crash costs 22.5% of net worth. At 10%: 5%. You\'ve inadvertently moved from conservative to aggressive allocation through inaction. Mathematical action: sell enough crypto to return to 10% (or a higher target like 20% if your risk tolerance has changed). Reinvest proceeds into lower-correlation assets. This IS "selling the top" — not by prediction, but by mathematical discipline. Rebalancing automatically sells assets that have appreciated beyond your target weight.' },
    { id:'r10', type:'calculation', question:'Compare the impact of a -50% BTC crash on three portfolios: (A) 100% BTC, (B) 50% BTC / 50% stablecoin rebalanced monthly, (C) 30% BTC / 40% equities / 30% bonds (correlations: BTC/equity=0.40, equity/bond=-0.20).', answer:'(A) -50%. Recovery needed: +100%. (B) If crash happens instantly: BTC portion -50% = -25% portfolio. USDC unchanged. Total: -25%. Better. But if crash develops over months with rebalancing: you buy more BTC as it falls (rebalancing), so losses may be slightly higher (-27 to -30%) but recovery is faster because you accumulated more BTC at lower prices. (C) BTC: -50% on 30% = -15%. Equities correlated at 0.40: equities drop ~20% (50%×0.40). Equities: -20% on 40% = -8%. Bonds: typically rally in crashes (flight to safety). +5% on 30% = +1.5%. Total: -15-8+1.5=-21.5%. Portfolio C loses -21.5% vs -50% for A. And recovery from -21.5% needs +27.4% vs +100% for A. Diversification across asset classes is the single most effective risk management tool.' },
    { id:'r11', type:'calculation', question:'You want to limit your maximum possible crypto loss to £10,000. Your total investable assets: £80,000. BTC worst case: -85%. Calculate the maximum BTC allocation.', answer:'Max loss = allocation × worst_case. £10,000 = allocation × 85%. Max allocation = £10,000/0.85 = £11,765. As percentage: £11,765/£80,000 = 14.7%. You can hold a maximum of ~14.7% in BTC (£11,765) if you want to limit your worst-case loss to £10,000. For alts with -95% worst case: max = £10,000/0.95 = £10,526 (13.2%). This is the basis of risk budgeting: decide the loss you can tolerate, then work backwards to the position size.' },
    { id:'r12', type:'judgement', question:'Summarise the core mathematical principles of crypto risk management in 5 rules.', answer:'(1) SIZE FOR THE TAILS, NOT THE AVERAGE. Crypto has fat tails. Size positions assuming 5σ events happen annually, not once per millennium. Use power law VaR, not Gaussian VaR. (2) VOLATILITY DETERMINES POSITION SIZE. Vol-adjust everything: £1,000 of BTC ≠ £1,000 of FTSE in risk terms. It\'s ≈ £4,500 of FTSE. (3) DIVERSIFICATION REQUIRES CROSSING ASSET CLASSES. 10 crypto tokens at ρ=0.80 give you 1.2 independent bets. Add equities and bonds to genuinely reduce risk. (4) REBALANCE SYSTEMATICALLY. Sell winners, buy losers, maintain target weights. The maths of rebalancing harvests volatility — and crypto has maximum volatility to harvest. (5) DEFINE YOUR MAX LOSS BEFORE YOU ENTER. Work backwards from tolerable loss → position size. Never let a winning position grow to dominate your portfolio through inaction. Survival is the strategy. Everything else is secondary.' },
    { id:'r13', type:'calculation', question:'A DeFi user has $200,000 deployed across 5 protocols. Estimate portfolio-level smart contract risk if each protocol has an independent 4% annual exploit probability.', answer:'P(at least one exploit) = 1 - P(all safe) = 1 - (1-0.04)^5 = 1 - 0.96^5 = 1 - 0.8154 = 18.46%. There\'s an 18.5% chance that at least one protocol is exploited in a year. If evenly distributed ($40k each): expected loss = 5 × ($40,000 × 4%) = $8,000/year. That\'s a 4% drag on total returns — equivalent to subtracting 4% from every APY calculation. At $200k with a 10% average yield: $20,000 yield - $8,000 expected exploit loss = $12,000 net. The 10% headline becomes 6% after smart contract risk. And this is for INDEPENDENT protocols — if they share code or dependencies, the risk is higher (correlated exploit probability).' },
    { id:'r14', type:'calculation', question:'Calculate the "ruin probability" — the chance of losing 90%+ of a $50,000 crypto portfolio over 5 years. Portfolio: 70% BTC (σ=70%), 30% stablecoin. Assume log-normal returns with μ=30%/year for BTC.', answer:'Portfolio annual return: 0.70×30%+0.30×5%=22.5%. Portfolio annual σ: 0.70×70%=49% (simplified). 90% portfolio loss means BTC drops to ~14% of current value (since stablecoin cushions). For BTC: need -86% from starting level at any point in 5 years. BTC log return distribution over 5 years: μ_5yr=5×22.5%=112.5%, σ_5yr=49%×√5=109.5%. P(log return < ln(0.14)) = P(r < -197%). Z-score: (-197%-112.5%)/109.5% = -2.83. P(Z<-2.83)≈0.23%. But with fat tails (×3 for power law): ~0.7%. Plus path-dependency: the -86% could be hit intra-year even if the 5-year return is positive. Realistic ruin probability: 1-3% for this portfolio. Low but non-zero — and the consequence is catastrophic.' },
    { id:'r15', type:'judgement', question:'What is the single most important mathematical concept in crypto risk management, and why?', answer:'Drawdown asymmetry: the percentage gain needed to recover from a percentage loss. A -50% loss needs +100% to recover. A -90% needs +900%. This single mathematical fact should drive every decision: (1) it\'s why position sizing matters more than entry price, (2) it\'s why leverage in volatile markets is mathematically self-defeating (small drawdowns become large, large become irrecoverable), (3) it\'s why rebalancing works (it prevents any single position from growing large enough to cause portfolio-level ruin), (4) it\'s why survival is the primary objective — you can recover from -30% in a year; you cannot recover from -90% in a decade. Every mathematical tool in this course — VaR, Kelly, correlation, stress testing — exists to prevent you from reaching the right side of the drawdown table. Because the right side of that table is where portfolios go to die.' }
  ],

  tool: {
    name: 'Crypto Risk Dashboard',
    description: 'Comprehensive risk analysis: VaR, stress tests, Kelly sizing, drawdown probability.',
    inputs: [
      { id:'rd-portfolio', label:'Portfolio (asset:weight:vol, comma-separated)', type:'text', default:'BTC:50:70,ETH:25:90,USDC:25:0' },
      { id:'rd-total', label:'Portfolio value ($)', type:'number', default:50000 },
      { id:'rd-max-dd', label:'Max tolerable drawdown (%)', type:'number', default:30 },
      { id:'rd-mu', label:'Expected annual return (%)', type:'number', default:25 },
      { id:'rd-rf', label:'Risk-free rate (%)', type:'number', default:5 }
    ],
    outputs: ['Portfolio σ (normal and fat-tail adjusted)', '1-day, 7-day, 30-day VaR (95% and 99%)', 'CVaR (Expected Shortfall)', 'Kelly optimal crypto allocation', 'Stress test: March 2020, May 2021, Nov 2022 scenarios', 'Max position size for tolerable drawdown', 'Ruin probability (5-year)', 'Rebalancing recommendation']
  }
};

if (typeof module !== 'undefined') module.exports = CRYPTO_MODULE_10;
