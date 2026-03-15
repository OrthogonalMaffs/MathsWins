// crypto-m9-yield.js
// Module 9: Stablecoin & Yield Mathematics — APY, Real Returns & the True Cost of Farming
// Crypto Trading Maths — MathsWins Academy
// Tier: Master | Accent: #f97316

const CRYPTO_MODULE_9 = {
  id: 9,
  title: 'Stablecoin & Yield Mathematics — APY, Real Returns & the Cost of Farming',
  tier: 'master',
  accent: '#f97316',

  tutorial: `
    <div class="tut">
      <h2>Module 9: Yield Mathematics</h2>

      <div class="pt" style="border-left-color:#f97316; background:rgba(249,115,22,0.08);">
        DeFi yields look incredible — 10%, 50%, 200% APY. But headline yields hide costs that most participants never calculate: impermanent loss, smart contract risk, token inflation, gas costs, and the opportunity cost of locked capital. This module teaches you to strip yield down to its real, risk-adjusted value. The number that matters is never the number they advertise.
      </div>

      <h3>APR vs APY — The Compounding Illusion</h3>
      <div class="mb">
APR (Annual Percentage Rate): simple interest.
  £10,000 at 100% APR = £10,000 interest after 1 year.

APY (Annual Percentage Yield): compound interest.
  APY = (1 + APR/n)^n - 1
  where n = number of compounding periods per year.

  100% APR compounded:
    Annually (n=1):   APY = 100.0%
    Quarterly (n=4):  APY = 114.4%
    Monthly (n=12):   APY = 126.8%
    Daily (n=365):    APY = 171.5%

  At 100% APR, daily compounding gives 171.5% APY.
  The protocol advertises 171.5%. It sounds 71.5% better
  than the underlying 100% rate. It's the same rate
  with more frequent compounding.

  ALWAYS ask: is this APR or APY?
  At high rates, the difference is enormous.
  At 500% APR daily: APY = (1+5/365)^365 - 1 = 14,641%
  Yes, that's not a typo. 500% APR = 14,641% APY.
  The headline number is meaningless without knowing which.
      </div>

      <h3>Token-Denominated vs USD-Denominated Yield</h3>
      <div class="mb">
You stake Token X and earn 80% APY in Token X.
Sounds great. But Token X drops 70% over the year.

Start: 1,000 tokens × $1.00 = $1,000
End: 1,800 tokens × $0.30 = $540

USD return: -46%. You earned 80% APY and lost 46%.

The formula:
  USD return = (1 + APY) × (1 + price_change) - 1
  = (1.80) × (0.30) - 1 = -46%

Break-even price decline for 80% APY:
  1.80 × (1 + x) = 1
  x = 1/1.80 - 1 = -44.4%

Token X can drop UP TO 44.4% and you still break even.
Beyond that, you lose money despite the "80% yield."

For 200% APY: break-even at -66.7% price decline.
For 500% APY: break-even at -83.3%.
For 1000% APY: break-even at -90.9%.

High APY doesn't protect you from token price collapse.
It shifts the break-even, not the outcome.
      </div>

      <h3>Real Yield — The Only Number That Matters</h3>
      <div class="mb">
Real Yield = Protocol Revenue - Token Emissions

Most DeFi "yield" comes from printing new tokens, not from
genuine economic activity. This is inflation dressed as yield.

Example protocol:
  TVL: $100M
  Advertised APY: 30%
  Annual yield paid: $30M

  Revenue breakdown:
    Trading fees earned by protocol: $5M
    Token emissions (newly minted governance tokens): $25M

  Real yield: $5M / $100M = 5%
  Emission yield: $25M / $100M = 25%

  The 25% "yield" from emissions is paid by diluting
  existing token holders. If everyone sells the emitted
  tokens, the token price drops by the emission rate.

  Real yield per dollar deposited: 5%
  Everything above that is a mathematical illusion.

The Ponzi test:
  If yield comes from new depositors rather than genuine
  revenue, it's mathematically unsustainable.
  New deposits fund old depositors' "yield."
  When deposits slow, yield collapses, price collapses,
  depositors flee. Anchor Protocol (20% on UST) was
  exactly this — funded by reserves that ran out.
      </div>

      <h3>The Full LP Return Calculation</h3>
      <div class="mb">
True LP return = Fees - IL - Gas - SC Risk Premium - Opportunity Cost

Example: ETH/USDC pool, $20,000 deposit, 1 year
  Gross fees: 25% APR (from volume)
  IL (ETH moved 1.5× in the year): 2.0%
  Gas (monthly compound on L1, 12 txs): $600 (3.0%)
  Smart contract risk premium: 3% (audited, 2yr protocol)
  Opportunity cost (vs 5% stablecoin lending): 5%

  True return: 25% - 2% - 3% - 3% - 5% = 12%

  Headline said 25%. Reality is 12%.
  Still positive, but half the advertised rate.

  For a newer protocol (risk premium 10%):
  25% - 2% - 3% - 10% - 5% = 5%. Barely beats stablecoin lending.

  For a farm with 200% APY but high token emission:
  Real yield might be 5-10%. Rest is inflation.
  After IL, gas, risk, and opportunity cost: possibly negative.
      </div>

      <h3>Auto-Compounding — When Does It Help?</h3>
      <div class="mb">
Auto-compounders (Yearn, Beefy) claim rewards and reinvest
automatically. The benefit: compound interest. The cost: gas.

Optimal compounding frequency:
  If each compound costs $5 in gas and your daily yield is $3:
    Compounding daily: costs $5 to earn $3 → net loss $2/day
    Compounding weekly: costs $5 to earn $21 → net gain $16
    Compounding monthly: costs $5 to earn $90 → net gain $85

  Optimal frequency = √(2 × annual_gas_cost × APR)
  (derived from minimising total cost function)

  On Ethereum L1 ($15/compound):
    At 10% APR on $10,000: optimal ≈ every 45 days
    At 50% APR on $10,000: optimal ≈ every 20 days
    At 100% APR on $10,000: optimal ≈ every 14 days

  On L2 ($0.50/compound):
    At 10% APR on $10,000: optimal ≈ every 8 days
    At 50% APR on $10,000: optimal ≈ every 4 days
    At 100% APR on $10,000: optimal ≈ daily

  Auto-compounders on L1 are only valuable for large positions
  at high APR. On L2, they're beneficial for most positions.
      </div>

      <div class="dg" style="margin-top:1.5rem;">
        <strong>FCA risk warning:</strong> DeFi yields involve risk of impermanent loss, smart contract exploit, and token devaluation. Advertised APY figures are not guaranteed. Capital at risk. This is mathematical education, not financial advice.
      </div>
    </div>
  `,

  scenarios: [
    { id:'y1', type:'calculation', question:'A farm advertises 365% APY. Is this APR or APY? If it\'s APR compounded daily, what\'s the APY? If it\'s already APY, what\'s the underlying APR?', answer:'If 365% APR compounded daily: APY=(1+3.65/365)^365-1=(1.01)^365-1=3,678% APY. The 365% figure would actually be 3,678% APY. If 365% is already APY: underlying daily rate=(1+3.65)^(1/365)-1=0.00425=0.425%/day. APR=0.425%×365=155%. The "365% APY" is actually 155% APR. Massive difference depending on which number is quoted. Always verify.' },
    { id:'y2', type:'calculation', question:'You stake 10,000 Token X at $2.00 ($20,000). APY: 120%. Over 6 months you earn 6,000 tokens. Token X price drops to $0.80. Calculate USD return.', answer:'Tokens after 6 months: 16,000. Value: 16,000×$0.80=$12,800. Started with $20,000. USD return: ($12,800-$20,000)/$20,000=-36%. Despite "earning" 6,000 tokens (60% in 6 months = 120% APY track), you lost 36% in dollar terms. Break-even token price: $20,000/16,000=$1.25. Token needed to stay above $1.25 (a 37.5% decline from $2.00) for you to break even.' },
    { id:'y3', type:'calculation', question:'Protocol earns $2M/month in trading fees. TVL: $500M. Token emissions: 5M tokens/month at $3/token ($15M). Calculate headline APY and real yield.', answer:'Headline yield: ($2M+$15M)×12/$500M = $204M/$500M = 40.8% APR. Real yield: $2M×12/$500M = $24M/$500M = 4.8% APR. The remaining 36% comes from token emissions — inflation. If all emission recipients sell, the token faces $180M annual sell pressure. At $3/token with 60M annual emissions: supply inflation = 60M/(current circulating). If circulating = 200M: 30% annual inflation. Real yield: 4.8%. Inflation drag: 30%. Net: deeply negative for token holders.' },
    { id:'y4', type:'calculation', question:'$50,000 in an ETH/USDC LP. Fees: 20% APR. IL estimate: 3%. Gas (L2): $50/year. SC risk: 3%. Risk-free alternative: 4.5% stablecoin. Calculate true risk-adjusted return.', answer:'Gross: 20%. After IL: 17%. After gas ($50/$50,000): 16.9%. After SC risk: 13.9%. vs opportunity cost of 4.5%: excess return = 9.4%. The 20% headline becomes 9.4% risk-adjusted excess over the risk-free alternative. Whether 9.4% compensates for the ACTUAL risk (not just estimated 3% SC risk) is a judgement call. A newer protocol with 10% SC risk premium: excess = 2.9%. Barely worth the complexity.' },
    { id:'y5', type:'calculation', question:'On Ethereum L1, each compound tx costs $12. Your position earns $8/day. What is the optimal compounding frequency and the annual cost of sub-optimal daily compounding?', answer:'Daily compounding cost: $12×365=$4,380/year. Daily compounding benefit: compound interest on $8/day. Net: $8×365=$2,920 gross, minus $4,380 gas = -$1,460. Daily compounding LOSES money. Optimal: compound when accumulated rewards = √(2×gas×position×APR). Roughly every 3-4 days. At every 4 days: gas=$12×91=$1,092/year. Only sacrifice ~5% of compounding benefit. Net: $2,920-$1,092=$1,828. vs daily: $2,920-$4,380=-$1,460. Proper frequency saves $3,288/year.' },
    { id:'y6', type:'judgement', question:'A new protocol offers 2,000% APY on a stablecoin pair (USDC/USDT). No impermanent loss concern. What questions should you ask?', answer:'(1) Where does the yield come from? At 2,000% APY on stablecoins with no IL, the yield MUST be from token emissions. Real yield from a USDC/USDT pool: 0.01-0.05% fees. The remaining 1,999.95% is printed tokens. (2) What happens when emissions reduce? Yield collapses, depositors flee, token dumps. (3) Smart contract risk: if the protocol is new, 10-30% annual exploit probability. 2,000% APY × 20% exploit probability = expected 400% return × 80% probability = 320% expected, minus 100% × 20% = expected loss of 20%. Wait — that\'s still positive? Only if you BELIEVE the 2,000% persists, which it won\'t. (4) This is almost certainly a Ponzi structure: early depositors get paid from later depositors\' capital.' },
    { id:'y7', type:'calculation', question:'Compare 3 yield strategies for $100,000 over 1 year: (A) 4.5% stablecoin lending (Aave, low risk), (B) 15% ETH/USDC LP (medium risk), (C) 80% APY token farm (high risk).', answer:'(A) Aave USDC: 4.5% = $4,500. SC risk ~1% on Aave (mature). Risk-adjusted: $4,500 - $1,000 = $3,500. (B) ETH/USDC LP: 15% gross. IL estimate 2%, gas 0.5%, SC risk 3%, opportunity cost 4.5%. Net: 15-2-0.5-3 = 9.5%. Risk-adjusted income: $9,500 - $4,500(opp cost) = $5,000 excess. (C) Token farm: 80% headline. Token may drop 50%: USD return = 1.80×0.50-1 = -10%. Plus SC risk 10% on new protocol: expected loss from hack = 10%×$100,000=$10,000. Expected return: -10% × $100,000 - $10,000 = -$20,000. The "80% APY" farm has NEGATIVE expected return. Boring Aave wins.' },
    { id:'y8', type:'judgement', question:'Explain the Anchor Protocol collapse mathematically. 20% APY on UST, funded by reserves and LUNA staking yields.', answer:'Anchor offered 20% on UST deposits. LUNA staking yield was ~6-8%. The 12-14% gap was funded by Anchor\'s reserve (initially $450M). At peak TVL ($14B): annual cost = $14B × 20% = $2.8B. Annual revenue (staking): ~$14B × 7% = ~$1B. Annual deficit: $1.8B. Reserve depletion: $450M / $1.8B = 3 months. The reserve was being drained at $150M/month. When the reserve neared zero: yield would have to drop to ~7% (sustainable level). The confidence loss from cutting yield from 20% to 7% triggered withdrawals → UST selling → death spiral (Module 1). The mathematics were published. The timeline was calculable. The collapse was not a surprise — it was arithmetic.' },
    { id:'y9', type:'calculation', question:'You\'re choosing between two stablecoin vaults: Vault A: 8% APY, 2 years old, 3 audits, $200M TVL. Vault B: 25% APY, 3 months old, 1 audit, $15M TVL. Estimate risk-adjusted yields.', answer:'Vault A: SC risk ~2-3% (mature, audited, high TVL). Risk-adjusted: 8% - 2.5% = 5.5%. Vault B: SC risk ~10-20% (new, single audit, low TVL). Risk-adjusted: 25% - 15% = 10%. But: (a) Vault B\'s 25% likely includes emissions that won\'t persist, (b) the 15% risk estimate may be LOW for a 3-month protocol, (c) if hacked, you lose 100% not 15%. Expected value: 0.85×25% + 0.15×(-100%) = 21.25% - 15% = 6.25%. Vault A EV: 0.975×8% + 0.025×(-100%) = 7.8% - 2.5% = 5.3%. Close — but Vault A has much lower variance (less chance of total loss) for similar expected return. Vault A is mathematically superior on a risk-adjusted basis.' },
    { id:'y10', type:'calculation', question:'A liquidity mining programme distributes 1M governance tokens over 12 months. Token price at launch: $5. TVL: $50M. Calculate the emission yield, and what happens to token price if 70% of distributed tokens are sold.', answer:'Annual emissions: 1M × $5 = $5M. Emission yield: $5M/$50M = 10% APR (at current token price). If 70% sold: 700K tokens × $5 = $3.5M sell pressure. If token\'s daily volume is $500K, that\'s 7 days of full volume as sell pressure — spread over 12 months, it\'s $3.5M/12 = $292K/month of additional sells. At $500K daily volume (15M monthly): $292K is ~2% of monthly volume. Moderate impact: token likely drifts down 10-30% from emission selling. At new price $3.50: emission yield = 1M×$3.50/$50M = 7%. The yield self-corrects downward as the token price falls from selling pressure. This is the death spiral of emission-funded yield in slow motion.' },
    { id:'y11', type:'judgement', question:'"I just compound my rewards daily so APY is maximised." When is this statement wrong, and what is the hidden cost?', answer:'Wrong when: (1) gas cost per compound exceeds the marginal benefit. On Ethereum L1, $15/compound on a $1,000 position at 50% APR: daily yield = $1.37, gas = $15. You lose $13.63 per compound. (2) Compound triggers a taxable event in many jurisdictions — each claim+restake may be a disposal for tax purposes. (3) The rewards token may be declining in price between claims — compounding a depreciating asset amplifies losses. (4) Some auto-compounders charge performance fees (10-30% of yield). After fees: real APY is lower. Compounding is only mathematically beneficial when: yield per period > gas cost per compound, AND you believe the reward token will maintain or increase in value.' },
    { id:'y12', type:'calculation', question:'A protocol claims "100% sustainable yield" because it charges 1% on all swaps and distributes fees to stakers. TVL: $200M. Daily volume: $10M. Verify the claim.', answer:'Daily fees: $10M × 1% = $100K. Annual: $36.5M. APR on $200M TVL: 36.5M/200M = 18.25%. If they advertise 18.25% APR = this IS genuine real yield (fees from economic activity, not emissions). Sustainable? Only if volume persists. Questions: (a) Is $10M daily volume organic or incentivised? (b) A 1% fee is very high — competitors at 0.30% will attract volume away over time. (c) If TVL grows but volume doesn\'t, APR drops proportionally. At $400M TVL same volume: 9.1% APR. The yield is real but volume-dependent. It\'s sustainable until competition or TVL dilution erodes it.' }
  ],

  tool: {
    name: 'Real Yield Calculator',
    description: 'Strip yield down to risk-adjusted real return after all deductions.',
    inputs: [
      { id:'ry-headline', label:'Headline APY (%)', type:'number', default:30 },
      { id:'ry-emission-pct', label:'% from token emissions', type:'number', default:60 },
      { id:'ry-il', label:'Estimated IL (%)', type:'number', default:3 },
      { id:'ry-gas-annual', label:'Annual gas costs ($)', type:'number', default:200 },
      { id:'ry-deposit', label:'Deposit ($)', type:'number', default:10000 },
      { id:'ry-sc-age', label:'Protocol age (months)', type:'number', default:12 },
      { id:'ry-audits', label:'Number of audits', type:'number', default:1 },
      { id:'ry-risk-free', label:'Risk-free rate (%)', type:'number', default:4.5 }
    ],
    outputs: ['Real yield (fees only)', 'Emission yield (inflation)', 'After IL, gas, SC risk', 'Risk-adjusted excess return', 'Comparison vs risk-free alternative', 'Sustainability assessment']
  }
};

if (typeof module !== 'undefined') module.exports = CRYPTO_MODULE_9;
