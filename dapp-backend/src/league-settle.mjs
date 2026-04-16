/**
 * League settlement — trophy minting and prize distribution.
 * Called by checkLeagueLifecycles (deadline), score submit (early), or admin endpoint.
 * Idempotent: safe to call multiple times on the same league.
 */
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db/index.mjs';
import {
  getLeagueById, getLeagueLeaderboard, getLeaguePlayerCount,
  addLeaguePrize, getLeaguePrizes, updateLeagueStatus,
  upsertLeagueBest, incrementWalletCounter, getWalletStats
} from './db/index.mjs';
import { sendQF, TEAM_WALLET, BURN_ADDRESS } from './escrow.mjs';
import { checkAchievements, checkShadowsAchievements, checkInsomniac, checkMonthlyAchievements, checkFreeCellLeague, checkKenKenLeague, checkNonogramLeague, checkKakuroLeague, checkSettlementBatch7, checkSlowBurnAndLastSlow, checkRegicideDetention } from './achievement-checker.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const QF_RPC = process.env.QF_RPC_URL || 'https://archive.mainnet.qfnode.net/eth';
const TROPHY_CONTRACT = process.env.TROPHY_CONTRACT || '0xBC41549872d5480b95733e4f29359b7EAB4E05b8';
const PINATA_JWT = process.env.PINATA_JWT || '';

const PRIZE_SPLITS = [0.50, 0.25, 0.15, 0.10];

// Trophy contract ABI (mint only)
const TROPHY_ABI = [
  'function mint(address to, string uri) returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

// IPFS CIDs for all trophy images (9 games × 2 tiers)
const TROPHY_IMAGE_CIDS = {
  'sudoku-duel':         { silver: 'QmZoLgehMYQ4otZE1CkoEaXszU7YCmHLQ6L9tnRWuZzNQm', bronze: 'QmZ2HHf26qeMfJ62rXjaT3THpD7EpSQZ2JHi3RssciMydb' },
  'kenken':              { silver: 'QmeBJB4RQMTddzfASvNxD3TvnaQEKoQUmPgMBrnKBhxqdz', bronze: 'QmeFA6EJ5JGksPVCft8ZEMU9mVoEEzmxRpGjkJzFjVbCbs' },
  'kakuro':              { silver: 'QmUeY8zQD2HJYGJ2n5hGyXJSjj64sfUhjuRZjLnLGajEFz', bronze: 'QmUbYwbYiFqsq4JKRdQ1MHq8ag2jipiQ5tEntiCWMYJdYY' },
  'nonogram':            { silver: 'QmRwxnzXbhyMGP7K6vwiiW1u7NdLmKMG3mJF69tb9iCsHn', bronze: 'QmYLCVkcA7ewsZMTogCQPQ6u5VEHCiKB6M7K4H6SEAakwY' },
  'cryptarithmetic-club':{ silver: 'QmaMecjW13rjpMufpNdWKuhCJYMxUWB4cdn7w3GEVptE7g', bronze: 'QmP97Ai4jy4xHkUEfN1qjS6qH4tdRxXGsz2kfRRzAyeX26' },
  'prime-or-composite':  { silver: 'QmXf97o3GZmd6J8iPrY4eYCSUjaigFPkw65UucE4fZeWEV', bronze: 'QmSDjmMXqyjm9Nk4pqo8AF4KZMLjNzqGaJ5RTSTNS17896' },
  'countdown-numbers':   { silver: 'Qmc3CgHNeCoKVCkbwi8iHEE751A7yDiozqXtQ18hzEVRVr', bronze: 'QmXNvR55qkat5DgDD1Yc4Q7kyGYEyQgdEgaYZ3JoaAfdSu' },
  'estimation-engine':   { silver: 'QmenQZ83D3MwN1uzSqDU9PdCxMsSQBnJCQWfg5XGcnKPFd', bronze: 'QmWsex9ocpK3bQQm2XABLFM7eVT4FzdbupQcxCuAJH4JhZ' },
  'sequence-solver':     { silver: 'Qmdq3DSx57fZnm6K8u6oMg1fhx5jbNWZ7Xut88yT8RYoXB', bronze: 'QmSUeaTp2SQyXpgAfopqrfdY8Pj7AKydKoDNALKDyMG6xS' }
};

const GAME_NAMES = {
  'sudoku-duel': 'Sudoku Duel', 'kenken': 'KenKen', 'kakuro': 'Kakuro',
  'nonogram': 'Nonogram', 'cryptarithmetic-club': 'Cryptarithmetic Club',
  'prime-or-composite': 'Prime or Composite', 'countdown-numbers': 'Countdown Numbers',
  'estimation-engine': 'Estimation Engine', 'sequence-solver': 'Sequence Solver'
};

function ordinal(n) {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th';
}

// ── Pin JSON to IPFS via Pinata ─────────────────────────────────────
async function pinJSONToIPFS(json, name) {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + PINATA_JWT, 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinataContent: json, pinataMetadata: { name } })
  });
  const data = await res.json();
  if (!data.IpfsHash) throw new Error('Pinata pin failed: ' + JSON.stringify(data));
  return data.IpfsHash;
}

