// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/QFGamesHub.sol";
import "../src/PrimeOrCompositeSatellite.sol";

/// @notice Deploy Hub + PrimeOrComposite satellite, register satellite, fund gas reserve.
///
/// Usage (local Anvil):
///   PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
///     forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
///
/// Usage (QF testnet):
///   PRIVATE_KEY=<your-key> \
///     forge script script/Deploy.s.sol --rpc-url https://archive.mainnet.qfnode.net/eth --broadcast

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // 1. Deploy Hub
        QFGamesHub hub = new QFGamesHub(deployer);

        // 2. Deploy PrimeOrComposite satellite (10 QF fee)
        PrimeOrCompositeSatellite satellite = new PrimeOrCompositeSatellite(
            address(hub),
            10 ether // 10 QF submission fee
        );

        // 3. Register satellite with Hub
        hub.registerSatellite(address(satellite));

        // 4. Fund Hub gas reserve (0.1 QF for initial testing)
        (bool ok,) = address(hub).call{value: 0.1 ether}("");
        require(ok, "Failed to fund hub");

        vm.stopBroadcast();

        // Log addresses for pasting into HTML files
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Hub:                ", address(hub));
        console.log("PrimeOrComposite:   ", address(satellite));
        console.log("Owner:              ", deployer);
        console.log("Hub balance:        ", address(hub).balance);
    }
}
