/**
 * On-chain entry listener.
 * Watches GameEntry contract for EntryRecorded events.
 * Records entries in DB so the score engine can issue sessions.
 */

import { ethers } from 'ethers';
import { recordEntry, getEntry } from './db/index.mjs';

const RPC_URL = process.env.QF_RPC_URL || 'https://archive.mainnet.qfnode.net/eth';
const GAME_ENTRY_ADDRESS = process.env.GAME_ENTRY_CONTRACT || '';

const ENTRY_ABI = [
  'event EntryRecorded(address indexed player, uint256 indexed gameId, uint256 indexed weekId, uint8 tier, uint256 timestamp)',
  'function singleFee() view returns (uint256)',
  'function tripleFee() view returns (uint256)',
  'function getEntry(address player, uint256 gameId, uint256 weekId) view returns (uint8)'
];

let provider;
let contract;
let listening = false;

export function startListener() {
  if (!GAME_ENTRY_ADDRESS) {
    console.log('[chain-listener] No GAME_ENTRY_CONTRACT set — skipping listener');
    return;
  }

  provider = new ethers.JsonRpcProvider(RPC_URL);
  contract = new ethers.Contract(GAME_ENTRY_ADDRESS, ENTRY_ABI, provider);

  contract.on('EntryRecorded', async (player, gameId, weekId, tier, timestamp, event) => {
    const wallet = player.toLowerCase();
    const gid = Number(gameId);
    const wid = Number(weekId);
    const t = Number(tier);

    console.log(`[chain-listener] EntryRecorded: ${wallet} game=${gid} week=${wid} tier=${t}`);

    // Check if already recorded (idempotent)
    const existing = getEntry(wallet, gid.toString(), wid);
    if (existing) {
      console.log('[chain-listener] Already recorded, skipping');
      return;
    }

    try {
      recordEntry(wallet, gid.toString(), wid, t, event.log.transactionHash, event.log.blockNumber);
      console.log('[chain-listener] Entry recorded in DB');
    } catch (e) {
      console.error('[chain-listener] DB error:', e.message);
    }
  });

  listening = true;
  console.log('[chain-listener] Listening for EntryRecorded events on', GAME_ENTRY_ADDRESS);
}

export function stopListener() {
  if (contract && listening) {
    contract.removeAllListeners();
    listening = false;
    console.log('[chain-listener] Stopped');
  }
}

// Also provide a manual poll for missed events (backup)
export async function catchUp(fromBlock) {
  if (!contract) return;
  const currentBlock = await provider.getBlockNumber();
  console.log(`[chain-listener] Catching up from block ${fromBlock} to ${currentBlock}`);

  const events = await contract.queryFilter('EntryRecorded', fromBlock, currentBlock);
  for (const event of events) {
    const [player, gameId, weekId, tier] = event.args;
    const wallet = player.toLowerCase();
    const existing = getEntry(wallet, Number(gameId).toString(), Number(weekId));
    if (!existing) {
      recordEntry(wallet, Number(gameId).toString(), Number(weekId), Number(tier), event.transactionHash, event.blockNumber);
    }
  }
  console.log(`[chain-listener] Processed ${events.length} events`);
  return currentBlock;
}