// ── Get escrow signer for trophy minting ────────────────────────────
function getEscrowSigner() {
  const keyPath = join(__dirname, '../data/escrow.key');
  const key = readFileSync(keyPath, 'utf-8').trim();
  const provider = new ethers.JsonRpcProvider(QF_RPC);
  return new ethers.Wallet(key, provider);
}

// ── Main settlement function ────────────────────────────────────────
export async function doSettleLeague(leagueId) {
  const league = getLeagueById(leagueId);
  if (!league) throw new Error('League not found: ' + leagueId);

  // Idempotency: already settled or settling
  if (league.status === 'settled') {
    console.log('League ' + leagueId + ' already settled');
    return { status: 'already_settled' };
  }
  if (league.status === 'settling') {
    console.log('League ' + leagueId + ' is currently settling');
    return { status: 'settling_in_progress' };
  }

  // Mark as settling
  updateLeagueStatus(leagueId, 'settling');
  console.log('Settling league ' + leagueId + ' (' + league.game_id + ' ' + league.tier + ')');

  try {
    // Step 1: Determine positions
    const leaderboard = getLeagueLeaderboard(leagueId);
    const positions = leaderboard.slice(0, 4);

    if (positions.length === 0) {
      updateLeagueStatus(leagueId, 'settled');
      console.log('No players scored — marking settled with no prizes');
      return { status: 'settled_empty' };
    }

    // Step 2: Calculate prizes
    const totalPot = league.total_pot || 0;
    const burnAmount = league.burn_amount || 0;
    const teamAmount = league.team_amount || 0;
    const prizePool = league.prize_pool || 0;

    const prizes = positions.map(function(player, i) {
      return {
        wallet: player.wallet,
        position: i + 1,
        score: player.total_score,
        amount: prizePool > 0 ? Math.floor(prizePool * PRIZE_SPLITS[i]) : 0
      };
    });

    // Step 3: Mint trophies
    const gameName = GAME_NAMES[league.game_id] || league.game_id;
    const tierLabel = league.tier.charAt(0).toUpperCase() + league.tier.slice(1);
    const imageCIDs = TROPHY_IMAGE_CIDS[league.game_id];

    if (imageCIDs && imageCIDs[league.tier]) {
      const escrowSigner = getEscrowSigner();
      const trophyContract = new ethers.Contract(TROPHY_CONTRACT, TROPHY_ABI, escrowSigner);

      for (const winner of prizes) {
        // Check if already minted (idempotency)
        const existingPrizes = getLeaguePrizes(leagueId);
        const existing = existingPrizes.find(function(p) { return p.position === winner.position && p.tx_hash; });
        if (existing) {
          console.log('  Position ' + winner.position + ' already has prize record — skipping mint');
          continue;
        }

        // Create metadata
        const metadata = {
          name: gameName + ' — ' + tierLabel + ' League ' + ordinal(winner.position),
          description: 'Awarded for ' + ordinal(winner.position) + ' place in MathsWins ' + gameName + ' ' + tierLabel + ' League. Soulbound — non-transferable.',
          image: 'ipfs://' + imageCIDs[league.tier],
          external_url: 'https://mathswins.co.uk/qf-dapp/games/' + league.game_id + '/league/',
          attributes: [
            { trait_type: 'Game', value: gameName },
            { trait_type: 'Tier', value: tierLabel },
            { trait_type: 'Position', value: ordinal(winner.position) },
            { trait_type: 'League ID', value: leagueId.slice(0, 8) },
            { trait_type: 'Score', value: String(winner.score) },
            { display_type: 'date', trait_type: 'Awarded', value: Math.floor(Date.now() / 1000) }
          ]
        };

        // Pin metadata
        const pinName = league.game_id + '-' + league.tier + '-' + leagueId.slice(0, 8) + '-' + ordinal(winner.position);
        const metadataCID = await pinJSONToIPFS(metadata, pinName);
        console.log('  Pinned metadata for ' + ordinal(winner.position) + ': ' + metadataCID);

        // Mint trophy
        const mintTx = await trophyContract.mint(winner.wallet, 'ipfs://' + metadataCID);
        const receipt = await mintTx.wait();
        console.log('  Minted trophy to ' + winner.wallet.slice(0, 8) + '... tx: ' + receipt.hash);

        // Record prize in DB
        addLeaguePrize(leagueId, winner.position, winner.wallet, winner.amount);

        // Update with tx hash
        const db = getDb();
        db.prepare('UPDATE league_prizes SET tx_hash = ? WHERE league_id = ? AND position = ?')
          .run(receipt.hash, leagueId, winner.position);
      }
    } else {
      // No trophy images for this game — just record prizes without minting
      console.log('  No trophy images for ' + league.game_id + ' ' + league.tier + ' — skipping mint');
      for (const winner of prizes) {
        const existingPrizes = getLeaguePrizes(leagueId);
        const existing = existingPrizes.find(function(p) { return p.position === winner.position; });
        if (!existing) {
          addLeaguePrize(leagueId, winner.position, winner.wallet, winner.amount);
        }
      }
    }

    // Step 4: Distribute prizes (only if there's a pot)
    if (totalPot > 0) {
      for (const winner of prizes) {
        if (winner.amount > 0) {
          const txHash = await sendQF(winner.wallet, winner.amount);
          if (txHash) {
            const db = getDb();
            db.prepare('UPDATE league_prizes SET paid_at = ? WHERE league_id = ? AND position = ?')
              .run(Date.now(), leagueId, winner.position);
            console.log('  Paid ' + winner.amount + ' QF to ' + winner.wallet.slice(0, 8) + '...');
          }
        }
      }

      if (burnAmount > 0) {
        await sendQF(BURN_ADDRESS, burnAmount);
        console.log('  Burned ' + burnAmount + ' QF');
      }
      if (teamAmount > 0) {
        await sendQF(TEAM_WALLET, teamAmount);
        console.log('  Team ' + teamAmount + ' QF');
      }
    } else {
      console.log('  No prize pot — skipping QF distribution');
    }

    // Step 4b: Check achievements for ALL players in the league
    var settledAt = Date.now();
    var totalPlayers = leaderboard.length;
    for (var pi = 0; pi < totalPlayers; pi++) {
      var player = leaderboard[pi];
      var position = pi + 1;
      try {
        var walletLeagues = getDb().prepare(
          "SELECT COUNT(*) as count FROM league_players lp JOIN leagues l ON lp.league_id = l.id WHERE lp.wallet = ? AND lp.refunded = 0 AND l.status IN ('settled', 'settling')"
        ).get(player.wallet.toLowerCase());
        var walletWins = getDb().prepare(
          "SELECT COUNT(*) as count FROM league_prizes WHERE wallet = ? AND position = 1"
        ).get(player.wallet.toLowerCase());

        checkAchievements(player.wallet, {
          type: 'league_settle',
          gameId: league.game_id,
          leagueId: league.id,
          score: player.total_score,
          mistakes: player.mistakes || 0,
          position: position,
          won: position === 1,
          isLast: position === totalPlayers && totalPlayers >= 4,
          leagueCount: walletLeagues ? walletLeagues.count : 0,
          winCount: walletWins ? walletWins.count : 0,
        });
      } catch (e) {
        console.error('Achievement check failed for ' + player.wallet.slice(0, 8) + '...:', e.message);
      }
    }

    // Step 4b2: Check Shadows, Insomniac, and Monthly achievements for ALL players
    for (var si = 0; si < totalPlayers; si++) {
      var shadowPlayer = leaderboard[si];
      var shadowPosition = si + 1;
      try {
        checkShadowsAchievements(shadowPlayer.wallet, league.id, shadowPosition, settledAt);
      } catch (e) {
        console.error('Shadows achievement check failed for ' + shadowPlayer.wallet.slice(0, 8) + '...:', e.message);
      }
      try {
        checkInsomniac(shadowPlayer.wallet, league.id);
      } catch (e) {
        console.error('Insomniac achievement check failed for ' + shadowPlayer.wallet.slice(0, 8) + '...:', e.message);
      }
      try {
        checkMonthlyAchievements(shadowPlayer.wallet);
      } catch (e) { /* must never block */ }
      // Game-specific league achievements
      try {
        if (league.game_id === 'freecell') checkFreeCellLeague(shadowPlayer.wallet, league.id);
        if (league.game_id === 'kenken') checkKenKenLeague(shadowPlayer.wallet, league.id);
        if (league.game_id === 'nonogram') checkNonogramLeague(shadowPlayer.wallet, league.id, shadowPosition);
        if (league.game_id === 'kakuro') checkKakuroLeague(shadowPlayer.wallet, league.id);
      } catch (e) { /* must never block */ }
      // Batch 7: per-game volume, meta, wooden spoons
      try {
        checkSettlementBatch7(shadowPlayer.wallet, league.id, league.game_id, shadowPosition, totalPlayers);
      } catch (e) { /* must never block */ }
    }

    // Step 4b3: Slow-burn and last-and-slow (Minesweeper only, once per league)
    try {
      checkSlowBurnAndLastSlow(league.id, league.game_id, leaderboard);
    } catch (e) { /* must never block */ }

    // Step 4b4: Regicide and Detention (owner wallet rival achievements)
    try {
      checkRegicideDetention(leaderboard);
    } catch (e) { /* must never block */ }

    // Step 4c: Upsert league bests for all players
    for (const player of leaderboard) {
      try {
        upsertLeagueBest(player.wallet, league.game_id, league.tier, player.total_score, leagueId);
      } catch (e) {
        console.error('League best upsert failed for ' + player.wallet.slice(0, 8) + '...:', e.message);
      }
    }

    // Step 5: Finalise
    const db = getDb();
    db.prepare('UPDATE leagues SET status = ?, settled_at = ? WHERE id = ?')
      .run('settled', settledAt, leagueId);

    const result = {
      status: 'settled',
      league_id: leagueId,
      game: league.game_id,
      tier: league.tier,
      positions: prizes,
      pot: totalPot
    };
    console.log('League ' + leagueId + ' settled: ' + prizes.length + ' trophies, ' + totalPot + ' QF pot');
    return result;

  } catch (e) {
    // On failure, reset to active so it can be retried
    console.error('Settlement failed for ' + leagueId + ':', e.message);
    updateLeagueStatus(leagueId, 'active');
    throw e;
  }
}

