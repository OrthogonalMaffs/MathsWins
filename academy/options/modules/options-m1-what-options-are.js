// options-m1-what-options-are.js
// Module 1: What Options Actually Are (Free Taster)
// Designed for: adults who trade but haven't touched maths in years
// Tone: confident, clear, no jargon without explanation, real-world first

const OPTIONS_MODULE_1 = {
  id: 1,
  title: 'What Options Actually Are',
  tier: 'free',
  scenarioCount: 10,
  accentColor: '#06b6d4',

  tutorial: `
    <div class="tut">

      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#06b6d4;letter-spacing:0.05em;">MODULE 1: WHAT OPTIONS ACTUALLY ARE</h2>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        You've probably used options. You might have bought a call because you thought a stock was going up, or sold a put to collect some premium. Maybe you've looked at "the Greeks" on your broker's platform and thought: <em>I know Delta matters, but I couldn't explain why.</em>
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        That's fine. Most retail traders are in the same position. They use options without understanding how they're priced, why they behave the way they do, or what the numbers actually mean. And that gap costs real money — in mis-priced trades, in time decay they didn't see coming, in volatility shifts they didn't understand.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        This course fixes that. Not with hand-waving or "just trust the formula." With the actual mathematics — broken down step by step, explained in plain English, with calculators you can use.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;margin-bottom:0.5rem;">
        <strong style="color:var(--text-bright);">You don't need to be good at maths.</strong> You need to be willing to follow along. If you can work out 10% of £200, you have everything you need. We'll build from there.
      </p>

      <div class="pt" style="margin:2rem 0;">
        <strong>What you'll be able to do by the end of this course:</strong><br><br>
        Module 4: Calculate the fair price of any option using the Black-Scholes formula — the same equation banks use.<br>
        Module 6: Look at "the Greeks" on your platform and know exactly what each number means and why it matters.<br>
        Module 7: Understand implied volatility — the single most important number in options that most traders can't explain.<br>
        Module 8: Break down any multi-leg strategy into its mathematics and know your exact risk before you enter.<br>
        Module 10: Analyse real-world scenarios — earnings plays, crashes, covered calls — with numbers, not guesswork.<br><br>
        But first, Module 1. Let's make sure we agree on what an option actually is.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 1: THE EVERYDAY ANALOGY -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">YOU ALREADY UNDERSTAND OPTIONS</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Before we use any financial language, let's talk about buying a house.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        You've found a house you like. It's on the market for £300,000. You want to buy it, but you need three months to sort your mortgage. You're worried someone else will buy it first, or the price will go up.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        So you go to the seller and say: <em>"I'll pay you £5,000 right now, and in return you guarantee me the right to buy this house for £300,000 at any point in the next three months. If I decide not to buy, you keep the £5,000."</em>
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        The seller agrees. You've just bought an option.
      </p>

      <div class="pln">
        That £5,000 is the <strong>premium</strong> — the price of the option itself.<br>
        £300,000 is the <strong>strike price</strong> — the agreed purchase price.<br>
        Three months is the <strong>expiry</strong> — how long the deal lasts.<br>
        And you have the <strong>right but not the obligation</strong> to buy. If house prices crash to £250,000, you walk away. You lose the £5,000, but you don't have to buy a house that's now worth less than what you agreed to pay.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1.5rem;">
        Now think about what happens in different scenarios:
      </p>

      <div class="mb">
Scenario A: House prices rise to £350,000
  You exercise your option: buy for £300,000 ✓
  House is worth £350,000
  Your profit: £350,000 − £300,000 − £5,000 = £45,000

Scenario B: House prices stay at £300,000
  You could buy, but there's no benefit
  You've paid £5,000 for nothing
  Your loss: £5,000

Scenario C: House prices drop to £250,000
  You don't exercise — why buy for £300k when it's worth £250k?
  You walk away
  Your loss: £5,000 (the premium you paid)</div>

      <div class="pln">
        Notice something important: the most you can ever lose is that £5,000 premium. Whether the house drops to £250,000 or £100,000 or £1, you lose the same £5,000. But your upside is unlimited — if the house goes to £500,000, you still buy at £300,000.<br><br>
        <strong>Limited downside, unlimited upside.</strong> That's why options exist. That's what you're paying the premium for.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1.5rem;">
        That house example IS a call option. Replace "house" with "shares in a company" and you have the financial instrument. The maths is identical.
      </p>

      <!-- ============================================================ -->
      <!-- SECTION 2: CALL OPTIONS - WITH JARGON BUSTER -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">CALL OPTIONS</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER — TERMS IN THIS SECTION</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Call option:</strong> The right (not obligation) to BUY something at a fixed price by a certain date. Like the house example above.<br>
          <strong style="color:var(--text-bright);">Underlying:</strong> The thing you have the right to buy. A share, an index, a commodity — whatever the option is based on.<br>
          <strong style="color:var(--text-bright);">Strike price (K):</strong> The fixed price you've agreed to pay. The £300,000 in our house example.<br>
          <strong style="color:var(--text-bright);">Premium:</strong> The price of the option itself. The £5,000 you paid the seller for the right.<br>
          <strong style="color:var(--text-bright);">Expiry:</strong> The deadline. After this date, the option ceases to exist.<br>
          <strong style="color:var(--text-bright);">Exercise:</strong> Using your right — actually buying the underlying at the strike price.
        </div>
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Let's move from houses to shares. Same idea, smaller numbers.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        A share in Company X is trading at £100 today. You think it's going up over the next month. You could buy the share for £100 — but then you'd have £100 at risk if it drops.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Instead, you buy a call option: the right to purchase Company X shares at £100 each, expiring in one month. You pay £4 for this right.
      </p>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        Let's work out what happens at different prices. We'll go slowly — no skipping.
      </p>

      <div class="mb">
The share price at expiry is £115.

Step 1: Do you want to exercise?
  Your right: buy at £100 (the strike price)
  Market price: £115
  Yes — buying at £100 when it's worth £115 is a good deal.

Step 2: What do you receive?
  You buy at £100, it's worth £115.
  That's a £15 gain per share.

Step 3: But you paid £4 for the option.
  Profit = £15 − £4 = £11 per share.

Step 4: What was your return?
  You invested £4. You made £11.
  Return = £11 / £4 = 275%</div>

      <div class="pln">
        Compare that to buying the share outright for £100. It goes to £115. Your profit is £15, your return is 15%. The option returned 275% — eighteen times the percentage return on the same price move. That's the power of leverage. But remember: if the share stays flat or drops, the share loses a bit while the option loses everything.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        Now the other side:
      </p>

      <div class="mb">
The share price at expiry is £95.

Step 1: Do you want to exercise?
  Your right: buy at £100
  Market price: £95
  No — why buy at £100 when you could buy for £95 on the market?

Step 2: The option expires worthless.
  You don't exercise. The option disappears.

Step 3: What did you lose?
  The £4 premium you paid. That's it.
  
  If you'd bought the shares instead: you'd be down £5 per share.
  The option limited your loss to £4 regardless of how far it fell.</div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        This leads us to a simple formula. Don't worry — it's just writing out what we already worked out:
      </p>

      <div class="mb">
Call option payoff at expiry:

  If share price is ABOVE the strike:
    Payoff = Share price − Strike price

  If share price is BELOW the strike:
    Payoff = £0 (you don't exercise)

  In mathematical shorthand:
    Payoff = max(S − K, 0)

  That "max" just means: take whichever is bigger — 
  the difference (S − K), or zero.

  S = share price at expiry
  K = strike price</div>

      <div class="pln">
        That's the entire call option payoff in one line: <strong>max(S − K, 0)</strong>. It says: you make money when the share price is above the strike, and you make nothing (not negative — nothing) when it's below. Every call option that has ever existed follows this formula. We've just written it down.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 3: PUT OPTIONS -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">PUT OPTIONS</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Put option:</strong> The right (not obligation) to SELL something at a fixed price by a certain date. The mirror image of a call.
        </div>
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Back to the real world. You own a painting worth £10,000. You're worried the art market might crash. You find someone willing to make you this deal: <em>"Pay me £500 now, and I guarantee you can sell me that painting for £10,000 at any time in the next six months."</em>
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        You've bought insurance. If the art market crashes and your painting is only worth £6,000, you exercise your right and sell it for £10,000 anyway. If the market stays fine, you let the deal expire and you're only out the £500.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        That's a put option. The right to <strong>sell</strong> at a fixed price.
      </p>

      <div class="mb">
Put option on Company X shares.
Strike price: £100. Premium paid: £3. Expiry: one month.

Share price at expiry: £82.

Step 1: Do you want to exercise?
  Your right: sell at £100
  Market price: £82
  Yes — selling at £100 when it's only worth £82 is valuable.

Step 2: What do you gain?
  You sell at £100, it's worth £82.
  Gain = £100 − £82 = £18 per share.

Step 3: Subtract the premium.
  Profit = £18 − £3 = £15 per share.

---

Share price at expiry: £108.

Step 1: Do you want to exercise?
  Your right: sell at £100
  Market price: £108
  No — why sell for £100 when the market pays £108?

Step 2: The put expires worthless.
  Your loss: the £3 premium. Nothing more.</div>

      <div class="mb">
Put option payoff at expiry:

  If share price is BELOW the strike:
    Payoff = Strike price − Share price

  If share price is ABOVE the strike:
    Payoff = £0

  In shorthand:
    Payoff = max(K − S, 0)

  Same "max" idea: the difference, or zero,
  whichever is bigger.</div>

      <div class="pln">
        Calls profit when prices go UP: max(S − K, 0).<br>
        Puts profit when prices go DOWN: max(K − S, 0).<br><br>
        These two formulas are the foundation. Everything else in this course — Black-Scholes, the Greeks, implied volatility — is about answering one question: <strong>what should the premium be?</strong> How much is the right to buy (or sell) at a fixed price actually worth?
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 4: THE HOCKEY STICK -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE PAYOFF DIAGRAM — READING THE HOCKEY STICK</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Options traders constantly refer to "payoff diagrams." These look complicated but they're just a picture of what we've already calculated. Let's build one from scratch.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Take our call option: strike £100, premium £4. Let's calculate the profit at lots of different share prices:
      </p>

      <div class="mb">
Share price  │  Payoff (max(S-K,0))  │  Minus premium  │  Profit
━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━┿━━━━━━━━
    £80       │  max(80-100, 0) = £0  │   £0 − £4       │   −£4
    £90       │  max(90-100, 0) = £0  │   £0 − £4       │   −£4
    £95       │  max(95-100, 0) = £0  │   £0 − £4       │   −£4
   £100       │  max(100-100,0) = £0  │   £0 − £4       │   −£4
   £104       │  max(104-100,0) = £4  │   £4 − £4       │    £0  ← break-even
   £110       │  max(110-100,0) = £10 │  £10 − £4       │   +£6
   £120       │  max(120-100,0) = £20 │  £20 − £4       │  +£16
   £150       │  max(150-100,0) = £50 │  £50 − £4       │  +£46</div>

      <div class="pln">
        See the pattern? Below £100: you always lose exactly £4 (the premium). Flat line. Above £104: profit increases £1 for every £1 the share rises. Straight line going up. The kink happens at the strike price. That shape — flat on the left, rising on the right — is the "hockey stick." Every call option makes this shape.<br><br>
        <strong>The break-even point</strong> is the strike price plus the premium: £100 + £4 = £104. Below that, you lose money even though the option has some payoff. Above it, you profit.
      </div>

      <div class="gd">
        <strong>Key insight for later modules:</strong> The SHAPE of the payoff never changes — it's always a hockey stick. What changes is how much you pay for it (the premium). The entire challenge of options pricing is determining the fair premium. That's what Modules 3 and 4 solve.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 5: INTRINSIC VALUE AND TIME VALUE -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHY DO OPTIONS COST WHAT THEY COST?</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Intrinsic value:</strong> The amount the option is worth RIGHT NOW if you exercised it immediately. The "real" value.<br>
          <strong style="color:var(--text-bright);">Time value:</strong> Everything else. The extra amount you pay on top of intrinsic value, because "something might happen" before expiry.<br>
          <strong style="color:var(--text-bright);">In-the-money (ITM):</strong> The option has intrinsic value right now. For a call: the share price is above the strike.<br>
          <strong style="color:var(--text-bright);">At-the-money (ATM):</strong> The share price is approximately equal to the strike. No intrinsic value, but lots of time value.<br>
          <strong style="color:var(--text-bright);">Out-of-the-money (OTM):</strong> The option has no intrinsic value. For a call: the share price is below the strike. It's "out of the money."
        </div>
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Think about a voucher for a free coffee. If the coffee costs £3 and you have a voucher that says "one free coffee," the voucher is worth £3 right now. That's intrinsic value — the tangible benefit you could claim immediately.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Now imagine the voucher says "one free coffee, valid for 6 months, at any branch." Is it worth more than £3? Probably — because in the next 6 months, coffee prices might go up. You might visit an expensive airport branch where coffee is £5. That extra "maybe" value is time value.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        An option's price works exactly the same way:
      </p>

      <div class="mb">
Option price = Intrinsic value + Time value

Example:
  Share price: £105
  Call option strike: £100
  Option is trading at: £8

  Intrinsic value = £105 − £100 = £5
    (if you exercised right now, you'd gain £5)

  Time value = £8 − £5 = £3
    (the extra £3 is for "what might happen before expiry")

  The deeper in-the-money, the more intrinsic value.
  The more time until expiry, the more time value.
  At expiry, time value = £0. Only intrinsic value remains.</div>

      <div class="pln">
        Time value is what you're really paying for when you buy an option. It's the price of possibility — the chance that something favourable might happen before the option expires. As expiry approaches, that possibility shrinks, and so does the time value. This is called <strong>time decay</strong>, and it's one of the biggest reasons options traders lose money. Module 6 quantifies exactly how fast it happens.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        A quick way to check you've got this:
      </p>

      <div class="mb">
Share price: £100. Call strike: £100. Option costs £4.

Intrinsic value: max(100 − 100, 0) = £0
Time value: £4 − £0 = £4

This option is at-the-money. Its entire price is time value.
If nothing changes between now and expiry, 
this option will expire worthless and you'll lose the full £4.

For you to profit, the share needs to rise above £104
(strike + premium) before expiry.</div>

      <!-- ============================================================ -->
      <!-- SECTION 6: WHO'S ON THE OTHER SIDE? -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHO'S ON THE OTHER SIDE?</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Every option has a buyer and a seller. We've talked about buying. But who sells you the option, and why?
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Think about home insurance. You pay £30 a month. In return, the insurer agrees to pay you up to £300,000 if your house burns down. Why would they take that risk?
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Because the probability of your house burning down is very small. They collect £360/year from you and thousands of other customers. Most years, they pay nothing. Occasionally they pay a big claim, but the premiums collected from everyone else more than cover it.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        <strong style="color:var(--text-bright);">Selling options works the same way.</strong> The seller collects the premium. Most OTM options expire worthless — the seller keeps the money. Occasionally the market moves against them and they pay out, but the premiums usually compensate.
      </p>

      <div class="mb">
Buying a call option:
  You pay the premium.
  Max loss: the premium (fixed, known in advance).
  Max profit: unlimited (share can rise to any price).

Selling a call option:
  You receive the premium.
  Max profit: the premium (fixed, known in advance).
  Max loss: unlimited (share can rise to any price).

Buying and selling are mirror images.
The buyer's profit is the seller's loss, and vice versa.</div>

      <div class="pln">
        This is important because later in the course (Module 8), we'll look at strategies that involve both buying AND selling options at different strikes. When you sell an option, you're the insurance company — collecting premiums and hoping the "disaster" (big price move) doesn't happen. Some of the most profitable options strategies involve being on the selling side.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 7: THE BIG QUESTION -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE BIG QUESTION THIS COURSE ANSWERS</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        We now know what an option does. We know the payoff formula. We know about intrinsic value and time value. But here's the question that the rest of this course is dedicated to:
      </p>

      <p style="font-family:'Crimson Pro',serif;font-size:1.4rem;color:#06b6d4;line-height:1.6;text-align:center;margin:2rem 0;font-style:italic;">
        "What should the premium be?"
      </p>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        In our house example, you paid £5,000 for the right to buy at £300,000. Was that fair? Should it have been £3,000? £10,000? How would you even begin to calculate it?
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Intuitively, the price depends on a few things:
      </p>

      <div class="mb">
What affects the price of an option?

1. How far is the share price from the strike?
   (Closer = more likely to finish in the money = more valuable)

2. How much time until expiry?
   (More time = more chance of a big move = more valuable)

3. How volatile is the share?
   (Wild swings = more chance of a big move = more valuable)

4. What's the risk-free interest rate?
   (Higher rate = money has more time value = slightly higher call price)

5. Does the share pay dividends?
   (Dividends reduce share price = slightly lower call price)</div>

      <div class="pln">
        Five things. That's it. Five inputs determine the price of every option ever traded. In Module 3, we'll build a simple model (the binomial model) that turns these five inputs into a fair price. In Module 4, we'll derive the Black-Scholes formula — the equation that changed finance — and you'll be able to calculate option prices yourself.<br><br>
        But we don't jump there yet. Module 2 first covers the probability theory that makes the pricing possible. One step at a time.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 8: PUT-CALL PARITY (INTUITIVE INTRO) -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">A FIRST TASTE OF THE MATHS — PUT-CALL PARITY</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Before we finish Module 1, here's a small piece of mathematics that's beautiful in its simplicity. It doesn't require any advanced maths. It's just logic.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Imagine you do two things at the same time:
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;padding-left:1.5rem;">
        <strong>Action 1:</strong> Buy a call option (strike £100, expiry 3 months).<br>
        <strong>Action 2:</strong> Sell a put option (same strike, same expiry).
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        Let's work out what happens at expiry for different share prices:
      </p>

      <div class="mb">
Share price at expiry: £120
  Call pays: max(120 − 100, 0) = £20 ✓ (you receive)
  Put pays:  max(100 − 120, 0) = £0   (you pay nothing)
  Combined: +£20

Share price at expiry: £100
  Call pays: max(100 − 100, 0) = £0
  Put pays:  max(100 − 100, 0) = £0
  Combined: £0

Share price at expiry: £80
  Call pays: max(80 − 100, 0) = £0
  Put pays:  max(100 − 80, 0) = £20  (you pay, since you sold it)
  Combined: −£20

The pattern: you gain or lose exactly (S − 100).
At £120: +£20. At £80: −£20. At £105: +£5.

That's identical to just owning the shares!</div>

      <div class="pln">
        Buying a call and selling a put at the same strike is mathematically equivalent to owning the shares. Not approximately — exactly. This means there's a fixed relationship between call prices, put prices, and the share price. If this relationship ever breaks, someone can make free money by exploiting the gap — and in practice, that gap gets closed within milliseconds by computers.<br><br>
        This relationship is called <strong>put-call parity</strong>. It's the first real mathematical constraint on options prices, and we've just derived it from nothing more than working out payoffs in a table. No calculus. No complex formulas. Just logic and arithmetic.
      </div>

      <div class="mb">
Put-Call Parity (simplified):

  Call price − Put price ≈ Share price − Strike price

  (The exact version adjusts for interest rates:
   C − P = S − K × e^(−rT)
   but we'll cover that properly in Module 2)

  If this equation doesn't hold, free money exists.
  It always holds. The market makes sure of it.</div>

      <div class="gd">
        <strong>You just derived your first options pricing relationship.</strong> Using nothing more than a payoff table and common sense. The rest of this course builds the same way — logic first, then formulas, then calculators. If you followed this section, you can follow the whole course.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 9: WHAT'S NEXT -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHAT YOU NOW KNOW — AND WHAT COMES NEXT</h3>

      <div class="mb">
Module 1 covered:
  ✓ What a call option is (and the real-world analogy)
  ✓ What a put option is
  ✓ The payoff formulas: max(S−K, 0) and max(K−S, 0)
  ✓ Intrinsic value vs time value
  ✓ The five things that affect an option's price
  ✓ Put-call parity — your first pricing relationship
  ✓ Why buyers and sellers are mirror images

Coming in Module 2:
  → How probability connects to option pricing
  → Why stock prices follow a "lognormal distribution"
     (we'll explain what that means — it's not as scary as it sounds)
  → Your first interactive tool: the Payoff Diagram Builder

Module 3:
  → We price an option from scratch — no formula needed
  → The binomial model: a simple tree that converges to
     the most famous equation in finance

Module 4:
  → The Black-Scholes formula — derived, explained, and
     translated into plain English
  → Your own Black-Scholes calculator</div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;margin-top:1.5rem;">
        If you followed the house example, understood why the hockey stick shape happens, and saw how buying a call plus selling a put equals owning the shares — you're ready for Module 2. The maths gets more involved, but the approach stays the same: understand the idea first, then write it down.
      </p>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.5rem;margin-top:2rem;text-align:center;">
        <div style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.6;font-style:italic;">
          "This is mathematical education, not financial advice. Options trading involves significant risk of loss. You can lose more than your initial investment. Consult a qualified financial adviser before trading."
        </div>
        <div style="font-family:'Outfit',sans-serif;font-size:0.85rem;color:var(--muted);margin-top:0.75rem;">
          MoneyHelper (free, government-backed): moneyhelper.org.uk<br>
          FCA Register: register.fca.org.uk
        </div>
      </div>

    </div>
  `,

  scenarios: [
    {
      id: 'om01', difficulty: 'basic',
      question: 'You buy a call option. Strike: £50. Premium: £3. The share price at expiry is £58. What is your profit?',
      answer: '£5',
      explanation: 'Step 1: Payoff = max(58 − 50, 0) = £8. Step 2: Subtract premium: £8 − £3 = £5 profit.'
    },
    {
      id: 'om02', difficulty: 'basic',
      question: 'You buy a call option. Strike: £50. Premium: £3. The share price at expiry is £48. What is your profit or loss?',
      answer: '−£3 (loss)',
      explanation: 'Step 1: Payoff = max(48 − 50, 0) = £0. The option expires worthless. Step 2: You paid £3 premium. Total loss: £3. Note: it doesn\'t matter whether the share is at £48 or £10 — you lose the same £3.'
    },
    {
      id: 'om03', difficulty: 'basic',
      question: 'You buy a put option. Strike: £100. Premium: £5. The share price at expiry is £85. What is your profit?',
      answer: '£10',
      explanation: 'Step 1: Payoff = max(100 − 85, 0) = £15. Step 2: Subtract premium: £15 − £5 = £10 profit.'
    },
    {
      id: 'om04', difficulty: 'basic',
      question: 'You buy a put option. Strike: £100. Premium: £5. The share price at expiry is £110. What is your profit or loss?',
      answer: '−£5 (loss)',
      explanation: 'Step 1: Payoff = max(100 − 110, 0) = £0. The share is above the strike — no point exercising a put. Step 2: You lose the £5 premium.'
    },
    {
      id: 'om05', difficulty: 'basic',
      question: 'A call option has a strike of £75. The share is currently at £82. The option is trading at £10. What is the intrinsic value and the time value?',
      answer: 'Intrinsic: £7, Time: £3',
      explanation: 'Intrinsic = max(82 − 75, 0) = £7. The option costs £10. Time value = £10 − £7 = £3. The £3 is what you\'re paying for the possibility of the share going even higher before expiry.'
    },
    {
      id: 'om06', difficulty: 'basic',
      question: 'A call option has a strike of £60. The share is at £55. The option costs £2. What is the intrinsic value and time value?',
      answer: 'Intrinsic: £0, Time: £2',
      explanation: 'Intrinsic = max(55 − 60, 0) = £0. The share is below the strike — no intrinsic value. The entire £2 cost is time value. This option is "out of the money."'
    },
    {
      id: 'om07', difficulty: 'basic',
      question: 'You buy a call with strike £100 and premium £6. What share price do you need at expiry to break even?',
      answer: '£106',
      explanation: 'Break-even = strike + premium = £100 + £6 = £106. At £106: payoff = max(106−100, 0) = £6. Minus £6 premium = £0 profit. Exactly break-even.'
    },
    {
      id: 'om08', difficulty: 'intermediate',
      question: 'A call costs £4 (strike £100). A put costs £3 (same strike, same expiry). The share is at £101. Does put-call parity roughly hold?',
      answer: 'yes',
      explanation: 'Put-call parity (simplified): C − P ≈ S − K. Call − Put = £4 − £3 = £1. Share − Strike = £101 − £100 = £1. Both sides equal £1. Parity holds. ✓'
    },
    {
      id: 'om09', difficulty: 'intermediate',
      question: 'A share is at £200. A call (strike £200, 6-month expiry) costs £15. Is this option in-the-money, at-the-money, or out-of-the-money? What is the intrinsic value?',
      answer: 'at-the-money, intrinsic value £0',
      explanation: 'Share price (£200) equals strike (£200) → at-the-money. Intrinsic = max(200−200, 0) = £0. The entire £15 price is time value — you\'re paying purely for the possibility of a move over the next 6 months.'
    },
    {
      id: 'om10', difficulty: 'intermediate',
      question: 'Two options on the same share (price £50). Call A: strike £45, costs £7. Call B: strike £55, costs £2. Which has more intrinsic value? Which has more time value?',
      answer: 'A has more intrinsic (£5 vs £0). B has more time value (£2 vs £2).',
      explanation: 'Call A: intrinsic = max(50−45, 0) = £5. Time value = £7−£5 = £2. Call B: intrinsic = max(50−55, 0) = £0. Time value = £2−£0 = £2. They have the same time value (£2), but A has £5 of intrinsic value while B has none. A is in-the-money; B is out-of-the-money.'
    }
  ],

  tool: {
    id: 'simple-payoff',
    title: 'Payoff Calculator',
    render: function(container) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.5rem;margin:1.5rem 0;">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#06b6d4;margin-bottom:1rem;">OPTION PAYOFF CALCULATOR</h3>
          <p style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);margin-bottom:1rem;line-height:1.6;">
            Enter the details of your option and the share price at expiry. The calculator shows your payoff and profit.
          </p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
            <div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;">Option Type</label>
              <select id="op-type" style="width:100%;padding:0.4rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.3rem 0;">
                <option value="call">Call (right to BUY)</option>
                <option value="put">Put (right to SELL)</option>
              </select>
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.5rem;display:block;">Strike Price (£)</label>
              <input type="number" id="op-strike" value="100" style="width:100%;padding:0.4rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.3rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.5rem;display:block;">Premium Paid (£)</label>
              <input type="number" id="op-premium" value="4" step="0.5" style="width:100%;padding:0.4rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.3rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.8rem;color:var(--muted);text-transform:uppercase;margin-top:0.5rem;display:block;">Share Price at Expiry (£)</label>
              <input type="range" id="op-price" min="50" max="150" value="100" style="width:100%;margin:0.3rem 0;">
              <div id="op-price-display" style="font-family:'DM Mono',monospace;color:var(--text);text-align:center;font-size:1.2rem;">£100</div>
            </div>
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;">
              <div id="op-output" style="font-family:'DM Mono',monospace;font-size:0.95rem;color:var(--text);line-height:2.2;"></div>
              <canvas id="op-chart" width="300" height="180" style="width:100%;margin-top:1rem;"></canvas>
            </div>
          </div>
        </div>`;

      function calc() {
        const type = document.getElementById('op-type').value;
        const K = parseFloat(document.getElementById('op-strike').value) || 100;
        const prem = parseFloat(document.getElementById('op-premium').value) || 4;
        const S = parseFloat(document.getElementById('op-price').value);

        document.getElementById('op-price-display').textContent = '£' + S;

        const payoff = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
        const profit = payoff - prem;
        const breakeven = type === 'call' ? K + prem : K - prem;

        const isITM = type === 'call' ? S > K : S < K;
        const moneyness = S === K ? 'At-the-money' : isITM ? 'In-the-money' : 'Out-of-the-money';

        let html = '';
        html += '<div>Type: <span style="color:#06b6d4;">' + (type === 'call' ? 'CALL' : 'PUT') + '</span></div>';
        html += '<div>Status: <span style="color:var(--text-bright);">' + moneyness + '</span></div>';
        html += '<div style="margin-top:0.5rem;">Payoff: <span style="color:var(--text-bright);">£' + payoff.toFixed(2) + '</span></div>';
        html += '<div style="font-size:0.8rem;color:var(--muted);">= max(' + (type==='call' ? S+'−'+K : K+'−'+S) + ', 0)</div>';
        html += '<div style="margin-top:0.5rem;">Premium paid: £' + prem.toFixed(2) + '</div>';

        const profitColor = profit > 0 ? 'var(--green-bright)' : profit < 0 ? 'var(--red-bright)' : 'var(--text)';
        html += '<div style="margin-top:0.5rem;font-size:1.3rem;">Profit: <span style="color:' + profitColor + ';">' + (profit >= 0 ? '+' : '') + '£' + profit.toFixed(2) + '</span></div>';
        html += '<div style="margin-top:0.5rem;color:var(--muted);font-size:0.85rem;">Break-even: £' + breakeven.toFixed(2) + '</div>';

        document.getElementById('op-output').innerHTML = html;

        // Draw simple payoff chart
        const canvas = document.getElementById('op-chart');
        const ctx = canvas.getContext('2d');
        const W = 300, H = 180;
        canvas.width = W * 2; canvas.height = H * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, W, H);

        const margin = {l:30, r:10, t:10, b:25};
        const pW = W - margin.l - margin.r;
        const pH = H - margin.t - margin.b;

        const minS = K * 0.7;
        const maxS = K * 1.3;
        const maxProfit = (maxS - K) - prem;
        const minProfit = -prem;
        const yRange = Math.max(Math.abs(maxProfit), Math.abs(minProfit)) * 1.2;

        function x(s) { return margin.l + ((s - minS) / (maxS - minS)) * pW; }
        function y(p) { return margin.t + pH/2 - (p / yRange) * (pH/2); }

        // Zero line
        ctx.strokeStyle = '#1e2638';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.l, y(0));
        ctx.lineTo(W - margin.r, y(0));
        ctx.stroke();

        // Strike line
        ctx.strokeStyle = '#4a5568';
        ctx.setLineDash([3,3]);
        ctx.beginPath();
        ctx.moveTo(x(K), margin.t);
        ctx.lineTo(x(K), H - margin.b);
        ctx.stroke();
        ctx.setLineDash([]);

        // Payoff line
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let s = minS; s <= maxS; s += 0.5) {
          const po = type === 'call' ? Math.max(s - K, 0) : Math.max(K - s, 0);
          const pr = po - prem;
          const px = x(s), py = y(pr);
          s === minS ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Current point
        ctx.fillStyle = profit >= 0 ? '#2dd4a0' : '#ef5350';
        ctx.beginPath();
        ctx.arc(x(S), y(profit), 4, 0, Math.PI * 2);
        ctx.fill();

        // Labels
        ctx.fillStyle = '#4a5568';
        ctx.font = '9px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('£' + minS.toFixed(0), margin.l, H - 5);
        ctx.fillText('K=£' + K, x(K), H - 5);
        ctx.fillText('£' + maxS.toFixed(0), W - margin.r, H - 5);
      }

      ['op-type','op-strike','op-premium'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', calc);
      });
      document.getElementById('op-price').addEventListener('input', calc);
      calc();
    }
  }
};

if (typeof window !== 'undefined') { window.OPTIONS_MODULE_1 = OPTIONS_MODULE_1; }