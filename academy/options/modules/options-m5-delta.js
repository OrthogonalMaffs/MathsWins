// options-m5-delta.js
// Module 5: The Greeks — Delta
// Tier: Advanced
// Delta as hedge ratio, sensitivity, and probability proxy

const OPTIONS_MODULE_5 = {
  id: 5,
  title: 'The Greeks — Delta',
  tier: 'advanced',
  scenarioCount: 10,
  accentColor: '#06b6d4',

  tutorial: `
    <div class="tut">

      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#06b6d4;letter-spacing:0.05em;">MODULE 5: THE GREEKS — DELTA</h2>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        Welcome to the Advanced tier. You now know how options are priced. The next three modules teach you what happens AFTER you buy or sell one — how the price changes as conditions change. These sensitivities are called "the Greeks," and Delta is the most important.
      </p>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        If you've ever driven a car, you already understand Delta. Your speedometer tells you how fast you're going — how much your position changes per unit of time. Delta tells you how much your option price changes per unit of share price movement. It's your options speedometer.
      </p>

      <!-- ============================================================ -->
      <!-- SECTION 1: WHAT DELTA IS -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHAT DELTA TELLS YOU</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Delta (Δ):</strong> How much the option price changes when the share price moves £1. A delta of 0.50 means the option gains £0.50 for every £1 the share rises.<br>
          <strong style="color:var(--text-bright);">Delta-neutral:</strong> A position where the total delta is zero — it doesn't move when the share price moves (at least for small moves). This is how market makers hedge their risk.<br>
          <strong style="color:var(--text-bright);">Hedge ratio:</strong> Another name for delta. It tells you how many shares you need to offset the risk of your option position.
        </div>
      </div>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Delta has three interpretations. All three are useful. All three come from the same number.
      </p>

      <div class="mb">
THREE MEANINGS OF DELTA

1. SENSITIVITY: How much the option price moves per £1 share move.
   Delta = 0.60 → option gains £0.60 when share rises £1.

2. HEDGE RATIO: How many shares to buy/sell to hedge the option.
   Delta = 0.60 → buy 0.60 shares per option to be neutral.

3. PROBABILITY PROXY: Approximate chance of finishing in the money.
   Delta = 0.60 → roughly 60% chance the option expires ITM.

Delta ranges:
  Call options: 0 to +1
    Deep OTM call: delta ≈ 0 (barely moves, unlikely to pay off)
    ATM call: delta ≈ 0.50 (coin flip)
    Deep ITM call: delta ≈ 1.0 (moves pound-for-pound with shares)

  Put options: −1 to 0
    Deep OTM put: delta ≈ 0
    ATM put: delta ≈ −0.50
    Deep ITM put: delta ≈ −1.0</div>

      <div class="pln">
        When your broker shows "Delta: 0.35" next to a call option, it's saying three things at once: (1) the option gains about 35p per £1 share move, (2) you'd need 0.35 shares to hedge each option, and (3) there's roughly a 35% chance it finishes in the money. One number, three practical uses.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 2: DELTA IN PRACTICE — THE SPEEDOMETER -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">DELTA IN PRACTICE</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Let's make this tangible. You own a call option with delta = 0.50. The share is at £100.
      </p>

      <div class="mb">
Share goes from £100 to £101 (rises £1):
  Option price change ≈ Δ × £1 = 0.50 × £1 = +£0.50
  If the option was worth £4.62, it's now worth ≈ £5.12.

Share goes from £100 to £98 (falls £2):
  Option price change ≈ Δ × (−£2) = 0.50 × (−£2) = −£1.00
  Option was £4.62, now ≈ £3.62.

Share goes from £100 to £105 (rises £5):
  Approximate change ≈ 0.50 × £5 = +£2.50
  BUT: delta itself changes as the share moves.
  At £105, the option is now deeper ITM, so delta is higher
  (maybe 0.60). The actual gain is a bit MORE than £2.50.
  This "delta changing" effect is called Gamma (Module 6).</div>

      <div class="pln">
        Delta is accurate for small moves. For larger moves, it's an approximation because delta itself shifts as the share price changes. Think of it like a speedometer — it tells you your speed RIGHT NOW, but you might accelerate or decelerate a second later. Gamma (the next Greek) measures that acceleration.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 3: HOW DELTA CHANGES -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">HOW DELTA CHANGES</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Delta isn't fixed. It changes based on three things:
      </p>

      <div class="mb">
1. WHERE THE SHARE PRICE IS RELATIVE TO STRIKE

   Share well below strike (deep OTM): Δ ≈ 0
     Option will almost certainly expire worthless.
     It barely reacts to share price moves.

   Share near the strike (ATM): Δ ≈ 0.50
     Coin flip territory. The option is highly sensitive
     to which way the share moves next.

   Share well above strike (deep ITM): Δ ≈ 1.0
     Option will almost certainly finish ITM.
     It moves essentially pound-for-pound with the share.

2. TIME TO EXPIRY

   More time: delta curve is GRADUAL (smooth S-shape)
     Even OTM options have decent delta because
     there's time for the share to move.

   Less time: delta curve is STEEP (sharp step)
     The option is either clearly ITM (delta → 1)
     or clearly OTM (delta → 0).
     ATM options near expiry have delta swinging wildly.

3. VOLATILITY

   Higher vol: delta curve is FLATTER
     Uncertainty means even far OTM options have a chance.
   Lower vol: delta curve is STEEPER
     More certainty about the outcome.</div>

      <div class="pln">
        Near expiry, delta behaves like a light switch — it's either on (1.0) or off (0). Far from expiry, it's like a dimmer — smooth, gradual, with lots of in-between values. This is why options near expiry are so jumpy: a small share price move can flip delta from 0.4 to 0.8 in minutes.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 4: DELTA-NEUTRAL HEDGING -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">DELTA-NEUTRAL — HEDGING YOUR BETS</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Market makers sell you options all day. If they just held the exposure, they'd be gambling on direction. Instead, they hedge using delta.
      </p>

      <div class="mb">
You sell 10 call options on Company X.
Each option has delta = 0.55.
Each option covers 100 shares.

Your total delta exposure:
  −10 × 0.55 × 100 = −550 delta
  (Negative because you SOLD calls)

This means: if the share rises £1, you lose £550.

To hedge, buy shares equal to your delta:
  Buy 550 shares.
  Now if the share rises £1:
    Shares gain: 550 × £1 = +£550
    Options lose: −£550
    Net: £0

You're delta-neutral. Share direction doesn't hurt you.</div>

      <div class="pln">
        Delta-neutral means you don't care which direction the share moves. Market makers make money not from direction, but from the spread (buying options cheap, selling them expensive). Delta hedging lets them capture that spread without taking directional risk. It's the practical application of the replicating portfolio from Module 3.<br><br>
        The catch: delta changes as the share moves (gamma), so the hedge needs constant adjustment. This is called "dynamic hedging" and it's what market makers do all day.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 5: DELTA OF DIFFERENT POSITIONS -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">DELTA FOR COMMON POSITIONS</h3>

      <div class="mb">
Position                    │  Delta
━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━
Long 1 share                │  +1.00
Long 1 ATM call             │  +0.50
Long 1 ATM put              │  −0.50
Short 1 ATM call            │  −0.50
Short 1 ATM put             │  +0.50
Long 1 deep ITM call        │  +0.95
Long 1 far OTM call         │  +0.05
Covered call (long share    │  +0.50
  + short ATM call)         │  (1.00 − 0.50)
Straddle (long ATM call     │  0.00
  + long ATM put)           │  (0.50 + (−0.50))

Key insight: deltas ADD UP.
A portfolio's total delta = sum of all position deltas.
This lets you calculate your total directional exposure
across multiple positions instantly.</div>

      <div class="pln">
        Notice the straddle has zero delta — it's automatically delta-neutral. That's because the call's positive delta exactly cancels the put's negative delta. A straddle profits from MOVEMENT, not direction. This is pure volatility exposure. Module 8 explores these strategies mathematically.
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 6: THE FORMULA (FOR REFERENCE) -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE FORMULA (FOR REFERENCE)</h3>

      <div class="mb">
Delta for a call: Δ_call = N(d₁)
Delta for a put:  Δ_put  = N(d₁) − 1

where d₁ is from the Black-Scholes formula (Module 4).

At-the-money (d₁ ≈ 0):
  Call delta ≈ N(0) = 0.50
  Put delta ≈ 0.50 − 1 = −0.50

Deep in-the-money call (d₁ → ∞):
  N(∞) → 1.0, so delta → 1.0

Deep out-of-the-money call (d₁ → −∞):
  N(−∞) → 0, so delta → 0</div>

      <div class="gd">
        <strong>Module 5 summary:</strong> Delta tells you sensitivity (how much the option moves), hedging (how many shares to offset), and probability (chance of finishing ITM). It changes with share price, time, and volatility. It's the most frequently referenced Greek and the foundation for understanding the others.<br><br>
        <strong>Coming in Module 6:</strong> Gamma (how fast delta changes), Theta (time decay — the daily cost of holding), Vega (sensitivity to volatility), and Rho (interest rate sensitivity). Four Greeks in one module, each built on what you now know about Delta.
      </div>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.5rem;margin-top:2rem;text-align:center;">
        <div style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.6;font-style:italic;">
          "This is mathematical education, not financial advice. Options trading involves significant risk of loss."
        </div>
      </div>
    </div>
  `,

  scenarios: [
    {id:'d501',difficulty:'basic',question:'A call option has delta = 0.65. The share rises £2. Approximately how much does the option price increase?',answer:'£1.30',explanation:'Change ≈ Δ × move = 0.65 × £2 = £1.30.'},
    {id:'d502',difficulty:'basic',question:'A put option has delta = −0.40. The share rises £3. What happens to the put price?',answer:'falls by £1.20',explanation:'Change ≈ −0.40 × £3 = −£1.20. Puts lose value when shares rise (negative delta).'},
    {id:'d503',difficulty:'basic',question:'A call has delta = 0.80. Approximately what is the probability of it finishing in the money?',answer:'~80%',explanation:'Delta ≈ probability of finishing ITM. Delta 0.80 → roughly 80% chance. This is a deep in-the-money option.'},
    {id:'d504',difficulty:'basic',question:'You own 5 call options (100 shares each) with delta 0.55. What is your total delta exposure?',answer:'+275',explanation:'5 × 100 × 0.55 = +275. If the share rises £1, your position gains approximately £275.'},
    {id:'d505',difficulty:'intermediate',question:'You sell 10 call options (100 shares each) with delta 0.45. How many shares must you buy to be delta-neutral?',answer:'450 shares',explanation:'Position delta: −10 × 100 × 0.45 = −450. Buy 450 shares (+450 delta) to offset. Net delta: 0.'},
    {id:'d506',difficulty:'intermediate',question:'An ATM call has delta 0.50. The share price falls significantly and the call is now deep OTM. Is delta now higher or lower than 0.50?',answer:'lower (close to 0)',explanation:'Deep OTM options have delta near zero. The option barely reacts to share moves because it\'s very unlikely to finish ITM.'},
    {id:'d507',difficulty:'intermediate',question:'Two ATM calls: one expires in 1 week, the other in 6 months. Both have delta ≈ 0.50. Which one\'s delta will change MORE from a £2 share move?',answer:'the 1-week option',explanation:'Near expiry, the delta curve is steep — small share moves cause big delta changes. The 1-week option might jump from 0.50 to 0.70 on a £2 move, while the 6-month option barely shifts from 0.50 to 0.53.'},
    {id:'d508',difficulty:'intermediate',question:'You have a covered call: long 100 shares (+100 delta) and short 1 ATM call (−50 delta). What is your net delta?',answer:'+50',explanation:'100 + (−50) = +50. You still have upside exposure but only half as much as owning shares outright. The short call caps your upside but reduces your directional exposure.'},
    {id:'d509',difficulty:'advanced',question:'A long straddle (long ATM call + long ATM put) has delta ≈ 0. The share rises £10. The call delta went from 0.50 to 0.80. The put delta went from −0.50 to −0.20. What is the new position delta?',answer:'+0.60',explanation:'Call delta: +0.80. Put delta: −0.20. Net: +0.60. The straddle started delta-neutral but is now directional. This is gamma at work — the call gained delta faster than the put lost it.'},
    {id:'d510',difficulty:'advanced',question:'A market maker sells 100 calls (delta 0.55 each, 100 shares per contract). They delta-hedge by buying shares. Next day, the share drops £3 and delta falls to 0.42. What must they do?',answer:'sell 1,300 shares',explanation:'Original hedge: 100 × 100 × 0.55 = 5,500 shares bought. New required hedge: 100 × 100 × 0.42 = 4,200 shares. Must sell 5,500 − 4,200 = 1,300 shares to rebalance. This is dynamic hedging — constantly adjusting as delta changes.'}
  ],

  tool: {
    id: 'delta-visualiser',
    title: 'Delta Visualiser',
    render: function(container) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.5rem;margin:1.5rem 0;">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#06b6d4;margin-bottom:0.5rem;">DELTA VISUALISER</h3>
          <p style="font-family:'Crimson Pro',serif;font-size:0.9rem;color:var(--text);margin-bottom:1rem;">See how delta changes across share prices. Drag the volatility and time sliders to watch the curve reshape.</p>
          <div style="display:grid;grid-template-columns:180px 1fr;gap:1rem;">
            <div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;">Strike (£)</label>
              <input type="number" id="dv-k" value="100" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Volatility (%)</label>
              <input type="range" id="dv-vol" min="5" max="60" value="20" style="width:100%;margin:0.2rem 0;">
              <div id="dv-vol-d" style="font-family:'DM Mono',monospace;font-size:0.85rem;color:var(--text);text-align:center;">20%</div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Time to Expiry</label>
              <input type="range" id="dv-t" min="1" max="365" value="90" style="width:100%;margin:0.2rem 0;">
              <div id="dv-t-d" style="font-family:'DM Mono',monospace;font-size:0.85rem;color:var(--text);text-align:center;">90 days</div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Type</label>
              <select id="dv-type" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;">
                <option value="call">Call</option><option value="put">Put</option>
              </select>
              <div id="dv-info" style="margin-top:1rem;font-family:'DM Mono',monospace;font-size:0.8rem;color:var(--text);line-height:1.8;"></div>
            </div>
            <canvas id="dv-canvas" width="500" height="280" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;"></canvas>
          </div>
        </div>`;

      function normCDF(x) {
        const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
        const sign = x<0?-1:1; x = Math.abs(x)/Math.sqrt(2);
        const t=1/(1+p*x);
        return 0.5*(1+sign*(1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)));
      }

      function draw() {
        const K = parseFloat(document.getElementById('dv-k').value)||100;
        const vol = parseFloat(document.getElementById('dv-vol').value)/100;
        const days = parseFloat(document.getElementById('dv-t').value);
        const T = days/365;
        const r = 0.05;
        const isCall = document.getElementById('dv-type').value === 'call';

        document.getElementById('dv-vol-d').textContent = (vol*100).toFixed(0)+'%';
        document.getElementById('dv-t-d').textContent = days+' days';

        const canvas = document.getElementById('dv-canvas');
        const ctx = canvas.getContext('2d');
        const W=500,H=280;
        canvas.width=W*2;canvas.height=H*2;ctx.scale(2,2);
        ctx.fillStyle='#0a0d14';ctx.fillRect(0,0,W,H);

        const m={l:45,r:15,t:15,b:30};
        const pW=W-m.l-m.r, pH=H-m.t-m.b;
        const minS=K*0.6,maxS=K*1.4;

        function x(s){return m.l+((s-minS)/(maxS-minS))*pW;}
        function y(d){
          const range = isCall?1:1;
          const base = isCall?0:-1;
          return m.t+pH-((d-base)/range)*pH;
        }

        // Grid
        ctx.strokeStyle='#1e2638';ctx.lineWidth=0.5;
        [0,0.25,0.5,0.75,1.0].forEach(v=>{
          const val = isCall?v:v-1;
          const py=y(val);
          ctx.beginPath();ctx.moveTo(m.l,py);ctx.lineTo(W-m.r,py);ctx.stroke();
        });

        // Strike line
        ctx.strokeStyle='#4a5568';ctx.setLineDash([3,3]);
        ctx.beginPath();ctx.moveTo(x(K),m.t);ctx.lineTo(x(K),H-m.b);ctx.stroke();
        ctx.setLineDash([]);

        // Delta curve
        ctx.strokeStyle='#06b6d4';ctx.lineWidth=2.5;ctx.beginPath();
        let atmDelta = 0;
        for(let s=minS;s<=maxS;s+=0.5){
          const sqrtT=Math.sqrt(T);
          const d1=(Math.log(s/K)+(r+vol*vol/2)*T)/(vol*sqrtT);
          let delta = isCall?normCDF(d1):normCDF(d1)-1;
          const px=x(s),py=y(delta);
          if(s===minS)ctx.moveTo(px,py);else ctx.lineTo(px,py);
          if(Math.abs(s-K)<1)atmDelta=delta;
        }
        ctx.stroke();

        // Labels
        ctx.fillStyle='#4a5568';ctx.font='9px "DM Mono",monospace';
        ctx.textAlign='center';
        ctx.fillText('£'+minS.toFixed(0),m.l+15,H-8);
        ctx.fillText('K=£'+K,x(K),H-8);
        ctx.fillText('£'+maxS.toFixed(0),W-m.r-15,H-8);
        ctx.textAlign='right';
        if(isCall){
          ctx.fillText('1.0',m.l-5,y(1)+3);
          ctx.fillText('0.5',m.l-5,y(0.5)+3);
          ctx.fillText('0',m.l-5,y(0)+3);
        } else {
          ctx.fillText('0',m.l-5,y(0)+3);
          ctx.fillText('-0.5',m.l-5,y(-0.5)+3);
          ctx.fillText('-1.0',m.l-5,y(-1)+3);
        }

        // ATM marker
        ctx.fillStyle='#06b6d4';ctx.beginPath();
        ctx.arc(x(K),y(atmDelta),4,0,Math.PI*2);ctx.fill();

        document.getElementById('dv-info').innerHTML =
          '<div>ATM Delta: <span style="color:#06b6d4;">'+(atmDelta).toFixed(3)+'</span></div>'+
          '<div style="color:var(--muted);font-size:0.75rem;margin-top:0.5rem;">'+
          (days<30?'Near expiry: steep curve. Delta flips sharply at the strike.':
           days>180?'Long-dated: gradual curve. Even OTM options have significant delta.':
           'Medium-dated: balanced S-curve.')+'</div>';
      }

      ['dv-k'].forEach(id=>document.getElementById(id).addEventListener('input',draw));
      ['dv-vol','dv-t'].forEach(id=>document.getElementById(id).addEventListener('input',draw));
      document.getElementById('dv-type').addEventListener('change',draw);
      draw();
    }
  }
};

if(typeof window!=='undefined'){window.OPTIONS_MODULE_5=OPTIONS_MODULE_5;}
