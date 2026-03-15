// options-m10-case-studies.js
// Module 10: Putting It Together — Case Studies
// Tier: Master (final module)

const OPTIONS_MODULE_10 = {
  id: 10,
  title: 'Putting It Together — Case Studies',
  tier: 'master',
  scenarioCount: 10,
  accentColor: '#06b6d4',

  tutorial: `
    <div class="tut">

      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#06b6d4;letter-spacing:0.05em;">MODULE 10: CASE STUDIES</h2>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        This is the final module. Everything from Modules 1–9 comes together here. We'll walk through five real-world scenarios — the kind of situations options traders face regularly — and analyse each one using the mathematics you've learned.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        These aren't trade recommendations. They're worked examples showing how to think through options decisions with numbers, not guesswork.
      </p>

      <!-- ============================================================ -->
      <!-- CASE STUDY 1: EARNINGS PLAY -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">CASE STUDY 1: THE EARNINGS PLAY</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.5rem;">THE SITUATION</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.7;">
          A tech company reports earnings tomorrow after market close. The share is at £150. You think earnings will be strong and the share will jump. Should you buy a call option?
        </div>
      </div>

      <div class="mb">
Step 1: Check implied volatility.

  Current IV on the ATM options: 58%
  Historical IV for this share: 28%
  IV Percentile: 95% (near its yearly high)

  Options are VERY expensive right now.</div>

      <div class="mb">
Step 2: Calculate the implied move.

  ATM call (strike £150, 2 days to expiry): £6.50
  ATM put (same): £6.00
  Straddle price: £12.50

  Implied move = £12.50 / £150 = 8.3%

  The market "expects" an 8.3% move on earnings.</div>

      <div class="mb">
Step 3: Compare to historical earnings moves.

  Last 8 earnings announcements for this company:
    +5%, −3%, +7%, −2%, +4%, +6%, −4%, +3%
  
  Average absolute move: 4.3%
  Largest move: 7%

  The implied move (8.3%) is nearly DOUBLE the average
  actual move (4.3%) and higher than any recent move.</div>

      <div class="mb">
Step 4: Model the outcomes.

  Scenario A: Share rises 5% to £157.50 (typical good earnings)
    Call payoff: max(157.50 − 150, 0) = £7.50
    Cost: £6.50
    Profit: +£1.00 per share (barely profitable)

  Scenario B: Share rises 3% to £154.50 (modest beat)
    Call payoff: £4.50
    Cost: £6.50
    Profit: −£2.00 per share (LOSS despite being right on direction)

  Scenario C: Share rises 10% to £165 (blowout earnings)
    Call payoff: £15.00
    Cost: £6.50
    Profit: +£8.50 (nicely profitable — but needs 10% move)

  You need the share to move MORE than 8.3% (above £162.50)
  just to break even on the call. Historically, this company
  has never moved that much on earnings.</div>

      <div class="pln">
        <strong>The verdict:</strong> Buying a naked call before earnings is a bad mathematical bet in this scenario. IV is at the 95th percentile. The implied move is double the historical average. You need an abnormally large move just to break even. Even getting the direction right (share goes up) probably loses money because IV crush will destroy more value than the move creates.<br><br>
        <strong>Better alternatives:</strong> (1) Sell a put spread (benefit from IV crush). (2) Buy a call spread (reduces vega exposure). (3) Wait until after earnings when IV has normalised, then take a directional position.
      </div>

      <!-- ============================================================ -->
      <!-- CASE STUDY 2: THE CRASH -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">CASE STUDY 2: ANATOMY OF A CRASH — MARCH 2020</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.5rem;">THE SITUATION</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.7;">
          Between 19 February and 23 March 2020, the S&P 500 fell 34% in 23 trading days. VIX went from 14 to 82. What happened to options traders?
        </div>
      </div>

      <div class="mb">
The timeline (approximate):

  Feb 19: S&P at 3,386. VIX at 14. Everything calm.
  Feb 24: First big drop. S&P −3.4%. VIX jumps to 25.
  Feb 28: S&P −4.4% in one day. VIX at 40.
  Mar 9:  S&P −7.6%. VIX at 54.
  Mar 12: S&P −9.5%. VIX at 75.
  Mar 16: S&P −12.0%. VIX at 82 (highest since 2008).
  Mar 23: S&P bottoms at 2,237. Down 34% from peak.

  Then recovery: by August 2020, back to new highs.</div>

      <div class="mb">
What happened to the Greeks during the crash:

  DELTA: Shifted massively. Call deltas collapsed toward 0.
    Calls that were ATM became deep OTM as shares fell.
    Put deltas surged toward −1.0 as puts went deep ITM.

  GAMMA: Exploded for ATM options. The "ATM" strike kept
    shifting as the market fell. Gamma at the new ATM was
    enormous — small moves caused huge delta changes.

  THETA: Became almost irrelevant. When the share drops
    10% in a day, nobody cares about £0.05 of daily decay.
    Theta was overwhelmed by delta and vega moves.

  VEGA: The dominant Greek. VIX going from 14 to 82 meant
    a 68-point implied volatility increase. An option with
    vega of £0.30 per vol point gained £20.40 in vega alone —
    often 3-5× its original price. EVEN CALLS GAINED VALUE
    despite the market falling, because vega overwhelmed delta.

  RHO: The Fed cut rates to zero. Rho became briefly relevant
    as rates moved 1.5% in weeks. But dwarfed by other Greeks.</div>

      <div class="pln">
        The 2020 crash illustrates the most important options lesson: <strong>in a crisis, vega dominates everything.</strong> Options that were "cheap" at VIX 14 became 3-5× more expensive at VIX 82, even if their underlying share hadn't moved. Put sellers were destroyed — not just by the market falling (delta loss), but by the simultaneous IV explosion (vega loss). They were hit on both sides.
      </div>

      <div class="mb">
Who won and who lost:

  LOSERS:
    Iron condor sellers: breached on the downside + IV explosion
    Naked put sellers: massive losses from delta + vega
    Anyone short gamma: constant rebalancing at the worst prices

  WINNERS:
    Long put holders: delta gains + vega gains = enormous profits
    VIX call holders: VIX went from 14 to 82 = life-changing returns
    Protective put buyers: their "waste of money" insurance paid off

  The lesson: tail risk protection (long puts, VIX calls)
  looks expensive in calm markets. It's the cheapest thing
  you'll ever buy when you need it.</div>

      <!-- ============================================================ -->
      <!-- CASE STUDY 3: COVERED CALLS ON DIVIDEND STOCKS -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">CASE STUDY 3: COVERED CALLS ON A DIVIDEND SHARE</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.5rem;">THE SITUATION</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.7;">
          You own 500 shares of a utility company at £40 each (£20,000 position). It pays a 5% dividend yield and has low volatility (18%). You want to generate additional income. Should you write covered calls?
        </div>
      </div>

      <div class="mb">
The numbers:
  Share: £40. Volatility: 18%. Dividend yield: 5% (£2/year, quarterly £0.50)
  Monthly ATM call (strike £40): premium ≈ £0.65
  Monthly OTM call (strike £42): premium ≈ £0.20

Strategy: Sell 5 monthly ATM calls (strike £40) against 500 shares.
  Monthly income: 5 × 100 × £0.65 = £325
  Annual income: £325 × 12 = £3,900
  Plus dividends: £2 × 500 = £1,000
  Total annual income: £4,900 on £20,000 = 24.5% yield</div>

      <div class="mb">
But watch for the dividend trap:

  Ex-dividend date: share drops by roughly the dividend amount.
  If dividend is £0.50, share drops from £40 to ~£39.50.
  
  Your ATM call (strike £40) was close to the money.
  After ex-div, the share is at £39.50 — now OTM.
  Call decays faster = good for you as the seller.
  
  BUT: American-style call options can be exercised early.
  If someone exercises the night before ex-div:
    You sell shares at £40 (the strike)
    You MISS the £0.50 dividend
    You still have the call premium, but lost the dividend

  Early exercise risk is highest when:
    Call is ITM + dividend > remaining time value of the call.
    If the call has £0.30 time value and the dividend is £0.50,
    the call holder profits from early exercise (£0.50 − £0.30 = £0.20).

  Protection: sell calls with strike ABOVE current price + dividend.
  Or close the call position before ex-div date.</div>

      <div class="pln">
        Covered calls on dividend shares are a popular income strategy, but the early exercise risk around ex-dividend dates needs managing. The maths is straightforward: if the dividend exceeds the remaining time value of the call, expect early exercise. Roll or close the position before the ex-div date to keep your dividend.
      </div>

      <!-- ============================================================ -->
      <!-- CASE STUDY 4: IRON CONDOR IN LOW VOL -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">CASE STUDY 4: IRON CONDOR IN LOW VOLATILITY</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.5rem;">THE SITUATION</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.7;">
          VIX is at 12. IV Percentile on the S&P 500 is 8% (options are historically cheap). Your iron condor strategy relies on selling premium. Should you keep selling?
        </div>
      </div>

      <div class="mb">
The problem with selling premium in low IV:

  Your iron condor at VIX 12:
    Premium collected: £0.80 per contract
    Max loss: £4.20 (£5 wide spread − £0.80)
    Risk/reward: risk £4.20 to make £0.80 = 5.25:1 against you

  Same iron condor at VIX 25:
    Premium collected: £2.00
    Max loss: £3.00
    Risk/reward: 1.5:1 against you

  At low IV, you collect tiny premiums for the same risk.
  The risk/reward is terrible. You need an 84% win rate
  at VIX 12 just to break even, vs 60% at VIX 25.</div>

      <div class="mb">
The second problem: vol expansion risk.

  VIX at 12 is historically low. It's mean-reverting.
  If VIX goes from 12 to 20 (a routine normalisation):
    Your short vega position loses: vega × 8 points
    This can exceed the premium collected before
    the condor even reaches expiry.

  You're selling insurance when insurance is cheap.
  That's bad business — insurance companies raise premiums
  when risk rises, not when risk is at historic lows.</div>

      <div class="pln">
        <strong>The verdict:</strong> Reduce or stop selling premium when IV Percentile is below 20%. The risk/reward is poor, the premiums are thin, and you're exposed to vol expansion. This is the time to: (1) buy premium instead (options are cheap), (2) go delta-directional rather than theta-collecting, or (3) sit on your hands and wait for IV to rise before selling again.
      </div>

      <!-- ============================================================ -->
      <!-- CASE STUDY 5: LEAPS AS STOCK REPLACEMENT -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">CASE STUDY 5: LEAPS AS SHARE REPLACEMENT</h3>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.5rem;">THE SITUATION</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.7;">
          You want long-term exposure to a £200 share but don't want to commit £20,000 for 100 shares. Can a deep ITM LEAPS call replicate the position for less capital?
        </div>
      </div>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.5rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.7;">
          <strong style="color:var(--text-bright);">LEAPS:</strong> Long-Term Equity Anticipation Securities. Just options with expiry dates 1-3 years out. Same maths, longer timeframe.
        </div>
      </div>

      <div class="mb">
Comparison: 100 shares vs deep ITM LEAPS call

  100 shares at £200:
    Cost: £20,000
    Delta: +100 (moves £100 per £1 share move)
    No time decay (you own the shares permanently)
    Collect dividends: ~£400/year at 2% yield

  1 LEAPS call, strike £150, 18 months to expiry:
    Share: £200. Strike: £150. Intrinsic: £50.
    Option price ≈ £58 (£50 intrinsic + £8 time value)
    Cost: £5,800 (for 100-share exposure)
    Delta: ~0.85 (moves £85 per £1 share move — 85% of shares)
    Time decay: ~£0.04/day (£8 time value / ~200 trading days)
    No dividends

  Capital comparison:
    Shares: £20,000 committed
    LEAPS: £5,800 committed (71% less capital)
    The remaining £14,200 stays in your account earning interest.</div>

      <div class="mb">
Annual cost analysis:

  Shares: £20,000 invested. Dividends: +£400. Interest on £0: £0.
  Net annual cost of holding: −£400 (you EARN from dividends)

  LEAPS: £5,800 invested. Time decay: ~£8 over 18 months (£5.33/yr).
  No dividends. But £14,200 uninvested earns interest:
  £14,200 × 4% = £568/year in interest.
  Net annual cost: £5.33 − £568 = −£563 (you EARN more than shares!)

  Wait — the LEAPS is CHEAPER than owning shares?
  
  At current interest rates (4-5%), yes.
  The interest on uninvested capital exceeds the time decay
  AND the missed dividends. The LEAPS is mathematically
  superior in terms of capital efficiency.

  The catch: delta is 0.85, not 1.00.
  You participate in 85% of the move, not 100%.
  And after 18 months, you must roll to a new LEAPS (more cost).</div>

      <div class="pln">
        Deep ITM LEAPS are a capital-efficient way to get long-term share exposure. You commit far less capital, the uninvested portion earns interest, and the time decay cost is modest for deep ITM options (most of the price is intrinsic value, which doesn't decay). The trade-offs: slightly less than 100% participation, no dividends, rolling costs, and counterparty risk. For large positions where capital efficiency matters, LEAPS can be mathematically superior to owning shares outright.
      </div>

      <!-- ============================================================ -->
      <!-- COURSE CONCLUSION -->
      <!-- ============================================================ -->

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">WHAT YOU'VE LEARNED</h3>

      <div class="mb">
The complete Options Maths journey:

Module 1:  What options are — payoffs, intrinsic vs time value
Module 2:  Probability and expected value — the pricing logic
Module 3:  Binomial model — pricing from first principles
Module 4:  Black-Scholes — the formula, every component
Module 5:  Delta — sensitivity, hedge ratio, probability
Module 6:  Gamma, Theta, Vega, Rho — the full Greek toolkit
Module 7:  Implied volatility — cheap vs expensive options
Module 8:  Strategy mathematics — combining positions
Module 9:  Risk management — sizing, tail risk, Kelly
Module 10: Case studies — putting it all together

You can now:
  ✓ Price any European option using Black-Scholes
  ✓ Read and interpret all five Greeks
  ✓ Judge whether options are cheap or expensive using IV
  ✓ Construct strategies with known risk/reward profiles
  ✓ Size positions using Kelly Criterion and percentage rules
  ✓ Recognise and prepare for tail risk events
  ✓ Analyse earnings plays, crashes, and income strategies
  ✓ Understand the mathematics behind every number on
    your broker's options chain</div>

      <div class="gd">
        <strong>You now understand options mathematics better than 95% of retail traders.</strong> Not because this course taught you to trade — it didn't. It taught you the maths. The maths gives you a framework for evaluating every options decision you'll ever face. When someone pitches you a "guaranteed options strategy," you can calculate the expected value and see whether it's profitable or not. When your broker shows you the Greeks, you know what each one means and why it matters. When IV spikes before earnings, you know exactly what you're paying for and whether it's worth it.<br><br>
        The maths doesn't guarantee profits. Nothing does. But it guarantees understanding — and that's the foundation everything else is built on.
      </div>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.5rem;margin-top:2rem;text-align:center;">
        <div style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.6;font-style:italic;">
          "This is mathematical education, not financial advice. Options trading involves significant risk of loss. You can lose more than your initial investment. Past performance does not indicate future results. Consult a qualified financial adviser before trading."
        </div>
        <div style="font-family:'Outfit',sans-serif;font-size:0.85rem;color:var(--muted);margin-top:0.75rem;">
          MoneyHelper (free, government-backed): moneyhelper.org.uk<br>
          FCA Register: register.fca.org.uk
        </div>
      </div>
    </div>
  `,

  scenarios: [
    // EARNINGS PLAY (3)
    {id:'cs01',difficulty:'intermediate',question:'ATM straddle costs £10 on a £120 share. Historical average earnings move is 5%. What is the implied move, and is buying the straddle a good bet?',answer:'implied move 8.3%, probably not — historical move (5%) is well below implied (8.3%)',explanation:'Implied move = 10/120 = 8.3%. Historical average is 5%. You need 8.3% just to break even but the share typically only moves 5%. The straddle is overpriced relative to the likely move. Selling premium (short straddle or iron condor) is the better mathematical bet.'},
    {id:'cs02',difficulty:'intermediate',question:'IV Percentile is 92% and you\'re bullish. Should you buy a call or a bull call spread?',answer:'bull call spread',explanation:'IV is very high. Buying a naked call means maximum vega exposure — if IV drops (likely after whatever event inflated it), vega loss eats your profits. A bull call spread has much lower net vega because the short call offsets the long call\'s vega. You keep directional exposure while reducing vega risk.'},
    {id:'cs03',difficulty:'advanced',question:'A company reports earnings. The share moves 12% (huge beat). But IV drops from 60% to 25%. Your ATM call had delta 0.52 and vega £0.22. Share was £100. Approximate profit or loss on the call?',answer:'profit (delta gain exceeds vega loss)',explanation:'Delta gain: 0.52 × £12 = +£6.24. Vega loss: 0.22 × 35 = −£7.70. Net ≈ −£1.46. Actually a LOSS despite a 12% move! But this depends on how much gamma added to delta during the move. With gamma, the true call gain would be higher. Rough estimate: the 12% move is large enough that gamma effects push delta gains above vega losses. Marginal profit — but much less than the 12% move would suggest.'},

    // CRASH ANALYSIS (2)
    {id:'cs04',difficulty:'intermediate',question:'You sold 5 iron condors on the S&P 500 (£5 wide, £2 premium each) when VIX was 14. VIX jumps to 35. Your vega per condor is −£0.15. Approximate vega loss?',answer:'£1,575',explanation:'VIX change: +21 points. Total vega: 5 × 100 × −0.15 = −75 per vol point. Loss: 75 × 21 = £1,575 in vega alone — before any delta losses from the market falling. This exceeds the total premium collected (5 × 100 × 2 = £1,000).'},
    {id:'cs05',difficulty:'advanced',question:'On 12 March 2020, the S&P fell 9.5% in one day. Black-Scholes with 20% annual vol puts the probability of a daily move this large at essentially zero. With 80% realised vol (the actual vol during the crash), what daily SD does 9.5% represent?',answer:'about 1.9 standard deviations',explanation:'Daily SD at 80% annual vol: 80%/√252 ≈ 5.04%. A 9.5% move is 9.5/5.04 ≈ 1.9 SD. At 80% vol, this is a roughly 3% probability event — unusual but plausible. The lesson: when volatility itself changes (from 20% to 80%), events that seemed "impossible" become merely "unlikely." Models using static vol are blind to this.'},

    // COVERED CALLS (2)
    {id:'cs06',difficulty:'basic',question:'You own 200 shares at £50. You sell 2 ATM calls (strike £50) for £1.50 each. The share ends at £48. What is your total P&L?',answer:'−£100',explanation:'Shares: −£2 × 200 = −£400. Calls expire worthless, keep premium: +£1.50 × 200 = +£300. Net: −£400 + £300 = −£100. Without the covered call, you\'d be down £400. The call reduced the loss by £300.'},
    {id:'cs07',difficulty:'intermediate',question:'You sell a £52 call on a £50 share for £0.80. Ex-dividend date is tomorrow. Dividend is £0.60. Time value of the call is £0.40. Will the call be exercised early?',answer:'likely yes — dividend (£0.60) exceeds time value (£0.40)',explanation:'The call holder benefits from exercising: they capture the £0.60 dividend and only give up £0.40 of time value. Net benefit: £0.20 per share. You should close or roll the position before ex-div to avoid losing the dividend.'},

    // IRON CONDOR SIZING (1)
    {id:'cs08',difficulty:'intermediate',question:'Account: £25,000. You sell 3 iron condors (£5 wide, £1.80 premium). What is your total risk as a percentage of account?',answer:'3.84%',explanation:'Max loss per condor: (5 − 1.80) × 100 = £320. Total: 3 × £320 = £960. 960/25,000 = 3.84%. Within the 2-5% guideline. Acceptable.'},

    // LEAPS (2)
    {id:'cs09',difficulty:'intermediate',question:'A deep ITM LEAPS call has delta 0.88. The share rises £10. Approximately how much does the LEAPS gain?',answer:'£8.80',explanation:'Gain ≈ delta × move = 0.88 × £10 = £8.80 per share. You capture 88% of the move. Owning 100 shares would have gained £10 per share. The LEAPS cost perhaps 30% of the share price but captured 88% of the move — significant leverage.'},
    {id:'cs10',difficulty:'advanced',question:'LEAPS call costs £58 on a £200 share. Time value is £8. You hold for 12 months. Theta costs you ~£5.50 over that period. Meanwhile, £14,200 in uninvested capital earns 4.5% interest (£639). What is the net cost of the LEAPS position vs owning shares that pay a 2% dividend (£400)?',answer:'LEAPS is £234 cheaper per year',explanation:'Shares: cost of capital is the full £20,000 invested. Dividend income: +£400. LEAPS: theta cost −£5.50, but interest on uninvested capital +£639. Net LEAPS benefit: £639 − £5.50 = £633.50. Shares benefit: £400 (dividend). LEAPS advantage: £633.50 − £400 = £233.50 per year. The LEAPS is cheaper when interest rates are high enough that uninvested capital earns more than the dividend yield plus theta decay.'}
  ],

  tool: {
    id: 'scenario-analyser',
    title: 'Scenario Analyser',
    render: function(container) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.5rem;margin:1.5rem 0;">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#06b6d4;margin-bottom:0.5rem;">SCENARIO ANALYSER</h3>
          <p style="font-family:'Crimson Pro',serif;font-size:0.9rem;color:var(--text);margin-bottom:1rem;">Model "what if" scenarios. Enter your position and see how it performs under different price and volatility changes.</p>
          <div style="display:grid;grid-template-columns:220px 1fr;gap:1.5rem;">
            <div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;">Position Type</label>
              <select id="sa-type" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
                <option value="long_call">Long Call</option><option value="long_put">Long Put</option>
                <option value="short_call">Short Call</option><option value="short_put">Short Put</option>
                <option value="bull_spread">Bull Call Spread</option><option value="iron_condor">Iron Condor</option>
                <option value="straddle">Long Straddle</option>
              </select>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Current Share Price (£)</label>
              <input type="number" id="sa-s" value="100" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Current IV (%)</label>
              <input type="number" id="sa-iv" value="25" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Days to Expiry</label>
              <input type="number" id="sa-t" value="30" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">

              <div style="margin-top:1rem;border-top:1px solid var(--border);padding-top:0.75rem;">
                <div style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:#06b6d4;text-transform:uppercase;margin-bottom:0.3rem;">SCENARIO</div>
                <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;">Share Move (%)</label>
                <input type="range" id="sa-move" min="-30" max="30" value="5" style="width:100%;margin:0.2rem 0;">
                <div id="sa-move-d" style="font-family:'DM Mono',monospace;font-size:0.85rem;color:var(--text);text-align:center;">+5%</div>
                <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">IV Change (points)</label>
                <input type="range" id="sa-ivch" min="-20" max="30" value="0" style="width:100%;margin:0.2rem 0;">
                <div id="sa-ivch-d" style="font-family:'DM Mono',monospace;font-size:0.85rem;color:var(--text);text-align:center;">0</div>
                <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Days Passed</label>
                <input type="range" id="sa-days" min="0" max="30" value="0" style="width:100%;margin:0.2rem 0;">
                <div id="sa-days-d" style="font-family:'DM Mono',monospace;font-size:0.85rem;color:var(--text);text-align:center;">0 days</div>
              </div>
            </div>
            <div id="sa-output" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;font-family:'DM Mono',monospace;font-size:0.9rem;color:var(--text);line-height:1.8;"></div>
          </div>
        </div>`;

      function normCDF(x){const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const s=x<0?-1:1;x=Math.abs(x)/Math.sqrt(2);const t=1/(1+p*x);return 0.5*(1+s*(1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)));}
      function normPDF(x){return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);}
      function bs(S,K,T,r,v,isC){if(T<=0.001)return isC?Math.max(S-K,0):Math.max(K-S,0);const d1=(Math.log(S/K)+(r+v*v/2)*T)/(v*Math.sqrt(T)),d2=d1-v*Math.sqrt(T);return isC?S*normCDF(d1)-K*Math.exp(-r*T)*normCDF(d2):K*Math.exp(-r*T)*normCDF(-d2)-S*normCDF(-d1);}

      function calc(){
        const type=document.getElementById('sa-type').value;
        const S=parseFloat(document.getElementById('sa-s').value)||100;
        const iv=parseFloat(document.getElementById('sa-iv').value)/100||0.25;
        const daysTotal=parseFloat(document.getElementById('sa-t').value)||30;
        const movePct=parseFloat(document.getElementById('sa-move').value)/100;
        const ivChange=parseFloat(document.getElementById('sa-ivch').value)/100;
        const daysPassed=parseFloat(document.getElementById('sa-days').value);
        const r=0.05;

        document.getElementById('sa-move-d').textContent=(movePct>=0?'+':'')+(movePct*100).toFixed(0)+'%';
        document.getElementById('sa-ivch-d').textContent=(ivChange>=0?'+':'')+(ivChange*100).toFixed(0)+' pts';
        document.getElementById('sa-days-d').textContent=daysPassed+' days';

        const T0=daysTotal/365;
        const T1=Math.max((daysTotal-daysPassed)/365,0.001);
        const S1=S*(1+movePct);
        const iv1=Math.max(iv+ivChange,0.01);

        // Build position legs
        let legs=[];
        const K=S; // ATM strike
        switch(type){
          case 'long_call': legs=[{K,isC:true,side:1}];break;
          case 'long_put': legs=[{K,isC:false,side:1}];break;
          case 'short_call': legs=[{K,isC:true,side:-1}];break;
          case 'short_put': legs=[{K,isC:false,side:-1}];break;
          case 'bull_spread': legs=[{K:S,isC:true,side:1},{K:S*1.1,isC:true,side:-1}];break;
          case 'iron_condor': legs=[{K:S*0.9,isC:false,side:-1},{K:S*0.85,isC:false,side:1},{K:S*1.1,isC:true,side:-1},{K:S*1.15,isC:true,side:1}];break;
          case 'straddle': legs=[{K,isC:true,side:1},{K,isC:false,side:1}];break;
        }

        let entryValue=0,currentValue=0;
        const legDetails=legs.map(leg=>{
          const entry=bs(S,leg.K,T0,r,iv,leg.isC)*leg.side;
          const current=bs(S1,leg.K,T1,r,iv1,leg.isC)*leg.side;
          entryValue+=entry;
          currentValue+=current;
          return{...leg,entry:entry/leg.side,current:current/leg.side};
        });

        const pnl=currentValue-entryValue;
        const pnlPct=entryValue!==0?(pnl/Math.abs(entryValue)*100):0;

        let html='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;margin-bottom:1.25rem;">';
        html+='<div style="background:var(--surface);padding:0.75rem;border-radius:6px;text-align:center;"><div style="color:var(--muted);font-size:0.7rem;text-transform:uppercase;">Entry Value</div><div style="font-size:1.1rem;color:var(--text-bright);">£'+(entryValue).toFixed(2)+'</div></div>';
        html+='<div style="background:var(--surface);padding:0.75rem;border-radius:6px;text-align:center;"><div style="color:var(--muted);font-size:0.7rem;text-transform:uppercase;">Current Value</div><div style="font-size:1.1rem;color:var(--text-bright);">£'+(currentValue).toFixed(2)+'</div></div>';
        html+='<div style="background:var(--surface);padding:0.75rem;border-radius:6px;text-align:center;border-top:2px solid '+(pnl>=0?'var(--green-bright)':'var(--red-bright)')+'"><div style="color:var(--muted);font-size:0.7rem;text-transform:uppercase;">P&L</div><div style="font-size:1.1rem;color:'+(pnl>=0?'var(--green-bright)':'var(--red-bright)')+';">'+(pnl>=0?'+':'')+'£'+pnl.toFixed(2)+'</div><div style="font-size:0.8rem;color:var(--muted);">'+(pnlPct>=0?'+':'')+pnlPct.toFixed(1)+'%</div></div>';
        html+='</div>';

        // Breakdown
        html+='<div style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;margin-bottom:0.5rem;">Scenario Details</div>';
        html+='<div>Share: £'+S+' → £'+S1.toFixed(2)+' ('+(movePct>=0?'+':'')+( movePct*100).toFixed(1)+'%)</div>';
        html+='<div>IV: '+(iv*100).toFixed(0)+'% → '+(iv1*100).toFixed(0)+'%</div>';
        html+='<div>Time: '+daysTotal+' days → '+(daysTotal-daysPassed)+' days remaining</div>';

        // P&L attribution (approximate)
        const deltaApprox=currentValue-bs(S,legs[0].K,T1,r,iv1,legs[0].isC)*legs[0].side;
        html+='<div style="margin-top:1rem;padding:0.75rem;background:var(--surface);border-radius:6px;border-left:3px solid #06b6d4;">';
        html+='<span style="font-family:\'Crimson Pro\',serif;font-style:italic;font-size:0.9rem;color:var(--text);">';
        if(Math.abs(movePct)>0.15)html+='Large price move dominates this scenario. Delta and gamma are the main P&L drivers.';
        else if(Math.abs(ivChange)>0.1)html+='IV change is the dominant factor here. Vega is driving most of the P&L.';
        else if(daysPassed>daysTotal*0.5)html+='Significant time has passed. Theta decay is a major factor.';
        else html+='Moderate scenario. P&L is a blend of delta, theta, and vega effects.';
        html+='</span></div>';

        document.getElementById('sa-output').innerHTML=html;
      }

      ['sa-s','sa-iv','sa-t'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
      ['sa-move','sa-ivch','sa-days'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
      document.getElementById('sa-type').addEventListener('change',calc);
      calc();
    }
  }
};

if(typeof window!=='undefined'){window.OPTIONS_MODULE_10=OPTIONS_MODULE_10;}
