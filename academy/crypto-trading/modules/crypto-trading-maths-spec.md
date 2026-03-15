# MathsWins — Crypto Trading Maths: Full Product Specification

**Product:** Crypto Trading Maths
**Slug:** `/academy/crypto-trading/`
**Accent colour:** Orange `#f97316`
**Status:** Full specification — ready for module builds
**Date:** 15 March 2026
**Position:** Standalone premium product (NOT in original All Access / included in MathsWins Premium)

---

## Overview

Crypto Trading Maths is the mathematical education course that doesn't exist anywhere else. The crypto education space is dominated by influencer courses selling "how to find the next 100×" — chart patterns, sentiment signals, and narrative-driven speculation dressed up as strategy. None of it is mathematics.

This course teaches the actual mathematics of crypto markets: how liquidity pools work at the formula level, why impermanent loss destroys LP returns under specific conditions, how funding rates create arbitrage opportunities, why leverage at 10× has a quantifiable probability of liquidation, how token supply schedules mathematically guarantee dilution, and why on-chain analytics are statistically noisy signals that most people misinterpret.

The thesis is the same as every MathsWins product: **understand the mathematics before you trade.** The numbers don't lie, and in crypto — where information asymmetry is extreme and regulation is thin — mathematical literacy is the only genuine edge a retail trader can have.

**Target audience:** Adults (18+) who trade or invest in cryptocurrency and want to understand the mathematics behind the markets they're participating in. Also relevant to DeFi users, liquidity providers, and anyone who interacts with smart contracts that handle their money.

**What this course IS:** Mathematical education about crypto market mechanics.
**What this course IS NOT:** Trading signals, investment advice, or a guide to "making money in crypto."

---

## Pricing

| Tier | Modules | Price | Content summary |
|------|---------|-------|-----------------|
| Free taster | M1 | £0 | Crypto landscape, chains, tokens, stablecoins, liquidity pools, vocabulary |
| Basic | M1–M4 | £9.99 | + Volatility maths, leverage & liquidation, funding rates & perpetuals |
| Advanced | M1–M7 | £17.99 | + AMM/LP maths, token supply economics, on-chain analytics, correlation & portfolio |
| Master | M1–M10 | £29.99 | + Stablecoin yield maths, risk management for fat tails, mathematics of narratives |

Included in MathsWins Premium (£99.99/year or £149.99 lifetime).
Also sold standalone at the prices above.

---

## Stats Bar

| Stat | Value | Label |
|------|-------|-------|
| 10 | Modules | Foundations → Mastery |
| 120+ | Scenarios | Interactive decision training |
| 10 | Tools | Built-in calculators & modellers |
| $2T+ | Market | And most participants can't do the maths |

---

## Module 1: The Crypto Landscape — Chains, Tokens, Liquidity & the Language of DeFi

**Tier:** Free taster
**Accent:** #f97316 (orange)
**Scenarios:** 15
**Prerequisites:** None — this is the starting point

### Purpose

This is the foundation module. Before we can teach the mathematics of crypto trading, we need to establish a shared vocabulary and a clear understanding of what the objects are. Most crypto education skips this — they assume you already know what a liquidity pool is, what gas means, what the difference between a layer 1 and a layer 2 is. We don't assume anything.

By the end of this module, you'll understand: what blockchains are and how they differ, what tokens represent and how they're created, what stablecoins are and the three mathematical models behind them, what liquidity pools are and why they exist, what DeFi protocols actually do, and every piece of vocabulary you'll need for the remaining 9 modules.

This module is free. It's designed to prove that MathsWins teaches crypto differently — with arithmetic, not adjectives.

### Tutorial Content

**Section 1: What Is a Blockchain? — The Ledger Model**

Not a philosophy lecture. A blockchain is a data structure — specifically, a linked list of blocks where each block contains a cryptographic hash of the previous block, a timestamp, and a set of transactions. The "crypto" in cryptocurrency refers to the cryptography that secures this chain, not to the assets themselves.

`.mb` box:
```
A block contains:
  - Block number (height)
  - Hash of previous block (32-byte SHA-256 or equivalent)
  - Timestamp
  - List of transactions
  - Nonce (for proof-of-work) or validator signature (for proof-of-stake)

Block N:   hash(Block N-1) + transactions + nonce → hash(Block N)
Block N+1: hash(Block N)   + transactions + nonce → hash(Block N+1)

Changing ANY data in Block N changes hash(Block N),
which breaks the reference in Block N+1,
which breaks Block N+2, and so on.

To alter history, you'd need to recompute every block
from the altered one to the present — faster than
every other computer on the network combined.

That's the security model. It's not magic. It's maths.
```

`.pln` box: "A blockchain is a spreadsheet that nobody can edit after the fact because every row contains a mathematical fingerprint of the row before it. Change one number and every fingerprint after it breaks. That's all it is — a tamper-proof ledger secured by hash functions."

**Section 2: How Chains Differ — The Blockchain Trilemma**

