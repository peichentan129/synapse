// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title Nous
/// @notice A single shared on-chain perceptron. Each round it reveals a feature
/// vector, the crowd stakes on the hidden target function's verdict, and after
/// the round resolves the model's weights nudge toward the correct answer.
contract Nous {
    uint8 public constant DIM = 5;
    uint256 public constant STAKE_WINDOW = 5 minutes;
    uint256 public constant MIN_STAKE = 1e14;
    uint256 public constant FEE_BPS = 300;
    int256 public constant W_CLAMP = 500;
    int256 public constant LEARNING_RATE = 3;

    address public immutable treasury;

    int256[5] public weights;
    int256 public bias;
    uint256 public epochId;
    uint256 public correctCount;
    uint256 public totalCount;

    struct EpochData {
        int256[5] features;
        uint256 startTime;
        uint256 poolYes;
        uint256 poolNo;
        bool resolved;
        uint8 trueLabel;
        uint256 payoutPerShareWinner;
    }

    mapping(uint256 => EpochData) private _epochs;
    mapping(uint256 => mapping(address => uint256)) public yesStake;
    mapping(uint256 => mapping(address => uint256)) public noStake;
    mapping(uint256 => mapping(address => bool)) public claimed;

    event EpochStarted(uint256 indexed id, int256[5] features, uint256 startTime);
    event Predicted(uint256 indexed id, address indexed user, bool side, uint256 amount);
    event EpochResolved(uint256 indexed id, uint8 trueLabel, uint256 poolYes, uint256 poolNo, bool modelCorrect);
    event Claimed(uint256 indexed id, address indexed user, uint256 amount);

    constructor() {
        treasury = msg.sender;
    }

    function currentEpoch()
        external
        view
        returns (
            uint256 id,
            int256[5] memory features,
            uint256 startTime,
            uint256 poolYes,
            uint256 poolNo,
            bool resolved,
            uint256 secondsLeft
        )
    {
        EpochData storage e = _epochs[epochId];
        id = epochId;
        features = e.features;
        startTime = e.startTime;
        poolYes = e.poolYes;
        poolNo = e.poolNo;
        resolved = e.resolved;
        uint256 deadline = e.startTime + STAKE_WINDOW;
        secondsLeft = (e.startTime == 0 || block.timestamp >= deadline) ? 0 : deadline - block.timestamp;
    }

    function epochAt(uint256 id)
        external
        view
        returns (
            int256[5] memory features,
            uint256 startTime,
            uint256 poolYes,
            uint256 poolNo,
            bool resolved,
            uint8 trueLabel,
            uint256 payoutPerShareWinner
        )
    {
        EpochData storage e = _epochs[id];
        return (e.features, e.startTime, e.poolYes, e.poolNo, e.resolved, e.trueLabel, e.payoutPerShareWinner);
    }

    function modelSignal() external view returns (int256 score, bool predictedYes) {
        return _modelSignal(_epochs[epochId].features);
    }

    function _modelSignal(int256[5] memory feats) internal view returns (int256 score, bool predictedYes) {
        int256 s = bias;
        for (uint8 i = 0; i < DIM; i++) {
            s += weights[i] * feats[i];
        }
        return (s, s > 0);
    }

    function startEpoch() external {
        require(epochId == 0 || _epochs[epochId].resolved, "resolve current round first");
        epochId += 1;
        bytes32 seed = keccak256(abi.encodePacked(blockhash(block.number - 1), epochId, address(this)));
        int256[5] memory feats;
        for (uint8 i = 0; i < DIM; i++) {
            uint256 raw = uint256(keccak256(abi.encodePacked(seed, i)));
            feats[i] = int256(raw % 201) - 100;
        }
        EpochData storage e = _epochs[epochId];
        e.features = feats;
        e.startTime = block.timestamp;
        emit EpochStarted(epochId, feats, block.timestamp);
    }

    function predict(bool sideYes) external payable {
        EpochData storage e = _epochs[epochId];
        require(e.startTime != 0, "no active round");
        require(!e.resolved, "round resolved");
        require(block.timestamp < e.startTime + STAKE_WINDOW, "staking closed");
        require(msg.value >= MIN_STAKE, "stake too small");
        if (sideYes) {
            yesStake[epochId][msg.sender] += msg.value;
            e.poolYes += msg.value;
        } else {
            noStake[epochId][msg.sender] += msg.value;
            e.poolNo += msg.value;
        }
        emit Predicted(epochId, msg.sender, sideYes, msg.value);
    }

    function _trueLabel(int256[5] memory feats) private pure returns (uint8) {
        int256[5] memory secretW = [int256(17), int256(-23), int256(31), int256(-11), int256(19)];
        int256 s = 0;
        for (uint8 i = 0; i < DIM; i++) {
            s += secretW[i] * feats[i];
        }
        return s > 0 ? 1 : 0;
    }

    function resolveEpoch() external {
        uint256 id = epochId;
        EpochData storage e = _epochs[id];
        require(e.startTime != 0, "no round");
        require(!e.resolved, "already resolved");
        require(block.timestamp >= e.startTime + STAKE_WINDOW, "staking still open");

        uint8 label = _trueLabel(e.features);
        e.trueLabel = label;
        e.resolved = true;

        (, bool modelYes) = _modelSignal(e.features);
        bool modelCorrect = (modelYes && label == 1) || (!modelYes && label == 0);
        totalCount += 1;
        if (modelCorrect) correctCount += 1;

        int256 sign = label == 1 ? int256(1) : int256(-1);
        for (uint8 i = 0; i < DIM; i++) {
            int256 nw = weights[i] + (LEARNING_RATE * sign * e.features[i]) / 100;
            if (nw > W_CLAMP) nw = W_CLAMP;
            if (nw < -W_CLAMP) nw = -W_CLAMP;
            weights[i] = nw;
        }
        int256 nb = bias + sign * 2;
        if (nb > W_CLAMP) nb = W_CLAMP;
        if (nb < -W_CLAMP) nb = -W_CLAMP;
        bias = nb;

        uint256 winPool = label == 1 ? e.poolYes : e.poolNo;
        uint256 losePool = label == 1 ? e.poolNo : e.poolYes;
        if (winPool > 0) {
            uint256 fee = (losePool * FEE_BPS) / 10000;
            uint256 distributable = winPool + (losePool - fee);
            e.payoutPerShareWinner = (distributable * 1e18) / winPool;
            if (fee > 0) {
                (bool ok, ) = treasury.call{value: fee}("");
                require(ok, "fee transfer failed");
            }
        }

        emit EpochResolved(id, label, e.poolYes, e.poolNo, modelCorrect);
    }

    function claim(uint256 id) external {
        EpochData storage e = _epochs[id];
        require(e.resolved, "not resolved");
        require(!claimed[id][msg.sender], "already claimed");
        claimed[id][msg.sender] = true;

        uint256 payout;
        if (e.payoutPerShareWinner == 0) {
            payout = yesStake[id][msg.sender] + noStake[id][msg.sender];
        } else {
            uint256 winnerStake = e.trueLabel == 1 ? yesStake[id][msg.sender] : noStake[id][msg.sender];
            payout = (winnerStake * e.payoutPerShareWinner) / 1e18;
        }
        require(payout > 0, "nothing to claim");
        (bool ok, ) = msg.sender.call{value: payout}("");
        require(ok, "payout failed");
        emit Claimed(id, msg.sender, payout);
    }

    function accuracyBps() external view returns (uint256) {
        if (totalCount == 0) return 0;
        return (correctCount * 10000) / totalCount;
    }

    function getWeights() external view returns (int256[5] memory, int256) {
        return (weights, bias);
    }
}
