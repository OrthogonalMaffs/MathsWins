/**
 * Escrow wallet — auto-generated, private key never leaves the server.
 *
 * On first run: generates a new wallet, saves the key to data/escrow.key
 * On subsequent runs: loads the existing key
 *
 * Provides: sendQF(to, amount), getBalance(), address
 */
import { ethers } from 'ethers';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = join(__dirname, '../data/escrow.key');
const DATA_DIR = join(__dirname, '../data');

const QF_RPC = process.env.QF_RPC_URL || 'https://archive.mainnet.qfnode.net/eth';
const TEAM_WALLET = '0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';

const SETTLEMENT_ABI = JSON.parse(readFileSync(join(__dirname, '../contracts/QFSettlement.json'), 'utf8')).abi;
const SETTLEMENT_ADDRESS = '0xf4C00E9CBC6fe595c4a54ae7e75E9a92D0D513d4';
let settlementContract = null;

let wallet = null;
let provider = null;

export function initEscrow() {
  provider = new ethers.JsonRpcProvider(QF_RPC);

  if (existsSync(KEY_PATH)) {
    // Load existing key
    const key = readFileSync(KEY_PATH, 'utf-8').trim();
    wallet = new ethers.Wallet(key, provider);
    console.log('Escrow wallet loaded:', wallet.address);
    settlementContract = new ethers.Contract(SETTLEMENT_ADDRESS, SETTLEMENT_ABI, wallet);
    console.log('QFSettlement contract:', SETTLEMENT_ADDRESS);
  } else {
    // Generate new wallet
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const newWallet = ethers.Wallet.createRandom();
    writeFileSync(KEY_PATH, newWallet.privateKey, { mode: 0o600 }); // owner read/write only
    wallet = newWallet.connect(provider);
    console.log('Escrow wallet CREATED:', wallet.address);
    console.log('Fund this address with QF to enable settlements.');
    settlementContract = new ethers.Contract(SETTLEMENT_ADDRESS, SETTLEMENT_ABI, wallet);
    console.log('QFSettlement contract:', SETTLEMENT_ADDRESS);
  }

  return wallet.address;
}

export function getEscrowAddress() {
  return wallet ? wallet.address : null;
}

export function getSettlementContract() {
  return settlementContract;
}

export async function getEscrowBalance() {
  if (!wallet) return 0n;
  return await provider.getBalance(wallet.address);
}

/**
 * Log a transaction to the escrow_ledger table.
 */
