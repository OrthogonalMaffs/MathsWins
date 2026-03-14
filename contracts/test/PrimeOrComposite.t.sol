// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/QFGamesHub.sol";
import "../src/PrimeOrCompositeSatellite.sol";

contract PrimeOrCompositeTest is Test {
    QFGamesHub hub;
    PrimeOrCompositeSatellite satellite;

    address owner = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    uint256 constant FEE = 10 ether; // 10 QF

    function setUp() public {
        hub = new QFGamesHub(owner);
        satellite = new PrimeOrCompositeSatellite(address(hub), FEE);

        // Register satellite with hub
        hub.registerSatellite(address(satellite));

        vm.deal(alice, 1000 ether);
        vm.deal(bob, 1000 ether);
        // Fund hub gas reserve
        vm.deal(address(hub), 1 ether);
    }

    // ── Full flow: submit score, check leaderboard, check badge ─────────

    function test_fullFlow() public {
        vm.prank(alice);
        satellite.submitScore{value: FEE}(42);

        // Check leaderboard
        (address[] memory players, uint256[] memory scores,) = satellite.getLeaderboard();
        assertEq(players.length, 1);
        assertEq(players[0], alice);
        assertEq(scores[0], 42);

        // Check badge was minted (rank 1 = Delta = tier 3)
        assertEq(hub.balanceOf(alice, 3), 1);
        assertTrue(hub.hasBadge(alice));
        assertEq(hub.getHighestTier(alice), 3);
    }

    function test_burnAndHubSplit() public {
        uint256 burnBefore = address(0xdead).balance;
        uint256 hubBefore = address(hub).balance;

        vm.prank(alice);
        satellite.submitScore{value: FEE}(50);

        uint256 burned = address(0xdead).balance - burnBefore;
        uint256 hubReceived = address(hub).balance - hubBefore;

        assertEq(burned, 2.5 ether);      // 25% of 10 QF
        assertEq(hubReceived, 7.5 ether);  // 75% of 10 QF
    }

    function test_badgeTiersByRank() public {
        // Submit scores in DECREASING order so each player gets their
        // final rank immediately (no displacement)
        // Score 100 = rank 1, score 90 = rank 2, etc.
        for (uint256 i = 10; i >= 1; i--) {
            address player = address(uint160(i + 1000));
            vm.deal(player, 100 ether);
            vm.prank(player);
            satellite.submitScore{value: FEE}(i * 10);
        }

        // Rank 1 (score 100) = Delta (tier 3)
        assertEq(hub.getHighestTier(address(uint160(1010))), 3);

        // Rank 2 (score 90) = Lambda (tier 2)
        assertEq(hub.getHighestTier(address(uint160(1009))), 2);

        // Rank 3 (score 80) = Lambda (tier 2)
        assertEq(hub.getHighestTier(address(uint160(1008))), 2);

        // Rank 4 (score 70) = Beta (tier 1)
        assertEq(hub.getHighestTier(address(uint160(1007))), 1);

        // Rank 7 (score 40) = Alpha (tier 0)
        assertEq(hub.getHighestTier(address(uint160(1004))), 0);
    }

    function test_discountAfterBadge() public {
        vm.prank(alice);
        satellite.submitScore{value: FEE}(50); // rank 1 = Delta

        // Delta = 25% discount
        uint256 discounted = hub.calculatePrice(alice, 10 ether);
        assertEq(discounted, 7.5 ether); // 10 - 25% = 7.5
    }

    function test_revertInvalidScore() public {
        vm.prank(alice);
        vm.expectRevert(QFSimpleSatellite.InvalidScore.selector);
        satellite.submitScore{value: FEE}(0);

        vm.prank(alice);
        vm.expectRevert(QFSimpleSatellite.InvalidScore.selector);
        satellite.submitScore{value: FEE}(201); // > MAX_PLAUSIBLE_SCORE
    }

    function test_revertInsufficientFee() public {
        vm.prank(alice);
        vm.expectRevert(QFSimpleSatellite.InsufficientFee.selector);
        satellite.submitScore{value: 1 ether}(50);
    }

    function test_revertScoreTooLow() public {
        // Fill board
        for (uint256 i = 1; i <= 10; i++) {
            address player = address(uint160(i + 2000));
            vm.deal(player, 100 ether);
            vm.prank(player);
            satellite.submitScore{value: FEE}(i * 10);
        }

        vm.prank(alice);
        vm.expectRevert(QFSimpleSatellite.ScoreTooLow.selector);
        satellite.submitScore{value: FEE}(5); // below min of 10
    }

    function test_gameName() public view {
        assertEq(satellite.gameName(), "Prime or Composite");
    }

    function test_hubAddress() public view {
        assertEq(satellite.hub(), address(hub));
    }

    function test_soulbound() public {
        vm.prank(alice);
        satellite.submitScore{value: FEE}(50);

        // Try to transfer badge — should revert
        vm.prank(alice);
        vm.expectRevert();
        hub.safeTransferFrom(alice, bob, 3, 1, "");
    }

    function test_highestTierOnlyGoesUp() public {
        // Alice gets rank 1 = Delta (tier 3)
        vm.prank(alice);
        satellite.submitScore{value: FEE}(100);
        assertEq(hub.getHighestTier(alice), 3);

        // Bob pushes alice down to rank 2 with a higher score
        vm.prank(bob);
        satellite.submitScore{value: FEE}(150);

        // Alice still has Delta as highest (badge is permanent)
        assertEq(hub.getHighestTier(alice), 3);
    }

    receive() external payable {}
}
