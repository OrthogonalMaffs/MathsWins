// options-m8-strategies.js
// Module 8: Options Strategy Mathematics
// Tier: Master

const OPTIONS_MODULE_8 = {
  id: 8,
  title: 'Options Strategy Mathematics',
  tier: 'master',
  scenarioCount: 15,
  accentColor: '#06b6d4',

  tutorial: `
    <div class="tut">

      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#06b6d4;letter-spacing:0.05em;">MODULE 8: OPTIONS STRATEGY MATHEMATICS</h2>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        Now that you understand the Greeks, you can see exactly what any options strategy is doing — which Greeks it's long, which it's short, and where the profit and risk live. Every strategy is just a combination of calls, puts, and shares. The maths doesn't change; it just stacks.
      </p>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Vertical spread:</strong> Buying one option and selling another at a different strike, same expiry. Limits both risk and reward.<br>
          <strong style="color:var(--text-bright);">Straddle:</strong> Buying both a call and a put at the same strike. Profits from movement in either direction.<br>
          <strong style="color:var(--text-bright);">Iron condor:</strong> Selling an OTM put spread AND an OTM call spread. Profits if the share stays within a range. Collecting rent from both sides.<br>
          <strong style="color:var(--text-bright);">Covered call:</strong> Owning shares and selling a call against them. Generates income but caps your upside.
        </div>
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">COVERED CALL — SELLING UPSIDE FOR INCOME</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Imagine you own a rental property worth £300,000. Someone offers you £5,000 for the right to buy it from you at £320,000 within the next three months. You think prices won't rise that much, so you take the £5,000. If prices stay flat, you keep the £5,000 and the house. If prices surge to £350,000, you sell at £320,000 — profitable, but you missed out on the extra £30,000.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        That's a covered call.
      </p>

      <div class="mb">
Covered call: Own 100 shares at £100 + Sell 1 call (strike £105, premium £3)

Payoff at expiry:

  Share at £90:
    Shares lost: £10 × 100 = −£1,000
    Call expires worthless: +£300 (premium kept)
    Net: −£700 (still hurts, but £300 less than without the call)

  Share at £100:
    Shares: no change
    Call expires worthless: +£300
    Net: +£300 (pure income)

  Share at £105:
    Shares gain: £500
    Call expires worthless: +£300
    Net: +£800

  Share at £115:
    Shares gain: £1,500
    Call exercised: you sell at £105 instead of £115 = −£1,000
    Plus premium: +£300
    Net: +£800 (capped — same as at £105)

Max profit: (K − purchase price + premium) × 100 = (105 − 100 + 3) × 100 = £800
Max loss: (purchase price − premium) × 100 = (100 − 3) × 100 = £9,700 (share goes to £0)
Break-even: £100 − £3 = £97</div>

      <div class="pln">
        The covered call turns shares into an income-generating position. You collect premium every month (like rent) but cap your upside. It's the most popular options strategy because it's simple, low-risk relative to just owning shares, and produces steady income in flat or slowly rising markets. The trade-off: if the share surges, you miss the extra gains.
      </div>

      <div class="mb">
Covered call Greeks:
  Delta: +0.50 (100 shares = +1.00, short call = −0.50)
  Theta: POSITIVE (you collect time decay — the call you sold loses value daily)
  Vega: NEGATIVE (you benefit from falling IV)
  Gamma: NEGATIVE (large moves hurt you)</div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">BULL CALL SPREAD — DEFINED RISK DIRECTIONAL BET</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Think of it like a capped lottery ticket. You pay a fixed amount. If the share goes up, you win — but only up to a maximum. If it doesn't, you lose what you paid. Nothing more.
      </p>

      <div class="mb">
Bull call spread: Buy £100 call (£4) + Sell £110 call (£1.50)
Net cost: £4 − £1.50 = £2.50

At expiry:
  Share at £95:  Both expire worthless. Loss: £2.50
  Share at £100: Both expire worthless. Loss: £2.50
  Share at £102.50: Long call worth £2.50. Break-even.
  Share at £105: Long call worth £5, short worthless. Profit: £2.50
  Share at £110: Long call £10, short call £0. Profit: £7.50
  Share at £120: Long call £20, short call £10. Profit: £7.50 (capped)

Max profit: (110 − 100) − 2.50 = £7.50 (width of spread minus cost)
Max loss: £2.50 (what you paid)
Break-even: 100 + 2.50 = £102.50
Risk/reward: risk £2.50 to make £7.50 = 3:1</div>

      <div class="pln">
        The bull call spread is like buying a call but capping the upside to reduce the cost. You give up the unlimited profit of a naked call in exchange for a cheaper entry. The maximum loss is known before you enter — it's the net premium paid. This is why spreads are popular: they define your risk precisely.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">STRADDLE — BETTING ON MOVEMENT</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Imagine you know a court verdict is coming, but you don't know which way it'll go. The share will definitely move — you just don't know which direction. A straddle profits from movement itself, regardless of direction.
      </p>

      <div class="mb">
Long straddle: Buy ATM call (£4.62) + Buy ATM put (£3.38)
Strike: £100. Total cost: £8.00

At expiry:
  Share at £80:  Put worth £20. Call worthless. Profit: £20 − £8 = +£12
  Share at £92:  Put worth £8. Break-even.
  Share at £100: Both worthless. Loss: £8 (maximum loss)
  Share at £108: Call worth £8. Break-even.
  Share at £120: Call worth £20. Profit: £20 − £8 = +£12

Break-even: £92 and £108 (strike ± total premium)
The share must move MORE than £8 (8%) to profit.
Maximum loss: £8 (at exactly the strike price — no movement)</div>

      <div class="pln">
        The straddle is a pure volatility bet. You're not predicting direction — you're predicting that the share will move more than the market expects. Remember the implied move from Module 7? If the straddle costs £8 on a £100 share, the implied move is 8%. You profit only if the share moves MORE than 8% in either direction. That's why straddle buyers need to compare the implied move to their own expectation of the actual move.
      </div>

      <div class="mb">
Straddle Greeks:
  Delta: ~0 (call delta + put delta ≈ +0.50 + (−0.50) = 0)
  Gamma: HIGH positive (you benefit from large moves in either direction)
  Theta: HIGH negative (you pay heavy daily rent — both legs decay)
  Vega: HIGH positive (you benefit from IV increases)

The straddle is the purest expression of: LONG GAMMA, SHORT THETA.
You're paying daily rent for the right to profit from a big move.</div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">IRON CONDOR — SELLING A RANGE</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        The iron condor is the opposite of a straddle. Instead of betting on movement, you're betting the share stays in a range. You're selling insurance on both sides — collecting premium and hoping nothing dramatic happens.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Think of it like running a quiet hotel. Most nights, nothing happens and you collect your room fees. Occasionally there's a fire alarm at 3am and everything goes wrong. The iron condor collects steady income from quiet markets and loses when the market moves big.
      </p>

      <div class="mb">
Iron condor:
  Sell £90 put (£1.50) + Buy £85 put (£0.50)     ← put spread
  Sell £110 call (£1.50) + Buy £115 call (£0.50)  ← call spread

Net premium received: (1.50 − 0.50) + (1.50 − 0.50) = £2.00

At expiry:
  Share between £90 and £110: ALL options expire worthless.
    Profit: £2.00 (keep entire premium) ✓

  Share at £85 or below:
    Put spread max loss: £5 − £2 premium = −£3.00

  Share at £115 or above:
    Call spread max loss: £5 − £2 premium = −£3.00

Max profit: £2.00 (if share stays in the range)
Max loss: £3.00 (width of spread minus premium)
Break-evens: £88 and £112
Probability of profit: roughly 60-70% (depends on IV)</div>

      <div class="pln">
        The iron condor wins most of the time (the share stays in the range 60-70% of the time). But when it loses, it loses more than it wins. £2 profit vs £3 loss. Over many trades, this needs a win rate above 60% to be profitable. The key is choosing strikes wide enough that the share is unlikely to breach them — which Module 7's IV analysis helps you do.
      </div>

      <div class="mb">
Iron condor Greeks:
  Delta: ~0 (neutral — balanced between call and put sides)
  Gamma: NEGATIVE (large moves hurt you)
  Theta: POSITIVE (you collect daily rent from both sides)
  Vega: NEGATIVE (you benefit from falling IV)

The iron condor is: SHORT GAMMA, LONG THETA.
The exact opposite of a straddle.
You collect rent daily, but fear any big move.</div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">PROTECTIVE PUT — PORTFOLIO INSURANCE</h3>

      <div class="mb">
Protective put: Own shares + Buy put

Like car insurance: you pay a premium (the put cost)
and if the "accident" happens (share crashes), the
insurance pays out.

Own 100 shares at £100 + Buy £95 put for £2

  Share at £80: Shares lose £2,000. Put gains £1,300.
    Net loss: £700 (instead of £2,000 without the put)
  Share at £100: Put expires worthless. Cost: £200.
  Share at £120: Gain £2,000 minus £200 for put = +£1,800

Max loss: (£100 − £95 + £2) × 100 = £700 (known in advance)
Cost: £200 per quarter (if you roll the put every 3 months = £800/year)
That's 0.8% of the portfolio per year — cheap insurance.</div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">CHOOSING THE RIGHT STRATEGY</h3>

      <div class="mb">
Strategy selection based on your view:

Your view              │  Strategy               │  Greek exposure
━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━
Bullish, defined risk  │  Bull call spread        │  +Δ, limited
Bearish, defined risk  │  Bear put spread         │  −Δ, limited
Big move expected      │  Long straddle/strangle  │  +Γ, −Θ, +ν
Range-bound, quiet     │  Iron condor             │  −Γ, +Θ, −ν
Own shares, want income│  Covered call            │  +Δ reduced, +Θ
Own shares, want safety│  Protective put          │  +Δ, floor on losses
High IV, sell premium  │  Short put / iron condor │  +Θ, −ν
Low IV, buy premium    │  Long straddle / calls   │  +ν, −Θ</div>

      <div class="pln">
        Every strategy is a bet on specific Greeks. Once you see it this way, you stop memorising "strategies" and start engineering positions. Want to profit from time passing? Sell theta. Want to profit from a big move? Buy gamma. Want to profit from falling IV? Sell vega. The Greeks are the building blocks; strategies are just different arrangements of them.
      </div>

      <div class="gd">
        <strong>Coming in Module 9:</strong> Risk management — maximum loss analysis, portfolio Greeks, position sizing, and the tail risks that blow up accounts. Knowing strategies is half the battle; sizing them correctly is the other half.
      </div>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.5rem;margin-top:2rem;text-align:center;">
        <div style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.6;font-style:italic;">"This is mathematical education, not financial advice. Options trading involves significant risk of loss."</div>
      </div>
    </div>
  `,

  scenarios: [
    {id:'st01',difficulty:'basic',question:'Covered call: own shares at £100, sell £105 call for £3. Share at expiry: £102. What is your total profit?',answer:'£500 (£200 shares + £300 premium)',explanation:'Shares: +£2 × 100 = +£200. Call expires worthless (102 < 105): keep £300 premium. Total: +£500.'},
    {id:'st02',difficulty:'basic',question:'Bull call spread: buy £100 call (£4), sell £110 call (£1.50). Net cost: £2.50. Share at expiry: £107. Profit?',answer:'£4.50',explanation:'Long call payoff: max(107−100,0) = £7. Short call payoff: max(107−110,0) = £0. Net payoff: £7 − £0 = £7. Minus cost £2.50 = +£4.50.'},
    {id:'st03',difficulty:'basic',question:'Long straddle: buy £100 call (£4.62) + buy £100 put (£3.38) = £8.00 total. Share drops to £88. Profit?',answer:'+£4.00',explanation:'Call worthless. Put payoff: max(100−88,0) = £12. Minus total cost £8 = +£4.00.'},
    {id:'st04',difficulty:'basic',question:'Long straddle cost £8 on a £100 share. What are the two break-even points?',answer:'£92 and £108',explanation:'Break-evens = strike ± total premium = 100 − 8 = £92 and 100 + 8 = £108. Share must move more than 8% in either direction to profit.'},
    {id:'st05',difficulty:'basic',question:'Iron condor collects £2 premium. Width of each spread is £5. What is the maximum loss?',answer:'£3',explanation:'Max loss = width of spread − premium collected = £5 − £2 = £3. This occurs if the share moves beyond either spread\'s short strike.'},
    {id:'st06',difficulty:'intermediate',question:'You sell a covered call every month for £3 premium. Over 12 months, the share stays roughly flat. What is your annual income from the strategy?',answer:'£3,600',explanation:'12 months × £3 × 100 shares = £3,600. On a £10,000 position (100 shares at £100), that\'s a 36% annual yield from premium collection. This is why covered calls are popular in flat markets.'},
    {id:'st07',difficulty:'intermediate',question:'A straddle has positive gamma and negative theta. In practical terms, what is the daily battle?',answer:'theta erodes value daily, but a big move (gamma) can overcome the decay',explanation:'Every day, theta costs you money. But if the share makes a big move, gamma generates profit that exceeds the theta cost. The straddle buyer needs movement to arrive BEFORE theta eats the premium. It\'s a race between time decay and share movement.'},
    {id:'st08',difficulty:'intermediate',question:'Iron condor: sell £90/£85 put spread and £110/£115 call spread. Premium collected: £2.00. What is the probability of maximum profit if the share has 20% annual volatility and 30 days to expiry?',answer:'roughly 65-70%',explanation:'Max profit requires the share to stay between £90 and £110 — a ±10% range. With 20% annual vol over 30 days, one SD ≈ 20%×√(30/365) ≈ 5.7%. £90-£110 is roughly ±1.75 standard deviations, which covers about 92% of outcomes. But the break-evens are £88-£112, giving ~87%. After accounting for real-world skew, roughly 65-70% is realistic.'},
    {id:'st09',difficulty:'intermediate',question:'You have a bearish view. IV Percentile is 85% (options are expensive). Which is better: buying a put or selling a bull call spread?',answer:'selling a bull call spread (or bear call spread)',explanation:'With IV at 85th percentile, options are expensive. Buying a put means paying inflated premium. Selling a call spread benefits from high IV — you collect elevated premium that will decay as IV falls. When IV is high, favour selling strategies.'},
    {id:'st10',difficulty:'intermediate',question:'A protective put costs £200 per quarter on a £10,000 share position. What is the annualised cost as a percentage?',answer:'8%',explanation:'£200 × 4 quarters = £800/year. £800/£10,000 = 8%. That\'s the "insurance premium" for protecting your portfolio. Many investors consider 1-3% acceptable; 8% is expensive and suggests high IV or close-to-ATM strikes. Consider wider OTM puts for cheaper protection.'},
    {id:'st11',difficulty:'advanced',question:'You sell an iron condor with £2 premium and £3 max loss. Win rate historically is 70%. What is the expected value per trade?',answer:'+£0.50',explanation:'EV = P(win) × profit + P(loss) × loss = 0.70 × £2 + 0.30 × (−£3) = £1.40 − £0.90 = +£0.50 per trade. Positive EV — but only by £0.50. One bad month (a few extra losses) wipes out many months of gains. Consistency and position sizing matter enormously.'},
    {id:'st12',difficulty:'advanced',question:'A strangle is like a straddle but with OTM options (e.g., buy £95 put + buy £105 call). Why is it cheaper than a straddle?',answer:'both options are OTM, so each has less premium than ATM options',explanation:'ATM options have the highest time value. OTM options are cheaper because they\'re less likely to finish ITM. A strangle costs less but needs a bigger move to profit — the break-evens are wider apart. It\'s a cheaper bet on a bigger move.'},
    {id:'st13',difficulty:'advanced',question:'You sell a £100 put for £3 (cash-secured). What is your effective purchase price if assigned?',answer:'£97',explanation:'If the share drops below £100 and you\'re assigned, you buy at £100. But you received £3 premium, so your effective cost is £100 − £3 = £97. Selling puts is a way to buy shares at a discount — if the share drops to you, you get it cheaper than market. If it doesn\'t, you keep the premium.'},
    {id:'st14',difficulty:'advanced',question:'A calendar spread: sell a 30-day ATM call, buy a 90-day ATM call (same strike). What are you betting on?',answer:'time decay of the short-dated option + potential IV increase in the long-dated option',explanation:'The 30-day call decays faster (higher theta) than the 90-day call. If the share stays near the strike, the short call loses value faster than the long call. You profit from the differential decay rate. This is a theta trade with some vega exposure — it benefits from stable prices and rising IV.'},
    {id:'st15',difficulty:'advanced',question:'You want to be long vega (profit from IV increase) but delta-neutral and with limited theta cost. Which strategy?',answer:'calendar spread or long strangle with delta hedge',explanation:'Pure long vega with limited theta is hard — they\'re usually linked. A calendar spread gives positive vega with partially offset theta. A delta-hedged long strangle gives pure vega/gamma exposure but costs more in theta. There\'s no free lunch — you always pay for volatility exposure somewhere.'}
  ],

  tool: {
    id: 'strategy-builder',
    title: 'Strategy Builder',
    render: function(container) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.5rem;margin:1.5rem 0;">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#06b6d4;margin-bottom:0.5rem;">STRATEGY BUILDER</h3>
          <p style="font-family:'Crimson Pro',serif;font-size:0.9rem;color:var(--text);margin-bottom:1rem;">Select a pre-built strategy or customise your own. See the combined payoff diagram and Greeks.</p>
          <div style="display:grid;grid-template-columns:220px 1fr;gap:1.5rem;">
            <div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;">Strategy</label>
              <select id="sb-strat" style="width:100%;padding:0.35rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
                <option value="long_call">Long Call</option>
                <option value="long_put">Long Put</option>
                <option value="covered_call">Covered Call</option>
                <option value="protective_put">Protective Put</option>
                <option value="bull_call_spread">Bull Call Spread</option>
                <option value="bear_put_spread">Bear Put Spread</option>
                <option value="long_straddle" selected>Long Straddle</option>
                <option value="long_strangle">Long Strangle</option>
                <option value="iron_condor">Iron Condor</option>
              </select>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Share Price (£)</label>
              <input type="number" id="sb-s" value="100" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.4rem;display:block;">Volatility (%)</label>
              <input type="number" id="sb-vol" value="20" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <div id="sb-stats" style="margin-top:1rem;font-family:'DM Mono',monospace;font-size:0.8rem;color:var(--text);line-height:1.8;"></div>
            </div>
            <div>
              <canvas id="sb-canvas" width="500" height="280" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;"></canvas>
            </div>
          </div>
        </div>`;

      const strategies = {
        long_call: {name:'Long Call',legs:[{type:'call',strike:0,side:1}]},
        long_put: {name:'Long Put',legs:[{type:'put',strike:0,side:1}]},
        covered_call: {name:'Covered Call',legs:[{type:'shares',qty:100},{type:'call',strike:5,side:-1}]},
        protective_put: {name:'Protective Put',legs:[{type:'shares',qty:100},{type:'put',strike:-5,side:1}]},
        bull_call_spread: {name:'Bull Call Spread',legs:[{type:'call',strike:0,side:1},{type:'call',strike:10,side:-1}]},
        bear_put_spread: {name:'Bear Put Spread',legs:[{type:'put',strike:0,side:1},{type:'put',strike:-10,side:-1}]},
        long_straddle: {name:'Long Straddle',legs:[{type:'call',strike:0,side:1},{type:'put',strike:0,side:1}]},
        long_strangle: {name:'Long Strangle',legs:[{type:'call',strike:5,side:1},{type:'put',strike:-5,side:1}]},
        iron_condor: {name:'Iron Condor',legs:[{type:'put',strike:-10,side:-1},{type:'put',strike:-15,side:1},{type:'call',strike:10,side:-1},{type:'call',strike:15,side:1}]}
      };

      function bsPrice(S,K,T,r,vol,isCall){
        if(T<=0)return isCall?Math.max(S-K,0):Math.max(K-S,0);
        const d1=(Math.log(S/K)+(r+vol*vol/2)*T)/(vol*Math.sqrt(T));
        const d2=d1-vol*Math.sqrt(T);
        function N(x){const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const s=x<0?-1:1;x=Math.abs(x)/Math.sqrt(2);const t=1/(1+p*x);return 0.5*(1+s*(1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)));}
        if(isCall)return S*N(d1)-K*Math.exp(-r*T)*N(d2);
        return K*Math.exp(-r*T)*N(-d2)-S*N(-d1);
      }

      function draw(){
        const strat=strategies[document.getElementById('sb-strat').value];
        const S0=parseFloat(document.getElementById('sb-s').value)||100;
        const vol=parseFloat(document.getElementById('sb-vol').value)/100||0.2;
        const T=90/365;const r=0.05;

        // Calculate leg premiums
        let totalPremium=0;
        const legData=strat.legs.map(leg=>{
          if(leg.type==='shares')return{...leg,premium:0};
          const K=S0+leg.strike;
          const prem=bsPrice(S0,K,T,r,vol,leg.type==='call');
          totalPremium+=prem*leg.side;
          return{...leg,K,premium:prem};
        });

        // Calculate payoff at various prices
        const canvas=document.getElementById('sb-canvas');
        const ctx=canvas.getContext('2d');
        const W=500,H=280;
        canvas.width=W*2;canvas.height=H*2;ctx.scale(2,2);
        ctx.fillStyle='#0a0d14';ctx.fillRect(0,0,W,H);

        const m={l:45,r:15,t:15,b:30};
        const pW=W-m.l-m.r,pH=H-m.t-m.b;
        const minS=S0*0.7,maxS=S0*1.3;

        function getProfit(Sf){
          let profit=-totalPremium;
          legData.forEach(leg=>{
            if(leg.type==='shares'){profit+=(Sf-S0)*(leg.qty/100);return;}
            const payoff=leg.type==='call'?Math.max(Sf-leg.K,0):Math.max(leg.K-Sf,0);
            profit+=payoff*leg.side;
          });
          return profit;
        }

        let yMin=Infinity,yMax=-Infinity;
        for(let s=minS;s<=maxS;s+=0.5){const p=getProfit(s);if(p<yMin)yMin=p;if(p>yMax)yMax=p;}
        const yPad=Math.max(Math.abs(yMin),Math.abs(yMax))*0.15;
        yMin-=yPad;yMax+=yPad;

        function x(s){return m.l+((s-minS)/(maxS-minS))*pW;}
        function y(p){return m.t+pH-((p-yMin)/(yMax-yMin))*pH;}

        // Zero line
        ctx.strokeStyle='#1e2638';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(m.l,y(0));ctx.lineTo(W-m.r,y(0));ctx.stroke();

        // Profit/loss fill
        ctx.globalAlpha=0.1;
        ctx.beginPath();ctx.moveTo(x(minS),y(0));
        for(let s=minS;s<=maxS;s+=0.5){const p=getProfit(s);ctx.lineTo(x(s),y(Math.max(p,0)));}
        ctx.lineTo(x(maxS),y(0));ctx.closePath();ctx.fillStyle='#2dd4a0';ctx.fill();
        ctx.beginPath();ctx.moveTo(x(minS),y(0));
        for(let s=minS;s<=maxS;s+=0.5){const p=getProfit(s);ctx.lineTo(x(s),y(Math.min(p,0)));}
        ctx.lineTo(x(maxS),y(0));ctx.closePath();ctx.fillStyle='#ef5350';ctx.fill();
        ctx.globalAlpha=1;

        // Payoff line
        ctx.strokeStyle='#06b6d4';ctx.lineWidth=2.5;ctx.beginPath();
        for(let s=minS;s<=maxS;s+=0.5){const p=getProfit(s);const px=x(s),py=y(p);if(s===minS)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
        ctx.stroke();

        // Labels
        ctx.fillStyle='#4a5568';ctx.font='9px "DM Mono",monospace';
        ctx.textAlign='center';
        ctx.fillText('£'+minS.toFixed(0),m.l+15,H-8);
        ctx.fillText('S₀=£'+S0,x(S0),H-8);
        ctx.fillText('£'+maxS.toFixed(0),W-m.r-15,H-8);

        // Stats
        const maxProfit=Math.max(...Array.from({length:200},(_,i)=>getProfit(minS+i*(maxS-minS)/200)));
        const maxLoss=Math.min(...Array.from({length:200},(_,i)=>getProfit(minS+i*(maxS-minS)/200)));
        // Find break-evens
        let breakevens=[];
        for(let s=minS;s<maxS;s+=0.1){const p1=getProfit(s),p2=getProfit(s+0.1);if((p1<=0&&p2>0)||(p1>=0&&p2<0))breakevens.push(s.toFixed(1));}

        let stats='<div style="color:#06b6d4;font-size:0.95rem;margin-bottom:0.5rem;">'+strat.name+'</div>';
        stats+='<div>Net premium: '+(totalPremium>=0?'+':'')+' £'+totalPremium.toFixed(2)+'</div>';
        stats+='<div style="color:var(--green-bright);">Max profit: £'+maxProfit.toFixed(2)+'</div>';
        stats+='<div style="color:var(--red-bright);">Max loss: £'+maxLoss.toFixed(2)+'</div>';
        if(breakevens.length)stats+='<div>Break-even: £'+breakevens.join(', £')+'</div>';
        document.getElementById('sb-stats').innerHTML=stats;
      }

      document.getElementById('sb-strat').addEventListener('change',draw);
      ['sb-s','sb-vol'].forEach(id=>document.getElementById(id).addEventListener('input',draw));
      draw();
    }
  }
};

if(typeof window!=='undefined'){window.OPTIONS_MODULE_8=OPTIONS_MODULE_8;}