`.mb` box:
```
The Blockchain Trilemma (Vitalik Buterin, 2017):

Pick two of three:
  1. Decentralisation — many independent validators
  2. Security — resistant to attack (51% attack cost)
  3. Scalability — high transaction throughput

                    Decentralisation
                         /\
                        /  \
                       /    \
                      /      \
           Security /________\ Scalability

Bitcoin: Decentralised + Secure, NOT scalable
  ~7 transactions per second (TPS)
  Block time: ~10 minutes
  Finality: ~60 minutes (6 confirmations)

Ethereum (L1): Decentralised + Secure, limited scalability
  ~15-30 TPS (pre-sharding)
  Block time: ~12 seconds
  Finality: ~15 minutes (64 slots)

Solana: Scalable + Relatively Secure, less decentralised
  ~4,000 TPS (theoretical 65,000)
  Block time: ~0.4 seconds
  ~2,000 validators (vs Ethereum's ~900,000+)

QF Network: Scalable + Secure, smaller validator set
  Block time: ~0.1 seconds
  Near-zero gas
  PolkaVM runtime
```

`.pln` box: "Every blockchain makes trade-offs. Bitcoin chose maximum security and decentralisation at the cost of speed. Solana chose speed at the cost of some decentralisation. There's no 'best' chain — there are trade-offs, and the mathematics of those trade-offs matter when you're deciding where to hold assets and execute trades."

**Section 3: Layer 1 vs Layer 2 — What These Terms Actually Mean**

A Layer 1 (L1) is a base blockchain — Bitcoin, Ethereum, Solana. A Layer 2 (L2) is a system built on top of an L1 that processes transactions off the main chain and periodically settles back to it.

`.mb` box:
```
Layer 2 approaches:

Optimistic Rollups (Arbitrum, Optimism, Base):
  - Execute transactions off-chain
  - Post transaction data to L1
  - Assume transactions are valid UNLESS challenged
  - Challenge window: typically 7 days
  - Withdrawal to L1: ~7 days (must wait for challenge period)

ZK-Rollups (zkSync, StarkNet, Polygon zkEVM):
  - Execute transactions off-chain
  - Generate a mathematical proof (zero-knowledge proof)
    that ALL transactions are valid
  - Post proof + compressed data to L1
  - Withdrawal to L1: minutes to hours
  - More computationally expensive to generate proofs
  - Mathematically provable correctness (not assumed)

The trade-off:
  Optimistic: cheap to run, slow to exit
  ZK: expensive to prove, fast to exit

Both achieve 100-4000+ TPS while inheriting L1 security.
```

`.pln` box: "Layer 2 chains are like branch offices that do the work locally and send a summary to head office. Optimistic rollups send the summary and say 'challenge me if I'm wrong.' ZK-rollups send a mathematical proof that the summary is correct. Both make transactions cheaper and faster while keeping the security of the main chain."

**Section 4: Tokens — What They Are and How They're Created**

`.mb` box:
```
A token is a balance entry in a smart contract.

ERC-20 (fungible token — the standard):
  mapping(address => uint256) balances;

  When you "own" 100 USDC, what actually exists is:
    balances[your_address] = 100000000  (6 decimals)

  There is no "coin." There is no "file." There is a number
  in a mapping inside a contract on a blockchain.

ERC-721 (non-fungible token — NFT):
  mapping(uint256 => address) owners;

  Token #4523 is owned by address 0xABC...
  Each token ID is unique. That's the "non-fungible" part.

Creating a token:
  Anyone can deploy an ERC-20 contract. Cost: ~$5-50 in gas.
  The contract defines: name, symbol, total supply, and rules
  for transfers.

  This is why there are millions of tokens.
  Creating one requires no permission, no approval, no backing.
  The barrier to entry is near zero.

  Understanding this is critical: a token's EXISTENCE
  tells you nothing about its VALUE. Value comes from
  what the token represents and who wants it.
```

`.pln` box: "A token is a number in a database. That's it. When someone creates a new token, they're deploying a smart contract that keeps a list of who owns how much. The token has value only if people agree it does — and that agreement is what the rest of this course analyses mathematically."

**Section 5: Stablecoins — Three Mathematical Models**

This is where we start doing actual maths. Stablecoins are designed to maintain a $1 peg. There are three fundamentally different approaches, each with distinct mathematical properties and failure modes.

