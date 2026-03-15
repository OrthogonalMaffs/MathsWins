// crypto-m3-leverage.js
// Module 3: Leverage & Liquidation — The Mathematics of Margin
// Crypto Trading Maths — MathsWins Academy
// Tier: Basic | Accent: #f97316

const CRYPTO_MODULE_3 = {
  id: 3,
  title: 'Leverage & Liquidation — The Mathematics of Margin',
  tier: 'basic',
  accent: '#f97316',

  tutorial: `
    <div class="tut">
      <h2>Module 3: Leverage & Liquidation</h2>

      <div class="pt" style="border-left-color:#ef5350; background:rgba(239,83,80,0.08);">
        Leverage amplifies returns in both directions. In crypto, it's available at 2× to 125× — meaning a 1% move can wipe your entire position. This module teaches the exact mathematics of liquidation, the probability of getting liquidated at each leverage level, and how exchanges profit from your liquidation. The maths is not complicated. The consequences of ignoring it are.
      </div>

      <h3>Leverage Fundamentals</h3>

      <div class="mb">
Position = Margin × Leverage

£1,000 margin at 10× leverage = £10,000 position.
You control £10,000 of BTC with £1,000 of your money.
The exchange lends you the other £9,000.

If BTC rises 5%:
  Position gain: £10,000 × 5% = £500
  Your return: £500 / £1,000 margin = +50%

If BTC falls 5%:
  Position loss: £10,000 × 5% = £500
  Your return: -£500 / £1,000 margin = -50%

If BTC falls 10%:
  Position loss: £10,000 × 10% = £1,000
  Your margin is gone. £1,000 / £1,000 = -100%.
  LIQUIDATION. Position forcibly closed. Margin = zero.
      </div>

      <h3>Liquidation Price — The Exact Formula</h3>

      <div class="mb">
Long position:
  Liquidation price = Entry × (1 - 1/Leverage + maintenance_margin)

  At 10× leverage (maintenance margin ~0.5%):
  Liq price = Entry × (1 - 0.10 + 0.005) = Entry × 0.905
  → 9.5% below entry

  At 20×: Entry × (1 - 0.05 + 0.005) = Entry × 0.955
  → 4.5% below entry

  At 50×: Entry × (1 - 0.02 + 0.005) = Entry × 0.985
  → 1.5% below entry

  At 100×: Entry × (1 - 0.01 + 0.005) = Entry × 0.995
  → 0.5% below entry

Short position:
  Liquidation price = Entry × (1 + 1/Leverage - maintenance_margin)

  At 10×: Entry × 1.095 → 9.5% above entry

Summary — distance to liquidation:
  2×:   ~49%     5×:   ~19%
  10×:  ~9.5%    20×:  ~4.5%
  50×:  ~1.5%    100×: ~0.5%
      </div>

      <div class="pln">
        At 10× leverage, a 9.5% move against you is total loss. At 50× leverage, a 1.5% move wipes you out. BTC regularly moves 5% in a day. ETH regularly moves 8%. At 20× leverage on ETH, a single average-volatility day can liquidate you. The formula is simple. The consequences are absolute.
      </div>

      <h3>Probability of Liquidation</h3>

      <div class="mb">
Given BTC daily σ ≈ 3.5%, what's the probability of
reaching liquidation price within N days?

Using a simplified random walk model:
P(hit level L within N days) depends on L/σ ratio and N.

At 10× leverage (liquidation at -9.5%):
  -9.5% / 3.5% = 2.7σ daily move needed
  P(within 1 day): ~0.35%
  P(within 7 days): ~5.2%
  P(within 30 days): ~15.8%
  P(within 90 days): ~28.3%

At 20× (liquidation at -4.5%):
  -4.5% / 3.5% = 1.3σ
  P(within 1 day): ~9.7%
  P(within 7 days): ~38.2%
  P(within 30 days): ~62.5%
  P(within 90 days): ~81.0%

At 50× (liquidation at -1.5%):
  -1.5% / 3.5% = 0.43σ
  P(within 1 day): ~33.2%
  P(within 7 days): ~82.5%
  P(within 30 days): ~96.8%

At 100× (liquidation at -0.5%):
  P(within 1 day): ~44.3%
  P(within 7 days): ~94.2%

50× leverage has a 97% chance of liquidation within a month.
100× leverage barely survives a single day.

These are mathematical facts, not opinions. The random walk
model slightly underestimates risk because it ignores
fat tails and volatility clustering — the real probabilities
are WORSE than these numbers.
      </div>

      <div class="dg">
        20× leverage on BTC gives you a 62% chance of being liquidated within 30 days. Not a 62% chance of losing money — a 62% chance of losing ALL your margin. And this assumes normal distribution; with fat tails, the actual probability is higher. If you wouldn't flip a coin for your entire position, you shouldn't use 20× leverage in crypto.
      </div>

      <h3>How Exchanges Profit From Your Liquidation</h3>

      <div class="mb">
When you get liquidated, the exchange doesn't just close
your position at zero. They close it at a profit.

Liquidation fee: typically 0.5-1.5% of position value
Insurance fund contribution: 0.5% of remaining margin

Example — 10× long BTC at $60,000, $1,000 margin:
  Position: $10,000
  Liquidation price: ~$54,300

  At liquidation:
    Exchange closes position at $54,300
    Liquidation fee: $10,000 × 0.75% = $75
    Insurance fund: $10,000 × 0.50% = $50
    You receive: $0 (margin is gone)
    Exchange keeps: $75 (fee) + $50 (insurance) = $125

  Across millions of liquidations per year:
    May 2021 crash: ~$8.6 billion liquidated in 24 hours
    At 0.75% average fee: ~$64.5 million in liquidation fees
    in a single day.

    FTX collapse (Nov 2022): ~$4.4 billion liquidated
    Exchanges earned ~$33 million in liquidation fees.

  The exchange has a mathematical incentive for you to get
  liquidated. They earn fees on the liquidation itself.
  They also earn trading fees from the forced sell order
  that your liquidation creates.

  Liquidation is not a neutral event. It's a revenue line
  for the exchange.
      </div>

      <h3>Funding Costs — The Silent Drain</h3>

      <div class="mb">
Holding a leveraged position costs money even when the
price doesn't move.

Funding rate (perpetual swaps):
  Paid every 8 hours. Typical: 0.01-0.03% per period.

  At 0.01% per 8 hours:
    Daily: 0.03%
    Monthly: 0.9%
    Annual: 10.95%

  At 10× leverage, your POSITION pays 10.95% of its notional
  value annually. On a $10,000 position ($1,000 margin):
    Annual funding cost: $10,000 × 10.95% = $1,095
    That's 109.5% of your margin — per year.

  At 0.03% per 8 hours (common in bull markets):
    Annual: 32.85%
    On $10,000 position: $3,285/year = 328% of margin.

  Funding rates are the invisible tax on leveraged positions.
  Most traders never calculate the annualised cost.
  They hold a leveraged long for weeks and wonder why
  they're losing money despite the price going sideways.
      </div>

      <h3>Cross Margin vs Isolated Margin</h3>

      <div class="mb">
Isolated margin: only the margin for THIS position is at risk.
  Liquidation affects this trade only.
  Your other funds are safe.
  Downside: tighter liquidation price.

Cross margin: your ENTIRE account balance is used as margin.
  Wider liquidation distance (more collateral backing the trade).
  But if liquidated: you can lose your entire account,
  not just the position margin.

Example — $10,000 account, 10× long $5,000:
  Isolated: $500 margin, liquidation at -9.5%. Max loss: $500.
  Cross: $10,000 backing, liquidation at -95%. Max loss: $10,000.

  Cross margin feels safer (wider liq distance).
  But the maximum loss is 20× larger.
  You're protecting one trade by risking everything else.
      </div>

      <div class="pt" style="border-left-color:#f97316; background:rgba(249,115,22,0.08);">
        The mathematically rational approach to leverage in crypto: (1) never use more than 3-5× on any position, (2) always use isolated margin, (3) calculate the annualised funding cost before opening, (4) know your liquidation price before you enter, (5) accept that even at 5× with isolated margin, you have a ~20% chance of liquidation within 30 days on BTC. If those numbers aren't acceptable, the position is too large or the leverage is too high.
      </div>

      <div class="dg" style="margin-top:1.5rem;">
        <strong>FCA risk warning:</strong> Cryptoassets are not regulated in the UK. Leveraged crypto trading can result in losses exceeding your initial deposit. Capital at risk. This is mathematical education, not financial advice.
      </div>
    </div>
  `,

  scenarios: [
    { id:'l1', type:'calculation', question:'You open a 10× long on ETH at $3,200 with $2,000 margin. What is your position size, liquidation price (0.5% maintenance margin), and the dollar distance to liquidation?', answer:'Position: $2,000×10=$20,000. Liq price: $3,200×(1-0.10+0.005)=$3,200×0.905=$2,896. Distance: $3,200-$2,896=$304 (9.5%). Dollar loss at liquidation: $2,000 (entire margin).' },
    { id:'l2', type:'calculation', question:'BTC at $65,000. You short at 25× with $4,000 margin. Calculate your liquidation price and the probability of reaching it within 7 days (BTC daily σ=3.5%).', answer:'Position: $100,000. Liq price: $65,000×(1+0.04-0.005)=$65,000×1.035=$67,275. Distance: 3.5% above entry. P(BTC rises 3.5%+ within 7 days): 3.5%/3.5%=1.0σ. P(hitting +1σ within 7 days)≈45-55%. Roughly a coin flip for liquidation within a week.' },
    { id:'l3', type:'calculation', question:'Compare the annual funding cost of holding a $50,000 BTC long at 5× leverage. Funding rate scenarios: (a) 0.01%/8hr (normal), (b) 0.03%/8hr (bullish), (c) -0.01%/8hr (bearish — you GET paid).', answer:'(a) 0.01%×3×365=10.95%/year. Cost: $50,000×10.95%=$5,475. On $10,000 margin: 54.75% of capital. (b) 0.03%×3×365=32.85%. Cost: $16,425/year=164% of margin. (c) -0.01%: you receive $5,475/year. In bearish markets, longs get paid — but the position is likely underwater from price movement. Funding is a cost in trending markets and a reward in counter-trend — but the price P&L almost always dwarfs the funding.' },
    { id:'l4', type:'judgement', question:'An exchange offers 125× leverage on BTC. At BTC daily σ=3.5%, calculate the liquidation distance and the probability of surviving 24 hours.', answer:'Liquidation distance: 1/125=0.8% minus maintenance≈0.5% above that. Effectively ~0.3-0.5% move liquidates you. At 3.5% daily σ, a 0.5% move is 0.14σ — happens constantly within hours. P(liquidation within 24 hours)≈48-52%. It\'s essentially a coin flip whether you survive a single day. 125× leverage in crypto is mathematically indistinguishable from a casino bet with a near-50% loss probability.' },
    { id:'l5', type:'calculation', question:'You have $10,000. Compare isolated 10× ($1,000 margin) vs cross margin on a $10,000 BTC long. What is the liquidation price for each, and the maximum loss?', answer:'Isolated: $1,000 margin on $10,000 position. Liq price: entry×0.905. Max loss: $1,000 (10% of account). Cross: $10,000 backing $10,000 position. Liq price: entry×(1-10000/10000+0.005)=entry×0.005≈essentially impossible to liquidate unless BTC drops 99.5%. Max loss: $10,000 (100% of account). Cross feels safe but risks everything. Isolated caps loss at the margin allocated.' },
    { id:'l6', type:'calculation', question:'May 2021: BTC dropped 35% in 7 days ($58k→$37.7k). Calculate the fate of positions at 3×, 5×, 10×, and 20× leverage.', answer:'Liquidation distances: 3×≈32%, 5×≈19%, 10×≈9.5%, 20×≈4.5%. A 35% drop: 3× barely survived (35% vs 32% liq) — would have been in margin call territory. 5× liquidated (35%>19%) — around day 3. 10× liquidated (35%>9.5%) — within first day. 20× liquidated (35%>4.5%) — within first hours. Only unleveraged or very low leverage (2-3×) survived this drawdown.' },
    { id:'l7', type:'judgement', question:'A trader says "I use 50× leverage but with tight stop-losses at 0.5%, so my risk is controlled." What mathematical problem does this create?', answer:'At 50× leverage, liquidation is at ~1.5%. A 0.5% stop sounds tight, but: (a) in crypto, 0.5% moves happen multiple times per hour — the stop will trigger constantly from noise, not signal, (b) slippage on stop orders can be 0.2-1% in volatile conditions, meaning the stop may execute at 0.7-1.5% — near or at liquidation anyway, (c) if the market gaps (common in crypto), the stop may not execute at all and you jump straight to liquidation, (d) each stopped-out trade costs spread + fees, so constant triggering is a death by a thousand cuts. Tight stops on high leverage is mathematically self-defeating.' },
    { id:'l8', type:'calculation', question:'You\'re considering a delta-neutral funding rate harvest: long BTC spot, short BTC perpetual at the same size. Funding rate: 0.02%/8hr (you receive). Position: $50,000 each side. Calculate the annualised yield and identify the risks.', answer:'Funding income: 0.02%×3×365=21.9%/year on $50,000=$10,950. Capital deployed: $50,000 spot + margin for short (at 5×: $10,000)=$60,000. Yield: $10,950/$60,000=18.25% annualised. Risks: (a) funding can go negative (you\'d pay), (b) exchange counterparty risk on the short side, (c) liquidation risk on short if price rises sharply and margin is insufficient, (d) basis risk if perp deviates from spot. The yield is real but not risk-free.' },
    { id:'l9', type:'calculation', question:'Exchange charges 0.75% liquidation fee + 0.50% insurance fund contribution. In a crash, 50,000 positions get liquidated with average position size $5,000. How much does the exchange earn?', answer:'Per liquidation: $5,000×(0.75%+0.50%)=$5,000×1.25%=$62.50. Total: 50,000×$62.50=$3,125,000. Plus trading fees from the forced sells: 50,000×$5,000×0.05%=$125,000. Total exchange revenue from the crash: ~$3.25 million. Crashes are profit events for exchanges — they earn from liquidation fees, insurance contributions, and the trading volume generated by forced selling.' },
    { id:'l10', type:'judgement', question:'After reading this module, someone says "so I should never use leverage in crypto." Is that the mathematically correct conclusion?', answer:'Not quite. The conclusion is that leverage must be proportional to your edge and inversely proportional to volatility. Kelly criterion says: f*=(bp-q)/b where p is your win probability and b is the payoff ratio. For most retail traders with no quantifiable edge, Kelly optimal leverage is 0× (don\'t bet). For traders with genuine, measured edge: Kelly typically recommends 1-3× in crypto\'s volatility regime. 5× is aggressive even with strong edge. Above 5× is mathematically unjustifiable for any holding period longer than hours.' },
    { id:'l11', type:'calculation', question:'You open a 5× long BTC at $60,000. The price drops to $55,000 (8.3% drop). What is your P&L as a percentage of margin? If you add $2,000 more margin ("averaging down"), what is your new liquidation price?', answer:'Position: 5× means $5 of exposure per $1 margin. 8.3% drop × 5× = 41.5% loss on margin. If initial margin was $2,000, position = $10,000. Loss: $10,000×8.3%=$830. Remaining margin: $1,170. Adding $2,000: new margin = $3,170. Position still $10,000 at current value $9,170. New liq distance from current: ($3,170-maintenance)/$9,170≈34%. New liq price: $55,000×(1-0.34)≈$36,300. You\'ve widened the liquidation buffer but doubled your capital at risk. If BTC recovers to $60k, you profit. If it drops further, you lose $3,170 instead of $1,170.' },
    { id:'l12', type:'judgement', question:'Why do most exchanges set the default leverage to 20× or higher when the maths shows this is almost certain to result in liquidation?', answer:'Revenue model alignment. Exchanges earn from: (a) trading fees — higher leverage = larger position = more fees, (b) liquidation fees — 0.5-1.5% per liquidation, (c) spread — forced liquidation sells into the bid, widening spread, (d) insurance fund — contributions from liquidations build a reserve the exchange controls. A trader using 20× who gets liquidated generates more revenue than a trader using 2× who holds for months. The default high leverage is a business decision, not a risk management recommendation. The maths of liquidation probability is a feature of the exchange\'s revenue model, not a bug.' }
  ],

  tool: {
    name: 'Liquidation Calculator',
    description: 'Calculate liquidation prices, probabilities, and funding costs for leveraged positions.',
    inputs: [
      { id:'liq-entry', label:'Entry price ($)', type:'number', default:60000 },
      { id:'liq-leverage', label:'Leverage (×)', type:'number', default:10 },
      { id:'liq-margin', label:'Margin ($)', type:'number', default:1000 },
      { id:'liq-direction', label:'Direction', type:'select', options:['Long','Short'] },
      { id:'liq-vol', label:'Daily vol (%)', type:'number', default:3.5 },
      { id:'liq-funding', label:'Funding rate (%/8hr)', type:'number', default:0.01 }
    ],
    outputs: ['Position size', 'Liquidation price and % distance', 'P(liquidation) within 1/7/30/90 days', 'Daily/monthly/annual funding cost', 'Funding cost as % of margin', 'Break-even price movement after funding']
  }
};

if (typeof module !== 'undefined') module.exports = CRYPTO_MODULE_3;
