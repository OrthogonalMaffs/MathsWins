// crypto-m1-landscape.js
// Module 1: The Crypto Landscape — Chains, Tokens, Liquidity & the Language of DeFi
// Crypto Trading Maths — MathsWins Academy
// Tier: Free taster
// Accent: #f97316 (orange)

const CRYPTO_MODULE_1 = {
  id: 1,
  title: 'The Crypto Landscape — Chains, Tokens, Liquidity & the Language of DeFi',
  tier: 'free',
  accent: '#f97316',

  tutorial: `
    <div class="tut">
      <h2>Module 1: The Crypto Landscape</h2>

      <div class="pt" style="border-left-color:#f97316; background:rgba(249,115,22,0.08);">
        Before we can teach the mathematics of crypto trading, we need to establish a shared vocabulary and a clear understanding of the objects involved. Most crypto education skips this — they assume you already speak the language. We don't assume anything except that you can do arithmetic. By the end of this module, you'll understand what blockchains are and how they differ, what tokens represent, the three mathematical models behind stablecoins, how liquidity pools work at the formula level, and every term you'll need for the remaining nine modules.
      </div>

      <h3>1. What Is a Blockchain?</h3>

      <p>Strip away the hype and a blockchain is a data structure. Specifically, it's a linked list of blocks where each block contains a cryptographic hash of the previous block, a timestamp, and a set of transactions. The "crypto" in cryptocurrency refers to the cryptography that secures this chain — not to the assets themselves.</p>

      <div class="mb">
A block contains:
  Block number (height)
  Hash of previous block (32-byte SHA-256 or equivalent)
  Timestamp
  List of transactions
  Validator signature (proof-of-stake) or nonce (proof-of-work)

Block N:   hash(Block N-1) + transactions → hash(Block N)
Block N+1: hash(Block N)   + transactions → hash(Block N+1)

Changing ANY data in Block N changes hash(Block N),
which breaks the reference in Block N+1,
which breaks Block N+2, and so on.

To alter history, you'd need to recompute every subsequent
block faster than every other validator on the network combined.

Proof-of-work cost to attack Bitcoin (51% attack):
  Current hashrate: ~600 EH/s
  51% requires: ~306 EH/s
  Hardware cost: ~$15-20 billion
  Electricity cost: ~$30 million per day
  It's not impossible. It's just uneconomical.

Proof-of-stake cost to attack Ethereum:
  Must control 33% of staked ETH for disruption
  33% of ~30 million ETH = ~10 million ETH ≈ $30 billion
  Plus: your own stake gets slashed if caught.
  The attack destroys your capital. Game-theoretically irrational.
      </div>

      <div class="pln">
        A blockchain is a spreadsheet that nobody can secretly edit because every row contains a mathematical fingerprint of the row before it. Change one entry and every fingerprint breaks. The security comes from the cost of rewriting history — either the electricity bill (proof-of-work) or the capital at risk (proof-of-stake). It's not magic. It's economics backed by cryptography.
      </div>

      <h3>2. How Chains Differ — The Blockchain Trilemma</h3>

      <p>Not all blockchains are the same. They make different trade-offs, and understanding those trade-offs matters when you're deciding where to hold assets and execute trades.</p>

      <div class="mb">
The Blockchain Trilemma (Buterin, 2017):

You can optimise for two of three properties:
  1. Decentralisation — many independent validators
  2. Security — cost of attacking the network
  3. Scalability — transaction throughput

Chain comparison:

┌────────────┬──────────┬───────────┬───────────┬──────────────┐
│   Chain    │   TPS    │ Block Time│ Finality  │  Validators  │
├────────────┼──────────┼───────────┼───────────┼──────────────┤
│ Bitcoin    │    ~7    │  ~10 min  │  ~60 min  │  ~15,000     │
│ Ethereum   │  ~15-30  │  ~12 sec  │  ~15 min  │  ~900,000+   │
│ Arbitrum   │ ~4,000   │  ~0.25s   │  ~7 days* │  Inherits L1 │
│ Solana     │ ~4,000   │  ~0.4s    │  ~12 sec  │  ~2,000      │
│ Polygon    │ ~7,000   │  ~2 sec   │  ~30 min  │  ~100        │
│ QF Network │  High    │  ~0.1s    │  Seconds  │  Smaller set │
└────────────┴──────────┴───────────┴───────────┴──────────────┘

*Arbitrum finality: transactions are "soft final" in seconds
 but withdrawal to Ethereum L1 requires 7-day challenge period.

Trading implication:
  Fast chain (Solana, QF): can execute trades quickly,
    but may have fewer validators and different trust model.
  Slow chain (Bitcoin, Ethereum L1): higher security guarantees
    but expensive and slow for frequent trading.
  Layer 2 (Arbitrum, Polygon): fast and cheap
    with L1 security guarantees, but bridging adds delay.
      </div>

      <div class="pln">
        Every blockchain makes trade-offs. Bitcoin chose maximum security and decentralisation at the cost of speed — you can't day-trade on Bitcoin's base layer. Solana chose speed at the cost of some decentralisation — fewer validators means faster consensus but a smaller set of entities securing the network. Layer 2 chains like Arbitrum try to get the best of both worlds by doing the work off Ethereum and posting summaries back. There is no "best" chain. There are trade-offs, and the mathematics of those trade-offs matter for your trading.
      </div>

      <h3>3. Layer 1 vs Layer 2</h3>

      <p>A Layer 1 (L1) is a base blockchain: Bitcoin, Ethereum, Solana. A Layer 2 (L2) is a system built on top of an L1 that processes transactions off the main chain and periodically settles back to it.</p>

      <div class="mb">
Two L2 approaches:

Optimistic Rollups (Arbitrum, Optimism, Base):
  Execute transactions off-chain → post data to L1
  Assume valid UNLESS challenged within ~7 days
  Pro: cheap to run
  Con: slow withdrawal (must wait challenge period)
  Trust model: honest minority assumption
    (only ONE challenger needs to be honest)

ZK-Rollups (zkSync, StarkNet, Polygon zkEVM):
  Execute transactions off-chain → generate mathematical proof
  → post proof + compressed data to L1
  Pro: fast withdrawal (proof verifiable in minutes)
  Con: expensive to generate proofs (compute-intensive)
  Trust model: mathematical certainty
    (proof is verified by L1 smart contract)

Cost comparison for a token swap:
  Ethereum L1:   ~$5-50  (varies with congestion)
  Arbitrum:      ~$0.10-0.50
  Polygon:       ~$0.01-0.05
  Solana:        ~$0.001-0.01
  QF Network:    ~$0 (near-zero gas)

For a $200 trade, $50 in Ethereum gas is 25% of your trade.
On L2, the same swap costs under $1 — a 50× difference.
Choosing the right chain isn't preference. It's mathematics.
      </div>

      <div class="pln">
        Layer 2 chains are like branch offices that do the work locally and send a summary to head office. Optimistic rollups send the summary and say "challenge me if I'm wrong — you've got 7 days." ZK-rollups send a mathematical proof that the summary is definitely correct. Both make transactions cheaper by 10-100× while inheriting the security of Ethereum.
      </div>

      <h3>4. Tokens — What They Actually Are</h3>

      <div class="mb">
A token is a balance entry in a smart contract. Nothing more.

ERC-20 (fungible token — the standard):
  contract MyToken {
      mapping(address => uint256) public balances;
  }

When you "own" 100 USDC, what exists on-chain is:
  balances[0xYourAddress] = 100000000  (6 decimal places)

There is no "coin." No file. No physical object.
A number in a mapping. That's it.

Creating a token costs ~$5-50 in gas.
No permission required. No approval. No backing needed.
Anyone can deploy an ERC-20 in under 10 minutes.

This is why there are 2+ million tokens.
A token's EXISTENCE tells you nothing about its VALUE.

Key numbers:
  Total ERC-20 tokens on Ethereum: ~600,000+
  Total across all chains: 2,000,000+
  Tokens with >$1M market cap: ~3,000
  Tokens with >$1B market cap: ~50
  Tokens that reach zero within 12 months of launch: ~95%
      </div>

      <div class="pln">
        Understanding that a token is just a number in a database is the first step to not getting rugged. If someone tells you their new token is "the next Bitcoin," remember: they created it in 10 minutes for $20. The question isn't "does it exist?" — everything exists. The question is "does the mathematics of its supply, demand, and utility justify the price?" That's what the rest of this course teaches you to evaluate.
      </div>

      <h3>5. Stablecoins — Three Mathematical Models</h3>

      <p>Stablecoins are designed to maintain a $1 peg. There are three fundamentally different approaches, each with distinct mathematical properties and failure modes. Understanding which type you're holding — and its specific risk model — is not optional.</p>

      <h4>Model 1: Fiat-Collateralised (USDC, USDT)</h4>

      <div class="mb">
Mechanism: 1 token is backed by $1 held in reserve.
  Reserves: bank deposits, US Treasury bills, commercial paper.

Peg maintenance via arbitrage:

  If USDC = $0.99 on exchange:
    Buy USDC at $0.99 → redeem from Circle for $1.00
    Profit: $0.01 per token (1.01%)
    Buying pressure pushes USDC back to $1.00

  If USDC = $1.01:
    Mint USDC by depositing $1.00 → sell for $1.01
    Selling pressure pushes USDC back to $1.00

Risk: counterparty.
  March 2023: USDC depegged to $0.87 when Silicon Valley Bank
  collapsed. Circle held ~$3.3B of $40B reserves at SVB.
  Maximum theoretical shortfall: 8.25%.
  Market overshot to 13% discount (panic > maths).
  Peg restored within 72 hours after FDIC guarantee.

Mathematical model: fixed exchange rate with arbitrage bounds.
Peg stability = f(reserve quality, redemption speed, trust)
      </div>

      <h4>Model 2: Crypto-Collateralised (DAI, LUSD)</h4>

      <div class="mb">
Mechanism: overcollateralised lending.
  To mint 100 DAI ($100), deposit ≥$150 of ETH as collateral.
  Minimum collateral ratio: 150%.

Why overcollateralised?
  Because ETH is volatile. If ETH drops 30%, your $150
  collateral becomes $105 — still above $100 DAI.
  At 150% minimum, ETH can drop 33% before the peg is at risk.

Liquidation price calculation:
  Deposit 1 ETH at $3,000 → mint 1,500 DAI
  Collateral ratio: $3,000 / $1,500 = 200%
  Liquidation threshold: 150%
  Liquidation price: $1,500 × 1.50 / 1 = $2,250

  If ETH drops to $2,250 → LIQUIDATION
  Your ETH is sold to repay the 1,500 DAI + 13% penalty.

Cascade risk:
  March 2020 "Black Thursday": ETH fell 43% in 24 hours.
  Mass liquidations → selling pressure → more price drops
  → more liquidations. DAI briefly hit $1.10 as demand surged
  (people needed DAI to repay loans and avoid liquidation).
  The cascade is a positive feedback loop with real consequences.
      </div>

      <h4>Model 3: Algorithmic (UST/LUNA — collapsed May 2022)</h4>

      <div class="mb">
Mechanism: mint/burn arbitrage between paired tokens.
  1 UST could always be burned for $1 of LUNA (and vice versa).

The death spiral — derived mathematically:

  Let S = UST supply, P_L = LUNA price, Q_L = LUNA supply

  Normal: UST = $0.99 → arbitrageurs burn UST, mint LUNA, sell
          Buying pressure restores peg. Works when P_L is stable.

  Under stress:
    1. Confidence drops → UST selling → UST = $0.95
    2. Arbitrageurs burn UST for $1 of LUNA → new LUNA minted
       New LUNA minted per UST: 1 / P_L
    3. New LUNA supply = Q_L + (redeemed UST / P_L)
    4. Increased LUNA supply → P_L drops
    5. Lower P_L → MORE LUNA minted per UST burned (step 2)
    6. → Q_L explodes → P_L collapses → repeat

  This is a reflexive feedback loop. The mechanism that
  stabilises in calm conditions ACCELERATES collapse
  under stress. It's not a bug — it's the design.

  May 2022 — the actual numbers:
    UST supply at peak: ~$18.7 billion
    LUNA supply: 350 million → 6.5 TRILLION (18,571× increase)
    LUNA price: $80 → $0.00001 (8 million × decrease)
    UST: $1.00 → $0.02
    ~$40 billion destroyed in 7 days

  The mathematics were published BEFORE the collapse.
  Multiple researchers identified the death spiral risk.
  It happened anyway because incentives (20% yield on Anchor
  protocol) attracted capital faster than risk was priced.
      </div>

      <div class="dg">
        The UST/LUNA collapse was the single largest destruction of value in DeFi history. The mathematical vulnerability — a reflexive feedback loop — was known and published before it happened. If someone proposes a new algorithmic stablecoin, ask for the mathematical proof of stability under stress. If they can't provide one, you have your answer. $40 billion of other people's money already proved the point.
      </div>

      <div class="pln">
        Stablecoins look the same from the outside — they're all roughly $1. But the mathematics behind each type is completely different. Fiat-backed depends on trust in the issuer. Crypto-backed depends on overcollateralisation and liquidation mechanics. Algorithmic depends on a feedback loop that works beautifully in good times and self-destructs spectacularly in bad times. Know which type you hold. Know its failure mode.
      </div>

      <h3>6. Liquidity Pools & Automated Market Makers</h3>

      <div class="mb">
Traditional order book:
  Bid: "I'll buy 1 ETH at $2,990"
  Ask: "I'll sell 1 ETH at $3,010"
  Spread: $20 (0.67%)
  Trade: buyer and seller are matched.

Automated Market Maker (AMM):
  A pool holds two tokens. A formula determines the price.

Constant Product Formula (Uniswap v2):

  x × y = k

  x = quantity of Token A in pool
  y = quantity of Token B in pool
  k = constant (preserved during every swap)

  Pool: 100 ETH × 300,000 USDC = 30,000,000 (k)
  Spot price: y / x = 300,000 / 100 = $3,000 per ETH

Buying 1 ETH:
  New x = 99, new y = 30,000,000 / 99 = 303,030.30
  Cost: 303,030.30 - 300,000 = $3,030.30
  Effective price: $3,030.30   Price impact: 1.01%

Buying 10 ETH:
  New x = 90, new y = 333,333.33
  Cost: $33,333.33   Effective price: $3,333.33
  Price impact: 11.1%

Buying 50 ETH:
  New x = 50, new y = 600,000
  Cost: $300,000   Effective price: $6,000
  Price impact: 100%

Price impact scales super-linearly with trade size.
This is a mathematical property of x × y = k.
Unavoidable. Predictable. Calculable.
      </div>

      <div class="pln">
        A liquidity pool is a pot of two tokens managed by a formula. When you trade, you're buying from the formula, not from a person. The formula always gives you a price, but the price gets worse the more you buy relative to the pool's size. A $100 trade in a $1M pool barely moves the price. A $100,000 trade in the same pool moves it catastrophically. This is price impact — pure mathematics, and the reason why trade size relative to pool depth is the most important number in DeFi trading.
      </div>

      <h3>7. Liquidity Providers — Who Fills the Pool</h3>

      <div class="mb">
Anyone can deposit tokens into a liquidity pool.
Deposit both tokens in equal dollar value → receive LP tokens
representing your share of the pool.

Deposit: 1 ETH ($3,000) + 3,000 USDC into a $600,000 pool.
Your share: $6,000 / $606,000 = 0.99%

Revenue: trading fees.
  Every swap pays a fee (Uniswap v2: 0.30%)
  Fees accumulate in the pool proportionally.

  Pool processes $1,000,000 daily volume:
    Daily fees: $1,000,000 × 0.30% = $3,000
    Your 0.99% share: $29.70/day
    Annual: $10,840   APR on $6,000: 180.7%

  That looks incredible. Three things eat into it:

  1. IMPERMANENT LOSS (Module 4)
     If ETH price moves vs USDC, the pool rebalances your
     position — you end up with more of the falling token.
     At 2× price change: IL = -5.7% of position.

  2. GAS COSTS
     Depositing, withdrawing, compounding: $20-100 each on L1.
     Weekly compounding: 52 × $50 = $2,600/year.

  3. SMART CONTRACT RISK
     If the contract has a bug, your funds can be drained.
     DeFi exploits in 2022: $3.8 billion stolen.
     No hedge exists for this risk.

  Real APR after deductions (estimate):
    Gross:                    180.7%
    Impermanent loss (est.):   -2.0%
    Gas (weekly, Ethereum L1): -43.3%
    Smart contract risk:        -3.0%
    Net:                      ~132.4%

  Still attractive — but 48 percentage points below headline.
  On smaller deposits, gas alone destroys the return.
      </div>

      <div class="pln">
        Liquidity providers earn real trading fees. But the headline APR hides three costs: impermanent loss (the mathematical penalty for providing liquidity to a volatile pair), gas (the fixed cost of every transaction), and smart contract risk (the non-zero chance the protocol gets exploited). We'll derive impermanent loss from first principles in Module 4. For now, know this: if someone advertises a 200% APR pool, ask what the APR looks like after IL, gas, and risk. The answer is always lower — sometimes dramatically.
      </div>

      <h3>8. Gas, Slippage & MEV — The Hidden Costs</h3>

      <div class="mb">
GAS — cost of on-chain computation:

  Ethereum examples at 30 gwei, ETH = $3,000:
    ETH transfer:        21,000 gas = $1.89
    Token transfer:      65,000 gas = $5.85
    Uniswap v3 swap:    185,000 gas = $16.65
    Complex DeFi:       300,000 gas = $27.00

  At 300 gwei (congested):
    Uniswap swap: $166.50

  Gas is FIXED per transaction. It doesn't scale with trade size.
  $200 swap at 300 gwei: gas = 83% of trade value.
  $20,000 swap at 300 gwei: gas = 0.83%.
  Small trades are proportionally destroyed by gas.

SLIPPAGE — gap between expected and executed price:
  1. Price impact (from constant product formula) — calculable
  2. Price movement during execution (5-30 seconds in mempool)
  Tolerance: typically 0.5-1%. Exceeds tolerance → reverts.

MEV — the invisible tax:
  Validators see your pending transaction. Profitable attacks:

  Sandwich attack:
    Bot buys before you (front-run) → your trade executes at
    worse price → bot sells after you (back-run) → profit.
    Your cost: typically 0.1-0.5% additional slippage per swap.
    You don't see it as a line item. You just get a worse price.

  MEV extracted from Ethereum: ~$200-685 million per year.

  Protection: MEV-protection services (Flashbots Protect,
  MEV Blocker) hide your transaction from the public mempool.
      </div>

      <div class="pln">
        Every on-chain trade has three costs beyond the exchange fee: gas (fixed per transaction — destroys small trades), slippage (the price moving during execution), and MEV (bots front-running you for profit). Choosing the right chain for your trade size isn't a preference — it's a mathematical necessity. A $200 swap on Ethereum L1 during congestion can lose over 80% to gas alone. The same swap on Arbitrum costs pennies.
      </div>

      <h3>9. Bridges — Moving Between Chains</h3>

      <div class="mb">
A bridge moves tokens between blockchains.

Mechanism:
  1. Lock tokens on source chain (bridge contract)
  2. Mint "wrapped" tokens on destination chain
  3. To return: burn wrapped tokens, unlock originals

Costs:
  Bridge fee: 0.01-0.1% of transferred amount
  Gas on both chains: $1-50 total
  Time: 1 minute (fast bridges) to 7 days (native Optimistic)

Bridge risk — the highest-value targets in DeFi:
  Ronin Bridge (March 2022):    $625 million stolen
  Wormhole (February 2022):     $320 million stolen
  Nomad (August 2022):          $190 million stolen
  Harmony Horizon (June 2022):  $100 million stolen
  Total bridge exploits 2022:  ~$1.4 billion

  Bridges hold massive pools of locked assets.
  A single smart contract vulnerability can drain everything.
      </div>

      <div class="dg">
        Bridges are the weak point of multi-chain DeFi. Over $1.4 billion was stolen from bridges in 2022. When you bridge assets, you're trusting a smart contract to hold your tokens. Minimise bridge exposure: don't leave assets in bridges longer than necessary, use established bridges, and never bridge more than you can afford to lose.
      </div>

      <h3>10. CEX vs DEX — The Cost Comparison</h3>

      <div class="mb">
Centralised Exchange (CEX): Binance, Coinbase, Kraken
  - Order book (bid/ask matching)
  - Exchange holds your tokens (custodial)
  - KYC required
  - Tight spreads: 0.01-0.05%
  - No gas for trades (off-chain)
  - Fees: 0.05-0.10%
  - Risk: exchange insolvency (FTX: $8B customer shortfall)

Decentralised Exchange (DEX): Uniswap, Curve, SushiSwap
  - AMM (liquidity pools)
  - You hold your tokens (self-custody)
  - No KYC
  - Spreads vary with pool depth
  - Gas on every trade
  - Fees: 0.01-1.00% (to LPs)
  - Risk: smart contract exploit, MEV

Cost comparison — buying $10,000 of ETH:

  Coinbase Pro (CEX):
    Fee: 0.05% = $5.00
    Spread: ~0.02% = $2.00
    Total: ~$7.00 (0.07%)

  Uniswap on Ethereum L1 (DEX):
    Fee: 0.30% = $30.00
    Gas: ~$15.00
    Slippage + MEV: ~$20.00
    Total: ~$65.00 (0.65%)

  Uniswap on Arbitrum (DEX on L2):
    Fee: 0.30% = $30.00
    Gas: ~$0.30
    Slippage + MEV: ~$15.00
    Total: ~$45.30 (0.45%)

CEX is ~10× cheaper for $10,000 trades.
DEX advantage: self-custody, no KYC, no counterparty risk.
The trade-off: lower cost vs custody of your own assets.
      </div>

      <div class="pln">
        CEXs are cheaper for trading. DEXs are safer for custody. The question is which risk you'd rather take: the risk that the exchange loses your money (as FTX did with $8 billion of customer funds), or the cost of higher trading fees and smart contract risk on a DEX. Neither is risk-free. The maths helps you quantify both sides.
      </div>

      <h3>11. The Vocabulary Reference</h3>

      <div class="mb">
AMM — Automated Market Maker. Formula-based pricing. (M1, M4)
APR — Annual Percentage Rate. Simple interest. (M9)
APY — Annual Percentage Yield. Compound: (1+r/n)^n - 1. (M9)
Arbitrage — Exploiting price gaps for profit. (M1, M5)
Bridge — Cross-chain token transfer contract. (M1)
CEX — Centralised Exchange. Custodial, order book. (M1)
Collateral Ratio — Collateral value / debt value. (M1, M3)
DEX — Decentralised Exchange. Non-custodial, AMM. (M1)
FDV — Fully Diluted Valuation. Price × max supply. (M6)
Funding Rate — Periodic perp payment. Longs↔shorts. (M5)
Gas — On-chain computation cost. Fixed per tx. (M1)
Impermanent Loss — LP cost from price divergence. (M4)
Leverage — Amplified exposure. Nx gains AND losses. (M3)
Liquidation — Forced position closure. Margin = 0. (M3)
LP Token — Pool share receipt. Earns proportional fees. (M1, M4)
Market Cap — Price × circulating supply. (M6)
MEV — Value extracted by tx reordering. Invisible tax. (M1, M7)
Oracle — External data feed for smart contracts. (M7)
Perpetual — No-expiry futures. Uses funding rates. (M5)
Price Impact — Trade-induced price change. ∝ size/depth. (M1, M4)
Rug Pull — Deployer drains liquidity. Exit scam. (M7)
Sandwich — Front-run + back-run attack on your swap. (M1, M7)
Slippage — Expected vs executed price gap. (M1)
TVL — Total Value Locked. Protocol size measure. (M9)
Volatility — σ of log returns. Crypto: 60-200% annual. (M2)
Wrapped Token — Cross-chain representation. (M1)
Yield Farming — Depositing tokens for rewards. (M9)
      </div>

      <h3>12. What This Course Covers</h3>

      <div class="mb">
Module 1:  The Crypto Landscape (this module)          [Free]
Module 2:  Volatility Mathematics                       [Basic]
Module 3:  Leverage & Liquidation                       [Basic]
Module 4:  AMM & Impermanent Loss                       [Basic]
Module 5:  Funding Rates & Perpetual Swaps              [Advanced]
Module 6:  Token Supply & On-Chain Analytics             [Advanced]
Module 7:  Predatory Market Mechanics                    [Advanced]
Module 8:  Correlation & Portfolio Mathematics           [Master]
Module 9:  Stablecoin & Yield Mathematics                [Master]
Module 10: Risk Management for Fat-Tailed Markets        [Master]
      </div>

      <div class="pt" style="border-left-color:#f97316; background:rgba(249,115,22,0.08);">
        Every module includes interactive scenarios and a built-in calculator. The mathematics is real — not simplified, not approximated. If you can follow the calculations in this module, you can follow the entire course. The question isn't whether the maths is hard. It's whether you'd rather learn it now or pay for not knowing it later.
      </div>

      <div class="dg" style="margin-top:1.5rem;">
        <strong>Important:</strong> This is mathematical education, not financial or investment advice. Cryptocurrency trading involves significant risk of loss. Never invest more than you can afford to lose.<br><br>
        <strong>FCA risk warning:</strong> Cryptoassets are not regulated in the UK. The value of cryptoassets can go down as well as up, and you could lose all the money you invest. Capital at risk.
      </div>
    </div>
  `,

  scenarios: [
    {
      id: 'cl1',
      type: 'calculation',
      question: 'You want to execute 20 token swaps per day as part of an arbitrage strategy. Each swap costs approximately 150,000 gas on Ethereum L1 at an average gas price of 40 gwei, with ETH at $3,000. What is your daily gas cost? At what minimum trade size does gas become less than 1% of each trade?',
      answer: 'Gas per swap: 150,000 × 40 × 10⁻⁹ = 0.006 ETH = $18.00. Daily (20 swaps): $360. Annual: $131,400. For gas < 1%: $18 / 0.01 = $1,800 minimum trade size. On Arbitrum at ~$0.30/swap: daily = $6, minimum trade for <1% = $30. This strategy is only viable on L1 if your average trade exceeds $1,800. On L2 it works at $30+.',
      difficulty: 'basic'
    },
    {
      id: 'cl2',
      type: 'judgement',
      question: 'A new Layer 1 blockchain claims 100,000 TPS with 50ms finality and 500 validators. Based on the blockchain trilemma, what trade-off is this chain most likely making?',
      answer: 'Decentralisation. 500 validators is a small set (Ethereum: 900,000+, Solana: ~2,000). High TPS with fast finality and few validators means consensus is achieved quickly because fewer nodes need to agree. Trade-off: higher concentration of power, lower resistance to collusion or censorship, higher hardware requirements per validator. The performance is real, but so is the centralisation risk.',
      difficulty: 'basic'
    },
    {
      id: 'cl3',
      type: 'calculation',
      question: 'You need to bridge $50,000 USDC from Ethereum to Arbitrum. Native bridge: $15 gas, 7-day withdrawal. Fast bridge: 2 minutes, 0.05% fee. What is the opportunity cost of the 7-day lock at 5% APY, and which bridge is cheaper in total?',
      answer: 'Native bridge: $15 gas + opportunity cost ($50,000 × 5% × 7/365 = $47.95) = $62.95. Fast bridge: $50,000 × 0.05% = $25. Fast bridge is $37.95 cheaper when you account for time value. At lower amounts the maths shifts: for $500, fast = $0.25 vs native = $15 + $0.48 = $15.48. Native is almost always worse unless gas is extremely low.',
      difficulty: 'intermediate'
    },
    {
      id: 'cl4',
      type: 'judgement',
      question: 'A friend says "I only use Solana because it\'s the fastest and cheapest." What implicit risk are they accepting according to the trilemma?',
      answer: 'Concentration risk. Solana\'s speed comes from fewer validators with high hardware requirements. Consequences: (a) multiple historical outages (entire chain halted), (b) fewer independent parties validate transactions, (c) if enough validators collude, censorship is possible. "Fastest and cheapest" is the scalability corner of the trilemma — the cost is paid in decentralisation, which means operational and censorship risk.',
      difficulty: 'basic'
    },
    {
      id: 'cl5',
      type: 'calculation',
      question: 'An Ethereum block has 150 transactions averaging 50 gwei × 100,000 gas each. Post-merge, block reward is 0 ETH. If 70% of gas is burned (EIP-1559 base fee) and 30% is validator priority fee, what does the validator earn per block? Is ETH inflationary or deflationary?',
      answer: 'Total gas: 150 × 50 × 100,000 × 10⁻⁹ = 0.75 ETH. Validator tip: 0.75 × 30% = 0.225 ETH. Burned: 0.75 × 70% = 0.525 ETH. At ~7,200 blocks/day: daily burn = 3,780 ETH. Daily consensus issuance ≈ 1,700 ETH. Net: 1,700 - 3,780 = -2,080 ETH/day (deflationary). At this gas level, Ethereum is deflating by ~2,080 ETH daily — supply is shrinking.',
      difficulty: 'advanced'
    },
    {
      id: 'sc1',
      type: 'judgement',
      question: 'You hold $100,000 in USDC. Circle reveals $3.3B of $40B reserves were at a collapsed bank. USDC drops to $0.87. What is the maximum theoretical depeg, and is $0.87 rational?',
      answer: 'Maximum shortfall: $3.3B / $40B = 8.25%. If the entire deposit were lost, USDC is backed at $0.9175 per dollar. Theoretical floor: $0.9175. The $0.87 market price ($0.9175 - $0.87 = $0.0475 below theoretical floor) reflects panic, not mathematics. A mathematically rational actor would buy at $0.87 if confident remaining reserves are sound — potential 14.9% return when peg restores. But this requires accepting the risk that additional reserve problems may exist.',
      difficulty: 'advanced'
    },
    {
      id: 'sc2',
      type: 'calculation',
      question: 'You open a DAI vault: deposit 2 ETH at $3,200, mint 3,000 DAI. What is your collateral ratio? At what ETH price are you liquidated (150% threshold)? If ETH drops 40%, what do you receive back after liquidation (13% penalty)?',
      answer: 'Collateral: 2 × $3,200 = $6,400. Ratio: $6,400 / $3,000 = 213.3%. Liquidation price: $3,000 × 1.50 / 2 = $2,250 per ETH (29.7% drop from $3,200). At 40% drop: ETH = $1,920. Collateral = $3,840. Ratio: 128% → liquidated. Returned: $3,840 - $3,000 (debt) - $390 (13% penalty) = $450. You keep 3,000 DAI + $450 = $3,450 total. vs just holding 2 ETH = $3,840. Cost of vault: $390 (the liquidation penalty).',
      difficulty: 'intermediate'
    },
    {
      id: 'sc3',
      type: 'judgement',
      question: 'A new project launches an "algorithmic stablecoin" with a dual-token mint/burn mechanism and a 20% reserve fund ($100M reserve, $500M stablecoin supply). Evaluate its mathematical resilience.',
      answer: 'The 20% reserve absorbs the first $100M of redemptions. Beyond that, the death spiral begins — exactly as with UST/LUNA. Crypto panics typically see 50-80% of supply redeemed within days. $100M reserve vs $500M supply is exhausted after 20% of holders exit. The reflexive feedback loop (sell stablecoin → mint governance token → governance dumps → more selling) is structural and not addressed by a finite reserve. The reserve extends the timeline from hours to days but doesn\'t prevent collapse under severe stress. Mathematically honest assessment: it fails under the same conditions as UST, just slightly later.',
      difficulty: 'advanced'
    },
    {
      id: 'lp1',
      type: 'calculation',
      question: 'An ETH/USDC pool has 500 ETH and 1,500,000 USDC. (a) Spot price? (b) k? (c) You buy 5 ETH — effective price and price impact? (d) A whale buys 50 ETH — effective price and price impact?',
      answer: '(a) 1,500,000/500 = $3,000. (b) k = 750,000,000. (c) x=495, y=750M/495=1,515,151.52. Cost=$15,151.52. Price=$3,030.30. Impact=1.01%. (d) x=450, y=750M/450=1,666,666.67. Cost=$166,666.67. Price=$3,333.33. Impact=11.1%. The 50 ETH trade has 11× the price impact of 5 ETH despite being 10× the size. Price impact is super-linear in constant product AMMs.',
      difficulty: 'basic'
    },
    {
      id: 'lp2',
      type: 'calculation',
      question: 'A small-cap token XYZ/USDC pool: 10,000 XYZ and 50,000 USDC. Spot: $5.00. You buy $5,000 worth. How many tokens do you get, what\'s the effective price, and what is the new spot price?',
      answer: 'k = 500,000,000. Pay 5,000 USDC: new y = 55,000. New x = 500M/55,000 = 9,090.91. Received: 909.09 XYZ. Effective price: $5.50 (10% impact). New spot: 55,000/9,090.91 = $6.05. A $5,000 trade in a $100,000 pool (5% of value) caused 10% price impact and moved the spot price 21%. This is why thin pools are mathematically treacherous.',
      difficulty: 'intermediate'
    },
    {
      id: 'lp3',
      type: 'judgement',
      question: 'A token has $2M market cap but only $30,000 in DEX liquidity. You want to buy $10,000 worth. What does the maths tell you?',
      answer: 'Your $10,000 is 33% of the $30,000 pool. Price impact would be approximately 50%+ — you\'d pay ~$15,000 worth for $10,000 at pre-trade price. More critically: the $2M market cap is fiction. If everyone sold, only ~$15K could be extracted (half the USDC side). The "market cap" is price × supply, but actual liquid value is $15K — a 133:1 ratio of market cap to liquidity. Red flags: (a) creator can drain pool in one transaction (rug pull), (b) any moderate sell crashes the price, (c) effectively illiquid.',
      difficulty: 'advanced'
    },
    {
      id: 'va1',
      type: 'judgement',
      question: 'A DeFi protocol advertises "500% APY on staking." List at least three mathematical questions you should ask before depositing.',
      answer: '(1) Is it APY or APR? At 500% APR compounded daily, APY is much higher than stated — or if it\'s 500% APY, the underlying rate is lower. (2) Where does the yield come from? If it\'s token emissions, real yield = fees - dilution. $1M fees but $10M in new tokens = deeply negative real yield. (3) What\'s the impermanent loss if it\'s an LP position? (4) Smart contract risk — is it audited? How long has it been live? (5) Token price trend: 500% APY in a token that drops 80% = net -60% in USD. Any APY above 50% demands mathematical scrutiny.',
      difficulty: 'basic'
    },
    {
      id: 'va2',
      type: 'calculation',
      question: 'You swap 1 ETH for USDC on Uniswap v3 (Ethereum L1). Pool fee: 0.30%. Gas: 45 gwei, 185,000 gas units. ETH = $3,000. You receive 2,975 USDC. Break down every cost.',
      answer: 'Gas: 185,000 × 45 × 10⁻⁹ = 0.008325 ETH = $24.98. Exchange fee: $3,000 × 0.30% = $9.00. Expected output: $3,000 - $9 = $2,991. Actual: $2,975. Slippage + MEV: $2,991 - $2,975 = $16. Total costs: $24.98 + $9 + $16 = $49.98 (1.67% of trade). On a $300 trade, gas alone ($24.98) would be 8.3%. Same fixed cost, proportionally devastating on smaller amounts.',
      difficulty: 'intermediate'
    },
    {
      id: 'va3',
      type: 'judgement',
      question: '"I\'m diversified — I hold BTC, ETH, SOL, AVAX, and MATIC." Explain why this may not be genuine mathematical diversification.',
      answer: 'Major crypto assets are highly correlated: BTC/ETH ρ ≈ 0.85, BTC/SOL ρ ≈ 0.75, ETH/alts ρ ≈ 0.80-0.90. In crashes (FTX Nov 2022), correlations spike above 0.90 — everything falls together. Portfolio variance with 5 assets at ρ = 0.85 is ~89% of single-asset variance — only 11% risk reduction from "diversifying" into 5 assets. True diversification needs low-correlation assets: crypto + equities (ρ ≈ 0.3-0.5), crypto + bonds (ρ ≈ 0-0.2). Five crypto tokens is diversifying within an asset class, not across asset classes. Module 8 covers this rigorously.',
      difficulty: 'advanced'
    },
    {
      id: 'cl6',
      type: 'calculation',
      question: 'You provide $10,000 to an ETH/USDC pool ($5,000 ETH + $5,000 USDC). The pool charges 0.30% fees and processes $500,000 daily volume. Your share is 0.5%. What is your daily fee income, annualised APR, and how does this compare to simply holding the $10,000 in a savings account at 4.5% APY?',
      answer: 'Daily fees from pool: $500,000 × 0.30% = $1,500. Your share (0.5%): $7.50/day. Annual: $7.50 × 365 = $2,737.50. APR: $2,737.50 / $10,000 = 27.4%. Savings account: $10,000 × 4.5% = $450/year. LP earns 6.1× the savings account — but carries impermanent loss risk, smart contract risk, and gas costs. After estimated IL of 3% ($300) and gas ($200/year on L2): net LP return ≈ $2,237.50 (22.4%). Still ~5× the savings account, but with materially higher risk.',
      difficulty: 'intermediate'
    }
  ],

  tool: {
    name: 'Crypto Cost Calculator',
    description: 'Calculate the full cost of any on-chain trade: gas, fees, slippage, and price impact.',
    inputs: [
      { id: 'cc-trade-size', label: 'Trade size (USD)', type: 'number', default: 1000, min: 1, step: 1 },
      { id: 'cc-chain', label: 'Chain', type: 'select', options: [
        { value: 'ethereum', label: 'Ethereum L1', gasUSD: 15 },
        { value: 'arbitrum', label: 'Arbitrum', gasUSD: 0.30 },
        { value: 'optimism', label: 'Optimism', gasUSD: 0.25 },
        { value: 'polygon', label: 'Polygon', gasUSD: 0.03 },
        { value: 'solana', label: 'Solana', gasUSD: 0.005 },
        { value: 'base', label: 'Base', gasUSD: 0.10 },
        { value: 'qf', label: 'QF Network', gasUSD: 0.001 }
      ]},
      { id: 'cc-dex-fee', label: 'DEX fee (%)', type: 'number', default: 0.30, min: 0, max: 5, step: 0.01 },
      { id: 'cc-slippage', label: 'Est. slippage (%)', type: 'number', default: 0.10, min: 0, max: 10, step: 0.01 },
      { id: 'cc-pool-size', label: 'Pool TVL (USD)', type: 'number', default: 1000000, min: 1000, step: 1000 }
    ],
    outputs: [
      'Gas cost (USD and % of trade)',
      'DEX fee (USD)',
      'Estimated slippage cost (USD)',
      'Price impact from constant product formula (USD and %)',
      'Total cost breakdown and % of trade',
      'Break-even price movement needed',
      'Same-trade comparison across all chains'
    ]
  }
};

if (typeof module !== 'undefined') module.exports = CRYPTO_MODULE_1;
