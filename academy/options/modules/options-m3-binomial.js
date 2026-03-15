// options-m3-binomial.js
// Module 3: The Binomial Model — Options Pricing from First Principles
// Tier: Basic
// Real-world analogies → tree diagrams → replicating portfolio → risk-neutral pricing

const OPTIONS_MODULE_3 = {
  id: 3,
  title: 'The Binomial Model — Pricing from First Principles',
  tier: 'basic',
  scenarioCount: 15,
  accentColor: '#06b6d4',

  tutorial: `
    <div class="tut">

      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#06b6d4;letter-spacing:0.05em;">MODULE 3: THE BINOMIAL MODEL</h2>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        This is the module where we actually price an option — not by looking it up, not by plugging numbers into a formula we don't understand, but by building the price from logic and arithmetic. By the end, you'll have derived the same answer that banks and hedge funds get from their computers. And you'll understand <em>why</em> it's that number.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        We're not using Black-Scholes yet. That comes in Module 4. Instead, we'll use a simpler model called the binomial model — which is just a tree diagram. If you've ever drawn a probability tree in school (coin flips, picking marbles), you can do this.
      </p>

      <!-- ============================================================ -->
      <!-- SECTION 1: THE SETUP — A WORLD WITH TWO OUTCOMES -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">A WORLD WITH TWO OUTCOMES</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Binomial:</strong> Just means "two outcomes." Bi = two, nomial = names. The share either goes UP or DOWN. That's the whole model.<br>
          <strong style="color:var(--text-bright);">Risk-free rate:</strong> The return you'd get on a completely safe investment — like a government bond. Currently around 4-5% per year in the UK. It matters because £1 tomorrow is worth slightly less than £1 today.<br>
          <strong style="color:var(--text-bright);">Replicating portfolio:</strong> A combination of shares and borrowing that produces exactly the same payoff as an option. If two things always pay the same, they must cost the same.
        </div>
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Let's simplify the world. A share is at £100 today. In one month, one of two things will happen:
      </p>

      <div class="mb">
Today: Share price = £100

In one month, either:
  UP:   Share goes to £120  (a 20% rise)
  DOWN: Share goes to £80   (a 20% fall)

Nothing else can happen. Just up or down.
(This is obviously oversimplified — real shares can go
anywhere. We'll fix that later by adding more steps.)</div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Now consider a call option on this share: strike £100, expiring in one month. What's it worth?
      </p>

      <div class="mb">
Call option: strike £100, expiry one month.

If the share goes UP to £120:
  Call payoff = max(120 − 100, 0) = £20  ✓

If the share goes DOWN to £80:
  Call payoff = max(80 − 100, 0) = £0    ✗

The option pays £20 in one scenario and £0 in the other.</div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        How much should you pay for this today? Your first instinct might be: "I need to know the probability of up vs down." If there's a 60% chance of going up, the expected payoff is 0.6 × £20 = £12, so the option should be worth about £12.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        But here's the remarkable thing: <strong style="color:var(--text-bright);">you don't need to know the probability.</strong> There's a way to price the option that works regardless of whether the share is likely to go up or down.
      </p>

      <!-- ============================================================ -->
      <!-- SECTION 2: THE REPLICATING PORTFOLIO — THE BOOKMAKER ANALOGY -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE CLEVER TRICK — REPLICATION</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Imagine you're a bookmaker. Someone wants to place a bet that pays £20 if a share goes up and £0 if it goes down. You need to set a fair price for this bet. How?
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        A clever bookmaker would <em>hedge</em> the bet. They'd find a way to guarantee the payout using other things they can already buy and sell (shares and borrowing). If they can construct something that pays exactly £20 when the share goes up and £0 when it goes down — without any risk — then the cost of constructing that hedge IS the fair price of the bet.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        This is called a <strong>replicating portfolio</strong> — and it's how every option on earth is priced.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Here's how it works. We're going to buy some shares and borrow some money, in exactly the right amounts so that the combination produces the same payoff as the option. Let's call:
      </p>

      <div class="mb">
Δ (Delta) = the number of shares we buy
B = the amount we borrow (at the risk-free rate)
r = the risk-free interest rate (let's use 5% per year,
    so about 0.4% per month)

We need our portfolio to match the option payoff:

If share goes UP to £120:
  Portfolio value = Δ × £120 − B × (1 + 0.004)
  This must equal £20 (the call payoff)

If share goes DOWN to £80:
  Portfolio value = Δ × £80 − B × (1 + 0.004)
  This must equal £0 (the call payoff)</div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Two equations, two unknowns. We can solve this. Let's go step by step:
      </p>

      <div class="mb">
Step 1: Find Δ (how many shares to buy)

  Subtract the DOWN equation from the UP equation:
    Δ × 120 − Δ × 80 = 20 − 0
    Δ × 40 = 20
    Δ = 20 ÷ 40 = 0.5

  We need to buy HALF a share.

Step 2: Find B (how much to borrow)

  Plug Δ = 0.5 into the DOWN equation:
    0.5 × 80 − B × 1.004 = 0
    40 − B × 1.004 = 0
    B × 1.004 = 40
    B = 40 ÷ 1.004 = £39.84

  We need to borrow £39.84.

Step 3: The option price

  The cost of building this portfolio:
    Buy 0.5 shares at £100 = £50.00
    Borrow £39.84 (this is money IN, so subtract it)
    
    Net cost = £50.00 − £39.84 = £10.16

  The fair price of the call option is £10.16.</div>

      <div class="pln">
        Here's what just happened. We built a mini-portfolio — half a share plus a loan — that pays exactly £20 when the share goes up and exactly £0 when it goes down. That's identical to the call option's payoff. Since the portfolio and the option always pay the same, they must cost the same. The portfolio costs £10.16 to build, so the option must be worth £10.16.<br><br>
        The beauty: <strong>we never mentioned probability.</strong> We didn't need to know whether the share is likely to go up or down. The replicating portfolio argument works regardless. This is why options pricing is so powerful — it doesn't depend on predicting the future.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        Let's verify our answer. If the option costs £10.16 and we've built the hedge correctly, there should be no risk:
      </p>

      <div class="mb">
Verification:

If share goes UP to £120:
  0.5 × £120 = £60.00 (value of shares)
  Owe: £39.84 × 1.004 = £40.00 (loan repayment)
  Portfolio value: £60.00 − £40.00 = £20.00 ✓ (matches call payoff)

If share goes DOWN to £80:
  0.5 × £80 = £40.00 (value of shares)
  Owe: £39.84 × 1.004 = £40.00 (loan repayment)
  Portfolio value: £40.00 − £40.00 = £0.00 ✓ (matches call payoff)

Both scenarios check out. The hedge is perfect.</div>

      <div class="gd">
        <strong>Why this matters:</strong> If the option were trading at £12 (overpriced), a clever trader could sell the option for £12, build the hedge for £10.16, and pocket £1.84 of risk-free profit. If it traded at £8 (underpriced), they'd buy the option, sell the hedge, and pocket £2.16. This arbitrage pressure is what keeps option prices at their "fair" level. The market enforces the maths.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 3: RISK-NEUTRAL PRICING — THE SHORTCUT -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE SHORTCUT — RISK-NEUTRAL PRICING</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Risk-neutral probability:</strong> A fictional probability that makes the expected return on the share equal to the risk-free rate. It's NOT the real probability. It's a mathematical tool that gives the same answer as the replicating portfolio — but with less algebra.
        </div>
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        The replicating portfolio method works, but solving two equations every time is tedious. There's a shortcut that gives the same answer with one simple formula.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        The idea: instead of using real-world probabilities (which we don't know), we invent a special set of probabilities called "risk-neutral" probabilities. These are rigged so that the expected return on the share equals the risk-free rate. Then we calculate the expected payoff using these rigged probabilities and discount back.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        It sounds like cheating. It's not — it gives <em>exactly</em> the same answer as the replicating portfolio. Let's see it work:
      </p>

      <div class="mb">
Risk-neutral probability of going UP:

  q = (e^(rT) − d) / (u − d)

  where:
    e^(rT) = growth at the risk-free rate
           = e^(0.05 × 1/12) ≈ 1.004
    u = up factor = 120/100 = 1.20
    d = down factor = 80/100 = 0.80

  q = (1.004 − 0.80) / (1.20 − 0.80)
    = 0.204 / 0.40
    = 0.51

  Risk-neutral probability of UP: 51%
  Risk-neutral probability of DOWN: 49%</div>

      <div class="pln">
        These are NOT the real probabilities. The real chance of the share going up might be 60% or 40% — we don't know and don't need to know. These "risk-neutral" probabilities are just a mathematical tool. Think of them as imaginary weights that happen to produce the correct option price.
      </div>

      <div class="mb">
Now price the option using these probabilities:

  Step 1: Expected payoff under risk-neutral probabilities
    = q × (payoff if UP) + (1−q) × (payoff if DOWN)
    = 0.51 × £20 + 0.49 × £0
    = £10.20

  Step 2: Discount back to today
    = £10.20 × e^(−rT)
    = £10.20 × e^(−0.004)
    = £10.20 × 0.996
    = £10.16

  Fair call price = £10.16 ✓

  Same answer as the replicating portfolio!</div>

      <div class="pln">
        Both methods — building a hedge and using risk-neutral probabilities — give £10.16. They always agree. The risk-neutral method is just faster. It replaces "solve two equations for Δ and B" with "plug into one formula." That's why professionals use it.<br><br>
        The deep reason they agree is that both methods are pricing the option by eliminating risk. The replicating portfolio eliminates risk by hedging. Risk-neutral pricing eliminates risk by pretending everyone is indifferent to risk (hence "risk-neutral"). Same maths, different perspective.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 4: MULTI-STEP TREES -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">MORE STEPS — MORE REALISTIC</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Our one-step tree was a toy. The share could only be £120 or £80 — obviously too simple. But we can add more steps. Each step splits into two more outcomes, creating a tree:
      </p>

      <div class="mb">
Two-step tree (share can go up or down each month):

                            £144  (up, up)
                    £120 ──┤
            £100 ──┤        £96   (up, down)
                    £80 ───┤
                            £96   (down, up)
                    £80 ───┤
                            £64   (down, down)

Wait — let's be more careful. If up = ×1.20 and down = ×0.80:

Month 0: £100
Month 1: £120 (up) or £80 (down)
Month 2 from £120: £144 (up again) or £96 (down)
Month 2 from £80:  £96 (up) or £64 (down again)

Final possible prices: £144, £96, £96, £64
(Notice £96 appears twice — up-then-down = down-then-up)</div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        To price the option with a two-step tree, we work <strong>backwards</strong> from expiry:
      </p>

      <div class="mb">
Call option, strike £100, expiring at month 2.

Step 1: Calculate payoffs at the END (month 2)
  At £144: max(144 − 100, 0) = £44
  At £96:  max(96 − 100, 0) = £0
  At £64:  max(64 − 100, 0) = £0

Step 2: Work backwards to month 1

  At the £120 node (can go to £144 or £96):
    Option value = e^(−rΔt) × [q × £44 + (1−q) × £0]
                 = 0.996 × [0.51 × 44 + 0.49 × 0]
                 = 0.996 × 22.44
                 = £22.35

  At the £80 node (can go to £96 or £64):
    Option value = e^(−rΔt) × [q × £0 + (1−q) × £0]
                 = 0.996 × [0]
                 = £0

Step 3: Work backwards to today (month 0)

  At £100 (can go to £120-node or £80-node):
    Option value = e^(−rΔt) × [q × £22.35 + (1−q) × £0]
                 = 0.996 × [0.51 × 22.35]
                 = 0.996 × 11.40
                 = £11.35

  Fair call price with two steps: £11.35</div>

      <div class="pln">
        The process is always the same: start at the end, calculate payoffs, then work backwards one step at a time using the risk-neutral formula. Each step is just one multiplication and one addition. A 100-step tree involves doing this 100 times — tedious by hand but trivial for a computer.
      </div>

      <div class="pt">
        <strong>The magic:</strong> As you add more steps (10, 50, 100, 1000...), the tree produces more possible final prices. The distribution of those prices gets closer and closer to the smooth lognormal curve we discussed in Module 2. And the option price converges to... the Black-Scholes price. The binomial model IS Black-Scholes in disguise — just with finite steps instead of infinite ones.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 5: FROM TREE TO FORMULA -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">FROM TREE TO FORMULA</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Here's the punchline. As the number of steps increases:
      </p>

      <div class="mb">
Steps    Call price (strike £100, vol 20%, 3 months)
  1       £10.16
  2       £11.35
  5       £4.89
  10      £4.71
  50      £4.63
  100     £4.62
  500     £4.615
  1000    £4.614

Black-Scholes formula: £4.614

The tree converges to Black-Scholes as steps → ∞</div>

      <div class="pln">
        With enough steps, the binomial tree and Black-Scholes give the same answer to as many decimal places as you want. Black-Scholes is the limit — the "infinite step" version of the tree. In Module 4, we'll see the formula itself. But now you understand where it comes from: it's the result of making the tree infinitely fine, so that the up/down steps become a smooth, continuous price movement.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 6: WHAT DELTA REALLY MEANS -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">DELTA — YOUR FIRST GREEK (BONUS PREVIEW)</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Remember the Δ = 0.5 we calculated? That number has a name: <strong>Delta</strong>. It's the first of the "Greeks" you've heard about on your broker's platform.
      </p>

      <div class="mb">
Delta = 0.5 means:

  1. You need 0.5 shares to hedge one option.
     (That's why it's called the "hedge ratio.")

  2. If the share moves £1, the option moves about £0.50.
     (Delta tells you the sensitivity.)

  3. There's roughly a 50% chance the option finishes ITM.
     (Delta approximates the probability of finishing in-the-money.)

Three interpretations, one number. We'll explore all three
properly in Module 5.</div>

      <div class="pln">
        When your broker shows "Delta: 0.35" next to an option, it's saying: this option moves about 35p for every £1 the share moves, it needs 0.35 shares to hedge, and it has roughly a 35% chance of finishing in the money. One number, three useful meanings. Now you know where it comes from — it's the Δ from the replicating portfolio.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 7: SUMMARY -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHAT YOU NOW KNOW</h3>

      <div class="mb">
Module 3 covered:
  ✓ The binomial model — two outcomes per step
  ✓ The replicating portfolio — matching payoffs with shares + borrowing
  ✓ Why you don't need real probabilities to price options
  ✓ Risk-neutral pricing — the shortcut formula
  ✓ Multi-step trees — working backwards from expiry
  ✓ How the tree converges to Black-Scholes as steps increase
  ✓ Delta — the hedge ratio from the replicating portfolio

Coming in Module 4:
  → The Black-Scholes formula itself — every component explained
  → What N(d₁) and N(d₂) actually mean (they're just probabilities)
  → Your own Black-Scholes calculator
  → The five assumptions — and where they break down</div>

      <div class="gd">
        <strong>You just priced an option from first principles.</strong> No formula was handed to you. You built the price from two simple ideas: (1) if two things always pay the same, they must cost the same, and (2) you can construct a portfolio that matches any option's payoff. That's the foundation of modern finance. Everything from here builds on what you already understand.
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
      id: 'bn01', difficulty: 'basic',
      question: 'A share is at £50. It can go to £60 (up) or £40 (down). A call option has strike £50. What is the call payoff if the share goes up?',
      answer: '£10',
      explanation: 'Payoff = max(60 − 50, 0) = £10. The share is £10 above the strike.'
    },
    {
      id: 'bn02', difficulty: 'basic',
      question: 'Same setup. What is the call payoff if the share goes down to £40?',
      answer: '£0',
      explanation: 'Payoff = max(40 − 50, 0) = £0. The share is below the strike. The option expires worthless.'
    },
    {
      id: 'bn03', difficulty: 'basic',
      question: 'Share at £100. Goes to £130 (up) or £90 (down). Call strike £100. Calculate Delta (Δ) for the replicating portfolio.',
      answer: '0.75',
      explanation: 'Δ = (call payoff UP − call payoff DOWN) / (share UP − share DOWN) = (30 − 0) / (130 − 90) = 30/40 = 0.75. You need 0.75 shares to replicate this option.'
    },
    {
      id: 'bn04', difficulty: 'basic',
      question: 'Share at £200. Goes to £240 or £180. Call strike £200. What is Delta?',
      answer: '0.667',
      explanation: 'Payoffs: UP = max(240−200,0) = £40. DOWN = max(180−200,0) = £0. Δ = (40 − 0)/(240 − 180) = 40/60 = 0.667.'
    },
    {
      id: 'bn05', difficulty: 'basic',
      question: 'A put option on a share at £100. Goes to £120 or £80. Strike £100. What are the put payoffs?',
      answer: 'UP: £0, DOWN: £20',
      explanation: 'UP: max(100−120, 0) = £0. DOWN: max(100−80, 0) = £20. The put pays when the share falls below the strike.'
    },
    {
      id: 'bn06', difficulty: 'intermediate',
      question: 'Share at £100. UP to £120, DOWN to £80. Risk-free rate is 5% annual (0.4% monthly). Calculate the risk-neutral probability of going UP.',
      answer: '0.51 (51%)',
      explanation: 'q = (e^(rT) − d) / (u − d). e^(0.004) ≈ 1.004. u = 1.20, d = 0.80. q = (1.004 − 0.80) / (1.20 − 0.80) = 0.204/0.40 = 0.51.'
    },
    {
      id: 'bn07', difficulty: 'intermediate',
      question: 'Using q = 0.51 from above. Call pays £20 if UP, £0 if DOWN. What is the risk-neutral expected payoff?',
      answer: '£10.20',
      explanation: 'Expected payoff = q × 20 + (1−q) × 0 = 0.51 × 20 + 0.49 × 0 = £10.20.'
    },
    {
      id: 'bn08', difficulty: 'intermediate',
      question: 'Expected payoff is £10.20 (from above). Discount at 0.4% for one month. What is the fair call price?',
      answer: '£10.16',
      explanation: 'Price = £10.20 × e^(−0.004) = £10.20 × 0.996 = £10.16. This matches the replicating portfolio answer.'
    },
    {
      id: 'bn09', difficulty: 'intermediate',
      question: 'Share at £50. UP factor u = 1.10 (goes to £55). DOWN factor d = 0.90 (goes to £45). Risk-free rate 3% annual (0.25% monthly). Calculate q.',
      answer: '0.5125 (51.25%)',
      explanation: 'q = (e^(0.0025) − 0.90) / (1.10 − 0.90) = (1.0025 − 0.90) / 0.20 = 0.1025/0.20 = 0.5125.'
    },
    {
      id: 'bn10', difficulty: 'intermediate',
      question: 'Same setup as above. Call strike £50. Price the call using risk-neutral pricing.',
      answer: '£2.55 (approximately)',
      explanation: 'Payoffs: UP = max(55−50,0) = £5. DOWN = max(45−50,0) = £0. Expected = 0.5125 × 5 + 0.4875 × 0 = £2.5625. Discounted: 2.5625 × e^(−0.0025) ≈ £2.556. Approximately £2.55.'
    },
    {
      id: 'bn11', difficulty: 'intermediate',
      question: 'Two-step tree. Share at £100, u = 1.10, d = 0.90. After 2 steps the possible prices are £121, £99, £99, £81. Call strike £100. What are the payoffs at expiry?',
      answer: '£21, £0, £0, £0',
      explanation: 'max(121−100,0)=£21. max(99−100,0)=£0. max(99−100,0)=£0. max(81−100,0)=£0. Only the up-up path (£121) finishes in the money.'
    },
    {
      id: 'bn12', difficulty: 'advanced',
      question: 'From the two-step tree above (q ≈ 0.5125). At the £110 node (month 1, after one UP), the option can go to £21 (up) or £0 (down). What is the option value at the £110 node?',
      answer: '£10.74 (approximately)',
      explanation: 'Value = e^(−rΔt) × [q × 21 + (1−q) × 0] = 0.9975 × [0.5125 × 21] = 0.9975 × 10.7625 ≈ £10.74.'
    },
    {
      id: 'bn13', difficulty: 'advanced',
      question: 'Same tree. At the £90 node (month 1, after one DOWN), the option can go to £0 (up to £99) or £0 (down to £81). What is the option value at the £90 node?',
      answer: '£0',
      explanation: 'Both outcomes produce £0 payoff. Value = e^(−rΔt) × [q × 0 + (1−q) × 0] = £0. The option is worthless at this node because even an up move only reaches £99 — still below the £100 strike.'
    },
    {
      id: 'bn14', difficulty: 'advanced',
      question: 'Working backwards to today. The £110 node is worth £10.74, the £90 node is worth £0. What is the option value today?',
      answer: '£5.50 (approximately)',
      explanation: 'Value = e^(−rΔt) × [q × 10.74 + (1−q) × 0] = 0.9975 × [0.5125 × 10.74] = 0.9975 × 5.504 ≈ £5.49. Approximately £5.50.'
    },
    {
      id: 'bn15', difficulty: 'advanced',
      question: 'An option is priced at £8 by Black-Scholes. A trader sells the option for £8 and buys Delta shares to hedge. If Delta is correct, what is the trader\'s risk?',
      answer: 'approximately zero (delta-hedged)',
      explanation: 'If the trader sells the option and buys exactly Delta shares (the replicating portfolio), small share moves are perfectly hedged — gains on shares offset losses on the option and vice versa. The risk is "approximately zero" for small moves. For larger moves, the hedge needs adjusting (this is Gamma risk — Module 6). But the principle is: the replicating portfolio eliminates directional risk.'
    }
  ],

  tool: {
    id: 'binomial-tree',
    title: 'Binomial Tree Calculator',
    render: function(container) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.5rem;margin:1.5rem 0;">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#06b6d4;margin-bottom:1rem;">BINOMIAL TREE CALCULATOR</h3>
          <p style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.5;margin-bottom:1rem;">
            Build a binomial tree and watch the option price emerge step by step. Increase the steps to see it converge toward Black-Scholes.
          </p>
          <div style="display:grid;grid-template-columns:200px 1fr;gap:1.5rem;">
            <div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;">Share Price (£)</label>
              <input type="number" id="bt-s" value="100" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Strike (£)</label>
              <input type="number" id="bt-k" value="100" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Volatility (%)</label>
              <input type="number" id="bt-vol" value="20" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Time to Expiry (months)</label>
              <input type="number" id="bt-t" value="3" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Risk-Free Rate (%)</label>
              <input type="number" id="bt-r" value="5" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Steps</label>
              <select id="bt-n" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
                <option value="1">1 step</option>
                <option value="2">2 steps</option>
                <option value="3" selected>3 steps</option>
                <option value="5">5 steps</option>
                <option value="10">10 steps</option>
                <option value="50">50 steps</option>
                <option value="100">100 steps</option>
              </select>
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Type</label>
              <select id="bt-type" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
              <button id="bt-calc" style="width:100%;margin-top:0.75rem;padding:0.5rem;background:#06b6d4;color:var(--bg);border:none;border-radius:6px;font-family:'Outfit',sans-serif;font-weight:600;cursor:pointer;">Calculate</button>
            </div>
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;">
              <div id="bt-output" style="font-family:'DM Mono',monospace;font-size:0.9rem;color:var(--text);line-height:2;"></div>
            </div>
          </div>
        </div>`;

      document.getElementById('bt-calc').addEventListener('click', function() {
        const S = parseFloat(document.getElementById('bt-s').value) || 100;
        const K = parseFloat(document.getElementById('bt-k').value) || 100;
        const vol = parseFloat(document.getElementById('bt-vol').value) / 100 || 0.20;
        const T = parseFloat(document.getElementById('bt-t').value) / 12 || 0.25;
        const r = parseFloat(document.getElementById('bt-r').value) / 100 || 0.05;
        const N = parseInt(document.getElementById('bt-n').value) || 3;
        const isCall = document.getElementById('bt-type').value === 'call';

        const dt = T / N;
        const u = Math.exp(vol * Math.sqrt(dt));
        const d = 1 / u;
        const disc = Math.exp(-r * dt);
        const q = (Math.exp(r * dt) - d) / (u - d);

        // Build price tree
        let prices = [];
        for (let i = 0; i <= N; i++) {
          prices[i] = S * Math.pow(u, N - i) * Math.pow(d, i);
        }

        // Calculate option values at expiry
        let values = [];
        for (let i = 0; i <= N; i++) {
          if (isCall) values[i] = Math.max(prices[i] - K, 0);
          else values[i] = Math.max(K - prices[i], 0);
        }

        // Work backwards
        for (let step = N - 1; step >= 0; step--) {
          for (let i = 0; i <= step; i++) {
            values[i] = disc * (q * values[i] + (1 - q) * values[i + 1]);
          }
        }

        const optionPrice = values[0];
        const delta = N >= 1 ? (
          (isCall ? Math.max(S*u - K, 0) : Math.max(K - S*u, 0)) -
          (isCall ? Math.max(S*d - K, 0) : Math.max(K - S*d, 0))
        ) / (S*u - S*d) : 0;

        // Black-Scholes for comparison
        function normCDF(x) {
          const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429;
          const p=0.3275911;
          const sign = x < 0 ? -1 : 1;
          x = Math.abs(x) / Math.sqrt(2);
          const t = 1.0 / (1.0 + p * x);
          const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t * Math.exp(-x*x);
          return 0.5 * (1.0 + sign * y);
        }
        const d1 = (Math.log(S/K) + (r + vol*vol/2)*T) / (vol*Math.sqrt(T));
        const d2 = d1 - vol*Math.sqrt(T);
        const bsCall = S*normCDF(d1) - K*Math.exp(-r*T)*normCDF(d2);
        const bsPut = K*Math.exp(-r*T)*normCDF(-d2) - S*normCDF(-d1);
        const bsPrice = isCall ? bsCall : bsPut;

        let html = '';
        html += '<div style="color:#06b6d4;font-size:1.4rem;margin-bottom:0.5rem;">' + (isCall?'Call':'Put') + ' Price: £' + optionPrice.toFixed(4) + '</div>';
        html += '<div style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">Black-Scholes comparison: £' + bsPrice.toFixed(4) + '</div>';

        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">';
        html += '<div><span style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;">Up factor</span><br><span style="color:var(--text-bright);">' + u.toFixed(4) + '</span></div>';
        html += '<div><span style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;">Down factor</span><br><span style="color:var(--text-bright);">' + d.toFixed(4) + '</span></div>';
        html += '<div><span style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;">Risk-neutral q</span><br><span style="color:var(--text-bright);">' + (q*100).toFixed(2) + '%</span></div>';
        html += '<div><span style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;">Delta (approx)</span><br><span style="color:var(--text-bright);">' + delta.toFixed(4) + '</span></div>';
        html += '</div>';

        // Convergence note
        const diff = Math.abs(optionPrice - bsPrice);
        if (N < 50) {
          html += '<div style="padding:0.75rem;background:var(--surface);border-radius:6px;border-left:3px solid #06b6d4;margin-top:0.5rem;">';
          html += '<span style="font-family:\'Crimson Pro\',serif;font-style:italic;font-size:0.9rem;color:var(--text);">';
          html += 'Difference from Black-Scholes: £' + diff.toFixed(4) + '. ';
          if (diff > 0.1) html += 'Try increasing the steps to see convergence.';
          else if (diff > 0.01) html += 'Getting close. More steps will narrow the gap further.';
          else html += 'Very close to Black-Scholes. The tree has essentially converged.';
          html += '</span></div>';
        } else {
          html += '<div style="padding:0.75rem;background:rgba(45,212,160,0.08);border-radius:6px;border-left:3px solid var(--green-bright);margin-top:0.5rem;">';
          html += '<span style="font-family:\'Crimson Pro\',serif;font-style:italic;font-size:0.9rem;color:var(--green-bright);">Converged — difference from Black-Scholes is only £' + diff.toFixed(4) + '</span></div>';
        }

        // Show first few final prices if small tree
        if (N <= 5) {
          html += '<div style="margin-top:1rem;border-top:1px solid var(--border);padding-top:0.75rem;">';
          html += '<div style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;margin-bottom:0.5rem;">Possible prices at expiry</div>';
          for (let i = 0; i <= N; i++) {
            const p = S * Math.pow(u, N-i) * Math.pow(d, i);
            const payoff = isCall ? Math.max(p-K,0) : Math.max(K-p,0);
            const pColor = payoff > 0 ? 'var(--green-bright)' : 'var(--muted)';
            html += '<div style="color:' + pColor + ';">£' + p.toFixed(2) + ' → payoff £' + payoff.toFixed(2) + '</div>';
          }
          html += '</div>';
        }

        document.getElementById('bt-output').innerHTML = html;
      });

      // Auto-calculate on load
      document.getElementById('bt-calc').click();
    }
  }
};

if (typeof window !== 'undefined') { window.OPTIONS_MODULE_3 = OPTIONS_MODULE_3; }