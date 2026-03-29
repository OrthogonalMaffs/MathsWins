// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title PrizePot
 * @notice Holds prize pots for MathsWins dApp games.
 *         Receives 95% of entry fees from GameEntry.
 *         Splits internally: 50% pot (4.75 QF), 50% treasury (4.75 QF).
 *         batchSettle pays winners and treasury weekly.
 *         Under 10 entries: pot AND treasury roll to next week.
 */
contract PrizePot {
    // ── Constants ────────────────────────────────────────────────────────────
    uint256 public constant MIN_ENTRIES = 10;
    uint256 public constant POT_BPS = 5000;    // 50% of incoming (= 47.5% of total entry)
    uint256 public constant BPS_BASE = 10000;

    // ── Structs ─────────────────────────────────────────────────────────────
    struct WeekData {
        uint256 potBalance;
        uint256 treasuryBalance;
        uint256 entryCount;
        bool settled;
    }

    // ── State ───────────────────────────────────────────────────────────────
    address public owner;
    address public operator;          // hot wallet that calls batchSettle
    address public treasuryWallet;    // Ledger — receives treasury payouts
    address public gameEntry;         // only GameEntry can deposit

    // gameId => weekId => WeekData
    mapping(uint256 => mapping(uint256 => WeekData)) public weekData;

    // ── Events ──────────────────────────────────────────────────────────────
    event Deposited(uint256 indexed gameId, uint256 indexed weekId, uint256 amount);
    event PotPaid(uint256 indexed gameId, uint256 indexed weekId, address indexed winner, uint256 amount);
    event PotRolledOver(uint256 indexed gameId, uint256 fromWeekId, uint256 toWeekId, uint256 potAmount, uint256 treasuryAmount);
    event TreasuryPaid(uint256 indexed weekId, address indexed treasury, uint256 amount);
    event OperatorUpdated(address indexed newOperator);
    event TreasuryWalletUpdated(address indexed newTreasury);
    event GameEntryUpdated(address indexed newGameEntry);
    event OwnerTransferred(address indexed newOwner);

    // ── Errors ──────────────────────────────────────────────────────────────
    error NotOwner();
    error NotOperator();
    error NotGameEntry();
    error AlreadySettled();
    error ArrayLengthMismatch();
    error TransferFailed();
    error TreasuryNotSet();

    // ── Modifiers ───────────────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyOperator() {
        if (msg.sender != operator && msg.sender != owner) revert NotOperator();
        _;
    }

    modifier onlyGameEntry() {
        if (msg.sender != gameEntry) revert NotGameEntry();
        _;
    }

    // ── Constructor ─────────────────────────────────────────────────────────
    constructor(address _operator, address _treasuryWallet) {
        owner = msg.sender;
        operator = _operator;
        treasuryWallet = _treasuryWallet;
    }

    // ── Deposit (called by GameEntry) ───────────────────────────────────────
    /**
     * @notice Receive funds from GameEntry. Split 50/50 into pot and treasury.
     * @param gameId The game identifier
     * @param weekId The week identifier
     */
    function deposit(uint256 gameId, uint256 weekId) external payable onlyGameEntry {
        uint256 potShare = (msg.value * POT_BPS) / BPS_BASE;
        uint256 treasuryShare = msg.value - potShare;

        WeekData storage w = weekData[gameId][weekId];
        w.potBalance += potShare;
        w.treasuryBalance += treasuryShare;
        w.entryCount += 1;

        emit Deposited(gameId, weekId, msg.value);
    }

    // ── Settlement ──────────────────────────────────────────────────────────
    /**
     * @notice Settle multiple games for a week. Called by operator (cron).
     *         If >= MIN_ENTRIES: pay winner, accumulate treasury.
     *         If < MIN_ENTRIES: roll pot + treasury to next week.
     *         After all games: single treasury transfer.
     * @param gameIds Array of game IDs to settle
     * @param weekIds Array of week IDs (must match gameIds length)
     * @param winners Array of winner addresses (address(0) for rollover games)
     */
    function batchSettle(
        uint256[] calldata gameIds,
        uint256[] calldata weekIds,
        address[] calldata winners
    ) external onlyOperator {
        if (gameIds.length != weekIds.length || weekIds.length != winners.length)
            revert ArrayLengthMismatch();
        if (treasuryWallet == address(0)) revert TreasuryNotSet();

        uint256 totalTreasury = 0;

        for (uint256 i = 0; i < gameIds.length; i++) {
            WeekData storage w = weekData[gameIds[i]][weekIds[i]];
            if (w.settled) revert AlreadySettled();
            w.settled = true;

            if (w.entryCount >= MIN_ENTRIES && winners[i] != address(0)) {
                // Pay winner
                uint256 winnings = w.potBalance;
                w.potBalance = 0;
                totalTreasury += w.treasuryBalance;
                w.treasuryBalance = 0;

                if (winnings > 0) {
                    (bool ok,) = winners[i].call{value: winnings}("");
                    if (!ok) revert TransferFailed();
                }

                emit PotPaid(gameIds[i], weekIds[i], winners[i], winnings);
            } else {
                // Rollover: pot + treasury both move to next week
                uint256 nextWeek = weekIds[i] + 1;
                uint256 rollPot = w.potBalance;
                uint256 rollTreasury = w.treasuryBalance;
                w.potBalance = 0;
                w.treasuryBalance = 0;

                WeekData storage next = weekData[gameIds[i]][nextWeek];
                next.potBalance += rollPot;
                next.treasuryBalance += rollTreasury;

                emit PotRolledOver(gameIds[i], weekIds[i], nextWeek, rollPot, rollTreasury);
            }
        }

        // Single treasury transfer for all settled games
        if (totalTreasury > 0) {
            (bool ok,) = treasuryWallet.call{value: totalTreasury}("");
            if (!ok) revert TransferFailed();
            emit TreasuryPaid(weekIds[0], treasuryWallet, totalTreasury);
        }
    }

    // ── Views ───────────────────────────────────────────────────────────────
    function getWeekData(uint256 gameId, uint256 weekId)
        external view returns (uint256 potBalance, uint256 treasuryBalance, uint256 entryCount, bool settled)
    {
        WeekData storage w = weekData[gameId][weekId];
        return (w.potBalance, w.treasuryBalance, w.entryCount, w.settled);
    }

    // ── Admin ───────────────────────────────────────────────────────────────
    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
        emit OperatorUpdated(_operator);
    }

    function setTreasuryWallet(address _treasury) external onlyOwner {
        treasuryWallet = _treasury;
        emit TreasuryWalletUpdated(_treasury);
    }

    function setGameEntry(address _gameEntry) external onlyOwner {
        gameEntry = _gameEntry;
        emit GameEntryUpdated(_gameEntry);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
        emit OwnerTransferred(_newOwner);
    }

    // ── Receive ─────────────────────────────────────────────────────────────
    receive() external payable {
        // Accept plain QF transfers (from GameEntry)
    }
}
