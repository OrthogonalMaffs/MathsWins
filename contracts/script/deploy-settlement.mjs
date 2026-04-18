/**
 * Deploy QFSettlement v2 to QF Network (PolkaVM).
 *
 * Usage (run on Jon's private terminal — key never leaves the machine):
 *   cd /home/jon/MathsWins/contracts
 *   PRIVATE_KEY=0x... node script/deploy-settlement.mjs
 *
 * Constructor: (owner, teamWallet)
 *   owner       = 0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016  (Ledger)
 *   teamWallet  = 0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016  (Ledger, same address)
 *
 * Default splits set by constructor:
 *   burnPct = 5, teamPct = 10 → settle() pays 5% burn, 10% team, 85% winner
 *   splitFee() is hardcoded 5% burn / 95% team — NOT affected by setSplits()
 *
 * Deployer (msg.sender) must be onlyfans.qf: 0xB21039b9A7e360561d9AE7EE0A8B1b722f2057A3.
 * The deployer is NOT the owner — owner is set explicitly via constructor arg.
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';

const RPC = 'https://archive.mainnet.qfnode.net/eth';
const OWNER_LEDGER = '0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016';
const TEAM_WALLET = '0x8a542f4F1814fb2C29b96D8619FdaABBf67F3016';
const EXPECTED_DEPLOYER = '0xB21039b9A7e360561d9AE7EE0A8B1b722f2057A3';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('Usage: PRIVATE_KEY=0x... node script/deploy-settlement.mjs');
  process.exit(1);
}

const bytecode = '0x' + readFileSync('out-pvm/QFSettlement.sol:QFSettlement.pvm').toString('hex');
const abi = JSON.parse(readFileSync('out/QFSettlement.sol/QFSettlement.json', 'utf8')).abi;

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log('Deployer (msg.sender):', wallet.address);
console.log('Expected deployer:    ', EXPECTED_DEPLOYER);
if (wallet.address.toLowerCase() !== EXPECTED_DEPLOYER.toLowerCase()) {
  console.error('');
  console.error('REFUSING TO DEPLOY: deployer address does not match onlyfans.qf.');
  console.error('Abort and check which key you loaded.');
  process.exit(1);
}
console.log('Owner (constructor): ', OWNER_LEDGER);
console.log('Team wallet:         ', TEAM_WALLET);
console.log('RPC:                 ', RPC);
console.log('');

const net = await provider.getNetwork();
console.log('Chain ID:', net.chainId.toString());
if (net.chainId !== 3426n) {
  console.error('REFUSING TO DEPLOY: expected chain 3426, got ' + net.chainId);
  process.exit(1);
}

const bal = await provider.getBalance(wallet.address);
console.log('Deployer balance:', ethers.formatEther(bal), 'QF');
if (bal === 0n) {
  console.error('REFUSING TO DEPLOY: deployer has zero QF for gas.');
  process.exit(1);
}
console.log('');

console.log('Deploying QFSettlement v2...');
const factory = new ethers.ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy(OWNER_LEDGER, TEAM_WALLET);
console.log('  tx hash:', contract.deploymentTransaction().hash);
await contract.waitForDeployment();
const addr = await contract.getAddress();

console.log('');
console.log('═══════════════════════════════════════');
console.log('QFSettlement v2 deployed:');
console.log('  Address:    ', addr);
console.log('  Deployer:   ', wallet.address);
console.log('  Owner:      ', OWNER_LEDGER);
console.log('  Team wallet:', TEAM_WALLET);
console.log('  Tx hash:    ', contract.deploymentTransaction().hash);
console.log('═══════════════════════════════════════');
console.log('');
console.log('Verifying on-chain state...');
const deployed = new ethers.Contract(addr, abi, provider);
const [onOwner, onTeam, onBurn, onTeamPct] = await Promise.all([
  deployed.owner(),
  deployed.teamWallet(),
  deployed.burnPct(),
  deployed.teamPct()
]);
console.log('  owner():   ', onOwner, onOwner.toLowerCase() === OWNER_LEDGER.toLowerCase() ? 'OK' : 'MISMATCH');
console.log('  teamWallet:', onTeam, onTeam.toLowerCase() === TEAM_WALLET.toLowerCase() ? 'OK' : 'MISMATCH');
console.log('  burnPct:   ', onBurn.toString(), onBurn === 5n ? 'OK' : 'MISMATCH');
console.log('  teamPct:   ', onTeamPct.toString(), onTeamPct === 10n ? 'OK' : 'MISMATCH');
console.log('');
console.log('Copy the contract address above and paste it back to Claude Code.');
