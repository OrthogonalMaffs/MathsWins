// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./IQFSatellite.sol";
import "./QFGamesHub.sol";

/// @title QFSimpleSatellite — Base template for score-based game satellites
/// @notice Fork this for any game where:
///         - Score is a simple uint256 (higher = better)
///         - No funds held (pay-to-submit, not pay-to-play)
///         - Badge tiers based on leaderboard position
///
///         Override `_validateScore()` in child contracts for game-specific checks.

abstract contract QFSimpleSatellite is IQFSatellite {
    // ── Errors ──────────────────────────────────────────────────────────
    error NotOwner();
    error InsufficientFee();
    error ScoreTooLow();
    error TransferFailed();
    error InvalidScore();

    // ── Constants ───────────────────────────────────────────────────────
    uint256 public constant LEADERBOARD_SIZE = 10;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    uint256 public constant BURN_BPS = 2500; // 25%

    // ── Badge tier thresholds (leaderboard rank) ────────────────────────
    // #1         → Delta  (δ) — 25%
    // #2-3       → Lambda (λ) — 20%
    // #4-6       → Beta   (β) — 15%
    // #7-10      → Alpha  (α) — 10%
    uint256 public constant DELTA_THRESHOLD = 1;
    uint256 public constant GAMMA_THRESHOLD = 3;
    uint256 public constant BETA_THRESHOLD  = 6;

    // ── State ───────────────────────────────────────────────────────────
    struct Entry {
        address player;
        uint256 score;
        uint256 timestamp;
    }

    address public immutable owner;
    QFGamesHub public immutable gameHub;
    string public gameName;
    uint256 public submissionFee;
    uint256 public totalBurned;

    Entry[10] internal board;
    uint256 public entryCount;

    // ── Constructor ─────────────────────────────────────────────────────
    constructor(
        address _hub,
        string memory _gameName,
        uint256 _submissionFee
    ) {
        owner = msg.sender;
        gameHub = QFGamesHub(payable(_hub));
        gameName = _gameName;
        submissionFee = _submissionFee;
    }

    // ── Admin ───────────────────────────────────────────────────────────
    function setSubmissionFee(uint256 newFee) external {
        if (msg.sender != owner) revert NotOwner();
        submissionFee = newFee;
    }

    // ── Core ────────────────────────────────────────────────────────────
    function submitScore(uint256 score) external payable override {
        if (msg.value < submissionFee) revert InsufficientFee();

        // Game-specific validation (override in child)
        _validateScore(score);

        // Check if score qualifies
        uint256 count = entryCount;
        if (count == LEADERBOARD_SIZE && score <= board[count - 1].score) {
            revert ScoreTooLow();
        }

        // Refund excess
        uint256 excess = msg.value - submissionFee;
        if (excess > 0) {
            (bool refunded,) = msg.sender.call{value: excess}("");
            if (!refunded) revert TransferFailed();
        }

        // Burn 25% of fee
        uint256 burnAmount = (submissionFee * BURN_BPS) / 10000;
        (bool burned,) = BURN_ADDRESS.call{value: burnAmount}("");
        if (!burned) revert TransferFailed();
        totalBurned += burnAmount;

        // Forward 75% to Hub
        uint256 hubAmount = submissionFee - burnAmount;
        (bool sent,) = address(gameHub).call{value: hubAmount}("");
        if (!sent) revert TransferFailed();

        // Insert into sorted board
        uint256 insertAt = count < LEADERBOARD_SIZE ? count : count - 1;
        for (uint256 i = 0; i < count && i < LEADERBOARD_SIZE; i++) {
            if (score > board[i].score) {
                insertAt = i;
                break;
            }
        }

        uint256 end = count < LEADERBOARD_SIZE ? count : LEADERBOARD_SIZE - 1;
        for (uint256 i = end; i > insertAt; i--) {
            board[i] = board[i - 1];
        }

        board[insertAt] = Entry({
            player: msg.sender,
            score: score,
            timestamp: block.timestamp
        });

        if (count < LEADERBOARD_SIZE) {
            entryCount = count + 1;
        }

        uint256 rank = insertAt + 1;
        emit ScoreSubmitted(msg.sender, score, rank);

        // Award badge based on rank
        uint256 tier = _rankToTier(rank);
        gameHub.mintBadge(msg.sender, tier);
        emit BadgeAwarded(msg.sender, tier);
    }

    // ── Internal ────────────────────────────────────────────────────────

    /// @notice Override in child contracts for game-specific score validation.
    ///         Revert with InvalidScore() if the score is not plausible.
    function _validateScore(uint256 score) internal virtual {
        if (score == 0) revert InvalidScore();
    }

    function _rankToTier(uint256 rank) internal pure returns (uint256) {
        if (rank <= DELTA_THRESHOLD) return 3; // Delta
        if (rank <= GAMMA_THRESHOLD) return 2; // Lambda
        if (rank <= BETA_THRESHOLD)  return 1; // Beta
        return 0; // Alpha
    }

    // ── Views ───────────────────────────────────────────────────────────
    function getLeaderboard() external view override returns (
        address[] memory players,
        uint256[] memory scores,
        uint256[] memory timestamps
    ) {
        uint256 count = entryCount;
        players = new address[](count);
        scores = new uint256[](count);
        timestamps = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            players[i] = board[i].player;
            scores[i] = board[i].score;
            timestamps[i] = board[i].timestamp;
        }
    }

    function getMinScore() external view override returns (uint256) {
        if (entryCount < LEADERBOARD_SIZE) return 0;
        return board[LEADERBOARD_SIZE - 1].score;
    }

    function hub() external view override returns (address) {
        return address(gameHub);
    }
}