`.mb` box:
```
Model 1: Fiat-Collateralised (USDC, USDT)

  Mechanism: 1 token = $1 held in reserve (bank accounts, T-bills)
  Peg maintenance: arbitrage
    If USDC trades at $0.99 on exchange:
      Buy USDC at $0.99 → redeem from Circle for $1.00
      Profit: $0.01 per token (1%)
      Arbitrageurs buy USDC → price rises back to $1.00

    If USDC trades at $1.01:
      Mint USDC by depositing $1.00 → sell for $1.01
      Profit: $0.01 per token
      Arbitrageurs sell USDC → price falls back to $1.00

  Risk: counterparty risk. If the issuer doesn't actually
  hold the reserves, the redemption mechanism fails.
  USDT has faced repeated questions about reserve backing.

  Mathematical model: fixed exchange rate with arbitrage bounds.
  Peg holds as long as redemption is credible.


Model 2: Crypto-Collateralised (DAI)

  Mechanism: overcollateralised lending
  To mint 100 DAI ($100), deposit $150+ of ETH as collateral.
  Collateral ratio: 150% minimum.

  If ETH price falls:
    Your collateral value drops toward 100 DAI
    At ~110% ratio: liquidation — your ETH is sold to repay DAI
    This is what keeps DAI pegged: every DAI in circulation
    is backed by >$1 of crypto collateral.

  Liquidation price:
    If you deposit 1 ETH at $3,000 and mint 1,500 DAI:
    Collateral ratio = $3,000 / $1,500 = 200%
    Liquidation at 150%: $1,500 × 1.50 = $2,250
    If ETH drops to $2,250, you get liquidated.

  Risk: cascade liquidation. If ETH drops fast, mass
  liquidations can crash the price further, causing
  more liquidations. March 2020: ETH fell 43% in 24 hours,
  DAI briefly depegged to $1.10 as liquidations cleared.


Model 3: Algorithmic (historical: UST/LUNA — failed May 2022)

  Mechanism: mint/burn arbitrage between two tokens
  1 UST could always be redeemed for $1 of LUNA (and vice versa)

  If UST = $0.98:
    Buy UST at $0.98 → burn for $1.00 of LUNA → sell LUNA
    Profit: $0.02. Buying pressure pushes UST back to $1.00.

  The fatal flaw — a death spiral:
    If confidence breaks → mass UST redemptions
    → massive LUNA minting (supply explodes)
    → LUNA price crashes
    → redemption value of UST drops
    → more panic selling of UST
    → more LUNA minting → repeat

  May 2022:
    UST supply: ~$18 billion
    UST depegs to $0.90 → $0.50 → $0.10 → $0.02
    LUNA supply: 350 million → 6.5 TRILLION in days
    LUNA price: $80 → $0.0001
    ~$40 billion in value destroyed.

  The mathematics of the death spiral were known and published
  before the collapse. The model is inherently reflexive:
  the mechanism that maintains the peg in normal conditions
  accelerates the collapse in abnormal conditions.
```

`.pln` box: "Stablecoins look the same from the outside — they're all worth roughly $1. But the mathematics behind each type is completely different. Fiat-backed stablecoins depend on trust in the issuer. Crypto-backed depend on overcollateralisation and liquidation mechanics. Algorithmic stablecoins depend on a feedback loop that works in good times and self-destructs in bad times. UST/LUNA proved that the maths of death spirals is real — $40 billion real."

**Section 6: Liquidity Pools — What They Are and Why They Exist**

`.mb` box:
```
Traditional exchange (order book):
  Buyers place bids: "I'll buy 1 ETH at $2,990"
  Sellers place asks: "I'll sell 1 ETH at $3,010"
  Trade happens when bid ≥ ask.
  Spread = $3,010 - $2,990 = $20 (0.67%)

  This requires: many buyers, many sellers, tight spreads.
  Works for: ETH, BTC on Binance, Coinbase.
  Fails for: small tokens with few traders.

Decentralised exchange (liquidity pool / AMM):
  No order book. No buyers and sellers matched.
  Instead: a pool of two tokens held by a smart contract.

  Example: ETH/USDC pool
    Contains: 100 ETH + 300,000 USDC
    The contract uses a formula to determine the price.

  Constant Product Formula (Uniswap v2):
    x × y = k

    x = amount of token A in pool (ETH)
    y = amount of token B in pool (USDC)
    k = constant (doesn't change during swaps)

    Price of ETH = y / x = 300,000 / 100 = $3,000

  To buy 1 ETH:
    New x = 99 ETH
    k = 100 × 300,000 = 30,000,000
    New y = k / new_x = 30,000,000 / 99 = 303,030.30 USDC
    Cost = 303,030.30 - 300,000 = 3,030.30 USDC

    You paid $3,030.30 for 1 ETH (effective price: $3,030.30)
    But the "spot price" was $3,000.
    The difference ($30.30) is price impact — the cost of
    moving the pool's ratio.

  To buy 10 ETH:
    New x = 90
    New y = 30,000,000 / 90 = 333,333.33
    Cost = 333,333.33 - 300,000 = 33,333.33
    Effective price per ETH: $3,333.33

    Price impact for 10 ETH: 11.1%
    Price impact for 1 ETH: 1.0%

    Larger trades = more price impact. This is a fundamental
    mathematical property of the constant product formula.
```

`.pln` box: "A liquidity pool is a pot of two tokens managed by a formula. When you trade, you're not buying from a person — you're buying from the formula. The formula always gives you a price, but that price gets worse the more you buy. This is price impact, and it's why large trades on decentralised exchanges cost more than the 'spot price' suggests."

**Section 7: Liquidity Providers — Who Fills the Pool and Why**

