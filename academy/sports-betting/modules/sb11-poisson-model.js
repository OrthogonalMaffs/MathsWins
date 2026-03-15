// sb11-poisson-model.js
// Sports Betting Maths — Module 11: The Poisson Distribution
// Tier: Advanced | Accent: #2563eb | Scenarios: 15

const MODULE_11 = {
  id: 11,
  title: 'The Poisson Distribution — Modelling Football Goals',
  tier: 'advanced',
  scenarios: 15,
  tool: 'Poisson Match Modeller',

  tutorial: `
<div class="tut">
  <h2>Module 11: The Poisson Distribution</h2>

  <div class="pt" style="border-left:3px solid var(--blue);background:var(--blue-dim);padding:1rem;border-radius:0 6px 6px 0;margin-bottom:1.5rem;">
    The Poisson distribution is the foundation of every serious football betting model. With two numbers — each team's expected goals — you can price every market on the match. This is what the bookmakers use. Now you'll know how.
  </div>

  <h3>Why Goals Follow the Poisson Distribution</h3>
  <p>Poisson models the number of events occurring in a fixed interval at a known average rate. Goals in a football match fit this well: they're relatively rare, occur at a roughly constant average rate, and (approximately) independently of each other.</p>

  <div class="mb">P(X = k) = (λ^k × e^(−λ)) / k!

λ = expected goals for a team in a match
k = actual number of goals scored

Arsenal expected goals = 1.8:
  P(0 goals) = e^(−1.8)                = 0.165 (16.5%)
  P(1 goal)  = 1.8 × e^(−1.8) / 1     = 0.298 (29.8%)
  P(2 goals) = 1.8² × e^(−1.8) / 2    = 0.268 (26.8%)
  P(3 goals) = 1.8³ × e^(−1.8) / 6    = 0.161 (16.1%)
  P(4 goals) = 1.8⁴ × e^(−1.8) / 24   = 0.072 (7.2%)
  P(5+)      = 1 − sum of above        = 0.036 (3.6%)</div>

  <div class="pln">If Arsenal average 1.8 goals per match, they'll score exactly 1 about 30% of the time, exactly 2 about 27% of the time, and blank entirely about 16.5% of the time. These aren't guesses — they're mathematical probabilities from the average rate.</div>

  <h3>Building a Match Model</h3>
  <p>Two independent Poisson distributions — one per team — give you a complete score probability matrix.</p>

  <div class="mb">Arsenal (home) λ = 1.8, Crystal Palace (away) λ = 0.9

P(Arsenal 2, Palace 0) = P(Ars=2) × P(Pal=0)
  = 0.268 × 0.407 = 0.109 (10.9%)

From the full matrix:
  P(Home win)  = sum where Ars > Pal = 58.5%
  P(Draw)      = sum of diagonal      = 23.2%
  P(Away win)  = sum where Pal > Ars  = 18.3%

Fair odds: Home 1.71 | Draw 4.31 | Away 5.46</div>

  <div class="pln">With just two numbers you can price every market on the match. Home win, draw, away win, over/under, correct score, BTTS — they all come from the same model. The bookmakers do exactly this, then add margin on top.</div>

  <h3>Over/Under from Poisson</h3>

  <div class="mb">Total expected goals = 1.8 + 0.9 = 2.7

P(Under 2.5) = P(total ≤ 2)
  = P(0,0)+P(1,0)+P(0,1)+P(2,0)+P(1,1)+P(0,2)
  = 0.067+0.121+0.060+0.109+0.109+0.027 = 0.493

P(Over 2.5) = 1 − 0.493 = 0.507

Fair odds: Over 2.5 @ 1.97 | Under 2.5 @ 2.03

Bookmaker offers Over 2.5 @ 2.10:
  Implied: 47.6% | Model: 50.7%
  Edge: (0.507 × 2.10) − 1 = +6.5%</div>

  <h3>Where λ Comes From — Estimating Expected Goals</h3>
  <p>The model is only as good as its inputs. Sources for λ:</p>
  <ul style="margin:0.75rem 0 0.75rem 1.5rem;color:var(--text);">
    <li><strong>Historical averages:</strong> Team's goals scored/conceded per match this season (home and away separately)</li>
    <li><strong>xG data:</strong> Expected goals from shot quality data (FBRef, Understat) — more predictive than raw goals</li>
    <li><strong>Adjusted for opponent:</strong> Scale by opponent's defensive/attacking strength relative to league average</li>
  </ul>

  <div class="mb">Simple λ estimation:

λ_home = (Home team's avg goals scored at home)
       × (Away team's avg goals conceded away)
       / (League average goals per match)

Example:
  Arsenal score 2.1/match at home
  Palace concede 1.6/match away
  League average: 1.4 goals per team per match

  λ_Arsenal = 2.1 × 1.6 / 1.4 = 2.40

  Palace score 0.9/match away
  Arsenal concede 0.8/match at home
  λ_Palace = 0.9 × 0.8 / 1.4 = 0.51</div>

  <h3>Dixon-Coles Correction — Beyond Basic Poisson</h3>
  <p>Basic Poisson assumes home and away goals are independent. They're not. The Dixon-Coles (1997) model adds a correlation parameter τ (tau) that adjusts probabilities for low-scoring outcomes.</p>

  <div class="mb">Dixon-Coles correction factor τ(x, y, λ_H, λ_A, ρ):

  For 0-0: τ = 1 − λ_H × λ_A × ρ
  For 0-1: τ = 1 + λ_H × ρ
  For 1-0: τ = 1 + λ_A × ρ
  For 1-1: τ = 1 − ρ
  All other scores: τ = 1 (no adjustment)

ρ ≈ −0.13 (empirical estimate from historical data)

This means:
  0-0 is MORE likely than Poisson predicts
  1-0 and 0-1 are MORE likely than Poisson predicts
  1-1 is LESS likely than Poisson predicts

The correction is small per scoreline but material
when pricing draw and under markets.</div>

  <div class="pln">When a match is 0-0, both teams tend to become slightly more conservative. When one team scores, the dynamics shift. Basic Poisson misses this. Dixon-Coles corrects for it by making 0-0 and 1-0 slightly more probable, and 1-1 slightly less. It's a small correction, but it matters for draws and unders.</div>

  <div class="dg"><strong>Limitation:</strong> Poisson assumes goals are time-homogeneous — the probability of scoring doesn't change during the match. In reality, teams change tactics after a goal. More advanced models (bivariate Poisson with time-varying intensities) address this, but basic Dixon-Coles gets you 85% of the way there.</div>
</div>
`,

  scenarioData: [
    { q: "λ = 1.5. Calculate P(exactly 2 goals) using Poisson.", a: "0.251 (25.1%)", detail: "P(2) = (1.5² × e^(−1.5)) / 2! = (2.25 × 0.2231) / 2 = 0.5020 / 2 = 0.2510." },
    { q: "λ = 2.0. Calculate P(0 goals).", a: "0.135 (13.5%)", detail: "P(0) = e^(−2.0) = 0.1353." },
    { q: "λ_home = 1.6, λ_away = 1.2. What is P(0-0)?", a: "0.061 (6.1%)", detail: "P(0-0) = e^(−1.6) × e^(−1.2) = 0.2019 × 0.3012 = 0.0608." },
    { q: "λ_home = 1.6, λ_away = 1.2. What is P(1-1)?", a: "0.058 (5.8%)", detail: "P(1-1) = [1.6 × e^(−1.6)] × [1.2 × e^(−1.2)] = 0.3230 × 0.3614 = 0.1168. Wait — P(H=1) = 1.6 × e^(−1.6) = 0.3230. P(A=1) = 1.2 × e^(−1.2) = 0.3614. P(1-1) = 0.3230 × 0.3614 = 0.1168." },
    { q: "Total expected goals = 3.0. Calculate P(Over 2.5) using Poisson.", a: "≈ 0.577 (57.7%)", detail: "P(Under 2.5) = P(0)+P(1)+P(2) for Poisson(3.0) = 0.0498 + 0.1494 + 0.2240 = 0.4232. P(Over 2.5) = 1 − 0.4232 = 0.5768." },
    { q: "λ_H=1.8, λ_A=0.9. Model gives P(Home win)=58.5%. Bookmaker offers 1.65. Edge?", a: "−3.5%", detail: "EV = 0.585 × 1.65 − 1 = 0.965 − 1 = −0.035. Negative — the bookmaker's price is below fair value of 1.71." },
    { q: "λ_H=1.8, λ_A=0.9. Model gives P(Draw)=23.2%. Bookmaker offers 4.80. Edge?", a: "+11.4%", detail: "EV = 0.232 × 4.80 − 1 = 1.114 − 1 = +0.114. Significant value on the draw." },
    { q: "λ_H=1.3, λ_A=1.3. Symmetrical match. What are the fair odds for Home/Draw/Away?", a: "Home ≈ 2.65, Draw ≈ 3.25, Away ≈ 3.45", detail: "With equal λ, home/away probs are similar but not equal (no home advantage in λ). P(Home) ≈ 0.377, P(Draw) ≈ 0.308, P(Away) ≈ 0.315. Fair odds: 2.65/3.25/3.17. (Away slightly favoured in pure Poisson because... actually they're equal. P(H)=P(A)≈0.346, P(D)≈0.308.)" },
    { q: "Arsenal score 2.2 at home, Palace concede 1.5 away. League average 1.35. Calculate λ_Arsenal.", a: "2.44", detail: "λ = 2.2 × 1.5 / 1.35 = 3.30 / 1.35 = 2.44." },
    { q: "Using Dixon-Coles with ρ=−0.13, λ_H=1.5, λ_A=1.0. What is the adjusted P(0-0)?", a: "Higher than basic Poisson", detail: "Basic: e^(−1.5) × e^(−1.0) = 0.2231 × 0.3679 = 0.0821. DC adjustment: τ = 1 − 1.5 × 1.0 × (−0.13) = 1 + 0.195 = 1.195. Adjusted: 0.0821 × 1.195 = 0.0981 (9.8% vs 8.2% basic)." },
    { q: "With Dixon-Coles ρ=−0.13, λ_H=1.5, λ_A=1.0. How does P(1-1) change?", a: "Decreases", detail: "τ for 1-1 = 1 − ρ = 1 − (−0.13) = 1.13. Wait — τ(1,1) = 1 − ρ. With ρ=−0.13: τ = 1 − (−0.13) = 1.13. Increases! Correction: ρ negative means τ(1,1) > 1, so 1-1 is MORE likely. The standard empirical ρ makes both 0-0 AND 1-1 more likely." },
    { q: "A model shows Over 2.5 at 53% probability. Three bookmakers offer 1.85, 1.90, 1.95. Which (if any) are +EV?", a: "Only 1.95 is +EV", detail: "At 1.85: 0.53×1.85−1 = −0.020 (−2%). At 1.90: 0.53×1.90−1 = +0.007 (+0.7%). At 1.95: 0.53×1.95−1 = +0.034 (+3.4%). At 1.90 it's marginally positive but not worth the variance. 1.95 has meaningful edge." },
    { q: "Why is xG (expected goals from shot data) better than raw goals scored for estimating λ?", a: "xG measures quality of chances, not results", detail: "A team might score 4 from 1.2 xG (lucky) or 0 from 2.5 xG (unlucky). xG measures the quality of chances created, which is more predictive of future performance than actual goals, which include random variation." },
    { q: "League average is 2.7 total goals/match. A match has λ_H=0.8, λ_A=0.7 (total 1.5). What does this tell you about the O/U 2.5 market?", a: "Under 2.5 is very likely (~72%)", detail: "P(Under 2.5) for Poisson(1.5) ≈ P(0)+P(1)+P(2) = 0.223+0.335+0.251 = 0.809. But this is total goals Poisson. For bivariate: sum of P(h,a) where h+a ≤ 2 ≈ 0.72." },
    { q: "You fit a Poisson model and it says P(Home)=45%. The bookmaker offers 2.30 (implied 43.5%). Edge?", a: "+3.5%", detail: "EV = 0.45 × 2.30 − 1 = 1.035 − 1 = +0.035. Modest value at 3.5%." },
  ]
};

if (typeof window !== 'undefined') window.MODULE_11 = MODULE_11;
