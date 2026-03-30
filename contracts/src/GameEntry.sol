// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title GameEntry
 * @notice Accepts QF native token payments for MathsWins dApp games.
 *         Two tiers: single (1 attempt) or triple (3 attempts).
 *         Routes: 5% burn, 95% to PrizePot contract.
 *         One entry per wallet per game per week.
 *         Per-game fee overrides supported.
 */
interface IPrizePot {
    function deposit(uint256 gameId, uint256 weekId) external payable;
}

contract GameEntry {
    // ── Constants ────────────────────────────────────────────────────────────
    uint256 public constant BURN_BPS = 500;            // 5%
    uint256 public constant BPS_BASE = 10000;
    uint256 public constant MIN_FEE = 10 ether;        // 10 QF floor
    address public constant BURN_ADDRESS = address(0xdead);

    // ── State ───────────────────────────────────────────────────────────────
    address public owner;
    address public prizePot;
    bool public paused;
    uint256 public singleFee;    // default 1 attempt fee
    uint256 public tripleFee;    // default 3 attempt fee

    // Per-game fee overrides (0 = use global default)
    mapping(uint256 => uint256) public gameSingleFee;
    mapping(uint256 => uint256) public gameTripleFee;

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
    event FeesUpdated(uint256 newSingleFee, uint256 newTripleFee);
    event GameFeesUpdated(uint256 indexed gameId, uint256 singleFee, uint256 tripleFee);
    event OwnerTransferred(address indexed newOwner);
    event Paused(bool isPaused);

    // ── Errors ──────────────────────────────────────────────────────────────
    error InvalidFee();
    error AlreadyEntered();
    error PrizePotNotSet();
    error NotOwner();
    error TransferFailed();
    error ContractPaused();
    error FeeBelowMinimum();

    // ── Modifiers ───────────────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // ── Constructor ─────────────────────────────────────────────────────────
    constructor(address _prizePot) {
        owner = msg.sender;
        prizePot = _prizePot;
        singleFee = 10 ether;
        tripleFee = 25 ether;
    }

    // ── Entry ───────────────────────────────────────────────────────────────
    /**
     * @notice Enter a game. Send the exact single or triple fee.
     * @param gameId The game identifier
     * @param weekId The week identifier (Monday-Sunday UTC cycle)
     */
    function enter(uint256 gameId, uint256 weekId) external payable whenNotPaused {
        // Resolve fees: per-game override or global default
        uint256 single = gameSingleFee[gameId] > 0 ? gameSingleFee[gameId] : singleFee;
        uint256 triple = gameTripleFee[gameId] > 0 ? gameTripleFee[gameId] : tripleFee;

        // Validate fee
        uint8 tier;
        if (msg.value == single) {
            tier = 1;
        } else if (msg.value == triple) {
            tier = 3;
        } else {
            revert InvalidFee();
        }

        // One entry per wallet per game per week
        if (entries[msg.sender][gameId][weekId] != 0) revert AlreadyEntered();

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

    /**
     * @notice Get the effective fees for a game (per-game override or global).
     */
    function getGameFees(uint256 gameId) external view returns (uint256 single, uint256 triple) {
        single = gameSingleFee[gameId] > 0 ? gameSingleFee[gameId] : singleFee;
        triple = gameTripleFee[gameId] > 0 ? gameTripleFee[gameId] : tripleFee;
    }

    // ── Admin ───────────────────────────────────────────────────────────────
    function setPrizePot(address _prizePot) external onlyOwner {
        prizePot = _prizePot;
        emit PrizePotUpdated(_prizePot);
    }

    function setFees(uint256 _singleFee, uint256 _tripleFee) external onlyOwner {
        if (_singleFee < MIN_FEE || _tripleFee < MIN_FEE) revert FeeBelowMinimum();
        singleFee = _singleFee;
        tripleFee = _tripleFee;
        emit FeesUpdated(_singleFee, _tripleFee);
    }

    function setGameFees(uint256 gameId, uint256 _singleFee, uint256 _tripleFee) external onlyOwner {
        if (_singleFee < MIN_FEE || _tripleFee < MIN_FEE) revert FeeBelowMinimum();
        gameSingleFee[gameId] = _singleFee;
        gameTripleFee[gameId] = _tripleFee;
        emit GameFeesUpdated(gameId, _singleFee, _tripleFee);
    }

    function clearGameFees(uint256 gameId) external onlyOwner {
        gameSingleFee[gameId] = 0;
        gameTripleFee[gameId] = 0;
        emit GameFeesUpdated(gameId, 0, 0);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
        emit OwnerTransferred(_newOwner);
    }
}