`.mb` box:
```
Anyone can add tokens to a liquidity pool. You deposit
both tokens in equal value and receive LP (liquidity provider)
tokens representing your share of the pool.

Example:
  Pool has: 100 ETH + 300,000 USDC (total: $600,000)
  You deposit: 1 ETH + 3,000 USDC ($6,000)
  Your share: $6,000 / $606,000 = 0.99%
  You receive LP tokens representing 0.99% of the pool.

Revenue:
  Every trade pays a fee (typically 0.3% on Uniswap v2).
  Fees are added to the pool proportionally.

  If the pool processes $1,000,000 in daily volume:
    Daily fees: $1,000,000 × 0.3% = $3,000
    Your share (0.99%): $3,000 × 0.99% = $29.70/day
    Annualised: $29.70 × 365 = $10,840.50
    APR on $6,000: 10,840.50 / 6,000 = 180.7%

  That looks incredible. But there's a catch — and it's
  the most important concept in DeFi mathematics.
  It's called impermanent loss, and Module 4 is dedicated
  entirely to understanding it.
```

`.pln` box: "Liquidity providers earn trading fees. The APR can look extraordinary — triple-digit percentages are common. But the headline number hides a mathematical trap called impermanent loss, which can eat your profits and your principal. We'll derive it from first principles in Module 4. For now, just know: the fees are real, but so is the risk."

**Section 8: Gas, Slippage, and Transaction Costs**

`.mb` box:
```
Gas: the cost of computation on a blockchain.

Ethereum gas model:
  Every operation costs gas units:
    Simple transfer: 21,000 gas
    Token swap on Uniswap: ~150,000 gas
    Complex DeFi interaction: 300,000-1,000,000 gas

  You pay: gas_units × gas_price (in gwei)
  1 gwei = 0.000000001 ETH

  At 30 gwei gas price, ETH at $3,000:
    Simple transfer: 21,000 × 30 × 10^(-9) = 0.00063 ETH = $1.89
    Uniswap swap: 150,000 × 30 × 10^(-9) = 0.0045 ETH = $13.50

  During network congestion (bull markets, NFT mints):
    Gas can spike to 200-500+ gwei
    Uniswap swap at 300 gwei: 0.045 ETH = $135

  For a $500 trade, $135 in gas is a 27% fee.
  For a $50,000 trade, it's 0.27%.

  Gas costs are FIXED per transaction, not percentage-based.
  This means: small trades are proportionally crushed by gas.

Slippage:
  The difference between the expected price and the executed price.
  Two sources:
    1. Price impact (from constant product formula — see above)
    2. Price movement between submitting and execution

  Slippage tolerance: typically set to 0.5-1%.
  If you set 0.5% tolerance on a $1,000 trade:
    Maximum slippage: $5
    If price moves more than 0.5%, transaction reverts.

  MEV (Maximal Extractable Value):
    Validators can see your pending transaction.
    Sandwich attack: front-run your buy → your buy executes
    at worse price → back-run sells at higher price.

    Cost to you: additional slippage (typically 0.1-0.5%)
    Profit to attacker: the difference.
    This is invisible. You just get a slightly worse price.
```

`.pln` box: "Every on-chain transaction has three costs: the exchange fee (0.3%), the gas cost (fixed amount per transaction), and slippage (the price moving against you during execution). For small trades, gas dominates. For large trades, slippage dominates. Understanding which cost matters most for YOUR trade size is basic crypto maths — and most traders never calculate it."

**Section 9: The Vocabulary You'll Need**

A reference section defining every term used in Modules 2-10. Not a glossary dump — each term explained with a one-line mathematical definition.

Key terms: AMM, APR, APY, arbitrage, block time, bridge, CEX, collateral ratio, consensus, constant product, DEX, ERC-20, ERC-721, farming, finality, flash loan, FDV, funding rate, gas, governance token, impermanent loss, leverage, liquidation, liquidity, LP token, margin, market cap, MEV, mint, oracle, order book, perpetual, pool, position, rebase, rug pull, sandwich attack, slippage, smart contract, spread, staking, swap, TVL, vault, volatility, wrapped token, yield.

Each with its mathematical definition and a cross-reference to the module where it's covered in depth.

**Section 10: What This Course Covers — The Module Map**

A clear overview of all 10 modules, what each teaches, and why the order matters. This primes the student for the mathematical journey ahead and makes the case for why they should pay for the full course.

### Interactive Tool: Crypto Cost Calculator

**Inputs:**
- Trade size (USD)
- Gas price (gwei) and chain selection (Ethereum, Arbitrum, Polygon, etc.)
- DEX fee (% — default 0.30%)
- Slippage estimate (%)
- Pool size (USD — for price impact calculation)

**Outputs:**
- Total transaction cost breakdown: gas + fee + slippage + price impact
- Cost as percentage of trade
- "Break-even price movement" — how much the price needs to move in your favour just to cover costs
- Comparison table: same trade on different chains/L2s

### Scenarios (15)

5 blockchain comparison (given chain specs → calculate transaction costs and finality), 3 stablecoin mechanism analysis (given a market event → which stablecoin type is at risk and why?), 4 liquidity pool basics (given pool composition → calculate price, price impact, and effective fee), 3 vocabulary application (given a DeFi scenario → identify and explain the mathematical concepts at work).

---

## Module 2: Volatility Mathematics — Why Crypto Moves Differently