function logLedger(direction, type, amountQF, recipient, sender, txHash, source, referenceId, inferred) {
  try {
    const db = getDb();
    db.prepare(
      'INSERT INTO escrow_ledger (direction, type, amount_qf, recipient, sender, tx_hash, source, reference_id, created_at, inferred) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(direction, type, amountQF, recipient || null, sender || null, txHash || null, source || null, referenceId || null, Date.now(), inferred ? 1 : 0);
  } catch (e) {
    console.error('Ledger log failed:', e.message);
  }
}

/**
 * Parse QFSettlement event logs from a transaction receipt and write detail
 * rows to escrow_ledger with exact on-chain amounts. Falls back to computing
 * expected splits from expectedTotalQf if event parsing yields no matches,
 * marking those rows with inferred=1 and a -inferred type suffix.
 */
export function logSplitFromReceipt(receipt, contractInterface, source, referenceId, expectedTotalQf) {
  const txHash = receipt && receipt.hash ? receipt.hash : null;
  const from = wallet ? wallet.address : null;
  let matched = false;

  if (receipt && receipt.logs && contractInterface) {
    for (const log of receipt.logs) {
      let parsed = null;
      try {
        parsed = contractInterface.parseLog({ topics: log.topics, data: log.data });
      } catch (e) { /* not a QFSettlement event — skip */ }
      if (!parsed) continue;

      if (parsed.name === 'FeeSplit') {
        const burned = Number(ethers.formatEther(parsed.args.burned));
        const team = Number(ethers.formatEther(parsed.args.team));
        logLedger('out', 'burn', burned, BURN_ADDRESS, from, txHash, source, referenceId, 0);
        logLedger('out', 'team', team, TEAM_WALLET, from, txHash, source, referenceId, 0);
        matched = true;
      } else if (parsed.name === 'Settled') {
        const winner = parsed.args.winner;
        const winnerAmount = Number(ethers.formatEther(parsed.args.winnerAmount));
        const burned = Number(ethers.formatEther(parsed.args.burned));
        const team = Number(ethers.formatEther(parsed.args.team));
        logLedger('out', 'winner', winnerAmount, winner, from, txHash, source, referenceId, 0);
        logLedger('out', 'burn', burned, BURN_ADDRESS, from, txHash, source, referenceId, 0);
        logLedger('out', 'team', team, TEAM_WALLET, from, txHash, source, referenceId, 0);
        matched = true;
      } else if (parsed.name === 'SettledDraw') {
        const p1 = parsed.args.p1;
        const p2 = parsed.args.p2;
        const each = Number(ethers.formatEther(parsed.args.eachAmount));
        const burned = Number(ethers.formatEther(parsed.args.burned));
        const team = Number(ethers.formatEther(parsed.args.team));
        logLedger('out', 'draw-payout', each, p1, from, txHash, source, referenceId, 0);
        logLedger('out', 'draw-payout', each, p2, from, txHash, source, referenceId, 0);
        logLedger('out', 'burn', burned, BURN_ADDRESS, from, txHash, source, referenceId, 0);
        logLedger('out', 'team', team, TEAM_WALLET, from, txHash, source, referenceId, 0);
        matched = true;
      }
    }
  }

  if (matched) return;

  // Fallback: compute expected split from total, write rows with inferred=1
  console.error('[logSplitFromReceipt] No matching event in receipt for', source, referenceId, '— writing inferred rows');
  const total = Number(expectedTotalQf) || 0;
  if (total <= 0) return;

  if (source === 'mint' || source === 'leaderboard') {
    // 5% burn, 95% team
    logLedger('out', 'burn-inferred', total * 0.05, BURN_ADDRESS, from, txHash, source, referenceId, 1);
    logLedger('out', 'team-inferred', total * 0.95, TEAM_WALLET, from, txHash, source, referenceId, 1);
  } else if (source === 'duel' || source === 'battleships') {
    // 5% burn, 5% team, 90% winner (recipient unknown in fallback)
    logLedger('out', 'winner-inferred', total * 0.90, null, from, txHash, source, referenceId, 1);
    logLedger('out', 'burn-inferred', total * 0.05, BURN_ADDRESS, from, txHash, source, referenceId, 1);
    logLedger('out', 'team-inferred', total * 0.05, TEAM_WALLET, from, txHash, source, referenceId, 1);
  } else if (source === 'duel-draw') {
    // 5% burn, 5% team, 45% + 45% (recipients unknown)
    logLedger('out', 'draw-payout-inferred', total * 0.45, null, from, txHash, source, referenceId, 1);
    logLedger('out', 'draw-payout-inferred', total * 0.45, null, from, txHash, source, referenceId, 1);
    logLedger('out', 'burn-inferred', total * 0.05, BURN_ADDRESS, from, txHash, source, referenceId, 1);
    logLedger('out', 'team-inferred', total * 0.05, TEAM_WALLET, from, txHash, source, referenceId, 1);
  }
}

/**
 * Log an incoming payment (player -> escrow).
 */
export function logIncoming(type, amountQF, sender, txHash, source, referenceId) {
  logLedger('in', type, amountQF, wallet ? wallet.address : null, sender, txHash, source, referenceId);
}

/**
 * Send QF (native token) to an address.
 * Returns the transaction hash or null on failure.
 * ctx = { type, source, referenceId } for ledger logging.
 */
export async function sendQF(to, amountQF, ctx) {
  if (!wallet) throw new Error('Escrow wallet not initialised');
  if (!to || amountQF <= 0) throw new Error('Invalid recipient or amount');

  try {
    const value = ethers.parseEther(String(amountQF));
    const tx = await wallet.sendTransaction({ to, value });
    const receipt = await tx.wait();
    if (ctx) logLedger('out', ctx.type || 'unknown', amountQF, to, wallet.address, receipt.hash, ctx.source || null, ctx.referenceId || null);
    return receipt.hash;
  } catch (e) {
    console.error('Escrow send failed:', e.message);
    return null;
  }
}

/**
 * Settle a duel: burn + team + winner payout via QFSettlement contract (atomic).
 * Amounts in whole QF (not wei). Contract handles 5/5/90 split.
 */
export async function settleDuel(winnerAddress, burnAmount, teamAmount, winnerAmount, source, referenceId) {
  if (!settlementContract) throw new Error('Settlement contract not initialised');
  const ref = referenceId || null;
  const src = source || 'duel';
  const totalPot = burnAmount + teamAmount + winnerAmount;
  const value = ethers.parseEther(String(totalPot));

  const tx = await settlementContract.settle(winnerAddress, { value, gasLimit: 35343055n });
  const receipt = await tx.wait();

  logSplitFromReceipt(receipt, settlementContract.interface, src, ref, totalPot);
  return { burn: receipt.hash, team: receipt.hash, winner: receipt.hash };
}

/**
 * Settle a draw: burn + team + split to both players via QFSettlement contract (atomic).
 * Amounts in whole QF (not wei). Contract handles 5/5/90 split, then halves the prize.
 */
export async function settleDuelDraw(creatorAddress, opponentAddress, burnAmount, teamAmount, eachAmount, source, referenceId) {
  if (!settlementContract) throw new Error('Settlement contract not initialised');
  const ref = referenceId || null;
  const src = 'duel-draw';
  const totalPot = burnAmount + teamAmount + (eachAmount * 2);
  const value = ethers.parseEther(String(totalPot));

  const tx = await settlementContract.settleDraw(creatorAddress, opponentAddress, { value, gasLimit: 35343055n });
  const receipt = await tx.wait();

  logSplitFromReceipt(receipt, settlementContract.interface, src, ref, totalPot);
  return { burn: receipt.hash, team: receipt.hash, creator: receipt.hash, opponent: receipt.hash };
}

/**
 * Refund a duel creator (full amount, no burn).
 */
export async function refundDuel(creatorAddress, amount, referenceId) {
  return await sendQF(creatorAddress, amount, { type: 'refund', source: 'duel', referenceId: referenceId || null });
}

/**
 * Settle a league: burn + team + prizes to top 4.
 * prizes = [{ wallet, amount }, ...]
 */
export async function settleLeague(burnAmount, teamAmount, prizes, referenceId) {
  const results = { burn: null, team: null, prizes: [] };
  const ref = referenceId || null;

  if (burnAmount > 0) {
    results.burn = await sendQF(BURN_ADDRESS, burnAmount, { type: 'burn', source: 'league', referenceId: ref });
  }
  if (teamAmount > 0) {
    results.team = await sendQF(TEAM_WALLET, teamAmount, { type: 'team', source: 'league', referenceId: ref });
  }
  for (const p of prizes) {
    if (p.amount > 0 && p.wallet) {
      const txHash = await sendQF(p.wallet, p.amount, { type: 'prize', source: 'league', referenceId: ref });
      results.prizes.push({ wallet: p.wallet, amount: p.amount, txHash });
    }
  }

  return results;
}

/**
 * Send a promo prize.
 */
export async function sendPromoPrize(winnerAddress, amount, referenceId) {
  return await sendQF(winnerAddress, amount, { type: 'prize', source: 'promo', referenceId: referenceId || null });
}

// verifyPaymentTx: PARKED — eth_getTransactionReceipt returns null for valid txs on QF archive node.
// Revisit when Axe confirms receipt lookup is working. Trust-the-hash stays as-is until then.

export { TEAM_WALLET, BURN_ADDRESS };
