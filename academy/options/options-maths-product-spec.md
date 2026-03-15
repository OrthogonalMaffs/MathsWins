# MathsWins — Options Maths: Product Specification

**Standalone Flagship Product**
**Date:** 15 March 2026
**Status:** Full specification for review
**Prepared for:** Jon

---

## Overview

Options Maths teaches the mathematics behind options trading — from first principles. Not "how to trade options" (that's financial advice). Not "my favourite options strategy" (that's a tipping service). The actual mathematics: how options are priced, why they behave the way they do, and what the numbers mean.

The audience is retail traders who use options but don't understand the maths behind them. They know what a call option is. They've heard of "the Greeks." They might even use Black-Scholes outputs from their broker. But they can't derive any of it, and that gap costs them money — they mis-price risk, misunderstand implied volatility, and get burned by time decay they didn't see coming.

This product fills that gap with MathsWins methodology: show the maths, translate into plain English, build interactive tools.

---

## Why This Product Will Work

**The market is large.** Retail options trading has exploded since 2020. Interactive Brokers, IG, Saxo, and Robinhood/Trading 212 have made options accessible to anyone with a phone. Most of these traders learned from YouTube videos, not mathematics.

**The competition charges a fortune.** Options education is typically £200-2,000+:
- Udemy options courses: £20-80 (but shallow, no real maths)
- Tastytrade/tastylive: free but video-only, no mathematical derivations
- CME Group education: institutional level, not accessible
- University courses: £500-2,000 (too academic, not practical)
- Options Alpha: $49-99/month
- Simpler Trading: $197-997 per course

**Nobody teaches the maths accessibly.** University courses derive Black-Scholes from stochastic calculus — inaccessible to most traders. Retail courses skip the maths entirely — "just look at the Greeks on your platform." MathsWins sits in the middle: derive everything from first principles, but explain it in plain English with interactive tools.

**Price point:** £9.99 / £17.99 / £29.99 (3-tier). Dramatically undercuts every competitor while offering genuine mathematical depth. The All Access Pass does NOT include this product.

---

## Product Identity

**Name:** Options Maths
**Slug:** /academy/options/
**Accent colour:** #06b6d4 (cyan-500 — distinct from Trading Maths emerald, signals a different product)
**Tagline:** "The equations behind every contract."
**Disclaimer on every page:** "This is mathematical education, not financial advice. Options trading involves significant risk of loss. Consult a qualified financial adviser before trading."

---

## Pricing

| Tier | Modules | Price | Stripe Product |
|------|---------|-------|----------------|
| Basic | M1–M4 (Foundations) | £9.99 | New product needed |
| Advanced | M1–M7 (+ Greeks & Volatility) | £17.99 | |
| Master | M1–M10 (+ Strategies & Risk) | £29.99 | |
| Free taster | M1 only | £0 | |

**Not included in All Access Pass.** Standalone product with its own Stripe Payment Links.

---

## Prerequisites

The product assumes:
- You know what a call option and a put option are (if not, Module 1 covers this)
- You can do basic algebra (rearranging equations, substitution)
- You've heard of "the Greeks" even if you don't understand them
- You do NOT need calculus — we derive everything without it where possible, and explain the calculus in plain English where unavoidable

---

## Stats Bar

| Stat | Value | Label |
|------|-------|-------|
| 10 | Modules | Pricing theory → risk management |
| 6 | Tools | Built-in calculators |
| 1973 | Year | Black-Scholes published |
| £0 | Module 1 | Always free |

---

## Module Structure

### Module 1: What Options Actually Are (Free Taster)
**Tier:** Free
**Tool:** None (conceptual module)

This is the hook. Most retail traders use options without truly understanding what they're buying or selling. This module strips it back to the mathematical definition.

**Content:**

1. **An option is a contract with a payoff function.** That's it. Everything else follows from this.

2. **Call option payoff at expiry:**
```
Payoff = max(S − K, 0)

S = price of the underlying asset at expiry
K = strike price (the agreed purchase price)

If S > K: you profit (S − K) per share
If S ≤ K: the option expires worthless (payoff = 0)
```
.pln: "A call option gives you the right to buy at a fixed price. If the market price ends up higher than your fixed price, you profit the difference. If it doesn't, you lose what you paid for the option — nothing more."

3. **Put option payoff at expiry:**
```
Payoff = max(K − S, 0)
```
.pln: "A put option gives you the right to sell at a fixed price. If the market price falls below your fixed price, you profit the difference."

