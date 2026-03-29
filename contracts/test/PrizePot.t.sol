// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/GameEntry.sol";
import "../src/PrizePot.sol";

contract PrizePotTest is Test {
    GameEntry public entry;
    PrizePot public pot;

    address owner = address(this);
    address operator = address(0xBEEF);
    address treasury = address(0xCAFE);
    address winner1 = address(0xA1A1);
    address winner2 = address(0xA2A2);

    uint256 constant GAME_1 = 1;
    uint256 constant GAME_2 = 2;
    uint256 constant WEEK_1 = 1;

    function setUp() public {
        pot = new PrizePot(operator, treasury);
        entry = new GameEntry(address(pot), 0);
        pot.setGameEntry(address(entry));
    }

    // ── Helper: fill a game with N entries ───────────────────────────────────
    function _fillEntries(uint256 gameId, uint256 weekId, uint256 count) internal {
        for (uint256 i = 0; i < count; i++) {
            address player = address(uint160(0xA000 + i));
            vm.deal(player, 10 ether);
            vm.prank(player);
            entry.enter{value: 10 ether}(gameId, weekId);
        }
    }

    // ── Deposit ─────────────────────────────────────────────────────────────

    function test_DepositSplits5050() public {
        _fillEntries(GAME_1, WEEK_1, 1);

        // 10 QF entry: 0.5 burn, 9.5 to pot contract
        // Pot splits 50/50: 4.75 each
        (uint256 potBal, uint256 treasuryBal, uint256 entryCount,) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(potBal, 4.75 ether);
        assertEq(treasuryBal, 4.75 ether);
        assertEq(entryCount, 1);
    }

    function test_DepositAccumulates() public {
        _fillEntries(GAME_1, WEEK_1, 5);

        (uint256 potBal, uint256 treasuryBal, uint256 entryCount,) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(potBal, 4.75 ether * 5);   // 23.75
        assertEq(treasuryBal, 4.75 ether * 5); // 23.75
        assertEq(entryCount, 5);
    }

    function test_RevertDepositNotGameEntry() public {
        vm.expectRevert(PrizePot.NotGameEntry.selector);
        pot.deposit{value: 9.5 ether}(GAME_1, WEEK_1);
    }

    // ── Settlement: payout ──────────────────────────────────────────────────

    function test_SettlePaysWinner() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        (uint256 potBal,,,) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(potBal, 47.5 ether); // 10 entries × 4.75

        uint256 winnerBefore = winner1.balance;
        uint256 treasuryBefore = treasury.balance;

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = winner1;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // Winner gets pot
        assertEq(winner1.balance - winnerBefore, 47.5 ether);
        // Treasury gets its share
        assertEq(treasury.balance - treasuryBefore, 47.5 ether);

        // Week is settled
        (uint256 potAfter, uint256 treasuryAfter,, bool settled) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(potAfter, 0);
        assertEq(treasuryAfter, 0);
        assertTrue(settled);
    }

    // ── Settlement: rollover ────────────────────────────────────────────────

    function test_RolloverUnder10Entries() public {
        _fillEntries(GAME_1, WEEK_1, 5);

        (uint256 potBal, uint256 treasBal,,) = pot.getWeekData(GAME_1, WEEK_1);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = address(0); // no winner

        uint256 treasuryBefore = treasury.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // Week 1 is empty and settled
        (uint256 w1Pot, uint256 w1Treas,, bool settled) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(w1Pot, 0);
        assertEq(w1Treas, 0);
        assertTrue(settled);

        // Week 2 has the rolled-over funds
        (uint256 w2Pot, uint256 w2Treas, uint256 w2Entries,) = pot.getWeekData(GAME_1, WEEK_1 + 1);
        assertEq(w2Pot, potBal);
        assertEq(w2Treas, treasBal);
        assertEq(w2Entries, 0); // entries don't roll over

        // Treasury received nothing
        assertEq(treasury.balance, treasuryBefore);
    }

    // ── Settlement: multi-game batch ────────────────────────────────────────

    function test_BatchSettleMultipleGames() public {
        _fillEntries(GAME_1, WEEK_1, 10);
        _fillEntries(GAME_2, WEEK_1, 3); // under threshold

        uint256[] memory gameIds = new uint256[](2);
        uint256[] memory weekIds = new uint256[](2);
        address[] memory winners = new address[](2);
        gameIds[0] = GAME_1;
        gameIds[1] = GAME_2;
        weekIds[0] = WEEK_1;
        weekIds[1] = WEEK_1;
        winners[0] = winner1;
        winners[1] = address(0);

        uint256 winnerBefore = winner1.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // Game 1: paid out
        assertEq(winner1.balance - winnerBefore, 47.5 ether);

        // Game 2: rolled over to week 2
        (uint256 w2Pot, uint256 w2Treas,,) = pot.getWeekData(GAME_2, WEEK_1 + 1);
        assertGt(w2Pot, 0);
        assertGt(w2Treas, 0);
    }

    // ── Settlement: can't settle twice ──────────────────────────────────────

    function test_RevertDoubleSettle() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = winner1;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        vm.prank(operator);
        vm.expectRevert(PrizePot.AlreadySettled.selector);
        pot.batchSettle(gameIds, weekIds, winners);
    }

    // ── Settlement: only operator ───────────────────────────────────────────

    function test_RevertSettleNotOperator() public {
        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);

        vm.prank(address(0x9999));
        vm.expectRevert(PrizePot.NotOperator.selector);
        pot.batchSettle(gameIds, weekIds, winners);
    }

    // ── Settlement: owner can also settle ───────────────────────────────────

    function test_OwnerCanSettle() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = winner1;

        // Owner (this contract) settles — no revert
        pot.batchSettle(gameIds, weekIds, winners);

        (,,, bool settled) = pot.getWeekData(GAME_1, WEEK_1);
        assertTrue(settled);
    }

    // ── Rollover accumulates across weeks ───────────────────────────────────

    function test_RolloverAccumulates() public {
        // Week 1: 3 entries, rolls over
        _fillEntries(GAME_1, WEEK_1, 3);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = address(0);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // Week 2: 5 more entries + rollover from week 1
        _fillEntries(GAME_1, 2, 5);

        (uint256 w2Pot,,,) = pot.getWeekData(GAME_1, 2);
        // 3 entries rolled + 5 new = 8 entries worth of pot
        assertEq(w2Pot, 4.75 ether * 8);
    }

    // ── Admin ───────────────────────────────────────────────────────────────

    function test_SetOperator() public {
        pot.setOperator(address(0x1234));
        assertEq(pot.operator(), address(0x1234));
    }

    function test_RevertSetOperatorNotOwner() public {
        vm.prank(player1());
        vm.expectRevert(PrizePot.NotOwner.selector);
        pot.setOperator(address(0x1234));
    }

    function player1() internal pure returns (address) {
        return address(0x1111);
    }
}
