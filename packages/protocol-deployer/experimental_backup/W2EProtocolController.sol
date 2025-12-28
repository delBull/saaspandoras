// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IW2ELicense.sol";
import "../interfaces/IW2EUtilityToken.sol";
import "../treasury/PandoraRootTreasury.sol";
import "../treasury/PBOXProtocolTreasury.sol";
import "./W2ETaskManager.sol";
import "./W2ERewardDistributor.sol";
import "./W2EEventLogger.sol";

/**
 * @title W2EProtocolController - Controlador Principal Modular W2E
 * @notice Contrato principal que orquesta todos los módulos especializados
 * @dev Arquitectura modularizada que reemplaza el monolítico W2ELoom
 */
contract W2EProtocolController is Ownable, ReentrancyGuard {
    // ========== CONTRATOS MODULARES ==========
    
    /// @notice Contrato de licencias
    IW2ELicense public licenseNFT;
    
    /// @notice Contrato de token de utilidad
    IW2EUtilityToken public utilityToken;
    
    /// @notice Gestor de tareas (módulo especializado)
    IW2ETaskManager public taskManager;
    
    /// @notice Distribuidor de recompensas (módulo especializado)
    IW2ERewardDistributor public rewardDistributor;
    
    /// @notice Sistema de eventos centralizado
    W2EEventLogger public eventLogger;
    
    /// @notice Tesorería principal de Pandora
    PandoraRootTreasury public pandoraRootTreasury;
    
    /// @notice Tesorería de protocolo
    PBOXProtocolTreasury public protocolTreasury;
    
    /// @notice Contrato de gobernanza DAO
    address public governanceContract;
    
    // ========== CONFIGURACIÓN DEL PROTOCOLO ==========
    
    /// @notice Estados del protocolo
    enum ProtocolState { PRE_LIVE, LIVE, MAINTENANCE, SHUTDOWN }
    
    /// @notice Estado actual del protocolo
    ProtocolState public protocolState = ProtocolState.PRE_LIVE;
    
    /// @notice Dirección del oráculo de Pandora
    address public pandoraOracle;
    
    /// @notice Dirección de la plataforma para fees
    address public platformFeeWallet;
    
    /// @notice Dirección del creador para payouts
    address public creatorWallet;
    
    /// @notice Si el protocolo está activo
    bool public isActive = true;
    
    // ========== PARÁMETROS DE RECAUDACIÓN ==========
    
    /// @notice Meta de venta objetivo
    uint256 public targetAmount;
    
    /// @notice Monto total recaudado
    uint256 public totalRaised;
    
    /// @notice Monto ya pagado al creador
    uint256 public creatorPaidOut;
    
    /// @notice Porcentaje para el creador de la venta inicial
    uint256 public creatorPayoutPct;
    
    /// @notice Timestamp cuando se alcanzó la meta
    uint256 public targetReachedTime;
    
    /// @notice Ventana de tiempo para que el creador reclame (30 días)
    uint256 public payoutWindowSeconds = 30 days;
    
    // ========== CONTADORES Y ESTADÍSTICAS ==========
    
    /// @notice Contador de fases del protocolo
    uint256 public protocolPhase;
    
    /// @notice Contador de ventas por fase
    mapping(uint256 => uint256) public phaseSalesCount;
    
    /// @notice Contador de tareas completadas
    uint256 public completedTaskCount;
    
    /// @notice Contador de recompensas distribuidas
    uint256 public rewardDistributionCount;
    
    // ========== EVENTOS ==========
    
    event ProtocolModuleUpdated(string moduleName, address newAddress);
    event ProtocolStateChanged(ProtocolState oldState, ProtocolState newState);
    event RevenueRecorded(address indexed source, uint256 amount);
    event CreatorPayoutReleased(address indexed creator, uint256 amount, uint256 totalPaidOut);
    event ProtocolPhaseAdvanced(uint256 oldPhase, uint256 newPhase);
    event EmergencyShutdown(string reason);
    event MaintenanceModeActivated(string reason);
    
    // ========== CONSTRUCTOR ==========
    
    constructor(
        address _licenseNFT,
        address _utilityToken,
        address _taskManager,
        address _rewardDistributor,
        address _eventLogger,
        address _pandoraRootTreasury,
        address _protocolTreasury,
        address _pandoraOracle,
        address _platformFeeWallet,
        address _creatorWallet,
        uint256 _targetAmount,
        uint256 _creatorPayoutPct,
        address initialOwner
    ) Ownable() {
        require(_licenseNFT != address(0), "W2E: Invalid license NFT");
        require(_utilityToken != address(0), "W2E: Invalid utility token");
        require(_taskManager != address(0), "W2E: Invalid task manager");
        require(_rewardDistributor != address(0), "W2E: Invalid reward distributor");
        require(_eventLogger != address(0), "W2E: Invalid event logger");
        require(_pandoraRootTreasury != address(0), "W2E: Invalid pandora treasury");
        require(_protocolTreasury != address(0), "W2E: Invalid protocol treasury");
        require(_pandoraOracle != address(0), "W2E: Invalid pandora oracle");
        require(_platformFeeWallet != address(0), "W2E: Invalid platform wallet");
        require(_creatorWallet != address(0), "W2E: Invalid creator wallet");
        require(_creatorPayoutPct <= 100, "W2E: Invalid creator payout percentage");
        require(_targetAmount > 0, "W2E: Invalid target amount");
        
        licenseNFT = IW2ELicense(_licenseNFT);
        utilityToken = IW2EUtilityToken(_utilityToken);
        taskManager = IW2ETaskManager(_taskManager);
        rewardDistributor = IW2ERewardDistributor(_rewardDistributor);
        eventLogger = W2EEventLogger(_eventLogger);
        pandoraRootTreasury = PandoraRootTreasury(_pandoraRootTreasury);
        protocolTreasury = PBOXProtocolTreasury(_protocolTreasury);
        pandoraOracle = _pandoraOracle;
        platformFeeWallet = _platformFeeWallet;
        creatorWallet = _creatorWallet;
        targetAmount = _targetAmount;
        creatorPayoutPct = _creatorPayoutPct;
        
        protocolPhase = 1;
        
        // Autorizar contratos modulares en el EventLogger
        eventLogger.setLoggerAuthorization(_taskManager, true);
        eventLogger.setLoggerAuthorization(_rewardDistributor, true);
        eventLogger.setLoggerAuthorization(address(this), true);
    }
    
    // ========== MODIFICADORES ==========
    
    modifier onlyPandoraOracle() {
        require(msg.sender == pandoraOracle, "W2E: Not Pandora Oracle");
        _;
    }
    
    modifier onlyActiveProtocol() {
        require(isActive && protocolState == ProtocolState.LIVE, "W2E: Protocol not active");
        _;
    }
    
    modifier onlyGovernance() {
        require(msg.sender == governanceContract || msg.sender == owner(), "W2E: Not governance");
        _;
    }
    
    // ========== FUNCIONES DE GESTIÓN DE MÓDULOS ==========
    
    /**
     * @notice Actualiza dirección de un módulo
     */
    function updateModule(string calldata moduleName, address newAddress) external onlyGovernance {
        require(newAddress != address(0), "W2E: Invalid address");
        
        if (keccak256(bytes(moduleName)) == keccak256("taskManager")) {
            taskManager = IW2ETaskManager(newAddress);
            eventLogger.setLoggerAuthorization(newAddress, true);
        } else if (keccak256(bytes(moduleName)) == keccak256("rewardDistributor")) {
            rewardDistributor = IW2ERewardDistributor(newAddress);
            eventLogger.setLoggerAuthorization(newAddress, true);
        } else if (keccak256(bytes(moduleName)) == keccak256("eventLogger")) {
            eventLogger = W2EEventLogger(newAddress);
        } else if (keccak256(bytes(moduleName)) == keccak256("governance")) {
            governanceContract = newAddress;
        } else {
            revert("W2E: Unknown module");
        }
        
        emit ProtocolModuleUpdated(moduleName, newAddress);
        _logEvent("MODULE_UPDATED", abi.encode(moduleName, newAddress));
    }
    
    /**
     * @notice Cambia estado del protocolo
     */
    function setProtocolState(ProtocolState newState) external onlyGovernance {
        ProtocolState oldState = protocolState;
        protocolState = newState;
        
        if (newState == ProtocolState.MAINTENANCE) {
            isActive = false;
            emit MaintenanceModeActivated("Manual maintenance activation");
        } else if (newState == ProtocolState.SHUTDOWN) {
            isActive = false;
            emit EmergencyShutdown("Protocol shutdown");
        } else if (newState == ProtocolState.LIVE) {
            isActive = true;
        }
        
        emit ProtocolStateChanged(oldState, newState);
        _logEvent("PROTOCOL_STATE_CHANGED", abi.encode(oldState, newState));
    }
    
    // ========== FUNCIONES DE RECAUDACIÓN Y DISTRIBUCIÓN ==========
    
    /**
     * @notice Registra recaudación de la venta inicial de licencias
     */
    function recordInitialSale(uint256 amount) external onlyPandoraOracle {
        require(amount > 0, "W2E: Amount must be positive");
        
        totalRaised += amount;
        
        // Si se alcanza la meta por primera vez, registrar timestamp
        if (targetReachedTime == 0 && totalRaised >= targetAmount) {
            targetReachedTime = block.timestamp;
            protocolState = ProtocolState.LIVE;
            emit ProtocolStateChanged(ProtocolState.PRE_LIVE, ProtocolState.LIVE);
        }
        
        emit RevenueRecorded(msg.sender, amount);
        _logEvent("INITIAL_SALE_RECORDED", abi.encode(amount, totalRaised));
    }
    
    /**
     * @notice Libera capital inicial al creador (versión segura)
     */
    function releaseInitialCapitalSecure() external onlyActiveProtocol nonReentrant {
        require(msg.sender == creatorWallet, "W2E: Only creator can withdraw");
        require(targetReachedTime > 0, "W2E: Target not reached yet");
        require(
            block.timestamp <= targetReachedTime + payoutWindowSeconds,
            "W2E: Payout window expired"
        );
        
        uint256 maxCreatorPayout = (totalRaised * creatorPayoutPct) / 100;
        uint256 availablePayout = maxCreatorPayout - creatorPaidOut;
        require(availablePayout > 0, "W2E: No funds available for creator");
        
        creatorPaidOut += availablePayout;
        
        // Transferir fondos
        (bool success,) = pandoraRootTreasury.transferToOperationalOrReserve(creatorWallet, availablePayout);
        require(success, "W2E: Creator payout failed");
        
        emit CreatorPayoutReleased(creatorWallet, availablePayout, creatorPaidOut);
        _logEvent("CREATOR_PAYOUT_RELEASED", abi.encode(creatorWallet, availablePayout, creatorPaidOut));
    }
    
    /**
     * @notice Registra venta por fase
     */
    function recordPhaseSale(uint256 phaseId) external onlyPandoraOracle {
        phaseSalesCount[phaseId]++;
        
        _logEvent("PHASE_SALE_RECORDED", abi.encode(phaseId, phaseSalesCount[phaseId]));
    }
    
    // ========== FUNCIONES DE GESTIÓN DE TAREAS ==========
    
    /**
     * @notice Crea tarea de validación (delegada al TaskManager)
     */
    function createValidationTask(
        uint256 rewardAmount,
        uint256 requiredStake,
        string calldata description,
        uint8 priority,
        uint16 complexityScore
    ) external onlyActiveProtocol onlyGovernance returns (uint256) {
        return taskManager.createValidationTask(rewardAmount, requiredStake, description, priority, complexityScore);
    }
    
    /**
     * @notice Crea tarea de liberación de fondos
     */
    function createFundingTask(
        uint256 amount,
        address payable recipient,
        string calldata description,
        uint8 priority,
        uint16 complexityScore
    ) external onlyActiveProtocol onlyGovernance returns (uint256) {
        return taskManager.createFundingTask(amount, recipient, description, priority, complexityScore);
    }
    
    /**
     * @notice Crea tarea de emergencia
     */
    function createEmergencyTask(
        uint256 rewardAmount,
        string calldata description,
        uint8 priority,
        uint16 complexityScore
    ) external onlyActiveProtocol onlyOwner returns (uint256) {
        return taskManager.createEmergencyTask(rewardAmount, description, priority, complexityScore);
    }
    
    /**
     * @notice Vota en una tarea (delegada al TaskManager)
     */
    function voteOnTask(uint256 taskId, bool support) external {
        taskManager.voteOnTask(taskId, support);
    }
    
    /**
     * @notice Finaliza tarea y ejecuta distribución de recompensas
     */
    function finalizeTaskWithRewards(uint256 taskId) external {
        // Finalizar tarea en TaskManager
        taskManager.finalizeTask(taskId);
        
        // Si la tarea fue aprobada y tiene recompensas, delegar al RewardDistributor
        // (La lógica específica se implementará según el tipo de tarea)
        
        completedTaskCount++;
        _logEvent("TASK_FINALIZED_WITH_REWARDS", abi.encode(taskId, completedTaskCount));
    }
    
    // ========== FUNCIONES DE COMISIONES ==========
    
    /**
     * @notice Paga comisión por venta verificada
     */
    function grantSalesCommission(address workerAddress, uint256 commissionAmount) 
        external onlyPandoraOracle onlyActiveProtocol nonReentrant {
        require(workerAddress != address(0), "W2E: Invalid worker address");
        require(commissionAmount > 0, "W2E: Commission must be positive");
        
        // Calcular fee de plataforma (1%)
        uint256 platformFee = commissionAmount / 100;
        uint256 netCommission = commissionAmount - platformFee;
        
        // Mint fee para la plataforma
        utilityToken.mint(platformFeeWallet, platformFee);
        
        // Mint comisión neta para el trabajador
        utilityToken.mint(workerAddress, netCommission);
        
        _logEvent("SALES_COMMISSION_PAID", abi.encode(workerAddress, commissionAmount, platformFee));
    }
    
    // ========== FUNCIONES DE CONFIGURACIÓN ==========
    
    /**
     * @notice Actualiza meta de venta objetivo
     */
    function setTargetAmount(uint256 newTarget) external onlyGovernance {
        require(newTarget > 0, "W2E: Invalid target");
        targetAmount = newTarget;
        _logEvent("TARGET_AMOUNT_UPDATED", abi.encode(newTarget));
    }
    
    /**
     * @notice Actualiza direcciones críticas
     */
    function updateCriticalAddresses(
        address _pandoraOracle,
        address _platformFeeWallet,
        address _creatorWallet,
        address _governanceContract
    ) external onlyGovernance {
        if (_pandoraOracle != address(0)) pandoraOracle = _pandoraOracle;
        if (_platformFeeWallet != address(0)) platformFeeWallet = _platformFeeWallet;
        if (_creatorWallet != address(0)) creatorWallet = _creatorWallet;
        if (_governanceContract != address(0)) governanceContract = _governanceContract;
        
        _logEvent("CRITICAL_ADDRESSES_UPDATED", abi.encode(_pandoraOracle, _platformFeeWallet, _creatorWallet, _governanceContract));
    }
    
    /**
     * @notice Avanza a nueva fase del protocolo
     */
    function advanceProtocolPhase(uint256 newPhase) external onlyGovernance {
        require(newPhase > protocolPhase, "W2E: Cannot go backwards");
        uint256 oldPhase = protocolPhase;
        protocolPhase = newPhase;
        
        emit ProtocolPhaseAdvanced(oldPhase, newPhase);
        _logEvent("PROTOCOL_PHASE_ADVANCED", abi.encode(oldPhase, newPhase));
    }
    
    // ========== FUNCIONES DE EMERGENCIA ==========
    
    /**
     * @notice Activa modo de emergencia
     */
    function activateEmergencyMode(string calldata reason) external onlyOwner {
        protocolState = ProtocolState.MAINTENANCE;
        isActive = false;
        
        eventLogger.logEmergencyEvent(address(this), reason, bytes(""), msg.sender);
        _logEvent("EMERGENCY_MODE_ACTIVATED", abi.encode(reason));
    }
    
    /**
     * @notice Rescata fondos en caso de emergencia
     */
    function emergencyRescue(address payable recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "W2E: Invalid recipient");
        require(amount > 0, "W2E: Amount must be positive");
        require(protocolState != ProtocolState.LIVE, "W2E: Protocol must be in maintenance or shutdown");
        
        // Usar pandora root treasury para rescate
        (bool success,) = pandoraRootTreasury.transferToOperationalOrReserve(recipient, amount);
        require(success, "W2E: Emergency rescue failed");
        
        _logEvent("EMERGENCY_RESCUE", abi.encode(recipient, amount));
    }
    
    // ========== FUNCIONES DE VISTA ==========
    
    /**
     * @notice Obtiene estadísticas completas del protocolo
     */
    function getProtocolStats() external view returns (
        ProtocolState currentState,
        uint256 currentPhase,
        uint256 totalRaised_,
        uint256 creatorPaid_,
        uint256 targetAmount_,
        uint256 completedTasks_,
        uint256 totalRewardDistributions_
    ) {
        currentState = protocolState;
        currentPhase = protocolPhase;
        totalRaised_ = totalRaised;
        creatorPaid_ = creatorPaidOut;
        targetAmount_ = targetAmount;
        completedTasks_ = completedTaskCount;
        totalRewardDistributions_ = rewardDistributionCount;
    }
    
    /**
     * @notice Verifica si el creador puede reclamar su payout
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
     */
    function getPhaseMetrics() external view returns (
        uint256 currentPhase_,
        uint256 totalPhases_,
        uint256[] memory salesCounts
    ) {
        currentPhase_ = protocolPhase;
        totalPhases_ = 10; // Máximo 10 fases
        
        salesCounts = new uint256[](totalPhases_);
        for (uint256 i = 1; i <= totalPhases_; i++) {
            salesCounts[i] = phaseSalesCount[i];
        }
    }
    
    /**
     * @notice Obtiene direcciones de todos los módulos
     */
    function getModuleAddresses() external view returns (
        address licenseNFT_,
        address utilityToken_,
        address taskManager_,
        address rewardDistributor_,
        address eventLogger_,
        address pandoraRootTreasury_,
        address protocolTreasury_
    ) {
        return (
            address(licenseNFT),
            address(utilityToken),
            address(taskManager),
            address(rewardDistributor),
            address(eventLogger),
            address(pandoraRootTreasury),
            address(protocolTreasury)
        );
    }
    
    // ========== FUNCIONES AUXILIARES ==========
    
    /**
     * @notice Registra evento en el sistema centralizado
     */
    function _logEvent(string memory eventType, bytes memory data) internal {
        if (address(eventLogger) != address(0)) {
            try eventLogger.logEvent(
                address(this),
                W2EEventLogger.EventCategory.SYSTEM,
                W2EEventLogger.CriticalityLevel.MEDIUM,
                eventType,
                data,
                msg.sender
            ) {} catch {}
        }
    }
    
    // ========== FUNCIONES DE RECEIVED ==========
    
    /**
     * @notice Permite recibir ETH para emergencias
     */
    receive() external payable {
        // ETH recibido para operaciones de emergencia
    }
}