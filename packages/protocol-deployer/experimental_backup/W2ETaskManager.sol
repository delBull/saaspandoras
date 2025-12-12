// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IW2ELicense.sol";
import "../interfaces/IW2EUtilityToken.sol";
import "../interfaces/advanced/IW2ETaskManager.sol";

/**
 * @title W2ETaskManager - Gestión Especializada de Tareas W2E
 * @notice Contrato modular especializado en crear, gestionar y finalizar tareas
 * @dev Separado del W2ELoom principal para mejor modularidad
 */
contract W2ETaskManager is IW2ETaskManager, Ownable, ReentrancyGuard {
    // ========== DEPENDENCIAS MODULARES ==========
    
    /// @notice Contrato de licencias para validación de permisos
    IW2ELicense public licenseNFT;
    
    /// @notice Contrato de distribución de recompensas
    address public rewardDistributor;
    
    /// @notice Contrato de eventos centralizado
    address public eventLogger;
    
    // ========== CONFIGURACIÓN ==========
    
    /// @notice Cuórum mínimo en porcentaje
    uint256 public minQuorumPercentage;
    
    /// @notice Periodo de votación en segundos
    uint256 public votingPeriodSeconds;
    
    /// @notice Cuórum de emergencia en porcentaje
    uint256 public emergencyQuorumPct;
    
    /// @notice Periodo de inactividad para emergencia
    uint256 public emergencyInactivitySeconds;
    
    // ========== TIPOS Y ESTRUCTURAS ==========
    // Los tipos TaskStatus, TaskType, W2ETask y VoteInfo se heredan de IW2ETaskManager
    
    // ========== STORAGE OPTIMIZADO ==========
    
    /// @notice Contador de tareas (optimizado)
    uint256 public taskCount;
    
    /// @notice Timestamp de la última tarea finalizada
    uint256 public lastTaskFinalizedTime;
    
    /// @notice Contador de tareas activas (gas optimization)
    uint256 public activeTaskCount;
    
    /// @notice Mapeo de tareas
    mapping(uint256 => W2ETask) public tasks;
    
    /// @notice Mapeo de votos (optimizado con packing)
    mapping(uint256 => mapping(address => VoteInfo)) public taskVotes;
    
    /// @notice Lista de tareas activas para eficiencia (sin loops)
    uint256[] public activeTaskIds;
    mapping(uint256 => uint256) public activeTaskIndex; // taskId => index in activeTaskIds
    
    // ========== EVENTOS ==========
    
    event TaskCreated(
        uint256 indexed taskId,
        TaskType indexed taskType,
        address indexed creator,
        uint256 rewardAmount,
        string description,
        uint8 priority,
        uint16 complexityScore
    );
    
    event VoteCast(
        uint256 indexed taskId,
        address indexed voter,
        bool support,
        uint256 stakeAmount,
        uint32 voteWeight
    );
    
    event TaskFinalized(
        uint256 indexed taskId,
        TaskStatus status,
        uint256 totalVotes,
        uint256 approvalVotes,
        uint256 rejectionVotes
    );
    
    event TaskExecuted(uint256 indexed taskId, address indexed executor);
    event TaskExpired(uint256 indexed taskId);
    
    // ========== CONSTRUCTOR ==========
    
    constructor(
        address _licenseNFT,
        address _rewardDistributor,
        address _eventLogger,
        uint256 _minQuorumPercentage,
        uint256 _votingPeriodSeconds,
        uint256 _emergencyQuorumPct,
        uint256 _emergencyInactivitySeconds,
        address initialOwner
    ) Ownable() {
        require(_licenseNFT != address(0), "W2E: Invalid license NFT");
        require(_rewardDistributor != address(0), "W2E: Invalid reward distributor");
        require(_eventLogger != address(0), "W2E: Invalid event logger");
        require(_minQuorumPercentage > 0 && _minQuorumPercentage <= 100, "W2E: Invalid quorum");
        require(_votingPeriodSeconds >= 1 days, "W2E: Voting period too short");
        require(_emergencyQuorumPct > 0 && _emergencyQuorumPct <= 100, "W2E: Invalid emergency quorum");
        require(_emergencyInactivitySeconds >= 7 days, "W2E: Emergency period too short");
        
        licenseNFT = IW2ELicense(_licenseNFT);
        rewardDistributor = _rewardDistributor;
        eventLogger = _eventLogger;
        minQuorumPercentage = _minQuorumPercentage;
        votingPeriodSeconds = _votingPeriodSeconds;
        emergencyQuorumPct = _emergencyQuorumPct;
        emergencyInactivitySeconds = _emergencyInactivitySeconds;
        
        lastTaskFinalizedTime = block.timestamp;
    }
    
    // ========== MODIFICADORES ==========
    
    modifier onlyLicenseHolder() {
        require(licenseNFT.balanceOf(msg.sender) > 0, "W2E: License required");
        _;
    }
    
    // ========== FUNCIONES DE CREACIÓN DE TAREAS ==========
    
    /**
     * @notice Crea nueva tarea de validación
     */
    function createValidationTask(
        uint256 rewardAmount,
        uint256 requiredStake,
        string calldata description,
        uint8 priority,
        uint16 complexityScore
    ) external onlyLicenseHolder returns (uint256) {
        return _createTask(TaskType.Validation, rewardAmount, requiredStake, description, priority, complexityScore);
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
    ) external onlyOwner returns (uint256) {
        W2ETask memory task = _createTask(TaskType.Governance, amount, requiredStakeForGovernance(), description, priority, complexityScore);
        
        // Configurar destinatario de fondos
        tasks[task.id].fundingRecipient = recipient;
        tasks[task.id].offChainProof = keccak256(abi.encodePacked(amount, recipient, description));
        
        return task.id;
    }
    
    /**
     * @notice Crea tarea de emergencia
     */
    function createEmergencyTask(
        uint256 rewardAmount,
        string calldata description,
        uint8 priority,
        uint16 complexityScore
    ) external onlyOwner returns (uint256) {
        return _createTask(TaskType.Emergency, rewardAmount, 0, description, priority, complexityScore);
    }
    
    /**
     * @notice Función interna para crear tareas (código reutilizable)
     */
    function _createTask(
        TaskType taskType,
        uint256 rewardAmount,
        uint256 requiredStake,
        string calldata description,
        uint8 priority,
        uint16 complexityScore
    ) internal returns (W2ETask memory) {
        require(rewardAmount > 0 || taskType == TaskType.Governance, "W2E: Reward must be positive");
        require(priority >= 1 && priority <= 4, "W2E: Invalid priority");
        require(complexityScore >= 1 && complexityScore <= 1000, "W2E: Invalid complexity score");
        
        taskCount++;
        uint256 taskId = taskCount;
        
        W2ETask storage newTask = tasks[taskId];
        newTask.id = taskId;
        newTask.taskType = taskType;
        newTask.creator = msg.sender;
        newTask.rewardAmount = rewardAmount;
        newTask.requiredStake = requiredStake;
        newTask.startTime = block.timestamp;
        newTask.endTime = block.timestamp + votingPeriodSeconds;
        newTask.status = TaskStatus.Pending;
        newTask.priority = priority;
        newTask.complexityScore = complexityScore;
        newTask.estimatedDuration = _estimateTaskDuration(taskType, complexityScore);
        
        // Agregar a lista de tareas activas (gas optimization)
        _addToActiveTasks(taskId);
        activeTaskCount++;
        
        emit TaskCreated(taskId, taskType, msg.sender, rewardAmount, description, priority, complexityScore);
        _logEvent("TASK_CREATED", abi.encode(taskId, taskType, msg.sender, priority));
        
        return newTask;
    }
    
    // ========== FUNCIONES DE VOTACIÓN ==========
    
    /**
     * @notice Vota en una tarea con validación completa
     */
    function voteOnTask(
        uint256 taskId,
        bool support
    ) external onlyLicenseHolder nonReentrant {
        W2ETask storage task = tasks[taskId];
        
        // Validaciones
        require(task.status == TaskStatus.Pending || task.status == TaskStatus.Active, "W2E: Task not active");
        require(block.timestamp <= task.endTime, "W2E: Voting period ended");
        require(!taskVotes[taskId][msg.sender].hasVoted, "W2E: Already voted");
        require(!task.executed, "W2E: Task already executed");
        
        // Validar stake si es requerido
        uint256 votingWeight = _calculateVotingWeight(msg.sender, task.requiredStake);
        require(votingWeight > 0, "W2E: Insufficient stake for voting");
        
        // Registrar voto
        taskVotes[taskId][msg.sender] = VoteInfo({
            hasVoted: true,
            support: support,
            stakeAmount: task.requiredStake,
            voteWeight: votingWeight,
            voteTime: block.timestamp
        });
        
        // Actualizar contadores
        if (support) {
            task.approvalVotes += votingWeight;
        } else {
            task.rejectionVotes += votingWeight;
        }
        
        // Cambiar estado si es la primera vez
        if (task.status == TaskStatus.Pending) {
            task.status = TaskStatus.Active;
        }
        
        emit VoteCast(taskId, msg.sender, support, task.requiredStake, votingWeight);
        _logEvent("VOTE_CAST", abi.encode(taskId, msg.sender, support, votingWeight));
        
        // Verificar auto-finalización
        _checkAutoFinalize(taskId);
    }
    
    /**
     * @notice Calcula el peso de voto basado en licencia y stake
     */
    function _calculateVotingWeight(address voter, uint256 requiredStake) internal view returns (uint32) {
        // Peso base: número de licencias
        uint32 baseWeight = uint32(licenseNFT.balanceOf(voter));
        
        // Bonificación por stake adicional
        uint256 stakedAmount = 0; // Se calculará desde el token utility
        
        // Determinar peso final con bonificaciones
        uint32 finalWeight = baseWeight;
        if (requiredStake > 0 && stakedAmount >= requiredStake) {
            finalWeight += uint32(requiredStake / 10**18); // 1 punto por cada token staked
        }
        
        return finalWeight;
    }
    
    // ========== FUNCIONES DE GESTIÓN DE ESTADO ==========

    /**
     * @notice Finaliza una tarea (puede ser llamada por cualquier usuario)
     */
    function finalizeTask(uint256 taskId) external nonReentrant {
        W2ETask storage task = tasks[taskId];
        require(task.status == TaskStatus.Pending || task.status == TaskStatus.Active, "W2E: Task not active");
        require(!task.executed, "W2E: Already executed");

        uint256 totalVotes = task.approvalVotes + task.rejectionVotes;
        uint256 totalLicenses = licenseNFT.totalMinted();
        uint256 minQuorum = (totalLicenses * minQuorumPercentage) / 100;

        // Verificar condiciones de finalización
        bool canFinalize = totalVotes >= minQuorum || block.timestamp > task.endTime;
        require(canFinalize, "W2E: Cannot finalize yet");

        // Determinar resultado
        if (task.approvalVotes > task.rejectionVotes) {
            task.status = TaskStatus.Approved;
            _executeApprovedTask(taskId);
        } else {
            task.status = TaskStatus.Rejected;
            _handleRejectedTask(taskId);
        }

        // Remover de tareas activas
        _removeFromActiveTasks(taskId);
        activeTaskCount--;

        lastTaskFinalizedTime = block.timestamp;

        emit TaskFinalized(taskId, task.status, totalVotes, task.approvalVotes, task.rejectionVotes);
        _logEvent("TASK_FINALIZED", abi.encode(taskId, task.status, totalVotes));
    }

    /**
     * @notice Verifica si una tarea puede ser auto-finalizada
     */
    function _checkAutoFinalize(uint256 taskId) internal {
        W2ETask storage task = tasks[taskId];
        uint256 totalVotes = task.approvalVotes + task.rejectionVotes;
        uint256 totalLicenses = licenseNFT.totalMinted();

        // Auto-finalizar si se alcanza 80% de cuórum en 48 horas
        // TODO: Implementar auto-finalización cuando finalizeTask esté disponible
        // if (totalVotes >= (totalLicenses * 80) / 100 &&
        //     block.timestamp <= task.startTime + 2 days) {
        //     finalizeTask(taskId);
        // }
    }

    /**
     * @notice Ejecuta una tarea aprobada
     */
    function _executeApprovedTask(uint256 taskId) internal {
        W2ETask storage task = tasks[taskId];
        task.executed = true;

        if (task.taskType == TaskType.Validation && task.rewardAmount > 0) {
            // Delegar distribución al RewardDistributor
            // (Se implementará en contrato separado)
            emit TaskExecuted(taskId, msg.sender);
            _logEvent("TASK_EXECUTED", abi.encode(taskId, "validation_reward"));
        } else if (task.taskType == TaskType.Governance && task.fundingRecipient != address(0)) {
            // Liberar fondos
            emit TaskExecuted(taskId, msg.sender);
            _logEvent("TASK_EXECUTED", abi.encode(taskId, "funding_release"));
        }
    }

    /**
     * @notice Maneja una tarea rechazada
     */
    function _handleRejectedTask(uint256 taskId) internal {
        // TODO: Implementar lógica de slashing para votos incorrectos
        _logEvent("TASK_REJECTED", abi.encode(taskId));
    }
    
    /**
     * @notice Marca tareas expiradas
     */
    function expireTasks() external {
        for (uint256 i = 0; i < activeTaskIds.length; i++) {
            uint256 taskId = activeTaskIds[i];
            W2ETask storage task = tasks[taskId];
            
            if (block.timestamp > task.endTime && task.status == TaskStatus.Active) {
                task.status = TaskStatus.Expired;
                emit TaskExpired(taskId);
                _logEvent("TASK_EXPIRED", abi.encode(taskId));
            }
        }
    }
    
    // ========== FUNCIONES AUXILIARES ==========
    
    /**
     * @notice Estima duración de tarea basada en tipo y complejidad
     */
    function _estimateTaskDuration(TaskType taskType, uint16 complexityScore) internal pure returns (uint32) {
        uint256 baseDuration = 24; // 24 horas base
        
        if (taskType == TaskType.Validation) {
            return uint32(baseDuration + (complexityScore / 10)); // Complejidad afecta duración
        } else if (taskType == TaskType.Governance) {
            return 48; // Gobernanza siempre 48 horas
        } else if (taskType == TaskType.Emergency) {
            return 4; // Emergencia 4 horas máximo
        }
        
        return 24;
    }
    
    /**
     * @notice Stake requerido para tareas de gobernanza
     */
    function requiredStakeForGovernance() internal pure returns (uint256) {
        return 100 * 10**18; // 100 tokens
    }
    
    /**
     * @notice Agregar tarea a lista activa
     */
    function _addToActiveTasks(uint256 taskId) internal {
        activeTaskIndex[taskId] = activeTaskIds.length;
        activeTaskIds.push(taskId);
    }
    
    /**
     * @notice Remover tarea de lista activa
     */
    function _removeFromActiveTasks(uint256 taskId) internal {
        uint256 index = activeTaskIndex[taskId];
        uint256 lastId = activeTaskIds[activeTaskIds.length - 1];
        
        activeTaskIds[index] = lastId;
        activeTaskIndex[lastId] = index;
        activeTaskIds.pop();
        delete activeTaskIndex[taskId];
    }
    
    /**
     * @notice Registrar evento en logger centralizado
     */
    function _logEvent(string memory eventType, bytes memory data) internal {
        if (eventLogger != address(0)) {
            // Llamada al EventLogger (se implementará en contrato separado)
        }
    }
    
    // ========== FUNCIONES DE CONFIGURACIÓN ==========
    
    /**
     * @notice Actualiza parámetros de gobernanza
     */
    function updateGovernanceParams(
        uint256 newQuorum,
        uint256 newVotingPeriod,
        uint256 newEmergencyQuorum
    ) external onlyOwner {
        require(newQuorum > 0 && newQuorum <= 100, "W2E: Invalid quorum");
        require(newVotingPeriod >= 1 days, "W2E: Voting period too short");
        require(newEmergencyQuorum > 0 && newEmergencyQuorum <= 100, "W2E: Invalid emergency quorum");
        
        minQuorumPercentage = newQuorum;
        votingPeriodSeconds = newVotingPeriod;
        emergencyQuorumPct = newEmergencyQuorum;
        
        _logEvent("GOVERNANCE_UPDATED", abi.encode(newQuorum, newVotingPeriod, newEmergencyQuorum));
    }
    
    // ========== FUNCIONES DE VISTA ==========
    
    /**
     * @notice Obtiene información completa de tarea
     */
    function getTask(uint256 taskId) external view returns (W2ETask memory) {
        return tasks[taskId];
    }
    
    /**
     * @notice Obtiene información de voto
     */
    function getVote(uint256 taskId, address voter) external view returns (VoteInfo memory) {
        return taskVotes[taskId][voter];
    }
    
    /**
     * @notice Verifica si una tarea puede ser finalizada
     */
    function canFinalizeTask(uint256 taskId) external view returns (bool) {
        W2ETask storage task = tasks[taskId];
        if (task.status != TaskStatus.Pending && task.status != TaskStatus.Active) return false;
        
        uint256 totalVotes = task.approvalVotes + task.rejectionVotes;
        uint256 totalLicenses = licenseNFT.totalMinted();
        uint256 minQuorum = (totalLicenses * minQuorumPercentage) / 100;
        
        return totalVotes >= minQuorum || block.timestamp > task.endTime;
    }
    
    /**
     * @notice Obtiene parámetros de gobernanza actuales
     */
    function getGovernanceParams() external view returns (
        uint256 minQuorumPercentage_,
        uint256 votingPeriodSeconds_,
        uint256 emergencyQuorumPct_
    ) {
        return (minQuorumPercentage, votingPeriodSeconds, emergencyQuorumPct);
    }

    /**
     * @notice Obtiene métricas de tareas
     */
    function getTaskMetrics() external view returns (
        uint256 totalTasks,
        uint256 activeTasks,
        uint256 pendingTasks,
        uint256 completedTasks
    ) {
        totalTasks = taskCount;
        activeTasks = activeTaskCount;

        uint256 pendingCount = 0;
        uint256 completedCount = 0;

        // TODO: Optimizar con contadores mantenidos
        for (uint256 i = 1; i <= taskCount; i++) {
            if (tasks[i].status == TaskStatus.Pending) {
                pendingCount++;
            } else if (tasks[i].status == TaskStatus.Executed || tasks[i].status == TaskStatus.Approved) {
                completedCount++;
            }
        }

        return (totalTasks, activeTasks, pendingCount, completedCount);
    }
}