**Tier:** Basic
**Accent:** #f97316
**Scenarios:** 12
**Prerequisites:** Module 1

### Core Content

Crypto volatility is fundamentally different from equities. BTC annualised vol: 60-80%. ETH: 80-100%. Altcoins: 100-200%+. Compare S&P 500: 15-20%. This has profound mathematical implications for position sizing, stop-loss placement, and expected drawdowns.

**Key mathematical topics:**
- Measuring volatility: standard deviation of log returns
- Annualised vs daily volatility: σ_annual = σ_daily × √252 (TradFi) vs √365 (crypto — 24/7 markets)
- Why log returns matter (not simple returns) — the asymmetry of percentage moves
- Volatility clustering (GARCH effects) — high vol follows high vol
- The mathematical relationship between volatility and position size: higher vol → smaller position
- Fat tails in crypto — returns are NOT normally distributed. Crypto follows a power law distribution with tail index α ≈ 2.5-3.5, meaning extreme moves are MUCH more common than a normal distribution predicts
- Practical calculation: "If BTC has 70% annualised vol, what is the probability of a 20% drawdown in any given month?"
- Vol-adjusted position sizing: if you'd hold £1,000 of FTSE 100 stock, the equivalent-risk BTC position is £1,000 × (15/70) = £214

### Interactive Tool: Volatility Calculator
Takes a series of prices → calculates daily vol, annualised vol, max drawdown, and vol-adjusted position size relative to a benchmark.

### Scenarios (12)
4 volatility calculation, 3 position sizing, 3 drawdown probability, 2 fat-tail awareness.

---

## Module 3: Leverage & Liquidation — The Mathematics of Margin

**Tier:** Basic
**Accent:** #f97316
**Scenarios:** 12
**Prerequisites:** Module 2

### Core Content

Leverage amplifies both returns AND losses. In crypto, leverage is available at 2× to 125× on some platforms. The mathematics of liquidation is precise: for any leverage level and entry price, there is an exact price at which your position is liquidated (margin = 0).

**Key mathematical topics:**
- Leverage formula: Position = Margin × Leverage
- Liquidation price: Entry × (1 - 1/Leverage) for longs, Entry × (1 + 1/Leverage) for shorts
- At 10× leverage: 10% move against you = 100% loss (liquidation)
- At 50× leverage: 2% move = liquidation
- At 100× leverage: 1% move = liquidation
- Probability of liquidation: given BTC daily vol ≈ 3.5%, P(10% move in 3 days) ≈ 28% → 10× leverage has ~28% liquidation risk within 3 days
- Funding costs compound: 0.01% per 8 hours × 3 = 0.03%/day = 10.95%/year — silently eroding leveraged positions
- Maintenance margin vs initial margin
- The mathematics of why most leveraged traders lose: asymmetry of compounding under volatility (volatility drag)

### Interactive Tool: Liquidation Calculator
Enter position size, leverage, entry price → shows liquidation price, distance to liquidation in %, probability of liquidation within 1/7/30 days based on historical vol.

### Scenarios (12)
4 liquidation price calculation, 3 leverage risk assessment, 3 funding cost impact, 2 volatility drag demonstration.

---

## Module 4: AMM & Liquidity Pool Mathematics — Impermanent Loss from First Principles

**Tier:** Basic (final Basic module)
**Accent:** #f97316
**Scenarios:** 15
**Prerequisites:** Module 1 (liquidity pools), Module 2 (volatility)

### Core Content

This is the centrepiece mathematical module. Impermanent loss (IL) is the most important concept in DeFi and the least understood. We derive it from the constant product formula, prove the IL formula algebraically, and show exactly when LP returns exceed holding.

**Key mathematical topics:**
- Constant product formula deep dive: x × y = k
- Concentrated liquidity (Uniswap v3): providing liquidity within a price range
- Deriving impermanent loss from first principles:

```
IL = 2√(price_ratio) / (1 + price_ratio) - 1

Where price_ratio = new_price / original_price

At 1.25× price change (25% up): IL = -0.6%
At 1.50× price change (50% up): IL = -2.0%
At 2.00× price change (100% up): IL = -5.7%
At 3.00× price change (200% up): IL = -13.4%
At 5.00× price change (400% up): IL = -25.5%
At 0.50× price change (50% down): IL = -5.7%

Key insight: IL is SYMMETRICAL for equivalent up/down moves.
A 2× move up causes the same IL as a 2× move down (0.5×).
```

- When LP fees overcome IL — the break-even calculation
- Concentrated liquidity mathematics: higher fee capture, but amplified IL within the range
- Comparing LP returns vs simply holding: the full accounting
- Why "impermanent" is misleading — it's only impermanent if the price returns to the original level, which in crypto it often doesn't

### Interactive Tool: Impermanent Loss Calculator
Enter initial token prices, current prices, pool fee tier, volume → shows IL in absolute terms, fee income, net LP return vs holding.

### Scenarios (15)
5 IL calculation at various price movements, 4 LP profitability analysis (fees vs IL), 3 concentrated liquidity comparisons, 3 "should you LP this pair?" decision scenarios.

---

