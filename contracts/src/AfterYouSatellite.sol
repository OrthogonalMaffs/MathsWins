// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// ============================================================
//  After You — Queue Game Satellite for Maffs Games
//
//  Players join a queue, pay periodic heartbeats to hold
//  position, and nudge others backward. Winner = position 1
//  when a commit-reveal hidden timer fires.
//
//  Three tiers: Standard, Premium, High Stakes
//  70% winner / 20% treasury / 10% burn
//  Optional QFGamesHub integration for badges + discounts
// ============================================================

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IQFGamesHub {
    function mintBadge(address player, uint256 tier) external;
    function calculatePrice(address player, uint256 basePrice) external view returns (uint256);
}

contract AfterYouSatellite is Ownable, ReentrancyGuard {

    // ── Errors ──────────────────────────────────────────────────────────
    error InvalidTier();
    error TierNotActive();
    error QueueFull();
    error AlreadyInQueue();
    error NotInQueue();
    error WrongPhase();
    error InsufficientPayment();
    error TransferFailed();
    error DeadlineNotReached();
    error DeadlinePassed();
    error AlreadyCommitted();
    error NotCommitted();
    error AlreadyRevealed();
    error InvalidReveal();
    error TargetNotInQueue();
    error TargetNotAhead();
    error CannotNudgeSelf();
    error TooEarly();
    error ZeroAddress();
    error NoBonusRemaining();

    // ── Enums ───────────────────────────────────────────────────────────
    enum State { OPEN, COMMITTING, REVEALING, RESOLVING, FINISHED }

    // ── Constants ───────────────────────────────────────────────────────
    uint256 public constant MIN_PLAYERS = 5;
    uint256 public constant MAX_QUEUE_SIZE = 50;
    uint256 public constant COMMIT_WINDOW = 600;         // ~60 min
    uint256 public constant REVEAL_WINDOW = 600;         // ~60 min
    uint256 public constant MIN_GAME_DURATION = 720;     // ~2 hrs
    uint256 public constant MAX_GAME_DURATION = 2880;    // ~8 hrs additional
    uint256 public constant HEARTBEAT_INTERVAL = 1800;   // ~30 min
    uint256 public constant HEARTBEAT_GRACE = 200;       // grace blocks
    uint256 public constant WINNER_CUT = 70;
    uint256 public constant PROTOCOL_CUT = 20;
    uint256 public constant BURN_CUT = 10;
    uint256 public constant BONUS_PER_WIN = 5 ether;
    uint256 public constant MAX_BONUS_WINS = 10;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // ── Structs ─────────────────────────────────────────────────────────
    struct TierConfig {
        uint256 entryCost;
        uint256 heartbeatCost;
        uint256 nudgeCost;
        bool active;
    }

    struct PlayerInfo {
        uint256 lastHeartbeatBlock;
        bytes32 commitHash;
        bool hasCommitted;
        bool hasRevealed;
        uint256 revealedSecret;
    }

    struct QueueRound {
        State state;
        uint256 roundId;
        address[] players;
        uint256 pot;
        uint256 commitDeadline;
        uint256 revealDeadline;
        uint256 winBlock;
        uint256 combinedEntropy;
        uint256 revealCount;
    }

    // ── State ───────────────────────────────────────────────────────────
    mapping(uint256 => TierConfig) public tiers;
    uint256 public tierCount;

    mapping(uint256 => QueueRound) internal queues;
    mapping(uint256 => mapping(address => uint256)) internal playerIndex;
    mapping(uint256 => mapping(address => PlayerInfo)) internal playerData;
    mapping(uint256 => mapping(address => bool)) internal isInQueue;

    address payable public treasury;
    address public hubContract;
    uint256 public bonusReserve;
    uint256 public bonusWinsRemaining;

    // ── Events ──────────────────────────────────────────────────────────
    event PlayerJoined(uint256 indexed tierId, uint256 roundId, address indexed player, uint256 position);
    event PlayerEjected(uint256 indexed tierId, uint256 roundId, address indexed player);
    event PlayerMoved(uint256 indexed tierId, address indexed player, uint256 newPosition);
    event HeartbeatSent(uint256 indexed tierId, address indexed player);
    event PlayerNudged(uint256 indexed tierId, uint256 roundId, address indexed nudger, address indexed target);
    event SecretCommitted(uint256 indexed tierId, uint256 roundId, address indexed player);
    event SecretRevealed(uint256 indexed tierId, uint256 roundId, address indexed player);
    event PhaseChanged(uint256 indexed tierId, uint256 roundId, State newState);
    event WinBlockSet(uint256 indexed tierId, uint256 roundId, uint256 winBlock);
    event QueueResolved(uint256 indexed tierId, uint256 roundId, address indexed winner, uint256 prize);
    event QueueAborted(uint256 indexed tierId, uint256 roundId);
    event QueueReset(uint256 indexed tierId, uint256 newRoundId);
    event TierAdded(uint256 indexed tierId, uint256 entryCost, uint256 heartbeatCost, uint256 nudgeCost);
    event BonusBurned(uint256 amount);

    // ── Constructor ─────────────────────────────────────────────────────
    constructor(address payable _treasury, address _hub) payable Ownable(msg.sender) {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        hubContract = _hub; // address(0) is fine — hub is optional

        bonusReserve = msg.value;
        bonusWinsRemaining = MAX_BONUS_WINS;

        // Default tiers
        _addTier(5 ether, 0.1 ether, 0.5 ether);     // Standard
        _addTier(25 ether, 0.5 ether, 2 ether);       // Premium
        _addTier(100 ether, 2 ether, 10 ether);       // High Stakes
    }

    // ── Player Actions ──────────────────────────────────────────────────

    function joinQueue(uint256 tierId) external payable nonReentrant {
        TierConfig storage tier = tiers[tierId];
        if (!tier.active) revert TierNotActive();

        QueueRound storage q = queues[tierId];
        if (q.state != State.OPEN) revert WrongPhase();
        if (q.players.length >= MAX_QUEUE_SIZE) revert QueueFull();
        if (isInQueue[tierId][msg.sender]) revert AlreadyInQueue();

        uint256 price = _getEntryPrice(tierId, msg.sender);
        if (msg.value < price) revert InsufficientPayment();
        _refundExcess(msg.sender, msg.value, price);

        q.players.push(msg.sender);
        playerIndex[tierId][msg.sender] = q.players.length - 1;
        isInQueue[tierId][msg.sender] = true;
        playerData[tierId][msg.sender].lastHeartbeatBlock = block.number;
        q.pot += price;

        emit PlayerJoined(tierId, q.roundId, msg.sender, q.players.length);

        // Transition to COMMITTING when MIN_PLAYERS reached
        if (q.players.length == MIN_PLAYERS) {
            q.state = State.COMMITTING;
            q.commitDeadline = block.number + COMMIT_WINDOW;
            emit PhaseChanged(tierId, q.roundId, State.COMMITTING);
        }
    }

    function heartbeat(uint256 tierId) external payable nonReentrant {
        if (!isInQueue[tierId][msg.sender]) revert NotInQueue();

        QueueRound storage q = queues[tierId];
        if (q.state == State.FINISHED) revert WrongPhase();

        uint256 cost = tiers[tierId].heartbeatCost;
        if (msg.value < cost) revert InsufficientPayment();
        _refundExcess(msg.sender, msg.value, cost);

        // Apply pending decay first
        _applyDecay(tierId, msg.sender);
        if (!isInQueue[tierId][msg.sender]) revert NotInQueue();

        playerData[tierId][msg.sender].lastHeartbeatBlock = block.number;
        q.pot += cost;

        emit HeartbeatSent(tierId, msg.sender);
    }

    function nudge(uint256 tierId, address target) external payable nonReentrant {
        if (!isInQueue[tierId][msg.sender]) revert NotInQueue();
        if (!isInQueue[tierId][target]) revert TargetNotInQueue();
        if (target == msg.sender) revert CannotNudgeSelf();

        QueueRound storage q = queues[tierId];
        if (q.state == State.FINISHED || q.state == State.OPEN) revert WrongPhase();

        uint256 cost = tiers[tierId].nudgeCost;
        if (msg.value < cost) revert InsufficientPayment();
        _refundExcess(msg.sender, msg.value, cost);

        // Apply decay to both players first
        _applyDecay(tierId, msg.sender);
        _applyDecay(tierId, target);

        if (!isInQueue[tierId][msg.sender]) revert NotInQueue();
        if (!isInQueue[tierId][target]) revert TargetNotInQueue();

        uint256 callerPos = playerIndex[tierId][msg.sender];
        uint256 targetPos = playerIndex[tierId][target];
        if (targetPos >= callerPos) revert TargetNotAhead();

        // Push target back one position
        if (targetPos + 1 >= q.players.length) {
            _ejectPlayer(tierId, target);
        } else {
            _swapPositions(tierId, targetPos, targetPos + 1);
            emit PlayerMoved(tierId, target, targetPos + 2); // 1-indexed
        }

        q.pot += cost;
        emit PlayerNudged(tierId, q.roundId, msg.sender, target);
    }

    // ── Commit-Reveal ───────────────────────────────────────────────────

    function commitSecret(uint256 tierId, bytes32 commitHash) external {
        QueueRound storage q = queues[tierId];
        if (q.state != State.COMMITTING) revert WrongPhase();
        if (block.number > q.commitDeadline) revert DeadlinePassed();
        if (!isInQueue[tierId][msg.sender]) revert NotInQueue();

        PlayerInfo storage info = playerData[tierId][msg.sender];
        if (info.hasCommitted) revert AlreadyCommitted();

        info.commitHash = commitHash;
        info.hasCommitted = true;

        emit SecretCommitted(tierId, q.roundId, msg.sender);
    }

    function revealSecret(uint256 tierId, uint256 secret) external {
        QueueRound storage q = queues[tierId];
        if (q.state != State.REVEALING) revert WrongPhase();
        if (block.number > q.revealDeadline) revert DeadlinePassed();
        if (!isInQueue[tierId][msg.sender]) revert NotInQueue();

        PlayerInfo storage info = playerData[tierId][msg.sender];
        if (!info.hasCommitted) revert NotCommitted();
        if (info.hasRevealed) revert AlreadyRevealed();

        bytes32 expected = keccak256(abi.encodePacked(secret, msg.sender));
        if (expected != info.commitHash) revert InvalidReveal();

        info.hasRevealed = true;
        info.revealedSecret = secret;
        q.combinedEntropy ^= secret;
        q.revealCount++;

        emit SecretRevealed(tierId, q.roundId, msg.sender);
    }

    // ── Phase Transitions (keeper pattern — anyone can call) ────────────

    function advanceToReveal(uint256 tierId) external {
        QueueRound storage q = queues[tierId];
        if (q.state != State.COMMITTING) revert WrongPhase();
        if (block.number <= q.commitDeadline) revert DeadlineNotReached();

        // Eject non-committers (iterate backwards to avoid index issues)
        for (uint256 i = q.players.length; i > 0; i--) {
            address p = q.players[i - 1];
            if (!playerData[tierId][p].hasCommitted) {
                _ejectPlayer(tierId, p);
            }
        }

        if (q.players.length < 2) {
            _abortQueue(tierId);
            return;
        }

        q.state = State.REVEALING;
        q.revealDeadline = block.number + REVEAL_WINDOW;
        emit PhaseChanged(tierId, q.roundId, State.REVEALING);
    }

    function advanceToResolving(uint256 tierId) external {
        QueueRound storage q = queues[tierId];
        if (q.state != State.REVEALING) revert WrongPhase();
        if (block.number <= q.revealDeadline) revert DeadlineNotReached();

        // Eject non-revealers
        for (uint256 i = q.players.length; i > 0; i--) {
            address p = q.players[i - 1];
            if (!playerData[tierId][p].hasRevealed) {
                _ejectPlayer(tierId, p);
            }
        }

        if (q.players.length < 2) {
            _abortQueue(tierId);
            return;
        }

        q.winBlock = block.number + MIN_GAME_DURATION + (q.combinedEntropy % MAX_GAME_DURATION);
        q.state = State.RESOLVING;
        emit PhaseChanged(tierId, q.roundId, State.RESOLVING);
        emit WinBlockSet(tierId, q.roundId, q.winBlock);
    }

    function resolveQueue(uint256 tierId) external nonReentrant {
        QueueRound storage q = queues[tierId];
        if (q.state != State.RESOLVING) revert WrongPhase();
        if (block.number < q.winBlock) revert TooEarly();

        // Apply final decay to all players
        for (uint256 i = q.players.length; i > 0; i--) {
            if (i <= q.players.length) {
                _applyDecay(tierId, q.players[i - 1]);
            }
        }

        if (q.players.length == 0) {
            // Everyone ejected — burn entire pot
            uint256 deadPot = q.pot;
            q.pot = 0;
            (bool ok,) = BURN_ADDRESS.call{value: deadPot}("");
            if (!ok) revert TransferFailed();
            _resetQueue(tierId);
            return;
        }

        address winner = q.players[0];
        uint256 pot = q.pot;

        uint256 winnerAmount = (pot * WINNER_CUT) / 100;
        uint256 protocolAmount = (pot * PROTOCOL_CUT) / 100;
        uint256 burnAmount = pot - winnerAmount - protocolAmount;

        // State changes before transfers
        q.pot = 0;
        uint256 roundId = q.roundId;
        uint256 playerCount = q.players.length;

        // Bonus
        uint256 bonus = 0;
        if (bonusWinsRemaining > 0 && playerCount >= MIN_PLAYERS) {
            bonus = BONUS_PER_WIN;
            if (bonus > bonusReserve) bonus = bonusReserve;
            bonusReserve -= bonus;
            bonusWinsRemaining--;
        }

        // Transfers
        (bool ok1,) = winner.call{value: winnerAmount + bonus}("");
        if (!ok1) revert TransferFailed();

        (bool ok2,) = treasury.call{value: protocolAmount}("");
        if (!ok2) revert TransferFailed();

        (bool ok3,) = BURN_ADDRESS.call{value: burnAmount}("");
        if (!ok3) revert TransferFailed();

        // Badge via hub (graceful failure)
        if (hubContract != address(0)) {
            try IQFGamesHub(hubContract).mintBadge(winner, 3) {} catch {}
        }

        emit QueueResolved(tierId, roundId, winner, winnerAmount + bonus);

        _resetQueue(tierId);
    }

    // ── Decay Processing (anyone can call) ──────────────────────────────

    function processDecay(uint256 tierId, address[] calldata staleList) external {
        for (uint256 i = 0; i < staleList.length; i++) {
            if (isInQueue[tierId][staleList[i]]) {
                _applyDecay(tierId, staleList[i]);
            }
        }
    }

    // ── Owner Functions ─────────────────────────────────────────────────

    function addTier(uint256 entryCost, uint256 heartbeatCost, uint256 nudgeCost) external onlyOwner returns (uint256) {
        return _addTier(entryCost, heartbeatCost, nudgeCost);
    }

    function setTierActive(uint256 tierId, bool active) external onlyOwner {
        if (tierId >= tierCount) revert InvalidTier();
        tiers[tierId].active = active;
    }

    function setTreasury(address payable newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        treasury = newTreasury;
    }

    function setHubContract(address _hub) external onlyOwner {
        hubContract = _hub;
    }

    function burnRemainingBonus() external onlyOwner {
        if (bonusReserve == 0) revert NoBonusRemaining();
        uint256 amount = bonusReserve;
        bonusReserve = 0;
        bonusWinsRemaining = 0;
        (bool ok,) = BURN_ADDRESS.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit BonusBurned(amount);
    }

    // ── View Functions ──────────────────────────────────────────────────

    function getQueueState(uint256 tierId) external view returns (
        State state,
        uint256 playerCount,
        uint256 pot,
        uint256 winBlock,
        uint256 roundId
    ) {
        QueueRound storage q = queues[tierId];
        return (q.state, q.players.length, q.pot, q.winBlock, q.roundId);
    }

    function getPlayerPosition(uint256 tierId, address player) external view returns (uint256) {
        if (!isInQueue[tierId][player]) return 0;
        return playerIndex[tierId][player] + 1; // 1-indexed
    }

    function getQueuePlayers(uint256 tierId) external view returns (address[] memory) {
        return queues[tierId].players;
    }

    function getTierConfig(uint256 tierId) external view returns (
        uint256 entryCost,
        uint256 heartbeatCost,
        uint256 nudgeCost,
        bool active
    ) {
        TierConfig storage t = tiers[tierId];
        return (t.entryCost, t.heartbeatCost, t.nudgeCost, t.active);
    }

    function getPlayerInfo(uint256 tierId, address player) external view returns (
        uint256 lastHeartbeatBlock,
        bool hasCommitted,
        bool hasRevealed
    ) {
        PlayerInfo storage info = playerData[tierId][player];
        return (info.lastHeartbeatBlock, info.hasCommitted, info.hasRevealed);
    }

    function getBlocksUntilHeartbeatDue(uint256 tierId, address player) external view returns (uint256) {
        if (!isInQueue[tierId][player]) return 0;
        uint256 lastBeat = playerData[tierId][player].lastHeartbeatBlock;
        uint256 dueAt = lastBeat + HEARTBEAT_INTERVAL;
        if (block.number >= dueAt) return 0;
        return dueAt - block.number;
    }

    function getWinBlock(uint256 tierId) external view returns (uint256) {
        return queues[tierId].winBlock;
    }

    function getPot(uint256 tierId) external view returns (uint256) {
        return queues[tierId].pot;
    }

    // ── Internal ────────────────────────────────────────────────────────

    function _addTier(uint256 entryCost, uint256 heartbeatCost, uint256 nudgeCost) internal returns (uint256 tierId) {
        tierId = tierCount++;
        tiers[tierId] = TierConfig({
            entryCost: entryCost,
            heartbeatCost: heartbeatCost,
            nudgeCost: nudgeCost,
            active: true
        });
        // Initialize queue round
        queues[tierId].state = State.OPEN;
        queues[tierId].roundId = 1;
        emit TierAdded(tierId, entryCost, heartbeatCost, nudgeCost);
    }

    function _getEntryPrice(uint256 tierId, address player) internal view returns (uint256) {
        uint256 basePrice = tiers[tierId].entryCost;
        if (hubContract != address(0)) {
            try IQFGamesHub(hubContract).calculatePrice(player, basePrice) returns (uint256 discounted) {
                return discounted;
            } catch {
                return basePrice;
            }
        }
        return basePrice;
    }

    function _refundExcess(address to, uint256 sent, uint256 required) internal {
        if (sent > required) {
            (bool ok,) = to.call{value: sent - required}("");
            if (!ok) revert TransferFailed();
        }
    }

    function _applyDecay(uint256 tierId, address player) internal {
        if (!isInQueue[tierId][player]) return;

        PlayerInfo storage info = playerData[tierId][player];
        uint256 elapsed = block.number - info.lastHeartbeatBlock;

        if (elapsed <= HEARTBEAT_INTERVAL + HEARTBEAT_GRACE) return;

        uint256 missedIntervals = (elapsed - HEARTBEAT_GRACE) / HEARTBEAT_INTERVAL;
        if (missedIntervals == 0) return;

        uint256 currentPos = playerIndex[tierId][player];
        QueueRound storage q = queues[tierId];
        uint256 newPos = currentPos + missedIntervals;

        if (newPos >= q.players.length) {
            _ejectPlayer(tierId, player);
            return;
        }

        // Move player back by swapping with each player behind them
        for (uint256 i = currentPos; i < newPos && i + 1 < q.players.length; i++) {
            _swapPositions(tierId, i, i + 1);
        }

        emit PlayerMoved(tierId, player, newPos + 1); // 1-indexed
    }

    function _swapPositions(uint256 tierId, uint256 posA, uint256 posB) internal {
        QueueRound storage q = queues[tierId];
        address playerA = q.players[posA];
        address playerB = q.players[posB];
        q.players[posA] = playerB;
        q.players[posB] = playerA;
        playerIndex[tierId][playerA] = posB;
        playerIndex[tierId][playerB] = posA;
    }

    function _ejectPlayer(uint256 tierId, address player) internal {
        QueueRound storage q = queues[tierId];
        uint256 pos = playerIndex[tierId][player];
        uint256 lastIdx = q.players.length - 1;

        if (pos != lastIdx) {
            address lastPlayer = q.players[lastIdx];
            q.players[pos] = lastPlayer;
            playerIndex[tierId][lastPlayer] = pos;
        }
        q.players.pop();
        delete playerIndex[tierId][player];
        delete playerData[tierId][player];
        isInQueue[tierId][player] = false;

        emit PlayerEjected(tierId, q.roundId, player);
    }

    function _abortQueue(uint256 tierId) internal {
        QueueRound storage q = queues[tierId];

        // Refund surviving players their share of the pot
        uint256 survivors = q.players.length;
        if (survivors > 0 && q.pot > 0) {
            uint256 refundEach = q.pot / survivors;
            uint256 remainder = q.pot - (refundEach * survivors);

            for (uint256 i = 0; i < survivors; i++) {
                (bool ok,) = q.players[i].call{value: refundEach}("");
                if (!ok) revert TransferFailed();
            }

            // Burn any dust remainder
            if (remainder > 0) {
                (bool ok,) = BURN_ADDRESS.call{value: remainder}("");
                if (!ok) revert TransferFailed();
            }
        }

        q.pot = 0;
        emit QueueAborted(tierId, q.roundId);
        _resetQueue(tierId);
    }

    function _resetQueue(uint256 tierId) internal {
        QueueRound storage q = queues[tierId];

        // Clean up remaining player data
        for (uint256 i = 0; i < q.players.length; i++) {
            address p = q.players[i];
            delete playerIndex[tierId][p];
            delete playerData[tierId][p];
            isInQueue[tierId][p] = false;
        }
        delete q.players;

        q.roundId++;
        q.state = State.OPEN;
        q.pot = 0;
        q.commitDeadline = 0;
        q.revealDeadline = 0;
        q.winBlock = 0;
        q.combinedEntropy = 0;
        q.revealCount = 0;

        emit QueueReset(tierId, q.roundId);
    }
}
