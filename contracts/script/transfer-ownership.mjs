/**
 * Transfer ownership of GameEntry + PrizePot to Ledger.
 *
 * Usage:
 *   PRIVATE_KEY=0x... node script/transfer-ownership.mjs
 */

import { ethers } from 'ethers';

const RPC = 'https://archive.mainnet.qfnode.net/eth';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const LEDGER = '0xf63479f8e7b31a927514D8f432cdD498e149eABc';
const GAME_ENTRY = '0x6e1d573A8e40BaCb2ccC0A913a2989e35bE1151d';
const PRIZE_POT = '0x8A433d114Da837f99c62B391d770523F2Bb9fD0F';

if (!PRIVATE_KEY) {
  console.error('Usage: PRIVATE_KEY=0x... node script/transfer-ownership.mjs');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const abi = ['function transferOwnership(address)', 'function owner() view returns (address)'];

console.log('Transferring ownership to Ledger:', LEDGER);

const ge = new ethers.Contract(GAME_ENTRY, abi, wallet);
const tx1 = await ge.transferOwnership(LEDGER);
await tx1.wait();
console.log('GameEntry ownership transferred');

const pp = new ethers.Contract(PRIZE_POT, abi, wallet);
const tx2 = await pp.transferOwnership(LEDGER);
await tx2.wait();
console.log('PrizePot ownership transferred');

// Verify
const geOwner = await ge.owner();
const ppOwner = await pp.owner();
console.log('GameEntry owner:', geOwner);
console.log('PrizePot owner:', ppOwner);