4. **The payoff diagram** — the hockey stick graph. Interactive tool: drag the strike price and see the payoff curve shift.

5. **Intrinsic value vs time value:**
```
Option price = Intrinsic value + Time value

Intrinsic: max(S − K, 0) for calls, max(K − S, 0) for puts
Time value: everything else (the premium for "what might happen")

A call with S = £105, K = £100:
  Intrinsic value = £5
  If the option trades at £8: time value = £3
```

6. **Moneyness:** In-the-money (ITM), at-the-money (ATM), out-of-the-money (OTM). Not jargon — mathematical definitions based on S vs K.

7. **Put-call parity** — the first real mathematical insight:
```
C − P = S − K × e^(−rT)

C = call price, P = put price
S = current stock price
K = strike price
r = risk-free interest rate
T = time to expiry (in years)

This is an arbitrage relationship. If it doesn't hold,
free money exists (and gets exploited instantly).
```
.pln: "Put-call parity says that the difference between a call price and a put price (same strike, same expiry) must equal the stock price minus the present value of the strike. If it doesn't, someone can make risk-free profit — and in practice, this gets corrected within milliseconds."

---

### Module 2: Probability and Expected Value in Options
**Tier:** Basic
**Tool:** Payoff Diagram Builder

**Content:**

1. **Options as probability bets.** Buying a call is betting the stock goes above K. The price of the option reflects the market's estimate of that probability.

2. **Expected value of an option:**
```
E[payoff] = ∫ max(S − K, 0) × f(S) dS

f(S) = probability density function of S at expiry
```
.pln: "The expected value of a call option is the sum of every possible stock price multiplied by its probability, counting only the prices where you'd make money. The challenge is knowing f(S) — what's the probability of each future price?"

3. **The normal distribution assumption.** Stock RETURNS (not prices) are approximately normally distributed. This means stock PRICES follow a lognormal distribution. Why this matters:
```
If returns are normal: prices can't go below zero ✓
If returns are 10% with 20% volatility:
  68% chance price stays within ±20%
  95% chance price stays within ±40%
  99.7% chance within ±60%
```

4. **Historical vs implied probability.** Historical data tells you what HAS happened. Options prices tell you what the market EXPECTS to happen. These are often different — and the gap is where traders think they find edge.

5. **Interactive tool: Payoff Diagram Builder.** Input: select call/put, enter strike, entry price, quantity. Output: P&L diagram at expiry, break-even point, max profit, max loss.

---

### Module 3: The Binomial Model — Options Pricing from First Principles
**Tier:** Basic
**Tool:** Binomial Tree Calculator

This module derives options pricing WITHOUT Black-Scholes. The binomial model is simpler, more intuitive, and teaches the core concept (risk-neutral pricing) that Black-Scholes formalises.

**Content:**

1. **One-step binomial tree.**
```
Stock is at £100. In one period it either:
  Goes up to £120 (u = 1.20) with probability p
  Goes down to £80 (d = 0.80) with probability (1-p)

Call option: strike £100, expires in one period.
  If stock = £120: call pays £20
  If stock = £80:  call pays £0

Question: what is the fair price of this call TODAY?
```

2. **The replicating portfolio.** The key insight: you can create a portfolio of stock + borrowing that exactly replicates the option's payoff.
```
Buy Δ shares and borrow B at risk-free rate r.

If stock goes up:   Δ × 120 − B(1+r) = 20  (matches call payoff)
If stock goes down:  Δ × 80  − B(1+r) = 0   (matches call payoff)

Solving (subtract equations):
  Δ × (120 − 80) = 20
  Δ = 20/40 = 0.5

  0.5 × 80 − B(1+r) = 0
  B(1+r) = 40
  B = 40/(1+r) ≈ 40/1.05 = 38.10 (at 5% risk-free)

Fair call price = Δ × S − B = 0.5 × 100 − 38.10 = £11.90
```
.pln: "The option must be worth £11.90 because you can replicate its exact payoff by buying half a share and borrowing £38.10. If the option traded at any other price, you could make risk-free profit by buying/selling the option and doing the opposite with the replicating portfolio."

