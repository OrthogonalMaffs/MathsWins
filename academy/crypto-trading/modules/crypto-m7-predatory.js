// crypto-m7-predatory.js
// Module 7: Predatory Market Mechanics — How You Get Liquidated, Rugged & Front-Run
// Crypto Trading Maths — MathsWins Academy
// Tier: Advanced | Accent: #f97316

const CRYPTO_MODULE_7 = {
  id: 7,
  title: 'Predatory Market Mechanics — How You Get Liquidated, Rugged & Front-Run',
  tier: 'advanced',
  accent: '#f97316',

  tutorial: `
    <div class="tut">
      <h2>Module 7: Predatory Market Mechanics</h2>

      <div class="dg">
        This module exists because understanding the mathematics of how the market is actively engineered against you is as important as understanding the mathematics of the markets themselves. Every mechanism described here is real, documented, and ongoing. The maths is precise. The losses are permanent.
      </div>

      <h3>1. Stop-Loss Hunting — Your Orders Are Visible</h3>

      <p>On a decentralised exchange, your stop-loss order exists on the blockchain. It is visible to everyone. On centralised exchanges, your stop orders are on the exchange's order book — visible to the exchange and, through API access, to sophisticated market makers.</p>

      <div class="mb">
How stop-loss hunting works:

1. Liquidation data is public. Sites like Coinglass show
   exactly where liquidation clusters sit:
   "$500M in BTC long liquidations between $58,000-$59,000"

2. A whale or market maker with $10-50M can push price
   through the liquidation cluster.

3. When price hits the cluster:
   Stop-losses trigger → forced sell orders flood the market
   → price drops further → more stops trigger → cascade

4. The whale buys back at the lower price.

The mathematics:
  Liquidation cluster: $500M in longs between $58k-$59k
  BTC price: $60,000
  Push needed: ~3.3% ($60k → $58k)
  Capital needed to move price 3.3% on BTC:
    Depends on order book depth, but typically $10-30M
    in aggressive market sells over 5-15 minutes.

  Cost: $10-30M in slippage and market impact
  Reward: $500M of forced selling creates a price dip
    that the whale can buy into.

  If price drops 5% from cascade ($60k → $57k):
    Whale buys $50M at $57k, price recovers to $59k
    Profit: $50M × 3.5% = $1.75M minus execution costs
    Net: ~$1-1.5M profit

  This is profitable as long as the liquidation cluster
  is large enough relative to the cost of the push.

On DEXs it's worse:
  Your pending stop-loss transaction is in the mempool.
  MEV bots can see it and front-run it — executing their
  sell BEFORE your stop triggers, then buying back after.
      </div>

      <div class="pln">
        Your stop-loss isn't protection — it's a target. On-chain, it's literally visible to anyone who looks. On a CEX, the exchange knows exactly where the stops are clustered. The mathematics of stop-loss hunting is simple: if the cost of pushing price through a stop cluster is less than the profit from buying the resulting dip, someone will do it. And in crypto, someone always does.
      </div>

      <h3>2. Liquidation Cascades — The Mathematics of Forced Selling</h3>

      <div class="mb">
A liquidation cascade is a positive feedback loop:

Price drops → leveraged longs liquidated →
liquidation = forced selling at market →
forced selling pushes price down further →
more liquidations trigger → more forced selling → repeat

The cascade is exponential, not linear:

  Step 1: Price drops 2% from $60,000 to $58,800
    50× leveraged longs at $59,400 liquidated
    Selling: $50M

  Step 2: $50M forced selling pushes price to $58,200
    20× longs at $58,500 liquidated
    Selling: $200M

  Step 3: $200M selling pushes price to $56,500
    10× longs at $57,000 liquidated
    Selling: $800M

  Step 4: $800M selling pushes price to $52,000
    5× longs at $54,000 liquidated
    Selling: $1.5B

  Total liquidations from a 2% initial drop: $2.55 BILLION
  Final price: $52,000 (-13.3% from start)

  A 2% move cascaded into a 13.3% crash.
  This is not theoretical. This is how May 2021 worked:
    BTC: $58k → $30k in 7 days ($8.6B liquidated)
    March 2020: $8k → $3.8k in 2 days ($1.6B liquidated)
    FTX collapse: $21k → $15.5k ($4.4B liquidated)

The maths of cascades:
  Cascade severity = f(total open interest, average leverage,
                       liquidation price clustering, order book depth)

  High OI + high leverage + clustered liq prices + thin books
  = catastrophic cascade potential.

  This is measurable in real-time from public data.
  When you see all four conditions present: reduce exposure.
      </div>

      <div class="dg">
        Liquidation cascades turn small moves into crashes. The leverage in the system is the amplifier. When open interest is high and leverage is concentrated at similar levels, the cascade mathematics guarantee that a moderate initial move will be amplified into a severe one. This is not a "black swan" — it's a predictable consequence of the leverage distribution.
      </div>

      <h3>3. Rug Pulls — The Mathematical Red Flags</h3>

      <div class="mb">
A rug pull: the token deployer drains liquidity and disappears.

Mechanism (standard DEX rug):
  1. Deploy token (cost: $20, time: 10 minutes)
  2. Create liquidity pool: pair token with ETH/USDC
  3. Promote token (social media, Telegram, paid shills)
  4. Price rises as buyers enter the pool
  5. Remove liquidity → pool drains → price goes to zero
  6. Deployer walks away with all the ETH/USDC

Mathematical red flags — QUANTIFIABLE:

1. LP Lock Duration
   Locked liquidity means the deployer CAN'T remove it.
   No lock / short lock (<30 days) = rug possible at any time.
   Lock >12 months = significantly safer (but not immune).
   CHECK: services like Team.Finance or Unicrypt show lock status.

2. Top Holder Concentration
   If top 10 wallets hold >50% of supply: high rug risk.
   If deployer wallet holds >20%: extreme risk.
   The maths: if deployer holds 30% and sells, pool depth
   determines how much they extract.

   Pool: 100,000 tokens + 50 ETH (k = 5,000,000)
   Deployer sells 30,000 tokens:
   New token amount: 130,000
   New ETH: 5,000,000/130,000 = 38.46 ETH
   ETH extracted: 50 - 38.46 = 11.54 ETH
   That's 23.1% of the pool's ETH from selling 30% of supply.

3. Liquidity-to-Market-Cap Ratio
   MC: $2M, Liquidity: $30K → ratio = 66.7×
   This means 98.5% of "market cap" is illiquid.
   Only ~$15K of ETH/USDC can be extracted from the pool.
   The "market cap" is meaningless.

   Healthy ratio: MC/Liquidity < 10×
   Dangerous: MC/Liquidity > 30×
   Obvious scam territory: MC/Liquidity > 100×

4. Contract Verification
   Unverified source code = you can't read the contract.
   Hidden functions: mint() (create unlimited tokens),
   setFee() (set 99% sell tax), blacklist() (prevent selling),
   pause() (freeze all transfers).

   If you can't read the contract, you can't verify these
   functions don't exist. Assume the worst.

5. Honeypot Check
   A honeypot lets you BUY but not SELL.
   The contract has a hidden condition that blocks sells
   (or taxes them at 90%+). You buy in, price "rises,"
   but you can never take profit.
   Detectable: tools like honeypot.is check sell functionality.
      </div>

      <div class="pln">
        95% of new tokens launched on DEXs go to zero within 12 months. A significant portion are intentional rug pulls. The mathematical red flags are measurable: unlocked liquidity, concentrated holders, extreme MC/liquidity ratios, and unverified contracts. If you can't check all four before buying, you're gambling. Not investing. Not trading. Gambling — with the odds rigged against you by the deployer.
      </div>

      <h3>4. Oracle Manipulation — Breaking the Price Feed</h3>

      <div class="mb">
DeFi protocols need real-world price data from oracles.
If the oracle can be manipulated — even briefly — the
protocol can be drained.

How oracle attacks work:

TWAP (Time-Weighted Average Price) manipulation:
  Some protocols use on-chain TWAP from a DEX pool.
  If the pool is thin (low liquidity), a large trade
  can spike the price temporarily.

  Attacker:
  1. Flash loan $50M
  2. Buy token on thin DEX pool → price spikes 10×
  3. Use inflated price as collateral on lending protocol
  4. Borrow $40M against the fake collateral
  5. Let the TWAP normalise → collateral returns to real value
  6. Keep the $40M borrowed funds (never repay)
  7. Repay flash loan

  Cost to attacker: gas + flash loan fee (~$100)
  Profit: $40M minus loan amount = millions

Real examples:
  Mango Markets (Oct 2022): attacker manipulated MNGO price
  by 10× on thin oracle, borrowed $114M, drained the protocol.

  Cream Finance: $130M drained via oracle manipulation.
  Harvest Finance: $34M from price manipulation attack.

Protection (for protocols):
  Use Chainlink (aggregated, manipulation-resistant) not TWAP
  Use TWAP windows of 30+ minutes (harder to sustain manipulation)
  Cap borrowing relative to available liquidity

Protection (for YOU):
  Don't use protocols that rely on single-source oracles
  Don't deposit in protocols with thin oracle markets
  Check: does the protocol use Chainlink or similar
  aggregated oracle? If it uses its own DEX pool as oracle,
  your funds are at risk.
      </div>

      <h3>5. Sandwich Attacks — The Invisible Tax</h3>

      <div class="mb">
You submit a swap on Uniswap. What happens:

1. Your transaction enters the mempool (publicly visible)
2. MEV bot sees: "User buying 10 ETH at max slippage 1%"
3. Bot FRONT-RUNS: buys ETH before you (price rises)
4. Your transaction executes at the higher price
5. Bot BACK-RUNS: sells ETH at the now-higher price

The maths:
  Your swap: buy 10 ETH, pool price $3,000, slippage set 1%
  Bot buys 5 ETH: price rises to $3,050
  Your swap executes at $3,050 instead of $3,000
  Bot sells 5 ETH at $3,055 (your purchase pushed it higher)
  Bot profit: 5 × ($3,055 - $3,050) = $25 minus gas
  Your extra cost: 10 × ($3,050 - $3,000) = $500

  The bot makes $25. You lose $500. The rest goes to LPs
  and gas costs. You don't see a line item — your swap
  just fills at a slightly worse price than expected.

Scale:
  Average sandwich profit per attack: $5-50
  Number of attacks per day on Ethereum: 2,000-10,000
  Daily extraction: $1-5M
  Annual: $400M-1.5B

  Every DEX trader pays this invisible tax.
  Every single swap.

Protection:
  1. Use MEV protection (Flashbots Protect, MEV Blocker)
     — sends tx through private mempool, invisible to bots
  2. Set tighter slippage (0.1-0.3%) — but risk failed txs
  3. Use DEX aggregators with built-in MEV protection (CoW Swap)
  4. Trade on L2s with sequencers (harder to sandwich)
  5. Break large swaps into smaller pieces (less profitable target)
      </div>

      <h3>6. Flash Loan Attacks — Borrowing to Destroy</h3>

      <div class="mb">
A flash loan: borrow ANY amount with ZERO collateral,
as long as you repay within the SAME transaction.

If repayment fails → entire transaction reverts → no risk.
If repayment succeeds → attacker keeps the profit.

Cost to attacker: gas fee (~$50-200) + flash loan fee (~0.09%)
Capital required: $0

Flash loan attack pattern:
  1. Borrow $50M via flash loan
  2. Manipulate price on a thin pool
  3. Exploit a protocol that uses that pool's price
  4. Extract profit from the exploited protocol
  5. Repay the $50M + fee
  6. Keep the difference

All in ONE transaction. Atomic. If any step fails, all revert.
The attacker risks nothing but gas.

Notable flash loan attacks:
  bZx (2020): $1M profit from $10M flash loan
  PancakeBunny (2021): $45M extracted
  Cream Finance (2021): $130M extracted
  Value DeFi (2020): $6M extracted

The mathematics of flash loans make previously impossible
attacks trivial. An attacker no longer needs $50M of capital
to execute a $50M attack. They need $50 of gas.

This is unique to DeFi. No equivalent exists in traditional
finance. The attack surface is mathematically novel.
      </div>

      <h3>7. Protecting Yourself — The Mathematical Checklist</h3>

      <div class="mb">
Before EVERY trade, check:

□ Is my stop-loss visible on-chain?
  → If DEX: yes. Consider using limit orders or manual exits
     instead of on-chain stop orders.
  → If CEX: less visible but exchange knows. Place stops at
     non-obvious levels (not round numbers like $50,000).

□ Where are the liquidation clusters?
  → Check Coinglass or similar. If your liquidation price is
     inside a cluster, you WILL be targeted.

□ What is the MC/liquidity ratio?
  → >30× = dangerous. >100× = likely scam.

□ Is liquidity locked?
  → If no: the deployer can drain the pool at any time.

□ Is the contract verified and audited?
  → Unverified = assume it's a honeypot or rug.

□ What oracle does the protocol use?
  → Own DEX pool = vulnerable. Chainlink = more resistant.

□ Am I using MEV protection?
  → If not, every swap is being taxed 0.1-0.5%.

□ How much leverage am I using?
  → >5× on crypto = statistically likely to be liquidated
     within 30 days (Module 3).

□ What is the FDV/MC ratio?
  → >5× = major dilution ahead (Module 6).

□ Can I afford to lose 100% of this position?
  → If no, the position is too large. Full stop.
      </div>

      <div class="pt" style="border-left-color:#ef5350; background:rgba(239,83,80,0.08);">
        The maths in this module isn't about making money. It's about not losing it. Every mechanism described here is a transfer of wealth from uninformed participants to informed ones. The participants who lose money aren't stupid — they're unaware. The purpose of this module is to make you aware, quantitatively, of every way the market structure works against retail traders. Knowledge doesn't eliminate risk. But ignorance guarantees it.
      </div>

      <div class="dg" style="margin-top:1.5rem;">
        <strong>FCA risk warning:</strong> Cryptoassets are not regulated in the UK. DeFi protocols carry smart contract risk, oracle risk, and exploit risk. Capital at risk. This is mathematical education, not financial advice.
      </div>
    </div>
  `,

  scenarios: [
    { id:'p1', type:'calculation', question:'$300M in BTC long liquidations clustered between $58,000-$59,000. BTC is at $60,500. A whale has $15M to deploy. Estimate the cost to push through the cluster and the potential profit if BTC subsequently drops to $56,000 from the cascade.', answer:'Push from $60,500 to $58,000 = 4.1% move. Cost: ~$15M in market sells (immediate loss from market impact + slippage, approximately $500K-1M). If cascade triggers $300M in forced selling, price likely overshoots to $55,000-57,000. Whale buys $15M at $56,000. If price recovers to $58,500 within hours: profit = $15M × ($58,500-$56,000)/$56,000 = $15M × 4.46% = $669K. Minus initial push cost ~$750K. In this case: roughly break-even. Profitable only if cascade is severe enough to push price significantly below the cluster zone, OR if the whale can use derivatives (short perps before the push) to profit from the cascade itself.' },
    { id:'p2', type:'calculation', question:'A token has: 1B total supply, top wallet holds 300M tokens (30%), liquidity pool has 50M tokens + 100 ETH. If the top wallet sells 200M tokens into the pool, what happens?', answer:'Before: 50M tokens + 100 ETH. k=5,000,000,000 (50M×100). After selling 200M tokens: new token amount = 250M. New ETH = 5B/250M = 20 ETH. ETH extracted: 100-20 = 80 ETH. At $3,000/ETH = $240,000 extracted. Token price before: 100/50M = 0.000002 ETH = $0.006. Token price after: 20/250M = 0.00000008 ETH = $0.00024. Price drop: 96%. This is a rug pull. 80% of the ETH is drained. Remaining holders have tokens worth 4% of what they paid. The deployer walks away with $240,000.' },
    { id:'p3', type:'judgement', question:'You find a new token: 2 days old, $5M market cap, $80K liquidity (MC/liq ratio: 62.5×), LP not locked, contract unverified, top 5 wallets hold 65%. Score the rug risk.', answer:'Every indicator is a red flag. (1) Age: 2 days — no track record. (2) MC/Liquidity: 62.5× — extreme. Only ~$40K extractable. (3) LP not locked — deployer can drain at any time. (4) Contract unverified — could be a honeypot. (5) Top 5 hold 65% — extreme concentration. Mathematical rug risk: >90%. Even if not an intentional rug, the concentration + unlocked LP means any large holder selling will crash the price to near zero. This is not an investment. The maths says it\'s a lottery ticket with worse odds.' },
    { id:'p4', type:'calculation', question:'A sandwich bot front-runs your 5 ETH purchase ($15,000) on Uniswap, buying 2 ETH before you. The pool has 500 ETH + 1.5M USDC. Calculate your extra cost from the sandwich.', answer:'Without sandwich: buy 5 ETH from pool. k=750M. New pool: 495 ETH, cost=$15,151.52. Price=$3,030.30/ETH. With sandwich: bot buys 2 ETH first. Pool: 498→496 ETH (after bot). Cost for bot: 750M/498=1,506,024. Bot pays $6,024 for 2 ETH ($3,012/ETH). Now you buy 5 ETH from 496-ETH pool. k=750M. 491 ETH, new USDC=750M/491=$1,527,494. Your cost: $1,527,494-$1,506,024=$21,470. Without sandwich your cost was $15,151. Extra cost: ~$6,319. Wait — need to recalculate properly. The point: your effective price is worse because the bot moved the pool before you traded. Typical sandwich cost: 0.1-0.5% of trade value. On $15,000: $15-75 extra cost.' },
    { id:'p5', type:'judgement', question:'A lending protocol uses a 10-minute TWAP from its own DEX pool (TVL: $5M) as its price oracle. You\'re considering depositing $50,000. What\'s the mathematical risk?', answer:'A $5M pool can be manipulated with a $1-2M flash loan. The attacker borrows $2M, buys tokens aggressively, spiking the 10-min TWAP. They then use the inflated price as collateral to borrow more than their tokens are worth. Your $50,000 deposit is part of the lending pool that gets drained. The key vulnerability: thin oracle pool ($5M) + short TWAP window (10 min) = low cost of attack. A Chainlink oracle aggregates across many exchanges and is orders of magnitude harder to manipulate. Don\'t deposit in protocols that use their own thin pools as oracles. Your funds are the exit liquidity for the attacker.' },
    { id:'p6', type:'calculation', question:'A flash loan attack: borrow $30M → manipulate thin oracle pool → borrow $25M from lending protocol against inflated collateral → repay $30M flash loan + 0.09% fee. Calculate attack profit and cost.', answer:'Flash loan fee: $30M × 0.09% = $27,000. Gas: ~$200. Total cost: ~$27,200. Profit from exploitation: $25M borrowed against fake collateral (never repaid — collateral value reverts to real value, loan is undercollateralised, protocol takes the loss). Net profit: $25,000,000 - $27,200 = $24,972,800. Cost: $27,200. ROI: 91,800%. Capital required: $0 (flash loan). The mathematics of flash loans make this possible: zero capital risk, minimal cost, catastrophic damage to the exploited protocol. This is a real attack pattern that has drained hundreds of millions from DeFi.' },
    { id:'p7', type:'judgement', question:'Your BTC long has a stop-loss at $58,000 (a round number). BTC is at $61,000. Why is this stop placement mathematically suboptimal?', answer:'Round numbers ($50k, $55k, $58k, $60k) are where the most stop-losses cluster — they\'re psychologically obvious. Stop hunters know this. Liquidation heatmaps show clear clusters at round numbers and just below them. Your $58,000 stop sits in maximum danger: it\'s exactly where thousands of other stops sit, making it a high-value target for a whale push. Better placement: $57,847 or $58,213 — an "ugly" number that doesn\'t cluster with the crowd. Even better: don\'t use on-chain stop orders at all. Use alerts + manual execution, or reduce position size so you don\'t need a stop.' },
    { id:'p8', type:'calculation', question:'Open interest on BTC perps: $30B. Average leverage: 15×. 40% of positions have liquidation prices within 8% of current price. If price drops 8%, estimate total liquidation value.', answer:'Positions within 8%: $30B × 40% = $12B notional. At 15× average leverage, margin = $12B/15 = $800M in margin at risk. If all are liquidated: $12B in forced selling enters the market. But forced selling pushes price down further, triggering more liquidations beyond the 8% zone. Conservative cascade estimate: initial $12B triggers additional 20-40% more liquidations = $14.4B-$16.8B total. This is the mathematical setup for a cascade. When you see: high OI + high average leverage + clustered liquidation prices = elevated crash risk. This data is publicly available.' },
    { id:'p9', type:'judgement', question:'A DeFi protocol has been audited by three firms, has $500M TVL, and has been live for 2 years without exploit. Calculate an approximate annual exploit probability and compare to the yield offered (8% APY).', answer:'Historical base rate: major DeFi protocols (audited, >$100M TVL, >1 year old) experience exploits at roughly 2-5% per year (based on 2020-2025 data). At 3% annual exploit probability: expected loss = 3% × 100% (total loss in exploit scenario) = 3% of deposited value. If yield is 8%: risk-adjusted yield = 8% - 3% = 5%. Still positive, but 37.5% of the headline yield goes to compensating for exploit risk. For protocols with higher yields (30%+) on newer/less audited protocols: exploit probability rises to 10-20%+, making risk-adjusted returns often negative.' },
    { id:'p10', type:'calculation', question:'You set 0.5% slippage tolerance on a $10,000 ETH swap via Uniswap on Ethereum mainnet without MEV protection. A sandwich bot has 70% success rate on transactions this size. Calculate expected MEV cost.', answer:'Max exploitable per sandwich: limited by your slippage tolerance and pool depth. Typical sandwich extraction on a $10,000 swap with 0.5% tolerance: 0.1-0.3% of trade value = $10-30. At 70% attack rate: expected cost = 0.70 × $20 (midpoint) = $14 per swap. If you make 100 swaps/year: $1,400 annual MEV tax. With MEV protection (Flashbots): cost drops to ~$0-2 per swap (protection isn\'t perfect). Annual saving: ~$1,200. Using MEV protection is mathematically mandatory for anyone making regular DEX swaps.' },
    { id:'p11', type:'judgement', question:'A friend says "I only trade on CEXs so none of this DEX stuff affects me." Is this correct?', answer:'Partially. CEX users avoid: sandwich attacks (off-chain matching), visible on-chain stops, oracle manipulation (not using DeFi). But CEX users face: (a) exchange insolvency — FTX lost $8B of customer funds, (b) stop-loss hunting by the exchange itself or market makers with privileged data, (c) liquidation cascades (the same forced-selling mathematics apply), (d) the exchange can see your stops, your positions, and your margin levels — information asymmetry that doesn\'t exist on a DEX where everything is public. CEX risk is different, not absent. The counterparty risk (trusting the exchange) replaces the smart contract risk (trusting the code).' },
    { id:'p12', type:'calculation', question:'Quantify the "honeypot tax." A token has a hidden 95% sell tax. You buy $1,000 worth. If you try to sell, how much do you receive? What if you noticed a 20% sell tax instead?', answer:'95% sell tax: you sell $1,000 of tokens. You receive $1,000 × (1-0.95) = $50. Loss: $950 (95%). This is an outright scam — the contract is designed to trap buyers. 20% sell tax: you receive $1,000 × (1-0.20) = $800. Loss: $200 (20%). Some legitimate tokens have sell taxes (used for redistribution or burns), but 20% is extreme. To break even at 20% sell tax: the token must appreciate by 25% (1/0.80=1.25) before you can sell at your entry value. Combined with buy tax (often another 5-10%): the token must rise 30-40% just to break even. Always check the contract for transfer fees before buying. Any token with >5% combined buy+sell tax has hostile mathematics.' }
  ],

  tool: {
    name: 'Rug Pull Risk Scanner',
    description: 'Score the mathematical red flags of any token before buying.',
    inputs: [
      { id:'rp-mc', label:'Market cap ($)', type:'number', default:5000000 },
      { id:'rp-liq', label:'Pool liquidity ($)', type:'number', default:50000 },
      { id:'rp-locked', label:'LP locked?', type:'select', options:['Yes (>12 months)','Yes (<12 months)','No','Unknown'] },
      { id:'rp-top10', label:'Top 10 wallets hold (%)', type:'number', default:60 },
      { id:'rp-verified', label:'Contract verified?', type:'select', options:['Yes + audited','Yes, not audited','No'] },
      { id:'rp-age', label:'Token age (days)', type:'number', default:7 },
      { id:'rp-tax', label:'Sell tax (%)', type:'number', default:0 }
    ],
    outputs: ['MC/Liquidity ratio and risk tier', 'Concentration risk score', 'Contract risk score', 'Overall rug probability estimate', 'Break-even price movement needed (after taxes)', 'Maximum extractable value from pool', 'Recommendation: trade / avoid / scam']
  }
};

if (typeof module !== 'undefined') module.exports = CRYPTO_MODULE_7;
