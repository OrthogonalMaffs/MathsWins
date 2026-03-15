// crypto-m5-funding.js
// Module 5: Funding Rates & Perpetual Swaps — The Mathematics of Synthetic Leverage
// Crypto Trading Maths — MathsWins Academy
// Tier: Advanced | Accent: #f97316

const CRYPTO_MODULE_5 = {
  id: 5,
  title: 'Funding Rates & Perpetual Swaps',
  tier: 'advanced',
  accent: '#f97316',

  tutorial: `
    <div class="tut">
      <h2>Module 5: Funding Rates & Perpetual Swaps</h2>

      <div class="pt" style="border-left-color:#f97316; background:rgba(249,115,22,0.08);">
        Perpetual swaps are the most traded instrument in crypto — daily volume exceeds spot by 3-5×. Unlike futures, perps never expire. They use funding rates to stay tethered to spot price. Understanding funding mathematics is essential: it determines the hidden cost of every leveraged position and creates genuine arbitrage opportunities for those who can calculate.
      </div>

      <h3>How Perps Work</h3>
      <div class="mb">
A perpetual swap tracks the spot price without an expiry date.

Traditional future: buy BTC June contract at $60,000.
  At expiry, it settles to spot price. The basis (future-spot)
  converges to zero at expiry. No mechanism needed.

Perpetual: no expiry → no natural convergence.
  Solution: funding rate — a periodic payment between
  longs and shorts that pulls the perp price toward spot.

  If perp > spot (premium): longs pay shorts.
    This discourages longs (costly to hold) and encourages
    shorts (paid to hold). Perp price falls toward spot.

  If perp < spot (discount): shorts pay longs.
    Encourages longs, discourages shorts. Price rises to spot.

Funding rate calculation:
  Funding = Position Size × Funding Rate
  Paid every 8 hours on most exchanges (Binance, Bybit).
  Some exchanges: every 1 hour (dYdX).

Typical rates:
  Neutral market: ±0.005% per 8hr
  Bullish market: +0.01% to +0.10% per 8hr (longs pay)
  Extreme bull: +0.30%+ per 8hr (longs pay heavily)
  Bearish market: -0.01% to -0.05% per 8hr (shorts pay)
      </div>

      <h3>The Annualised Cost of Holding</h3>
      <div class="mb">
Funding at 0.01% per 8 hours:
  Daily: 0.03%
  Monthly: 0.9%
  Annual: 10.95%

At 10× leverage, $10,000 position ($1,000 margin):
  Annual funding: $10,000 × 10.95% = $1,095
  That's 109.5% of your margin. In one year, funding alone
  costs more than your entire deposit.

At 0.05% per 8hr (common in bull runs):
  Annual: 54.75%
  On $10,000 at 10×: $5,475/year = 547.5% of margin.

The perp must appreciate MORE than the funding cost
for you to profit. At 0.05%/8hr, BTC needs to rise
54.75% per year JUST TO BREAK EVEN on your leveraged long.
      </div>

      <h3>Funding Rate Arbitrage (Cash & Carry)</h3>
      <div class="mb">
Delta-neutral carry trade:
  Long spot BTC + Short BTC perpetual (same size)

  Price up: spot gains, perp loses → net zero P&L on price
  Price down: spot loses, perp gains → net zero P&L on price

  But: if funding is positive, your short perp RECEIVES funding.

  $50,000 spot long + $50,000 perp short
  Funding: +0.02% per 8hr on $50,000 = $10/8hr
  Daily: $30. Monthly: $900. Annual: $10,950.
  Capital: $50,000 spot + ~$10,000 margin = $60,000.
  Yield: $10,950/$60,000 = 18.25% APR.

  Risks:
  1. Funding goes negative → you pay instead of receiving
  2. Exchange counterparty risk (your short is on the exchange)
  3. Short liquidation if price spikes and margin insufficient
  4. Basis risk if perp temporarily deviates from spot
  5. Execution: entering/exiting both legs simultaneously

  This is a REAL arbitrage used by professional desks.
  The yield is genuine but not risk-free.
      </div>

      <h3>Funding as a Sentiment Indicator</h3>
      <div class="mb">
Funding rate = real-time measure of leveraged demand.

  High positive funding (+0.05%+):
    Market is extremely long. Longs are paying a premium.
    Historically: elevated probability of a correction
    (overleveraged markets are fragile).

  High negative funding (-0.03%+):
    Market is extremely short. Shorts pay a premium.
    Historically: elevated probability of a short squeeze.

  Correlation between extreme funding and reversals:
    When BTC funding exceeds 0.05%/8hr, the probability
    of a >5% correction within 7 days is approximately 45-55%.
    Base rate for any 7-day period: ~25%.

  Funding is not a perfect signal — it's a COST signal.
  It tells you how expensive it is to hold your position.
  When the cost is extreme, the market is fragile.
      </div>

      <div class="dg" style="margin-top:1.5rem;">
        <strong>FCA risk warning:</strong> Cryptoassets are not regulated in the UK. Perpetual swap trading involves significant risk including leveraged losses exceeding deposits. Capital at risk. This is mathematical education, not financial advice.
      </div>
    </div>
  `,

  scenarios: [
    { id:'f1', type:'calculation', question:'You hold a $25,000 BTC long perp at 5× leverage ($5,000 margin). Funding rate: +0.03%/8hr. Calculate daily, weekly, monthly funding cost and express as % of margin.', answer:'Per 8hr: $25,000×0.03%=$7.50. Daily: $22.50 (0.45% of margin). Weekly: $157.50 (3.15%). Monthly: $675 (13.5%). Annual: $8,212.50 (164.25% of margin). Your margin is consumed by funding in ~7.3 months even if BTC doesn\'t move.' },
    { id:'f2', type:'calculation', question:'Design a cash-and-carry arbitrage: long $100,000 spot ETH + short $100,000 ETH perp. Funding: +0.025%/8hr. Margin for short: $20,000 (5×). Calculate annualised yield on total capital.', answer:'Funding income: $100,000×0.025%×3=$75/day. Annual: $27,375. Capital: $100,000 spot + $20,000 margin = $120,000. Yield: $27,375/$120,000=22.8% APR. Risks: funding reversal, exchange insolvency, liquidation if ETH spikes 50%+ and margin insufficient. Need to monitor and top up margin in volatile periods.' },
    { id:'f3', type:'judgement', question:'BTC funding spikes to +0.10%/8hr (annualised: 109.5%). You hold a leveraged long. What does the maths tell you?', answer:'At 0.10%/8hr, your long costs 109.5% annualised in funding — more than BTC\'s average annual return. Mathematically, holding this position has negative expected value unless you expect a very large short-term move. Additionally, extreme positive funding (>0.05%) historically correlates with a 45-55% probability of a >5% correction within 7 days. The cost is extreme AND the risk of a reversal is elevated. The mathematically rational action: reduce or close the leveraged long.' },
    { id:'f4', type:'calculation', question:'Funding rate is -0.02%/8hr (shorts pay longs). You have a $50,000 leveraged long at 3×. How much funding do you receive daily? What is the break-even price if BTC drops 2% while you earn funding for 7 days?', answer:'Funding received: $50,000×0.02%×3=$30/day. 7 days: $210. BTC drops 2%: position loss = $50,000×2%=$1,000. At 3× leverage: P&L on margin = -$1,000×3=-$3,000. Wait — position size IS $50,000, so loss = $1,000 on position. As % of margin ($16,667): -6%. Funding offsets: $210. Net loss: $1,000-$210=$790. Funding helps but doesn\'t come close to offsetting a 2% price drop. Funding is a bonus, never a hedge against directional risk.' },
    { id:'f5', type:'calculation', question:'Compare the 30-day cost of holding a $10,000 BTC long via: (a) spot (no cost), (b) 2× perp at 0.01%/8hr funding, (c) 5× perp at 0.01%/8hr, (d) 10× perp at 0.01%/8hr. All starting from $10,000 BTC exposure.', answer:'(a) Spot: $0. (b) 2× perp: position=$10,000, funding=$10,000×0.03%×30=$90. Margin=$5,000. Cost as % of margin: 1.8%. (c) 5× perp: same $10,000 position, same $90 funding. Margin=$2,000. Cost as % of margin: 4.5%. (d) 10× perp: same position, same $90 funding. Margin=$1,000. Cost as % of margin: 9.0%. The funding dollar cost is identical ($90) regardless of leverage — it\'s based on position size. But the cost as a fraction of YOUR CAPITAL increases with leverage because you\'ve committed less capital.' },
    { id:'f6', type:'judgement', question:'An exchange offers "negative funding" periods where longs get paid 0.05%/8hr. A trader plans to open a 20× long to maximise funding income. Evaluate.', answer:'Funding income on $100,000 position (at 20×, $5,000 margin): 0.05%×$100,000×3=$150/day. Looks great — $150/day on $5,000 margin = 3%/day = 1,095% APR. But: (a) negative funding means the market is bearish — price is likely falling, (b) at 20× leverage, a 4.5% drop liquidates you, (c) if BTC drops 3% (well within daily range), you lose $3,000 = 60% of margin, wiping out 20 days of funding income, (d) the funding rate can flip positive at any time. Chasing funding income with high leverage is collecting pennies in front of a steamroller — the maths of the funding income is dwarfed by the maths of the liquidation risk.' },
    { id:'f7', type:'calculation', question:'Mark price on BTC perp: $60,500. Spot BTC: $60,000. This 0.83% premium is unusual. If the funding formula is: Funding Rate = (Mark-Spot)/Spot × clamp factor, estimate the next funding rate.', answer:'Premium: ($60,500-$60,000)/$60,000 = 0.833%. Most exchanges use: Funding Rate = Average Premium Index, clamped between -0.75% and +0.75%. Raw rate: ~0.833%, clamped to 0.75%. Per 8hr period. Annualised: 0.75%×3×365=821.25%. This is an extreme rate — longs are paying 821% annualised to hold. This typically occurs only at market peaks and resolves quickly (within hours to days) through either a correction or funding-driven position closing.' },
    { id:'f8', type:'calculation', question:'You run a funding rate arbitrage for 90 days. Average funding received: 0.015%/8hr. 5 days had negative funding averaging -0.02%/8hr. Total capital: $80,000. Position: $60,000 per leg. Calculate net income.', answer:'Positive days (85): $60,000×0.015%×3×85=$60,000×0.00045×85=$2,295. Negative days (5): paid $60,000×0.02%×3×5=$60,000×0.0006×5=$180. Net funding: $2,295-$180=$2,115. On $80,000 capital over 90 days: $2,115/$80,000=2.64%. Annualised: 2.64%×(365/90)=10.7%. Real-world carry trade yield after accounting for negative funding periods is significantly lower than the headline positive rate suggests.' },
    { id:'f9', type:'judgement', question:'Why do funding rates exist at all? What would happen to perp markets without them?', answer:'Without funding, perps would disconnect from spot price. In a bull market, excess long demand would push perp price above spot indefinitely — perp buyers would pay an ever-increasing premium with no convergence mechanism. The perp would become a purely speculative instrument unanchored to reality. Funding is the mathematical mechanism that tethers perps to spot by making it expensive to hold the crowded side. It\'s essentially a continuous fee that transfers value from the majority position to the minority position, creating an incentive for arbitrageurs to take the other side and keep prices aligned.' },
    { id:'f10', type:'calculation', question:'ETH perp funding is +0.04%/8hr. You believe ETH will rise 15% over the next 30 days. At 5× leverage, is the trade +EV after funding?', answer:'Position: 5× leverage. If ETH rises 15%: return on margin = 75%. Funding cost over 30 days: 0.04%×3×30=3.6% of position. At 5× leverage, funding cost as % of margin: 3.6%×5=18%. Net return on margin if correct: 75%-18%=57%. But if wrong and ETH drops 15%: loss on margin = -75%, plus 18% funding = -93%. EV depends on your confidence. If P(+15%) = 60%: EV = 0.60×57% + 0.40×(-93%) = 34.2% - 37.2% = -3.0%. Negative EV. You need >62% confidence in a 15% rise just to break even after funding. The funding cost shifts the break-even probability substantially.' },
    { id:'f11', type:'calculation', question:'Across the BTC perp market, open interest is $30 billion. Average funding: +0.015%/8hr. How much total funding flows from longs to shorts daily?', answer:'Daily funding: $30B × 0.015% × 3 = $30B × 0.00045 = $13,500,000/day. $13.5 million flows from longs to shorts every single day at these rates. Annually: ~$4.93 billion. This is wealth transfer from retail (predominantly long, paying funding) to market makers and arbitrageurs (predominantly short/neutral, receiving funding). The funding market is one of the largest continuous wealth transfers in crypto.' },
    { id:'f12', type:'judgement', question:'A trader says "I only trade perps, never spot, because leverage lets me use less capital." What mathematical costs are they ignoring?', answer:'(1) Funding costs: 10-55%+ annualised depending on market conditions. (2) Liquidation risk: leveraged positions have a finite distance to total loss. (3) Variance drag: leveraged positions decay mathematically under volatility (Module 2). (4) Execution costs: perp spreads are often wider than spot. (5) Counterparty risk: your position exists on the exchange\'s books — if the exchange fails, your position and margin are lost (see FTX). (6) Insurance fund depletion risk: in extreme moves, the exchange\'s insurance fund may not cover all liquidations, leading to socialised losses (ADL). Using less capital ≠ taking less risk. It means concentrating more risk per pound deployed.' }
  ],

  tool: {
    name: 'Funding Rate Calculator',
    description: 'Calculate funding costs, carry trade yields, and break-even analysis.',
    inputs: [
      { id:'fr-position', label:'Position size ($)', type:'number', default:50000 },
      { id:'fr-leverage', label:'Leverage (×)', type:'number', default:5 },
      { id:'fr-rate', label:'Funding rate (%/8hr)', type:'number', default:0.01, step:0.001 },
      { id:'fr-days', label:'Holding period (days)', type:'number', default:30 },
      { id:'fr-direction', label:'Direction', type:'select', options:['Long (paying)','Short (receiving)','Cash & Carry'] }
    ],
    outputs: ['Total funding cost/income over period', 'Annualised rate', 'Cost as % of margin', 'Break-even price movement', 'Cash & carry yield (if applicable)']
  }
};

if (typeof module !== 'undefined') module.exports = CRYPTO_MODULE_5;