3. **Risk-neutral probabilities.** Instead of real-world probabilities, options are priced using risk-neutral probabilities:
```
q = (e^(rT) − d) / (u − d)

q is NOT the real probability of going up.
q is the probability that makes the expected return
equal to the risk-free rate.

Using our example:
  q = (1.05 − 0.80) / (1.20 − 0.80) = 0.25/0.40 = 0.625

Call price = e^(−rT) × [q × 20 + (1−q) × 0]
           = (1/1.05) × [0.625 × 20]
           = 0.952 × 12.5 = £11.90 ✓ (same answer!)
```
.pln: "Risk-neutral pricing is the big idea. You don't need to know the real probability of the stock going up. You use a fictional 'risk-neutral' probability that makes everything easier to calculate — and it gives the same answer as the replicating portfolio. This is the foundation of all options pricing."

4. **Multi-step trees.** Extend to 2, 3, N steps. As N → ∞, the binomial model converges to Black-Scholes.

5. **Interactive tool: Binomial Tree Calculator.** Input: stock price, strike, up factor, down factor, risk-free rate, number of steps. Output: visual tree with stock prices and option prices at each node, delta at each node.

---

### Module 4: Black-Scholes — The Formula Explained
**Tier:** Basic (final Basic module)
**Tool:** Black-Scholes Calculator

The most famous formula in finance. We derive it from the binomial model (not from stochastic calculus) and explain every component.

**Content:**

1. **From binomial to continuous.** As you add more steps to the binomial tree and make each step smaller, the model converges to a continuous-time formula. That formula is Black-Scholes.

2. **The Black-Scholes formula:**
```
C = S × N(d₁) − K × e^(−rT) × N(d₂)

where:
  d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)
  d₂ = d₁ − σ√T

C = call option price
S = current stock price
K = strike price
r = risk-free interest rate (annualised)
T = time to expiry (in years)
σ = volatility (annualised standard deviation of returns)
N(x) = cumulative standard normal distribution function
```

3. **What each component means:**
```
S × N(d₁):
  The expected stock price at expiry, adjusted for probability
  and risk. This is what you expect to receive.

K × e^(−rT) × N(d₂):
  The present value of the strike price, weighted by the
  probability of the option finishing in-the-money.
  This is what you expect to pay.

The difference = the fair option price.
```
.pln: "Black-Scholes says: the option is worth what you expect to receive (stock price weighted by probability) minus what you expect to pay (strike price weighted by the same probability, discounted to today). That's it. The complexity is in calculating those probabilities accurately."

4. **The five inputs and what they do:**
```
S (stock price):    ↑ S → ↑ call price, ↓ put price
K (strike price):   ↑ K → ↓ call price, ↑ put price
T (time to expiry): ↑ T → ↑ both (more time = more chance)
r (risk-free rate):  ↑ r → ↑ call, ↓ put (slightly)
σ (volatility):     ↑ σ → ↑ both (more uncertainty = more value)
```

5. **Worked example in .mb box:**
```
S = £100, K = £100, T = 0.25 (3 months), r = 5%, σ = 20%

d₁ = [ln(100/100) + (0.05 + 0.04/2)(0.25)] / (0.20 × √0.25)
   = [0 + 0.07 × 0.25] / (0.20 × 0.5)
   = 0.0175 / 0.10
   = 0.175

d₂ = 0.175 − 0.10 = 0.075

N(0.175) = 0.5695
N(0.075) = 0.5299

C = 100 × 0.5695 − 100 × e^(−0.0125) × 0.5299
  = 56.95 − 100 × 0.9876 × 0.5299
  = 56.95 − 52.33
  = £4.62
```
.pln: "A 3-month at-the-money call on a £100 stock with 20% annual volatility and 5% interest rate is worth approximately £4.62. That £4.62 is entirely time value — the option has no intrinsic value because the stock price equals the strike."

6. **The assumptions (and where they break down):**
- Returns are normally distributed (reality: fat tails / Black Swan events)
- Volatility is constant (reality: it changes constantly)
- No transaction costs (reality: bid-ask spreads, commissions)
- Continuous trading possible (reality: markets close)
- No dividends (can be adjusted for)
- European exercise only (American options are more complex)

.pln: "Black-Scholes is wrong — but it's usefully wrong. The assumptions don't hold perfectly in the real world, but the model is close enough to be the foundation of all modern options pricing. Every trader uses it, or something built on top of it."

7. **Interactive tool: Black-Scholes Calculator.** Input: S, K, T, r, σ. Output: call price, put price, all five Greeks (see Module 5), probability of finishing ITM, break-even at expiry. Slider for each input showing real-time price changes.

