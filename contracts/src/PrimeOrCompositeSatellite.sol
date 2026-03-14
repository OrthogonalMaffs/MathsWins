// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./QFSimpleSatellite.sol";

/// @title PrimeOrCompositeSatellite — Satellite for the Prime or Composite game
/// @notice Score = number of correct classifications in a session.
///         Simple integer score, higher is better. No upper bound enforced
///         since the game is time-limited on the frontend.

contract PrimeOrCompositeSatellite is QFSimpleSatellite {
    /// @notice Maximum plausible score per session (sanity check).
    ///         The frontend game is time-limited — nobody can reasonably
    ///         classify more than 200 numbers in one session.
    uint256 public constant MAX_PLAUSIBLE_SCORE = 200;

    constructor(address _hub, uint256 _submissionFee)
        QFSimpleSatellite(_hub, "Prime or Composite", _submissionFee)
    {}

    /// @notice Validate that the score is plausible for this game.
    function _validateScore(uint256 score) internal pure override {
        if (score == 0 || score > MAX_PLAUSIBLE_SCORE) revert InvalidScore();
    }
}
