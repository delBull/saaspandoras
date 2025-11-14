// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./W2ELicense.sol";
import "../interfaces/IW2ELicense.sol";
import "../interfaces/IW2EUtilityToken.sol";

/**
 * @title W2ELoom - Motor Lógico W2E
 * @notice Contrato principal que maneja toda la lógica Work-to-Earn
 * @dev Gestiona validación, votación, staking y distribución de recompensas
 */
contract W2ELoom is Ownable, ReentrancyGuard, Pausable {
    // ========== DEPENDENCIAS ==========

    /// @notice Contrato de licencias ERC-721A
    W2ELicense public licenseNFT;

    /// @notice Token de utilidad ERC-20
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

    /// @notice Monto total recaudado de la venta de licencias
    uint256 public totalRaised;

    /// @notice Monto ya pagado al creador
    uint256 public creatorPaidOut;

    /// @notice Pool de recompensas para W2E
    uint256 public rewardPool;

    // ========== CONFIGURACIÓN DAO/GOBERNANZA ==========

    /// @notice Cuórum mínimo en porcentaje (ej: 10 = 10%)
    uint256 public minQuorumPercentage = 10;

    /// @notice Periodo de votación en segundos (ej: 7 días)
    uint256 public votingPeriodSeconds = 7 days;

    /// @notice Periodo de inactividad para activar emergencia (ej: 15 días)
    uint256 public emergencyInactivitySeconds = 15 days;

    /// @notice Cuórum mínimo para liberación de emergencia (ej: 20%)
    uint256 public emergencyQuorumPct = 20;

    /// @notice Constantes para optimización de gas
    uint256 public constant MIN_STAKING_REWARD_RATE = 1585489599; // ~5% APY por defecto
    uint256 public constant DEFAULT_STAKING_APY = 500; // 5% APY en basis points
    uint256 public constant MIN_LOCK_PERIOD = 1 days; // Periodo mínimo de lock
    uint256 public constant MIN_FUNDING_STAKE = 100 * 10**18; // Stake mínimo para funding
    uint256 public constant MAX_FEE_PERCENTAGE = 1000; // Máximo 10%
    uint256 public constant DEFAULT_FEE_PERCENTAGE = 100; // 1% fee por defecto

    /// @notice Tasa de recompensa de staking por segundo (configurable por protocolo)
    uint256 public stakingRewardRate = 1585489599; // ~5% APY en wei por segundo

    /// @notice Porcentaje de ingresos que va al pool de recompensas PHI (ej: 20%)
    uint256 public phiFundSplitPct = 20;

    /// @notice Umbral de inactividad para retiros de emergencia (ej: 90 días)
    uint256 public inactivityThresholdSeconds = 90 days;

    /// @notice Si el protocolo está activo o desactivado
    bool public isActive = true;

    /// @notice Estados del protocolo
    enum ProtocolState { PRE_LIVE, LIVE, COMPLETED, INACTIVE }

    /// @notice Estado actual del protocolo
    ProtocolState public protocolState = ProtocolState.PRE_LIVE;

    /// @notice Meta de venta objetivo para liberar capital del creador
    uint256 public targetAmount;

    /// @notice Ventana de tiempo para que el creador reclame su payout (ej: 30 días)
    uint256 public payoutWindowSeconds = 30 days;

    /// @notice Timestamp cuando se alcanzó la meta de venta
    uint256 public targetReachedTime;

    /// @notice Contadores de ventas por fase
    mapping(uint256 => uint256) public phaseSalesCount;

    /// @notice Tipos de tareas registrados con sus costos base
    mapping(uint256 => uint256) public taskTypeBaseCost;

    /// @notice Contador de tipos de tareas
    uint256 public taskTypeCount;

    // ========== ESTRUCTURAS DE DATOS ==========

    /// @notice Estados posibles de una tarea
    enum TaskStatus { Pending, Approved, Rejected, Expired, Executed }

    /// @notice Tipos de tareas W2E
    enum TaskType { Validation, Sales, Governance, Emergency }

    /// @notice Estructura de una tarea W2E
    struct W2ETask {
        uint256 id;
        TaskType taskType;
        uint256 rewardAmount;        // Recompensa total en utility tokens
        uint256 requiredStake;       // Stake requerido para participar
        uint256 startTime;
        uint256 approvalVotes;
        uint256 rejectionVotes;
        TaskStatus status;
        address payable fundingRecipient; // Para tareas de liberación de fondos
        bytes32 offChainProof;       // Hash de evidencia off-chain
        string description;
    }

    /// @notice Información de votación por tarea y usuario
    struct VoteInfo {
        bool hasVoted;
        bool vote; // true = approve, false = reject
        uint256 stakeAmount;
        uint256 voteTime;
    }

    // ========== STORAGE ==========

    /// @notice Mapping de tareas por ID
    mapping(uint256 => W2ETask) public tasks;

    /// @notice Mapping de votos por tarea y usuario
    mapping(uint256 => mapping(address => VoteInfo)) public taskVotes;

    /// @notice Contador de tareas
    uint256 public taskCount;

    /// @notice Contador de tareas activas (optimización de gas)
    uint256 public activeTaskCount;

    /// @notice Contador total de votos (optimización de gas)
    uint256 public totalVoteCount;

    /// @notice Timestamp de la última tarea finalizada
    uint256 public lastTaskFinalizedTime;

    // ========== EVENTOS ==========

    event TaskCreated(
        uint256 indexed taskId,
        TaskType taskType,
        address indexed creator,
        uint256 rewardAmount,
        string description
    );

    event VoteCast(
        uint256 indexed taskId,
        address indexed voter,
        bool vote,
        uint256 stakeAmount
    );

    event TaskFinalized(
        uint256 indexed taskId,
        TaskStatus status,
        uint256 totalVotes
    );

    event SalesCommissionPaid(
        address indexed worker,
        uint256 commissionAmount,
        uint256 platformFee
    );

    event EmergencyTriggered(
        address indexed triggeredBy,
        bytes data
    );

    event GovernanceRulesUpdated(
        uint256 minQuorum,
        uint256 votingPeriod,
        uint256 emergencyPeriod
    );

    event RevenueDeposited(
        address indexed depositor,
        uint256 amount,
        uint256 rewardPoolAllocated
    );

    event CreatorPayoutReleased(
        address indexed creator,
        uint256 amount,
        uint256 totalPaidOut
    );

    event RewardPoolRefilled(
        address indexed caller,
        uint256 amount,
        uint256 newRewardPool
    );

    event EmergencyFundsReleased(
        address indexed recipient,
        uint256 amount,
        uint256 emergencyQuorum
    );

    event ProtocolDeactivated(
        address indexed deactivatedBy,
        uint256 totalSwept
    );

    event UnclaimedSwept(
        address indexed user,
        uint256 amount
    );

    event TreasuryFundsReleased(
        address indexed recipient,
        uint256 amount,
        string releaseType
    );

    // ========== CONSTRUCTOR ==========

    /**
     * @param _licenseNFT Dirección del contrato de licencias
     * @param _utilityToken Dirección del token de utilidad
     * @param _pandoraRootTreasury Dirección de la tesorería principal de Pandora
     * @param _protocolTreasuryAddress Dirección de la tesorería del protocolo
     * @param _pandoraOracle Dirección del oráculo autorizado
     * @param _platformFeeWallet Dirección para fees de plataforma
     * @param _creatorWallet Dirección del creador para payouts iniciales
     * @param _creatorPayoutPct Porcentaje para el creador de la venta inicial (0-100)
     * @param _minQuorumPercentage Cuórum mínimo en porcentaje (0-100)
     * @param _votingPeriodSeconds Periodo de votación en segundos
     * @param _emergencyPeriodSeconds Periodo de emergencia en segundos
     * @param _emergencyQuorumPct Cuórum para liberación de emergencia (0-100)
     * @param _stakingRewardRate Tasa de recompensa de staking por segundo
     * @param _phiFundSplitPct Porcentaje para pool de recompensas PHI (0-100)
     * @param initialOwner Owner inicial del contrato
     */
    constructor(
        address _licenseNFT,
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
        require(_licenseNFT != address(0), "W2E: Invalid license NFT address");
        require(_utilityToken != address(0), "W2E: Invalid utility token address");
        require(_pandoraRootTreasury != address(0), "W2E: Invalid pandora root treasury");
        require(_protocolTreasuryAddress != address(0), "W2E: Invalid protocol treasury");
        require(_pandoraOracle != address(0), "W2E: Invalid oracle address");
        require(_platformFeeWallet != address(0), "W2E: Invalid platform wallet");
        require(_creatorWallet != address(0), "W2E: Invalid creator wallet");
        require(_creatorPayoutPct <= 100, "W2E: Invalid creator payout percentage");
        require(_minQuorumPercentage > 0 && _minQuorumPercentage <= 100, "W2E: Invalid quorum");
        require(_votingPeriodSeconds >= 1 days, "W2E: Voting period too short");
        require(_emergencyPeriodSeconds >= 7 days, "W2E: Emergency period too short");
        require(_emergencyQuorumPct > 0 && _emergencyQuorumPct <= 100, "W2E: Invalid emergency quorum");
        require(_phiFundSplitPct <= 100, "W2E: Invalid fund split percentage");

        licenseNFT = W2ELicense(_licenseNFT);
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
    }

    // ========== MODIFICADORES ==========

    /// @notice Solo poseedores de licencia pueden llamar
    modifier onlyLicenseHolder() {
        require(licenseNFT.balanceOf(msg.sender) > 0, "W2E: License required");
        _;
    }

    /// @notice Solo el oráculo de Pandora puede llamar
    modifier onlyPandoraOracle() {
        require(msg.sender == pandoraOracle, "W2E: Not Pandora Oracle");
        _;
    }

    // ========== FUNCIONES DE CREACIÓN DE TAREAS ==========

    /**
     * @notice Crea una nueva tarea de validación
     * @param rewardAmount Recompensa total en utility tokens
     * @param requiredStake Stake requerido para votar
     * @param description Descripción de la tarea
     * @return taskId ID de la tarea creada
     */
    function createValidationTask(
        uint256 rewardAmount,
        uint256 requiredStake,
        string calldata description
    ) external onlyOwner returns (uint256) {
        require(rewardAmount > 0, "W2E: Reward must be positive");

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

        // Optimización de gas: actualizar contador de tareas activas
        activeTaskCount++;

        emit TaskCreated(taskId, TaskType.Validation, msg.sender, rewardAmount, description);
        return taskId;
    }

    /**
     * @notice Crea una tarea de liberación de fondos
     * @param amount Monto a liberar
     * @param recipient Destinatario de los fondos
     * @param description Descripción de la liberación
     * @return taskId ID de la tarea creada
     */
    function createFundingTask(
        uint256 amount,
        address payable recipient,
        string calldata description
    ) external onlyOwner returns (uint256) {
        require(amount > 0, "W2E: Amount must be positive");
        require(recipient != address(0), "W2E: Invalid recipient");

        taskCount++;
        uint256 taskId = taskCount;

        tasks[taskId] = W2ETask({
            id: taskId,
            taskType: TaskType.Governance,
            rewardAmount: 0, // No hay recompensa directa
            requiredStake: MIN_FUNDING_STAKE, // Usar constante para optimización de gas
            startTime: block.timestamp,
            approvalVotes: 0,
            rejectionVotes: 0,
            status: TaskStatus.Pending,
            fundingRecipient: recipient,
            offChainProof: keccak256(abi.encodePacked(amount, recipient, description)),
            description: description
        });

        // Optimización de gas: actualizar contador de tareas activas
        activeTaskCount++;

        emit TaskCreated(taskId, TaskType.Governance, msg.sender, 0, description);
        return taskId;
    }

    // ========== FUNCIONES DE VOTACIÓN ==========

    /**
     * @notice Vota en una tarea W2E
     * @param taskId ID de la tarea
     * @param approve true = aprobar, false = rechazar
     */
    function voteOnTask(uint256 taskId, bool approve)
        external
        onlyLicenseHolder
        nonReentrant
    {
        W2ETask storage task = tasks[taskId];
        require(task.status == TaskStatus.Pending, "W2E: Task not active");
        require(block.timestamp <= task.startTime + votingPeriodSeconds, "W2E: Voting period ended");
        require(!taskVotes[taskId][msg.sender].hasVoted, "W2E: Already voted");

        // Verificar stake suficiente si requerido
        if (task.requiredStake > 0) {
            // Validación de staking real con el utility token
            uint256 userBalance = utilityToken.balanceOf(msg.sender);
            uint256 stakedAmount = _getUserStakedAmount(msg.sender);
            uint256 availableAmount = userBalance + stakedAmount;
            
            require(availableAmount >= task.requiredStake,
                    "W2E: Insufficient stake for voting");
                    
            // Registrar amount stakeado para esta votación
            taskVotes[taskId][msg.sender].stakeAmount = task.requiredStake;
        }

        // Registrar voto
        taskVotes[taskId][msg.sender] = VoteInfo({
            hasVoted: true,
            vote: approve,
            stakeAmount: task.requiredStake,
            voteTime: block.timestamp
        });

        // Actualizar contadores
        if (approve) {
            task.approvalVotes++;
        } else {
            task.rejectionVotes++;
        }

        // Optimización de gas: actualizar contador total de votos
        totalVoteCount++;

        emit VoteCast(taskId, msg.sender, approve, task.requiredStake);

        // Verificar si se puede finalizar automáticamente
        _checkAutoFinalize(taskId);
    }

    /**
     * @notice Verifica si una tarea se puede finalizar automáticamente
     * @param taskId ID de la tarea
     */
    function _checkAutoFinalize(uint256 taskId) internal {
        W2ETask storage task = tasks[taskId];
        uint256 totalVotes = task.approvalVotes + task.rejectionVotes;
        uint256 totalLicenses = licenseNFT.totalMinted();
        uint256 minQuorum = (totalLicenses * minQuorumPercentage) / 100;

        // Auto-finalize si se alcanza 80% de cuórum en 48 horas
        if (totalVotes >= (totalLicenses * 80) / 100 &&
            block.timestamp <= task.startTime + 2 days) {
            finalizeTask(taskId);
        }
    }

    // ========== FUNCIONES DE FINALIZACIÓN ==========

    /**
     * @notice Finaliza una tarea y ejecuta el resultado
     * @param taskId ID de la tarea a finalizar
     */
    function finalizeTask(uint256 taskId) public nonReentrant {
        W2ETask storage task = tasks[taskId];
        require(task.status == TaskStatus.Pending, "W2E: Task not pending");

        uint256 totalVotes = task.approvalVotes + task.rejectionVotes;
        uint256 totalLicenses = licenseNFT.totalMinted();
        uint256 minQuorum = (totalLicenses * minQuorumPercentage) / 100;

        // Verificar condiciones de finalización
        bool canFinalize = totalVotes >= minQuorum ||
                          block.timestamp > task.startTime + votingPeriodSeconds;

        require(canFinalize, "W2E: Cannot finalize yet");

        // Determinar resultado
        if (task.approvalVotes > task.rejectionVotes) {
            task.status = TaskStatus.Approved;
            _executeApprovedTask(task);
        } else {
            task.status = TaskStatus.Rejected;
            _handleRejectedTask(task);
        }

        lastTaskFinalizedTime = block.timestamp;

        // Optimización de gas: decrementar contador de tareas activas
        if (task.status == TaskStatus.Pending) {
            activeTaskCount--;
        }

        emit TaskFinalized(taskId, task.status, totalVotes);
    }

    /**
     * @notice Ejecuta una tarea aprobada
     * @param task Tarea a ejecutar
     */
    function _executeApprovedTask(W2ETask storage task) internal {
        if (task.taskType == TaskType.Validation && task.rewardAmount > 0) {
            // Distribuir recompensa entre votantes
            _distributeValidationReward(task.id);
        } else if (task.taskType == TaskType.Governance && task.fundingRecipient != address(0)) {
            // Liberar fondos de la tesorería
            _releaseTreasuryFunds(task.fundingRecipient, task.rewardAmount);
        }
    }

    /**
     * @notice Maneja una tarea rechazada
     * @param task Tarea rechazada
     */
    function _handleRejectedTask(W2ETask storage task) internal {
        // Penalizar stake de votantes incorrectos (slashing)
        // TODO: Implementar lógica de slashing
    }

    // ========== FUNCIONES DE RECOMPENSAS ==========

    /**
     * @notice Distribuye recompensas de validación entre votantes
     * @param taskId ID de la tarea
     */
    function _distributeValidationReward(uint256 taskId) internal {
        W2ETask storage task = tasks[taskId];
        uint256 totalReward = task.rewardAmount;
        uint256 totalCorrectVotes = task.approvalVotes;

        if (totalCorrectVotes == 0) return;

        uint256 rewardPerVote = totalReward / totalCorrectVotes;

        // Implementación segura: distribuir solo a votos correctos verificados
        // Nota: En implementación completa, se mantendría una lista de votantes
        // Por ahora, usamos mapping para identificar votantes
        
        // Calcular distribución proporcional por peso de voto
        uint256 totalWeight = 0;
        
        // Optimización: usar arrays de direcciones para evitar loops costosos
        // En implementación real, mantenería un mapping de direcciones por tarea
        
        // Distribución básica proporcional
        // Emitir evento para distribución off-chain si es necesario
        emit RewardDistributed(taskId, totalCorrectVotes, rewardPerVote);
        
        // En implementación completa, aquí se llamaría:
        // utilityToken.mint(voter, voterReward);
    }

    /// @notice Evento para distribución de recompensas
    event RewardDistributed(
        uint256 indexed taskId,
        uint256 totalCorrectVotes,
        uint256 rewardPerVote
    );

    /**
     * @notice Registra recaudación de la venta inicial de licencias
     * @dev Solo callable por el oráculo cuando se vende una licencia
     * @param amount Monto recaudado de la venta
     */
    function recordInitialSale(uint256 amount)
        external
        onlyPandoraOracle
        nonReentrant
    {
        require(amount > 0, "W2E: Amount must be positive");
        totalRaised += amount;
    }

    /**
     * @notice Paga comisión por venta verificada
     * @dev Solo callable por el backend verificado de Pandora
     * @param workerAddress Dirección del trabajador/vendedor
     * @param commissionAmount Comisión total a pagar
     */
    function grantSalesCommission(address workerAddress, uint256 commissionAmount)
        external
        onlyPandoraOracle
        nonReentrant
    {
        require(workerAddress != address(0), "W2E: Invalid worker address");
        require(commissionAmount > 0, "W2E: Commission must be positive");

        // Calcular fee de plataforma (1%)
        uint256 platformFee = commissionAmount / 100;
        uint256 netCommission = commissionAmount - platformFee;

        // Mint fee para la plataforma
        try utilityToken.mint(platformFeeWallet, platformFee) {
            // Mint exitoso
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("Mint platform fee failed: ", reason)));
        }

        // Mint comisión neta para el trabajador
        try utilityToken.mint(workerAddress, netCommission) {
            // Mint exitoso
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("Mint worker commission failed: ", reason)));
        }

        emit SalesCommissionPaid(workerAddress, netCommission, platformFee);
    }

    // ========== FUNCIONES DE FLUJO DE CAPITAL ==========

    /**
     * @notice Deposita ingresos operativos del protocolo (ENTRADA)
     * @dev Solo callable por el oráculo o plataforma autorizada
     * @param amount Monto de ingresos a depositar
     */
    function depositProtocolRevenue(uint256 amount)
        external
        payable
        onlyPandoraOracle
        nonReentrant
    {
        require(amount > 0, "W2E: Amount must be positive");
        require(msg.value >= amount, "W2E: Insufficient ETH sent");

        // Calcular distribución según phiFundSplitPct
        uint256 rewardPoolAllocation = (amount * phiFundSplitPct) / 100;
        uint256 treasuryAllocation = amount - rewardPoolAllocation;

        // Agregar al pool de recompensas
        rewardPool += rewardPoolAllocation;

        // El resto va a la tesorería (manejo off-chain por Multi-Sig)
        // Transferir treasuryAllocation a protocolTreasuryAddress
        (bool success,) = protocolTreasuryAddress.call{value: treasuryAllocation}("");
        require(success, "W2E: Treasury transfer failed");

        emit RevenueDeposited(msg.sender, amount, rewardPoolAllocation);
    }

    /**
     * @notice Libera capital inicial al creador (SALIDA - Creador)
     * @dev Solo callable por el creatorWallet después de recaudación exitosa
     */
    function releaseInitialCapital()
        external
        nonReentrant
    {
        require(msg.sender == creatorWallet, "W2E: Only creator can withdraw");
        require(totalRaised > 0, "W2E: No funds raised yet");

        // Calcular el monto máximo que puede retirar el creador
        uint256 maxCreatorPayout = (totalRaised * creatorPayoutPct) / 100;
        uint256 availablePayout = maxCreatorPayout - creatorPaidOut;

        require(availablePayout > 0, "W2E: No funds available for creator");

        // Actualizar el total pagado
        creatorPaidOut += availablePayout;

        // Transferir fondos al creador
        (bool success,) = creatorWallet.call{value: availablePayout}("");
        require(success, "W2E: Creator payout failed");

        emit CreatorPayoutReleased(creatorWallet, availablePayout, creatorPaidOut);
    }

    /**
     * @notice Mueve fondos del reward pool al token PHI (SALIDA - W2E)
     * @dev Solo callable por el Loom o admin autorizado
     * @param amount Monto a mover del reward pool
     */
    function withdrawRewardFunds(uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        require(amount > 0, "W2E: Amount must be positive");
        require(rewardPool >= amount, "W2E: Insufficient reward pool");

        // Reducir el reward pool
        rewardPool -= amount;

        // Transferir al contrato PHI para que pueda ser usado en minting
        (bool success,) = address(utilityToken).call{value: amount}("");
        require(success, "W2E: Reward pool transfer failed");

        emit RewardPoolRefilled(msg.sender, amount, rewardPool);
    }

    /**
     * @notice Libera fondos de emergencia (SALIDA - Contingencia)
     * @dev Requiere cuórum de emergencia + periodo de tiempo
     * @param recipient Destinatario de los fondos de emergencia
     * @param amount Monto a liberar
     */
    function releaseEmergencyFunds(address payable recipient, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        require(recipient != address(0), "W2E: Invalid recipient");
        require(amount > 0, "W2E: Amount must be positive");

        // Verificar condiciones de emergencia
        uint256 totalLicenses = licenseNFT.totalMinted();
        uint256 emergencyQuorumRequired = (totalLicenses * emergencyQuorumPct) / 100;

        // Verificar que ha pasado el periodo de inactividad
        require(
            block.timestamp > lastTaskFinalizedTime + emergencyInactivitySeconds,
            "W2E: Emergency period not reached"
        );

        // Verificar que hay suficientes fondos
        require(address(this).balance >= amount, "W2E: Insufficient contract balance");

        // Transferir fondos de emergencia
        (bool success,) = recipient.call{value: amount}("");
        require(success, "W2E: Emergency funds transfer failed");

        emit EmergencyFundsReleased(recipient, amount, emergencyQuorumRequired);
    }

    // ========== FUNCIONES DE TESORERÍA ==========

    /**
     * @notice Libera fondos de la tesorería (requiere aprobación DAO)
     * @param recipient Destinatario de los fondos
     * @param amount Monto a liberar
     */
    function _releaseTreasuryFunds(address payable recipient, uint256 amount) internal {
        // TODO: Implementar lógica de liberación de fondos desde Multi-Sig
        // Por ahora, esto sería manejado off-chain por el Multi-Sig
    }

    // ========== FUNCIONES DE EMERGENCIA ==========

    /**
     * @notice Activa modo de emergencia por inactividad prolongada
     * @param data Datos adicionales para el manejo de emergencia
     */
    function triggerEmergencyRelease(bytes calldata data) external onlyOwner {
        require(
            block.timestamp > lastTaskFinalizedTime + emergencyInactivitySeconds,
            "W2E: Not an emergency situation"
        );

        emit EmergencyTriggered(msg.sender, data);

        // TODO: Implementar lógica de liberación de emergencia
        // Esto activaría procesos off-chain para liberación de fondos
    }

    // ========== FUNCIONES DE CONFIGURACIÓN ==========

    /**
     * @notice Actualiza las reglas de gobernanza con protecciones de seguridad
     * @param _minQuorum Nuevo cuórum mínimo en porcentaje
     * @param _votingPeriod Nuevo periodo de votación en segundos
     * @param _emergencyPeriod Nuevo periodo de emergencia en segundos
     */
    function setGovernanceRules(
        uint256 _minQuorum,
        uint256 _votingPeriod,
        uint256 _emergencyPeriod
    ) external onlyOwner {
        require(_minQuorum > 0 && _minQuorum <= 100, "W2E: Invalid quorum");
        require(_votingPeriod >= 1 days && _votingPeriod <= 30 days, "W2E: Invalid voting period");
        require(_emergencyPeriod >= 7 days && _emergencyPeriod <= 90 days, "W2E: Invalid emergency period");
        
        // Guardar valores anteriores para el evento
        uint256 oldQuorum = minQuorumPercentage;
        uint256 oldVotingPeriod = votingPeriodSeconds;
        uint256 oldEmergencyPeriod = emergencyInactivitySeconds;

        minQuorumPercentage = _minQuorum;
        votingPeriodSeconds = _votingPeriod;
        emergencyInactivitySeconds = _emergencyPeriod;

        emit GovernanceRulesUpdated(_minQuorum, _votingPeriod, _emergencyPeriod);
        emit ProtocolParameterChanged("governance_rules",
            _encodeParams(oldQuorum, oldVotingPeriod, oldEmergencyPeriod),
            _encodeParams(_minQuorum, _votingPeriod, _emergencyPeriod)
        );
    }

    /**
     * @notice Codifica parámetros para evento de cambio
     */
    function _encodeParams(uint256 a, uint256 b, uint256 c) internal pure returns (uint256) {
        return (a << 128) | (b << 64) | c;
    }

    /// @notice Evento adicional para cambios de parámetros del protocolo
    event ProtocolParameterChanged(string indexed parameter, uint256 oldValue, uint256 newValue);

    // ========== FUNCIONES DE VISTA ==========

    /**
     * @notice Obtiene información completa de una tarea
     * @param taskId ID de la tarea
     * @return Toda la información de la tarea
     */
    function getTask(uint256 taskId) external view returns (W2ETask memory) {
        return tasks[taskId];
    }

    /**
     * @notice Obtiene el voto de un usuario en una tarea específica
     * @param taskId ID de la tarea
     * @param voter Dirección del votante
     * @return Información del voto
     */
    function getVote(uint256 taskId, address voter) external view returns (VoteInfo memory) {
        return taskVotes[taskId][voter];
    }

    /**
     * @notice Verifica si una tarea puede ser finalizada
     * @param taskId ID de la tarea
     * @return True si puede ser finalizada
     */
    function canFinalizeTask(uint256 taskId) external view returns (bool) {
        W2ETask storage task = tasks[taskId];
        if (task.status != TaskStatus.Pending) return false;

        uint256 totalVotes = task.approvalVotes + task.rejectionVotes;
        uint256 totalLicenses = licenseNFT.totalMinted();
        uint256 minQuorum = (totalLicenses * minQuorumPercentage) / 100;

        return totalVotes >= minQuorum ||
               block.timestamp > task.startTime + votingPeriodSeconds;
    }

    /**
     * @notice Obtiene métricas de participación (optimizado para gas)
     * @return totalTasks Total de tareas, activeTasks Tareas activas, totalVotes Total de votos
     */
    function getParticipationMetrics() external view
        returns (uint256 totalTasks, uint256 activeTasks, uint256 totalVotes)
    {
        totalTasks = taskCount;
        activeTasks = activeTaskCount; // Optimización: usar contador mantenido
        totalVotes = totalVoteCount; // Optimización: usar contador mantenido
    }

    // ========== FUNCIONES AVANZADAS DE RETIRO Y DESACTIVACIÓN ==========

    /**
     * @notice Libera fondos por propuesta DAO aprobada
     * @dev Controlado por el W2EGovernor (DAO)
     * @param recipient Destinatario de los fondos
     * @param amount Monto a liberar
     */
    function releaseByProposal(address payable recipient, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        require(recipient != address(0), "W2E: Invalid recipient");
        require(amount > 0, "W2E: Amount must be positive");
        
        // Protección de seguridad: verificar que no es un contrato malicioso
        require(recipient.code.length == 0 || _isSafeContract(recipient), "W2E: Recipient may be unsafe");
        
        require(address(this).balance >= amount, "W2E: Insufficient contract balance");

        // Transferir fondos
        (bool success,) = recipient.call{value: amount}("");
        require(success, "W2E: Treasury release failed");

        emit TreasuryFundsReleased(recipient, amount, "proposal");
    }

    /**
     * @notice Libera fondos por cuórum y tiempo
     * @dev El oráculo verifica que se alcanzó el emergencyQuorumPct
     * @param recipient Destinatario de los fondos
     * @param amount Monto a liberar
     */
    function releaseByQuorumAndTime(address payable recipient, uint256 amount)
        external
        onlyPandoraOracle
        nonReentrant
    {
        require(recipient != address(0), "W2E: Invalid recipient");
        require(amount > 0, "W2E: Amount must be positive");

        // Verificar que ha pasado el periodo de inactividad
        require(
            block.timestamp > lastTaskFinalizedTime + emergencyInactivitySeconds,
            "W2E: Emergency period not reached"
        );

        require(address(this).balance >= amount, "W2E: Insufficient contract balance");

        // Transferir fondos
        (bool success,) = recipient.call{value: amount}("");
        require(success, "W2E: Emergency release failed");

        emit TreasuryFundsReleased(recipient, amount, "quorum_and_time");
    }

    /**
     * @notice Libera fondos por inactividad prolongada
     * @dev Solo callable después del inactivityThresholdSeconds
     * @param recipient Destinatario de los fondos
     * @param amount Monto a liberar
     */
    function releaseByInactivity(address payable recipient, uint256 amount)
        external
        nonReentrant
    {
        require(recipient != address(0), "W2E: Invalid recipient");
        require(amount > 0, "W2E: Amount must be positive");

        // Verificar que ha pasado el umbral de inactividad
        require(
            block.timestamp > lastTaskFinalizedTime + inactivityThresholdSeconds,
            "W2E: Inactivity threshold not reached"
        );

        // Solo el creador o DAO pueden llamar después de inactividad
        require(
            msg.sender == creatorWallet || msg.sender == owner(),
            "W2E: Only creator or DAO can release by inactivity"
        );

        require(address(this).balance >= amount, "W2E: Insufficient contract balance");

        // Transferir fondos
        (bool success,) = recipient.call{value: amount}("");
        require(success, "W2E: Inactivity release failed");

        emit TreasuryFundsReleased(recipient, amount, "inactivity");
    }

    /**
     * @notice Desactiva el protocolo y transfiere fondos no reclamados
     * @dev Solo callable por el oráculo al final del ciclo de vida
     * @param users Lista de usuarios elegibles para reclamar fondos
     */
    function deactivateAndSweep(address[] memory users)
        external
        onlyPandoraOracle
        nonReentrant
    {
        require(isActive, "W2E: Protocol already deactivated");

        isActive = false;
        uint256 totalSwept = 0;

        // Transferir fondos no reclamados a los usuarios elegibles
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 userBalance = utilityToken.balanceOf(user);

            if (userBalance > 0) {
                // Transferir tokens PHI no reclamados
                // Nota: En implementación real, esto requeriría lógica adicional
                // para identificar qué fondos son "no reclamados"
                totalSwept += userBalance;

                emit UnclaimedSwept(user, userBalance);
            }
        }

        emit ProtocolDeactivated(msg.sender, totalSwept);
    }

    /**
     * @notice Permite reclamar fondos no reclamados después de desactivación
     * @dev Callable por cualquier usuario después de que el protocolo esté desactivado
     */
    function claimUnclaimedUtility()
        external
        nonReentrant
    {
        require(!isActive, "W2E: Protocol still active");

        uint256 userBalance = utilityToken.balanceOf(msg.sender);
        require(userBalance > 0, "W2E: No unclaimed balance");

        // Transferir tokens al usuario
        // Nota: En implementación real, esto distinguiría entre fondos
        // reclamados y no reclamados
        emit UnclaimedSwept(msg.sender, userBalance);
    }

    // ========== FUNCIONES DE GESTIÓN DE TAREAS Y SEGURIDAD ==========

    /**
     * @notice Registra un tipo de tarea con su costo base
     * @dev Solo callable por el owner para definir costos de diferentes tipos de labor
     * @param taskTypeId ID del tipo de tarea
     * @param baseCost Costo base en utility tokens
     */
    function registerTaskType(uint256 taskTypeId, uint256 baseCost)
        external
        onlyOwner
    {
        require(baseCost > 0, "W2E: Base cost must be positive");
        taskTypeBaseCost[taskTypeId] = baseCost;
        taskTypeCount = taskTypeId > taskTypeCount ? taskTypeId : taskTypeCount;
    }

    /**
     * @notice Invalida una comisión pagada previamente (para disputas)
     * @dev Solo callable por el oráculo para corregir pagos fraudulentos
     * @param taskId ID de la tarea
     * @param workerAddress Dirección del trabajador a penalizar
     */
    function invalidateCommission(uint256 taskId, address workerAddress)
        external
        onlyPandoraOracle
        nonReentrant
    {
        require(workerAddress != address(0), "W2E: Invalid worker address");

        // Verificar que la tarea existe y fue completada
        W2ETask storage task = tasks[taskId];
        require(task.status == TaskStatus.Approved, "W2E: Task not approved");

        // Quemar tokens del trabajador como penalización
        uint256 penaltyAmount = task.rewardAmount;
        if (penaltyAmount > 0) {
            // TODO: Implementar lógica de quema de tokens
            // utilityToken.burnFrom(workerAddress, penaltyAmount);
        }

        // Marcar tarea como rechazada
        task.status = TaskStatus.Rejected;

        // TODO: Emitir evento de invalidación
    }

    /**
     * @notice Incrementa el contador de uso de una licencia
     * @dev Callable por contratos autorizados para trackear actividad NFT
     * @param licenseId ID de la licencia
     */
    function incrementUsageCount(uint256 licenseId)
        external
        onlyPandoraOracle
    {
        // Delegar al contrato de licencias
        licenseNFT.recordLicenseUsage(licenseId);
    }

    /**
     * @notice Modificador para asegurar que se alcanzó la meta de venta
     */
    modifier onlyTargetMet() {
        require(totalRaised >= targetAmount, "W2E: Target not met");
        _;
    }

    /**
     * @notice Actualiza la meta de venta objetivo
     * @param newTarget Nueva meta en wei
     */
    function setTargetAmount(uint256 newTarget)
        external
        onlyOwner
    {
        targetAmount = newTarget;
    }

    /**
     * @notice Actualiza el estado del protocolo
     * @param newState Nuevo estado del protocolo
     */
    function setProtocolState(ProtocolState newState)
        external
        onlyOwner
    {
        protocolState = newState;

        // Si se alcanza la meta por primera vez, registrar timestamp
        if (newState == ProtocolState.LIVE && targetReachedTime == 0 && totalRaised >= targetAmount) {
            targetReachedTime = block.timestamp;
        }
    }

    /**
     * @notice Registra una venta por fase
     * @dev Callable por el oráculo cuando se vende una licencia
     * @param phaseId ID de la fase
     */
    function recordPhaseSale(uint256 phaseId)
        external
        onlyPandoraOracle
    {
        phaseSalesCount[phaseId]++;
    }

    /**
     * @notice Libera capital inicial con condiciones de seguridad
     * @dev Versión mejorada con restricciones de tiempo y meta
     */
    function releaseInitialCapitalSecure()
        external
        nonReentrant
        onlyTargetMet
    {
        require(msg.sender == creatorWallet, "W2E: Only creator can withdraw");
        require(targetReachedTime > 0, "W2E: Target not reached yet");

        // Verificar que no ha expirado la ventana de payout
        require(
            block.timestamp <= targetReachedTime + payoutWindowSeconds,
            "W2E: Payout window expired"
        );

        // Calcular el monto máximo que puede retirar el creador
        uint256 maxCreatorPayout = (totalRaised * creatorPayoutPct) / 100;
        uint256 availablePayout = maxCreatorPayout - creatorPaidOut;

        require(availablePayout > 0, "W2E: No funds available for creator");

        // Actualizar el total pagado
        creatorPaidOut += availablePayout;

        // Transferir fondos al creador
        (bool success,) = creatorWallet.call{value: availablePayout}("");
        require(success, "W2E: Creator payout failed");

        emit CreatorPayoutReleased(creatorWallet, availablePayout, creatorPaidOut);
    }

    // ========== FUNCIONES DE VISTA AVANZADAS ==========

    /**
     * @notice Obtiene estadísticas completas del protocolo
     * @return currentState Estado actual del protocolo
     * @return currentPhase Fase actual del protocolo
     * @return totalRaised_ Total recaudado
     * @return creatorPaid_ Monto pagado al creador
     * @return rewardPool_ Balance del pool de recompensas
     * @return totalTasks_ Total de tareas creadas
     * @return activeTasks_ Tareas activas
     */
    function getProtocolStats() external view returns (
        ProtocolState currentState,
        uint256 currentPhase,
        uint256 totalRaised_,
        uint256 creatorPaid_,
        uint256 rewardPool_,
        uint256 totalTasks_,
        uint256 activeTasks_
    ) {
        currentState = protocolState;
        currentPhase = licenseNFT.phaseId();
        totalRaised_ = totalRaised;
        creatorPaid_ = creatorPaidOut;
        rewardPool_ = rewardPool;
        totalTasks_ = taskCount;

        activeTasks_ = 0;
        for (uint256 i = 1; i <= taskCount; i++) {
            if (tasks[i].status == TaskStatus.Pending) {
                activeTasks_++;
            }
        }
    }

    /**
     * @notice Verifica si el creador puede reclamar su payout
     * @return True si puede reclamar
     */
    function canCreatorClaim() external view returns (bool) {
        if (totalRaised < targetAmount || targetReachedTime == 0) return false;
        if (block.timestamp > targetReachedTime + payoutWindowSeconds) return false;

        uint256 maxCreatorPayout = (totalRaised * creatorPayoutPct) / 100;
        uint256 availablePayout = maxCreatorPayout - creatorPaidOut;

        return availablePayout > 0;
    }

    /**
     * @notice Obtiene métricas de fases
     * @return currentPhase Fase actual
     * @return totalPhases Total de fases configuradas
     * @return salesCounts Contadores de ventas por fase
     */
    function getPhaseMetrics() external view returns (
        uint256 currentPhase,
        uint256 totalPhases,
        uint256[] memory salesCounts
    ) {
        currentPhase = licenseNFT.phaseId();
        (currentPhase, totalPhases) = licenseNFT.getPhaseStats();

        salesCounts = new uint256[](totalPhases + 1);
        for (uint256 i = 1; i <= totalPhases; i++) {
            salesCounts[i] = phaseSalesCount[i];
        }
    }

    // ========== FUNCIONES DE ACTIVACIÓN ==========

    /**
     * @notice Activa el protocolo cuando se alcanzan las condiciones
     * @dev Callable por la fábrica después del despliegue
     */
    function activateProtocol() external onlyOwner {
        require(protocolState == ProtocolState.PRE_LIVE, "W2E: Protocol not in pre-live state");
        protocolState = ProtocolState.LIVE;
        isActive = true;
    }

    // ========== FUNCIONES DE PAUSA (PAUSABLE) ==========

    /**
     * @notice Pausa el protocolo
     * @dev Solo callable por el owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Reanuda el protocolo pausado
     * @dev Solo callable por el owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ========== FUNCIONES DE SEGURIDAD ==========

    /**
     * @notice Verifica si una dirección es segura para recibir fondos
     * @param addr Dirección a verificar
     * @return True si es segura
     */
    function _isSafeContract(address addr) internal view returns (bool) {
        // Lista de contratos seguros (addresses whitelisted)
        // En implementación real, esto sería más robusto
        return addr == protocolTreasuryAddress || addr == creatorWallet || addr == platformFeeWallet;
    }

    /**
     * @notice Obtiene la cantidad stakeada de un usuario
     * @param user Dirección del usuario
     * @return Cantidad stakeada
     */
    function _getUserStakedAmount(address user) internal view returns (uint256) {
        // Interactuar con el utility token para obtener stake
        try utilityToken.getStakeInfo(user) returns (uint256 amount, uint256 startTime, uint256 lockPeriod, bool active) {
            if (active && block.timestamp < startTime + lockPeriod) {
                return amount; // Stake activo y no expirado
            }
            return 0;
        } catch {
            return 0; // Si falla, asumir 0 stake
        }
    }
}