## Module 5: Funding Rates & Perpetual Swaps — The Mathematics of Synthetic Leverage

**Tier:** Advanced
**Accent:** #f97316
**Scenarios:** 12
**Prerequisites:** Module 3

### Core Content

Perpetual swaps are the most traded instrument in crypto. Unlike futures, perps have no expiry — they use funding rates to keep the contract price tethered to the spot price. Funding rates create carry trade opportunities and have significant cost implications for leveraged positions.

**Key mathematical topics:**
- How funding rates work: every 8 hours, longs pay shorts (or vice versa) based on the premium/discount to spot
- Typical funding rates: 0.01-0.03% per 8-hour period when market is bullish, negative when bearish
- Annualised cost: 0.01% × 3 × 365 = 10.95% per year — holding a leveraged long costs 11% annually in funding alone
- Funding rate arbitrage: long spot + short perp = "delta-neutral" position earning funding income
- The maths of carry trades: if funding is +0.05% per 8 hours, the annualised yield is 54.75% — but with basis risk
- Mark price vs last price — why liquidations use mark price (an average across exchanges) to prevent manipulation
- The relationship between funding rates and market sentiment — mathematically, funding rates are a real-time measure of demand for leverage

### Interactive Tool: Funding Rate Calculator
Enter funding rate, position size, leverage → shows daily/weekly/annual cost of holding, break-even price movement, and comparison vs spot position.

### Scenarios (12)
4 funding cost calculation, 3 carry trade analysis, 3 funding-adjusted PnL, 2 delta-neutral strategy assessment.

---

## Module 6: Token Supply Mathematics — Inflation, Dilution & Unlock Events

**Tier:** Advanced
**Accent:** #f97316
**Scenarios:** 12
**Prerequisites:** Module 1

### Core Content

Token supply is the single most predictable variable in crypto — emission schedules are written in code. Yet most traders ignore supply mathematics entirely, buying tokens with aggressive unlock schedules that mathematically guarantee dilution.

**Key mathematical topics:**
- Circulating supply vs total supply vs max supply vs FDV (fully diluted valuation)
- FDV = price × max_supply. If circulating supply is 20% of max, and price is $1, then FDV = 5× market cap. The market is pricing the token at $5B FDV even though market cap is $1B.
- Token unlock mathematics: if 10% of supply unlocks in one month, and historical data shows 40-60% of unlocked tokens are sold within 30 days, what's the expected sell pressure?
- Inflation rate: if 5% new tokens are created annually and demand stays constant, price should fall 5% (all else equal)
- Bitcoin halving mathematics: emission drops by 50% every ~4 years. Current inflation: ~1.7%/year. After 2028 halving: ~0.85%/year.
- Deflationary mechanics: Ethereum's EIP-1559 burns base fee. Net issuance can be negative (deflationary) when usage is high.
- Vesting cliff mathematics: VC unlocks, team unlocks, foundation unlocks — the "unlock calendar" as a supply shock predictor

### Interactive Tool: Token Supply Analyser
Enter circulating supply, total supply, emission schedule, unlock dates → shows inflation rate, FDV vs market cap ratio, projected supply curve, and estimated sell pressure from upcoming unlocks.

### Scenarios (12)
4 FDV analysis, 3 unlock impact estimation, 3 inflation rate calculation, 2 deflationary mechanism assessment.

---

## Module 7: On-Chain Analytics — What the Data Actually Says (and Doesn't)

**Tier:** Advanced (final Advanced module)
**Accent:** #f97316
**Scenarios:** 12
**Prerequisites:** Module 1

### Core Content

On-chain data is transparent — every transaction is public. But transparent data doesn't mean useful data. Most on-chain "analysis" is pattern recognition without statistical rigour. This module teaches the mathematics of evaluating on-chain signals.

**Key mathematical topics:**
- Whale wallet tracking: the mathematics of concentration risk. If the top 10 wallets hold 40% of supply, what's the impact of one selling?
- Exchange flow analysis: net deposits to exchanges (bearish signal?) vs withdrawals (bullish?). The actual correlation between exchange flows and price: r ≈ 0.15-0.25 (weak but nonzero)
- Active address analysis: Metcalfe's Law states network value ∝ n² where n = active users. Empirically, crypto networks show n^1.5 to n^2 — but the relationship is noisy and breaks during speculative bubbles
- MVRV ratio (Market Value to Realised Value): when MVRV > 3, historically BTC has been near cycle tops. But the sample size is 3-4 cycles — statistically insufficient for confident prediction
- NVT ratio (Network Value to Transactions): the "crypto P/E ratio"
- Base rate analysis: "Whale wallet X moved $50M to Binance" — but what's the base rate? How often do large transfers happen that DON'T precede sell-offs?
- The problem of overfitting: with thousands of on-chain metrics and only 3-4 market cycles, almost any metric can be made to look predictive in hindsight

### Interactive Tool: On-Chain Signal Evaluator
Enter a signal claim (e.g., "exchange inflows spike") → shows historical base rate, correlation with subsequent price moves, confidence interval, and sample size assessment.

