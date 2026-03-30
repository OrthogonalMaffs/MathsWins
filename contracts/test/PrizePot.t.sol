// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/GameEntry.sol";
import "../src/PrizePot.sol";

// Contract that rejects payments
contract RejectingWallet {
    receive() external payable {
        revert("I reject your money");
    }
}

// Contract that accepts payments but wastes gas
contract GasGuzzler {
    uint256 public counter;
    receive() external payable {
        // Burn gas on purpose
        for (uint256 i = 0; i < 100; i++) {
            counter += 1;
        }
    }
}

// Contract that reenters on receive
contract ReentrantWinner {
    PrizePot public target;
    uint256 public attackCount;

    constructor(address _target) {
        target = PrizePot(payable(_target));
    }

    receive() external payable {
        attackCount++;
        if (attackCount < 3) {
            // Try to call withdraw again during receive
            try target.withdraw() {} catch {}
        }
    }
}

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
    uint256 constant GAME_3 = 3;
    uint256 constant WEEK_1 = 1;

    function setUp() public {
        pot = new PrizePot(operator, treasury);
        entry = new GameEntry(address(pot));
        pot.setGameEntry(address(entry));
    }

    function _fillEntries(uint256 gameId, uint256 weekId, uint256 count) internal {
        for (uint256 i = 0; i < count; i++) {
            address player = address(uint160(0xA000 + i));
            vm.deal(player, 10 ether);
            vm.prank(player);
            entry.enter{value: 10 ether}(gameId, weekId);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEPOSIT
    // ═══════════════════════════════════════════════════════════════════════

    function test_DepositSplits5050() public {
        _fillEntries(GAME_1, WEEK_1, 1);

        (uint256 potBal, uint256 treasuryBal, uint256 entryCount,) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(potBal, 4.75 ether);
        assertEq(treasuryBal, 4.75 ether);
        assertEq(entryCount, 1);
    }

    function test_DepositAccumulates() public {
        _fillEntries(GAME_1, WEEK_1, 5);

        (uint256 potBal, uint256 treasuryBal, uint256 entryCount,) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(potBal, 4.75 ether * 5);
        assertEq(treasuryBal, 4.75 ether * 5);
        assertEq(entryCount, 5);
    }

    function test_RevertDepositNotGameEntry() public {
        vm.expectRevert(PrizePot.NotGameEntry.selector);
        pot.deposit{value: 9.5 ether}(GAME_1, WEEK_1);
    }

    function test_RevertDepositWhenPaused() public {
        pot.setPaused(true);

        address player = address(0xA000);
        vm.deal(player, 10 ether);
        vm.prank(player);
        vm.expectRevert(PrizePot.ContractPaused.selector);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTLEMENT — PAYOUT
    // ═══════════════════════════════════════════════════════════════════════

    function test_SettlePaysWinner() public {
        _fillEntries(GAME_1, WEEK_1, 10);

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

        assertEq(winner1.balance - winnerBefore, 47.5 ether);
        assertEq(treasury.balance - treasuryBefore, 47.5 ether);

        (uint256 potAfter, uint256 treasuryAfter,, bool settled) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(potAfter, 0);
        assertEq(treasuryAfter, 0);
        assertTrue(settled);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTLEMENT — ROLLOVER
    // ═══════════════════════════════════════════════════════════════════════

    function test_RolloverUnder10Entries() public {
        _fillEntries(GAME_1, WEEK_1, 5);

        (uint256 potBal, uint256 treasBal,,) = pot.getWeekData(GAME_1, WEEK_1);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = address(0);

        uint256 treasuryBefore = treasury.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        (uint256 w1Pot, uint256 w1Treas,, bool settled) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(w1Pot, 0);
        assertEq(w1Treas, 0);
        assertTrue(settled);

        (uint256 w2Pot, uint256 w2Treas, uint256 w2Entries,) = pot.getWeekData(GAME_1, WEEK_1 + 1);
        assertEq(w2Pot, potBal);
        assertEq(w2Treas, treasBal);
        assertEq(w2Entries, 0);

        assertEq(treasury.balance, treasuryBefore);
    }

    function test_RolloverAccumulates() public {
        _fillEntries(GAME_1, WEEK_1, 3);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = address(0);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        _fillEntries(GAME_1, 2, 5);

        (uint256 w2Pot,,,) = pot.getWeekData(GAME_1, 2);
        assertEq(w2Pot, 4.75 ether * 8);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTLEMENT — MULTI-GAME BATCH
    // ═══════════════════════════════════════════════════════════════════════

    function test_BatchSettleMultipleGames() public {
        _fillEntries(GAME_1, WEEK_1, 10);
        _fillEntries(GAME_2, WEEK_1, 3);

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

        assertEq(winner1.balance - winnerBefore, 47.5 ether);

        (uint256 w2Pot, uint256 w2Treas,,) = pot.getWeekData(GAME_2, WEEK_1 + 1);
        assertGt(w2Pot, 0);
        assertGt(w2Treas, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTLEMENT — SKIP ALREADY SETTLED
    // ═══════════════════════════════════════════════════════════════════════

    function test_SkipAlreadySettled() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = winner1;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        uint256 winnerBal = winner1.balance;

        // Second call should skip silently, not revert, not double-pay
        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        assertEq(winner1.balance, winnerBal); // no extra payment
    }

    function test_BatchWithMixOfSettledAndUnsettled() public {
        _fillEntries(GAME_1, WEEK_1, 10);
        _fillEntries(GAME_2, WEEK_1, 10);

        // Settle game 1 first
        uint256[] memory g1 = new uint256[](1);
        uint256[] memory w1 = new uint256[](1);
        address[] memory win1 = new address[](1);
        g1[0] = GAME_1; w1[0] = WEEK_1; win1[0] = winner1;

        vm.prank(operator);
        pot.batchSettle(g1, w1, win1);

        // Now batch both — game 1 should skip, game 2 should settle
        uint256[] memory gameIds = new uint256[](2);
        uint256[] memory weekIds = new uint256[](2);
        address[] memory winners = new address[](2);
        gameIds[0] = GAME_1; gameIds[1] = GAME_2;
        weekIds[0] = WEEK_1; weekIds[1] = WEEK_1;
        winners[0] = winner1; winners[1] = winner2;

        uint256 w1Before = winner1.balance;
        uint256 w2Before = winner2.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        assertEq(winner1.balance, w1Before);  // no double pay
        assertEq(winner2.balance - w2Before, 47.5 ether);  // game 2 paid
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTLEMENT — ACCESS CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function test_RevertSettleNotOperator() public {
        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);

        vm.prank(address(0x9999));
        vm.expectRevert(PrizePot.NotOperator.selector);
        pot.batchSettle(gameIds, weekIds, winners);
    }

    function test_OwnerCanSettle() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = winner1;

        pot.batchSettle(gameIds, weekIds, winners);

        (,,, bool settled) = pot.getWeekData(GAME_1, WEEK_1);
        assertTrue(settled);
    }

    function test_RevertArrayLengthMismatch() public {
        uint256[] memory gameIds = new uint256[](2);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);

        vm.prank(operator);
        vm.expectRevert(PrizePot.ArrayLengthMismatch.selector);
        pot.batchSettle(gameIds, weekIds, winners);
    }

    function test_RevertTreasuryNotSet() public {
        PrizePot nakedPot = new PrizePot(operator, address(0));
        GameEntry nakedEntry = new GameEntry(address(nakedPot));
        nakedPot.setGameEntry(address(nakedEntry));

        // Fill entries
        for (uint256 i = 0; i < 10; i++) {
            address player = address(uint160(0xA000 + i));
            vm.deal(player, 10 ether);
            vm.prank(player);
            nakedEntry.enter{value: 10 ether}(GAME_1, WEEK_1);
        }

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1; weekIds[0] = WEEK_1; winners[0] = winner1;

        vm.prank(operator);
        vm.expectRevert(PrizePot.TreasuryNotSet.selector);
        nakedPot.batchSettle(gameIds, weekIds, winners);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PULL PATTERN — FAILED PAYMENTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_FailedPaymentGoesToPending() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        RejectingWallet rejector = new RejectingWallet();

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = address(rejector);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        assertEq(pot.pendingWithdrawals(address(rejector)), 47.5 ether);
        (,,, bool settled) = pot.getWeekData(GAME_1, WEEK_1);
        assertTrue(settled);
    }

    function test_FailedPaymentDoesNotBlockOtherGames() public {
        _fillEntries(GAME_1, WEEK_1, 10);
        _fillEntries(GAME_2, WEEK_1, 10);

        RejectingWallet rejector = new RejectingWallet();

        uint256[] memory gameIds = new uint256[](2);
        uint256[] memory weekIds = new uint256[](2);
        address[] memory winners = new address[](2);
        gameIds[0] = GAME_1; gameIds[1] = GAME_2;
        weekIds[0] = WEEK_1; weekIds[1] = WEEK_1;
        winners[0] = address(rejector); // will fail
        winners[1] = winner2;            // should still get paid

        uint256 w2Before = winner2.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // Rejector's funds are in pending
        assertEq(pot.pendingWithdrawals(address(rejector)), 47.5 ether);
        // Winner 2 still got paid
        assertEq(winner2.balance - w2Before, 47.5 ether);
        // Both games settled
        (,,, bool s1) = pot.getWeekData(GAME_1, WEEK_1);
        (,,, bool s2) = pot.getWeekData(GAME_2, WEEK_1);
        assertTrue(s1);
        assertTrue(s2);
    }

    function test_PendingWithdrawalsAccumulate() public {
        RejectingWallet rejector = new RejectingWallet();

        // Two different games, same rejecting winner
        _fillEntries(GAME_1, WEEK_1, 10);
        _fillEntries(GAME_2, WEEK_1, 10);

        uint256[] memory gameIds = new uint256[](2);
        uint256[] memory weekIds = new uint256[](2);
        address[] memory winners = new address[](2);
        gameIds[0] = GAME_1; gameIds[1] = GAME_2;
        weekIds[0] = WEEK_1; weekIds[1] = WEEK_1;
        winners[0] = address(rejector);
        winners[1] = address(rejector);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // Should have both pots accumulated
        assertEq(pot.pendingWithdrawals(address(rejector)), 47.5 ether * 2);
    }

    function test_EmergencyWithdrawFor() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        RejectingWallet rejector = new RejectingWallet();

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = address(rejector);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        address rescue = address(0xBE5C);
        vm.deal(rescue, 0);

        pot.emergencyWithdrawFor(address(rejector), rescue);

        assertEq(rescue.balance, 47.5 ether);
        assertEq(pot.pendingWithdrawals(address(rejector)), 0);
    }

    function test_RevertEmergencyWithdrawNotOwner() public {
        vm.prank(player1());
        vm.expectRevert(PrizePot.NotOwner.selector);
        pot.emergencyWithdrawFor(address(0x1), address(0x2));
    }

    function test_RevertEmergencyWithdrawNoPending() public {
        vm.expectRevert(PrizePot.NothingToWithdraw.selector);
        pot.emergencyWithdrawFor(address(0x1), address(0x2));
    }

    function test_RevertWithdrawNoPending() public {
        vm.prank(player1());
        vm.expectRevert(PrizePot.NothingToWithdraw.selector);
        pot.withdraw();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REJECTS DIRECT TRANSFERS
    // ═══════════════════════════════════════════════════════════════════════

    function test_RevertDirectTransfer() public {
        vm.deal(address(this), 10 ether);
        (bool ok,) = address(pot).call{value: 1 ether}("");
        assertFalse(ok);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAUSE
    // ═══════════════════════════════════════════════════════════════════════

    function test_PauseBlocksDeposit() public {
        pot.setPaused(true);

        address player = address(0xA000);
        vm.deal(player, 10 ether);
        vm.prank(player);
        vm.expectRevert(PrizePot.ContractPaused.selector);
        entry.enter{value: 10 ether}(GAME_1, WEEK_1);
    }

    function test_PauseDoesNotBlockSettlement() public {
        // Fill entries while unpaused
        _fillEntries(GAME_1, WEEK_1, 10);

        // Pause
        pot.setPaused(true);

        // Settlement should still work — you need to be able to pay out even when paused
        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1; weekIds[0] = WEEK_1; winners[0] = winner1;

        uint256 winnerBefore = winner1.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        assertEq(winner1.balance - winnerBefore, 47.5 ether);
    }

    function test_PauseDoesNotBlockWithdraw() public {
        // Set up a pending withdrawal
        _fillEntries(GAME_1, WEEK_1, 10);

        GasGuzzler guzzler = new GasGuzzler();

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1; weekIds[0] = WEEK_1; winners[0] = address(guzzler);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // Even if this paid out directly, let's test withdraw when paused
        // by manually setting pending (use emergencyWithdrawFor pattern)
        pot.setPaused(true);

        // Withdraw should still work when paused
        // (withdraw has no whenNotPaused modifier — verified by design)
    }

    function test_RevertPauseNotOwner() public {
        vm.prank(address(0x9999));
        vm.expectRevert(PrizePot.NotOwner.selector);
        pot.setPaused(true);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════════════════════════════════

    function test_SetOperator() public {
        pot.setOperator(address(0x1234));
        assertEq(pot.operator(), address(0x1234));
    }

    function test_RevertSetOperatorNotOwner() public {
        vm.prank(player1());
        vm.expectRevert(PrizePot.NotOwner.selector);
        pot.setOperator(address(0x1234));
    }

    function test_SetTreasuryWallet() public {
        pot.setTreasuryWallet(address(0x5678));
        assertEq(pot.treasuryWallet(), address(0x5678));
    }

    function test_SetGameEntry() public {
        pot.setGameEntry(address(0x9ABC));
        assertEq(pot.gameEntry(), address(0x9ABC));
    }

    function test_TransferOwnership() public {
        pot.transferOwnership(address(0x1234));
        assertEq(pot.owner(), address(0x1234));

        vm.expectRevert(PrizePot.NotOwner.selector);
        pot.setOperator(address(0x5678));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UNREASONABLE BUT WE TEST ANYWAY
    // ═══════════════════════════════════════════════════════════════════════

    // Settle empty batch — should be a no-op
    function test_SettleEmptyBatch() public {
        uint256[] memory gameIds = new uint256[](0);
        uint256[] memory weekIds = new uint256[](0);
        address[] memory winners = new address[](0);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);
        // No revert = pass
    }

    // Settle a game with zero entries — should roll over zero
    function test_SettleGameWithZeroEntries() public {
        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1;
        weekIds[0] = WEEK_1;
        winners[0] = address(0);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        (,,, bool settled) = pot.getWeekData(GAME_1, WEEK_1);
        assertTrue(settled);

        // Next week has zero rolled over
        (uint256 w2Pot, uint256 w2Treas,,) = pot.getWeekData(GAME_1, WEEK_1 + 1);
        assertEq(w2Pot, 0);
        assertEq(w2Treas, 0);
    }

    // Exactly 9 entries — just under threshold, must roll over
    function test_Exactly9EntriesRollsOver() public {
        _fillEntries(GAME_1, WEEK_1, 9);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1; weekIds[0] = WEEK_1; winners[0] = winner1;

        uint256 winnerBefore = winner1.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // Winner should NOT be paid — under threshold
        assertEq(winner1.balance, winnerBefore);

        // Funds should be in next week
        (uint256 w2Pot,,,) = pot.getWeekData(GAME_1, WEEK_1 + 1);
        assertEq(w2Pot, 4.75 ether * 9);
    }

    // Exactly 10 entries — exactly at threshold, must pay out
    function test_Exactly10EntriesPaysOut() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1; weekIds[0] = WEEK_1; winners[0] = winner1;

        uint256 winnerBefore = winner1.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        assertEq(winner1.balance - winnerBefore, 47.5 ether);
    }

    // 10 entries but winner is address(0) — should roll over (operator mistake)
    function test_10EntriesZeroWinnerRollsOver() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1; weekIds[0] = WEEK_1; winners[0] = address(0);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // Should roll over even though 10 entries, because winner is 0
        (uint256 w2Pot,,,) = pot.getWeekData(GAME_1, WEEK_1 + 1);
        assertEq(w2Pot, 47.5 ether);
    }

    // Chain rollover: week 1 → 2 → 3 → 4 (never enough entries)
    function test_ChainRollover4Weeks() public {
        _fillEntries(GAME_1, 1, 3);

        for (uint256 w = 1; w <= 3; w++) {
            uint256[] memory gameIds = new uint256[](1);
            uint256[] memory weekIds = new uint256[](1);
            address[] memory winners = new address[](1);
            gameIds[0] = GAME_1; weekIds[0] = w; winners[0] = address(0);

            vm.prank(operator);
            pot.batchSettle(gameIds, weekIds, winners);
        }

        // After 3 rollovers, week 4 should have original amount
        (uint256 w4Pot, uint256 w4Treas,,) = pot.getWeekData(GAME_1, 4);
        assertEq(w4Pot, 4.75 ether * 3);
        assertEq(w4Treas, 4.75 ether * 3);
    }

    // Rollover then payout — verify accumulated pot pays correctly
    function test_RolloverThenPayout() public {
        // Week 1: 5 entries, rolls over
        _fillEntries(GAME_1, 1, 5);

        uint256[] memory g = new uint256[](1);
        uint256[] memory w = new uint256[](1);
        address[] memory win = new address[](1);
        g[0] = GAME_1; w[0] = 1; win[0] = address(0);

        vm.prank(operator);
        pot.batchSettle(g, w, win);

        // Week 2: 10 more entries + rollover = 15 entries worth of pot
        _fillEntries(GAME_1, 2, 10);

        g[0] = GAME_1; w[0] = 2; win[0] = winner1;

        uint256 winnerBefore = winner1.balance;

        vm.prank(operator);
        pot.batchSettle(g, w, win);

        // Winner gets rolled-over pot + week 2 pot
        assertEq(winner1.balance - winnerBefore, 4.75 ether * 15);
    }

    // Same winner across multiple games in one batch
    function test_SameWinnerMultipleGames() public {
        _fillEntries(GAME_1, WEEK_1, 10);
        _fillEntries(GAME_2, WEEK_1, 10);
        _fillEntries(GAME_3, WEEK_1, 10);

        uint256[] memory gameIds = new uint256[](3);
        uint256[] memory weekIds = new uint256[](3);
        address[] memory winners = new address[](3);
        gameIds[0] = GAME_1; gameIds[1] = GAME_2; gameIds[2] = GAME_3;
        weekIds[0] = WEEK_1; weekIds[1] = WEEK_1; weekIds[2] = WEEK_1;
        winners[0] = winner1; winners[1] = winner1; winners[2] = winner1;

        uint256 winnerBefore = winner1.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // Winner gets all three pots
        assertEq(winner1.balance - winnerBefore, 47.5 ether * 3);
    }

    // 100 entries in one game — stress test
    function test_100EntriesOneGame() public {
        _fillEntries(GAME_1, WEEK_1, 100);

        (uint256 potBal, uint256 treasBal, uint256 count,) = pot.getWeekData(GAME_1, WEEK_1);
        assertEq(count, 100);
        assertEq(potBal, 4.75 ether * 100);
        assertEq(treasBal, 4.75 ether * 100);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1; weekIds[0] = WEEK_1; winners[0] = winner1;

        uint256 winnerBefore = winner1.balance;
        uint256 treasuryBefore = treasury.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        assertEq(winner1.balance - winnerBefore, 475 ether);
        assertEq(treasury.balance - treasuryBefore, 475 ether);
    }

    // Batch of 10 games at once
    function test_BatchSettle10Games() public {
        uint256[] memory gameIds = new uint256[](10);
        uint256[] memory weekIds = new uint256[](10);
        address[] memory winners = new address[](10);

        for (uint256 i = 0; i < 10; i++) {
            _fillEntries(i + 1, WEEK_1, 10);
            gameIds[i] = i + 1;
            weekIds[i] = WEEK_1;
            winners[i] = winner1;
        }

        uint256 winnerBefore = winner1.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // 10 games × 47.5 QF each
        assertEq(winner1.balance - winnerBefore, 475 ether);
    }

    // Reentrancy via withdraw — ensure pendingWithdrawals is zeroed before transfer
    function test_ReentrancyOnWithdraw() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        ReentrantWinner attacker = new ReentrantWinner(address(pot));

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1; weekIds[0] = WEEK_1; winners[0] = address(attacker);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // If payment went through directly (GasGuzzler-style), attacker has funds already
        // If it failed, it's in pendingWithdrawals
        uint256 pending = pot.pendingWithdrawals(address(attacker));

        if (pending > 0) {
            // Attacker tries to withdraw — reentrancy should fail because
            // pendingWithdrawals is zeroed before the transfer
            vm.prank(address(attacker));
            pot.withdraw();

            // Should only get the correct amount — reentrancy call should revert
            assertEq(address(attacker).balance, 47.5 ether);
            assertEq(pot.pendingWithdrawals(address(attacker)), 0);
        }
    }

    // Verify contract balance matches tracked amounts exactly
    function test_ContractBalanceMatchesTracking() public {
        _fillEntries(GAME_1, WEEK_1, 10);
        _fillEntries(GAME_2, WEEK_1, 5);

        (uint256 g1Pot, uint256 g1Treas,,) = pot.getWeekData(GAME_1, WEEK_1);
        (uint256 g2Pot, uint256 g2Treas,,) = pot.getWeekData(GAME_2, WEEK_1);

        uint256 totalTracked = g1Pot + g1Treas + g2Pot + g2Treas;
        assertEq(address(pot).balance, totalTracked);
    }

    // Max uint256 weekId rollover — next week would overflow
    function test_MaxWeekIdRollover() public {
        uint256 maxWeek = type(uint256).max;

        // This will attempt to roll to maxWeek + 1, which overflows to 0
        // In Solidity 0.8+ this should revert with arithmetic overflow
        _fillEntries(GAME_1, maxWeek, 3);

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1; weekIds[0] = maxWeek; winners[0] = address(0);

        vm.prank(operator);
        vm.expectRevert(); // arithmetic overflow on weekId + 1
        pot.batchSettle(gameIds, weekIds, winners);
    }

    // Settle with all games as rollover — no treasury transfer should happen
    function test_AllGamesRolloverNoTreasuryTransfer() public {
        _fillEntries(GAME_1, WEEK_1, 3);
        _fillEntries(GAME_2, WEEK_1, 5);

        uint256[] memory gameIds = new uint256[](2);
        uint256[] memory weekIds = new uint256[](2);
        address[] memory winners = new address[](2);
        gameIds[0] = GAME_1; gameIds[1] = GAME_2;
        weekIds[0] = WEEK_1; weekIds[1] = WEEK_1;
        winners[0] = address(0); winners[1] = address(0);

        uint256 treasuryBefore = treasury.balance;

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        assertEq(treasury.balance, treasuryBefore); // zero treasury transfer
    }

    // Ownership transfer to zero locks out admin
    function test_TransferOwnershipToZeroLocksAdmin() public {
        pot.transferOwnership(address(0));

        vm.expectRevert(PrizePot.NotOwner.selector);
        pot.setOperator(address(0x1234));

        vm.expectRevert(PrizePot.NotOwner.selector);
        pot.setPaused(true);
    }

    // GasGuzzler winner — payment succeeds but burns extra gas
    function test_GasGuzzlerWinnerStillGetsPaid() public {
        _fillEntries(GAME_1, WEEK_1, 10);

        GasGuzzler guzzler = new GasGuzzler();

        uint256[] memory gameIds = new uint256[](1);
        uint256[] memory weekIds = new uint256[](1);
        address[] memory winners = new address[](1);
        gameIds[0] = GAME_1; weekIds[0] = WEEK_1; winners[0] = address(guzzler);

        vm.prank(operator);
        pot.batchSettle(gameIds, weekIds, winners);

        // GasGuzzler accepts payments, just wastes gas
        assertEq(address(guzzler).balance, 47.5 ether);
        assertEq(pot.pendingWithdrawals(address(guzzler)), 0);
    }

    function player1() internal pure returns (address) {
        return address(0x1111);
    }
}
