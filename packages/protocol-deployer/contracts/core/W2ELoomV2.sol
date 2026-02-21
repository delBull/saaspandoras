// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ProtocolRegistry.sol";
import "../interfaces/IW2EUtilityToken.sol";

/**
 * @title W2ELoomV2 - Motor Lógico W2E (Ecosystem Enabled)
 * @notice Contrato principal que maneja toda la lógica Work-to-Earn en un ecosistema modular.
 * @dev Reemplaza la dependencia de un solo NFT por el ProtocolRegistry.
 */
contract W2ELoomV2 is Ownable, ReentrancyGuard, Pausable {
    
    /// @notice Explicit version of the protocol
    uint8 public constant PROTOCOL_VERSION = 2;

    // ========== DEPENDENCIAS ==========

    /// @notice Registro de artefactos autorizados (Ecosystem Registry)
    ProtocolRegistry public registry;

    /// @notice Token de utilidad ERC-20 (PHI)
    IW2EUtilityToken public utilityToken;

    /// @notice Dirección de la tesorería principal de Pandora (Root)
    address public pandoraRootTreasury;

    /// @notice Dirección de la tesorería específica del protocolo (PBOX)
    address public protocolTreasuryAddress;

    /// @notice Dirección del oráculo de Pandora (backend autorizado)
    address public pandoraOracle;

    /// @notice Dirección de la plataforma para fees
    address public platformFeeWallet;

    // ========== CONFIGURACIÓN DE CAPITAL Y DISTRIBUCIÓN ==========

    /// @notice Dirección del creador para payouts iniciales
    address public creatorWallet;

    /// @notice Porcentaje de la venta inicial para el creador (0-100)
    uint256 public creatorPayoutPct;

    /// @notice Monto total recaudado de la venta de licencias/artifacts
    uint256 public totalRaised;

    /// @notice Monto ya pagado al creador
    uint256 public creatorPaidOut;

    /// @notice Pool de recompensas para W2E
    uint256 public rewardPool;

    // ========== CONFIGURACIÓN DAO/GOBERNANZA ==========

    uint256 public minQuorumPercentage = 10;
    uint256 public votingPeriodSeconds = 7 days;
    uint256 public emergencyInactivitySeconds = 15 days;
    uint256 public emergencyQuorumPct = 20;

    uint256 public constant MIN_STAKING_REWARD_RATE = 1585489599;
    uint256 public constant DEFAULT_STAKING_APY = 500;
    uint256 public constant MIN_LOCK_PERIOD = 1 days;
    uint256 public constant MIN_FUNDING_STAKE = 100 * 10**18;
    uint256 public constant MAX_FEE_PERCENTAGE = 1000;
    uint256 public constant DEFAULT_FEE_PERCENTAGE = 100;

    uint256 public stakingRewardRate = 1585489599;
    uint256 public phiFundSplitPct = 20;
    uint256 public inactivityThresholdSeconds = 90 days;

    bool public isActive = true;

    enum ProtocolState { PRE_LIVE, LIVE, COMPLETED, INACTIVE }
    ProtocolState public protocolState = ProtocolState.PRE_LIVE;

    uint256 public targetAmount;
    uint256 public payoutWindowSeconds = 30 days;
    uint256 public targetReachedTime;

    // ========== ESTRUCTURAS DE DATOS ==========

    enum TaskStatus { Pending, Approved, Rejected, Expired, Executed }
    enum TaskType { Validation, Sales, Governance, Emergency }

    struct W2ETask {
        uint256 id;
        TaskType taskType;
        uint256 rewardAmount;
        uint256 requiredStake;
        uint256 startTime;
        uint256 approvalVotes;
        uint256 rejectionVotes;
        TaskStatus status;
        address payable fundingRecipient;
        bytes32 offChainProof;
        string description;
    }

    struct VoteInfo {
        bool hasVoted;
        bool vote;
        uint256 stakeAmount;
        uint256 voteTime;
    }

    // ========== STORAGE ==========

    mapping(uint256 => W2ETask) public tasks;
    mapping(uint256 => mapping(address => VoteInfo)) public taskVotes;
    uint256 public taskCount;
    uint256 public activeTaskCount;
    uint256 public totalVoteCount;
    uint256 public lastTaskFinalizedTime;

    // ========== EVENTOS ==========

    event TaskCreated(uint256 indexed taskId, TaskType taskType, address indexed creator, uint256 rewardAmount, string description);
    event VoteCast(uint256 indexed taskId, address indexed voter, bool vote, uint256 stakeAmount);
    event TaskFinalized(uint256 indexed taskId, TaskStatus status, uint256 totalVotes);
    event RevenueDeposited(address indexed depositor, uint256 amount, uint256 rewardPoolAllocated);
    event CreatorPayoutReleased(address indexed creator, uint256 amount, uint256 totalPaidOut);

    // ========== CONSTRUCTOR ==========

    constructor(
        address _registry,
        address _utilityToken,
        address _pandoraRootTreasury,
        address _protocolTreasuryAddress,
        address _pandoraOracle,
        address _platformFeeWallet,
        address _creatorWallet,
        uint256 _creatorPayoutPct,
        uint256 _minQuorumPercentage,
        uint256 _votingPeriodSeconds,
        uint256 _emergencyPeriodSeconds,
        uint256 _emergencyQuorumPct,
        uint256 _stakingRewardRate,
        uint256 _phiFundSplitPct,
        address initialOwner
    ) Ownable() {
        require(_registry != address(0), "W2E: Invalid registry address");
        require(_utilityToken != address(0), "W2E: Invalid utility token address");
        require(_pandoraRootTreasury != address(0), "W2E: Invalid pandora root treasury");
        require(_protocolTreasuryAddress != address(0), "W2E: Invalid protocol treasury");
        require(_pandoraOracle != address(0), "W2E: Invalid oracle address");
        require(_platformFeeWallet != address(0), "W2E: Invalid platform wallet");
        require(_creatorWallet != address(0), "W2E: Invalid creator wallet");

        registry = ProtocolRegistry(_registry);
        utilityToken = IW2EUtilityToken(_utilityToken);
        pandoraRootTreasury = _pandoraRootTreasury;
        protocolTreasuryAddress = _protocolTreasuryAddress;
        pandoraOracle = _pandoraOracle;
        platformFeeWallet = _platformFeeWallet;
        creatorWallet = _creatorWallet;
        creatorPayoutPct = _creatorPayoutPct;

        minQuorumPercentage = _minQuorumPercentage;
        votingPeriodSeconds = _votingPeriodSeconds;
        emergencyInactivitySeconds = _emergencyPeriodSeconds;
        emergencyQuorumPct = _emergencyQuorumPct;
        phiFundSplitPct = _phiFundSplitPct;

        lastTaskFinalizedTime = block.timestamp;

        if (initialOwner != address(0) && initialOwner != msg.sender) {
            transferOwnership(initialOwner);
        }
    }

    // ========== MODIFICADORES ==========

    /// @notice Solo poseedores de un artefacto autorizado pueden llamar
    modifier onlyAuthorizedArtifactHolder() {
        require(registry.hasAnyAuthorizedArtifact(msg.sender), "W2E: Authorized artifact required");
        _;
    }

    modifier onlyPandoraOracle() {
        require(msg.sender == pandoraOracle, "W2E: Not Pandora Oracle");
        _;
    }

    // ========== FUNCIONES CORE (Simplified placeholders for V2 logic) ==========

    function createValidationTask(
        uint256 rewardAmount,
        uint256 requiredStake,
        string calldata description
    ) external onlyOwner returns (uint256) {
        taskCount++;
        uint256 taskId = taskCount;
        tasks[taskId] = W2ETask({
            id: taskId,
            taskType: TaskType.Validation,
            rewardAmount: rewardAmount,
            requiredStake: requiredStake,
            startTime: block.timestamp,
            approvalVotes: 0,
            rejectionVotes: 0,
            status: TaskStatus.Pending,
            fundingRecipient: payable(address(0)),
            offChainProof: bytes32(0),
            description: description
        });
        activeTaskCount++;
        emit TaskCreated(taskId, TaskType.Validation, msg.sender, rewardAmount, description);
        return taskId;
    }

    function voteOnTask(uint256 taskId, bool approve)
        external
        onlyAuthorizedArtifactHolder
        nonReentrant
    {
        W2ETask storage task = tasks[taskId];
        require(task.status == TaskStatus.Pending, "W2E: Task not active");
        require(!taskVotes[taskId][msg.sender].hasVoted, "W2E: Already voted");

        if (task.requiredStake > 0) {
            require(utilityToken.balanceOf(msg.sender) >= task.requiredStake, "W2E: Insufficient stake");
        }

        taskVotes[taskId][msg.sender] = VoteInfo({
            hasVoted: true,
            vote: approve,
            stakeAmount: task.requiredStake,
            voteTime: block.timestamp
        });

        if (approve) task.approvalVotes++;
        else task.rejectionVotes++;

        totalVoteCount++;
        emit VoteCast(taskId, msg.sender, approve, task.requiredStake);
    }

    function finalizeTask(uint256 taskId) public nonReentrant {
        W2ETask storage task = tasks[taskId];
        require(task.status == TaskStatus.Pending, "W2E: Task not pending");
        
        // Logical result (simplified)
        if (task.approvalVotes > task.rejectionVotes) {
            task.status = TaskStatus.Approved;
        } else {
            task.status = TaskStatus.Rejected;
        }
        
        lastTaskFinalizedTime = block.timestamp;
        activeTaskCount--;
        emit TaskFinalized(taskId, task.status, task.approvalVotes + task.rejectionVotes);
    }

    function recordInitialSale(uint256 amount) external onlyPandoraOracle {
        totalRaised += amount;
    }

    function depositProtocolRevenue(uint256 amount) external payable onlyPandoraOracle nonReentrant {
        require(msg.value >= amount, "W2E: Insufficient ETH");
        uint256 rewardPoolAllocation = (amount * phiFundSplitPct) / 100;
        rewardPool += rewardPoolAllocation;
        (bool success,) = protocolTreasuryAddress.call{value: amount - rewardPoolAllocation}("");
        require(success, "W2E: Treasury transfer failed");
        emit RevenueDeposited(msg.sender, amount, rewardPoolAllocation);
    }

    function releaseInitialCapital() external nonReentrant {
        require(msg.sender == creatorWallet, "W2E: Only creator");
        uint256 availablePayout = ((totalRaised * creatorPayoutPct) / 100) - creatorPaidOut;
        require(availablePayout > 0, "W2E: No funds");
        creatorPaidOut += availablePayout;
        (bool success,) = creatorWallet.call{value: availablePayout}("");
        require(success, "W2E: Payout failed");
        emit CreatorPayoutReleased(creatorWallet, availablePayout, creatorPaidOut);
    }

    function activateProtocol() external onlyOwner {
        protocolState = ProtocolState.LIVE;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
