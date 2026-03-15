// options-m2-probability.js
// Module 2: Probability & Expected Value in Options
// Tier: Basic
// Real-world analogies → then maths. Same tone as Module 1.

const OPTIONS_MODULE_2 = {
  id: 2,
  title: 'Probability & Expected Value in Options',
  tier: 'basic',
  scenarioCount: 10,
  accentColor: '#06b6d4',

  tutorial: `
    <div class="tut">

      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#06b6d4;letter-spacing:0.05em;">MODULE 2: PROBABILITY & EXPECTED VALUE IN OPTIONS</h2>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        In Module 1, we learned what options are and how their payoffs work. We ended with a question: <em>what should the premium be?</em> To answer that, we need to talk about probability. Don't panic — we're starting with raffle tickets, not equations.
      </p>

      <!-- ============================================================ -->
      <!-- SECTION 1: EXPECTED VALUE — THE RAFFLE TICKET -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE RAFFLE TICKET PROBLEM</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Expected value (EV):</strong> The average outcome if you repeated something many, many times. Not what happens once — what happens on average over thousands of repetitions.<br>
          <strong style="color:var(--text-bright);">Probability:</strong> How likely something is to happen, expressed as a number between 0 (impossible) and 1 (certain). A coin flip is 0.5. Rolling a six is 1/6 ≈ 0.167.
        </div>
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Your local pub is running a raffle. 100 tickets are sold at £2 each. The prize is £100. Should you buy a ticket?
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Your gut might say "probably not worth it." Let's put a number on "probably not."
      </p>

      <div class="mb">
The raffle:
  100 tickets. You buy 1. Prize: £100.

  Probability of winning: 1/100 = 1%
  If you win: you gain £100 − £2 (ticket cost) = £98
  If you lose: you lose £2

  Expected value:
    EV = (chance of winning × what you gain)
       + (chance of losing × what you lose)

    EV = (0.01 × £98) + (0.99 × −£2)
    EV = £0.98 − £1.98
    EV = −£1.00</div>

      <div class="pln">
        On average, every £2 raffle ticket loses you £1. Not every time — sometimes you win £100 and feel brilliant. But if you bought a raffle ticket every week for 10 years, you'd be about £520 poorer. Expected value tells you the long-run reality behind the short-run excitement.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1.5rem;">
        Now here's the key insight: <strong style="color:var(--text-bright);">an option is a raffle ticket where the prize depends on the share price.</strong>
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        When you buy a call option for £4, you're paying for the <em>chance</em> that the share price ends up above the strike. If it does, you win (share price − strike). If it doesn't, you lose the £4.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        So the fair price of an option is its expected value — the average of all possible payoffs, weighted by their probabilities. If we can figure out the probability of every possible share price at expiry, we can calculate the fair premium.
      </p>

      <div class="gd">
        <strong>This is the entire foundation of options pricing:</strong> work out all possible outcomes, multiply each by its probability, add them up. That's it. Everything else — the binomial model, Black-Scholes, the Greeks — is just increasingly clever ways of doing this calculation.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 2: EXPECTED VALUE OF AN OPTION -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE EXPECTED VALUE OF A CALL OPTION</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Let's make this concrete. Imagine a very simple world where a share can only end up at one of five prices:
      </p>

      <div class="mb">
Share is currently £100. Call option strike: £100.
At expiry, the share will be one of these prices:

  Price    │  Probability  │  Call payoff (max(S−100, 0))
  ━━━━━━━━━┿━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  £80      │     10%       │  max(80 − 100, 0) = £0
  £90      │     20%       │  max(90 − 100, 0) = £0
  £100     │     40%       │  max(100 − 100, 0) = £0
  £110     │     20%       │  max(110 − 100, 0) = £10
  £120     │     10%       │  max(120 − 100, 0) = £20</div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Now we calculate the expected value exactly like the raffle ticket — multiply each payoff by its probability and add them up:
      </p>

      <div class="mb">
Expected value of the call:

  Step 1: Multiply each payoff by its probability
    £0 × 0.10 = £0.00
    £0 × 0.20 = £0.00
    £0 × 0.40 = £0.00
    £10 × 0.20 = £2.00
    £20 × 0.10 = £2.00

  Step 2: Add them up
    £0 + £0 + £0 + £2.00 + £2.00 = £4.00

  The fair price of this call option is £4.00</div>

      <div class="pln">
        The maths says this option should cost £4. Why? Because if you bought it thousands of times in this simplified world, you'd average £4 of payoff per option. Pay more than £4 and you lose money over time. Pay less and you profit. £4 is the fair price — the point where neither buyer nor seller has an edge.<br><br>
        Notice that the option only pays out 30% of the time (when the share goes to £110 or £120). The other 70% of the time, it expires worthless. But those 30% payouts are big enough to make the option worth £4 on average.
      </div>

      <div class="pt">
        <strong>The challenge:</strong> In our toy example, we made up the probabilities (10%, 20%, 40%, etc.). In real markets, nobody tells you the probability of a share being at £110 in three months. We need a mathematical model to estimate those probabilities. That's what Module 3 (the binomial model) and Module 4 (Black-Scholes) provide.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 3: WHY PROBABILITY IS HARD — WEATHER ANALOGY -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHY PREDICTING SHARE PRICES IS LIKE FORECASTING WEATHER</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Weather forecasters don't tell you "it will be 18°C tomorrow." They have a model that says "there's a range of possible temperatures, with 18°C being the most likely, but it could be anywhere from 15°C to 22°C."
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Share prices work the same way. We can't predict exactly where a share will be in three months. But we can describe the <em>range of possibilities</em> and how likely each one is. We do this with something called a probability distribution.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Think of it like this: if you threw a ball at a target, you'd expect most throws to land near the centre, with fewer landing far away. The pattern of where balls land IS the distribution. Some distributions are wide (you're rubbish at throwing), some are narrow (you're precise).
      </p>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Probability distribution:</strong> A picture (or formula) showing all possible outcomes and how likely each one is. Like a bar chart of possibilities.<br>
          <strong style="color:var(--text-bright);">Normal distribution (bell curve):</strong> The most common pattern in nature. Most values cluster near the middle, with fewer and fewer at the extremes. Heights, test scores, measurement errors — they all follow this shape.<br>
          <strong style="color:var(--text-bright);">Volatility:</strong> How spread out the distribution is. High volatility = wide spread = wild swings. Low volatility = narrow spread = stable prices. This is the single most important concept in options pricing.
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 4: RETURNS VS PRICES -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">A CRUCIAL DISTINCTION: PRICES VS RETURNS</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Here's something that trips up even experienced traders. Share <em>prices</em> don't follow a bell curve. Share <em>returns</em> do. Let me explain why this matters with a simple example.
      </p>

      <div class="mb">
A share is at £100. It can go up or down by 10% each month.

After month 1:
  Up 10%:   £100 × 1.10 = £110
  Down 10%: £100 × 0.90 = £90

After month 2 (starting from £110):
  Up again:   £110 × 1.10 = £121
  Down:       £110 × 0.90 = £99

After month 2 (starting from £90):
  Up:         £90 × 1.10 = £99
  Down again: £90 × 0.90 = £81

Notice: up 10% then down 10% gives you £99, not £100.
And the possible prices after 2 months are:
  £121, £99, £99, £81 — NOT evenly spaced around £100.</div>

      <div class="pln">
        Percentage changes (returns) are symmetric: +10% and −10% are equally likely. But the resulting prices are NOT symmetric: a 10% rise adds £10, but a 10% fall subtracts only £9 (because 10% of £90 is less than 10% of £100). This asymmetry is why share prices can never go below zero — repeated percentage losses shrink the price but never reach zero. The mathematical term for this is a <strong>lognormal distribution</strong>.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        Don't worry about the word "lognormal." All it means is:
      </p>

      <div class="pt">
        <strong>Lognormal in plain English:</strong> Share prices behave like compound interest gone random. They grow (or shrink) by percentages, not by fixed amounts. A £10 share and a £1,000 share both experience "a 5% day" — but that's 50p for one and £50 for the other. The percentage is the same; the pound amount is proportional to the price. This is what "lognormal" captures.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        Why does this matter for options? Because when we model where a share price might end up, we need to use the right shape of distribution. Using a normal (bell curve) shape for prices would allow negative prices, which is nonsense. Using a lognormal shape — which is what Black-Scholes does — keeps prices positive and captures the real-world behaviour of markets.
      </p>

      <!-- ============================================================ -->
      <!-- SECTION 5: VOLATILITY — THE KEY INPUT -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">VOLATILITY — THE MOST IMPORTANT WORD IN OPTIONS</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Imagine two shares, both at £100:
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;padding-left:1.5rem;">
        <strong>Share A</strong> (a boring utility company): moves about 1% on a typical day. In a month, it might be anywhere from £95 to £105.<br><br>
        <strong>Share B</strong> (a volatile tech startup): moves 5% on a typical day. In a month, it could be anywhere from £70 to £150.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Now imagine buying a call option with a £110 strike on each.
      </p>

      <div class="mb">
Call option, strike £110, one month to expiry.

Share A (low volatility): likely range £95–£105
  The share almost certainly won't reach £110.
  This option will almost certainly expire worthless.
  Fair price: very low — maybe £0.10.

Share B (high volatility): possible range £70–£150
  There's a real chance the share reaches £110 or higher.
  This option has a meaningful chance of paying out.
  Fair price: much higher — maybe £8.

Same share price. Same strike. Same expiry.
The ONLY difference is volatility.
The volatile option costs 80× more.</div>

      <div class="pln">
        This is why volatility is the most important concept in options. It determines how wide the range of possible future prices is — and therefore how likely the option is to finish in the money. Higher volatility = wider range = more chance of a big payoff = more expensive option. This applies to both calls AND puts.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        Volatility is measured as a percentage — the annualised standard deviation of returns. Don't worry about the formula yet. Just understand the intuition:
      </p>

      <div class="mb">
Volatility examples:

  10% volatility: calm, stable share
    → In one year, there's a 68% chance the share
       stays within ±10% of today's price.
    → £100 share: probably between £90 and £110.

  30% volatility: active, jumpy share
    → 68% chance of staying within ±30%.
    → £100 share: probably between £70 and £130.

  60% volatility: wild, speculative share
    → 68% chance of staying within ±60%.
    → £100 share: could be anywhere from £40 to £160.

  That "68%" comes from the bell curve: one standard
  deviation either side covers about 68% of outcomes.
  Two standard deviations covers 95%.

  At 30% volatility:
    68% chance of £70–£130
    95% chance of £49–£200 (approximately)</div>

      <div class="pln">
        When your broker shows "implied volatility: 25%" next to an option, it's telling you: the market expects this share to move within ±25% over the next year. If you think the share will move more than that, the option is cheap (buy it). If you think it'll move less, the option is expensive (sell it). Module 7 goes deep on this — it's where the real edge in options trading lives.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 6: PUTTING IT TOGETHER — OPTION PRICING LOGIC -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">PUTTING IT TOGETHER — HOW OPTIONS ARE PRICED</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        We now have all the building blocks. Here's how options pricing works, in plain English:
      </p>

      <div class="pt" style="margin:1.5rem 0;">
        <strong>Step 1:</strong> Take today's share price.<br>
        <strong>Step 2:</strong> Use the volatility to build a probability distribution — a picture of all possible prices at expiry and how likely each one is.<br>
        <strong>Step 3:</strong> For each possible price, calculate the option's payoff (using our max(S−K, 0) formula).<br>
        <strong>Step 4:</strong> Multiply each payoff by its probability.<br>
        <strong>Step 5:</strong> Add them all up. That's the expected payoff.<br>
        <strong>Step 6:</strong> Adjust for the fact that the payoff is in the future (a pound tomorrow is worth slightly less than a pound today).<br><br>
        The result is the fair option price.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        That's it. That's the entire logic behind Black-Scholes, the binomial model, and every options pricing model ever invented. They differ in HOW they do steps 2–6, but the logic is always the same.
      </p>

      <div class="mb">
Let's redo our earlier example, but think about what each step does:

Share: £100. Strike: £100. Three months to expiry.
Volatility: 20% annually.

Step 1: Share price = £100 ✓

Step 2: Volatility tells us the range.
  20% annual vol over 3 months ≈ 10% range
  (We halve the annual number because it's only a quarter
   of a year — the exact scaling is × √(T), which we'll
   cover in Module 4. For now, just accept 10%.)
  Most likely outcome: around £100 (no change)
  68% chance: between £90 and £110
  95% chance: between £80 and £120

Step 3: Calculate payoff at each price.
  We already did this in the table above.

Step 4 & 5: Multiply and sum.
  We got £4.00.

Step 6: Adjust for time value of money.
  At 5% risk-free rate for 3 months: multiply by e^(−0.05×0.25)
  £4.00 × 0.9876 ≈ £3.95

  Fair call price ≈ £3.95</div>

      <div class="pln">
        We just priced an option. Not with Black-Scholes — with a table and multiplication. The answer (£3.95) is approximate because our five-point distribution was crude. Black-Scholes does the same calculation but with an infinitely smooth distribution (a continuous curve instead of five bars). That gives an exact answer. But the logic is identical.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 7: WHAT AFFECTS OPTION PRICES — THE FIVE INPUTS REVISITED -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE FIVE INPUTS — NOW YOU UNDERSTAND WHY</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        In Module 1, we listed five things that affect an option's price. Now you can see <em>why</em> each one matters:
      </p>

      <div class="mb">
1. Share price vs strike price
   Determines how much of the distribution is "in the money."
   Deeper ITM → higher probability of payoff → more expensive.

2. Time to expiry
   More time → more chance of a big move → wider distribution
   → more chance of finishing ITM → more expensive.

3. Volatility
   Higher vol → wider distribution → same effect as more time
   → more expensive. This is the BIG one.

4. Risk-free interest rate
   Affects Step 6 (discounting). Higher rate → future payoff
   worth slightly less today. Small effect for short-dated options.

5. Dividends
   A share drops by the dividend amount on ex-date.
   This shifts the distribution left (lower expected price)
   → calls slightly cheaper, puts slightly more expensive.</div>

      <div class="pln">
        Everything comes back to the probability distribution. Each input either shifts the distribution (share price, dividends), widens it (volatility, time), or changes how we discount the result (interest rate). Once you see options through this lens, the pricing makes intuitive sense.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 8: HISTORICAL VS IMPLIED -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">TWO KINDS OF PROBABILITY — A PREVIEW</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Historical volatility:</strong> How much the share actually moved in the past. Measured from past data. Backward-looking.<br>
          <strong style="color:var(--text-bright);">Implied volatility:</strong> How much the market expects the share to move in the future. Extracted from current option prices. Forward-looking.
        </div>
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        This is like the difference between looking at last year's weather data versus reading tomorrow's forecast. Last year tells you what DID happen. The forecast tells you what the weather service EXPECTS to happen. They're often similar — but not always.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Before a company announces its earnings, implied volatility spikes — the market expects a big move. Historical volatility might be low because the share has been calm recently. After the announcement, implied volatility crashes back down (called "IV crush"). This gap between historical and implied is one of the main things options traders try to exploit.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        We'll cover implied volatility properly in Module 7. For now, just know that it exists and that it's the market's best guess — embedded in option prices — about future volatility.
      </p>

      <!-- ============================================================ -->
      <!-- SECTION 9: MODULE SUMMARY -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHAT YOU NOW KNOW</h3>

      <div class="mb">
Module 2 covered:
  ✓ Expected value — the raffle ticket logic
  ✓ An option's fair price = expected payoff (weighted by probability)
  ✓ Probability distributions — the range of possible outcomes
  ✓ Why returns are normal but prices are lognormal
  ✓ Volatility — the width of the distribution
  ✓ How all five inputs connect to the probability distribution
  ✓ Historical vs implied volatility (preview)

Coming in Module 3:
  → The binomial model — we price an option with a simple tree
  → No Black-Scholes formula needed — just logic and arithmetic
  → The concept of "risk-neutral pricing" — the clever trick
     that makes options pricing work without knowing
     real-world probabilities</div>

      <div class="gd">
        <strong>The payoff from this module:</strong> You now understand that an option price is just an expected value calculation — the weighted average of all possible payoffs. Every pricing model, no matter how complex, is doing this same thing with better tools. When someone says "Black-Scholes," they're describing a very precise way of calculating the expected value we just calculated with a table.
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
      id: 'op201', difficulty: 'basic',
      question: 'A raffle has 200 tickets at £5 each. Prize is £500. What is the expected value of buying one ticket?',
      answer: '−£2.50',
      explanation: 'P(win) = 1/200 = 0.5%. EV = (0.005 × £495) + (0.995 × −£5) = £2.475 − £4.975 = −£2.50. On average, you lose £2.50 per ticket.'
    },
    {
      id: 'op202', difficulty: 'basic',
      question: 'A call option (strike £50) can finish at three prices: £40 (40% chance), £55 (35% chance), or £70 (25% chance). What is the expected payoff?',
      answer: '£6.75',
      explanation: 'Payoffs: max(40−50,0)=£0, max(55−50,0)=£5, max(70−50,0)=£20. EV = (0.40×£0) + (0.35×£5) + (0.25×£20) = £0 + £1.75 + £5.00 = £6.75.'
    },
    {
      id: 'op203', difficulty: 'basic',
      question: 'Same option as above (EV = £6.75). If the option is selling for £8, is it overpriced or underpriced?',
      answer: 'overpriced',
      explanation: 'The expected payoff is £6.75 but it costs £8. You\'re paying more than the average payoff. EV of buying = £6.75 − £8.00 = −£1.25 per option. Overpriced by £1.25.'
    },
    {
      id: 'op204', difficulty: 'basic',
      question: 'Share A has 15% volatility. Share B has 40% volatility. Both are at £100 with the same strike and expiry. Which has the more expensive call option?',
      answer: 'Share B (higher volatility)',
      explanation: 'Higher volatility means a wider range of possible prices. More chance of finishing deep in-the-money. More chance of a big payoff. More valuable option.'
    },
    {
      id: 'op205', difficulty: 'basic',
      question: 'A call option expires in 1 week. An identical call expires in 6 months. Same share, same strike. Which costs more?',
      answer: 'the 6-month option',
      explanation: 'More time = more chance of a big price move = wider probability distribution = higher expected payoff = more expensive option. Time is always additive to option value.'
    },
    {
      id: 'op206', difficulty: 'intermediate',
      question: 'A share is at £100. Call strike is £100. Volatility is 20% per year. Approximately what range will the share be in after 1 year with 68% probability?',
      answer: '£80 to £120 (approximately)',
      explanation: '20% volatility means one standard deviation is ±20%. 68% of outcomes fall within one SD. So 68% chance the share is between £100×0.80=£80 and £100×1.20=£120. (The exact lognormal calculation gives a slightly asymmetric range, but this is close enough.)'
    },
    {
      id: 'op207', difficulty: 'intermediate',
      question: 'A put option (strike £100) has a 30% chance of finishing in-the-money, with an average payoff of £12 when it does. What is the expected payoff?',
      answer: '£3.60',
      explanation: 'EV = P(ITM) × average payoff when ITM + P(OTM) × £0 = 0.30 × £12 + 0.70 × £0 = £3.60. The 70% of the time it expires worthless contributes nothing to the expected value.'
    },
    {
      id: 'op208', difficulty: 'intermediate',
      question: 'A share goes up 20% then down 20%. Is it back to where it started?',
      answer: 'no — it\'s at 96% of the original price',
      explanation: '£100 × 1.20 = £120. Then £120 × 0.80 = £96. This is the key asymmetry of percentage returns: an equal up and down move doesn\'t cancel out. This is why prices follow a lognormal distribution, not a normal one.'
    },
    {
      id: 'op209', difficulty: 'intermediate',
      question: 'Company X reports earnings tomorrow. Historical volatility is 25%. Implied volatility on tomorrow\'s options is 55%. What does this tell you?',
      answer: 'the market expects a much bigger move than usual because of the earnings announcement',
      explanation: 'Historical vol (25%) reflects normal day-to-day movement. Implied vol (55%) reflects the market\'s expectation of the earnings move. The gap (30 percentage points) is the "earnings premium." After earnings are announced, IV will crash back toward historical levels — this is "IV crush."'
    },
    {
      id: 'op210', difficulty: 'intermediate',
      question: 'Two call options on the same share (£100), same expiry (3 months). Call A: strike £100, price £5. Call B: strike £120, price £1.50. Why is Call B so much cheaper?',
      answer: 'Call B needs the share to rise 20% just to have any payoff — much less likely',
      explanation: 'Call A pays out if the share goes above £100 (it\'s already there — 50/50 shot roughly). Call B pays out only if the share goes above £120 (needs a 20% rise). The probability of a 20% rise in 3 months is much lower than a 0% rise. Lower probability of payoff = lower expected value = lower price.'
    }
  ],

  tool: {
    id: 'payoff-builder',
    title: 'Payoff Diagram Builder',
    render: function(container) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.5rem;margin:1.5rem 0;">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#06b6d4;margin-bottom:1rem;">PAYOFF DIAGRAM BUILDER</h3>
          <p style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);margin-bottom:1rem;line-height:1.5;">
            Build a payoff diagram for any option. See the hockey stick shape, the break-even point, and the expected value at different prices.
          </p>
          <div style="display:grid;grid-template-columns:200px 1fr;gap:1.5rem;">
            <div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;">Type</label>
              <select id="pdb-type" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
                <option value="long_call">Buy Call</option>
                <option value="long_put">Buy Put</option>
                <option value="short_call">Sell Call</option>
                <option value="short_put">Sell Put</option>
              </select>
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.5rem;display:block;">Strike (£)</label>
              <input type="number" id="pdb-strike" value="100" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.5rem;display:block;">Premium (£)</label>
              <input type="number" id="pdb-prem" value="5" step="0.5" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <div id="pdb-stats" style="margin-top:1rem;font-family:'DM Mono',monospace;font-size:0.8rem;color:var(--text);line-height:2;"></div>
            </div>
            <div>
              <canvas id="pdb-canvas" width="500" height="300" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;"></canvas>
            </div>
          </div>
        </div>`;

      function draw() {
        const type = document.getElementById('pdb-type').value;
        const K = parseFloat(document.getElementById('pdb-strike').value) || 100;
        const P = parseFloat(document.getElementById('pdb-prem').value) || 5;
        const isCall = type.includes('call');
        const isLong = type.includes('long');

        const canvas = document.getElementById('pdb-canvas');
        const ctx = canvas.getContext('2d');
        const W = 500, H = 300;
        canvas.width = W * 2; canvas.height = H * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = '#0a0d14'; ctx.fillRect(0, 0, W, H);

        const margin = {l:45, r:15, t:15, b:30};
        const pW = W - margin.l - margin.r;
        const pH = H - margin.t - margin.b;
        const minS = K * 0.6; const maxS = K * 1.4;

        function getProfit(S) {
          let payoff;
          if (isCall) payoff = Math.max(S - K, 0);
          else payoff = Math.max(K - S, 0);
          if (isLong) return payoff - P;
          else return P - payoff;
        }

        // Find Y range
        let yMin = Infinity, yMax = -Infinity;
        for (let s = minS; s <= maxS; s += 0.5) {
          const p = getProfit(s);
          if (p < yMin) yMin = p;
          if (p > yMax) yMax = p;
        }
        const yPad = Math.max(Math.abs(yMin), Math.abs(yMax)) * 0.15;
        yMin -= yPad; yMax += yPad;

        function x(s) { return margin.l + ((s - minS) / (maxS - minS)) * pW; }
        function y(p) { return margin.t + pH - ((p - yMin) / (yMax - yMin)) * pH; }

        // Zero line
        ctx.strokeStyle = '#1e2638'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(margin.l, y(0)); ctx.lineTo(W-margin.r, y(0)); ctx.stroke();

        // Strike line
        ctx.strokeStyle = '#4a5568'; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(x(K), margin.t); ctx.lineTo(x(K), H-margin.b); ctx.stroke();
        ctx.setLineDash([]);

        // Profit line
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let s = minS; s <= maxS; s += 0.5) {
          const profit = getProfit(s);
          const px = x(s), py = y(profit);
          if (s === minS) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        // Colour: green above zero, red below
        ctx.strokeStyle = '#06b6d4'; ctx.stroke();

        // Fill profit region
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        for (let s = minS; s <= maxS; s += 0.5) {
          const profit = getProfit(s);
          if (profit > 0) { ctx.lineTo(x(s), y(profit)); }
          else { ctx.lineTo(x(s), y(0)); }
        }
        ctx.lineTo(x(maxS), y(0)); ctx.lineTo(x(minS), y(0)); ctx.closePath();
        ctx.fillStyle = '#2dd4a0'; ctx.fill();
        ctx.globalAlpha = 1;

        // Labels
        ctx.fillStyle = '#4a5568'; ctx.font = '10px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('£' + minS.toFixed(0), margin.l + 10, H - 8);
        ctx.fillText('K=£' + K, x(K), H - 8);
        ctx.fillText('£' + maxS.toFixed(0), W - margin.r - 10, H - 8);
        ctx.textAlign = 'right';
        ctx.fillText('£0', margin.l - 5, y(0) + 3);
        if (isLong) {
          ctx.fillText('−£' + P.toFixed(0), margin.l - 5, y(-P) + 3);
        } else {
          ctx.fillText('+£' + P.toFixed(0), margin.l - 5, y(P) + 3);
        }

        // Stats
        const breakeven = isCall ?
          (isLong ? K + P : K + P) :
          (isLong ? K - P : K - P);
        const maxProfit = isLong ? (isCall ? 'Unlimited' : '£' + (K - P).toFixed(2)) : '£' + P.toFixed(2);
        const maxLoss = isLong ? '£' + P.toFixed(2) : (isCall ? 'Unlimited' : '£' + (K - P).toFixed(2));

        const typeLabel = (isLong ? 'Long ' : 'Short ') + (isCall ? 'Call' : 'Put');
        let stats = '<div style="color:#06b6d4;font-size:0.9rem;margin-bottom:0.5rem;">' + typeLabel + '</div>';
        stats += '<div>Break-even: £' + breakeven.toFixed(2) + '</div>';
        stats += '<div style="color:var(--green-bright);">Max profit: ' + maxProfit + '</div>';
        stats += '<div style="color:var(--red-bright);">Max loss: ' + maxLoss + '</div>';
        document.getElementById('pdb-stats').innerHTML = stats;
      }

      ['pdb-strike', 'pdb-prem'].forEach(id => document.getElementById(id).addEventListener('input', draw));
      document.getElementById('pdb-type').addEventListener('change', draw);
      draw();
    }
  }
};

if (typeof window !== 'undefined') { window.OPTIONS_MODULE_2 = OPTIONS_MODULE_2; }