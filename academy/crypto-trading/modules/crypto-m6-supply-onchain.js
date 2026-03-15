// crypto-m6-supply-onchain.js
// Module 6: Token Supply Mathematics & On-Chain Analytics
// Crypto Trading Maths — MathsWins Academy
// Tier: Advanced | Accent: #f97316

const CRYPTO_MODULE_6 = {
  id: 6,
  title: 'Token Supply Mathematics & On-Chain Analytics',
  tier: 'advanced',
  accent: '#f97316',

  tutorial: `
    <div class="tut">
      <h2>Module 6: Token Supply & On-Chain Analytics</h2>

      <div class="pt" style="border-left-color:#f97316; background:rgba(249,115,22,0.08);">
        Token supply is the most predictable variable in crypto — emission schedules are written in code. Yet most traders ignore supply mathematics entirely. On-chain data is the most transparent — every transaction is public. Yet most "analysis" is pattern recognition without statistical rigour. This module combines both: the mathematics of supply, and the honest statistical treatment of on-chain signals.
      </div>

      <h3>Market Cap vs FDV — The Number That Matters</h3>

      <div class="mb">
Market Cap = Price × Circulating Supply
FDV (Fully Diluted Valuation) = Price × Maximum Supply

Example: Token XYZ
  Price: $5.00
  Circulating supply: 100 million (20% of total)
  Maximum supply: 500 million
  Market Cap: $500 million
  FDV: $2.5 billion

The FDV/MC ratio = 5.0×

This means: if ALL tokens entered circulation at today's
price, the token would be valued at $2.5B. But they WILL
enter circulation — on a published schedule. The remaining
400M tokens represent future selling pressure.

FDV/MC ratios across crypto:
  BTC: ~1.0× (>93% of supply already circulating)
  ETH: ~1.0× (no max supply, but net deflationary post-merge)
  Typical new L1: 3-10×
  VC-backed token at launch: 5-20×
  Worst offenders: 50-100× (95%+ of tokens still locked)

Rule of thumb: FDV/MC > 5× means significant dilution ahead.
The higher the ratio, the more selling pressure is coming.
      </div>

      <h3>Token Unlock Mathematics</h3>

      <div class="mb">
Most tokens have a vesting schedule:
  Team tokens: 12-48 month vesting, 6-12 month cliff
  VC tokens: 12-36 month vesting, 6 month cliff
  Community/ecosystem: varies
  Foundation: varies

"Cliff" = period before any tokens unlock
"Vesting" = gradual release after the cliff

Example unlock schedule:
  Total supply: 1 billion tokens
  At launch: 100M circulating (10%)
  Month 6: VC cliff → 150M tokens unlock instantly
  Months 6-18: VC linear vest → 12.5M/month
  Month 12: Team cliff → 200M tokens unlock
  Months 12-48: Team linear vest → 5.6M/month

Sell pressure estimation:
  Historical data shows 40-60% of unlocked tokens are sold
  within 30 days of vesting (VCs and team members taking profit).

  Month 6 cliff unlock: 150M tokens.
  Estimated sell: 60-90M tokens within 30 days.
  At $5/token: $300-450M of sell pressure.
  If daily volume is $50M: that's 6-9 days of total volume.

  This is a PREDICTABLE, CALCULABLE event.
  The date is public. The quantity is public.
  The likely sell pressure can be estimated.
      </div>

      <h3>Inflation & Deflation</h3>

      <div class="mb">
Token inflation = new tokens created / existing supply

BTC inflation rate:
  Block reward: 3.125 BTC per block (post-2024 halving)
  Blocks per day: ~144
  Daily new BTC: 450
  Annual: 164,250 BTC
  Current supply: ~19.8 million
  Inflation: 164,250/19,800,000 = 0.83%/year

  After 2028 halving: ~0.41%/year
  After 2032 halving: ~0.21%/year
  BTC's inflation mathematically approaches zero.

ETH (post-merge, EIP-1559):
  Issuance: ~1,700 ETH/day (staking rewards)
  Burn: varies with usage. High usage = high burn.
  Average burn: 1,500-4,000 ETH/day

  When burn > issuance: ETH is DEFLATIONARY (supply shrinks)
  This has occurred during ~40% of post-merge months.
  Net annual change: approximately -0.5% to +0.5% depending
  on network activity.

Inflationary tokens (many DeFi governance tokens):
  Some emit 50-100% new supply per year as "rewards."
  If demand doesn't grow at the same rate: price drops.
  50% inflation + flat demand = ~33% price decline
  (simple: $100 market cap / 1.5× supply = $66.67 per token)
      </div>

      <h3>On-Chain Analytics — What The Data Says (And Doesn't)</h3>

      <div class="mb">
All blockchain transactions are public. This creates
unprecedented transparency — but transparent ≠ useful.

Exchange flow analysis:
  Net deposits to exchanges → bearish signal (people moving
    tokens to sell?)
  Net withdrawals from exchanges → bullish (accumulating?)

  Actual correlation with price (7-day forward):
    BTC exchange net flow vs price: r ≈ 0.15-0.25

  That's statistically significant but WEAK. It explains
  ~2-6% of price variance. 94-98% of price movement is
  driven by other factors.

  The signal exists. It's just noisy.

Whale wallet tracking:
  "Whale moved 10,000 BTC to Binance!" → panic sells
  But the base rate: large transfers happen 20-50 times
  per day. Most DON'T precede sell-offs.

  P(sell-off | whale transfer to exchange) ≈ 15-25%
  P(sell-off | any random day) ≈ 10-15%
  Lift: 1.5-2× base rate. Meaningful but not reliable.

MVRV Ratio (Market Value / Realised Value):
  MVRV > 3.0: historically near cycle tops (2013, 2017, 2021)
  MVRV < 1.0: historically near cycle bottoms
  Sample size: 3-4 full cycles. Statistically INSUFFICIENT
  for confident prediction. Overfitting risk is extreme.

Metcalfe's Law: V ∝ n²
  Network value should scale with (active users)².
  Empirically: crypto shows V ∝ n^1.5 to n^2.0
  The relationship holds approximately but breaks during
  speculative bubbles (price disconnects from fundamentals).
      </div>

      <div class="dg">
        With thousands of on-chain metrics and only 3-4 market cycles, almost any metric can be made to look predictive in hindsight. MVRV "predicting" cycle tops has a sample size of 3. A coin flip has a 12.5% chance of getting heads 3 times in a row. On-chain analytics provide useful data points, not crystal balls. Always ask: what's the sample size, what's the base rate, and what's the correlation coefficient?
      </div>

      <h3>The Overfitting Problem</h3>

      <div class="mb">
If you test 100 indicators against 4 market cycles,
expect ~5 to appear "significant" at p<0.05 purely by chance.

This is the multiple comparisons problem.
On-chain analytics firms test hundreds of metrics.
They report the ones that fit historical data.
They don't report the hundreds that didn't.

Bonferroni correction for 100 tests:
  Required p-value: 0.05/100 = 0.0005
  At this threshold, almost no on-chain metric survives.

The honest conclusion: on-chain data provides weak-to-moderate
signals with significant noise. It's most useful as a
CONFIRMING indicator, not a primary signal. Use it to
validate a thesis formed from other analysis — not to
generate the thesis in the first place.
      </div>

      <div class="dg" style="margin-top:1.5rem;">
        <strong>FCA risk warning:</strong> Cryptoassets are not regulated in the UK. Token supply analysis and on-chain analytics do not predict future prices. Capital at risk. This is mathematical education, not financial advice.
      </div>
    </div>
  `,

  scenarios: [
    { id:'s1', type:'calculation', question:'Token ABC: price $2.50, circulating 200M (25% of 800M total). VC unlock in 2 months: 120M tokens. Average daily volume: $8M. Calculate FDV/MC ratio and estimate unlock sell pressure in days of volume.', answer:'MC: $2.50×200M=$500M. FDV: $2.50×800M=$2B. FDV/MC=4.0×. Unlock: 120M×$2.50=$300M face value. Estimated sell (50%): $150M. Days of volume: $150M/$8M=18.75 days. Nearly 3 weeks of volume will be absorbed as sell pressure. Historically, tokens drop 15-40% around major unlock events of this magnitude.' },
    { id:'s2', type:'calculation', question:'Token DEF has 100% annual token emission as staking rewards. Current supply: 500M. If demand stays constant and all new tokens are sold, what is the expected price impact after 1 year?', answer:'New tokens: 500M×100%=500M. New supply: 1B. If market cap stays constant (demand=constant): new price = old_MC/new_supply = ($500M×$1 assumed)/$1B. Price per token drops from $1.00 to $0.50 — a 50% decline. Even if only 60% of emissions are sold: effective new supply = 500M+300M=800M. Price = $500M/800M=$0.625. Still -37.5%. High-emission tokens require proportionally growing demand just to maintain price.' },
    { id:'s3', type:'calculation', question:'BTC halving reduces block reward from 3.125 to 1.5625 BTC. Current supply: 19.8M. Calculate pre-halving and post-halving annual inflation rates.', answer:'Pre-halving: 3.125×144×365=164,250 BTC/year. Rate: 164,250/19,800,000=0.83%. Post-halving: 1.5625×144×365=82,125 BTC/year. Rate: 82,125/19,964,250=0.41%. The halving cuts inflation exactly in half. New BTC per year drops from ~164k to ~82k. At $60,000/BTC, that\'s $4.9B less annual sell pressure from miners.' },
    { id:'s4', type:'judgement', question:'"A whale just moved 5,000 BTC ($300M) to Coinbase. This is a massive bearish signal." Evaluate using base rate analysis.', answer:'Base rate: large BTC transfers to exchanges (>1,000 BTC) happen approximately 15-30 times per day. P(>5% price drop within 7 days | large exchange deposit) ≈ 20-25%. P(>5% price drop within 7 days | any day) ≈ 12-15%. The signal is ~1.7× base rate — statistically nonzero but NOT "massive." 75-80% of the time, a large exchange deposit is NOT followed by a significant sell-off. It could be: OTC desk restructuring, exchange cold wallet reshuffling, collateral deposit for lending, or actual selling. One data point, many possible explanations.' },
    { id:'s5', type:'calculation', question:'ETH issuance: 1,700/day. Average daily burn: 2,500 ETH. Current supply: 120.2M. Calculate the net annual supply change and the annualised deflation rate.', answer:'Net daily: 1,700-2,500=-800 ETH/day (deflationary). Annual: -800×365=-292,000 ETH. Deflation rate: 292,000/120,200,000=0.243%. Supply after 1 year: 120.2M-0.292M=119.908M. At this burn rate, ETH supply decreases by ~0.24% per year. All else equal (constant demand), this creates 0.24% upward price pressure annually from supply reduction alone. Modest but mathematically real and compounding.' },
    { id:'s6', type:'judgement', question:'MVRV ratio for BTC is currently 2.8. A crypto influencer says "MVRV above 2.5 has predicted every cycle top — we\'re close to the top." What\'s the statistical problem?', answer:'Sample size: 3-4 BTC cycles with MVRV data. MVRV exceeded 2.5 during each cycle top — but it also exceeded 2.5 for extended periods WITHOUT an immediate top (sometimes months before the actual peak). Additionally: (a) 3-4 data points is far too few for confident prediction (p-values are meaningless at this sample size), (b) MVRV stayed above 2.5 for months during 2017 and 2021 before peaking, so timing is impossible, (c) this cycle may behave differently (structural changes: ETF approval, institutional participation), (d) reporting bias: the influencer isn\'t showing the periods where MVRV was 2.8 and price DIDN\'T crash.' },
    { id:'s7', type:'calculation', question:'A token has monthly unlock schedule: 10M tokens/month for 24 months. Current circulating: 100M, price: $3. Current market cap: $300M. What is the monthly dilution rate and the cumulative dilution after 12 months?', answer:'Monthly dilution: 10M/circulating at that month. Month 1: 10M/100M=10%. Month 6: 10M/150M=6.67%. Month 12: 10M/210M=4.76%. After 12 months: circulating = 100M+120M=220M. If MC stays $300M: price = $300M/220M=$1.36 (down from $3.00). That\'s -54.5%. Even if MC grows 50% to $450M: price = $450M/220M=$2.05 (-31.8%). The unlock schedule is a mathematically guaranteed headwind.' },
    { id:'s8', type:'judgement', question:'An analyst presents a chart showing "Active addresses always lead price by 2 weeks." They tested this on 5 years of daily BTC data. What should you check?', answer:'(1) Was this the ONLY indicator tested, or one of many? If they tested 50 indicators and reported the best one, Bonferroni correction applies. (2) Was there out-of-sample validation? In-sample correlation on 5 years is meaningless without testing on unseen data. (3) What\'s the actual r-value? "Leads price" could mean r=0.1 (explains 1% of variance). (4) Is the relationship stable across different market regimes (bull, bear, sideways)? (5) Survivorship bias: are they showing BTC because it worked, while the same metric failed for other assets? (6) Economic logic: WHY would active addresses lead price? Correlation without causation is data mining.' },
    { id:'s9', type:'calculation', question:'A new DeFi protocol launches with: 10B total supply, 500M circulating (5%), 2B to team (4-year vest, 1-year cliff), 3B to VCs (3-year vest, 6-month cliff), 2B ecosystem, 2.5B community rewards. Model the supply schedule for months 0-24.', answer:'Month 0: 500M. Month 6: +3B/36×(6-6)... VC cliff unlocks, initial chunk depends on structure. If linear after cliff: VC monthly = 3B/30 months = 100M/month starting M6. Month 12: team cliff + team monthly = 2B/36 = 55.6M/month starting M12. Plus community emissions (assume 2.5B over 48 months = 52.1M/month from day 1). Month 6: 500M + 52.1M×6 + VC cliff... Complex but calculable. Key insight: by month 12, circulating could be 500M+625M(community)+600M(VC)+0(team pre-cliff)=1.725B = 17.25% of total. Still massively dilutive — 83% of tokens remain locked. This is a token with significant future sell pressure.' },
    { id:'s10', type:'judgement', question:'Metcalfe\'s Law says network value ∝ n². BTC has 1M daily active addresses and $1T market cap. A new L1 has 50K daily active addresses. What should its market cap be according to Metcalfe?', answer:'Metcalfe: V∝n². Ratio: (50K/1M)²=0.0025. Predicted MC: $1T×0.0025=$2.5B. But this is dangerously simplistic: (a) "active addresses" includes bots, spam, wash trading — Solana has high address counts partly from MEV bots, (b) BTC active addresses include hodlers; new L1 addresses may be airdrop farmers, (c) the empirical exponent is n^1.5 to n^2.0, making the range $2.5B-$50B depending on which exponent, (d) quality of addresses matters more than quantity. Metcalfe provides a rough sanity check, not a valuation model.' },
    { id:'s11', type:'calculation', question:'Compare two tokens for investment. Token A: MC $500M, FDV $500M, no future emissions, 5% annual fee burn. Token B: MC $500M, FDV $5B, 80% still locked, 30% annual emission rate. Which has better supply mathematics?', answer:'Token A: FDV/MC=1.0×. No dilution. 5% annual burn = deflationary. Supply shrinks 5%/year. All else equal, price should increase ~5.3% annually from supply reduction alone (1/0.95-1). Token B: FDV/MC=10×. 30% annual emission = massive inflation. Supply doubles in ~2.7 years. Price faces 30% annual headwind from dilution, PLUS unlock selling pressure as the remaining 80% vests. Token B needs 35%+ annual demand growth just to maintain current price. Token A has mathematically superior supply dynamics by every metric.' },
    { id:'s12', type:'judgement', question:'An on-chain analytics dashboard shows "Exchange reserves at 5-year lows!" as a bullish indicator. What assumptions does this interpretation make, and are they valid?', answer:'Assumptions: (1) coins leaving exchanges = being accumulated long-term (bullish). May be true, but could also be: moving to DeFi (not necessarily bullish), moving to L2s, moving to self-custody due to exchange collapses (FTX effect), or moving to OTC desks. (2) Lower exchange reserves = less potential sell pressure. Partially valid, but OTC sales don\'t show on exchange reserves. (3) 5-year low is meaningful. The crypto market structure has fundamentally changed — DeFi, L2s, and bridges didn\'t exist 5 years ago. Comparing today\'s exchange reserves to 2020 is apples to oranges. The indicator has some logic but the interpretation is far more uncertain than the headline suggests.' }
  ],

  tool: {
    name: 'Token Supply Analyser',
    description: 'Analyse supply schedules, dilution rates, and FDV/MC ratios.',
    inputs: [
      { id:'ts-circ', label:'Circulating supply', type:'number', default:100000000 },
      { id:'ts-total', label:'Total/max supply', type:'number', default:1000000000 },
      { id:'ts-price', label:'Current price ($)', type:'number', default:1.00, step:0.01 },
      { id:'ts-emission', label:'Annual emission rate (%)', type:'number', default:10 },
      { id:'ts-burn', label:'Annual burn rate (%)', type:'number', default:0 },
      { id:'ts-unlock-months', label:'Next major unlock (months)', type:'number', default:6 },
      { id:'ts-unlock-pct', label:'Unlock size (% of total)', type:'number', default:15 }
    ],
    outputs: ['Market cap & FDV', 'FDV/MC ratio', 'Net annual inflation/deflation', 'Projected supply curve (12 months)', 'Unlock sell pressure estimate', 'Required demand growth to maintain price']
  }
};

if (typeof module !== 'undefined') module.exports = CRYPTO_MODULE_6;