---

### Module 5: The Greeks — Delta
**Tier:** Advanced
**Tool:** Delta Visualiser (integrated into BS calculator)

**Content:**

1. **What Delta is:** The rate of change of option price with respect to stock price.
```
Δ = ∂C/∂S = N(d₁) for calls
Δ = N(d₁) − 1 for puts

Delta ranges:
  Call: 0 to +1 (deep OTM → deep ITM)
  Put:  −1 to 0 (deep ITM → deep OTM)
  ATM option: Δ ≈ ±0.50
```

2. **Delta as a hedge ratio.** If you own 1 call with Δ = 0.5, you need to short 0.5 shares to be delta-neutral (immune to small stock moves).

3. **Delta as probability proxy.** Δ ≈ probability of finishing ITM. A 0.30 delta call has roughly a 30% chance of expiring in the money. (This is an approximation, not exact.)

4. **How delta changes:** Delta isn't constant. As the stock moves, delta changes — which introduces gamma (Module 6).

5. **Worked examples with .mb boxes:** show delta for ITM, ATM, OTM options at various expiries.

---

### Module 6: The Greeks — Gamma, Theta, Vega, Rho
**Tier:** Advanced
**Tool:** Greeks Dashboard (multi-input visualiser)

**Content:**

1. **Gamma (Γ):** Rate of change of delta with respect to stock price.
```
Γ = ∂²C/∂S² = N'(d₁) / (S × σ × √T)

N'(x) = standard normal PDF = (1/√2π) × e^(−x²/2)
```
.pln: "Gamma tells you how fast your delta changes. High gamma means your exposure shifts rapidly with stock moves. ATM options near expiry have the highest gamma — they flip between worthless and valuable quickly."

Key insight: gamma is highest for ATM options near expiry. This is why expiry day is so volatile for options traders.

2. **Theta (Θ):** Rate of time decay.
```
Θ = −∂C/∂T

For ATM calls (simplified):
Θ ≈ −(S × σ × N'(d₁)) / (2√T)

Theta is always negative for long options.
You lose money every day just by holding.
```
.pln: "Theta is the rent you pay for holding an option. Every day that passes, your option loses value — even if the stock doesn't move. ATM options decay fastest. The decay accelerates as expiry approaches — the last 30 days are the most expensive."

The theta decay curve (non-linear — accelerates near expiry) is one of the most important visuals in the module.

3. **Vega (ν):** Sensitivity to volatility.
```
ν = ∂C/∂σ = S × √T × N'(d₁)

Vega is always positive for long options.
Higher volatility = more valuable option (call or put).
```
.pln: "Vega measures how much your option price changes when volatility changes by 1%. If your option has a vega of 0.15, and implied volatility rises from 20% to 21%, your option gains £0.15 per share. This is why options traders care so much about volatility."

4. **Rho (ρ):** Sensitivity to interest rates.
```
ρ = ∂C/∂r = K × T × e^(−rT) × N(d₂)
```
.pln: "Rho matters least of the five Greeks for short-term options. For LEAPS (long-dated options), it becomes significant. A 1% interest rate rise increases long-dated call values noticeably."

5. **Greeks interaction table:** How all five relate and when each matters most.

6. **Interactive tool: Greeks Dashboard.** Input: S, K, T, r, σ. Output: all five Greeks displayed simultaneously, with graphs showing how each changes as you adjust one input variable. The key visual: a multi-panel display showing delta curve, gamma curve, theta decay, and vega surface all updating in real-time.

---

### Module 7: Implied Volatility — The Market's Fear Gauge
**Tier:** Advanced (final Advanced module)
**Tool:** IV Calculator (reverse Black-Scholes)

**Content:**

1. **What implied volatility is:** The volatility value that, when plugged into Black-Scholes, produces the current market price of the option.
```
Observed: option market price = £6.50
Black-Scholes: C(S, K, T, r, σ) = £6.50
Solve for σ → σ_implied = 25.3%

This is NOT historical volatility.
This is the market's EXPECTATION of future volatility.
```

2. **Why IV matters more than historical volatility.** Historical vol tells you what happened. IV tells you what the market thinks will happen. They diverge frequently — especially around earnings, elections, and crises.

