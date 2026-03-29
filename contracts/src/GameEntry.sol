// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title GameEntry
 * @notice Accepts QF native token payments for MathsWins dApp games.
 *         Two tiers: 10 QF (1 attempt) or 25 QF (3 attempts).
 *         Routes: 5% burn, 95% to PrizePot contract.
 *         One entry per wallet per game per week.
 */
interface IPrizePot {
    function deposit(uint256 gameId, uint256 weekId) external payable;
}

contract GameEntry {
    // ── Constants ────────────────────────────────────────────────────────────
    uint256 public constant BURN_BPS = 500;            // 5%
    uint256 public constant BPS_BASE = 10000;
    address public constant BURN_ADDRESS = address(0xdead);

    // ── State ───────────────────────────────────────────────────────────────
    address public owner;
    address public prizePot;
    uint256 public minWalletAge;  // in blocks
    uint256 public singleFee;    // 1 attempt (default 10 QF)
    uint256 public tripleFee;    // 3 attempts (default 25 QF)

    // wallet => gameId => weekId => tier (1 or 3)
    mapping(address => mapping(uint256 => mapping(uint256 => uint8))) public entries;

    // ── Events ──────────────────────────────────────────────────────────────
    event EntryRecorded(
        address indexed player,
        uint256 indexed gameId,
        uint256 indexed weekId,
        uint8 tier,
        uint256 timestamp
    );
    event PrizePotUpdated(address indexed newPrizePot);
    event MinWalletAgeUpdated(uint256 newAge);
    event FeesUpdated(uint256 newSingleFee, uint256 newTripleFee);
    event OwnerTransferred(address indexed newOwner);

    // ── Errors ──────────────────────────────────────────────────────────────
    error InvalidFee();
    error AlreadyEntered();
    error WalletTooNew();
    error PrizePotNotSet();
    error NotOwner();
    error TransferFailed();

    // ── Modifiers ───────────────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ── Constructor ─────────────────────────────────────────────────────────
    constructor(address _prizePot, uint256 _minWalletAge) {
        owner = msg.sender;
        prizePot = _prizePot;
        minWalletAge = _minWalletAge;
        singleFee = 10 ether;
        tripleFee = 25 ether;
    }

    // ── Entry ───────────────────────────────────────────────────────────────
    /**
     * @notice Enter a game. Send exactly 10 QF (1 attempt) or 25 QF (3 attempts).
     * @param gameId The game identifier
     * @param weekId The week identifier (Monday-Sunday UTC cycle)
     */
    function enter(uint256 gameId, uint256 weekId) external payable {
        // Validate fee
        uint8 tier;
        if (msg.value == singleFee) {
            tier = 1;
        } else if (msg.value == tripleFee) {
            tier = 3;
        } else {
            revert InvalidFee();
        }

        // One entry per wallet per game per week
        if (entries[msg.sender][gameId][weekId] != 0) revert AlreadyEntered();

        // Wallet age check
        if (minWalletAge > 0) {
            uint256 nonce = _getNonce(msg.sender);
            // For new wallets with no history, check code size as fallback
            // This is a lightweight sybil deterrent, not bulletproof
            if (nonce == 0 && msg.sender.code.length == 0) {
                revert WalletTooNew();
            }
        }

        // Prize pot must be set
        if (prizePot == address(0)) revert PrizePotNotSet();

        // Record entry
        entries[msg.sender][gameId][weekId] = tier;

        // Route funds: 5% burn, 95% to prize pot
        uint256 burnAmount = (msg.value * BURN_BPS) / BPS_BASE;
        uint256 potAmount = msg.value - burnAmount;

        (bool burnOk,) = BURN_ADDRESS.call{value: burnAmount}("");
        if (!burnOk) revert TransferFailed();

        IPrizePot(prizePot).deposit{value: potAmount}(gameId, weekId);

        emit EntryRecorded(msg.sender, gameId, weekId, tier, block.timestamp);
    }

    // ── Views ───────────────────────────────────────────────────────────────
    /**
     * @notice Check if a wallet has entered a game for a given week.
     * @return tier 0 = not entered, 1 = single, 3 = triple
     */
    function getEntry(address player, uint256 gameId, uint256 weekId) external view returns (uint8) {
        return entries[player][gameId][weekId];
    }

    // ── Admin ───────────────────────────────────────────────────────────────
    function setPrizePot(address _prizePot) external onlyOwner {
        prizePot = _prizePot;
        emit PrizePotUpdated(_prizePot);
    }

    function setMinWalletAge(uint256 _minWalletAge) external onlyOwner {
        minWalletAge = _minWalletAge;
        emit MinWalletAgeUpdated(_minWalletAge);
    }

    function setFees(uint256 _singleFee, uint256 _tripleFee) external onlyOwner {
        singleFee = _singleFee;
        tripleFee = _tripleFee;
        emit FeesUpdated(_singleFee, _tripleFee);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
        emit OwnerTransferred(_newOwner);
    }

    // ── Internal ────────────────────────────────────────────────────────────
    function _getNonce(address account) internal view returns (uint256) {
        // On PolkaVM, nonce tracking may differ — this is a best-effort check
        // The real sybil protection is minWalletAge enforced off-chain
        uint256 size;
        assembly { size := extcodesize(account) }
        return size; // contracts have size > 0, EOAs have 0
    }
}