// ── Check if all puzzles complete (early settlement trigger) ────────
export function checkEarlySettlement(leagueId) {
  const league = getLeagueById(leagueId);
  if (!league || league.status !== 'active') return false;

  const playerCount = getLeaguePlayerCount(leagueId);
  const db = getDb();
  const scoreCount = db.prepare('SELECT COUNT(*) as count FROM league_scores WHERE league_id = ?').get(leagueId);
  const totalExpected = playerCount * (league.puzzle_count || 10);

  if (scoreCount.count >= totalExpected) {
    console.log('All puzzles complete for league ' + leagueId + ' — triggering early settlement');
    doSettleLeague(leagueId).catch(function(e) {
      console.error('Early settlement failed:', e.message);
    });
    return true;
  }
  return false;
}

// ── Stuck recovery ──────────────────────────────────────────────────
export function recoverStuckLeagues() {
  const db = getDb();
  const stuck = db.prepare("SELECT id FROM leagues WHERE status = 'settling' AND settled_at IS NULL").all();
  for (const league of stuck) {
    // Check if it's been settling for over 30 minutes (no settled_at means it started settling but never finished)
    console.log('Recovering stuck league: ' + league.id);
    updateLeagueStatus(league.id, 'active');
  }
}

// ── Commemorative NFT minting ──────────────────────────────────────
const COMMEMORATIVE_METADATA_URI = 'ipfs://QmNxfFF3CeiiPNfoeFnNfoNfioKdy8N9quZ7LhWzsbV8rr';

