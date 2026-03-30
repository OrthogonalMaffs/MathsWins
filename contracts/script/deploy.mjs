/**
 * Deploy GameEntry + PrizePot to QF Network (PolkaVM).
 * Uses resolc-compiled PVM bytecode.
 *
 * Usage:
 *   PRIVATE_KEY=0x... OPERATOR=0x... TREASURY=0x... node script/deploy.mjs
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';

const RPC = 'https://archive.mainnet.qfnode.net/eth';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const OPERATOR = process.env.OPERATOR;
const TREASURY = process.env.TREASURY;

if (!PRIVATE_KEY || !OPERATOR || !TREASURY) {
  console.error('Usage: PRIVATE_KEY=0x... OPERATOR=0x... TREASURY=0x... node script/deploy.mjs');
  process.exit(1);
}

// Read PVM bytecode (resolc output) and ABI (forge output)
const potBytecode = '0x' + readFileSync('out-pvm/PrizePot.sol:PrizePot.pvm', 'hex');
const entryBytecode = '0x' + readFileSync('out-pvm/GameEntry.sol:GameEntry.pvm', 'hex');
const potAbi = JSON.parse(readFileSync('out/PrizePot.sol/PrizePot.json', 'utf8')).abi;
const entryAbi = JSON.parse(readFileSync('out/GameEntry.sol/GameEntry.json', 'utf8')).abi;

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log('Deployer:', wallet.address);
console.log('Operator:', OPERATOR);
console.log('Treasury:', TREASURY);
console.log('');

// Deploy PrizePot
console.log('Deploying PrizePot...');
const PrizePotFactory = new ethers.ContractFactory(potAbi, potBytecode, wallet);
const pot = await PrizePotFactory.deploy(OPERATOR, TREASURY);
await pot.waitForDeployment();
const potAddr = await pot.getAddress();
console.log('PrizePot deployed at:', potAddr);

// Deploy GameEntry
console.log('Deploying GameEntry...');
const GameEntryFactory = new ethers.ContractFactory(entryAbi, entryBytecode, wallet);
const entry = await GameEntryFactory.deploy(potAddr);
await entry.waitForDeployment();
const entryAddr = await entry.getAddress();
console.log('GameEntry deployed at:', entryAddr);

// Wire PrizePot to accept deposits from GameEntry
console.log('Wiring PrizePot.setGameEntry...');
const tx = await pot.setGameEntry(entryAddr);
await tx.wait();
console.log('Done.');

console.log('');
console.log('═══════════════════════════════════════');
console.log('PrizePot:  ', potAddr);
console.log('GameEntry: ', entryAddr);
console.log('Owner:     ', wallet.address, '(transfer to Ledger!)');
console.log('Operator:  ', OPERATOR);
console.log('Treasury:  ', TREASURY);
console.log('═══════════════════════════════════════');
console.log('');
console.log('Next steps:');
console.log('1. Transfer ownership of both contracts to your Ledger');
console.log('2. Set GAME_ENTRY_CONTRACT and PRIZE_POT_CONTRACT env vars on Box 2');
