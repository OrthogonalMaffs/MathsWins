/**
 * Deploy QFAchievement v2 to QF Network (PolkaVM).
 *
 * Usage:
 *   cd /home/jon/MathsWins/contracts
 *   PRIVATE_KEY=0x... node script/deploy-achievement.mjs
 *
 * The deployer wallet becomes the contract owner.
 * Minter is set to the escrow wallet: 0x26b4A4115D184837530a42B34B945D5d1d2aa67e
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';

const RPC = 'https://archive.mainnet.qfnode.net/eth';
const MINTER = '0x26b4A4115D184837530a42B34B945D5d1d2aa67e';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Usage: PRIVATE_KEY=0x... node script/deploy-achievement.mjs');
  process.exit(1);
}

const bytecode = '0x' + readFileSync('out-pvm/QFAchievement.sol:QFAchievement.pvm', 'hex');
const abi = JSON.parse(readFileSync('out/QFAchievement.sol/QFAchievement.json', 'utf8')).abi;

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log('Deployer (will be owner):', wallet.address);
console.log('Minter:', MINTER);
console.log('');

console.log('Deploying QFAchievement v2...');
const factory = new ethers.ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy(MINTER);
await contract.waitForDeployment();
const addr = await contract.getAddress();

console.log('');
console.log('═══════════════════════════════════════');
console.log('QFAchievement v2:', addr);
console.log('Owner:', wallet.address);
console.log('Minter:', MINTER);
console.log('═══════════════════════════════════════');
console.log('');
console.log('Copy the contract address above and paste it back to Claude Code.');
