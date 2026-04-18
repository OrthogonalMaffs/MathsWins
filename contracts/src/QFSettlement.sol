// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract QFSettlement {
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    address public teamWallet;
    address public owner;

    // Dynamic splits for settle() / settleDraw() — owner-adjustable.
    // splitFee() remains hardcoded 5% burn / 95% team and is NOT affected by these.
    uint256 public burnPct;
    uint256 public teamPct;

    event Settled(address indexed winner, uint256 winnerAmount, uint256 burned, uint256 team);
    event SettledDraw(address indexed p1, address indexed p2, uint256 eachAmount, uint256 burned, uint256 team);
    event FeeSplit(uint256 burned, uint256 team);
    event SplitsUpdated(uint256 burnPct, uint256 teamPct);
    event TeamWalletUpdated(address teamWallet);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address _owner, address _teamWallet) {
        require(_owner != address(0), "owner zero");
        require(_teamWallet != address(0), "team zero");
        owner = _owner;
        teamWallet = _teamWallet;
        burnPct = 5;
        teamPct = 10;
        emit OwnershipTransferred(address(0), _owner);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setTeamWallet(address _teamWallet) external onlyOwner {
        require(_teamWallet != address(0), "team zero");
        teamWallet = _teamWallet;
        emit TeamWalletUpdated(_teamWallet);
    }

    function setSplits(uint256 _burnPct, uint256 _teamPct) external onlyOwner {
        require(_burnPct + _teamPct < 100, "Invalid splits");
        burnPct = _burnPct;
        teamPct = _teamPct;
        emit SplitsUpdated(_burnPct, _teamPct);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "owner zero");
        address prev = owner;
        owner = _newOwner;
        emit OwnershipTransferred(prev, _newOwner);
    }

    // Duel win / Battleships win — burnPct / teamPct / (100 - burnPct - teamPct) to winner
    function settle(address winner) external payable {
        uint256 pot = msg.value;
        uint256 burned = pot * burnPct / 100;
        uint256 team = pot * teamPct / 100;
        uint256 prize = pot - burned - team;

        _send(BURN_ADDRESS, burned);
        _send(teamWallet, team);
        _send(winner, prize);

        emit Settled(winner, prize, burned, team);
    }

    // Duel draw — burnPct / teamPct / remainder split evenly
    function settleDraw(address p1, address p2) external payable {
        uint256 pot = msg.value;
        uint256 burned = pot * burnPct / 100;
        uint256 team = pot * teamPct / 100;
        uint256 remaining = pot - burned - team;
        uint256 each = remaining / 2;

        _send(BURN_ADDRESS, burned);
        _send(teamWallet, team);
        _send(p1, each);
        _send(p2, each);

        emit SettledDraw(p1, p2, each, burned, team);
    }

    // Achievement mint + leaderboard entry — hardcoded 5% burn, 95% team.
    // Intentionally NOT affected by setSplits — ringfenced per spec.
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