3. **The volatility smile and skew:**
```
If Black-Scholes were perfect, IV would be the same
for all strikes at the same expiry. It's not.

Typical pattern (equity options):
  OTM puts: high IV (crash protection is expensive)
  ATM: moderate IV
  OTM calls: lower IV

This "skew" exists because Black-Scholes assumes
normal returns, but real markets have fat tails
(crashes are more likely than the model predicts).
```
.pln: "The volatility smile tells you that the market doesn't believe Black-Scholes's assumptions. OTM puts are expensive because traders fear crashes — they're willing to overpay for downside protection. This is visible in the smile: higher IV at lower strikes."

4. **VIX — the fear index:** How the VIX is calculated from S&P 500 option prices. What VIX levels mean (12-15 = calm, 20-25 = nervous, 30+ = fearful, 50+ = panic).

5. **IV rank and IV percentile:** Where current IV sits relative to its own history. High IV percentile = options are expensive (favour selling). Low IV percentile = options are cheap (favour buying).

6. **Interactive tool: IV Calculator.** Input: option market price, S, K, T, r. Output: implied volatility (solved numerically via Newton-Raphson iteration), comparison to historical volatility, IV percentile if historical data provided.

---

### Module 8: Options Strategy Mathematics
**Tier:** Master
**Tool:** Strategy Builder

**Content:**

Multi-leg options strategies, each derived from first principles with payoff diagrams, Greeks profiles, and break-even calculations.

1. **Covered call:** Own stock + sell call. Payoff = stock payoff − call payoff.
```
Max profit: (K − S₀) + premium received
Max loss: S₀ − premium received (stock goes to zero)
Break-even: S₀ − premium
```

2. **Protective put:** Own stock + buy put. Insurance.
```
Max profit: unlimited (stock rises)
Max loss: (S₀ − K) + premium paid
Break-even: S₀ + premium
```

3. **Vertical spreads (bull call, bear put):** Limited risk, limited reward.
```
Bull call spread: buy call at K₁, sell call at K₂ (K₂ > K₁)
Max profit: K₂ − K₁ − net premium
Max loss: net premium paid
Break-even: K₁ + net premium
```

4. **Straddle and strangle:** Betting on movement, not direction.
```
Long straddle: buy call + buy put (same strike)
Profit if stock moves MORE than the total premium paid
in either direction.

Break-even points: K ± total premium
```

5. **Iron condor:** Selling a range, profiting from low volatility.
```
Sell OTM put spread + sell OTM call spread
Max profit: total premium received
Max loss: width of spread − premium
Profitable if stock stays within the short strikes
```

6. **The Greeks of each strategy:** How delta, gamma, theta, and vega combine across legs.

7. **Interactive tool: Strategy Builder.** Select a strategy (or build custom by adding legs), input strikes, expiry, IV. Output: combined payoff diagram, combined Greeks, max profit/loss, break-even points, probability of profit.

---

### Module 9: Risk Management & Position Sizing
**Tier:** Master
**Tool:** Position Size Calculator

**Content:**

1. **Maximum loss analysis.** For every position, calculate the absolute worst case.

2. **Portfolio Greeks.** When you have multiple positions, your overall exposure is the sum of individual Greeks.
```
Portfolio delta = Σ (Δᵢ × quantityᵢ)
Portfolio theta = Σ (Θᵢ × quantityᵢ)

If portfolio delta = +150: you're exposed to a
150-share equivalent stock move.

Delta-neutral portfolio: adjust positions until
portfolio delta ≈ 0.
```

3. **Kelly Criterion for options.** Applying the bankroll management from Poker School Module 18 to options trading. What fraction of your account to risk per trade.

4. **Correlation and diversification.** Why selling 10 iron condors on the same stock isn't diversification.

5. **Tail risk — what Black-Scholes misses.** Fat tails, black swans, and why the 2008 crash "couldn't happen" according to the normal distribution.
```
Black-Scholes probability of a 10σ daily move: ~10^(−23)
(once in the lifetime of the universe)

Actual frequency: roughly every 10-20 years
(1987, 2001, 2008, 2020)

The model underestimates extreme events by a factor
of trillions. This is why risk management matters
more than the model.
```

6. **Interactive tool: Position Size Calculator.** Input: account size, max risk per trade (%), option price, max loss per contract. Output: number of contracts, total capital at risk, Kelly-optimal position size.

---

### Module 10: Putting It Together — Case Studies
**Tier:** Master (final module)
**Tool:** Scenario Analyser

**Content:**

Real-world case studies applying everything from Modules 1–9:

