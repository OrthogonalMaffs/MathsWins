// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IQFSatellite — Standard interface for QF Games satellite contracts
/// @notice Every game satellite must implement this interface.
///         The Hub doesn't call satellites — satellites call the Hub.
///         This interface exists so frontends and tooling have a
///         consistent ABI across all games.

interface IQFSatellite {
    /// @notice Submit a score for the calling player. Payable (submission fee).
    /// @param score The player's score (meaning is game-specific: points, streak, moves, etc.)
    function submitScore(uint256 score) external payable;

    /// @notice Current submission fee in native QF (wei)
    function submissionFee() external view returns (uint256);

    /// @notice Address of the QFGamesHub this satellite reports to
    function hub() external view returns (address);

    /// @notice Game identifier string
    function gameName() external view returns (string memory);

    /// @notice Get the top 10 leaderboard
    /// @return players Array of player addresses (descending by score)
    /// @return scores Array of scores
    /// @return timestamps Array of submission timestamps
    function getLeaderboard() external view returns (
        address[] memory players,
        uint256[] memory scores,
        uint256[] memory timestamps
    );

    /// @notice Minimum score needed to enter top 10 (0 if board not full)
    function getMinScore() external view returns (uint256);

    // ── Events (must be emitted by all satellites) ──────────────────────
    event ScoreSubmitted(address indexed player, uint256 score, uint256 rank);
    event BadgeAwarded(address indexed player, uint256 tier);
}