### Scenarios (12)
4 whale flow analysis, 3 Metcalfe's Law application, 3 base rate assessment, 2 overfitting identification.

---

## Module 8: Correlation & Portfolio Mathematics — Diversification in Crypto

**Tier:** Master
**Accent:** #f97316
**Scenarios:** 12
**Prerequisites:** Module 2

### Core Content

"I'm diversified — I hold BTC, ETH, SOL, and AVAX." This is the most common portfolio mistake in crypto. The correlation between major cryptoassets is 0.75-0.95 in down markets — they all crash together. True mathematical diversification requires understanding correlation structures.

**Key mathematical topics:**
- Correlation coefficient between crypto pairs: BTC/ETH ≈ 0.85, BTC/SOL ≈ 0.75, ETH/altcoins ≈ 0.80-0.90
- Why correlation increases in crashes: "risk-on / risk-off" dynamics. In the 2022 bear market, almost all crypto correlated at 0.90+
- Beta: if BTC drops 10%, ETH historically drops ~13% (β ≈ 1.3). Small altcoins: β ≈ 1.5-3.0
- BTC dominance as a macro signal: when BTC dominance rises, altcoins underperform (money flows to "safety")
- Portfolio variance formula: σ²_portfolio = Σ(w²σ²) + ΣΣ(wᵢwⱼρᵢⱼσᵢσⱼ)
- With 0.85 correlation, a 50/50 BTC/ETH portfolio has: σ_portfolio ≈ 0.96 × average σ. You've reduced risk by only 4% despite "diversifying" into two assets
- True diversification: crypto + equities (ρ ≈ 0.3-0.5), crypto + bonds (ρ ≈ 0.0-0.2), crypto + commodities (ρ ≈ 0.2-0.4)
- The mathematics of rebalancing: buying dips and selling rallies mechanically through a rebalancing schedule

### Interactive Tool: Crypto Portfolio Analyser
Enter holdings and weights → shows portfolio volatility, correlation matrix, effective diversification ratio, and comparison vs holding BTC alone.

### Scenarios (12)
4 correlation calculation, 3 portfolio variance, 3 beta-adjusted position sizing, 2 rebalancing mathematics.

---

## Module 9: Stablecoin & Yield Mathematics — APY, Real Returns & the True Cost of Farming

**Tier:** Master
**Accent:** #f97316
**Scenarios:** 12
**Prerequisites:** Module 4 (IL), Module 5 (funding rates)

### Core Content

DeFi yields look incredible — 10%, 50%, 200% APY. But headline yields hide costs that most participants never calculate: impermanent loss, smart contract risk, token inflation, gas costs, and the opportunity cost of locked capital.

**Key mathematical topics:**
- APY vs APR: APY = (1 + r/n)^n - 1. At 100% APR compounded daily: APY = (1 + 1/365)^365 - 1 = 171.5%. The compounding frequency matters enormously.
- Token-denominated yields vs USD-denominated yields: earning 50% APY in a token that loses 60% of its value means your USD return is (1.50 × 0.40) - 1 = -40%
- The "real yield" framework: Real Yield = Fees Earned - Token Emissions. If a protocol pays 30% APY but 25% comes from newly minted tokens (inflation), the real yield is only 5%.
- Calculating LP returns properly: Fees - IL - Gas - Smart Contract Risk Premium
- Smart contract risk premium: in mature DeFi (Aave, Uniswap), ~2-5% annualised risk of exploit. In newer protocols: 10-30%. This must be subtracted from expected yield.
- Yield farming strategies: the maths of auto-compounding, the optimal compounding frequency (balancing gas costs vs compound benefit)
- The Ponzi test: if the yield comes from new depositors rather than genuine economic activity, it's mathematically unsustainable. Token emissions without real revenue = slow-motion rug pull.

### Interactive Tool: Real Yield Calculator
Enter headline APY, token emissions %, IL estimate, gas costs, smart contract age → shows real USD yield after all deductions.

### Scenarios (12)
4 APY vs APR conversion, 3 real yield calculation, 3 yield farming profitability, 2 sustainability assessment.

---

## Module 10: Risk Management for Crypto — Mathematics for Fat-Tailed Markets

**Tier:** Master (final module)
**Accent:** #f97316
**Scenarios:** 15
**Prerequisites:** All previous modules

### Core Content

Crypto doesn't follow normal distributions. The standard risk models from TradFi (VaR based on normal distribution) systematically underestimate crypto risk. This module teaches risk management mathematics adapted for fat-tailed distributions.

