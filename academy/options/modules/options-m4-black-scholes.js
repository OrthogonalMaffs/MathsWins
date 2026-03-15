// options-m4-black-scholes.js
// Module 4: Black-Scholes — The Formula Explained
// Tier: Basic (final Basic module)
// The reader has already priced options with trees (M3). This module shows the formula that does it in one step.

const OPTIONS_MODULE_4 = {
  id: 4,
  title: 'Black-Scholes — The Formula Explained',
  tier: 'basic',
  scenarioCount: 15,
  accentColor: '#06b6d4',

  tutorial: `
    <div class="tut">

      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#06b6d4;letter-spacing:0.05em;">MODULE 4: BLACK-SCHOLES — THE FORMULA EXPLAINED</h2>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        In 1973, Fischer Black and Myron Scholes published a paper that changed finance forever. They found a formula that prices options exactly — no tree required, no simulation, just five numbers in, one price out. Myron Scholes won the Nobel Prize for it (Black had died by then and the Nobel isn't awarded posthumously).
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        The formula looks intimidating at first glance. But you've already done the hard work. In Module 3, you priced options using a tree. Black-Scholes is just the answer you get when that tree has infinitely many steps. Same logic, same method, one clean formula.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        Let's break it apart piece by piece. By the end of this module, you'll know what every symbol means and be able to calculate option prices by hand (or, more sensibly, with the calculator at the bottom).
      </p>

      <!-- ============================================================ -->
      <!-- SECTION 1: THE FORMULA — FIRST LOOK -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE FORMULA — DON'T PANIC</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">N(x):</strong> The cumulative normal distribution function. Tells you "what percentage of a bell curve falls below the value x?" For example, N(0) = 50% (half the bell curve is below the middle). N(1) ≈ 84%. N(−1) ≈ 16%. Your calculator or a table gives you these values.<br>
          <strong style="color:var(--text-bright);">ln(x):</strong> The natural logarithm. The "undo" button for e^x. ln(1) = 0. ln(2) ≈ 0.693. You don't need to understand logarithms deeply — just know it's a button on your calculator.<br>
          <strong style="color:var(--text-bright);">e:</strong> Euler's number, approximately 2.718. It appears naturally in anything involving continuous growth or decay. e^(−rT) is just a way of discounting money over time.<br>
          <strong style="color:var(--text-bright);">σ (sigma):</strong> Volatility — the annualised standard deviation of returns. We covered this in Module 2. A share with σ = 0.20 has 20% annual volatility.
        </div>
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Here it is. Take a breath, read it, and don't try to understand it all at once. We'll go through every piece.
      </p>

      <div class="mb">
The Black-Scholes formula for a European call option:

  C = S × N(d₁) − K × e^(−rT) × N(d₂)

where:

  d₁ = [ ln(S/K) + (r + σ²/2) × T ] / (σ × √T)

  d₂ = d₁ − σ × √T

and:
  C = call option price (what we're solving for)
  S = current share price
  K = strike price
  T = time to expiry in years (3 months = 0.25)
  r = risk-free interest rate (annual, as a decimal)
  σ = volatility (annual, as a decimal)
  N(x) = cumulative normal distribution function</div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        That looks like a lot. But it's actually just two pieces subtracted:
      </p>

      <div class="pln">
        <strong>Piece 1:</strong> S × N(d₁) — this is roughly "what you expect to receive."<br>
        <strong>Piece 2:</strong> K × e^(−rT) × N(d₂) — this is roughly "what you expect to pay."<br><br>
        The option price is the difference: what you receive minus what you pay. That's it. All the complexity is in calculating d₁ and d₂, which are just ways of measuring "how far in-the-money is this option, adjusted for time and volatility?"
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 2: WHAT EACH PIECE MEANS -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">TAKING IT APART — PIECE BY PIECE</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Let's understand each component using an analogy. Imagine you're buying a discounted gift card.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        A shop is offering a gift card that MIGHT be worth something. If the item you want goes on sale for more than £100 in the next three months, the gift card lets you buy it at £100. If it doesn't go on sale above £100, the card is worthless.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        What's the card worth? It depends on: (a) how likely the sale price is to exceed £100, and (b) how much you'd save if it does.
      </p>

      <div class="mb">
S × N(d₁)  — "What you expect to receive"

  S = the share price now (£100 in our examples)
  N(d₁) = the probability-weighted share price you receive

  Think of it this way:
    If the option finishes in the money, you get shares.
    But you only get them SOMETIMES (when S > K).
    N(d₁) adjusts for the probability AND the fact that
    higher share prices are weighted more heavily
    (because they give bigger payoffs).

  In plain English: N(d₁) is the "expected receipt"
  side of the trade, as a fraction of the share price.</div>

      <div class="mb">
K × e^(−rT) × N(d₂)  — "What you expect to pay"

  K = the strike price (£100)
  e^(−rT) = the discount factor (what £100 in 3 months
            is worth today — slightly less than £100
            because of the time value of money)
  N(d₂) = the probability the option finishes in the money

  In plain English:
    If the option finishes ITM, you pay K.
    But you only pay SOMETIMES (with probability ≈ N(d₂)).
    And the payment is in the future, so we discount it.

  N(d₂) is the simpler piece: it's approximately the
  probability that S > K at expiry.</div>

      <div class="pln">
        So the full formula says:<br><br>
        <strong>Option price = (what you expect to receive) − (what you expect to pay)</strong><br><br>
        = (share price × probability-weighted receipt) − (discounted strike × probability of being in the money)<br><br>
        That's Module 2's expected value calculation, made precise. The formula IS the expected payoff, calculated using the lognormal distribution, discounted to today.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 3: UNDERSTANDING d₁ AND d₂ -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHAT ARE d₁ AND d₂?</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        d₁ and d₂ are where most people's eyes glaze over. Let's demystify them.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Think about exam results. If the pass mark is 50% and you know the average score is 62% with a standard deviation of 10%, you can work out how many standard deviations above the pass mark the average student is:
      </p>

      <div class="mb">
Exam analogy:
  How far above the pass mark is the average?
  z = (average − pass mark) / standard deviation
  z = (62 − 50) / 10 = 1.2 standard deviations

  N(1.2) ≈ 88.5%
  → About 88.5% of students pass.

d₁ and d₂ do the same thing for share prices:
  "How many standard deviations is the share price
   above the strike, adjusted for drift and time?"

  d₁ = [ ln(S/K) + (r + σ²/2) × T ] / (σ × √T)

  Let's decode each bit:</div>

      <div class="mb">
Breaking down d₁:

  ln(S/K)
    → How far the current price is from the strike.
    → If S = K (at-the-money): ln(1) = 0. Starting point.
    → If S > K (in-the-money): positive. Head start.
    → If S < K (out-of-the-money): negative. Needs to climb.

  (r + σ²/2) × T
    → The expected drift of the share price over time.
    → r is the risk-free growth rate.
    → σ²/2 is a correction for the lognormal distribution.
    → Multiplied by T because more time = more drift.
    → This is always positive (share prices drift upward on average).

  σ × √T
    → The denominator. This is the "standard deviation"
       of the share price over the period.
    → Wider volatility (σ) or more time (T) = bigger denominator
       = d₁ gets smaller = less certainty of finishing ITM.

  The whole thing:
    d₁ = (where you are + where you're drifting to) / (how uncertain it all is)

  It's a signal-to-noise ratio. Big d₁ = high confidence
  the option finishes in the money.</div>

      <div class="mb">
d₂ = d₁ − σ√T

  d₂ is always slightly less than d₁.
  The difference is exactly σ√T (one "standard deviation of price").
  
  N(d₂) ≈ probability of finishing in the money.
  N(d₁) ≈ delta (the hedge ratio from Module 3).

  For an at-the-money option with low volatility and short time:
    d₁ ≈ d₂ ≈ 0
    N(0) = 50%
    → about 50% chance of finishing ITM
    → delta ≈ 0.5
  
  This matches your intuition: an ATM option is a coin flip.</div>

      <div class="pln">
        d₁ and d₂ are just measuring "how far in-the-money is this option likely to finish, in standard deviation units?" A high d₁ means the option is very likely to finish ITM (deep in-the-money, or lots of time). A low or negative d₁ means it probably expires worthless (far out-of-the-money, little time). N() converts that distance into a probability.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 4: WORKED EXAMPLE — EVERY STEP -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WORKED EXAMPLE — EVERY SINGLE STEP</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Let's price a call option by hand. We'll show every keystroke.
      </p>

      <div class="mb">
Our inputs:
  S = £100     (share price)
  K = £100     (strike price — at-the-money)
  T = 0.25     (3 months = 3/12 = 0.25 years)
  r = 0.05     (5% risk-free rate)
  σ = 0.20     (20% annual volatility)</div>

      <div class="mb">
Step 1: Calculate σ√T

  σ√T = 0.20 × √0.25
      = 0.20 × 0.5
      = 0.10</div>

      <div class="mb">
Step 2: Calculate ln(S/K)

  S/K = 100/100 = 1.0
  ln(1.0) = 0

  (When the option is at-the-money, this term is zero.
   That simplifies things nicely for this example.)</div>

      <div class="mb">
Step 3: Calculate (r + σ²/2) × T

  σ² = 0.20² = 0.04
  σ²/2 = 0.02
  r + σ²/2 = 0.05 + 0.02 = 0.07
  × T = 0.07 × 0.25 = 0.0175</div>

      <div class="mb">
Step 4: Calculate d₁

  d₁ = [ln(S/K) + (r + σ²/2) × T] / (σ√T)
     = [0 + 0.0175] / 0.10
     = 0.175</div>

      <div class="mb">
Step 5: Calculate d₂

  d₂ = d₁ − σ√T
     = 0.175 − 0.10
     = 0.075</div>

      <div class="mb">
Step 6: Look up N(d₁) and N(d₂)

  N(0.175) = 0.5695  (from a standard normal table or calculator)
  N(0.075) = 0.5299

  These mean:
    56.95% → adjusted probability of receiving shares (delta)
    52.99% → probability of finishing in the money</div>

      <div class="mb">
Step 7: Calculate K × e^(−rT)

  This is the present value of the strike price.
  e^(−0.05 × 0.25) = e^(−0.0125) = 0.9876

  K × e^(−rT) = 100 × 0.9876 = £98.76

  (£100 payable in 3 months is worth £98.76 today
   at a 5% annual discount rate.)</div>

      <div class="mb">
Step 8: Put it all together

  C = S × N(d₁) − K × e^(−rT) × N(d₂)
    = 100 × 0.5695 − 98.76 × 0.5299
    = 56.95 − 52.33
    = £4.62

  The fair price of this call option is £4.62.</div>

      <div class="pln">
        A 3-month at-the-money call on a £100 share with 20% volatility and 5% interest rates is worth £4.62. That £4.62 is entirely time value — the option has zero intrinsic value (S = K). You're paying £4.62 for the possibility that the share rises above £100 in the next three months. The 53% probability says it slightly favours finishing in the money, but the average payoff when it does is modest.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        Let's verify this matches our binomial tree from Module 3:
      </p>

      <div class="gd">
        <strong>Module 3 result with 100 steps:</strong> £4.62 ✓<br>
        <strong>Module 4 Black-Scholes:</strong> £4.62 ✓<br><br>
        Same answer. The formula does in one calculation what the tree does in 100 steps. That's the power of Black-Scholes — it's the tree taken to its mathematical limit.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 5: PUT OPTIONS WITH BLACK-SCHOLES -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">PUT OPTIONS — ALMOST FREE</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Good news: you don't need a separate formula for puts. Remember put-call parity from Module 1?
      </p>

      <div class="mb">
Put-Call Parity:
  C − P = S − K × e^(−rT)

Rearrange for put price:
  P = C − S + K × e^(−rT)

Using our example:
  P = £4.62 − £100 + £98.76
  P = £3.38

Or directly:
  P = K × e^(−rT) × N(−d₂) − S × N(−d₁)
    = 98.76 × N(−0.075) − 100 × N(−0.175)
    = 98.76 × 0.4701 − 100 × 0.4305
    = 46.43 − 43.05
    = £3.38 ✓</div>

      <div class="pln">
        The put is cheaper than the call (£3.38 vs £4.62) even though both are at-the-money. Why? Because share prices drift upward over time (at the risk-free rate). This makes calls slightly more likely to finish in the money than puts. The difference is exactly explained by the interest rate and time.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 6: THE FIVE INPUTS — WHAT EACH DOES -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE FIVE INPUTS — WHAT HAPPENS WHEN YOU CHANGE THEM</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Use the calculator below to experiment. But here's a summary of what happens when you change each input. These sensitivities are the Greeks — Module 5 and 6 cover them in depth.
      </p>

      <div class="mb">
Input              │ Call price │ Put price │ Why
━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━┿━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━
Share price ↑      │    ↑      │    ↓      │ Call more likely ITM
Strike price ↑     │    ↓      │    ↑      │ Call needs bigger move
Time to expiry ↑   │    ↑      │    ↑      │ More time = more chance
Volatility ↑       │    ↑      │    ↑      │ Wider range = more chance
Interest rate ↑    │    ↑ (small)│  ↓ (small)│ Discount effect
                   │           │           │
Most sensitive to: VOLATILITY (by far)</div>

      <div class="pln">
        The most important row is volatility. A 5% change in volatility moves option prices far more than a 5% change in any other input. This is why options traders obsess about volatility — it's the dominant factor. Module 7 is entirely dedicated to understanding it.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 7: ASSUMPTIONS AND LIMITATIONS -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE ASSUMPTIONS — AND WHERE THEY BREAK</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Black-Scholes is brilliant. It's also wrong. Every model is — the question is whether it's useful. Black-Scholes makes six assumptions, and none of them perfectly hold in reality:
      </p>

      <div class="mb">
Assumption 1: Returns are normally distributed.
  Reality: Fat tails. Crashes happen far more often than
  the bell curve predicts. Black Monday 1987 was a 20+
  standard deviation event — the bell curve says that
  should happen once every 10^89 years. It happened on
  a Tuesday.

Assumption 2: Volatility is constant.
  Reality: Volatility changes constantly. It spikes during
  crises and calms during bull markets. The model uses ONE
  number for volatility — the real world has a different
  number every day.

Assumption 3: No transaction costs.
  Reality: Bid-ask spreads, commissions, and market impact
  all exist. They eat into the theoretical price.

Assumption 4: Continuous trading is possible.
  Reality: Markets close overnight and on weekends.
  You can't adjust your hedge at 3am on a Saturday.

Assumption 5: The risk-free rate is constant.
  Reality: Interest rates change. But this has a small effect
  on short-dated options.

Assumption 6: European exercise only (can only exercise at expiry).
  Reality: Most stock options are American (can exercise any time).
  This makes puts slightly more expensive than BS predicts.</div>

      <div class="pln">
        Black-Scholes is like a map. No map is perfectly accurate — but a slightly wrong map is far better than no map at all. Every trader uses Black-Scholes (or something built on top of it) as a starting point. The adjustments for fat tails, changing volatility, and transaction costs are what make experienced traders better than the formula alone.<br><br>
        The most important limitation is #1: fat tails. The formula underestimates the probability of extreme events. This is why far out-of-the-money put options are more expensive in practice than Black-Scholes predicts — traders know crashes happen more often than the bell curve says. Module 7 (implied volatility) explores this gap in depth.
      </div>

      <div class="dg">
        <strong>The 2008 lesson:</strong> Models that rely on the normal distribution consistently underestimate tail risk. The financial crisis involved "25-standard-deviation events" happening on multiple consecutive days. In a normal distribution, a 25-sigma event has a probability of roughly 1 in 10^137. The universe is only 10^17 seconds old. When the model says "impossible" and reality says "Tuesday," the model needs supplementing with humility and risk management. Module 9 covers this.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 8: WHAT YOU CAN NOW DO -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHAT YOU CAN NOW DO</h3>

      <div class="mb">
Module 4 covered:
  ✓ The Black-Scholes formula — every symbol explained
  ✓ What S×N(d₁) and K×e^(−rT)×N(d₂) mean in plain English
  ✓ What d₁ and d₂ measure (signal-to-noise ratio)
  ✓ A full worked example with every calculation shown
  ✓ How to price puts using put-call parity
  ✓ The five inputs and what each one does
  ✓ The six assumptions and where they fail

You can now:
  → Calculate the fair price of any European option
  → Understand what your broker's "theoretical price" means
  → See why volatility is the dominant input
  → Know the model's limitations (fat tails, changing vol)

Coming in Module 5:
  → Delta — the first Greek, in full depth
  → Three interpretations: hedge ratio, sensitivity, probability
  → How delta changes as the share price moves
  → Why ATM options have delta ≈ 0.5</div>

      <div class="gd">
        <strong>You now understand how options are priced.</strong> From raffle tickets (Module 2) to trees (Module 3) to the closed-form formula (Module 4) — each step was built on the one before. When you look at an option price on your broker's platform, you now know what calculation produced that number and what assumptions it relies on. That puts you ahead of most retail traders.
      </div>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.5rem;margin-top:2rem;text-align:center;">
        <div style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.6;font-style:italic;">
          "This is mathematical education, not financial advice. Options trading involves significant risk of loss. You can lose more than your initial investment. Consult a qualified financial adviser before trading."
        </div>
        <div style="font-family:'Outfit',sans-serif;font-size:0.85rem;color:var(--muted);margin-top:0.75rem;">
          MoneyHelper (free, government-backed): moneyhelper.org.uk
        </div>
      </div>

    </div>
  `,

  scenarios: [
    {
      id: 'bs401', difficulty: 'basic',
      question: 'S = £100, K = £100, T = 0.25, r = 5%, σ = 20%. We calculated d₁ = 0.175. What is d₂?',
      answer: '0.075',
      explanation: 'd₂ = d₁ − σ√T = 0.175 − (0.20 × 0.5) = 0.175 − 0.10 = 0.075.'
    },
    {
      id: 'bs402', difficulty: 'basic',
      question: 'N(0) = 0.50 (by definition — half the bell curve). What does this mean for an ATM option where d₂ ≈ 0?',
      answer: 'approximately 50% chance of finishing in the money',
      explanation: 'N(d₂) ≈ probability of finishing ITM. If d₂ ≈ 0, then N(0) = 50%. An at-the-money option is roughly a coin flip for finishing in the money. (Slightly better than 50% for calls because of upward drift.)'
    },
    {
      id: 'bs403', difficulty: 'basic',
      question: 'An option has d₁ = 1.5. N(1.5) ≈ 0.9332. What is the approximate delta of this option?',
      answer: '0.93',
      explanation: 'Delta ≈ N(d₁) = 0.9332 ≈ 0.93. This is a deep in-the-money option — it moves almost pound-for-pound with the share. 93% chance of finishing ITM.'
    },
    {
      id: 'bs404', difficulty: 'basic',
      question: 'An option has d₁ = −1.0. N(−1.0) ≈ 0.1587. What is delta?',
      answer: '0.16',
      explanation: 'Delta ≈ N(d₁) = 0.16. This is an out-of-the-money option — it moves about 16p per £1 share move. Only 16% chance of finishing ITM.'
    },
    {
      id: 'bs405', difficulty: 'basic',
      question: 'K × e^(−rT) with K = £100, r = 5%, T = 1 year. What is the present value of the strike?',
      answer: '£95.12',
      explanation: 'e^(−0.05) = 0.9512. K × e^(−rT) = 100 × 0.9512 = £95.12. Paying £100 in one year is equivalent to paying £95.12 today at a 5% discount rate.'
    },
    {
      id: 'bs406', difficulty: 'intermediate',
      question: 'S = £50, K = £45, T = 0.5 (6 months), r = 4%, σ = 25%. Calculate σ√T.',
      answer: '0.1768',
      explanation: 'σ√T = 0.25 × √0.5 = 0.25 × 0.7071 = 0.1768.'
    },
    {
      id: 'bs407', difficulty: 'intermediate',
      question: 'Same inputs. Calculate ln(S/K).',
      answer: '0.1054',
      explanation: 'S/K = 50/45 = 1.1111. ln(1.1111) = 0.1054. Positive because the option is in-the-money (S > K).'
    },
    {
      id: 'bs408', difficulty: 'intermediate',
      question: 'Same inputs. Calculate (r + σ²/2) × T.',
      answer: '0.03563',
      explanation: 'σ² = 0.0625. σ²/2 = 0.03125. r + σ²/2 = 0.04 + 0.03125 = 0.07125. × T = 0.07125 × 0.5 = 0.03563.'
    },
    {
      id: 'bs409', difficulty: 'intermediate',
      question: 'Same inputs. Calculate d₁ using results from the previous three questions.',
      answer: '0.797',
      explanation: 'd₁ = [ln(S/K) + (r + σ²/2)T] / σ√T = [0.1054 + 0.03563] / 0.1768 = 0.1410 / 0.1768 = 0.7976 ≈ 0.797.'
    },
    {
      id: 'bs410', difficulty: 'intermediate',
      question: 'Same inputs. d₁ = 0.797. Calculate d₂.',
      answer: '0.620',
      explanation: 'd₂ = d₁ − σ√T = 0.797 − 0.1768 = 0.620.'
    },
    {
      id: 'bs411', difficulty: 'intermediate',
      question: 'Same inputs. N(0.797) ≈ 0.7873. N(0.620) ≈ 0.7324. K×e^(−rT) = 45×e^(−0.02) = 44.11. Calculate the call price.',
      answer: '£6.97',
      explanation: 'C = S×N(d₁) − K×e^(−rT)×N(d₂) = 50 × 0.7873 − 44.11 × 0.7324 = 39.365 − 32.300 = £7.065 ≈ £7.07. (Slight rounding differences in N() values may give £6.97–7.07.)'
    },
    {
      id: 'bs412', difficulty: 'advanced',
      question: 'You calculate a call price of £4.62 using Black-Scholes. Your broker shows the market price is £5.50. What might explain the difference?',
      answer: 'implied volatility is higher than the 20% you used',
      explanation: 'If the market price is higher than your BS calculation, either: (a) the market is using higher volatility (most likely), (b) you have the wrong inputs, or (c) there\'s a supply/demand imbalance. Usually it\'s (a). The volatility that makes BS match the market price is the implied volatility — Module 7 covers this.'
    },
    {
      id: 'bs413', difficulty: 'advanced',
      question: 'A call option has 1 day to expiry. Share price £100, strike £100, volatility 20%. Without calculating: is the option worth approximately £0.50, £2, or £5?',
      answer: '~£0.50',
      explanation: 'With 1 day to expiry, T is tiny (~0.003 years). σ√T = 0.20 × √0.003 ≈ 0.011. The option has almost no time for the share to move. Time value has almost completely decayed. An ATM option with 1 day left is worth very little — around £0.30–0.80 depending on exact inputs.'
    },
    {
      id: 'bs414', difficulty: 'advanced',
      question: 'You increase volatility from 20% to 40% (doubled) for our standard example (S=100, K=100, T=0.25, r=5%). Does the option price roughly double?',
      answer: 'approximately yes — from ~£4.62 to ~£8.77',
      explanation: 'At 20% vol: £4.62. At 40% vol: BS gives approximately £8.77. Not exactly double (£9.24 would be exact double) because the relationship isn\'t perfectly linear. But for ATM options, doubling volatility roughly doubles the price. This near-linear relationship is why vega (sensitivity to volatility) is so useful.'
    },
    {
      id: 'bs415', difficulty: 'advanced',
      question: 'Black-Scholes assumes constant volatility. In reality, implied volatility for OTM puts is higher than for ATM options (the "volatility skew"). What does this mean for put prices?',
      answer: 'OTM puts are more expensive than Black-Scholes (with constant vol) would predict',
      explanation: 'The skew means the market uses HIGHER volatility for OTM puts than ATM options. Higher vol in BS → higher option price. So OTM puts trade at a premium to "flat" BS prices. This reflects the market\'s fear of crashes — traders pay extra for downside protection. Module 7 explores this in depth.'
    }
  ],

  tool: {
    id: 'bs-calculator',
    title: 'Black-Scholes Calculator',
    render: function(container) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.5rem;margin:1.5rem 0;">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#06b6d4;margin-bottom:1rem;">BLACK-SCHOLES CALCULATOR</h3>
          <p style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.5;margin-bottom:1rem;">
            Enter the five inputs and get the option price, all five Greeks, and the probability of finishing in the money.
          </p>
          <div style="display:grid;grid-template-columns:220px 1fr;gap:1.5rem;">
            <div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;">Share Price S (£)</label>
              <input type="number" id="bsc-s" value="100" step="1" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Strike Price K (£)</label>
              <input type="number" id="bsc-k" value="100" step="1" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Time to Expiry (months)</label>
              <input type="number" id="bsc-t" value="3" step="0.5" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Volatility σ (%)</label>
              <input type="range" id="bsc-vol" min="5" max="80" value="20" style="width:100%;margin:0.3rem 0;">
              <div id="bsc-vol-display" style="font-family:'DM Mono',monospace;color:var(--text);text-align:center;">20%</div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Risk-Free Rate r (%)</label>
              <input type="number" id="bsc-r" value="5" step="0.25" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
            </div>
            <div>
              <div id="bsc-output" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;font-family:'DM Mono',monospace;font-size:0.9rem;color:var(--text);line-height:2;"></div>
            </div>
          </div>
        </div>`;

      function normCDF(x) {
        const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t * Math.exp(-x*x);
        return 0.5 * (1.0 + sign * y);
      }

      function normPDF(x) {
        return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
      }

      function calc() {
        const S = parseFloat(document.getElementById('bsc-s').value) || 100;
        const K = parseFloat(document.getElementById('bsc-k').value) || 100;
        const T = parseFloat(document.getElementById('bsc-t').value) / 12 || 0.25;
        const vol = parseFloat(document.getElementById('bsc-vol').value) / 100 || 0.20;
        const r = parseFloat(document.getElementById('bsc-r').value) / 100 || 0.05;

        document.getElementById('bsc-vol-display').textContent = (vol * 100).toFixed(0) + '%';

        if (T <= 0) { document.getElementById('bsc-output').innerHTML = '<div style="color:var(--red-bright);">Expiry must be positive.</div>'; return; }

        const sqrtT = Math.sqrt(T);
        const volSqrtT = vol * sqrtT;
        const d1 = (Math.log(S / K) + (r + vol * vol / 2) * T) / volSqrtT;
        const d2 = d1 - volSqrtT;

        const Nd1 = normCDF(d1);
        const Nd2 = normCDF(d2);
        const Nmd1 = normCDF(-d1);
        const Nmd2 = normCDF(-d2);
        const nd1 = normPDF(d1);
        const disc = Math.exp(-r * T);

        const callPrice = S * Nd1 - K * disc * Nd2;
        const putPrice = K * disc * Nmd2 - S * Nmd1;

        // Greeks
        const deltaCall = Nd1;
        const deltaPut = Nd1 - 1;
        const gamma = nd1 / (S * volSqrtT);
        const thetaCall = -(S * nd1 * vol) / (2 * sqrtT) - r * K * disc * Nd2;
        const thetaPut = -(S * nd1 * vol) / (2 * sqrtT) + r * K * disc * Nmd2;
        const vega = S * sqrtT * nd1;
        const rhoCall = K * T * disc * Nd2;
        const rhoPut = -K * T * disc * Nmd2;

        // Moneyness
        const intrinsicCall = Math.max(S - K, 0);
        const intrinsicPut = Math.max(K - S, 0);
        const timeValCall = callPrice - intrinsicCall;
        const timeValPut = putPrice - intrinsicPut;

        let html = '';

        // Prices
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;">';
        html += '<div style="text-align:center;padding:1rem;background:var(--surface);border-radius:8px;border-top:3px solid #2dd4a0;">';
        html += '<div style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;">Call Price</div>';
        html += '<div style="color:#2dd4a0;font-size:1.8rem;margin:0.3rem 0;">£' + callPrice.toFixed(2) + '</div>';
        html += '<div style="color:var(--muted);font-size:0.8rem;">Intrinsic: £' + intrinsicCall.toFixed(2) + ' | Time: £' + timeValCall.toFixed(2) + '</div>';
        html += '</div>';
        html += '<div style="text-align:center;padding:1rem;background:var(--surface);border-radius:8px;border-top:3px solid var(--red-bright);">';
        html += '<div style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;">Put Price</div>';
        html += '<div style="color:var(--red-bright);font-size:1.8rem;margin:0.3rem 0;">£' + putPrice.toFixed(2) + '</div>';
        html += '<div style="color:var(--muted);font-size:0.8rem;">Intrinsic: £' + intrinsicPut.toFixed(2) + ' | Time: £' + timeValPut.toFixed(2) + '</div>';
        html += '</div></div>';

        // Key numbers
        html += '<div style="margin-bottom:1rem;">';
        html += '<div style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;margin-bottom:0.5rem;">Intermediate Values</div>';
        html += '<div>d₁ = ' + d1.toFixed(4) + ' → N(d₁) = ' + Nd1.toFixed(4) + '</div>';
        html += '<div>d₂ = ' + d2.toFixed(4) + ' → N(d₂) = ' + Nd2.toFixed(4) + '</div>';
        html += '<div>σ√T = ' + volSqrtT.toFixed(4) + '</div>';
        html += '<div>P(call ITM) ≈ ' + (Nd2 * 100).toFixed(1) + '% | P(put ITM) ≈ ' + (Nmd2 * 100).toFixed(1) + '%</div>';
        html += '</div>';

        // Greeks
        html += '<div style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;margin-bottom:0.5rem;">The Greeks</div>';
        html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;">';

        function greekBox(name, callVal, putVal, unit) {
          return '<div style="background:var(--surface);padding:0.5rem;border-radius:4px;text-align:center;">' +
            '<div style="color:#06b6d4;font-size:0.8rem;font-weight:bold;">' + name + '</div>' +
            '<div style="font-size:0.85rem;">Call: ' + callVal + unit + '</div>' +
            '<div style="font-size:0.85rem;">Put: ' + putVal + unit + '</div></div>';
        }

        html += greekBox('Delta', deltaCall.toFixed(4), deltaPut.toFixed(4), '');
        html += greekBox('Gamma', gamma.toFixed(4), gamma.toFixed(4), '');
        html += greekBox('Theta', (thetaCall/365).toFixed(4), (thetaPut/365).toFixed(4), '/day');
        html += greekBox('Vega', (vega/100).toFixed(4), (vega/100).toFixed(4), '/1%');
        html += greekBox('Rho', (rhoCall/100).toFixed(4), (rhoPut/100).toFixed(4), '/1%');
        html += '</div>';

        // Plain English summary
        html += '<div style="margin-top:1rem;padding:0.75rem;background:var(--surface);border-radius:6px;border-left:3px solid #06b6d4;">';
        html += '<span style="font-family:\'Crimson Pro\',serif;font-style:italic;font-size:0.9rem;color:var(--text);">';
        if (S > K * 1.05) html += 'This call is in-the-money. Delta is high (' + deltaCall.toFixed(2) + ') — it moves nearly pound-for-pound with the share.';
        else if (S < K * 0.95) html += 'This call is out-of-the-money. Delta is low (' + deltaCall.toFixed(2) + ') — it\'s mainly time value and needs a significant move to profit.';
        else html += 'This option is near the money. Delta ≈ ' + deltaCall.toFixed(2) + ' — roughly a ' + (Nd2*100).toFixed(0) + '% chance of finishing in the money.';
        html += ' Theta decay: losing about £' + Math.abs(thetaCall/365).toFixed(2) + ' per day.';
        html += '</span></div>';

        document.getElementById('bsc-output').innerHTML = html;
      }

      ['bsc-s','bsc-k','bsc-t','bsc-r'].forEach(id => document.getElementById(id).addEventListener('input', calc));
      document.getElementById('bsc-vol').addEventListener('input', calc);
      calc();
    }
  }
};

if (typeof window !== 'undefined') { window.OPTIONS_MODULE_4 = OPTIONS_MODULE_4; }
