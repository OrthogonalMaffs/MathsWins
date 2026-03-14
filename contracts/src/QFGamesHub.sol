// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// ============================================================
//  QF Games Hub
//  Central hub for QF Network game suite
//  Manages: badge minting, discount logic, fee routing,
//           satellite whitelist, gas reserve enforcement
//
//  Architecture: Hub + Satellites
//  Each game is a separate satellite contract that calls
//  this hub to mint badges on verified completion.
//
//  Badge tiers (Greek letter names):
//  TIER_0 = Alpha (α) — 10% discount
//  TIER_1 = Beta  (β) — 15% discount
//  TIER_2 = Lambda (λ) — 20% discount
//  TIER_3 = Delta (δ) — 25% discount (ceiling)
//
//  Badges are soulbound (non-transferable, non-burnable).
//  Discount is determined by HIGHEST tier held — never stacked.
//  Protocol pays badge mint gas from contract reserve.
//  Minimum gas reserve enforced on all withdrawals.
// ============================================================

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract QFGamesHub is ERC1155, Ownable {

    // ── Errors ──────────────────────────────────────────────────────────
    error ZeroAddress();
    error InvalidTier();
    error AlreadyRegistered();
    error NotRegistered();
    error ZeroAmount();
    error BreachesGasReserve();
    error TransferFailed();
    error NoBadges();

    // ── Tier constants ──────────────────────────────────────────────────
    uint256 public constant TIER_0 = 0; // Alpha (α)
    uint256 public constant TIER_1 = 1; // Beta  (β)
    uint256 public constant TIER_2 = 2; // Lambda (λ)
    uint256 public constant TIER_3 = 3; // Delta (δ)
    uint256 public constant MAX_TIER = TIER_3;

    // ── Discount rates (basis points) ───────────────────────────────────
    uint256 public constant TIER_0_DISCOUNT = 1000; // 10%
    uint256 public constant TIER_1_DISCOUNT = 1500; // 15%
    uint256 public constant TIER_2_DISCOUNT = 2000; // 20%
    uint256 public constant TIER_3_DISCOUNT = 2500; // 25%

    // ── Gas reserve ─────────────────────────────────────────────────────
    uint256 public constant MINT_GAS_COST = 0.001 ether; // PLACEHOLDER — calibrate on QF Network
    uint256 public constant GAS_RESERVE_MINTS = 100;
    uint256 public constant MIN_GAS_RESERVE = MINT_GAS_COST * GAS_RESERVE_MINTS;

    // ── State ───────────────────────────────────────────────────────────
    mapping(address => bool) public approvedSatellites;
    mapping(address => uint256) private _highestTier;
    mapping(address => bool) public hasBadge;

    // ── Events ──────────────────────────────────────────────────────────
    event SatelliteRegistered(address indexed satellite);
    event SatelliteRevoked(address indexed satellite);
    event BadgeMinted(address indexed player, uint256 tier, address indexed satellite);
    event FeesReceived(address indexed from, uint256 amount);
    event FeesWithdrawn(address indexed to, uint256 amount);

    // ── Constructor ─────────────────────────────────────────────────────
    constructor(address initialOwner)
        ERC1155("https://qfgames.qfnetwork.io/metadata/{id}.json")
        Ownable(initialOwner)
    {}

    // ── Admin: satellite management ─────────────────────────────────────
    function registerSatellite(address satellite) external onlyOwner {
        if (satellite == address(0)) revert ZeroAddress();
        if (approvedSatellites[satellite]) revert AlreadyRegistered();
        approvedSatellites[satellite] = true;
        emit SatelliteRegistered(satellite);
    }

    function revokeSatellite(address satellite) external onlyOwner {
        if (!approvedSatellites[satellite]) revert NotRegistered();
        approvedSatellites[satellite] = false;
        emit SatelliteRevoked(satellite);
    }

    // ── Core: badge minting (called by satellites only) ─────────────────
    function mintBadge(address player, uint256 tier) external {
        if (!approvedSatellites[msg.sender]) revert NotRegistered();
        if (player == address(0)) revert ZeroAddress();
        if (tier > MAX_TIER) revert InvalidTier();

        if (!hasBadge[player] || tier > _highestTier[player]) {
            _highestTier[player] = tier;
            hasBadge[player] = true;
        }

        _mint(player, tier, 1, "");
        emit BadgeMinted(player, tier, msg.sender);
    }

    // ── View: discount and tier queries ─────────────────────────────────
    function getHighestTier(address player) external view returns (uint256) {
        if (!hasBadge[player]) revert NoBadges();
        return _highestTier[player];
    }

    function getDiscount(address player) external view returns (uint256) {
        if (!hasBadge[player]) return 0;
        uint256 tier = _highestTier[player];
        if (tier >= TIER_3) return TIER_3_DISCOUNT;
        if (tier == TIER_2) return TIER_2_DISCOUNT;
        if (tier == TIER_1) return TIER_1_DISCOUNT;
        return TIER_0_DISCOUNT;
    }

    function calculatePrice(address player, uint256 basePrice) external view returns (uint256) {
        uint256 discount = this.getDiscount(player);
        if (discount == 0) return basePrice;
        return basePrice - (basePrice * discount / 10000);
    }

    // ── Fee management ──────────────────────────────────────────────────
    receive() external payable {
        emit FeesReceived(msg.sender, msg.value);
    }

    function withdrawFees(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (address(this).balance - amount < MIN_GAS_RESERVE) revert BreachesGasReserve();
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit FeesWithdrawn(to, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getWithdrawable() external view returns (uint256) {
        if (address(this).balance <= MIN_GAS_RESERVE) return 0;
        return address(this).balance - MIN_GAS_RESERVE;
    }

    // ── Admin: metadata URI ─────────────────────────────────────────────
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    // ── Soulbound enforcement ───────────────────────────────────────────
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override {
        if (from != address(0)) revert(); // badges are soulbound
        super._update(from, to, ids, values);
    }
}
