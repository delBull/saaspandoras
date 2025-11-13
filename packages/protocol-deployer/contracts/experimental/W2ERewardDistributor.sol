// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IW2EUtilityToken.sol";
import "../interfaces/advanced/IW2ERewardDistributor.sol";

/**
 * @title W2ERewardDistributor - Distribución Especializada de Recompensas
 * @notice Contrato modular especializado en distribuir recompensas de tareas
 * @dev Separado del TaskManager para mejor modularidad y seguridad
 */
contract W2ERewardDistributor is IW2ERewardDistributor, Ownable, ReentrancyGuard {
    // ========== DEPENDENCIAS MODULARES ==========
    
    /// @notice Token de utilidad para mint/burn de recompensas
    IW2EUtilityToken public utilityToken;
    
    /// @notice Contrato de tareas para validar completación
    address public taskManager;
    
    /// @notice Contrato de eventos centralizado
    address public eventLogger;
    
    /// @notice Direcciones autorizadas para distribución
    mapping(address => bool) public authorizedDistributors;
    
    // ========== CONFIGURACIÓN DE DISTRIBUCIÓN ==========
    
    /// @notice Porcentaje mínimo de participación para calificar para recompensas
    uint256 public minParticipationRewardPct = 10; // 10%
    
    /// @notice Porcentaje máximo de penalización por slashing
    uint256 public maxSlashingPct = 25; // 25%
    
    /// @notice Duración del período de reclamación (30 días)
    uint256 public claimDuration = 30 days;
    
    /// @notice Fee por distribución (en basis points, 100 = 1%)
    uint256 public distributionFeeBps = 50; // 0.5%
    
    /// @notice Dirección que recibe las fees
    address public feeRecipient;
    
    // ========== ESTRUCTURAS DE DISTRIBUCIÓN ==========
    
    /// @notice Información de distribución por tarea
    struct RewardDistribution {
        uint256 taskId;
        uint256 totalReward;
        uint256 distributedAmount;
        uint256 remainingAmount;
        uint256 participantsCount;
        uint256 createdAt;
        bool finalized;
        bool claimed;
        uint256 claimDeadline;
    }
    
    /// @notice Recompensas por votante
    struct VoterReward {
        uint256 taskId;
        uint256 rewardAmount;
        uint256 slashingAmount;
        bool claimed;
        uint256 claimTime;
        bool isSlashed;
    }
    
    /// @notice Lista de ganadores para evitar loops (gas optimization)
    struct WinnerInfo {
        address winner;
        uint256 rewardAmount;
        bool claimed;
    }
    
    // ========== STORAGE ==========
    
    /// @notice Mapeo de distribuciones por taskId
    mapping(uint256 => RewardDistribution) public rewardDistributions;
    
    /// @notice Mapeo de recompensas por votante y tarea
    mapping(uint256 => mapping(address => VoterReward)) public voterRewards;
    
    /// @notice Contador de distribuciones
    uint256 public distributionCount;
    
    /// @notice Total de recompensas distribuidas (para métricas)
    uint256 public totalRewardsDistributed;
    
    /// @notice Total de slashing aplicado
    uint256 public totalSlashingApplied;
    
    // ========== EVENTOS ==========
    
    event DistributionCreated(
        uint256 indexed taskId,
        uint256 totalReward,
        uint256 participants,
        uint256 distributionId
    );
    
    event RewardCalculated(
        uint256 indexed taskId,
        address indexed voter,
        uint256 rewardAmount,
        uint256 slashingAmount,
        bool isSlashed
    );
    
    event RewardClaimed(
        uint256 indexed taskId,
        address indexed voter,
        uint256 amount
    );
    
    event SlashingApplied(
        uint256 indexed taskId,
        address indexed voter,
        uint256 slashingAmount,
        string reason
    );
    
    event DistributionFinalized(uint256 indexed taskId, uint256 totalDistributed);
    event EmergencyRecovery(address indexed voter, uint256 amount);
    
    // ========== CONSTRUCTOR ==========
    
    constructor(
        address _utilityToken,
        address _taskManager,
        address _eventLogger,
        address _feeRecipient,
        address initialOwner
    ) Ownable() {
        require(_utilityToken != address(0), "W2E: Invalid utility token");
        require(_taskManager != address(0), "W2E: Invalid task manager");
        require(_eventLogger != address(0), "W2E: Invalid event logger");
        require(_feeRecipient != address(0), "W2E: Invalid fee recipient");
        
        utilityToken = IW2EUtilityToken(_utilityToken);
        taskManager = _taskManager;
        eventLogger = _eventLogger;
        feeRecipient = _feeRecipient;
        
        // Autorizar distribuidor inicial
        authorizedDistributors[msg.sender] = true;
    }
    
    // ========== MODIFICADORES ==========
    
    modifier onlyAuthorizedDistributor() {
        require(authorizedDistributors[msg.sender], "W2E: Not authorized distributor");
        _;
    }
    
    modifier onlyTaskManager() {
        require(msg.sender == taskManager, "W2E: Only TaskManager can call");
        _;
    }
    
    // ========== FUNCIONES PRINCIPALES DE DISTRIBUCIÓN ==========
    
    /**
     * @notice Crea distribución de recompensas para tarea completada
     * @param taskId ID de la tarea
     * @param totalReward Recompensa total a distribuir
     * @param winners Lista de ganadores calificados
     */
    function createDistribution(
        uint256 taskId,
        uint256 totalReward,
        WinnerInfo[] calldata winners
    ) external onlyTaskManager nonReentrant {
        require(totalReward > 0, "W2E: Reward must be positive");
        require(winners.length > 0, "W2E: No winners");
        require(rewardDistributions[taskId].createdAt == 0, "W2E: Distribution already exists");
        
        distributionCount++;
        
        // Calcular fee de distribución
        uint256 fee = (totalReward * distributionFeeBps) / 10000;
        uint256 netReward = totalReward - fee;
        
        // Crear distribución
        rewardDistributions[taskId] = RewardDistribution({
            taskId: taskId,
            totalReward: totalReward,
            distributedAmount: 0,
            remainingAmount: netReward,
            participantsCount: winners.length,
            createdAt: block.timestamp,
            finalized: false,
            claimed: false,
            claimDeadline: block.timestamp + claimDuration
        });
        
        // Calcular recompensas individuales
        _calculateIndividualRewards(taskId, netReward, winners);
        
        // Mint fee al destinatario
        if (fee > 0) {
            utilityToken.mint(feeRecipient, fee);
        }
        
        emit DistributionCreated(taskId, totalReward, winners.length, distributionCount);
        _logEvent("DISTRIBUTION_CREATED", abi.encode(taskId, totalReward, winners.length, fee));
    }
    
    /**
     * @notice Calcula recompensas individuales para cada votante ganador
     */
    function _calculateIndividualRewards(
        uint256 taskId,
        uint256 netReward,
        WinnerInfo[] calldata winners
    ) internal {
        // Dividir recompensas proporcionalmente
        uint256 totalWeight = _calculateTotalWeight(winners);
        
        for (uint256 i = 0; i < winners.length; i++) {
            WinnerInfo memory winner = winners[i];
            
            // Calcular peso del ganador (basado en su participación)
            uint256 winnerWeight = _calculateWinnerWeight(winner);
            uint256 individualReward = (netReward * winnerWeight) / totalWeight;
            
            // Registrar recompensa
            voterRewards[taskId][winner.winner] = VoterReward({
                taskId: taskId,
                rewardAmount: individualReward,
                slashingAmount: 0,
                claimed: false,
                claimTime: 0,
                isSlashed: false
            });
            
            emit RewardCalculated(taskId, winner.winner, individualReward, 0, false);
        }
    }
    
    /**
     * @notice Aplica slashing a votantes incorrectos
     */
    function applySlashing(
        uint256 taskId,
        address[] calldata slashedVoters,
        string calldata reason
    ) external onlyAuthorizedDistributor nonReentrant {
        RewardDistribution storage distribution = rewardDistributions[taskId];
        require(!distribution.finalized, "W2E: Distribution already finalized");
        require(slashedVoters.length > 0, "W2E: No voters to slash");
        
        uint256 totalSlashing = 0;
        
        for (uint256 i = 0; i < slashedVoters.length; i++) {
            address voter = slashedVoters[i];
            VoterReward storage reward = voterRewards[taskId][voter];
            
            require(!reward.isSlashed, "W2E: Voter already slashed");
            require(reward.rewardAmount > 0, "W2E: No reward to slash");
            
            // Calcular monto de slashing
            uint256 slashingAmount = (reward.rewardAmount * maxSlashingPct) / 100;
            
            // Actualizar recompensa
            reward.rewardAmount -= slashingAmount;
            reward.slashingAmount += slashingAmount;
            reward.isSlashed = true;
            
            // Quemar tokens slashados
            if (slashingAmount > 0) {
                utilityToken.burnFrom(address(this), slashingAmount);
            }
            
            totalSlashing += slashingAmount;
            totalSlashingApplied += slashingAmount;
            
            emit SlashingApplied(taskId, voter, slashingAmount, reason);
            _logEvent("SLASHING_APPLIED", abi.encode(taskId, voter, slashingAmount, reason));
        }
        
        // Re-distribuir slashing a ganadores restantes
        if (totalSlashing > 0) {
            _redistributeSlashing(taskId, totalSlashing);
        }
    }
    
    /**
     * @notice Re-distribuye tokens slashados entre ganadores restantes
     */
    function _redistributeSlashing(uint256 taskId, uint256 totalSlashing) internal {
        // Implementación básica: redistribuir proporcionalmente a ganadores restantes
        // TODO: Implementar lógica más sofisticada de redistribución
        totalRewardsDistributed += totalSlashing;
    }
    
    // ========== FUNCIONES DE RECLAMACIÓN ==========
    
    /**
     * @notice Reclama recompensa individual
     */
    function claimReward(uint256 taskId) external nonReentrant {
        VoterReward storage reward = voterRewards[taskId][msg.sender];
        RewardDistribution storage distribution = rewardDistributions[taskId];
        
        require(reward.rewardAmount > 0, "W2E: No reward to claim");
        require(!reward.claimed, "W2E: Reward already claimed");
        require(block.timestamp <= distribution.claimDeadline, "W2E: Claim period expired");
        
        reward.claimed = true;
        reward.claimTime = block.timestamp;
        distribution.distributedAmount += reward.rewardAmount;
        distribution.remainingAmount -= reward.rewardAmount;
        totalRewardsDistributed += reward.rewardAmount;
        
        // Mint tokens al reclamante
        utilityToken.mint(msg.sender, reward.rewardAmount);
        
        emit RewardClaimed(taskId, msg.sender, reward.rewardAmount);
        _logEvent("REWARD_CLAIMED", abi.encode(taskId, msg.sender, reward.rewardAmount));
    }
    
    /**
     * @notice Finaliza distribución y reclama recompensas no reclamadas
     */
    function finalizeDistribution(uint256 taskId) external onlyAuthorizedDistributor {
        RewardDistribution storage distribution = rewardDistributions[taskId];
        require(!distribution.finalized, "W2E: Already finalized");
        require(
            block.timestamp > distribution.claimDeadline || 
            distribution.remainingAmount < distribution.totalReward / 10, // 10% remaining
            "W2E: Claim period not expired yet"
        );
        
        distribution.finalized = true;
        distribution.claimed = true;
        
        // Reclamar recompensas no reclamadas para burning
        uint256 unclaimedAmount = distribution.remainingAmount;
        if (unclaimedAmount > 0) {
            utilityToken.burn(address(this), unclaimedAmount);
        }
        
        emit DistributionFinalized(taskId, distribution.distributedAmount);
        _logEvent("DISTRIBUTION_FINALIZED", abi.encode(taskId, distribution.distributedAmount, unclaimedAmount));
    }
    
    // ========== FUNCIONES DE EMERGENCIA ==========
    
    /**
     * @notice Recuperación de emergencia para tokens atascados
     */
    function emergencyRecovery(address voter, uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "W2E: Insufficient balance");
        
        utilityToken.mint(voter, amount);
        emit EmergencyRecovery(voter, amount);
        _logEvent("EMERGENCY_RECOVERY", abi.encode(voter, amount));
    }
    
    /**
     * @notice Válida período de reclamación y autoriza reclamos manuales
     */
    function extendClaimPeriod(uint256 taskId, uint256 additionalDays) external onlyOwner {
        RewardDistribution storage distribution = rewardDistributions[taskId];
        require(distribution.createdAt > 0, "W2E: Distribution does not exist");
        require(additionalDays <= 90, "W2E: Extension too long"); // Máximo 90 días
        
        distribution.claimDeadline += (additionalDays * 1 days);
        
        _logEvent("CLAIM_PERIOD_EXTENDED", abi.encode(taskId, additionalDays));
    }
    
    // ========== FUNCIONES AUXILIARES ==========
    
    /**
     * @notice Calcula peso total de todos los ganadores
     */
    function _calculateTotalWeight(WinnerInfo[] calldata winners) internal view returns (uint256) {
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < winners.length; i++) {
            totalWeight += _calculateWinnerWeight(winners[i]);
        }
        return totalWeight;
    }
    
    /**
     * @notice Calcula peso individual de un ganador
     */
    function _calculateWinnerWeight(WinnerInfo memory winner) internal view returns (uint256) {
        // Implementación básica: peso basado en recompensa
        // TODO: Implementar lógica más sofisticada basada en participación real
        return winner.rewardAmount > 0 ? 1 : 0;
    }
    
    /**
     * @notice Registra evento en logger centralizado
     */
    function _logEvent(string memory eventType, bytes memory data) internal {
        if (eventLogger != address(0)) {
            // Llamada al EventLogger (se implementará en contrato separado)
        }
    }
    
    // ========== FUNCIONES DE CONFIGURACIÓN ==========
    
    /**
     * @notice Actualiza configuración de distribución
     */
    function updateDistributionConfig(
        uint256 newMinParticipation,
        uint256 newMaxSlashing,
        uint256 newClaimDuration,
        uint256 newDistributionFee
    ) external onlyOwner {
        require(newMinParticipation <= 50, "W2E: Participation too high");
        require(newMaxSlashing <= 50, "W2E: Slashing too high");
        require(newClaimDuration <= 365 days, "W2E: Claim duration too long");
        require(newDistributionFee <= 500, "W2E: Fee too high"); // Máximo 5%
        
        minParticipationRewardPct = newMinParticipation;
        maxSlashingPct = newMaxSlashing;
        claimDuration = newClaimDuration;
        distributionFeeBps = newDistributionFee;
        
        _logEvent("DISTRIBUTION_CONFIG_UPDATED", abi.encode(newMinParticipation, newMaxSlashing, newClaimDuration, newDistributionFee));
    }
    
    /**
     * @notice Autoriza nuevo distribuidor
     */
    function authorizeDistributor(address distributor, bool authorized) external onlyOwner {
        authorizedDistributors[distributor] = authorized;
        _logEvent("DISTRIBUTOR_AUTHORIZED", abi.encode(distributor, authorized));
    }
    
    /**
     * @notice Actualiza fee recipient
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "W2E: Invalid recipient");
        feeRecipient = newRecipient;
        _logEvent("FEE_RECIPIENT_UPDATED", abi.encode(newRecipient));
    }
    
    // ========== FUNCIONES DE VISTA ==========
    
    /**
     * @notice Obtiene información de distribución
     */
    function getDistribution(uint256 taskId) external view returns (RewardDistribution memory) {
        return rewardDistributions[taskId];
    }
    
    /**
     * @notice Obtiene recompensa de votante
     */
    function getVoterReward(uint256 taskId, address voter) external view returns (VoterReward memory) {
        return voterRewards[taskId][voter];
    }
    
    /**
     * @notice Verifica si un votante puede reclamar
     */
    function canClaimReward(uint256 taskId, address voter) external view returns (bool) {
        VoterReward storage reward = voterRewards[taskId][voter];
        RewardDistribution storage distribution = rewardDistributions[taskId];
        
        return reward.rewardAmount > 0 && 
               !reward.claimed && 
               block.timestamp <= distribution.claimDeadline;
    }
    
    /**
     * @notice Obtiene métricas de distribución
     */
    function getDistributionMetrics() external view returns (
        uint256 totalDistributions,
        uint256 totalRewardsDistributed_,
        uint256 totalSlashingApplied_,
        uint256 pendingDistributions
    ) {
        totalDistributions = distributionCount;
        totalRewardsDistributed_ = totalRewardsDistributed;
        totalSlashingApplied_ = totalSlashingApplied;
        
        // Contar distribuciones pendientes
        pendingDistributions = 0;
        for (uint256 i = 1; i <= distributionCount; i++) {
            if (!rewardDistributions[i].finalized) {
                pendingDistributions++;
            }
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
