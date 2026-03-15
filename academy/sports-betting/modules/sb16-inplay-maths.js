// sb16-inplay-maths.js
// Module 16: In-Play Mathematics & Live Betting Traps
// Sports Betting Maths — MathsWins Academy
// Tier: Master

const MODULE_16 = {
  id: 16,
  title: 'In-Play Mathematics & Live Betting Traps',
  tier: 'master',
  accent: '#2563eb',

  tutorial: `
    <div class="tut">
      <h2>Module 16: In-Play Mathematics & Live Betting Traps</h2>

      <div class="pt" style="border-left-color:#ef5350; background:rgba(239,83,80,0.08);">
        In-play betting is the fastest-growing segment of the betting industry — and the segment where the bookmaker's mathematical advantage is largest. You are betting against algorithms that reprice faster than you can think. This module teaches you the maths behind those algorithms, so you understand exactly what you're up against.
      </div>

      <h3>How In-Play Odds Are Calculated</h3>

      <p>Pre-match odds are set by traders with time to analyse. In-play odds are set by mathematical models that update every few seconds based on three inputs: the current score, the time elapsed, and the pre-match expected goal rates.</p>

      <p>The core model is a time-adjusted Poisson process — the same Dixon-Coles framework from Module 11, but recalculated for the remaining match time.</p>

      <div class="mb">
Pre-match: Arsenal vs Crystal Palace
  λ_home = 1.80 goals/90 min
  λ_away = 0.90 goals/90 min

Pre-match probabilities:
  Arsenal win: 58.5%  |  Draw: 23.2%  |  Palace win: 18.3%

10 minutes played, still 0-0:
  Remaining: 80/90 = 88.9% of match
  λ_home_remaining = 1.80 × 0.889 = 1.60
  λ_away_remaining = 0.90 × 0.889 = 0.80

  Updated: Arsenal win ~56%  |  Draw ~27%  |  Palace ~17%
  (Arsenal's price drifts slightly — less time to score)

35 minutes played, Arsenal 1-0 up:
  Remaining: 55/90 = 61.1%
  λ_home_remaining = 1.80 × 0.611 = 1.10
  λ_away_remaining = 0.90 × 0.611 = 0.55

  Palace need to score at least 1 in remaining time:
  P(Palace score 0) = e^(-0.55) = 0.577

  Arsenal win probability jumps to ~78%
  New odds: ~1.28

  The model repriced instantly. By the time you see
  these odds and click "bet", it may have updated again.
      </div>

      <div class="pln">
        In-play odds aren't guesses — they're calculated by algorithms using the same Poisson mathematics you learned in Module 11, adjusted for the time remaining and the current score. The model knows the maths. The question is whether you know something the model doesn't.
      </div>

      <h3>The Suspension Trap</h3>

      <p>Bookmakers suspend betting during corners, free kicks near the box, penalties, and any moment where a goal is imminent. This isn't a technical glitch — it's a mathematical necessity.</p>

      <div class="mb">
Why bookmakers suspend at key moments:

A penalty is awarded.
  P(goal from penalty) ≈ 76%

Pre-penalty odds: Arsenal to score next @ 1.55
True price during penalty: ~1.10

If the bookmaker doesn't suspend:
  A bettor backing "Arsenal next goal" at 1.55
  has an edge of:
  (0.76 × 1.55) - 1 = 0.178 = +17.8%

  That's a guaranteed profit opportunity.
  The bookmaker MUST suspend to prevent this.

A corner kick:
  P(goal from corner) ≈ 3.5%
  Much smaller edge, but over thousands of corners,
  systematic exploitation is profitable.

  This is why exchange in-play markets are more
  efficient — they don't suspend (traders adjust
  prices themselves in real time).
      </div>

      <div class="pln">
        Every time you see "suspended" during a match, the bookmaker is admitting their model can't keep up with what's happening on the pitch. When betting resumes, the new prices have already absorbed the information. The window of opportunity exists for milliseconds, not minutes.
      </div>

      <h3>The Increased In-Play Overround</h3>

      <p>This is the number most punters don't know about.</p>

      <div class="mb">
Typical overround comparison:

Pre-match 1X2 market:      3-5%
In-play 1X2 market:        6-12%
In-play next goal market:   8-15%
In-play correct score:      20-40%

Why is in-play overround higher?

1. Pricing uncertainty — the model needs a larger
   margin to compensate for rapid state changes

2. Suspension risk — the bookmaker prices in the
   cost of being wrong during unsuspended moments

3. Less price-sensitive customers — in-play bettors
   are watching the match, betting emotionally,
   reacting to what they've just seen

4. Information asymmetry — someone watching the match
   may see a tactical change before the model adapts

At 10% in-play overround vs 4% pre-match:
  Per £100 wagered: £10 expected loss vs £4
  You lose 2.5× faster betting in-play.

Over a season (40 weekends, £50/weekend in-play):
  In-play: 40 × £50 × 10% = £200 expected loss
  Pre-match: 40 × £50 × 4% = £80 expected loss
  Cost of in-play convenience: £120/year
      </div>

      <div class="dg">
        The bookmaker charges you double the margin for in-play bets compared to pre-match. Every in-play bet you place costs roughly twice as much in expected value as the same bet would have cost before kick-off. The maths is unambiguous: if you can identify value pre-match, bet pre-match.
      </div>

      <h3>Cash-Out: The Hidden Margin</h3>

      <p>Cash-out is the bookmaker's most profitable feature. It looks like a service — "secure your profit!" — but the maths tells a different story.</p>

      <div class="mb">
You backed Arsenal to win the league at 10.00, £20 stake.
They're now 2nd with 5 games to play. Current odds: 3.50.

Your bet's current mathematical value:
  You'd win £200 if Arsenal win the league.
  P(Arsenal win) = 1/3.50 = 28.6%
  EV = 0.286 × £200 = £57.14

What the bookmaker offers as cash-out: £42.00

The gap:
  True value: £57.14
  Cash-out offer: £42.00
  Bookmaker's margin: (57.14 - 42) / 57.14 = 26.5%

You're paying 26.5% to cash out.

Alternative: lay Arsenal to win the league on Betfair
  Lay at 3.60 (slightly worse than back price — normal)
  Lay stake to guarantee equal profit:
  = (£20 × 10.00) / 3.60 = £55.56

  If Arsenal win: £200 - (£55.56 × 2.60) = £200 - £144.44 = +£55.56
  If Arsenal don't: -£20 + £55.56 = +£35.56

  Average: ~£45.56

  Exchange approach: ~£45.56
  Cash-out offer: £42.00
  Even the exchange (with its own spread) beats cash-out.
      </div>

      <div class="pln">
        Cash-out is the bookmaker buying back your bet at a discount. A 26.5% discount, in this example. They're offering you £42 for something worth £57. If you want to lock in profit, lay on an exchange — the maths is better every time.
      </div>

      <h3>When In-Play Betting Makes Mathematical Sense</h3>

      <p>There are narrow conditions where in-play has a genuine mathematical case:</p>

      <div class="gd">
        <strong>1. You have information the model doesn't.</strong> You're watching the match and notice a tactical substitution that changes the game — the model won't adapt until the on-pitch data shows the effect. This window lasts minutes, not the full half.<br><br>
        <strong>2. You're trading on an exchange.</strong> Backing pre-match and laying in-play to lock in profit when odds move in your favour. This isn't gambling — it's arbitrage.<br><br>
        <strong>3. The overround has temporarily collapsed.</strong> Occasionally, in-play markets become efficient (especially on exchanges during major matches). If you can find a price that genuinely exceeds your model's fair odds by more than the overround, that's a legitimate value bet.<br><br>
        <strong>4. You're closing a losing position.</strong> If a pre-match bet has gone wrong and the in-play odds represent a better exit than letting it ride, cashing out (or laying on exchange) can be the mathematically correct decision — but only if you use the exchange, not the bookmaker's cash-out button.
      </div>

      <h3>The Psychology of Live Betting — Why It's Designed to Make You Bet Badly</h3>

      <p>In-play betting is engineered to exploit emotional decision-making. The match is happening NOW. You've just seen a team hit the crossbar. The odds flash on screen. Your brain screams "they're about to score!" The maths says: that near-miss doesn't change the probability of a goal in the next passage of play.</p>

      <div class="mb">
The "momentum" fallacy in numbers:

Team A has had 70% possession in the last 10 minutes.
  Does this increase their probability of scoring?

The data (from 50,000+ Premier League passages of play):
  Possession in previous 10 min → goals in next 10 min
  correlation coefficient: r ≈ 0.08

  That's barely above zero. Possession dominance
  is a very weak predictor of imminent goals.

Shot frequency is slightly better:
  Shots in last 10 min → goals in next 10 min
  r ≈ 0.15

  Still weak. The bookmaker's Poisson model already
  accounts for the average shot rate. A 10-minute
  burst of pressure doesn't reliably predict goals
  any better than the season-long average does.

What you FEEL: "They're all over them, a goal is coming"
What the MATHS says: r = 0.08-0.15 (negligible signal)
      </div>

      <div class="pln">
        Your brain is a pattern-matching machine. It sees momentum, narrative, and pressure. The data shows that short-term match patterns are very weak predictors of goals. The bookmaker knows this. Their model uses season-long averages, not the last 10 minutes of a single match. You're betting on emotion; they're betting on maths.
      </div>

      <h3>The Speed Disadvantage — Quantified</h3>

      <div class="mb">
Time from event to odds update:

Bookmaker algorithm: 0.5-2 seconds
Exchange market makers: 1-5 seconds
You (watching TV + opening app + selecting market): 15-45 seconds

By the time you place an in-play bet:
  The odds have already adjusted 10-20 times.
  The value window (if it existed) closed 30 seconds ago.
  You are betting at the NEW price, not the OLD price
  that looked like value when you first saw it.

The only people who consistently profit from in-play:
  - Algorithmic traders with direct API access (~100ms latency)
  - Court-siders at tennis matches (seeing points before TV)
  - People at grounds betting before the broadcast delay

None of these are available to a normal punter watching Sky Sports
with a betting app on their phone. The information advantage
doesn't exist for retail bettors in-play.
      </div>

      <div class="pt">
        The mathematical reality of in-play betting for retail punters: higher overround, slower execution, emotional decision-making, and algorithmic opponents. The expected value is negative by a wider margin than pre-match betting. Use in-play for exchange trading and position management — not for new speculative bets.
      </div>

      <p style="margin-top:1.5rem;padding:1rem;background:rgba(37,99,235,0.08);border-left:3px solid #2563eb;border-radius:0 6px 6px 0;">
        <strong style="color:#2563eb;">This completes Sports Betting Maths.</strong> Across 16 modules, you've learned: how odds work, implied probability, bookmaker overround, value identification, accumulator traps, market analysis, bankroll management, Asian handicaps, conditional probability, Poisson/Dixon-Coles modelling, common mistakes, discipline and selectivity, free bet extraction, exchange mathematics, and in-play pricing. The maths is always against you — but understanding it is the first step to losing less, and the rare step toward finding genuine value.
      </p>

      <div class="dg" style="margin-top:1rem;">
        <strong>National Gambling Helpline:</strong> 0808 8020 133 (free, 24/7)<br>
        <strong>GamCare:</strong> www.gamcare.org.uk<br>
        <strong>BeGambleAware:</strong> www.begambleaware.org<br><br>
        This is mathematical education, not betting advice. If you or someone you know is affected by problem gambling, please reach out to the services above.
      </div>
    </div>
  `,

  scenarios: [
    // --- In-Play Repricing (5) ---
    {
      id: 'ip1',
      type: 'calculation',
      question: 'Arsenal vs Crystal Palace. Pre-match: λ_home = 1.80, λ_away = 0.90. It\'s 0-0 at 60 minutes. What is Arsenal\'s updated win probability using time-adjusted Poisson?',
      hint: 'Remaining time = 30/90 = 0.333. Adjust both λ values proportionally.',
      answer: 'λ_home_remaining = 1.80 × 0.333 = 0.60, λ_away_remaining = 0.90 × 0.333 = 0.30. P(Home ≥1, Away = 0) + P(Home ≥ Away, Home ≥1) using Poisson. P(0-0 remaining) = e^(-0.60) × e^(-0.30) = 0.549 × 0.741 = 0.407. This is the draw probability. Arsenal win ≈ 38.5%, Draw ≈ 40.7%, Palace ≈ 20.8%. At 0-0 after 60 minutes, the draw has become the most likely outcome.',
      difficulty: 'intermediate',
      edge: null
    },
    {
      id: 'ip2',
      type: 'calculation',
      question: 'Same match. Arsenal score to make it 1-0 at 70 minutes. 20 minutes remain. λ_away_remaining = 0.90 × (20/90) = 0.20. What is the probability Palace equalise?',
      hint: 'P(Palace score ≥1 in 20 min) = 1 - P(Palace score 0) = 1 - e^(-0.20)',
      answer: 'P(Palace score ≥1) = 1 - e^(-0.20) = 1 - 0.819 = 0.181 (18.1%). P(Palace don\'t score) = 81.9%. Arsenal win probability ≈ 82% + some additional probability from scoring again. Approximately 85-87% win probability. Fair odds: ~1.16. If a bookmaker offers Arsenal at 1.25 in-play, the implied probability is 80% — potentially slight value, but the in-play overround likely absorbs it.',
      difficulty: 'intermediate',
      edge: null
    },
    {
      id: 'ip3',
      type: 'calculation',
      question: 'Liverpool vs Everton. Pre-match λ_home = 2.10, λ_away = 0.80. Everton score first — it\'s 0-1 at 25 minutes. 65 minutes remain. Calculate Liverpool\'s win probability.',
      hint: 'Liverpool need ≥2 goals AND Everton score ≤ (Liverpool goals - 1) from this point.',
      answer: 'λ_home_rem = 2.10 × (65/90) = 1.517, λ_away_rem = 0.80 × (65/90) = 0.578. Liverpool need to score ≥2 more than Everton score from here. This requires building the full score matrix for remaining time. P(Liverpool win from 0-1) ≈ 42-45%. P(Draw) ≈ 22-25%. P(Everton win) ≈ 33-35%. The underdog scoring first dramatically shifts the probabilities but doesn\'t make them favourites — Liverpool\'s higher xG and 65 minutes remaining is substantial.',
      difficulty: 'advanced',
      edge: null
    },
    {
      id: 'ip4',
      type: 'calculation',
      question: 'A match has expected total goals of 2.80 pre-match. At half-time it\'s 0-0. What are the updated Over/Under 2.5 probabilities for the second half only?',
      hint: 'Second half λ_total = 2.80 × 0.5 = 1.40. Need ≥3 goals in 45 min from 0-0.',
      answer: 'λ_total_2nd_half = 1.40 (assuming equal distribution). P(≤2 goals in 2nd half) = P(0) + P(1) + P(2) = e^(-1.40) × [1 + 1.40 + 1.40²/2] = 0.247 × [1 + 1.40 + 0.98] = 0.247 × 3.38 = 0.834 (83.4%). P(Over 2.5 total from 0-0 at HT) = 1 - 0.834 = 16.6%. Fair odds on Over 2.5: ~6.00. If a bookmaker offers 4.50, that\'s negative EV. The 0-0 at half-time has made the Over very unlikely.',
      difficulty: 'intermediate',
      edge: null
    },
    {
      id: 'ip5',
      type: 'judgement',
      question: 'It\'s 75 minutes, 1-1. The home team is dominating — 72% possession in the last 15 minutes, 5 shots to 0. The in-play odds show Home Win at 2.40. Is this likely to be value?',
      answer: 'Almost certainly not. Short-term possession and shot dominance (r ≈ 0.08-0.15 correlation with goals) is a very weak predictor. The bookmaker\'s model uses season-long xG rates, not 15-minute momentum. With only 15 minutes remaining and the score level, fair Home Win probability is approximately 30-35% (fair odds ~2.85-3.30). At 2.40 (implied 41.7%), you\'re likely OVERPAYING for the home win, not getting value. The emotional reaction to "momentum" is exactly what the bookmaker profits from.',
      difficulty: 'advanced',
      edge: null
    },

    // --- Cash-Out Evaluation (4) ---
    {
      id: 'co1',
      type: 'calculation',
      question: 'You backed Over 2.5 goals at 2.10, £15 stake. It\'s 2-0 at 55 minutes (35 min remaining, combined λ_remaining ≈ 0.95). The bookmaker offers £19.50 cash-out. What is the bet\'s true mathematical value?',
      hint: 'You need to calculate P(≥1 more goal in 35 min) for the Over to win, plus value of current state.',
      answer: 'P(0 more goals) = e^(-0.95) = 0.387. P(Over 2.5 wins) = 1 - 0.387 = 0.613 (61.3%). If Over wins: you receive £15 × 2.10 = £31.50. EV = 0.613 × £31.50 = £19.30. True value ≈ £19.30. Cash-out offer: £19.50. This is actually a FAIR cash-out — the bookmaker is offering slightly above mathematical value. Unusual. Take it if you want certainty, but the EV of holding is approximately equal.',
      difficulty: 'intermediate',
      edge: 'Fair — approximately equal to holding'
    },
    {
      id: 'co2',
      type: 'calculation',
      question: 'You backed Man City to win the league at 5.00, £50 stake (potential return £250). They\'re top with 8 games left, current odds 1.60. Bookmaker cash-out: £120. Calculate the true value and the cash-out margin.',
      hint: 'True value = P(winning) × return. P(winning) ≈ 1/current odds.',
      answer: 'P(City win league) = 1/1.60 = 62.5%. True value = 0.625 × £250 = £156.25. Cash-out offer: £120. Margin: (156.25 - 120) / 156.25 = 23.2%. The bookmaker is taking 23.2% of your bet\'s value. If you want to lock in profit, lay on Betfair at ~1.65. Lay stake = (50 × 5.00) / 1.65 = £151.52. Guaranteed profit ≈ £98.48 (if City win) to £101.52 (if they don\'t). Both better than £120 cash-out minus the £50 original stake = £70 profit via cash-out.',
      difficulty: 'advanced',
      edge: 'Cash-out margin: 23.2%. Use exchange instead.'
    },
    {
      id: 'co3',
      type: 'calculation',
      question: 'You have a 4-fold accumulator. Three legs have won. The final leg is Arsenal -1 Asian Handicap at 2.00. Arsenal are winning 1-0 at 80 minutes. Acca return if it wins: £160. Cash-out offered: £95. Should you cash out?',
      hint: 'The AH -1 needs Arsenal to win by 2+ (win) or exactly 1 (void/push). Calculate probabilities for remaining 10 minutes.',
      answer: 'With 10 minutes remaining at 1-0, λ_remaining is tiny for both teams. P(Arsenal score in 10 min) ≈ 1 - e^(-0.20) = 18.1%. P(Palace score) ≈ 1 - e^(-0.10) = 9.5%. P(AH -1 wins — Arsenal win by 2+) ≈ 18.1% × 90.5% = 16.4%. P(AH -1 void — stays 1-0) ≈ 81.9% × 90.5% = 74.1%. P(AH -1 loses) ≈ 9.5%. EV of holding: (0.164 × £160) + (0.741 × acca_stake_returned) + (0.095 × £0). If your acca stake was £10: EV ≈ £26.24 + £7.41 + £0 = £33.65. Cash-out £95 is far better than EV of £33.65. TAKE THE CASH-OUT. This is one of the rare cases where cash-out is mathematically correct — because the void outcome returns your original stake, not the accumulated value.',
      difficulty: 'advanced',
      edge: 'Cash-out is correct here (unusual)'
    },
    {
      id: 'co4',
      type: 'judgement',
      question: 'A bookmaker offers "partial cash-out" — you can cash out 50% of your bet and let 50% ride. When does this make mathematical sense compared to full cash-out or holding?',
      answer: 'Partial cash-out applies the same margin as full cash-out (typically 15-30%) to the cashed-out portion. Mathematically, it\'s never better than using an exchange to hedge. However, if you DON\'T have exchange access, partial cash-out can make sense when: (a) the bet has positive EV remaining but you want to reduce variance, or (b) you\'ve identified that the cash-out margin is unusually low (under 10%). In most cases, the margin makes partial cash-out -EV. The bookmaker designed it to make you feel like you\'re being smart while they take their cut on half your bet.',
      difficulty: 'intermediate',
      edge: null
    },

    // --- Suspension Analysis (3) ---
    {
      id: 'su1',
      type: 'judgement',
      question: 'A Premier League match is in-play. You notice the betting market suspends for 8 seconds during a corner, then reopens with the match result odds unchanged. What does this tell you?',
      answer: 'It tells you the corner didn\'t result in a goal or a clear chance that would shift the odds. The suspension is precautionary — the bookmaker suspends for ALL corners because some lead to goals. When the market reopens at the same price, the algorithm determined that the match state hasn\'t changed. P(goal from corner) ≈ 3.5%, so 96.5% of the time, this is exactly what happens. The suspension itself contains no useful information for your betting.',
      difficulty: 'basic',
      edge: null
    },
    {
      id: 'su2',
      type: 'judgement',
      question: 'The market suspends and reopens 30 seconds later with significantly different odds — Home Win shortened from 2.50 to 1.80, Away Win drifted from 3.00 to 4.50. No goal has been scored according to the live commentary. What happened?',
      answer: 'Most likely a red card for the away team. A sending-off dramatically changes the expected goal rates: the 10-man team\'s λ drops by approximately 25-35%, while the 11-man team\'s λ increases by approximately 10-15%. The model reprices instantly. Other possibilities: a penalty awarded (but not yet taken), a serious injury to a key player, or a tactical substitution the model weights heavily. The key point: the market has already absorbed this information. There is no value in betting AFTER the reopening — the new prices reflect the new reality.',
      difficulty: 'intermediate',
      edge: null
    },
    {
      id: 'su3',
      type: 'judgement',
      question: 'You\'re watching a match on a stream with a 30-second delay. You see a goal scored. Can you profit by immediately placing an in-play bet before the bookmaker suspends?',
      answer: 'No — and this is a common misconception. The bookmaker\'s data feed is faster than any TV broadcast. They receive match data via low-latency feeds (often from scouts at the ground) with delays of 1-3 seconds. Your stream is 15-60 seconds behind. By the time you see the goal, the bookmaker suspended the market 30+ seconds ago, adjusted the prices, and reopened. You would be betting at the POST-goal price, not the pre-goal price. This is also why "court-siding" at tennis matches is banned — being physically present gives a genuine information advantage over the broadcast delay.',
      difficulty: 'basic',
      edge: null
    },

    // --- In-Play vs Pre-Match Comparison (3) ---
    {
      id: 'ip6',
      type: 'calculation',
      question: 'A bookmaker offers Over 2.5 goals at 1.95 pre-match (overround ~4%). The same market in-play at 0-0, 20 minutes shows Over 2.5 at 1.80 (λ_remaining adjusted). If the fair price adjusted for time should be ~1.90, what is the effective in-play overround?',
      hint: 'Implied probability at 1.80 = 55.6%. Fair probability at 1.90 = 52.6%.',
      answer: 'Pre-match: odds 1.95, fair ~2.03, implied 51.3% vs fair 49.3% → overround ≈ 4%. In-play: odds 1.80, fair ~1.90, implied 55.6% vs fair 52.6% → overround = (55.6 - 52.6) / 52.6 = 5.7%. The in-play overround is 5.7% vs 4.0% pre-match — 43% higher. On a £20 bet: pre-match expected loss = £0.80, in-play expected loss = £1.14. The same bet costs 43% more in-play.',
      difficulty: 'intermediate',
      edge: 'Pre-match is 43% better value'
    },
    {
      id: 'ip7',
      type: 'judgement',
      question: 'You identify a value bet pre-match: Team A to win at 3.20, your model says fair odds are 2.80 (edge +14.3%). You don\'t place it. At half-time, 0-0, Team A is now 3.80. Your time-adjusted model says fair odds are 3.30. Edge is now +15.2%. Is the in-play bet better value?',
      answer: 'The edge percentage is slightly higher (15.2% vs 14.3%), but this is misleading. The in-play overround is likely 7-10% vs 4-5% pre-match. Your edge AFTER overround adjustment is similar or worse in-play. More importantly: you had the pre-match value at 3.20 and didn\'t take it. The maths was clear then. Waiting for a "better" price in-play introduced execution risk (the match could have started with a goal, eliminating the opportunity entirely). The lesson: when you identify genuine pre-match value, take it. Don\'t gamble on the odds drifting further.',
      difficulty: 'advanced',
      edge: 'Pre-match was the correct time to bet'
    },
    {
      id: 'ip8',
      type: 'calculation',
      question: 'You backed a correct score of 2-1 at 12.00, £5 stake, pre-match. It\'s now 2-1 at 70 minutes. The bookmaker offers cash-out of £35. An exchange offers lay of 2-1 at 3.50. Calculate: (a) cash-out profit, (b) exchange guaranteed profit.',
      hint: 'For exchange: you need to equalise profit across both outcomes.',
      answer: '(a) Cash-out: £35 return - £5 stake = £30 profit. (b) Exchange: Lay 2-1 at 3.50. Your back bet wins £55 (£60 return - £5 stake) if 2-1 holds. Lay stake to equalise: lay_stake = back_return / lay_odds = 60 / 3.50 = £17.14. If 2-1 holds: +£55 (back) - £17.14 × 2.50 (lay liability) = +£55 - £42.86 = +£12.14. Wait — let me recalculate for equal profit. lay_stake × (1-comm) = back_payout - lay_stake × (lay_odds - 1). Solving: lay_stake = 55 / (2.50 + 0.98) = 55/3.48 = £15.80. If 2-1: +£55 - £15.80×2.50 = +£15.50. If not 2-1: -£5 + £15.80×0.98 = +£10.48. Exchange: £10.48 to £15.50 guaranteed. Cash-out: £30. Cash-out is better here because the correct score lay spread is very wide on exchanges.',
      difficulty: 'advanced',
      edge: 'Cash-out wins in thin exchange markets'
    }
  ],

  tool: {
    name: 'In-Play Odds Modeller',
    description: 'Calculate updated match probabilities based on current score and time elapsed.',
    inputs: [
      { id: 'ip-home-xg', label: 'Home xG (per 90)', type: 'number', default: 1.50, min: 0.1, max: 5, step: 0.05 },
      { id: 'ip-away-xg', label: 'Away xG (per 90)', type: 'number', default: 1.10, min: 0.1, max: 5, step: 0.05 },
      { id: 'ip-minute', label: 'Current minute', type: 'number', default: 45, min: 1, max: 90, step: 1 },
      { id: 'ip-home-goals', label: 'Home goals scored', type: 'number', default: 1, min: 0, max: 10, step: 1 },
      { id: 'ip-away-goals', label: 'Away goals scored', type: 'number', default: 0, min: 0, max: 10, step: 1 },
      { id: 'ip-cashout-offer', label: 'Cash-out offer (£, optional)', type: 'number', default: 0, min: 0, step: 0.01 },
      { id: 'ip-orig-stake', label: 'Original stake (£)', type: 'number', default: 10, min: 0.01, step: 0.01 },
      { id: 'ip-orig-odds', label: 'Original odds (decimal)', type: 'number', default: 2.50, min: 1.01, step: 0.01 }
    ],
    outputs: [
      'Updated Home Win / Draw / Away Win probabilities',
      'Fair in-play odds for each outcome',
      'Remaining expected goals per team',
      'Over/Under 2.5 updated probability',
      'Cash-out valuation: "Your bet is worth £X — bookmaker offers £Y"',
      'Cash-out margin percentage'
    ]
  }
};

// Export for assembly
if (typeof module !== 'undefined') module.exports = MODULE_16;
