// crypto-m2-volatility.js
// Module 2: Volatility Mathematics — Why Crypto Moves Differently
// Crypto Trading Maths — MathsWins Academy
// Tier: Basic | Accent: #f97316

const CRYPTO_MODULE_2 = {
  id: 2,
  title: 'Volatility Mathematics — Why Crypto Moves Differently',
  tier: 'basic',
  accent: '#f97316',

  tutorial: `
    <div class="tut">
      <h2>Module 2: Volatility Mathematics</h2>

      <div class="pt" style="border-left-color:#f97316; background:rgba(249,115,22,0.08);">
        Crypto volatility isn't just "higher than stocks." It's a fundamentally different regime — 5 to 10 times equity volatility, with fat tails that make extreme moves far more common than standard models predict. This module teaches you to measure it, understand it, and size your positions correctly because of it.
      </div>

      <h3>Measuring Volatility — Log Returns</h3>

      <p>Volatility is the standard deviation of returns. We use logarithmic returns because they're additive over time and symmetrical.</p>

      <div class="mb">
Simple return: r = (P₁ - P₀) / P₀
Log return:    r = ln(P₁ / P₀)

BTC $30,000 → $60,000: simple = +100%, log = +69.3%
BTC $60,000 → $30,000: simple = -50%,  log = -69.3%

Simple returns are asymmetric. Log returns are symmetric.
This matters for accurate volatility measurement.

Daily volatility: σ_daily = stdev(daily log returns)
Annualised (crypto, 365 days): σ_annual = σ_daily × √365

Typical annualised volatilities:
  S&P 500:      15-20%     Gold:         12-18%
  EUR/USD:       8-12%     Bitcoin:      60-80%
  Ethereum:     80-100%    Large alts:  100-150%
  Small alts:  150-300%+
      </div>

      <div class="pln">
        Bitcoin moves in a day what the S&P 500 moves in a week. Ethereum moves in a day what the S&P moves in a month. Every position sizing decision must account for this.
      </div>

      <h3>Vol-Adjusted Position Sizing</h3>

      <div class="mb">
If you'd hold £1,000 of FTSE 100 (vol ~15%),
the equivalent-RISK crypto positions are:

  BTC (vol ~70%):      £1,000 × (15/70)  = £214
  ETH (vol ~90%):      £1,000 × (15/90)  = £167
  SOL (vol ~120%):     £1,000 × (15/120) = £125
  Meme coin (vol ~200%): £1,000 × (15/200) = £75

Most retail crypto traders hold 5-10× larger positions
than the equivalent risk in equities. They think in pounds,
not in sigma. That's the mistake.
      </div>

      <h3>Fat Tails — Why Normal Distribution Fails</h3>

      <div class="mb">
Normal distribution predicts (for BTC daily σ ≈ 3.5%):
  P(>2σ daily move, >7%):   4.6%  → ~17 days/year
  P(>3σ, >10.5%):           0.27% → ~1 day/year
  P(>4σ, >14%):             0.006% → once per 44 years
  P(>5σ, >17.5%):           0.00006% → once per 4,500 years

BTC actual data (2017-2025):
  >2σ days:  ~120 total (~15/year)
  >3σ days:  ~35 total (~4.4/year)
  >4σ days:  ~12 total (~1.5/year)
  >5σ days:  ~7 total (~0.9/year)

A 5σ event "should" happen once per 4,500 years.
BTC has 7 in 8 years. The normal distribution underestimates
extreme crypto moves by a factor of ~4,000×.

Crypto follows a power law: P(|r| > x) ∝ x^(-α), α ≈ 2.5-3.5
This means extreme events are ORDERS OF MAGNITUDE more likely
than Gaussian models predict.
      </div>

      <div class="dg">
        Any risk model using normal distribution for crypto is wrong at the tails by orders of magnitude. A "5-sigma event" happens nearly annually in Bitcoin. Risk frameworks must use fat-tailed distributions — Module 10 covers this completely.
      </div>

      <h3>Volatility Clustering</h3>

      <div class="mb">
High vol follows high vol. Low vol follows low vol.

Autocorrelation of |daily returns|:
  Lag 1 day:   ρ ≈ 0.25-0.35
  Lag 5 days:  ρ ≈ 0.15-0.25
  Lag 20 days: ρ ≈ 0.05-0.10

After a big move, the next few days are statistically
more dangerous. Vol is somewhat predictable in the short
term. Direction is not. You can estimate HOW MUCH it will
move. You cannot estimate WHICH WAY.

Action: after a large daily move, tighten risk management.
Reduce positions or widen stops. The cluster hasn't ended.
      </div>

      <h3>Drawdown Asymmetry</h3>

      <div class="mb">
  Loss  → Gain needed to recover
  -10%  → +11.1%        -50% → +100%
  -20%  → +25.0%        -70% → +233%
  -30%  → +42.9%        -80% → +400%
  -40%  → +66.7%        -90% → +900%

Formula: recovery = 1/(1-loss) - 1

Historical max drawdowns:
  BTC: -85% (2018), -73% (2022), -56% (2021)
  ETH: -94% (2018), -82% (2022)
  SOL: -96% (2022)
  LUNA: -99.99% (2022)

After -90%, you need +900% to break even.
Most altcoins that drop 90%+ never recover.
      </div>

      <div class="pln">
        Position sizing matters more than entry price. You can survive a 50% drawdown on a small position. You cannot survive a 90% drawdown on your entire portfolio. The asymmetry of drawdowns is the most important number in crypto risk management.
      </div>

      <h3>Variance Drag on Leveraged Positions</h3>

      <div class="mb">
Expected compound return ≈ μ - σ²/2 (per period)

At 1× leverage, BTC daily σ = 3.5%:
  Daily drag = (0.035)²/2 = 0.06%
  30-day drag: ~1.8%

At 3× leverage, effective σ = 10.5%:
  Daily drag = (0.105)²/2 = 0.55%
  30-day drag: ~15.3%

At 10× leverage, effective σ = 35%:
  Daily drag = (0.35)²/2 = 6.1% PER DAY
  30-day drag: essentially total loss

Leveraged positions in volatile assets decay mathematically
even if the underlying goes NOWHERE. This is variance drag —
and it's why leveraged crypto ETFs are wealth destruction
machines over any holding period longer than a day.
      </div>

      <div class="dg" style="margin-top:1.5rem;">
        <strong>FCA risk warning:</strong> Cryptoassets are not regulated in the UK. Capital at risk. This is mathematical education, not financial advice.
      </div>
    </div>
  `,

  scenarios: [
    { id:'v1', type:'calculation', question:'BTC daily log returns over 10 days: +2.1%, -1.5%, +3.8%, -4.2%, +0.7%, -0.3%, +5.1%, -2.8%, +1.9%, -1.3%. Calculate daily σ and annualised vol.', answer:'Mean=0.35%. Deviations²: 3.06,3.42,11.90,20.70,0.12,0.42,22.56,9.92,2.40,2.72. Sum=77.22. Var=77.22/9=8.58. σ_daily=√8.58=2.93%. Annual=2.93%×√365=55.9%. Lower end of BTC typical range, suggesting a calm period.' },
    { id:'v2', type:'calculation', question:'You\'re comfortable risking £2,000 in FTSE (vol 16%). What are vol-equivalent positions in BTC (72%), ETH (95%), meme coin (250%)?', answer:'BTC: £2,000×(16/72)=£444. ETH: £2,000×(16/95)=£337. Meme: £2,000×(16/250)=£128. To match FTSE risk, your meme coin position is £128 — one-sixteenth of what you\'d hold in equities.' },
    { id:'v3', type:'calculation', question:'BTC annual vol=70%. What is P(20% monthly drawdown) under (a) normal, (b) power law α=3?', answer:'(a) Monthly σ=70%/√12=20.2%. 20% drop≈1σ. P(<-1σ)≈15.9%. (b) Power law gives ~2-3× higher tail probability. Est P≈25-35%. Historical frequency of BTC -20% months: ~25-30%, consistent with power law, significantly higher than normal predicts.' },
    { id:'v4', type:'judgement', question:'BTC dropped 8% yesterday, ETH 12%. Your static daily VaR is 5%. Should you adjust?', answer:'Yes. Volatility clustering (autocorrelation ρ≈0.30 at lag 1) means today\'s vol is ~3× baseline. Static 5% VaR underestimates today\'s risk. Reduce positions, widen stops, or hedge. Return to normal sizing after 2-3 calm days.' },
    { id:'v5', type:'calculation', question:'Portfolio drops from £50,000 to £15,000 (70% drawdown). At 40% annual compound return, how many years to recover?', answer:'Need 233% gain. Years=ln(3.333)/ln(1.40)=1.204/0.336=3.58 years. But this assumes 40% every year with no further drawdowns. With realistic vol and possible further drawdowns, expected recovery: 5-7+ years. Prevention > recovery.' },
    { id:'v6', type:'calculation', question:'ETH daily σ=4.5%. Expected days/year with >10% moves under normal vs actual (~15/year). What does the ratio tell you?', answer:'Normal: 10%/4.5%=2.22σ. P(|r|>2.22σ)=2.64%. Expected: 365×2.64%=9.6 days. Actual: ~15. Ratio: 1.56×. ETH tails are 56%+ fatter than normal predicts — and this ratio increases dramatically for larger moves.' },
    { id:'v7', type:'judgement', question:'Crypto fund claims "Sharpe ratio 3.5." BTC returned 80% at 70% vol in their period. Red flags?', answer:'BTC Sharpe alone: (80-5)/70=1.07. A fund Sharpe of 3.5 in crypto almost certainly reflects: cherry-picked period, leverage not adjusted in denominator, smoothed vol (weekly not daily data), or survivorship bias. Sharpe>2 in TradFi is exceptional. In crypto, 3.5 is a data manipulation red flag.' },
    { id:'v8', type:'calculation', question:'Hold 0.5 BTC at $60k ($30k). Daily σ=3.5%. Calculate 1-day 95% VaR normal and fat-tail adjusted (1.5×).', answer:'Normal 95% VaR: $30,000×1.645×3.5%=$1,727. Fat-tail: $1,727×1.5=$2,591. You should expect to lose >$2,591 on ~5% of days (~18 days/year). 99% VaR: normal=$2,442, fat-tail≈$4,880.' },
    { id:'v9', type:'judgement', question:'"BTC vol is decreasing over time, so it\'s becoming safer." Evaluate.', answer:'Partially true: BTC vol trended from ~120% (2013-15) to 60-80% (2022-25). But: (a) 60-80% is still 4-5× equities, (b) vol spikes persist during crises, (c) fat tails haven\'t disappeared, (d) "less volatile" ≠ "safe." A 60% vol asset can still lose 50% in a quarter. Trajectory encouraging, absolute level still demands crypto-specific risk management.' },
    { id:'v10', type:'calculation', question:'ETH stop-loss at 2σ (9%) below entry. Daily σ=4.5%. P(triggered on any single day)? Over 30 days?', answer:'Daily P(drop>2σ)≈2.28% normal, ~3.4% fat-tail adjusted. Over 30 days: P(triggered)=1-(1-0.034)^30=1-0.353=64.7%. A 2σ stop on ETH has ~65% chance of triggering within a month even if ETH ends flat — because stops are path-dependent.' },
    { id:'v11', type:'calculation', question:'Calculate variance drag for 3× leveraged BTC (daily σ=3.5%) over 30 days vs 1× unleveraged.', answer:'1× drag: (0.035)²/2=0.061%/day. 30 days: ~1.8%. 3× drag: effective σ=10.5%. (0.105)²/2=0.551%/day. 30 days: ~15.3%. The 3× position loses ~15% to variance drag alone over a month, even with 0% expected return. This is the mathematical reason leveraged crypto positions decay over time.' },
    { id:'v12', type:'judgement', question:'Trader uses "2% risk per trade" rule identically for stocks and crypto. Is this consistent?', answer:'Only if stop distance adjusts for vol. A 5% stop on stocks (σ≈1.5%/day) is 3.3σ — rarely triggers randomly (P≈0.05%/day). Same 5% stop on crypto (σ≈4%) is only 1.25σ — triggers ~10%/day. To be consistent: crypto stop must be proportionally wider (e.g., 13%), requiring proportionally smaller position to maintain 2% dollar risk.' }
  ],

  tool: {
    name: 'Volatility Calculator',
    description: 'Calculate volatility, position sizes, and drawdown probabilities from price data.',
    inputs: [
      { id:'vol-prices', label:'Price series (comma-separated)', type:'text' },
      { id:'vol-benchmark', label:'Benchmark vol (%)', type:'number', default:16 },
      { id:'vol-position', label:'Target position (£)', type:'number', default:1000 },
      { id:'vol-drawdown', label:'Max acceptable drawdown (%)', type:'number', default:20 }
    ],
    outputs: ['Daily & annualised vol', 'Vol-adjusted position size', 'Drawdown probability (7/30/90 days)', 'Fat-tail adjusted VaR', 'Max drawdown from series', 'Vol clustering indicator']
  }
};

if (typeof module !== 'undefined') module.exports = CRYPTO_MODULE_2;
