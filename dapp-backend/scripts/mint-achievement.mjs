#!/usr/bin/env node
// Direct on-chain mint of an achievement NFT. Used when the admin HTTP
// route (/admin/achievement/award + /achievement/mint) is gated behind
// ADMIN_SECRET/ADMIN_WALLETS env vars that aren't set on Box 1.
//
// Step 1: award eligibility (is_pioneer=1 if first claimant)
// Step 2: ensure metadata CID (pre-pinned map, otherwise pin fresh)
// Step 3: contract.mint(wallet, tokenURI) via the minter/escrow signer
// Step 4: parse tokenId from Transfer log, update eligibility row
//
// Usage: node scripts/mint-achievement.mjs <achievement_id> <wallet>

import { readFileSync, existsSync } from 'fs';
import { URL as _URL } from 'url';
import { join } from 'path';
{
  const envPath = new _URL('../.env', import.meta.url).pathname;
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}

const [, , achievementId, rawWallet] = process.argv;
if (!achievementId || !rawWallet) {
  console.error('Usage: node scripts/mint-achievement.mjs <achievement_id> <wallet>');
  process.exit(1);
}
const wallet = rawWallet.toLowerCase();

const { getDb, getAchievement, awardAchievement, getWalletAchievements } = await import('../src/db/index.mjs');
const { ethers } = await import('ethers');

const db = getDb();
const registry = getAchievement(achievementId);
if (!registry) { console.error('Achievement not found:', achievementId); process.exit(1); }
if (!registry.active) { console.error('Achievement not active:', achievementId); process.exit(1); }

// Step 1: award eligibility (also sets pioneer tag if first)
console.log('Awarding eligibility for', achievementId, '→', wallet);
const awardRes = awardAchievement(wallet, achievementId);
console.log('  awarded:', awardRes.awarded, 'pioneer:', awardRes.pioneer || false);

const eligibility = getWalletAchievements(wallet);
const row = eligibility.find(e => e.achievement_id === achievementId);
if (!row) { console.error('Eligibility row missing after award — aborting'); process.exit(1); }
if (row.minted_at) { console.log('Already minted. tx:', row.tx_hash); process.exit(0); }

// Step 2: resolve tokenURI. Prefer pre-pinned ipfs-mapping.json entry.
const mappingPath = join(process.cwd(), 'src', 'achievements', 'ipfs-mapping.json');
let metadataCID = null;
if (existsSync(mappingPath)) {
  const map = JSON.parse(readFileSync(mappingPath, 'utf8'));
  const hit = map.find(e => e.achievement_id === achievementId);
  if (hit && hit.metadata_ipfs) {
    metadataCID = hit.metadata_ipfs.replace(/^ipfs:\/\//, '');
    console.log('Using pre-pinned metadata CID:', metadataCID);
  }
}
if (!metadataCID) {
  console.error('No pre-pinned metadata for', achievementId, '— fresh Pinata pin not implemented in this script. Aborting.');
  process.exit(1);
}
const tokenURI = 'https://gateway.pinata.cloud/ipfs/' + metadataCID;

// Step 3: on-chain mint
const ACHIEVEMENT_CONTRACT = process.env.ACHIEVEMENT_CONTRACT;
if (!ACHIEVEMENT_CONTRACT) { console.error('ACHIEVEMENT_CONTRACT env not set'); process.exit(1); }
const ABI = ['function mint(address to, string uri) returns (uint256)', 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'];

const keyPath = join(process.cwd(), 'data', 'escrow.key');
const key = readFileSync(keyPath, 'utf8').trim();
const provider = new ethers.JsonRpcProvider(process.env.QF_RPC_URL || 'https://archive.mainnet.qfnode.net/eth');
const signer = new ethers.Wallet(key, provider);
const contract = new ethers.Contract(ACHIEVEMENT_CONTRACT, ABI, signer);

console.log('Minter:  ', signer.address);
console.log('Contract:', ACHIEVEMENT_CONTRACT);
console.log('Calling contract.mint(' + wallet + ', tokenURI) ...');

const tx = await contract.mint(wallet, tokenURI);
console.log('  tx hash:', tx.hash, '— waiting for receipt...');
const receipt = await tx.wait();
console.log('  mined. gas used:', receipt.gasUsed.toString());

// Step 4: extract tokenId from Transfer event
let tokenId = null;
const transferSig = ethers.id('Transfer(address,address,uint256)');
for (const log of receipt.logs) {
  if (log.topics && log.topics[0] === transferSig) {
    tokenId = BigInt(log.topics[3]).toString();
    break;
  }
}
if (!tokenId) { console.error('Could not parse tokenId from Transfer event'); process.exit(1); }
console.log('  tokenId:', tokenId);

db.prepare('UPDATE achievement_eligibility SET minted_at = ?, tx_hash = ?, metadata_cid = ?, token_id = ? WHERE wallet = ? AND achievement_id = ?')
  .run(Date.now(), receipt.hash, metadataCID, tokenId, wallet, achievementId);

console.log('Done.');
process.exit(0);
