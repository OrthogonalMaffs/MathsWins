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

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = join(__dirname, '../data/escrow.key');
const DATA_DIR = join(__dirname, '../data');

const QF_RPC = process.env.QF_RPC_URL || 'https://archive.mainnet.qfnode.net/eth';
const TEAM_WALLET = '0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';

let wallet = null;
let provider = null;

export function initEscrow() {
  provider = new ethers.JsonRpcProvider(QF_RPC);

  if (existsSync(KEY_PATH)) {
    // Load existing key
    const key = readFileSync(KEY_PATH, 'utf-8').trim();
    wallet = new ethers.Wallet(key, provider);
    console.log('Escrow wallet loaded:', wallet.address);
  } else {
    // Generate new wallet
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const newWallet = ethers.Wallet.createRandom();
    writeFileSync(KEY_PATH, newWallet.privateKey, { mode: 0o600 }); // owner read/write only
    wallet = newWallet.connect(provider);
    console.log('Escrow wallet CREATED:', wallet.address);
    console.log('Fund this address with QF to enable settlements.');
  }

  return wallet.address;
}

export function getEscrowAddress() {
  return wallet ? wallet.address : null;
}

export async function getEscrowBalance() {
  if (!wallet) return 0n;
  return await provider.getBalance(wallet.address);
}

/**
 * Send QF (native token) to an address.
 * Returns the transaction hash or null on failure.
 */
export async function sendQF(to, amountQF) {
  if (!wallet) throw new Error('Escrow wallet not initialised');
  if (!to || amountQF <= 0) throw new Error('Invalid recipient or amount');

  try {
    const value = ethers.parseEther(String(amountQF));
    const tx = await wallet.sendTransaction({ to, value });
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (e) {
    console.error('Escrow send failed:', e.message);
    return null;
  }
}

/**
 * Settle a duel: burn + team + winner payout.
 * Amounts in whole QF (not wei).
 */
export async function settleDuel(winnerAddress, burnAmount, teamAmount, winnerAmount) {
  const results = { burn: null, team: null, winner: null };

  if (burnAmount > 0) {
    results.burn = await sendQF(BURN_ADDRESS, burnAmount);
  }
  if (teamAmount > 0) {
    results.team = await sendQF(TEAM_WALLET, teamAmount);
  }
  if (winnerAmount > 0 && winnerAddress) {
    results.winner = await sendQF(winnerAddress, winnerAmount);
  }

  return results;
}

/**
 * Settle a draw: burn + team + split to both players.
 */
export async function settleDuelDraw(creatorAddress, opponentAddress, burnAmount, teamAmount, eachAmount) {
  const results = { burn: null, team: null, creator: null, opponent: null };

  if (burnAmount > 0) {
    results.burn = await sendQF(BURN_ADDRESS, burnAmount);
  }
  if (teamAmount > 0) {
    results.team = await sendQF(TEAM_WALLET, teamAmount);
  }
  if (eachAmount > 0) {
    results.creator = await sendQF(creatorAddress, eachAmount);
    results.opponent = await sendQF(opponentAddress, eachAmount);
  }

  return results;
}

/**
 * Refund a duel creator (full amount, no burn).
 */
export async function refundDuel(creatorAddress, amount) {
  return await sendQF(creatorAddress, amount);
}

/**
 * Settle a league: burn + team + prizes to top 4.
 * prizes = [{ wallet, amount }, ...]
 */
export async function settleLeague(burnAmount, teamAmount, prizes) {
  const results = { burn: null, team: null, prizes: [] };

  if (burnAmount > 0) {
    results.burn = await sendQF(BURN_ADDRESS, burnAmount);
  }
  if (teamAmount > 0) {
    results.team = await sendQF(TEAM_WALLET, teamAmount);
  }
  for (const p of prizes) {
    if (p.amount > 0 && p.wallet) {
      const txHash = await sendQF(p.wallet, p.amount);
      results.prizes.push({ wallet: p.wallet, amount: p.amount, txHash });
    }
  }

  return results;
}

/**
 * Send a promo prize.
 */
export async function sendPromoPrize(winnerAddress, amount) {
  return await sendQF(winnerAddress, amount);
}

export { TEAM_WALLET, BURN_ADDRESS };
