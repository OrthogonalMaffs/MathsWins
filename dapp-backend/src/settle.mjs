/**
 * Weekly settlement script.
 * Run via cron every Sunday at 23:59 UTC.
 *
 * 1. Query DB for each paid game's top scorer
 * 2. Build arrays for batchSettle
 * 3. Call PrizePot.batchSettle on-chain
 * 4. Log to audit table
 * 5. Send Telegram alert
 *
 * Usage: node src/settle.mjs
 * Env: OPERATOR_PRIVATE_KEY, PRIZE_POT_CONTRACT, QF_RPC_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_ID
 */

import { ethers } from 'ethers';
import { getDb } from './db/index.mjs';
import { getPaidGames, getTopScorer, recordSettlement } from './db/index.mjs';
import { getCurrentWeekId } from './scoring.mjs';

const RPC_URL = process.env.QF_RPC_URL || 'https://archive.mainnet.qfnode.net/eth';
const PRIZE_POT_ADDRESS = process.env.PRIZE_POT_CONTRACT || '';
const OPERATOR_KEY = process.env.OPERATOR_PRIVATE_KEY || '';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_GROUP = process.env.TELEGRAM_GROUP_ID || '';

const POT_ABI = [
  'function batchSettle(uint256[] gameIds, uint256[] weekIds, address[] winners) external',
  'function getWeekData(uint256 gameId, uint256 weekId) view returns (uint256 potBalance, uint256 treasuryBalance, uint256 entryCount, bool settled)'
];

async function settle() {
  if (!PRIZE_POT_ADDRESS || !OPERATOR_KEY) {
    console.error('Missing PRIZE_POT_CONTRACT or OPERATOR_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(OPERATOR_KEY, provider);
  const pot = new ethers.Contract(PRIZE_POT_ADDRESS, POT_ABI, wallet);

  const weekId = getCurrentWeekId();
  const games = getPaidGames();

  console.log(`Settling week ${weekId} for ${games.length} paid games...`);

  var gameIds = [];
  var weekIds = [];
  var winners = [];
  var results = [];

  for (const game of games) {
    // Read on-chain data
    const [potBalance, treasuryBalance, entryCount, settled] = await pot.getWeekData(
      gameIdToUint(game.id), weekId
    );

    if (settled) {
      console.log(`  ${game.id}: already settled, skipping`);
      continue;
    }

    const topScorer = getTopScorer(game.id, weekId);
    const numEntries = Number(entryCount);

    if (numEntries >= 10 && topScorer) {
      console.log(`  ${game.id}: ${numEntries} entries, winner=${topScorer.wallet} score=${topScorer.score}, pot=${ethers.formatEther(potBalance)} QF`);
      gameIds.push(gameIdToUint(game.id));
      weekIds.push(weekId);
      winners.push(topScorer.wallet);
      results.push({ game: game.id, winner: topScorer.wallet, pot: ethers.formatEther(potBalance), treasury: ethers.formatEther(treasuryBalance), rolled: false });
    } else {
      console.log(`  ${game.id}: ${numEntries} entries (< 10), rolling over`);
      gameIds.push(gameIdToUint(game.id));
      weekIds.push(weekId);
      winners.push(ethers.ZeroAddress);
      results.push({ game: game.id, winner: null, pot: ethers.formatEther(potBalance), treasury: ethers.formatEther(treasuryBalance), rolled: true });
    }
  }

  if (gameIds.length === 0) {
    console.log('Nothing to settle');
    await sendTelegram(`📊 MathsWins Week ${weekId}: Nothing to settle.`);
    process.exit(0);
  }

  // Call batchSettle
  console.log(`\nCalling batchSettle with ${gameIds.length} games...`);
  try {
    const tx = await pot.batchSettle(gameIds, weekIds, winners);
    console.log('TX hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('Confirmed in block:', receipt.blockNumber);

    // Record in DB
    for (const r of results) {
      recordSettlement(weekId, r.game, r.winner, r.pot, r.treasury, r.rolled, tx.hash);
    }

    // Telegram alert
    var paid = results.filter(r => !r.rolled);
    var rolled = results.filter(r => r.rolled);
    var totalPaid = paid.reduce((sum, r) => sum + parseFloat(r.pot), 0);
    var totalTreasury = paid.reduce((sum, r) => sum + parseFloat(r.treasury), 0);

    var msg = `🏆 MathsWins Week ${weekId} Settled\n`;
    msg += `Games settled: ${gameIds.length}\n`;
    msg += `Winners paid: ${paid.length} (${totalPaid.toFixed(2)} QF)\n`;
    msg += `Treasury: ${totalTreasury.toFixed(2)} QF\n`;
    msg += `Rolled over: ${rolled.length} games\n`;
    msg += `TX: ${tx.hash}`;

    if (paid.length > 0) {
      msg += '\n\n🎯 Winners:';
      paid.forEach(r => {
        msg += `\n  ${r.game}: ${r.winner.slice(0,8)}... (${r.pot} QF)`;
      });
    }

    await sendTelegram(msg);
    console.log('\nSettlement complete.');
  } catch (e) {
    console.error('Settlement TX failed:', e.message);
    await sendTelegram(`❌ MathsWins Week ${weekId} settlement FAILED: ${e.message}`);
    process.exit(1);
  }
}

// Convert game ID string to uint256 (hash it)
function gameIdToUint(id) {
  return BigInt(ethers.keccak256(ethers.toUtf8Bytes(id))) % BigInt(2n ** 128n);
}

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_GROUP) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_GROUP, text, parse_mode: 'Markdown' })
    });
  } catch (e) {
    console.error('Telegram send failed:', e.message);
  }
}

// Init DB and run
getDb();
settle().catch(e => { console.error(e); process.exit(1); });
