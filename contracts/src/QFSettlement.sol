// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract QFSettlement {
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    address public teamWallet;
    address public owner;

    event Settled(address indexed winner, uint256 winnerAmount, uint256 burned, uint256 team);
    event SettledDraw(address indexed p1, address indexed p2, uint256 eachAmount, uint256 burned, uint256 team);
    event FeeSplit(uint256 burned, uint256 team);

    constructor(address _teamWallet) {
        teamWallet = _teamWallet;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setTeamWallet(address _teamWallet) external onlyOwner {
        teamWallet = _teamWallet;
    }

    // Duel win / Battleships win — 5% burn, 5% team, 90% winner
    function settle(address winner) external payable {
        uint256 pot = msg.value;
        uint256 burned = pot * 5 / 100;
        uint256 team = pot * 5 / 100;
        uint256 prize = pot - burned - team;

        _send(BURN_ADDRESS, burned);
        _send(teamWallet, team);
        _send(winner, prize);

        emit Settled(winner, prize, burned, team);
    }

    // Duel draw — 5% burn, 5% team, 45% each
    function settleDraw(address p1, address p2) external payable {
        uint256 pot = msg.value;
        uint256 burned = pot * 5 / 100;
        uint256 team = pot * 5 / 100;
        uint256 remaining = pot - burned - team;
        uint256 each = remaining / 2;

        _send(BURN_ADDRESS, burned);
        _send(teamWallet, team);
        _send(p1, each);
        _send(p2, each);

        emit SettledDraw(p1, p2, each, burned, team);
    }

    // Achievement mint + leaderboard entry — 5% burn, 95% team
    function splitFee() external payable {
        uint256 amount = msg.value;
        uint256 burned = amount * 5 / 100;
        uint256 team = amount - burned;

        _send(BURN_ADDRESS, burned);
        _send(teamWallet, team);

        emit FeeSplit(burned, team);
    }

    function _send(address to, uint256 amount) internal {
        (bool ok,) = to.call{value: amount}("");
        require(ok, "Transfer failed");
    }
}
