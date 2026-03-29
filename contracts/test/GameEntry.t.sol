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
    uint256 constant WEEK_1 = 1;

    function setUp() public {
        pot = new PrizePot(operator, treasury);
        entry = new GameEntry(address(pot), 0); // no wallet age check for tests
        pot.setGameEntry(address(entry));

        // Fund players
        vm.deal(player1, 100 ether);
        vm.deal(player2, 100 ether);
    }

    // ── Fee validation ──────────────────────────────────────────────────────

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

    // ── One entry per wallet per game per week ──────────────────────────────

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
        entry.enter{value: 25 ether}(2, WEEK_1);

        assertEq(entry.getEntry(player1, GAME_1, WEEK_1), 1);
        assertEq(entry.getEntry(player1, 2, WEEK_1), 3);
    }

    // ── Fund routing ────────────────────────────────────────────────────────

    function test_BurnRouting_Single() public {
        uint256 deadBefore = address(0xdead).balance;

        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        // 5% of 10 = 0.5 QF burned
        assertEq(address(0xdead).balance - deadBefore, 0.5 ether);
    }

    function test_BurnRouting_Triple() public {
        uint256 deadBefore = address(0xdead).balance;

        vm.prank(player1);
        entry.enter{value: 25 ether}(GAME_1, WEEK_1);

        // 5% of 25 = 1.25 QF burned
        assertEq(address(0xdead).balance - deadBefore, 1.25 ether);
    }

    function test_PotReceives95Percent() public {
        vm.prank(player1);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);

        // 95% of 10 = 9.5 QF to pot contract
        // Split 50/50 inside pot: 4.75 pot, 4.75 treasury
        (uint256 potBal, uint256 treasuryBal, uint256 entryCount,) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(potBal, 4.75 ether);
        assertEq(treasuryBal, 4.75 ether);
        assertEq(entryCount, 1);
    }

    // ── Events ──────────────────────────────────────────────────────────────

    function test_EmitsEntryRecorded() public {
        vm.prank(player1);
        vm.expectEmit(true, true, true, true);
        emit GameEntry.EntryRecorded(player1, GAME_1, WEEK_1, 1, block.timestamp);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
    }

    // ── Admin ───────────────────────────────────────────────────────────────

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

    // ── Fee changes ─────────────────────────────────────────────────────────

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
}
