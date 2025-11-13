// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IW2ELicense.sol";

/**
 * @title IW2ETaskManager - Interfaz Avanzada del Gestor de Tareas W2E
 * @notice Interfaz completa para gestión modularizada de tareas
 * @dev Diseñada para desacoplamiento completo y extensibilidad
 */
interface IW2ETaskManager {
    // ========== ESTRUCTURAS ==========
    
    enum TaskStatus { Pending, Active, Approved, Rejected, Executed, Expired }
    enum TaskType { Validation, Sales, Governance, Emergency }
    
    struct W2ETask {
        uint256 id;
        TaskType taskType;
        address creator;
        uint256 rewardAmount;
        uint256 requiredStake;
        uint256 startTime;
        uint256 endTime;
        uint256 approvalVotes;
        uint256 rejectionVotes;
        TaskStatus status;
        address payable fundingRecipient;
        bytes32 offChainProof;
        uint8 priority;
        uint16 complexityScore;
        uint32 estimatedDuration;
        bool executed;
    }
    
    struct VoteInfo {
        bool hasVoted;
        bool support;
        uint256 stakeAmount;
        uint32 voteWeight;
        uint256 voteTime;
    }
    
    // ========== FUNCIONES DE CREACIÓN ==========
    
    /**
     * @notice Crea nueva tarea de validación
     */
    function createValidationTask(
        uint256 rewardAmount,
        uint256 requiredStake,
        string calldata description,
        uint8 priority,
        uint16 complexityScore
    ) external returns (uint256 taskId);
    
    /**
     * @notice Crea tarea de liberación de fondos
     */
    function createFundingTask(
        uint256 amount,
        address payable recipient,
        string calldata description,
        uint8 priority,
        uint16 complexityScore
    ) external returns (uint256 taskId);
    
    /**
     * @notice Crea tarea de emergencia
     */
    function createEmergencyTask(
        uint256 rewardAmount,
        string calldata description,
        uint8 priority,
        uint16 complexityScore
    ) external returns (uint256 taskId);
    
    // ========== FUNCIONES DE VOTACIÓN ==========
    
    /**
     * @notice Vota en una tarea
     */
    function voteOnTask(uint256 taskId, bool support) external;
    
    /**
     * @notice Obtiene información de voto
     */
    function getVote(uint256 taskId, address voter) external view returns (VoteInfo memory);
    
    // ========== FUNCIONES DE FINALIZACIÓN ==========
    
    /**
     * @notice Finaliza una tarea
     */
    function finalizeTask(uint256 taskId) external;
    
    /**
     * @notice Verifica si una tarea puede ser finalizada
     */
    function canFinalizeTask(uint256 taskId) external view returns (bool);
    
    /**
     * @notice Marca tareas expiradas
     */
    function expireTasks() external;
    
    // ========== FUNCIONES DE VISTA ==========
    
    /**
     * @notice Obtiene información completa de tarea
     */
    function getTask(uint256 taskId) external view returns (W2ETask memory);
    
    /**
     * @notice Obtiene métricas de tareas
     */
    function getTaskMetrics() external view returns (
        uint256 totalTasks,
        uint256 activeTasks,
        uint256 pendingTasks,
        uint256 completedTasks
    );
    
    // ========== FUNCIONES DE CONFIGURACIÓN ==========
    
    /**
     * @notice Actualiza parámetros de gobernanza
     */
    function updateGovernanceParams(
        uint256 newQuorum,
        uint256 newVotingPeriod,
        uint256 newEmergencyQuorum
    ) external;
    
    /**
     * @notice Obtiene información de licencia NFT
     */
    function licenseNFT() external view returns (IW2ELicense);
    
    /**
     * @notice Obtiene parámetros de gobernanza actuales
     */
    function getGovernanceParams() external view returns (
        uint256 minQuorumPercentage,
        uint256 votingPeriodSeconds,
        uint256 emergencyQuorumPct
    );
}