// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/GameEntry.sol";
import "../src/PrizePot.sol";

contract GameEntryTest is Test {
    GameEntry public entry;
    PrizePot public pot;

    address owner = address(this);
    address operator = address(0xBEEF);
    address treasury = address(0xCAFE);
    address player1 = address(0x1111);
    address player2 = address(0x2222);

    uint256 constant GAME_1 = 1;
    uint256 constant GAME_2 = 2;
    uint256 constant WEEK_1 = 1;

    function setUp() public {
        pot = new PrizePot(operator, treasury);
        entry = new GameEntry(address(pot));
        pot.setGameEntry(address(entry));

        vm.deal(player1, 1000 ether);
        vm.deal(player2, 1000 ether);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════════════

    function test_SingleEntry() public {
        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
    }

    function test_TripleEntry() public {
        vm.prank(player1);
        entry.enter{value: 25 ether}(GAME_1, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 3);
    }

    function test_RevertInvalidFee() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.InvalidFee.selector);
        entry.enter{value: 15 ether}(GAME_1, WEEK_1);
    }

    function test_RevertZeroFee() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.InvalidFee.selector);
        entry.enter{value: 0}(GAME_1, WEEK_1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DUPLICATE ENTRY PROTECTION
    // ═══════════════════════════════════════════════════════════════════════

    function test_RevertDoubleEntry() public {
        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        vm.prank(player1);
        vm.expectRevert(GameEntry.AlreadyEntered.selector);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
    }

    function test_RevertDoubleEntryDifferentTier() public {
        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        vm.prank(player1);
        vm.expectRevert(GameEntry.AlreadyEntered.selector);
        entry.enter{value: 25 ether}(GAME_1, WEEK_1);
    }

    function test_SamePlayerDifferentWeeks() public {
        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, 2);

        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
        assertEq(entry.getEntry(player1, GAME_1, 2), 1);
    }

    function test_SamePlayerDifferentGames() public {
        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        vm.prank(player1);
        entry.enter{value: 25 ether}(GAME_2, WEEK_1);

        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
        assertEq(entry.getEntry(player1, GAME_2, WEEK_1), 3);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FUND ROUTING
    // ═══════════════════════════════════════════════════════════════════════

    function test_BurnRouting_Single() public {
        uint256 deadBefore = address(0xdead).balance;

        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        assertEq(address(0xdead).balance - deadBefore, 0.5 ether);
    }

    function test_BurnRouting_Triple() public {
        uint256 deadBefore = address(0xdead).balance;

        vm.prank(player1);
        entry.enter{value: 25 ether}(GAME_1, WEEK_1);

        assertEq(address(0xdead).balance - deadBefore, 1.25 ether);
    }

    function test_PotReceives95Percent() public {
        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        (uint256 potBal, uint256 treasuryBal, uint256 entryCount,) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(potBal, 4.75 ether);
        assertEq(treasuryBal, 4.75 ether);
        assertEq(entryCount, 1);
    }

    function test_EntryContractHoldsZero() public {
        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        // GameEntry should never hold funds — everything routes out
        assertEq(address(entry).balance, 0);
    }

    function test_ExactMathNoRoundingLoss() public {
        // Verify burn + pot = exactly msg.value for both tiers
        uint256 deadBefore = address(0xdead).balance;
        uint256 potBefore = address(pot).balance;

        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        uint256 burned = address(0xdead).balance - deadBefore;
        uint256 potted = address(pot).balance - potBefore;
        assertEq(burned + potted, 10 ether);

        deadBefore = address(0xdead).balance;
        potBefore = address(pot).balance;

        vm.prank(player2);
        entry.enter{value: 25 ether}(GAME_1, WEEK_1);

        burned = address(0xdead).balance - deadBefore;
        potted = address(pot).balance - potBefore;
        assertEq(burned + potted, 25 ether);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_EmitsEntryRecorded() public {
        vm.prank(player1);
        vm.expectEmit(true, true, true, true);
        emit GameEntry.EntryRecorded(player1, GAME_1, WEEK_1, 1, block.timestamp);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN — FEE CHANGES
    // ═══════════════════════════════════════════════════════════════════════

    function test_SetFees() public {
        entry.setFees(20 ether, 50 ether);
        assertEq(entry.singleFee(), 20 ether);
        assertEq(entry.tripleFee(), 50 ether);
    }

    function test_EntryAtNewPrice() public {
        entry.setFees(20 ether, 50 ether);

        vm.prank(player1);
        entry.enter{value: 20 ether}(GAME_1, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
    }

    function test_RevertOldPriceAfterChange() public {
        entry.setFees(20 ether, 50 ether);

        vm.prank(player1);
        vm.expectRevert(GameEntry.InvalidFee.selector);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
    }

    function test_RevertSetFeesNotOwner() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.NotOwner.selector);
        entry.setFees(20 ether, 50 ether);
    }

    function test_RevertSetFeesBelowMinimum() public {
        vm.expectRevert(GameEntry.FeeBelowMinimum.selector);
        entry.setFees(5 ether, 25 ether);
    }

    function test_RevertSetFeesTripleBelowMinimum() public {
        vm.expectRevert(GameEntry.FeeBelowMinimum.selector);
        entry.setFees(10 ether, 5 ether);
    }

    function test_RevertSetFeesBothBelowMinimum() public {
        vm.expectRevert(GameEntry.FeeBelowMinimum.selector);
        entry.setFees(1 ether, 2 ether);
    }

    function test_SetFeesExactlyAtMinimum() public {
        entry.setFees(10 ether, 10 ether);
        assertEq(entry.singleFee(), 10 ether);
        assertEq(entry.tripleFee(), 10 ether);
    }

    function test_RevertSetFeesOneWeiBelow() public {
        vm.expectRevert(GameEntry.FeeBelowMinimum.selector);
        entry.setFees(10 ether - 1, 25 ether);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PER-GAME FEE OVERRIDES
    // ═══════════════════════════════════════════════════════════════════════

    function test_SetGameFees() public {
        entry.setGameFees(GAME_1, 100 ether, 250 ether);

        (uint256 single, uint256 triple) = entry.getGameFees(GAME_1);
        assertEq(single, 100 ether);
        assertEq(triple, 250 ether);
    }

    function test_GameFeeOverrideUsed() public {
        entry.setGameFees(GAME_1, 100 ether, 250 ether);

        vm.prank(player1);
        vm.expectRevert(GameEntry.InvalidFee.selector);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        vm.deal(player1, 1000 ether);
        vm.prank(player1);
        entry.enter{value: 100 ether}(GAME_1, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
    }

    function test_GameFeeOverrideTripleTier() public {
        entry.setGameFees(GAME_1, 100 ether, 250 ether);

        vm.deal(player1, 1000 ether);
        vm.prank(player1);
        entry.enter{value: 250 ether}(GAME_1, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 3);
    }

    function test_GlobalFeeStillWorksForOtherGames() public {
        entry.setGameFees(GAME_1, 100 ether, 250 ether);

        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_2, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_2, WEEK_1), 1);
    }

    function test_ClearGameFees() public {
        entry.setGameFees(GAME_1, 100 ether, 250 ether);
        entry.clearGameFees(GAME_1);

        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
    }

    function test_RevertSetGameFeesBelowMinimum() public {
        vm.expectRevert(GameEntry.FeeBelowMinimum.selector);
        entry.setGameFees(GAME_1, 5 ether, 250 ether);
    }

    function test_RevertSetGameFeesNotOwner() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.NotOwner.selector);
        entry.setGameFees(GAME_1, 100 ether, 250 ether);
    }

    function test_MultipleGamesMultipleFees() public {
        entry.setGameFees(GAME_1, 50 ether, 120 ether);
        entry.setGameFees(GAME_2, 200 ether, 500 ether);

        // Game 1 at 50
        vm.deal(player1, 10000 ether);
        vm.prank(player1);
        entry.enter{value: 50 ether}(GAME_1, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);

        // Game 2 at 500
        vm.prank(player1);
        entry.enter{value: 500 ether}(GAME_2, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_2, WEEK_1), 3);

        // Game 3 (no override) at global 10
        vm.prank(player1);
        entry.enter{value: 10 ether}(3, WEEK_1);
        assertEq(entry.getEntry(player1, 3, WEEK_1), 1);
    }

    function test_ClearGameFeesDoesNotAffectOtherGames() public {
        entry.setGameFees(GAME_1, 50 ether, 120 ether);
        entry.setGameFees(GAME_2, 200 ether, 500 ether);

        entry.clearGameFees(GAME_1);

        // Game 1 back to global
        (uint256 s1, uint256 t1) = entry.getGameFees(GAME_1);
        assertEq(s1, 10 ether);
        assertEq(t1, 25 ether);

        // Game 2 still custom
        (uint256 s2, uint256 t2) = entry.getGameFees(GAME_2);
        assertEq(s2, 200 ether);
        assertEq(t2, 500 ether);
    }

    function test_RevertClearGameFeesNotOwner() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.NotOwner.selector);
        entry.clearGameFees(GAME_1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAUSE
    // ═══════════════════════════════════════════════════════════════════════

    function test_PauseBlocksEntry() public {
        entry.setPaused(true);

        vm.prank(player1);
        vm.expectRevert(GameEntry.ContractPaused.selector);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
    }

    function test_UnpauseAllowsEntry() public {
        entry.setPaused(true);
        entry.setPaused(false);

        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
    }

    function test_RevertPauseNotOwner() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.NotOwner.selector);
        entry.setPaused(true);
    }

    function test_PauseDoesNotAffectAdmin() public {
        entry.setPaused(true);

        // Owner can still change fees while paused
        entry.setFees(20 ether, 50 ether);
        assertEq(entry.singleFee(), 20 ether);

        // Owner can still set game fees while paused
        entry.setGameFees(GAME_1, 100 ether, 250 ether);
        (uint256 s,) = entry.getGameFees(GAME_1);
        assertEq(s, 100 ether);

        // Owner can still change prize pot while paused
        entry.setPrizePot(address(0x9999));
        assertEq(entry.prizePot(), address(0x9999));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN — GENERAL
    // ═══════════════════════════════════════════════════════════════════════

    function test_SetPrizePot() public {
        address newPot = address(0x9999);
        entry.setPrizePot(newPot);
        assertEq(entry.prizePot(), newPot);
    }

    function test_RevertSetPrizePotNotOwner() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.NotOwner.selector);
        entry.setPrizePot(address(0x9999));
    }

    function test_TransferOwnership() public {
        entry.transferOwnership(player1);
        assertEq(entry.owner(), player1);

        // Old owner can no longer admin
        vm.expectRevert(GameEntry.NotOwner.selector);
        entry.setFees(20 ether, 50 ether);

        // New owner can
        vm.prank(player1);
        entry.setFees(20 ether, 50 ether);
        assertEq(entry.singleFee(), 20 ether);
    }

    function test_RevertTransferOwnershipNotOwner() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.NotOwner.selector);
        entry.transferOwnership(player1);
    }

    function test_RevertEntryWithPrizePotZero() public {
        GameEntry naked = new GameEntry(address(0));

        vm.deal(player1, 100 ether);
        vm.prank(player1);
        vm.expectRevert(GameEntry.PrizePotNotSet.selector);
        naked.enter{value: 10 ether}(GAME_1, WEEK_1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UNREASONABLE BUT WE TEST ANYWAY
    // ═══════════════════════════════════════════════════════════════════════

    // Spam 100 different players into the same game/week
    function test_100PlayersOneGame() public {
        for (uint256 i = 0; i < 100; i++) {
            address player = address(uint160(0xF000 + i));
            vm.deal(player, 10 ether);
            vm.prank(player);
            entry.enter{value: 10 ether}(GAME_1, WEEK_1);
        }

        // All recorded
        for (uint256 i = 0; i < 100; i++) {
            address player = address(uint160(0xF000 + i));
            assertEq(entry.getEntry(player, GAME_1, WEEK_1), 1);
        }

        // Pot has correct totals
        (uint256 potBal, uint256 treasBal, uint256 entryCount,) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(entryCount, 100);
        assertEq(potBal, 4.75 ether * 100);
        assertEq(treasBal, 4.75 ether * 100);
    }

    // One player enters 50 different games in the same week
    function test_OnePlayer50Games() public {
        vm.deal(player1, 500 ether);

        for (uint256 i = 1; i <= 50; i++) {
            vm.prank(player1);
            entry.enter{value: 10 ether}(i, WEEK_1);
        }

        for (uint256 i = 1; i <= 50; i++) {
            assertEq(entry.getEntry(player1, i, WEEK_1), 1);
        }
    }

    // One player across 52 weeks (full year)
    function test_OnePlayer52Weeks() public {
        vm.deal(player1, 520 ether);

        for (uint256 w = 1; w <= 52; w++) {
            vm.prank(player1);
            entry.enter{value: 10 ether}(GAME_1, w);
        }

        for (uint256 w = 1; w <= 52; w++) {
            assertEq(entry.getEntry(player1, GAME_1, w), 1);
        }
    }

    // Maximum gameId and weekId values (uint256 max)
    function test_MaxGameIdAndWeekId() public {
        uint256 maxId = type(uint256).max;

        vm.prank(player1);
        entry.enter{value: 10 ether}(maxId, maxId);
        assertEq(entry.getEntry(player1, maxId, maxId), 1);
    }

    // gameId = 0 and weekId = 0 should work (no special-casing)
    function test_ZeroGameIdZeroWeekId() public {
        vm.prank(player1);
        entry.enter{value: 10 ether}(0, 0);
        assertEq(entry.getEntry(player1, 0, 0), 1);
    }

    // Fee of exactly 1 wei above valid should fail
    function test_RevertOneWeiAboveSingleFee() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.InvalidFee.selector);
        entry.enter{value: 10 ether + 1}(GAME_1, WEEK_1);
    }

    // Fee of exactly 1 wei below valid should fail
    function test_RevertOneWeiBelowSingleFee() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.InvalidFee.selector);
        entry.enter{value: 10 ether - 1}(GAME_1, WEEK_1);
    }

    // Fee between single and triple should fail
    function test_RevertFeeBetweenTiers() public {
        vm.prank(player1);
        vm.expectRevert(GameEntry.InvalidFee.selector);
        entry.enter{value: 17.5 ether}(GAME_1, WEEK_1);
    }

    // Huge fee (way above triple) should fail
    function test_RevertMassiveOverpayment() public {
        vm.deal(player1, 10000 ether);
        vm.prank(player1);
        vm.expectRevert(GameEntry.InvalidFee.selector);
        entry.enter{value: 1000 ether}(GAME_1, WEEK_1);
    }

    // Set fees to enormous values and verify math still works
    function test_WhaleFeeMath() public {
        entry.setGameFees(GAME_1, 10000 ether, 25000 ether);

        vm.deal(player1, 30000 ether);
        uint256 deadBefore = address(0xdead).balance;
        uint256 potBefore = address(pot).balance;

        vm.prank(player1);
        entry.enter{value: 25000 ether}(GAME_1, WEEK_1);

        uint256 burned = address(0xdead).balance - deadBefore;
        uint256 potted = address(pot).balance - potBefore;

        // 5% of 25000 = 1250
        assertEq(burned, 1250 ether);
        // 95% of 25000 = 23750
        assertEq(potted, 23750 ether);
        assertEq(burned + potted, 25000 ether);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 3);
    }

    // Rapid fee changes mid-week — last change wins
    function test_RapidFeeChanges() public {
        entry.setFees(10 ether, 25 ether);
        entry.setFees(20 ether, 50 ether);
        entry.setFees(15 ether, 30 ether);

        assertEq(entry.singleFee(), 15 ether);
        assertEq(entry.tripleFee(), 30 ether);

        // Only latest fee works
        vm.prank(player1);
        vm.expectRevert(GameEntry.InvalidFee.selector);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        vm.prank(player1);
        entry.enter{value: 15 ether}(GAME_1, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
    }

    // Set single and triple to the same value — tier 1 wins (first match)
    function test_EqualSingleAndTripleFee() public {
        entry.setFees(10 ether, 10 ether);

        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        // Should be tier 1 (single matches first in the if-else)
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
    }

    // Verify getEntry returns 0 for non-existent entries
    function test_GetEntryReturnsZeroForNonExistent() public view {
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 0);
        assertEq(entry.getEntry(address(0), 0, 0), 0);
        assertEq(entry.getEntry(address(0xdead), type(uint256).max, type(uint256).max), 0);
    }

    // Ownership transfer to address(0) — effectively burns ownership
    function test_TransferOwnershipToZeroLocksOut() public {
        entry.transferOwnership(address(0));

        // Nobody can admin anymore
        vm.expectRevert(GameEntry.NotOwner.selector);
        entry.setFees(20 ether, 50 ether);

        // But entries still work
        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
    }
}