1. **Earnings play analysis.** Company reports earnings tomorrow. IV has spiked to 60% (normal is 25%). Should you buy or sell options?
- Calculate the "implied move" from the straddle price
- Compare to historical earnings moves
- Show that IV crush after earnings destroys long option positions unless the move is enormous

2. **The 2020 March crash.** VIX hit 82. What happened to options prices? Walk through the Greeks during a crash — delta shifting, gamma exploding, IV spiking, theta becoming irrelevant.

3. **Covered call on a dividend stock.** The mathematics of writing calls against a dividend-paying stock, including early exercise risk (American options) and dividend impact on Black-Scholes.

4. **Iron condor in a low-volatility environment.** When IV is in the 10th percentile, selling premium is cheap. Analyse the risk/reward and the probability of the stock staying within the condor's range.

5. **LEAPS as stock replacement.** Deep ITM LEAPS with delta 0.85 as a leveraged stock position. Calculate the leverage, the time decay cost, and the break-even vs owning shares.

6. **Interactive tool: Scenario Analyser.** Input a position (up to 4 legs), set current conditions and a target scenario (stock moves ±X%, IV changes by Y%). Output: projected P&L, new Greeks, visual comparison of current vs projected payoff.

---

## Build Summary

| Module | Title | Tier | Tool |
|--------|-------|------|------|
| 1 | What Options Actually Are | Free | Payoff diagram (simple) |
| 2 | Probability & Expected Value | Basic | Payoff Diagram Builder |
| 3 | Binomial Model | Basic | Binomial Tree Calculator |
| 4 | Black-Scholes | Basic | Black-Scholes Calculator |
| 5 | The Greeks — Delta | Advanced | Delta Visualiser |
| 6 | The Greeks — Gamma, Theta, Vega, Rho | Advanced | Greeks Dashboard |
| 7 | Implied Volatility | Advanced | IV Calculator |
| 8 | Strategy Mathematics | Master | Strategy Builder |
| 9 | Risk Management & Position Sizing | Master | Position Size Calculator |
| 10 | Case Studies | Master | Scenario Analyser |

**6 interactive tools** built into the browser. Key tools: Black-Scholes calculator (Module 4), Greeks dashboard (Module 6), and Strategy Builder (Module 8) are the ones traders will use repeatedly and share.

---

## Scenarios

Unlike the poker modules which use multiple-choice scenario decisions, Options Maths scenarios are calculation-based:

