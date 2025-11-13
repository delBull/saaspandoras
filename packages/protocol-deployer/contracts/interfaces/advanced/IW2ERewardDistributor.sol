// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IW2EUtilityToken.sol";

/**
 * @title IW2ERewardDistributor - Interfaz Avanzada del Distribuidor de Recompensas
 * @notice Interfaz completa para distribución modularizada de recompensas
 * @dev Diseñada para desacoplamiento completo y extensibilidad
 */
interface IW2ERewardDistributor {
    // ========== ESTRUCTURAS ==========
    
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
    
    struct VoterReward {
        uint256 taskId;
        uint256 rewardAmount;
        uint256 slashingAmount;
        bool claimed;
        uint256 claimTime;
        bool isSlashed;
    }
    
    struct WinnerInfo {
        address winner;
        uint256 rewardAmount;
        bool claimed;
    }
    
    // ========== FUNCIONES PRINCIPALES ==========
    
    /**
     * @notice Crea distribución de recompensas para tarea completada
     */
    function createDistribution(
        uint256 taskId,
        uint256 totalReward,
        WinnerInfo[] calldata winners
    ) external;
    
    /**
     * @notice Aplica slashing a votantes incorrectos
     */
    function applySlashing(
        uint256 taskId,
        address[] calldata slashedVoters,
        string calldata reason
    ) external;
    
    // ========== FUNCIONES DE RECLAMACIÓN ==========
    
    /**
     * @notice Reclama recompensa individual
     */
    function claimReward(uint256 taskId) external;
    
    /**
     * @notice Finaliza distribución y reclama recompensas no reclamadas
     */
    function finalizeDistribution(uint256 taskId) external;
    
    // ========== FUNCIONES DE VISTA ==========
    
    /**
     * @notice Obtiene información de distribución
     */
    function getDistribution(uint256 taskId) external view returns (RewardDistribution memory);
    
    /**
     * @notice Obtiene recompensa de votante
     */
    function getVoterReward(uint256 taskId, address voter) external view returns (VoterReward memory);
    
    /**
     * @notice Verifica si un votante puede reclamar
     */
    function canClaimReward(uint256 taskId, address voter) external view returns (bool);
    
    /**
     * @notice Obtiene métricas de distribución
     */
    function getDistributionMetrics() external view returns (
        uint256 totalDistributions,
        uint256 totalRewardsDistributed,
        uint256 totalSlashingApplied,
        uint256 pendingDistributions
    );
    
    // ========== FUNCIONES DE CONFIGURACIÓN ==========
    
    /**
     * @notice Actualiza configuración de distribución
     */
    function updateDistributionConfig(
        uint256 newMinParticipation,
        uint256 newMaxSlashing,
        uint256 newClaimDuration,
        uint256 newDistributionFee
    ) external;
    
    /**
     * @notice Autoriza nuevo distribuidor
     */
    function authorizeDistributor(address distributor, bool authorized) external;
    
    /**
     * @notice Obtiene configuración actual
     */
    function getDistributionConfig() external view returns (
        uint256 minParticipationRewardPct,
        uint256 maxSlashingPct,
        uint256 claimDuration,
        uint256 distributionFeeBps
    );
}