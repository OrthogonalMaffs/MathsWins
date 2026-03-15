// crypto-m8-correlation.js
// Module 8: Correlation & Portfolio Mathematics
// Crypto Trading Maths — MathsWins Academy
// Tier: Master | Accent: #f97316

const CRYPTO_MODULE_8 = {
  id: 8,
  title: 'Correlation & Portfolio Mathematics — Diversification in Crypto',
  tier: 'master',
  accent: '#f97316',

  tutorial: `
    <div class="tut">
      <h2>Module 8: Correlation & Portfolio Mathematics</h2>

      <div class="pt" style="border-left-color:#f97316; background:rgba(249,115,22,0.08);">
        "I'm diversified — I hold BTC, ETH, SOL, AVAX, and MATIC." This is the most common portfolio mistake in crypto. These assets are correlated at 0.75-0.95 in downturns. They all crash together. This module teaches the mathematics of correlation, what genuine diversification looks like, and how to construct a portfolio that doesn't implode in a crisis.
      </div>

      <h3>Correlation in Crypto — The Numbers</h3>
      <div class="mb">
Correlation coefficients (ρ) for major crypto pairs:

  BTC/ETH:   ρ ≈ 0.85 (normal), 0.92+ (crashes)
  BTC/SOL:   ρ ≈ 0.75 (normal), 0.88+ (crashes)
  ETH/alts:  ρ ≈ 0.80-0.90
  Alt/Alt:   ρ ≈ 0.70-0.85

  During November 2022 (FTX collapse):
    BTC/ETH: 0.96    BTC/SOL: 0.93
    Everything correlated above 0.90.

Cross-asset correlations:
  BTC/S&P 500: ρ ≈ 0.30-0.50 (variable, increasing recently)
  BTC/Gold:    ρ ≈ 0.10-0.30
  BTC/Bonds:   ρ ≈ 0.00-0.20
  BTC/USD:     ρ ≈ -0.20 to -0.40

Key: crypto-to-crypto correlation is HIGH.
Crypto-to-traditional-assets correlation is LOW to MODERATE.
True diversification requires CROSSING asset classes.
      </div>

      <h3>Portfolio Variance with Correlated Assets</h3>
      <div class="mb">
For 2 assets: σ²_p = w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂

50/50 BTC(σ=70%)/ETH(σ=90%), ρ=0.85:
  σ²_p = 0.25×0.49 + 0.25×0.81 + 2×0.25×0.85×0.70×0.90
       = 0.1225 + 0.2025 + 0.2678 = 0.5928
  σ_p = 77.0%

Average of individual σ: (70+90)/2 = 80%
Reduction: (80-77)/80 = 3.75%

A 50/50 BTC/ETH portfolio reduces risk by less than 4%.
You've "diversified" into two assets and gained almost nothing.

Compare: 50/50 BTC(70%)/S&P 500(16%), ρ=0.40:
  σ²_p = 0.25×0.49 + 0.25×0.0256 + 2×0.25×0.40×0.70×0.16
       = 0.1225 + 0.0064 + 0.0224 = 0.1513
  σ_p = 38.9%

Weighted average σ: 43%. Reduction: 9.5%.
Still modest, but 2.5× the diversification benefit.
And the max drawdown in a crypto crash is dramatically
reduced by the S&P allocation holding relatively steady.
      </div>

      <h3>Beta — How Alts Amplify BTC Moves</h3>
      <div class="mb">
β = how much an asset moves relative to BTC.
  β = 1.0: moves in line with BTC
  β = 1.5: moves 50% more than BTC (both up and down)
  β = 2.0: double BTC's moves

Typical betas (to BTC):
  ETH:  β ≈ 1.2-1.4
  SOL:  β ≈ 1.5-2.0
  AVAX: β ≈ 1.5-2.0
  Small alts: β ≈ 2.0-5.0
  Meme coins: β ≈ 3.0-10.0

If BTC drops 20%:
  ETH drops ~25% (β=1.3)
  SOL drops ~35% (β=1.75)
  Meme coin drops ~60-80% (β=3-4)

Your "diversified" 5-coin portfolio doesn't reduce risk.
It AMPLIFIES it through high-beta exposure.
      </div>

      <h3>The Mathematics of Rebalancing</h3>
      <div class="mb">
Rebalancing: returning portfolio to target weights periodically.

50/50 BTC/USDC portfolio, rebalanced monthly:
  BTC rises 20%: portfolio now 54.5/45.5
  Rebalance: sell 4.5% BTC, buy USDC → back to 50/50
  You've sold high.

  BTC drops 20%: portfolio now 44.4/55.6
  Rebalance: sell 5.6% USDC, buy BTC → back to 50/50
  You've bought low.

  Rebalancing mechanically implements "buy low, sell high"
  without any forecasting or emotional decision-making.

  Historical backtests (BTC/USD, 2015-2025, monthly rebalance):
    Hold 100% BTC: ~85% annualised return, -85% max drawdown
    Hold 50/50, rebalanced monthly: ~55% return, -45% drawdown
    Risk-adjusted (Sharpe): rebalanced portfolio wins.

  The rebalancing bonus comes from harvesting volatility.
  The more volatile the asset, the more rebalancing adds value.
  Crypto is extremely volatile → rebalancing is extremely valuable.
      </div>

      <div class="pln">
        Rebalancing doesn't require predicting the market. It requires discipline: sell what's gone up, buy what's gone down, maintain your target weights. The maths does the rest. In a high-volatility environment like crypto, the rebalancing bonus can add 5-15% annualised return compared to a static allocation.
      </div>

      <div class="dg" style="margin-top:1.5rem;">
        <strong>FCA risk warning:</strong> Cryptoassets are not regulated in the UK. Past performance does not indicate future results. Diversification does not guarantee against loss. Capital at risk. This is mathematical education, not financial advice.
      </div>
    </div>
  `,

  scenarios: [
    { id:'c1', type:'calculation', question:'Calculate portfolio σ for: 40% BTC (σ=70%), 30% ETH (σ=90%), 30% SOL (σ=130%). Pairwise correlations: BTC/ETH=0.85, BTC/SOL=0.75, ETH/SOL=0.82.', answer:'σ²_p = (0.40²×0.70²) + (0.30²×0.90²) + (0.30²×1.30²) + 2(0.40×0.30×0.85×0.70×0.90) + 2(0.40×0.30×0.75×0.70×1.30) + 2(0.30×0.30×0.82×0.90×1.30) = 0.0784+0.0729+0.1521+0.1285+0.1638+0.1152 = 0.7109. σ_p=84.3%. Weighted average σ: 0.40×70+0.30×90+0.30×130=28+27+39=94%. Diversification benefit: (94-84.3)/94=10.3%. Only 10% risk reduction from 3 "different" crypto assets because the correlations are so high.' },
    { id:'c2', type:'calculation', question:'Same portfolio as above, but replace SOL with S&P 500 ETF (σ=16%, ρ with BTC=0.40, ρ with ETH=0.45). Calculate new portfolio σ.', answer:'σ²_p = (0.40²×0.70²)+(0.30²×0.90²)+(0.30²×0.16²)+2(0.40×0.30×0.85×0.70×0.90)+2(0.40×0.30×0.40×0.70×0.16)+2(0.30×0.30×0.45×0.90×0.16) = 0.0784+0.0729+0.0023+0.1285+0.0108+0.0117=0.3046. σ_p=55.2%. Down from 84.3% — a 34.5% reduction in portfolio volatility from replacing one crypto asset with an equity index. This is what genuine diversification looks like: crossing asset class boundaries.' },
    { id:'c3', type:'calculation', question:'BTC drops 15%. Using betas — ETH(1.3), SOL(1.8), DOGE(3.5) — calculate the expected loss on a portfolio that\'s 25% each of BTC/ETH/SOL/DOGE.', answer:'BTC: -15%. ETH: -15%×1.3=-19.5%. SOL: -15%×1.8=-27%. DOGE: -15%×3.5=-52.5%. Portfolio: 0.25×(-15)+0.25×(-19.5)+0.25×(-27)+0.25×(-52.5)=-3.75-4.875-6.75-13.125=-28.5%. A portfolio of 4 "different" crypto assets drops 28.5% when BTC drops 15%. The high-beta assets amplify the loss. You\'d have been better off holding 100% BTC (-15%) than this "diversified" portfolio (-28.5%).' },
    { id:'c4', type:'calculation', question:'50/50 BTC/USDC, rebalanced monthly. Month 1: BTC +30%. Calculate the rebalance trade and new position values.', answer:'Start: $5,000 BTC + $5,000 USDC = $10,000. After +30%: BTC=$6,500, USDC=$5,000. Total=$11,500. Target: 50/50=$5,750 each. Sell $750 BTC ($6,500→$5,750), buy $750 USDC ($5,000→$5,750). You\'ve locked in $750 of BTC gains. If BTC then drops 30% next month: BTC=$5,750×0.70=$4,025. USDC=$5,750. Total=$9,775. Without rebalance: BTC would be $6,500×0.70=$4,550, USDC=$5,000. Total=$9,550. Rebalanced portfolio outperforms by $225 (2.4%) from a single rebalance.' },
    { id:'c5', type:'judgement', question:'A crypto fund markets itself as "diversified across 30 tokens." The top 10 holdings are all Layer 1 blockchains and DeFi governance tokens. Is this diversified?', answer:'No. 30 tokens within the same asset class (crypto) with pairwise correlations of 0.70-0.90 provides minimal diversification. Using the portfolio variance formula with n=30 assets at average ρ=0.80: effective independent assets ≈ n/(1+(n-1)ρ) = 30/(1+29×0.80) = 30/24.2 = 1.24 effective independent bets. Thirty tokens give you the diversification of 1.24 independent assets. That\'s barely more than holding BTC alone. True diversification for a crypto-heavy fund requires non-crypto assets: equities, bonds, commodities, real estate.' },
    { id:'c6', type:'calculation', question:'BTC dominance rises from 45% to 55% over 3 months. ETH drops from 20% to 16% dominance. If total crypto market cap stayed at $2T, what happened to ETH\'s market cap?', answer:'ETH MC before: $2T×20%=$400B. ETH MC after: $2T×16%=$320B. Drop: $80B (-20%). Meanwhile BTC: before $900B, after $1.1T (+22.2%). BTC dominance rising = money flowing from alts to BTC. This is a "risk-off" signal within crypto — participants are moving to the "safer" asset. In declining dominance (money flowing to alts), it\'s "risk-on." Dominance shift is a useful relative value indicator, not a price predictor.' },
    { id:'c7', type:'judgement', question:'Correlations between BTC and S&P 500 increased from 0.20 (2019) to 0.50 (2024). What does this mean for crypto as a portfolio diversifier?', answer:'Crypto\'s diversification value is diminishing as correlation with traditional markets increases. At ρ=0.20, adding BTC to an equity portfolio provided significant diversification benefit. At ρ=0.50, the benefit is roughly halved. Reasons: institutional adoption (same funds holding both), macro sensitivity (both react to Fed decisions), leverage linkage (margin calls in one market force selling in both). The implication: crypto is becoming less of an "uncorrelated alternative" and more of a "high-beta tech stock equivalent." Portfolio construction must account for this — the old narrative of "crypto is uncorrelated" is mathematically outdated.' },
    { id:'c8', type:'calculation', question:'You have £50,000 to allocate. Target portfolio σ: 30%. Assets: BTC (σ=70%, β to portfolio), S&P 500 (σ=16%), Bonds (σ=5%). ρ(BTC,SPX)=0.40, ρ(BTC,Bonds)=0.10, ρ(SPX,Bonds)=-0.20. Find approximate weights.', answer:'This requires iterating. Start with 25% BTC, 50% SPX, 25% Bonds. σ²_p ≈ 0.0625×0.49 + 0.25×0.0256 + 0.0625×0.0025 + 2(0.125×0.40×0.70×0.16) + 2(0.0625×0.10×0.70×0.05) + 2(0.125×(-0.20)×0.16×0.05) = 0.0306+0.0064+0.00016+0.0090+0.00044-0.0002 = 0.0464. σ_p=21.5%. Too low — need more BTC. Try 35/45/20: σ_p≈28%. Close. 37/43/20: σ_p≈30%. Approximate answer: ~37% BTC, 43% equities, 20% bonds gives ~30% portfolio volatility — a balanced risk budget.' },
    { id:'c9', type:'judgement', question:'During the March 2020 COVID crash, BTC dropped 50% in 2 days while gold dropped 12%. Correlation between them spiked to 0.70 temporarily. What does this tell you about crisis correlations?', answer:'In crises, correlations spike across all risk assets — "the only thing that goes up in a crash is correlation." This is called correlation breakdown or contagion. The normal BTC/gold ρ of 0.15 became 0.70 during the liquidity crisis because institutional investors sold EVERYTHING for cash. Implications: (a) diversification benefits calculated from normal-period correlations OVERESTIMATE protection during crashes, (b) the assets you thought were uncorrelated become correlated exactly when you need the diversification most, (c) portfolio stress tests must use crisis correlations, not average correlations. This is a fundamental limitation of mean-variance portfolio theory.' },
    { id:'c10', type:'calculation', question:'Calculate the "effective number of independent bets" for a portfolio of 10 crypto tokens with average pairwise ρ=0.80.', answer:'Effective independent bets ≈ n/[1+(n-1)×ρ] = 10/[1+9×0.80] = 10/8.2 = 1.22. Ten tokens at ρ=0.80 give you 1.22 independent bets. Your "diversified" 10-token portfolio has roughly the same risk profile as 1.2 independent assets. At ρ=0.50: 10/5.5=1.82. At ρ=0.30: 10/3.7=2.70. You need correlation below 0.30 to get meaningful diversification from 10 assets (approaching 3 independent bets). Within crypto, this is nearly impossible to achieve.' },
    { id:'c11', type:'calculation', question:'A rebalancing strategy on 60/40 BTC/USDC is rebalanced quarterly. BTC: Q1 +40%, Q2 -25%, Q3 +15%, Q4 -10%. Calculate the portfolio value after 1 year with and without rebalancing, starting at $10,000.', answer:'Without rebalancing: BTC=$6,000. After Q1: $6,000×1.40=$8,400. Q2: $8,400×0.75=$6,300. Q3: $6,300×1.15=$7,245. Q4: $7,245×0.90=$6,520.50. USDC stays $4,000. Total: $10,520.50. With rebalancing: Q1 end: BTC=$8,400, USDC=$4,000. Total=$12,400. Rebal: $7,440/$4,960. Q2: BTC=$7,440×0.75=$5,580. Total=$10,540. Rebal: $6,324/$4,216. Q3: BTC=$6,324×1.15=$7,273. Total=$11,489. Rebal: $6,893/$4,596. Q4: BTC=$6,893×0.90=$6,204. Total=$10,800. Rebalanced: $10,800 vs non-rebalanced: $10,520.50. Rebalancing added $279.50 (2.7%). The volatility harvesting works — mechanically buying low and selling high.' },
    { id:'c12', type:'judgement', question:'Someone recommends "equal-weight all the top 20 cryptos for maximum diversification." Evaluate mathematically.', answer:'With 20 assets at average ρ=0.80: effective independent bets = 20/[1+19×0.80] = 20/16.2 = 1.23. Barely more diversified than holding BTC alone. Worse: equal-weighting gives 5% to each — including high-beta small caps that amplify drawdowns. A 30% BTC crash with average alt β=2.0 means the portfolio drops ~42% (more than BTC alone). Equal-weight crypto is anti-diversification: it INCREASES risk by adding high-beta, correlated assets while providing negligible diversification benefit. Mathematical optimal: concentrate in 2-3 large caps (BTC/ETH) and diversify the remaining allocation into non-crypto assets.' }
  ],

  tool: {
    name: 'Crypto Portfolio Analyser',
    description: 'Calculate portfolio volatility, correlation, effective diversification, and rebalancing value.',
    inputs: [
      { id:'cp-assets', label:'Assets (comma-separated)', type:'text', default:'BTC,ETH,SPX' },
      { id:'cp-weights', label:'Weights (%, comma-separated)', type:'text', default:'40,30,30' },
      { id:'cp-vols', label:'Annual vol (%, comma-separated)', type:'text', default:'70,90,16' },
      { id:'cp-corr', label:'Correlation matrix (row by row)', type:'text', default:'1.0,0.85,0.40;0.85,1.0,0.45;0.40,0.45,1.0' }
    ],
    outputs: ['Portfolio σ', 'Effective independent bets', 'Risk contribution per asset', 'Diversification ratio', 'Max drawdown estimate', 'Comparison vs 100% BTC']
  }
};

if (typeof module !== 'undefined') module.exports = CRYPTO_MODULE_8;
