#!/usr/bin/env node
// One-shot: update on-chain tokenURI for all 26 minted achievement NFTs to
// point at GitHub Pages metadata after the Pinata → mathswins.co.uk migration.
//
// Usage: node qf-dapp/scripts/set-token-uris.mjs
// Requires: qf-dapp/scripts/.env containing OWNER_PRIVATE_KEY=0x...
// The owner key controls 0xB21039b9A7e360561d9AE7EE0A8B1b722f2057A3 (onlyfans.qf),
// which is the owner of QFAchievement.sol v2 and the only address authorised
// to call setTokenURI.

import { ethers } from 'ethers';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Local .env loader (mirrors dapp-backend/scripts/mint-achievement.mjs pattern)
{
  const envPath = join(__dirname, '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}

const KEY = process.env.OWNER_PRIVATE_KEY;
if (!KEY) {
  console.error('OWNER_PRIVATE_KEY not set. Add it to qf-dapp/scripts/.env (not committed).');
  process.exit(1);
}

const RPC_URL = 'https://archive.mainnet.qfnode.net/eth';
const CHAIN_ID = 3426;
const CONTRACT = '0xc519E65Fb767DBEFC46FF0dC797Ccd0318Ae12eD';
const ABI = ['function setTokenURI(uint256 tokenId, string memory uri) external'];
const BASE_URI = 'https://mathswins.co.uk/qf-dapp/nft/achievements/metadata';

const TOKENS = [
  [1,  'founding-member'],
  [2,  'founding-member'],
  [3,  'founding-member'],
  [4,  'founding-member'],
  [7,  'six-seven'],
  [8,  'personal-best'],
  [9,  'palindrome'],
  [10, 'wrong-answer-streak'],
  [11, 'wrong-answer-streak'],
  [12, 'dead-reckoning'],
  [13, 'the-engineer'],
  [14, 'palindrome'],
  [15, 'six-seven'],
  [16, 'personal-best'],
  [17, 'skin-in-the-game'],
  [18, 'bug-hunter'],
  [19, 'six-seven'],
  [20, 'bug-hunter'],
  [21, 'league-month'],
  [22, 'wordy'],
  [23, 'bug-hunter'],
  [24, 'collector'],
  [25, 'next-in-line'],
  [26, 'explorer'],
  [27, 'active-player'],
  [28, 'pioneer-hunter']
];

const provider = new ethers.JsonRpcProvider(RPC_URL, { chainId: CHAIN_ID, name: 'qf' });
const signer = new ethers.Wallet(KEY, provider);
const contract = new ethers.Contract(CONTRACT, ABI, signer);

console.log('Signer:    ', signer.address);
console.log('Contract:  ', CONTRACT);
console.log('RPC:       ', RPC_URL);
console.log('Tokens:    ', TOKENS.length);
console.log('---');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

for (let i = 0; i < TOKENS.length; i++) {
  const [tokenId, achievementId] = TOKENS[i];
  const uri = `${BASE_URI}/${achievementId}.json`;
  console.log(`[${i + 1}/${TOKENS.length}] token ${tokenId} → ${achievementId}`);
  console.log(`  uri: ${uri}`);
  try {
    const tx = await contract.setTokenURI(tokenId, uri);
    console.log(`  tx hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`  mined. block ${receipt.blockNumber}, gas ${receipt.gasUsed}`);
  } catch (err) {
    console.error(`  FAIL on token ${tokenId} (${achievementId}): ${err.message}`);
    console.error('  Stopping. No further tokens will be updated.');
    process.exit(1);
  }
  if (i < TOKENS.length - 1) await sleep(2000);
}

console.log('---');
console.log('All 26 tokenURIs updated successfully.');
process.exit(0);
