// options-m6-greeks.js
// Module 6: The Greeks — Gamma, Theta, Vega, Rho
// Tier: Advanced
// All four remaining Greeks with real-world analogies

const OPTIONS_MODULE_6 = {
  id: 6,
  title: 'The Greeks — Gamma, Theta, Vega, Rho',
  tier: 'advanced',
  scenarioCount: 15,
  accentColor: '#06b6d4',

  tutorial: `
    <div class="tut">

      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#06b6d4;letter-spacing:0.05em;">MODULE 6: GAMMA, THETA, VEGA, RHO</h2>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        Module 5 covered Delta — your speedometer. This module covers the other four Greeks. Each one measures a different kind of risk, and each one has a real-world analogy that makes it intuitive.
      </p>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER — ALL FOUR GREEKS</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Gamma (Γ):</strong> How fast delta changes. If delta is speed, gamma is acceleration. Tells you how unstable your hedge is.<br>
          <strong style="color:var(--text-bright);">Theta (Θ):</strong> How much value you lose each day from time passing. The daily "rent" you pay for holding an option. Always negative for buyers.<br>
          <strong style="color:var(--text-bright);">Vega (ν):</strong> How much the option price changes when implied volatility moves 1%. The sensitivity to market fear/calm.<br>
          <strong style="color:var(--text-bright);">Rho (ρ):</strong> How much the option price changes when interest rates move 1%. Usually the least important Greek for short-dated options.
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- GAMMA -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">GAMMA — THE ACCELERATION</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        If you're driving at 60 mph (that's your delta), gamma tells you whether you're accelerating, cruising, or braking. A car accelerating from 0 to 60 has high gamma. A car cruising at a steady 60 has zero gamma.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        In options, gamma measures how quickly delta changes when the share price moves:
      </p>

      <div class="mb">
Gamma example:

Call option. Delta = 0.50. Gamma = 0.03.
Share rises £1.

New delta ≈ 0.50 + 0.03 = 0.53
(Delta increased by gamma for each £1 move)

Share rises another £1:
New delta ≈ 0.53 + 0.03 = 0.56

The option is becoming MORE sensitive to the share
with each £1 rise. It's accelerating.

When is gamma highest?
  → ATM options near expiry.
  These are on a knife-edge — the slightest move
  flips them from "probably worthless" to "probably valuable."
  Their delta changes fastest.

When is gamma lowest?
  → Deep ITM or deep OTM options.
  The outcome is already fairly certain.
  Delta barely changes because it's already near 1 or 0.</div>

      <div class="pln">
        Gamma matters because it tells you how quickly your hedge breaks. If you're delta-hedged (Module 5) and gamma is high, a big share move will throw your hedge off quickly — you'll need to rebalance. If gamma is low, your hedge stays accurate for longer. Market makers fear high gamma because it means constant, expensive rebalancing.
      </div>

      <div class="dg">
        <strong>Gamma risk on expiry day:</strong> ATM options on expiry day have extreme gamma. Delta can swing from 0.2 to 0.8 in minutes as the share crosses the strike price. This is why expiry days can be volatile — market makers are frantically rebalancing hedges as millions of options flip between worthless and valuable.
      </div>

      <!-- ============================================================ -->
      <!-- THETA -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THETA — THE DAILY RENT</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Imagine renting a hotel room. Every night costs you money, even if you spend the whole day in bed doing nothing. Theta is the nightly cost of your option. Every day that passes, the option loses a little value — even if the share price doesn't move at all.
      </p>

      <div class="mb">
Theta example:

Call option worth £4.62. Theta = −£0.05 per day.

Day 1: Share doesn't move. Option worth ≈ £4.57
Day 2: Share doesn't move. Option worth ≈ £4.52
Day 3: Share doesn't move. Option worth ≈ £4.47

After 10 days of nothing: £4.62 − (10 × £0.05) = £4.12
You've lost £0.50 without the share moving a penny.

THIS IS WHY MOST OPTION BUYERS LOSE MONEY.
They buy an option, the share goes sideways,
and theta quietly eats the premium.</div>

      <div class="pln">
        Theta is always negative for option buyers (you're paying the rent) and positive for option sellers (you're collecting rent). This is why some traders prefer selling options — they earn theta every day. The risk is that a big move wipes out months of collected theta in one day. Module 8 explores strategies that exploit this trade-off.
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;margin-top:1rem;">
        Theta isn't constant — it accelerates near expiry:
      </p>

      <div class="mb">
Theta decay curve (ATM option):

Days to expiry │ Daily theta │ Monthly decay
━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━┿━━━━━━━━━━━━━━
     180       │   £0.02     │   £0.60
      90       │   £0.03     │   £0.90
      30       │   £0.05     │   £1.50
      14       │   £0.08     │     —
       7       │   £0.12     │     —
       1       │   £0.30     │     —

The last 30 days account for more decay than
the first 150 days. The last week is brutal.

This is not linear — it follows a square root curve.
Theta ∝ 1/√T</div>

      <div class="pln">
        The theta decay curve is one of the most important concepts for any options trader. If you're buying options, buy with plenty of time — the early days are cheap. If you're selling options, sell with 30-45 days to expiry — that's when theta accelerates fastest and you collect the most rent per day.
      </div>

      <!-- ============================================================ -->
      <!-- VEGA -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">VEGA — THE FEAR GAUGE</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Imagine you're selling umbrellas. If the weather forecast changes from "sunny week ahead" to "storms expected," the value of your umbrellas goes up — even though it hasn't rained yet. The forecast (expectation) changed the price.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Vega works the same way. It measures how much the option price changes when the market's expectation of future volatility (implied volatility) changes — even if the share price doesn't move.
      </p>

      <div class="mb">
Vega example:

Call option worth £4.62. Vega = £0.15.
Implied volatility is currently 20%.

News breaks: a government investigation is announced.
Implied volatility jumps from 20% to 25% (+5 points).

Option price change = vega × IV change
                    = £0.15 × 5
                    = +£0.75

New option price ≈ £4.62 + £0.75 = £5.37

The share price didn't move at all.
The option gained £0.75 purely from increased fear.</div>

      <div class="pln">
        Vega is why options prices spike before earnings announcements, elections, and central bank decisions. Everyone expects a big move, so implied volatility rises, and all options become more expensive. After the event, volatility crashes back down ("IV crush") and option prices deflate — even if the share moved in your favour. Many traders who "got the direction right" on earnings still lost money because IV crush destroyed more value than the move created.
      </div>

      <div class="mb">
Key vega facts:

  Vega is always POSITIVE for long options (call or put).
    Higher volatility → more valuable option.

  Vega is highest for ATM options.
    Deep ITM/OTM options are less sensitive to vol changes.

  Vega increases with more time to expiry.
    Long-dated options are much more sensitive to vol.
    LEAPS (1-2 year options) can have enormous vega.

  Vega is NOT an actual Greek letter (ν is "nu").
    Traders use "vega" anyway. Nobody cares about the pedantry.</div>

      <div class="pt">
        <strong>The practical rule:</strong> If you're buying options before an event (earnings, FDA decision, election), you're paying for high IV. You need the share to move MORE than the market expects to profit — because IV crush after the event will deflate your option regardless. Module 7 explores how to measure whether IV is "expensive" or "cheap."
      </div>

      <!-- ============================================================ -->
      <!-- RHO -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">RHO — THE INTEREST RATE SENSITIVITY</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Rho is the wallflower of the Greeks. For short-dated options (under 3 months), it barely matters. But for long-dated options, it can be significant.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        The analogy: if you're buying a house in 12 months, and interest rates drop, the present value of your future payment decreases — which makes the right to buy (a call) more valuable. Rho captures this effect.
      </p>

      <div class="mb">
Rho:
  Call rho is POSITIVE: higher rates → higher call price
  Put rho is NEGATIVE: higher rates → lower put price

  Why? Higher rates make the present value of the strike
  (which you pay in the future) smaller. That benefits calls
  (you're paying less in real terms) and hurts puts
  (you're receiving less in real terms).

  Typical magnitude:
    Short-dated (1 month): rho ≈ £0.01 per 1% rate change
    Long-dated (1 year): rho ≈ £0.10 per 1% rate change

  For most traders, rho is negligible unless you're trading
  LEAPS or rates are moving dramatically.</div>

      <!-- ============================================================ -->
      <!-- PUTTING IT ALL TOGETHER -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">ALL FIVE GREEKS TOGETHER</h3>

      <div class="mb">
Summary table:

Greek │ Measures                    │ Buyer │ Seller │ Biggest when
━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━┿━━━━━━━━┿━━━━━━━━━━━━━
Delta │ Price sensitivity to share  │ + call│ mirror │ Deep ITM
      │                             │ − put │        │
Gamma │ Delta sensitivity to share  │   +   │   −    │ ATM near expiry
Theta │ Daily time decay            │   −   │   +    │ ATM near expiry
Vega  │ Sensitivity to volatility   │   +   │   −    │ ATM long-dated
Rho   │ Sensitivity to rates        │ + call│ mirror │ Long-dated

Key relationships:
  Gamma and Theta are ENEMIES.
    High gamma (good for buyers — you benefit from moves)
    comes with high theta (bad for buyers — you pay daily rent).
    You can't have one without the other.

  This is the fundamental trade-off in options:
    BUYERS pay theta to receive gamma (benefit from movement).
    SELLERS collect theta but face gamma (harmed by movement).</div>

      <div class="pln">
        The gamma-theta trade-off is the beating heart of options trading. Buyers pay rent (theta) for the chance to benefit from moves (gamma). Sellers collect rent hoping nothing big happens. Understanding this trade-off is the difference between profitable options trading and expensive options gambling.
      </div>

      <div class="gd">
        <strong>What you now know:</strong> All five Greeks, what they measure, and when each matters. You can look at any option on your broker's platform and understand every number shown. Delta tells you sensitivity and direction. Gamma tells you stability. Theta tells you the daily cost. Vega tells you volatility exposure. Rho you can mostly ignore unless you're trading LEAPS.<br><br>
        <strong>Coming in Module 7:</strong> Implied volatility — the single most important concept for advanced options trading. How to calculate it, how to judge if options are cheap or expensive, and the volatility smile that breaks Black-Scholes's assumption.
      </div>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.5rem;margin-top:2rem;text-align:center;">
        <div style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.6;font-style:italic;">
          "This is mathematical education, not financial advice. Options trading involves significant risk of loss."
        </div>
      </div>
    </div>
  `,

  scenarios: [
    // GAMMA (5)
    {id:'g601',difficulty:'basic',question:'A call has delta = 0.45 and gamma = 0.04. The share rises £2. What is the approximate new delta?',answer:'0.53',explanation:'New delta = 0.45 + (0.04 × 2) = 0.53. Gamma of 0.04 means delta increases by 0.04 for each £1 the share rises.'},
    {id:'g602',difficulty:'basic',question:'Which has higher gamma: an ATM option expiring tomorrow, or an ATM option expiring in 6 months?',answer:'the one expiring tomorrow',explanation:'Gamma is highest for ATM options near expiry. Tomorrow\'s expiry means a £1 move could flip the option from worthless to valuable (or vice versa). The 6-month option has time to absorb small moves without delta shifting much.'},
    {id:'g603',difficulty:'intermediate',question:'You\'re delta-neutral with high gamma. The share makes a big move in either direction. Is this good or bad for you?',answer:'good (if you\'re long gamma)',explanation:'Long gamma means delta moves in your favour whichever way the share goes. Share rises → your delta becomes positive (you profit from the rise). Share falls → delta becomes negative (you profit from the fall). Long gamma benefits from movement — you want volatility.'},
    {id:'g604',difficulty:'intermediate',question:'A market maker is short gamma (sold options). Why do they fear big moves?',answer:'their hedge breaks — delta changes against them faster than they can rebalance',explanation:'Short gamma means delta moves AGAINST you when the share moves. Rise → your delta becomes more negative (losing more). Fall → delta becomes more positive (losing on that side). Short gamma is like being on the wrong side of every move. They need constant rebalancing which costs money in spreads.'},
    {id:'g605',difficulty:'advanced',question:'An ATM call expiring in 2 days has gamma = 0.15. An ATM call expiring in 6 months has gamma = 0.02. Why is the near-expiry gamma 7.5× higher?',answer:'near expiry, small price moves have a huge impact on whether the option finishes ITM or OTM',explanation:'With 2 days left, a £1 move might take the option from 50% probability of expiring ITM to 80% — a massive delta shift. With 6 months left, a £1 move barely changes the probability because there\'s so much time for the share to move back. Short time = high gamma.'},

    // THETA (5)
    {id:'g606',difficulty:'basic',question:'An option has theta = −£0.08 per day. The share doesn\'t move for a week. How much value does the option lose?',answer:'£0.56',explanation:'7 days × £0.08 = £0.56 lost to time decay. Even with zero share movement, the option bleeds value every day.'},
    {id:'g607',difficulty:'basic',question:'You sell an ATM call and collect £5.00 premium. Theta is £0.12/day (positive for sellers). If the share stays flat, roughly how many days until the option is worth £3.00?',answer:'about 17 days',explanation:'Need to decay £2.00 at £0.12/day: 2.00/0.12 ≈ 17 days. (In reality theta accelerates, so it might be slightly fewer days, but this is a reasonable approximation.)'},
    {id:'g608',difficulty:'intermediate',question:'An option has 90 days to expiry and costs £4.00. Another identical option has 30 days and costs £2.30. Which has higher daily theta?',answer:'the 30-day option',explanation:'Theta accelerates near expiry. The 30-day option decays faster per day even though it\'s cheaper. It has less total time value to lose, but it\'s losing it faster. The theta decay curve follows √T — the last 30 days experience more decay per day than the first 60.'},
    {id:'g609',difficulty:'intermediate',question:'You buy a call 60 days before earnings. Earnings are in 45 days. You plan to sell before earnings. How much theta will you pay?',answer:'15 days of theta',explanation:'You hold for 15 days (day 60 to day 45). At 60-45 days out, theta is moderate — not the brutal near-expiry decay. Your theta cost is manageable. The real risk is IV change, not theta, at this timeframe.'},
    {id:'g610',difficulty:'advanced',question:'An options seller collects £0.10/day in theta from a position. A once-per-year event causes the share to gap 20%, costing them £800. Over a year of collecting theta (250 trading days), are they profitable?',answer:'yes — barely',explanation:'Annual theta collected: 250 × £0.10 = £25.00. Wait — that seems too low. Let\'s reconsider: if theta is £0.10 per contract and they sell 10 contracts, that\'s £1.00/day or £250/year. Against an £800 loss, they\'re net −£550. This illustrates the seller\'s dilemma: months of small gains wiped out by one bad event. Proper position sizing (Module 9) is essential.'},

    // VEGA (3)
    {id:'g611',difficulty:'basic',question:'An option has vega = £0.20. Implied volatility rises from 25% to 30%. How much does the option price increase?',answer:'£1.00',explanation:'Vega × IV change = £0.20 × 5 = £1.00. Five percentage points of IV increase adds £1 to the option price, regardless of share price movement.'},
    {id:'g612',difficulty:'intermediate',question:'You buy a call before earnings. IV is 45%. After earnings, IV drops to 22% ("IV crush"). Vega = £0.18. How much value does IV crush destroy?',answer:'£4.14',explanation:'IV drop = 23 points. Vega × drop = 0.18 × 23 = £4.14. Even if the share moved in your favour, IV crush wipes out £4.14 of value. The share needs to have moved enough to overcome this.'},
    {id:'g613',difficulty:'advanced',question:'Two options: (A) 30-day ATM, vega = £0.08. (B) 1-year ATM, vega = £0.25. If IV rises 5%, which gains more?',answer:'the 1-year option gains £1.25 vs £0.40',explanation:'A: 0.08 × 5 = £0.40. B: 0.25 × 5 = £1.25. Long-dated options have much higher vega. This is why LEAPS are so sensitive to volatility changes — and why they can be profitable plays on volatility expansion.'},

    // RHO (2)
    {id:'g614',difficulty:'intermediate',question:'A 1-year call has rho = £0.12. The Bank of England raises rates by 0.5%. How does this affect the call price?',answer:'increases by £0.06',explanation:'Rho × rate change = 0.12 × 0.5 = £0.06. Small but measurable for long-dated options. For a 1-month option, this would be negligible.'},
    {id:'g615',difficulty:'intermediate',question:'Why is rho positive for calls and negative for puts?',answer:'higher rates reduce the present value of the strike price — good for call buyers, bad for put buyers',explanation:'The strike price is what you pay (calls) or receive (puts) in the future. Higher rates make future money worth less today. For a call buyer: the discounted strike is lower → cheaper to exercise → call worth more. For a put buyer: the discounted strike is lower → you receive less in present value terms → put worth less.'}
  ],

  tool: {
    id: 'greeks-dashboard',
    title: 'Greeks Dashboard',
    render: function(container) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.5rem;margin:1.5rem 0;">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#06b6d4;margin-bottom:0.5rem;">GREEKS DASHBOARD</h3>
          <p style="font-family:'Crimson Pro',serif;font-size:0.9rem;color:var(--text);margin-bottom:1rem;">All five Greeks visualised. Adjust the share price slider to watch them change in real-time.</p>
          <div style="display:grid;grid-template-columns:180px 1fr;gap:1rem;">
            <div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;">Strike (£)</label>
              <input type="number" id="gd-k" value="100" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;font-size:0.85rem;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Share Price (£)</label>
              <input type="range" id="gd-s" min="70" max="130" value="100" style="width:100%;margin:0.2rem 0;">
              <div id="gd-s-d" style="font-family:'DM Mono',monospace;font-size:0.9rem;color:var(--text);text-align:center;">£100</div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Vol (%)</label>
              <input type="range" id="gd-vol" min="5" max="60" value="20" style="width:100%;margin:0.2rem 0;">
              <div id="gd-vol-d" style="font-family:'DM Mono',monospace;font-size:0.85rem;color:var(--text);text-align:center;">20%</div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Days to Expiry</label>
              <input type="range" id="gd-t" min="1" max="365" value="90" style="width:100%;margin:0.2rem 0;">
              <div id="gd-t-d" style="font-family:'DM Mono',monospace;font-size:0.85rem;color:var(--text);text-align:center;">90 days</div>
            </div>
            <div id="gd-output" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;"></div>
          </div>
        </div>`;

      function normCDF(x){const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const s=x<0?-1:1;x=Math.abs(x)/Math.sqrt(2);const t=1/(1+p*x);return 0.5*(1+s*(1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)));}
      function normPDF(x){return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);}

      function calc(){
        const S=parseFloat(document.getElementById('gd-s').value);
        const K=parseFloat(document.getElementById('gd-k').value)||100;
        const vol=parseFloat(document.getElementById('gd-vol').value)/100;
        const days=parseFloat(document.getElementById('gd-t').value);
        const T=days/365;const r=0.05;
        document.getElementById('gd-s-d').textContent='£'+S;
        document.getElementById('gd-vol-d').textContent=(vol*100).toFixed(0)+'%';
        document.getElementById('gd-t-d').textContent=days+' days';

        if(T<=0)return;
        const sqT=Math.sqrt(T),vst=vol*sqT;
        const d1=(Math.log(S/K)+(r+vol*vol/2)*T)/vst;
        const d2=d1-vst;
        const nd1=normPDF(d1),Nd1=normCDF(d1),Nd2=normCDF(d2);
        const disc=Math.exp(-r*T);

        const callP=S*Nd1-K*disc*Nd2;
        const putP=K*disc*normCDF(-d2)-S*normCDF(-d1);

        const deltaC=Nd1, deltaP=Nd1-1;
        const gamma=nd1/(S*vst);
        const thetaC=(-(S*nd1*vol)/(2*sqT)-r*K*disc*Nd2)/365;
        const thetaP=(-(S*nd1*vol)/(2*sqT)+r*K*disc*normCDF(-d2))/365;
        const vega=S*sqT*nd1/100;
        const rhoC=K*T*disc*Nd2/100;
        const rhoP=-K*T*disc*normCDF(-d2)/100;

        const moneyness=S>K*1.02?'In the money':S<K*0.98?'Out of the money':'At the money';

        function gBox(name,cVal,pVal,desc,col){
          return '<div style="background:var(--surface);border-radius:6px;padding:0.75rem;border-left:3px solid '+col+';">'+
            '<div style="color:'+col+';font-size:0.85rem;font-weight:bold;font-family:\'Outfit\',sans-serif;">'+name+'</div>'+
            '<div style="font-family:\'DM Mono\',monospace;font-size:1.1rem;color:var(--text-bright);margin:0.25rem 0;">Call: '+cVal+' | Put: '+pVal+'</div>'+
            '<div style="font-family:\'Crimson Pro\',serif;font-style:italic;font-size:0.8rem;color:var(--muted);">'+desc+'</div></div>';
        }

        let html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">';
        html+='<div style="text-align:center;padding:0.75rem;background:var(--surface);border-radius:6px;border-top:2px solid #2dd4a0;"><div style="color:var(--muted);font-size:0.7rem;text-transform:uppercase;">Call</div><div style="color:#2dd4a0;font-size:1.4rem;">£'+callP.toFixed(2)+'</div></div>';
        html+='<div style="text-align:center;padding:0.75rem;background:var(--surface);border-radius:6px;border-top:2px solid var(--red-bright);"><div style="color:var(--muted);font-size:0.7rem;text-transform:uppercase;">Put</div><div style="color:var(--red-bright);font-size:1.4rem;">£'+putP.toFixed(2)+'</div></div>';
        html+='</div>';
        html+='<div style="color:var(--muted);font-size:0.8rem;margin-bottom:0.75rem;">'+moneyness+' | P(ITM): '+(Nd2*100).toFixed(1)+'%</div>';

        html+='<div style="display:grid;gap:0.5rem;">';
        html+=gBox('Delta',deltaC.toFixed(3),deltaP.toFixed(3),'£'+deltaC.toFixed(2)+' per £1 share move','#06b6d4');
        html+=gBox('Gamma',gamma.toFixed(4),gamma.toFixed(4),'Delta changes '+gamma.toFixed(3)+' per £1. '+(gamma>0.01?'High — hedge is unstable.':'Low — hedge is stable.'),'#a78bfa');
        html+=gBox('Theta',thetaC.toFixed(3),thetaP.toFixed(3),'Losing £'+Math.abs(thetaC).toFixed(2)+'/day. '+(Math.abs(thetaC)>0.1?'Rapid decay!':'Moderate decay.'),'#ef5350');
        html+=gBox('Vega',vega.toFixed(3),vega.toFixed(3),'£'+vega.toFixed(2)+' per 1% vol change. '+(vega>0.2?'Very vol-sensitive.':'Modest vol sensitivity.'),'#facc15');
        html+=gBox('Rho',rhoC.toFixed(3),rhoP.toFixed(3),'£'+rhoC.toFixed(2)+' per 1% rate change. '+(days>180?'Noticeable for this duration.':'Negligible at this duration.'),'#4a5568');
        html+='</div>';

        document.getElementById('gd-output').innerHTML=html;
      }

      ['gd-k'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
      ['gd-s','gd-vol','gd-t'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
      calc();
    }
  }
};

if(typeof window!=='undefined'){window.OPTIONS_MODULE_6=OPTIONS_MODULE_6;}
