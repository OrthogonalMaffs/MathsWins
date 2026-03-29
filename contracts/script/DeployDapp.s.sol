// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/GameEntry.sol";
import "../src/PrizePot.sol";

contract DeployDapp is Script {
    function run() external {
        address operator = vm.envAddress("OPERATOR");
        address treasury = vm.envAddress("TREASURY");
        uint256 minWalletAge = vm.envOr("MIN_WALLET_AGE", uint256(0));

        vm.startBroadcast();

        // Deploy PrizePot first
        PrizePot pot = new PrizePot(operator, treasury);
        console.log("PrizePot deployed at:", address(pot));

        // Deploy GameEntry, pointing to PrizePot
        GameEntry entry = new GameEntry(address(pot), minWalletAge);
        console.log("GameEntry deployed at:", address(entry));

        // Wire: PrizePot accepts deposits from GameEntry
        pot.setGameEntry(address(entry));
        console.log("PrizePot.gameEntry set to:", address(entry));

        vm.stopBroadcast();

        console.log("---");
        console.log("Operator:", operator);
        console.log("Treasury:", treasury);
        console.log("Single fee:", entry.singleFee());
        console.log("Triple fee:", entry.tripleFee());
    }
}