**Key mathematical topics:**
- Why normal distribution fails for crypto: BTC has experienced 7 daily moves of >15% since 2017. Under normal distribution with σ = 3.5%, a 15% move is a 4.3σ event — probability 0.001%. This should happen once every 273 YEARS, not 7 times in 7 years. The data rejects the normal distribution hypothesis.
- Power law distributions: crypto returns follow a power law with tail index α ≈ 2.5-3.5, meaning extreme events are orders of magnitude more likely than Gaussian models predict
- VaR (Value at Risk) for crypto: traditional VaR understates risk by 40-60% when applied to crypto with normal distribution assumptions
- Expected Shortfall (CVaR): "When things go wrong, HOW wrong do they go?" For crypto: much worse than VaR suggests
- Kelly Criterion adapted for crypto: f* = (μ - r) / σ². With crypto's high volatility, Kelly sizing is typically 5-20% of bankroll — NOT 100% in
- Maximum drawdown statistics: BTC has experienced -85% (2018), -73% (2022), -50% (2021). For altcoins: -90% to -99% is common in bear markets. The maths of recovery: -50% requires +100% to break even. -90% requires +900%.
- Position sizing with stops in a gapping market: crypto can gap 10-20% in minutes. Your "5% stop loss" might execute at -15%.
- Multi-asset risk: using correlation matrices to calculate portfolio VaR and stress-test against historical scenarios (March 2020, May 2021, November 2022, FTX collapse)
- The Kelly criterion for portfolio allocation across crypto assets
- Exit strategy mathematics: laddered selling, trailing stops, time-based exit rules — each with expected value calculations

### Interactive Tool: Crypto Risk Dashboard
Enter portfolio holdings → shows portfolio VaR (power law adjusted), maximum historical drawdown, Kelly-optimal position sizes, correlation risk, and stress test results against 5 historical crash scenarios.

### Scenarios (15)
5 risk calculation (VaR, CVaR, max drawdown), 3 Kelly sizing for crypto, 3 stress testing, 2 stop-loss gap analysis, 2 portfolio-level risk assessment.

---

## Summary

| Module | Title | Tier | Scenarios | Tool |
|--------|-------|------|-----------|------|
| 1 | The Crypto Landscape | Free | 15 | Crypto Cost Calculator |
| 2 | Volatility Mathematics | Basic | 12 | Volatility Calculator |
| 3 | Leverage & Liquidation | Basic | 12 | Liquidation Calculator |
| 4 | AMM & Liquidity Pool Mathematics | Basic | 15 | Impermanent Loss Calculator |
| 5 | Funding Rates & Perpetual Swaps | Advanced | 12 | Funding Rate Calculator |
| 6 | Token Supply Mathematics | Advanced | 12 | Token Supply Analyser |
| 7 | On-Chain Analytics | Advanced | 12 | Signal Evaluator |
| 8 | Correlation & Portfolio Mathematics | Master | 12 | Portfolio Analyser |
| 9 | Stablecoin & Yield Mathematics | Master | 12 | Real Yield Calculator |
| 10 | Risk Management for Fat Tails | Master | 15 | Risk Dashboard |
| **TOTAL** | | | **129** | **10 tools** |

---

## Stripe Setup Required

3 products, 3 prices, 3 payment links:

| Tier | Price | Modules |
|------|-------|---------|
| Basic | £9.99 | M1-M4 |
| Advanced | £17.99 | M1-M7 |
| Master | £29.99 | M1-M10 |

Also included in MathsWins Premium (£99.99/year or £149.99 lifetime).

---

## SEO Keyword Targets

| Module | Primary keywords |
|--------|-----------------|
| M1 (Landscape) | "how crypto works", "what are liquidity pools", "stablecoin types explained" |
| M2 (Volatility) | "crypto volatility", "bitcoin position sizing", "crypto risk" |
| M3 (Leverage) | "crypto liquidation calculator", "leverage trading maths" |
| M4 (AMM/IL) | "impermanent loss explained", "liquidity pool maths", "uniswap formula" |
| M5 (Funding) | "funding rate explained", "perpetual swap maths" |
| M6 (Supply) | "token economics", "FDV vs market cap", "token unlock impact" |
| M7 (On-Chain) | "on-chain analytics", "whale wallet tracking maths" |
| M8 (Correlation) | "crypto portfolio diversification", "bitcoin correlation" |
| M9 (Yield) | "real yield DeFi", "APY vs APR crypto", "yield farming maths" |
| M10 (Risk) | "crypto risk management", "Kelly criterion crypto", "crypto VaR" |

---

## Cross-Links

- **Trading Maths** → shared foundations (position sizing, Kelly criterion, drawdown)
- **Options Maths** → volatility modelling (Black-Scholes vol surface parallels crypto implied vol)
- **Sports Betting Maths** → expected value framework, overround parallels exchange spread
- **Everyday Probability** → base rate analysis, Bayes' theorem applications in on-chain analytics

---

## Responsible Trading Notice

Every module must include:
- "This is mathematical education, not financial or investment advice."
- "Cryptocurrency trading involves significant risk of loss."
- "Never invest more than you can afford to lose."
- FCA risk warning: "Cryptoassets are not regulated in the UK. Capital at risk."

Module 3 (Leverage) and Module 10 (Risk) should include the most prominent warnings given their direct relevance to capital loss.

---

## Design Notes

- Accent colour: Orange #f97316
- Orange-dim for backgrounds: rgba(249, 115, 22, 0.10)
- Module structure follows standard academy format: tutorial → scenarios → tool
- Stats bar, .mb boxes, .pln boxes, .dg danger boxes all follow MathsWins design system
- GA4 snippet on every page

---

*End of specification. Ready for module builds.*