export async function mintCommemorative(leagueId) {
  const db = getDb();

  // Find all wallets that submitted at least 1 score in this league
  const eligible = db.prepare(
    'SELECT DISTINCT wallet FROM league_scores WHERE league_id = ?'
  ).all(leagueId).map(r => r.wallet);

  if (eligible.length === 0) {
    return { error: 'No eligible wallets — zero scores submitted', minted: 0 };
  }

  // Check which wallets already received a commemorative for this league
  db.exec(`CREATE TABLE IF NOT EXISTS commemorative_mints (
    league_id TEXT NOT NULL,
    wallet TEXT NOT NULL,
    tx_hash TEXT,
    minted_at INTEGER NOT NULL,
    PRIMARY KEY (league_id, wallet)
  )`);

  const alreadyMinted = new Set(
    db.prepare('SELECT wallet FROM commemorative_mints WHERE league_id = ?')
      .all(leagueId).map(r => r.wallet)
  );

  const toMint = eligible.filter(w => !alreadyMinted.has(w));
  if (toMint.length === 0) {
    return { message: 'All eligible wallets already minted', minted: 0, total_eligible: eligible.length };
  }

  const signer = getEscrowSigner();
  const trophyContract = new ethers.Contract(TROPHY_CONTRACT, TROPHY_ABI, signer);
  const results = [];

  for (const wallet of toMint) {
    try {
      const tx = await trophyContract.mint(wallet, COMMEMORATIVE_METADATA_URI);
      const receipt = await tx.wait();
      db.prepare('INSERT INTO commemorative_mints (league_id, wallet, tx_hash, minted_at) VALUES (?, ?, ?, ?)')
        .run(leagueId, wallet, receipt.hash, Date.now());
      results.push({ wallet, tx: receipt.hash, status: 'minted' });
      console.log('Commemorative minted to ' + wallet.slice(0, 8) + '... tx: ' + receipt.hash);
    } catch (e) {
      results.push({ wallet, status: 'failed', error: e.message });
      console.error('Commemorative mint failed for ' + wallet.slice(0, 8) + '...:', e.message);
    }
  }

  return { minted: results.filter(r => r.status === 'minted').length, failed: results.filter(r => r.status === 'failed').length, total_eligible: eligible.length, results };
}
