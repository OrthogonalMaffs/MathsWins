/**
 * Deploy QFSettlement to QF Network (PolkaVM).
 *
 * Usage:
 *   cd /home/jon/MathsWins/contracts
 *   PRIVATE_KEY=0x... node script/deploy-settlement.mjs
 *
 * The deployer wallet becomes the contract owner.
 * Constructor arg: team wallet (0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016)
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';

const RPC = 'https://archive.mainnet.qfnode.net/eth';
const TEAM_WALLET = '0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Usage: PRIVATE_KEY=0x... node script/deploy-settlement.mjs');
  process.exit(1);
}

const bytecode = '0x' + readFileSync('out-pvm/QFSettlement.sol:QFSettlement.pvm', 'hex');
const abi = JSON.parse(readFileSync('out/QFSettlement.sol/QFSettlement.json', 'utf8')).abi;

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log('Deployer (will be owner):', wallet.address);
console.log('Team wallet:', TEAM_WALLET);
console.log('');

console.log('Deploying QFSettlement...');
const factory = new ethers.ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy(TEAM_WALLET);
await contract.waitForDeployment();
const addr = await contract.getAddress();

console.log('');
console.log('═══════════════════════════════════════');
console.log('QFSettlement:', addr);
console.log('Owner:', wallet.address);
console.log('Team wallet:', TEAM_WALLET);
console.log('═══════════════════════════════════════');
console.log('');
console.log('Copy the contract address above and paste it back to Claude Code.');
