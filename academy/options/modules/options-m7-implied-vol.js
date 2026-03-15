// options-m7-implied-vol.js
// Module 7: Implied Volatility
// Tier: Advanced (final Advanced module)

const OPTIONS_MODULE_7 = {
  id: 7,
  title: 'Implied Volatility — The Market\'s Fear Gauge',
  tier: 'advanced',
  scenarioCount: 10,
  accentColor: '#06b6d4',

  tutorial: `
    <div class="tut">

      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#06b6d4;letter-spacing:0.05em;">MODULE 7: IMPLIED VOLATILITY</h2>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        This is arguably the most important module in the course. If you understand implied volatility, you understand how options are really traded. Every previous module was building to this.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        Here's the big idea in one sentence: <strong style="color:var(--text-bright);">implied volatility is the market's expectation of future movement, extracted from option prices.</strong> It tells you whether options are cheap or expensive — and that's where the edge lives.
      </p>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Implied volatility (IV):</strong> The volatility number that, when plugged into Black-Scholes, produces the option's current market price. It's "implied" by the price — reverse-engineered from it.<br>
          <strong style="color:var(--text-bright);">Historical volatility (HV):</strong> How much the share actually moved in the past. Calculated from historical price data. Backward-looking.<br>
          <strong style="color:var(--text-bright);">IV crush:</strong> A sharp drop in implied volatility after an anticipated event (earnings, election). Option prices deflate even if the share moved in your favour.<br>
          <strong style="color:var(--text-bright);">Volatility smile/skew:</strong> The pattern where IV differs across strike prices. OTM puts typically have higher IV than ATM options — the market prices in crash risk.
        </div>
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE BACKWARDS PROBLEM</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        In Module 4, we used Black-Scholes forwards: plug in five inputs (S, K, T, r, σ) → get a price. But in the real world, you already HAVE the price — it's on your broker's screen. The unknown is σ (volatility).
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Think of it like a recipe. Normally you know the ingredients and follow the recipe to get the dish. Implied volatility is like tasting a dish and working out how much chilli was used. You have the result (the option price) and you work backwards to find the missing ingredient (volatility).
      </p>

      <div class="mb">
The forward problem (Module 4):
  S=100, K=100, T=0.25, r=5%, σ=20% → C = £4.62

The backward problem (this module):
  S=100, K=100, T=0.25, r=5%, C=£6.50 → σ = ???

  What volatility makes BS produce £6.50?
  Answer: σ ≈ 28.5%

  That 28.5% IS the implied volatility.
  The market is "implying" that future volatility will be 28.5%.</div>

      <div class="pln">
        Implied volatility is NOT a prediction. It's what the market as a whole is pricing in. If IV is 28.5%, it means the collective buying and selling of options has pushed prices to a level consistent with 28.5% annual volatility. Whether that turns out to be right, too high, or too low — that's where trading opportunities exist.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHY IV MATTERS MORE THAN ANYTHING ELSE</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Think about buying a house at auction. The house might be worth £300,000 on a normal day. But if three other buyers are panicking and bidding it up to £400,000, you're overpaying — even though the house is fine.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Options work the same way. The "house" (the mathematical value) is determined by actual volatility. The "auction price" (the market price) is determined by implied volatility. When IV is high, you're paying auction prices. When IV is low, you're getting a bargain.
      </p>

      <div class="mb">
Historical volatility of Company X: 22% (what it actually does)
Current implied volatility: 35% (what the market is pricing)

The gap: 35% − 22% = 13 percentage points

This means options are EXPENSIVE relative to the share's
actual behaviour. You're paying for 35% movement when
the share typically only moves 22%.

Possible reasons:
  → Earnings announcement coming (expected big move)
  → Market-wide fear (everything is elevated)
  → Takeover rumours (uncertainty spike)

If none of these apply, the options might be overpriced.
A trader who believes actual vol will be ~22% would SELL
options at 35% IV and profit from the gap.</div>

      <div class="pln">
        This is the core of volatility trading: comparing what you think will happen (your volatility estimate) with what the market is pricing (implied volatility). If IV is higher than your estimate, options are expensive — consider selling. If IV is lower, options are cheap — consider buying. This is more important than direction. Many profitable options traders don't care whether the share goes up or down — they care whether IV is too high or too low.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE VOLATILITY SMILE AND SKEW</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        If Black-Scholes were perfectly correct, implied volatility would be the same for every strike price at the same expiry. You'd calculate IV from an ATM option, an OTM put, and a deep ITM call — and get the same number.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        In reality, you don't. And the pattern tells a story.
      </p>

      <div class="mb">
Typical equity option IV across strikes (same expiry):

Strike   │  IV    │  What it means
━━━━━━━━━┿━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━
£80 put  │  32%   │  Expensive — crash protection premium
£90 put  │  27%   │  Still elevated
£100 ATM │  22%   │  Baseline
£110 call│  20%   │  Slightly cheaper
£120 call│  19%   │  Cheapest

This pattern is called the "volatility skew."

OTM puts have HIGHER IV than ATM options because:
  → Crashes are more likely than the bell curve predicts
  → Demand for downside protection pushes put prices up
  → Market makers charge a premium for insuring against crashes

This is Black-Scholes breaking down in a known, measurable way.
The model assumes constant volatility. The market disagrees.</div>

      <div class="pln">
        The volatility skew is the market's collective memory of crashes. After 1987's Black Monday (share market fell 22% in a single day), OTM puts have been permanently expensive. Traders are willing to overpay for crash insurance because they've seen what "impossible" events look like. The skew quantifies that fear.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">IV CRUSH — THE EARNINGS TRAP</h3>

      <div class="mb">
Before earnings:
  Historical vol: 25%. Implied vol: 55%.
  The market expects a HUGE move.
  ATM call costs £8.00 (inflated by high IV).

After earnings (share rises 3%):
  Implied vol crashes from 55% to 25% ("IV crush").
  The 3% rise adds ~£3 to the option value.
  But IV crush destroys ~£5 of value (vega × 30 IV points).

  Net: option LOSES £2 despite being right on direction.

This is why "buying options before earnings" often loses money
even when you correctly predict the direction of the move.
You need the share to move MORE than the market expects
(more than the "implied move") to overcome IV crush.</div>

      <div class="mb">
The implied move — how to calculate it:

  ATM straddle price (call + put) ≈ implied move

  If ATM call = £8 and ATM put = £7:
    Straddle = £15
    Implied move ≈ £15 / share price

  If share = £200:
    Implied move = 15/200 = 7.5%

  The market "expects" a 7.5% move on earnings.
  Your option only profits if the share moves MORE than 7.5%.
  
  Historical average move on earnings: 4%.
  The market is pricing in almost double the typical move.
  Buying this straddle is a bad bet — you need an abnormally
  large move just to break even.</div>

      <div class="pln">
        The implied move calculation is one of the most practical tools in this course. Before any event, check: what move is priced in? If the implied move is 7% and you think the share will move 10%, buying options makes sense. If you think it'll move 4%, sell options instead. This single comparison drives many professional trading decisions.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">IV RANK AND IV PERCENTILE</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">IV Rank:</strong> Where current IV sits relative to its 52-week high and low. Formula: (Current IV − 52w Low) / (52w High − 52w Low). If IV Rank = 80%, current IV is near its yearly high.<br>
          <strong style="color:var(--text-bright);">IV Percentile:</strong> What percentage of days in the past year had LOWER IV than today. If IV Percentile = 90%, today's IV is higher than 90% of the past year. More robust than IV Rank because it's not skewed by one extreme spike.
        </div>
      </div>

      <div class="mb">
Example:
  52-week IV range: Low = 18%, High = 55%, Current = 42%

  IV Rank = (42 − 18) / (55 − 18) = 24/37 = 64.9%
  → Current IV is about 65% of the way from its low to its high.

  IV Percentile = 85%
  → Today's IV is higher than 85% of days in the past year.

  Both say: IV is elevated. Options are relatively expensive.
  This environment favours option SELLING strategies.

When IV Percentile > 70%: consider selling premium
When IV Percentile < 30%: consider buying premium
Between 30-70%: neutral — no strong signal</div>

      <div class="pln">
        IV Rank and IV Percentile answer a simple question: "Are options expensive or cheap right now, compared to their own history?" Not compared to other shares — compared to this share's normal behaviour. A share with 40% IV might be cheap if it normally trades at 50% IV, and expensive if it normally trades at 25%. Context matters.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">THE VIX — FEAR INDEX</h3>

      <div class="mb">
The VIX (CBOE Volatility Index):

  Calculated from S&P 500 option prices.
  Represents the market's expectation of 30-day volatility.
  Often called the "fear index."

  VIX levels and what they mean:
    12–15: Calm. Low fear. Options are cheap.
    16–20: Normal. Average conditions.
    20–25: Nervous. Uncertainty rising.
    25–35: Fearful. Significant market stress.
    35–50: Very fearful. Major events (Brexit, Covid initial shock).
    50+:   Panic. Historically rare (2008: VIX hit 80. 2020: hit 82).

  The VIX is mean-reverting:
    High VIX tends to fall back over time.
    Low VIX tends to rise eventually.
    This creates opportunities for volatility traders.</div>

      <div class="pln">
        When someone on financial news says "the VIX is elevated," they're saying options on the S&P 500 are expensive — the market is pricing in bigger moves than usual. When the VIX is very low, options are cheap and the market is complacent. Historically, buying protection (puts) when VIX is low has been a smart long-term strategy — insurance is cheapest when nobody thinks they need it.
      </div>

      <div class="gd">
        <strong>Module 7 summary:</strong> Implied volatility is the market's embedded expectation of future movement, reverse-engineered from option prices. It determines whether options are cheap or expensive. The volatility skew shows the market's crash fear. IV crush destroys option value after events. IV Rank and IV Percentile tell you the context. The VIX tracks market-wide fear.<br><br>
        <strong>Coming in Module 8:</strong> Options strategy mathematics — covered calls, vertical spreads, straddles, iron condors. Each strategy is a specific bet on the Greeks. Now that you understand all five, you can see exactly what each strategy is doing.
      </div>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.5rem;margin-top:2rem;text-align:center;">
        <div style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.6;font-style:italic;">
          "This is mathematical education, not financial advice. Options trading involves significant risk of loss."
        </div>
      </div>
    </div>
  `,

  scenarios: [
    {id:'iv01',difficulty:'basic',question:'Black-Scholes with 20% vol gives a call price of £4.62. The market price is £6.50. Is implied volatility higher or lower than 20%?',answer:'higher',explanation:'The market price (£6.50) is above the BS price at 20% vol (£4.62). Higher vol → higher BS price. So the IV that produces £6.50 must be higher than 20%. (It\'s approximately 28.5%.)'},
    {id:'iv02',difficulty:'basic',question:'A share has historical volatility of 20% and implied volatility of 35%. Are options cheap or expensive?',answer:'expensive',explanation:'IV (35%) is well above HV (20%). The market is pricing in more movement than the share typically exhibits. Options are expensive relative to actual behaviour.'},
    {id:'iv03',difficulty:'basic',question:'After earnings, implied volatility drops from 50% to 22%. A call option has vega = £0.15. Approximately how much value does IV crush destroy?',answer:'£4.20',explanation:'IV drop = 28 points. Vega × drop = 0.15 × 28 = £4.20 destroyed by IV crush alone, regardless of share direction.'},
    {id:'iv04',difficulty:'basic',question:'ATM call costs £6 and ATM put costs £5 on a £100 share. What is the implied move?',answer:'11%',explanation:'Straddle = £6 + £5 = £11. Implied move = 11/100 = 11%. The market expects the share to move about 11% by expiry.'},
    {id:'iv05',difficulty:'intermediate',question:'IV Rank: 52-week IV low = 15%, high = 45%, current = 21%. What is the IV Rank?',answer:'20%',explanation:'IV Rank = (21 − 15) / (45 − 15) = 6/30 = 20%. Current IV is near the bottom of its yearly range. Options are relatively cheap.'},
    {id:'iv06',difficulty:'intermediate',question:'An OTM put (strike 80) has IV = 30%. An ATM option (strike 100) has IV = 22%. Share is at £100. Why the difference?',answer:'volatility skew — OTM puts are expensive due to crash protection demand',explanation:'The skew exists because traders overpay for downside protection. The market prices in "fat tails" — crashes happen more often than the normal distribution predicts. OTM puts have higher IV because they\'re insurance against extreme events.'},
    {id:'iv07',difficulty:'intermediate',question:'You want to buy a call before a product launch. IV Percentile is 92%. Should you buy options or consider another approach?',answer:'reconsider — IV is very elevated, options are expensive',explanation:'IV Percentile 92% means options are more expensive than 92% of the past year. Buying now means paying a steep premium. If the launch doesn\'t produce a bigger move than expected, IV crush will eat your profits. Consider: selling premium, using a vertical spread to reduce vega exposure, or waiting for IV to settle.'},
    {id:'iv08',difficulty:'intermediate',question:'VIX is at 14. Your portfolio uses long puts as protection. Is this a good time to buy more puts?',answer:'yes — protection is cheap when VIX is low',explanation:'VIX 14 is historically low. Options are cheap. This is the optimal time to buy insurance. Most people buy protection AFTER crashes (when VIX is 40+ and puts are expensive). Buying when VIX is low is like buying home insurance on a sunny day — cheapest when nobody thinks they need it.'},
    {id:'iv09',difficulty:'advanced',question:'A stock has IV of 25%. You believe actual volatility will be 35% over the next month. How would you structure a trade to profit from this view?',answer:'buy options (long volatility) — buy a straddle or strangle',explanation:'If you think actual vol (35%) will exceed implied vol (25%), you want to be long volatility. Buy a straddle: long ATM call + long ATM put. You profit if the share moves more than the straddle price (the implied move). You\'re betting the market is underestimating future movement.'},
    {id:'iv10',difficulty:'advanced',question:'Earnings tomorrow. IV = 55%. Historical average earnings move = 5%. Implied move from the straddle = 8%. The share moves 6% after earnings. You bought the ATM straddle. Do you profit?',answer:'probably not — the move (6%) is less than the implied move (8%)',explanation:'You needed 8%+ to profit. The share moved 6%. Despite the move being larger than historical average (5%), it was less than what was priced in (8%). IV crush from 55% back to ~25% destroys more value than the 6% move creates. This is the earnings trap — being "right" on direction but wrong on magnitude.'}
  ],

  tool: {
    id: 'iv-calculator',
    title: 'Implied Volatility Calculator',
    render: function(container) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.5rem;margin:1.5rem 0;">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#06b6d4;margin-bottom:0.5rem;">IMPLIED VOLATILITY CALCULATOR</h3>
          <p style="font-family:'Crimson Pro',serif;font-size:0.9rem;color:var(--text);margin-bottom:1rem;">Enter the market price of an option and the other four inputs. The calculator finds the implied volatility.</p>
          <div style="display:grid;grid-template-columns:200px 1fr;gap:1.5rem;">
            <div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;">Type</label>
              <select id="ivc-type" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
                <option value="call">Call</option><option value="put">Put</option>
              </select>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Market Price (£)</label>
              <input type="number" id="ivc-mp" value="6.50" step="0.1" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Share Price (£)</label>
              <input type="number" id="ivc-s" value="100" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Strike (£)</label>
              <input type="number" id="ivc-k" value="100" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Days to Expiry</label>
              <input type="number" id="ivc-t" value="90" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Risk-Free Rate (%)</label>
              <input type="number" id="ivc-r" value="5" step="0.25" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <button id="ivc-calc" style="width:100%;margin-top:0.75rem;padding:0.5rem;background:#06b6d4;color:var(--bg);border:none;border-radius:6px;font-family:'Outfit',sans-serif;font-weight:600;cursor:pointer;">Find IV</button>
            </div>
            <div id="ivc-output" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;font-family:'DM Mono',monospace;font-size:0.9rem;color:var(--text);line-height:2;"></div>
          </div>
        </div>`;

      function normCDF(x){const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const s=x<0?-1:1;x=Math.abs(x)/Math.sqrt(2);const t=1/(1+p*x);return 0.5*(1+s*(1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)));}
      function normPDF(x){return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);}

      function bsPrice(S,K,T,r,vol,isCall){
        const d1=(Math.log(S/K)+(r+vol*vol/2)*T)/(vol*Math.sqrt(T));
        const d2=d1-vol*Math.sqrt(T);
        if(isCall) return S*normCDF(d1)-K*Math.exp(-r*T)*normCDF(d2);
        return K*Math.exp(-r*T)*normCDF(-d2)-S*normCDF(-d1);
      }

      function bsVega(S,K,T,r,vol){
        const d1=(Math.log(S/K)+(r+vol*vol/2)*T)/(vol*Math.sqrt(T));
        return S*Math.sqrt(T)*normPDF(d1);
      }

      document.getElementById('ivc-calc').addEventListener('click',function(){
        const isCall=document.getElementById('ivc-type').value==='call';
        const mp=parseFloat(document.getElementById('ivc-mp').value);
        const S=parseFloat(document.getElementById('ivc-s').value);
        const K=parseFloat(document.getElementById('ivc-k').value);
        const T=parseFloat(document.getElementById('ivc-t').value)/365;
        const r=parseFloat(document.getElementById('ivc-r').value)/100;

        // Newton-Raphson to find IV
        let vol=0.25; // initial guess
        let iterations=0;
        const maxIter=100;
        const tol=0.0001;

        for(let i=0;i<maxIter;i++){
          const price=bsPrice(S,K,T,r,vol,isCall);
          const vega=bsVega(S,K,T,r,vol);
          const diff=price-mp;
          if(Math.abs(diff)<tol){iterations=i+1;break;}
          if(vega<0.0001){vol+=0.01;continue;}
          vol=vol-diff/vega;
          if(vol<0.001)vol=0.001;
          if(vol>5)vol=5;
          iterations=i+1;
        }

        const ivPct=(vol*100).toFixed(2);
        const bsP=bsPrice(S,K,T,r,vol,isCall);

        let html='<div style="color:#06b6d4;font-size:1.8rem;margin-bottom:0.5rem;">IV = '+ivPct+'%</div>';
        html+='<div style="color:var(--muted);font-size:0.8rem;margin-bottom:1rem;">Converged in '+iterations+' iterations</div>';
        html+='<div>Market price: £'+mp.toFixed(2)+'</div>';
        html+='<div>BS price at IV: £'+bsP.toFixed(4)+'</div>';

        // Context
        html+='<div style="margin-top:1rem;padding:0.75rem;background:var(--surface);border-radius:6px;border-left:3px solid #06b6d4;">';
        html+='<span style="font-family:\'Crimson Pro\',serif;font-style:italic;font-size:0.9rem;color:var(--text);">';
        if(vol<0.15) html+='Low IV. Options are relatively cheap. This environment may favour buying premium.';
        else if(vol<0.25) html+='Moderate IV. Normal conditions. No strong signal either way.';
        else if(vol<0.40) html+='Elevated IV. Options are getting expensive. Consider whether the premium is justified by upcoming events.';
        else html+='Very high IV. Options are expensive. Significant event expected or market under stress. Selling premium can be profitable but risky.';
        html+='</span></div>';

        // Implied move
        const impliedMove=vol*Math.sqrt(T)*100;
        html+='<div style="margin-top:0.75rem;">Implied annual move: ±'+ivPct+'%</div>';
        html+='<div>Implied move over this period: ±'+(impliedMove).toFixed(1)+'%</div>';
        html+='<div style="color:var(--muted);font-size:0.8rem;">(68% probability the share stays within ±'+(impliedMove).toFixed(1)+'% by expiry)</div>';

        document.getElementById('ivc-output').innerHTML=html;
      });

      document.getElementById('ivc-calc').click();
    }
  }
};

if(typeof window!=='undefined'){window.OPTIONS_MODULE_7=OPTIONS_MODULE_7;}
