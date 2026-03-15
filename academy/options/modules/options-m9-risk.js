// options-m9-risk.js
// Module 9: Risk Management & Position Sizing
// Tier: Master

const OPTIONS_MODULE_9 = {
  id: 9,
  title: 'Risk Management & Position Sizing',
  tier: 'master',
  scenarioCount: 10,
  accentColor: '#06b6d4',

  tutorial: `
    <div class="tut">

      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#06b6d4;letter-spacing:0.05em;">MODULE 9: RISK MANAGEMENT & POSITION SIZING</h2>

      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        Knowing strategies is half the battle. Sizing them correctly is the other half. This module teaches you how to calculate your total risk, size positions appropriately, and understand the tail risks that blow up accounts.
      </p>
      <p style="font-family:'Crimson Pro',serif;font-size:1.15rem;color:var(--text);line-height:1.8;">
        The single most important rule in options: <strong style="color:var(--text-bright);">know your maximum loss before you enter the trade.</strong> If you can't state it as a number, you don't understand the position.
      </p>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#06b6d4;letter-spacing:0.05em;margin-bottom:0.75rem;">JARGON BUSTER</div>
        <div style="font-family:'Crimson Pro',serif;font-size:0.95rem;color:var(--text);line-height:1.8;">
          <strong style="color:var(--text-bright);">Portfolio Greeks:</strong> The sum of all your individual position Greeks. Tells you your total exposure to share moves, time, and volatility.<br>
          <strong style="color:var(--text-bright);">Notional exposure:</strong> The total value of the underlying shares your options control. 10 contracts × 100 shares × £50 = £50,000 notional. This can be far larger than your account.<br>
          <strong style="color:var(--text-bright);">Tail risk:</strong> The risk of extreme, rare events that standard models underestimate. The "what if everything goes wrong at once" scenario.
        </div>
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">RULE 1: KNOW YOUR MAXIMUM LOSS</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Before entering any trade, calculate the absolute worst case. Not the likely case. The worst case.
      </p>

      <div class="mb">
Defined risk (max loss is known):
  Long call: lose the premium. £400 on 1 contract at £4.
  Bull call spread: lose the net debit. £250 on a £2.50 spread.
  Iron condor: lose width minus premium. £300 on a £5 wide, £2 credit.

Undefined risk (max loss is theoretically unlimited):
  Short naked call: if share rises to £1,000, you lose enormously.
  Short straddle: big move in either direction = massive loss.
  Short naked put: if share goes to £0, you lose the full strike.

RULE: Never have undefined risk that exceeds your account.
      A short naked call on a £100 share with 10 contracts
      controls £100,000 of exposure. If the share doubles,
      you owe £100,000. Can your account handle that?</div>

      <div class="dg">
        <strong>The account-killing mistake:</strong> Selling naked options without understanding the notional exposure. "I sold 20 puts at £2 each, collected £4,000 in premium — easy money!" But those 20 puts control 2,000 shares. If the share drops 50%, you owe £100,000. Many accounts have been wiped out this way.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">RULE 2: SIZE BY MAXIMUM LOSS, NOT PREMIUM</h3>

      <div class="mb">
Wrong way to size:
  "I have £10,000. Iron condors cost £2 each. I can afford 50!"
  
  Max loss per condor: £3 (£5 width − £2 premium)
  50 condors × £3 × 100 = £15,000 maximum loss.
  You just risked 150% of your account. One bad month = wiped out.

Right way to size:
  Rule: never risk more than 2-5% of account per trade.
  
  2% of £10,000 = £200 maximum risk per trade.
  Max loss per iron condor: £300.
  Maximum condors: 0 (can't afford even one at 2% risk!)
  At 5% risk (£500): 1 condor (£300 risk < £500 limit). ✓

  This feels conservative. It IS conservative. That's the point.
  Conservative sizing is the reason professionals survive
  and amateurs don't.</div>

      <div class="pln">
        The 2% rule seems restrictive, but it's mathematics. If you lose 2% on each of 10 consecutive trades (unlikely but possible), you're down 18% — painful but recoverable. If you risk 10% per trade and lose 10 in a row, you're down 65% — devastating. The 2% rule ensures survival through the worst streaks.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">PORTFOLIO GREEKS — YOUR TOTAL EXPOSURE</h3>

      <div class="mb">
Individual position Greeks ADD UP to portfolio Greeks:

Position 1: Long 5 calls, delta +0.55 each
  Position delta: 5 × 100 × 0.55 = +275

Position 2: Short 3 puts, delta +0.30 each (short put = positive delta)
  Position delta: 3 × 100 × 0.30 = +90

Position 3: Short 200 shares
  Position delta: −200

Portfolio delta: +275 + 90 − 200 = +165

Meaning: if the market rises £1, your portfolio gains ~£165.
If it falls £1, you lose ~£165.

Do the same for gamma, theta, vega:
  Portfolio theta = sum of all position thetas
  Portfolio vega = sum of all position vegas

This tells you your TOTAL exposure to each risk factor.</div>

      <div class="pln">
        Monitoring portfolio Greeks is how professionals manage risk. Instead of thinking about each trade individually, they look at the totals. "My portfolio delta is +500 — I'm very bullish. My portfolio theta is −£50/day — I'm paying £50 per day in time decay. My portfolio vega is +£200 per vol point — if IV rises 3%, I gain £600." These numbers tell you everything about your risk exposure in one glance.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">TAIL RISK — WHAT THE MODELS MISS</h3>

      <p style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.8;">
        Black-Scholes assumes returns follow a bell curve. Real markets have "fat tails" — extreme events happen far more often than the bell curve predicts.
      </p>

      <div class="mb">
The bell curve says:
  3-sigma event (3 SD daily move): once every ~1.5 years
  5-sigma event: once every ~14,000 years
  10-sigma event: once every 10^23 years (never)

Reality:
  3-sigma events: every few months
  5-sigma events: every few years (2015, 2018, 2020)
  10-sigma events: every decade or two (1987, 2008, 2020)

The model underestimates extreme events by factors of
thousands to trillions.

Practical implication:
  If your strategy "only loses money in a 5-sigma event"
  and you think that means once every 14,000 years,
  you're wrong. It means every few years.
  Size accordingly.</div>

      <div class="dg">
        <strong>The 2020 lesson:</strong> In March 2020, the S&P 500 fell 34% in 23 trading days. VIX hit 82. Traders who had sold naked puts or run iron condors without proper sizing were destroyed. The premium they'd collected over months was wiped out in days. The model said it was "impossible." The market didn't care about the model.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">KELLY CRITERION FOR OPTIONS</h3>

      <div class="mb">
From Poker School Module 18 (same formula, different application):

  f* = edge / odds = expected profit / max loss

  Iron condor example:
    Premium collected: £2 (your profit if it works)
    Max loss: £3
    Win rate: 70%

    Expected profit per trade: 0.70 × 2 − 0.30 × 3 = £0.50
    Edge = £0.50
    Odds = £3 (max loss)
    Kelly fraction: 0.50 / 3 = 16.7%

    Kelly says risk 16.7% of your account per iron condor.
    Half-Kelly (safer): 8.3%.

    With £10,000 account:
      Half-Kelly max risk = £830 per trade
      At £300 max loss per condor: 2 condors maximum.

  This is more aggressive than the 2% rule suggests,
  but Kelly assumes you know your edge precisely.
  In practice, use the more conservative of Kelly and
  fixed-percentage sizing.</div>

      <div class="pln">
        Kelly works for options the same way it works for poker bankrolls. But it's sensitive to your win-rate estimate — if you think you win 70% but actually win 55%, Kelly tells you to bet too much. In options, where win rates are hard to estimate precisely, err on the conservative side. Half-Kelly or even quarter-Kelly with a maximum of 5% account risk per trade.
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text-bright);margin-top:2.5rem;">CORRELATION — THE HIDDEN RISK</h3>

      <div class="mb">
"I diversified — I sold iron condors on 10 different shares!"

Problem: in a crash, ALL shares fall together.
  Correlation spikes from 0.3 (normal) to 0.9+ (crisis).
  Your 10 "independent" iron condors all lose simultaneously.
  10 × £300 max loss = £3,000 in one event.

True diversification means:
  Different underlyings (shares, indices, commodities)
  Different strategies (some long vol, some short vol)
  Different timeframes
  Some positions that PROFIT from a crash (long puts, VIX calls)

Portfolio rule of thumb:
  Total portfolio risk (if everything goes wrong at once)
  should not exceed 20-25% of your account.
  Even that feels aggressive for most retail traders.</div>

      <div class="gd">
        <strong>Module 9 summary:</strong> Know your max loss before you trade. Size by max loss, not by premium. Monitor portfolio Greeks for total exposure. Respect tail risk — extreme events happen far more often than models predict. Use Kelly or fixed-percentage sizing, whichever is more conservative. Diversify properly — correlations spike in crises.<br><br>
        <strong>Coming in Module 10:</strong> Real-world case studies applying everything from Modules 1-9. Earnings plays, crash analysis, covered calls on dividend shares, and more.
      </div>

      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:10px;padding:1.5rem;margin-top:2rem;text-align:center;">
        <div style="font-family:'Crimson Pro',serif;font-size:1.1rem;color:var(--text);line-height:1.6;font-style:italic;">"This is mathematical education, not financial advice. Options trading involves significant risk of loss. You can lose more than your initial investment."</div>
      </div>
    </div>
  `,

  scenarios: [
    {id:'rm01',difficulty:'basic',question:'You sell 5 iron condors. Each has £5 wide spreads and collects £2 premium. What is your maximum loss?',answer:'£1,500',explanation:'Max loss per condor: (5 − 2) × 100 = £300. Total: 5 × £300 = £1,500.'},
    {id:'rm02',difficulty:'basic',question:'Your account is £20,000. Using the 2% rule, what is the maximum you should risk on a single trade?',answer:'£400',explanation:'2% × £20,000 = £400. If the trade\'s max loss exceeds £400, reduce the position size or choose a different strategy.'},
    {id:'rm03',difficulty:'basic',question:'You have 3 long calls (delta +0.50) and 200 short shares. What is your portfolio delta?',answer:'-50',explanation:'Calls: 3 × 100 × 0.50 = +150. Shares: −200. Portfolio delta: 150 − 200 = −50. You\'re slightly bearish.'},
    {id:'rm04',difficulty:'intermediate',question:'You sell a naked put on a £80 share (strike £80). 10 contracts. What is your notional exposure?',answer:'£80,000',explanation:'10 contracts × 100 shares × £80 = £80,000. If the share goes to £0, you owe £80,000 (minus the premium collected). On a £20,000 account, this is 4× your account size in exposure.'},
    {id:'rm05',difficulty:'intermediate',question:'Your portfolio has: theta = +£30/day, vega = −£150 per vol point. VIX is at 15. What happens to your portfolio if VIX jumps to 25?',answer:'lose approximately £1,500',explanation:'VIX jump: +10 points. Vega × change: −150 × 10 = −£1,500. Your theta collects £30/day, but a 10-point VIX spike wipes out 50 days of theta collection in one event. This is the seller\'s nightmare.'},
    {id:'rm06',difficulty:'intermediate',question:'Iron condor: 70% win rate, £200 profit per win, £300 loss per loss. Kelly fraction?',answer:'~6.7%',explanation:'Expected profit: 0.70×200 − 0.30×300 = 140−90 = £50. Kelly: 50/300 = 16.7%. Half-Kelly: 8.3%. This is per trade — with a £10,000 account, risk up to £830 (half-Kelly) per condor.'},
    {id:'rm07',difficulty:'intermediate',question:'You sell iron condors on 8 different tech shares. A tech sector sell-off hits all 8 simultaneously. Is your risk diversified?',answer:'no — correlated risk',explanation:'Tech shares are highly correlated. A sector-wide sell-off hits all 8 simultaneously. You have 8× the risk you thought you had. Diversify across sectors and asset classes, not just ticker symbols.'},
    {id:'rm08',difficulty:'advanced',question:'Black-Scholes says a 5% daily move has a probability of 0.00003% (once in 14,000 years). In reality, the S&P 500 has had about 20 such days in the last 50 years. How does this affect risk management?',answer:'model dramatically underestimates tail events — size as if extreme moves happen regularly',explanation:'20 events in 50 years = roughly once every 2.5 years. The model says once every 14,000 years. That\'s a 5,600× underestimate. In practice: assume "impossible" events happen every few years and ensure your account survives them.'},
    {id:'rm09',difficulty:'advanced',question:'Your account is £50,000. You want to sell premium across 5 positions. Total max loss if ALL positions hit max loss simultaneously: £12,000. Is this acceptable?',answer:'borderline — 24% of account at risk',explanation:'£12,000/£50,000 = 24%. This is at the upper limit of acceptable portfolio risk. If correlations spike (which they do in crises), all 5 could lose simultaneously. Consider reducing to 3-4 positions or widening the spreads for lower max loss per position.'},
    {id:'rm10',difficulty:'advanced',question:'You have a £10,000 account and want to trade options on a £500 share. Each contract controls 100 shares = £50,000 notional. Is this appropriate?',answer:'very risky — notional is 5× your account',explanation:'One contract controls £50,000 of shares — five times your account. Even a defined-risk spread can consume a significant portion of your capital. Consider: (a) trading lower-priced shares, (b) using vertical spreads to limit risk, or (c) trading mini/micro options if available. Never let notional exposure exceed 2-3× your account without very careful risk management.'}
  ],

  tool: {
    id: 'position-sizer',
    title: 'Position Size Calculator',
    render: function(container) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.5rem;margin:1.5rem 0;">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#06b6d4;margin-bottom:0.5rem;">POSITION SIZE CALCULATOR</h3>
          <p style="font-family:'Crimson Pro',serif;font-size:0.9rem;color:var(--text);margin-bottom:1rem;">Calculate the right number of contracts based on your account size and risk tolerance.</p>
          <div style="display:grid;grid-template-columns:200px 1fr;gap:1.5rem;">
            <div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;">Account Size (£)</label>
              <input type="number" id="ps-acc" value="10000" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Max Risk Per Trade (%)</label>
              <input type="range" id="ps-risk" min="1" max="10" value="2" style="width:100%;margin:0.2rem 0;">
              <div id="ps-risk-d" style="font-family:'DM Mono',monospace;font-size:0.85rem;color:var(--text);text-align:center;">2%</div>
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Max Loss Per Contract (£)</label>
              <input type="number" id="ps-loss" value="300" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Premium Per Contract (£)</label>
              <input type="number" id="ps-prem" value="200" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
              <label style="font-family:'Outfit',sans-serif;font-size:0.75rem;color:var(--muted);text-transform:uppercase;margin-top:0.3rem;display:block;">Estimated Win Rate (%)</label>
              <input type="number" id="ps-wr" value="70" style="width:100%;padding:0.3rem;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;margin:0.2rem 0;">
            </div>
            <div id="ps-output" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;font-family:'DM Mono',monospace;font-size:0.9rem;color:var(--text);line-height:2;"></div>
          </div>
        </div>`;

      function calc(){
        const acc=parseFloat(document.getElementById('ps-acc').value)||10000;
        const riskPct=parseFloat(document.getElementById('ps-risk').value)/100;
        const maxLoss=parseFloat(document.getElementById('ps-loss').value)||300;
        const prem=parseFloat(document.getElementById('ps-prem').value)||200;
        const wr=parseFloat(document.getElementById('ps-wr').value)/100||0.7;
        document.getElementById('ps-risk-d').textContent=(riskPct*100).toFixed(0)+'%';

        const maxRisk=acc*riskPct;
        const fixedContracts=Math.floor(maxRisk/maxLoss);

        // Kelly
        const ev=wr*prem-(1-wr)*maxLoss;
        const kellyFrac=ev>0?ev/maxLoss:0;
        const halfKelly=kellyFrac/2;
        const kellyRisk=acc*halfKelly;
        const kellyContracts=Math.floor(kellyRisk/maxLoss);

        const contracts=Math.min(fixedContracts,kellyContracts>0?kellyContracts:fixedContracts);

        let html='<div style="color:#06b6d4;font-size:1.4rem;margin-bottom:0.75rem;">'+contracts+' contract'+(contracts!==1?'s':'')+'</div>';
        html+='<div style="margin-bottom:1rem;">';
        html+='<div>Account: £'+acc.toLocaleString()+'</div>';
        html+='<div>Max risk ('+((riskPct*100).toFixed(0))+'%): £'+maxRisk.toFixed(0)+'</div>';
        html+='<div>Max loss per contract: £'+maxLoss+'</div>';
        html+='</div>';

        html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">';
        html+='<div style="background:var(--surface);padding:0.75rem;border-radius:6px;"><div style="color:var(--muted);font-size:0.7rem;text-transform:uppercase;">Fixed % method</div><div style="font-size:1.1rem;color:var(--text-bright);">'+fixedContracts+' contracts</div><div style="font-size:0.8rem;color:var(--muted);">Risk: £'+(fixedContracts*maxLoss)+'</div></div>';
        html+='<div style="background:var(--surface);padding:0.75rem;border-radius:6px;"><div style="color:var(--muted);font-size:0.7rem;text-transform:uppercase;">Half-Kelly</div><div style="font-size:1.1rem;color:var(--text-bright);">'+(kellyContracts>0?kellyContracts:'N/A (no edge)')+'</div><div style="font-size:0.8rem;color:var(--muted);">Kelly f*: '+(kellyFrac*100).toFixed(1)+'%</div></div>';
        html+='</div>';

        html+='<div style="margin-top:1rem;padding:0.75rem;background:var(--surface);border-radius:6px;border-left:3px solid #06b6d4;">';
        html+='<div style="color:var(--muted);font-size:0.7rem;text-transform:uppercase;margin-bottom:0.25rem;">Expected Value Per Trade</div>';
        if(ev>0){
          html+='<div style="color:var(--green-bright);">+£'+ev.toFixed(2)+' per contract</div>';
          html+='<div style="color:var(--muted);font-size:0.8rem;">'+contracts+' contracts: +£'+(ev*contracts).toFixed(2)+' expected per trade</div>';
        } else {
          html+='<div style="color:var(--red-bright);">−£'+Math.abs(ev).toFixed(2)+' per contract (negative EV!)</div>';
          html+='<div style="color:var(--red-bright);font-size:0.8rem;">This trade has no mathematical edge. Don\'t take it.</div>';
        }
        html+='</div>';

        document.getElementById('ps-output').innerHTML=html;
      }

      ['ps-acc','ps-loss','ps-prem','ps-wr'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
      document.getElementById('ps-risk').addEventListener('input',calc);
      calc();
    }
  }
};

if(typeof window!=='undefined'){window.OPTIONS_MODULE_9=OPTIONS_MODULE_9;}
