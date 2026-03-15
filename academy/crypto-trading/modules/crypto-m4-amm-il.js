// crypto-m4-amm-il.js
// Module 4: AMM & Liquidity Pool Mathematics — Impermanent Loss from First Principles
// Crypto Trading Maths — MathsWins Academy
// Tier: Basic | Accent: #f97316

const CRYPTO_MODULE_4 = {
  id: 4,
  title: 'AMM & Impermanent Loss — The Mathematics of Liquidity Provision',
  tier: 'basic',
  accent: '#f97316',

  tutorial: `
    <div class="tut">
      <h2>Module 4: Impermanent Loss from First Principles</h2>

      <div class="pt" style="border-left-color:#f97316; background:rgba(249,115,22,0.08);">
        Impermanent loss is the most important concept in DeFi and the least understood. This module derives it from the constant product formula, proves the IL formula algebraically, and shows exactly when LP returns exceed holding. No hand-waving. Just maths.
      </div>

      <h3>The Constant Product Formula — Deep Dive</h3>

      <div class="mb">
Uniswap v2: x × y = k

x = quantity of Token A, y = quantity of Token B
k is preserved during every swap (before fees).

Spot price of A in terms of B: P = y/x

After someone buys Δx of Token A:
  New x' = x - Δx
  New y' = k / x' = k / (x - Δx)
  Buyer pays: y' - y = k/(x-Δx) - k/x = k·Δx / [x(x-Δx)]

This is why price impact grows with trade size:
the denominator x(x-Δx) shrinks as Δx grows.
      </div>

      <h3>Deriving Impermanent Loss</h3>

      <div class="mb">
Setup:
  You deposit x₀ of Token A and y₀ of Token B.
  Initial price: P₀ = y₀/x₀
  k = x₀ × y₀

Price moves to P₁ = r × P₀ (where r = price ratio)

The pool rebalances. New quantities must satisfy:
  x₁ × y₁ = k
  y₁/x₁ = P₁ = r × P₀

Solving:
  x₁ = √(k/P₁) = √(x₀·y₀ / (r·P₀)) = x₀/√r
  y₁ = √(k·P₁) = √(x₀·y₀·r·P₀) = y₀·√r

Value of LP position at new price:
  V_LP = x₁·P₁ + y₁ = (x₀/√r)·(r·P₀) + y₀·√r
       = x₀·P₀·√r + y₀·√r
       = √r·(x₀·P₀ + y₀)

Value if you just held:
  V_HOLD = x₀·P₁ + y₀ = x₀·r·P₀ + y₀

Since x₀·P₀ = y₀ (equal value deposit):
  V_LP   = √r · 2y₀ = 2y₀√r
  V_HOLD = r·y₀ + y₀ = y₀(1+r)

Impermanent Loss:
  IL = V_LP/V_HOLD - 1
     = 2√r/(1+r) - 1

THIS IS THE FORMULA. Memorise it.
      </div>

      <div class="mb">
IL at various price ratios:

  r (price ratio) | Price change | IL
  0.50            | -50%         | -5.72%
  0.75            | -25%         | -1.03%
  0.90            | -10%         | -0.14%
  1.00            |   0%         |  0.00%
  1.10            | +10%         | -0.11%
  1.25            | +25%         | -0.60%
  1.50            | +50%         | -2.02%
  2.00            | +100%        | -5.72%
  3.00            | +200%        | -13.40%
  5.00            | +400%        | -25.46%
  10.00           | +900%        | -42.54%

Key insight: IL is SYMMETRICAL.
A 2× move up causes the same IL as a 2× move down (0.5×).
IL = 2√r/(1+r) - 1 depends only on the ratio, not direction.
      </div>

      <div class="pln">
        If ETH doubles, you'd have been better off just holding. Your LP position is worth 5.7% less than if you'd done nothing. If ETH goes up 10×, you've lost 42.5% compared to holding. The pool constantly sells your winners and buys your losers — that's the rebalancing mechanism, and it's the mathematical source of impermanent loss.
      </div>

      <h3>When Do Fees Overcome IL?</h3>

      <div class="mb">
LP profit = Fees earned - Impermanent loss

Fee income depends on:
  - Volume through the pool
  - Fee tier (0.01%, 0.05%, 0.30%, 1.00%)
  - Your share of the pool

Break-even: Fees ≥ IL

Example: ETH/USDC 0.30% fee pool
  Your deposit: $10,000 (your share: 1%)
  Daily volume: $2,000,000
  Daily fees to you: $2,000,000 × 0.30% × 1% = $60/day

  If ETH moves 50% over 30 days:
    IL = 2.02% of $10,000 = $202
    Fees earned: $60 × 30 = $1,800
    Net profit: $1,800 - $202 = $1,598

  If ETH moves 200% over 30 days:
    IL = 13.40% of $10,000 = $1,340
    Fees earned: $1,800
    Net profit: $1,800 - $1,340 = $460 (barely positive)

  If ETH moves 400% over 30 days:
    IL = 25.46% of $10,000 = $2,546
    Fees earned: $1,800
    Net LOSS: -$746

  The higher the volatility, the more fees you need to
  compensate. This is why stable pairs (USDC/USDT) with
  low IL and steady fees are the safest LP strategies,
  and volatile pairs are the most dangerous.
      </div>

      <h3>Concentrated Liquidity (Uniswap v3)</h3>

      <div class="mb">
V3 lets you provide liquidity in a PRICE RANGE instead of
across all prices. This amplifies both fees AND IL.

Example: ETH at $3,000. You LP in the $2,500-$3,500 range.

Capital efficiency: your liquidity is concentrated where
trades actually happen, so you earn more fees per dollar
deposited. Typical amplification: 5-50× vs full-range.

But IL is also amplified:
  If ETH moves outside your range ($3,500+), your position
  becomes 100% USDC (you've sold all your ETH at prices
  between $3,000-$3,500). You've capped your upside.

  If ETH drops below $2,500, your position becomes 100% ETH
  (you've bought ETH all the way down). You hold the losing
  asset.

  Within range: fees are amplified 5-50×
  Outside range: you hold 100% of the losing side

Concentrated liquidity is a leveraged LP position.
Higher reward within range. Catastrophic if price leaves range.
      </div>

      <div class="pln">
        "Impermanent" is misleading. The loss is only impermanent if the price returns to where you entered. In crypto, where tokens can go to zero or up 100×, the price often never returns. For most volatile pairs, impermanent loss is just... loss.
      </div>

      <div class="dg" style="margin-top:1.5rem;">
        <strong>FCA risk warning:</strong> Cryptoassets are not regulated in the UK. Providing liquidity in DeFi pools involves risk of impermanent loss, smart contract exploit, and total loss of deposited assets. Capital at risk.
      </div>
    </div>
  `,

  scenarios: [
    { id:'il1', type:'calculation', question:'You deposit $5,000 ETH + $5,000 USDC into a pool. ETH rises 60%. Calculate IL using the formula and the dollar value of IL.', answer:'r=1.60. IL=2√1.60/(1+1.60)-1=2×1.265/2.60-1=2.530/2.60-1=0.9731-1=-2.69%. Dollar IL: $10,000×(1+0.60/2)×2.69%... More precisely: V_HOLD=$5,000×1.60+$5,000=$13,000. V_LP=$13,000×(1-0.0269)=$12,650. IL=$350.' },
    { id:'il2', type:'calculation', question:'Same pool. ETH drops 60% (r=0.40). Calculate IL. Compare to the r=1.60 case above — what do you notice?', answer:'r=0.40. IL=2√0.40/(1+0.40)-1=2×0.632/1.40-1=1.265/1.40-1=-0.0964=-9.64%. Wait — let me recalculate. For r=0.40: 2√0.40=2×0.6325=1.265. 1+0.40=1.40. IL=1.265/1.40-1=-0.0964=-9.64%. For r=1.60: IL was -2.69%. These are NOT symmetrical in this case because r=0.40 and r=1.60 are not reciprocals. The reciprocal of 1.60 is 0.625, which would give the same IL. r=0.40 (60% drop) is a much more extreme move than r=1.60 (60% rise) — the price ratio matters, not the percentage change.' },
    { id:'il3', type:'calculation', question:'ETH/USDC pool, 0.30% fees, $5M daily volume. Your share: 0.5%. ETH moves 2× over 60 days. Are you profitable?', answer:'Daily fees: $5M×0.30%×0.5%=$75/day. 60-day fees: $4,500. IL at r=2.0: 5.72% of position. If position started at $20,000: IL=$1,144. Net: $4,500-$1,144=$3,356 profit. Profitable — the high volume generates enough fees to overcome the IL. But if volume dropped to $1M/day: fees=$900 over 60 days, net=-$244 (loss).' },
    { id:'il4', type:'calculation', question:'You provide concentrated liquidity on ETH/USDC in the $2,800-$3,200 range. ETH is at $3,000. Capital efficiency is 15× vs full range. If ETH moves to $3,500, what happens to your position?', answer:'ETH at $3,500 is above your $3,200 upper bound. Your position is now 100% USDC — you sold all your ETH as the price rose through $3,000-$3,200. You captured fees while in range (at 15× efficiency) but you\'ve capped your upside at $3,200. If you\'d held ETH: gain from $3,000→$3,500=16.7%. Your LP position: gained fees + sold ETH at prices between $3,000-$3,200. The IL of concentrated liquidity when price leaves range is severe — you hold 100% of the worse-performing asset.' },
    { id:'il5', type:'calculation', question:'USDC/USDT stable pool, 0.01% fee tier. Daily volume: $50M. Your deposit: $100,000 (0.2% share). Price ratio stays near 1.00. Calculate annual return and IL.', answer:'Daily fees: $50M×0.01%×0.2%=$10/day. Annual: $3,650. IL: near zero (stablecoins maintain 1:1). Annual return: $3,650/$100,000=3.65% APR. Low but consistent, minimal IL risk. Main risk: smart contract exploit or stablecoin depeg. This is the "boring" LP strategy — and often the most mathematically sound.' },
    { id:'il6', type:'judgement', question:'A new token XYZ/ETH pool advertises 500% APR from fees. XYZ has been live for 2 weeks. Should you LP?', answer:'Red flags: (a) 500% APR on a 2-week-old token is likely driven by initial hype volume that won\'t sustain, (b) new tokens have extreme volatility — r could easily reach 5× or 0.2× within weeks, meaning IL of 25%+, (c) 2-week-old smart contract = unproven security, (d) the token could be a rug pull. If volume drops 80% (common after launch hype), APR drops to 100%. Subtract estimated IL of 10-25% from a volatile pair, smart contract risk premium of 10-30%, and gas costs. The real expected return is likely negative. High headline APR on new tokens is a mathematical trap.' },
    { id:'il7', type:'calculation', question:'Prove that IL is always negative (or zero) for any price change. What is the maximum possible IL?', answer:'IL = 2√r/(1+r) - 1. By AM-GM inequality: (1+r)/2 ≥ √r for all r>0. Therefore 2√r/(1+r) ≤ 1, so IL ≤ 0. Equality holds only at r=1 (no price change). Maximum IL approaches -100% as r→0 or r→∞. At r→0 (token goes to zero): IL→2×0/(1+0)-1=-1=-100%. At r→∞: IL→2√r/r-1→0-1=-100% (approaches -100% asymptotically). In practice, if a token goes to zero, you\'ve lost half your LP position (the token side) and kept the other (the stable side). The IL is -50% compared to holding, but the holding would also be -50% (half your portfolio was the token). Both paths lead to similar losses when a token dies.' },
    { id:'il8', type:'calculation', question:'Compare providing $10,000 to a full-range ETH/USDC pool vs concentrated $2,500-$3,500 range (10× efficiency). ETH at $3,000. Volume: $10M/day. Calculate fees for each if ETH stays at $3,000 for 30 days.', answer:'Full range: share depends on total pool size. If pool=$100M, your share=0.01%. Daily fees: $10M×0.30%×0.01%=$3/day. 30 days: $90. Concentrated (10× efficiency): effective liquidity=$100,000. If similar-range LPs total $20M, your share=0.5%. Daily: $10M×0.30%×0.5%=$150/day. 30 days: $4,500. Concentrated earns 50× more in fees while price stays in range. But if ETH moves to $3,600 on day 15, the concentrated position is 100% USDC and earns zero fees thereafter. Full range continues earning regardless of price.' },
    { id:'il9', type:'judgement', question:'Someone says "IL doesn\'t matter because I\'m earning 50% APR in fees." Under what price movement does IL exceed 50% annual fees?', answer:'50% APR on position = 50% of value earned in fees over a year. Need IL > 50% of position value. IL=50%: solve 2√r/(1+r)-1=-0.50. 2√r=0.50(1+r). 4r=0.25(1+r)². 4r=0.25+0.5r+0.25r². 0.25r²-3.5r+0.25=0. r=(3.5±√(12.25-0.25))/0.5=(3.5±3.464)/0.5. r≈13.93 or r≈0.072. Price must move ~14× up or drop ~93% for IL to equal 50%. This seems extreme, but in crypto: many altcoins drop 90%+ in bear markets, and some rise 10×+ in bull markets. Over a full market cycle, these moves are not uncommon for volatile pairs.' },
    { id:'il10', type:'calculation', question:'You LP $20,000 in an ETH/USDC pool. Over 90 days: fees=$2,400, ETH price went from $3,000 to $4,200 (r=1.40). Calculate your total return vs holding, in dollar terms.', answer:'IL at r=1.40: 2√1.40/(1+1.40)-1=2×1.183/2.40-1=2.366/2.40-1=-0.0142=-1.42%. V_HOLD: $10,000 ETH×1.40+$10,000 USDC=$14,000+$10,000=$24,000. Gain from holding: $4,000. V_LP before fees: $24,000×(1-0.0142)=$23,659. LP gain before fees: $3,659. LP gain after fees: $3,659+$2,400=$6,059. Holding gain: $4,000. LP outperformed by $2,059. At r=1.40, fees comfortably beat IL. This is the sweet spot: moderate price movement, high volume.' },
    { id:'il11', type:'judgement', question:'Why is the term "impermanent" loss misleading, and what would be a more mathematically accurate name?', answer:'"Impermanent" implies the loss reverses if price returns to the starting level — which is true. But in crypto: (a) tokens that drop 90% rarely return to their original price, (b) tokens that 10× rarely come back down to the original price either, (c) the opportunity cost is real even if temporary — capital locked in a losing LP position could have been deployed elsewhere. A more accurate name: "divergence loss" (loss from price divergence between the two tokens) or "rebalancing cost" (the cost of the AMM continuously rebalancing your portfolio). The loss is real, measurable, and in most cases permanent for volatile assets.' },
    { id:'il12', type:'calculation', question:'Calculate the "IL break-even volume" — the minimum daily volume needed for a $50,000 LP position (0.30% fee, 1% pool share) to break even against IL if the price ratio reaches 1.50 over 30 days.', answer:'IL at r=1.50: 2.02%. Dollar IL: $50,000 adjusted value × 2.02%. V_HOLD=$50,000×(1+0.50)/2+$50,000/2=$37,500+$25,000=$62,500. IL=$62,500×2.02%=$1,263. Need 30 days of fees ≥ $1,263. Daily fees needed: $1,263/30=$42.10. Daily fee income = Volume × 0.30% × 1%. $42.10 = V × 0.003 × 0.01. V = $42.10/0.00003 = $1,403,333/day. Need ~$1.4M daily volume to break even. Below that, you\'d have been better off just holding.' }
  ],

  tool: {
    name: 'Impermanent Loss Calculator',
    description: 'Calculate IL, fee income, and net LP return vs holding.',
    inputs: [
      { id:'il-deposit', label:'Deposit value ($)', type:'number', default:10000 },
      { id:'il-price-ratio', label:'Price ratio (new/old)', type:'number', default:1.50, step:0.01 },
      { id:'il-fee-tier', label:'Fee tier (%)', type:'number', default:0.30, step:0.01 },
      { id:'il-volume', label:'Daily volume ($)', type:'number', default:5000000 },
      { id:'il-pool-share', label:'Your pool share (%)', type:'number', default:0.10, step:0.01 },
      { id:'il-days', label:'Holding period (days)', type:'number', default:30 }
    ],
    outputs: ['IL percentage and dollar amount', 'Fee income over period', 'Net return vs holding', 'Break-even volume for this price move', 'Equivalent APR after IL']
  }
};

if (typeof module !== 'undefined') module.exports = CRYPTO_MODULE_4;