| Module | Scenario count | Type |
|--------|---------------|------|
| 1 | 10 | Payoff calculations (given S, K → what's the payoff?) |
| 2 | 10 | Expected value calculations |
| 3 | 15 | Binomial tree construction (1-step, 2-step, multi-step) |
| 4 | 15 | Black-Scholes calculations (plug in values, compute price) |
| 5 | 10 | Delta calculations and hedge ratio problems |
| 6 | 15 | Greeks calculations (all five) and interpretation |
| 7 | 10 | IV calculations (reverse Black-Scholes) |
| 8 | 15 | Strategy payoff and break-even calculations |
| 9 | 10 | Position sizing and risk calculations |
| 10 | 10 | Case study analysis (multi-concept) |
| **Total** | **120** | |

---

## Design

Same MathsWins dark design system. Product-specific notes:

- Accent: #06b6d4 (cyan)
- Heavy use of .mb boxes for formulae (lots of maths in this product)
- Every formula gets a .pln translation
- Payoff diagrams in SVG (hockey sticks, combined strategies)
- Greeks visualised as curves that update in real-time with input changes
- Binomial trees as SVG node diagrams

---

## SEO Targets

| Keyword | Competition | Search intent |
|---------|-------------|---------------|
| black scholes explained | Medium | Learning |
| options greeks explained | Medium | Learning |
| implied volatility calculator | Medium-High | Tool |
| options pricing model | Medium | Learning |
| delta gamma theta vega | Medium | Learning |
| black scholes calculator | Medium | Tool |
| binomial options pricing model | Low-Medium | Learning |
| options payoff diagram | Medium | Tool |
| how options are priced | Low-Medium | Learning |
| volatility smile explained | Low | Learning |

**Primary targets:** "black scholes explained," "options greeks explained," and the calculator tool pages (which will rank for tool-intent queries).

---

## Meta Tags

```html
<title>Options Maths — Black-Scholes, Greeks & Pricing Theory | MathsWins</title>
<meta name="description" content="10 modules teaching options pricing mathematics from first principles. Black-Scholes derivation, all five Greeks, implied volatility, and strategy analysis. Interactive calculators. Module 1 free.">
<meta property="og:title" content="Options Maths — The Equations Behind Every Contract">
<meta property="og:description" content="Learn how options are priced, why the Greeks behave the way they do, and what implied volatility really means. Pure mathematics, not trading advice.">
<meta property="og:url" content="https://mathswins.co.uk/academy/options/">
```

---

## Disclaimers (on every module)

```
This is mathematical education, not financial advice. Options
trading involves significant risk of loss. You can lose more than
your initial investment. Past performance does not indicate future
results. Consult a qualified financial adviser before trading.

MoneyHelper (free, government-backed): moneyhelper.org.uk
FCA Register: register.fca.org.uk
```

---

## Responsible Messaging

Options Maths must not:
- Recommend specific trades or strategies
- Suggest that understanding the maths guarantees profits
- Imply that any strategy is "safe" or "risk-free"
- Provide real-time market data or pricing
- Encourage excessive risk-taking

It must:
- Emphasise risk on every module
- Show that Black-Scholes has known limitations (tail risk)
- Include the "not financial advice" disclaimer prominently
- Explain that most retail options traders lose money
- Present the mathematics neutrally — the maths doesn't care about your portfolio

---

## Cross-Links

| From Options Maths | To | Hook text |
|--------------------|----|-----------|
| Module 4 (Black-Scholes) | Trading Maths | "The Kelly Criterion from Trading Maths applies directly to options position sizing." |
| Module 9 (Risk Management) | Poker School | "Bankroll management in poker and position sizing in options use the same Kelly mathematics." |
| Module 7 (Implied Volatility) | Sports Betting Maths | "Implied probability in sports betting and implied volatility in options are the same concept — the market's embedded expectation." |

From other products to Options Maths:
- Trading Maths → "Ready for deeper mathematics? Options Maths derives Black-Scholes from first principles."
- Poker School M18 (Kelly) → "The Kelly Criterion applies to more than poker — see it used for options position sizing."

---

## Competitive Positioning

| Feature | Udemy courses (£20-80) | Options Alpha ($49-99/mo) | Tastytrade (free) | University (£500-2000) | MathsWins (£9.99-29.99) |
|---------|----------------------|--------------------------|-------------------|----------------------|------------------------|
| Black-Scholes derivation | Rarely | No | No | Yes (stochastic calc) | Yes (from binomial, accessible) |
| Interactive calculators | No | Some | Some | No | 6 built-in tools |
| Greeks derived from first principles | Rarely | Conceptual only | Conceptual only | Yes | Yes |
| Plain English translations | Sometimes | Yes | Yes | Rarely | Every formula |
| Implied volatility solver | No | Platform-dependent | Platform-dependent | Homework | Built-in tool |
| Strategy builder | No | Yes ($) | Yes | No | Built-in |
| Price | £20-80 one-off | $588-1188/yr | Free | £500-2000 | £9.99-29.99 one-off |

The unique position: mathematical rigour of a university course, accessibility of a retail platform, price of a textbook. Nobody else occupies this space.

---

## Build Timeline

Options Maths is a substantial product — comparable in scope to the Poker School expansion. Estimated build time:

| Phase | Content | Estimate |
|-------|---------|----------|
| Modules 1–4 (Basic tier) | Core pricing theory, BS formula, binomial model | 2–3 sessions |
| Modules 5–7 (Advanced tier) | Greeks + IV — heavy maths, multiple tools | 2–3 sessions |
| Modules 8–10 (Master tier) | Strategies, risk mgmt, case studies | 2–3 sessions |
| Testing & scenarios | 120 scenarios across 10 modules | 1–2 sessions |

**Total: approximately 7–10 build sessions.**

Build after the Poker School expansion is deployed and payments are live. No point building new products until the infrastructure supports selling them.

---

## Stripe Setup (when ready to build)

Add to Stripe Product Catalogue:

- Product: Options Maths
- Prices: £9.99 (Basic), £17.99 (Advanced), £29.99 (Master)
- 3 Payment Links, same pattern as other multi-tier courses
- NOT included in All Access Pass
- Redirect: `https://mathswins.co.uk/academy/options/?session_id={CHECKOUT_SESSION_ID}`

---

*End of specification. Ready for review.*
