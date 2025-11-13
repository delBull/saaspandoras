// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./W2ELicense.sol";
import "../interfaces/IW2ELicense.sol";

/**
 * @title W2EGovernor - Gobernanza DAO W2E Simplificada
 * @notice Sistema de gobernanza simplificado para W2E
 * @dev Gobernanza básica sin timelock para facilitar implementación inicial
 */
contract W2EGovernor is Ownable, ReentrancyGuard {
    // ========== DEPENDENCIAS ==========

    /// @notice Contrato de licencias para votación (usando interfaz para desacoplamiento)
    IW2ELicense public licenseToken;

    /// @notice Dirección del contrato W2ELoom
    address public w2eLoomAddress;

    // ========== CONFIGURACIÓN ==========

    /// @notice Límites y constantes para optimización de gas
    uint256 public constant MIN_QUORUM_PERCENTAGE = 10; // Cuórum mínimo en porcentaje
    uint256 public constant DEFAULT_VOTING_PERIOD = 7 days; // Periodo de votación por defecto
    uint256 public constant MIN_EXECUTION_DELAY = 1 hours; // Delay mínimo para ejecución
    uint256 public constant MIN_VOTING_DELAY_SECONDS = 100; // Delay mínimo antes de votación
    uint256 public constant MAX_VOTING_PERIOD = 30 days; // Periodo máximo de votación

    /// @notice Cuórum mínimo en porcentaje (10 = 10%)
    uint256 public quorumPercentage = 10;

    /// @notice Periodo de votación en segundos (7 días)
    uint256 public votingPeriod = 7 days;

    /// @notice Delay mínimo para ejecutar propuestas (1 hora)
    uint256 public executionDelay = 1 hours;

    /// @notice Delay antes de que empiece la votación (100 bloques por defecto)
    uint256 public votingDelaySeconds = 100;

    // ========== ESTRUCTURAS ==========

    /// @notice Estados de propuesta
    enum ProposalState {
        Pending,
        Active,
        Succeeded,
        Defeated,
        Executed
    }

    /// @notice Tipos de propuestas
    enum ProposalType {
        General,
        Funding,
        Parameter,
        Emergency
    }

    /// @notice Estructura de propuesta
    struct Proposal {
        uint256 id;
        address proposer;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        ProposalState state;
        ProposalType proposalType;
        bool executed;
    }

    /// @notice Votos por propuesta y usuario
    struct Vote {
        bool hasVoted;
        bool support;
        uint256 weight;
    }

    // ========== STORAGE ==========

    /// @notice Mapping de propuestas
    mapping(uint256 => Proposal) public proposals;

    /// @notice Mapping de votos
    mapping(uint256 => mapping(address => Vote)) public votes;

    /// @notice Contador de propuestas activas (optimización de gas)
    uint256 public activeProposalCount;

    /// @notice Contador de propuestas
    uint256 public proposalCount;

    // ========== EVENTOS ==========

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        ProposalType proposalType
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);

    // ========== CONSTRUCTOR ==========

    /**
     * @param _licenseToken Dirección del contrato de licencias
     * @param _w2eLoomAddress Dirección del contrato W2ELoom
     * @param _quorumPercentage Cuórum mínimo en porcentaje (0-100)
     * @param _votingDelaySeconds Delay antes de que empiece la votación
     * @param _votingPeriodSeconds Periodo de votación en segundos
     * @param _executionDelaySeconds Delay antes de ejecución en segundos
     * @param initialOwner Owner inicial
     */
    constructor(
        address _licenseToken,
        address _w2eLoomAddress,
        uint256 _quorumPercentage,
        uint256 _votingDelaySeconds,
        uint256 _votingPeriodSeconds,
        uint256 _executionDelaySeconds,
        address initialOwner
    ) Ownable() {
        require(_licenseToken != address(0), "W2E: Invalid license token");
        require(_w2eLoomAddress != address(0), "W2E: Invalid loom address");
        require(_quorumPercentage >= MIN_QUORUM_PERCENTAGE && _quorumPercentage <= 100, "W2E: Invalid quorum");
        require(_votingDelaySeconds >= MIN_VOTING_DELAY_SECONDS, "W2E: Voting delay too short");
        require(_votingPeriodSeconds >= 1 days && _votingPeriodSeconds <= MAX_VOTING_PERIOD, "W2E: Voting period too short");
        require(_executionDelaySeconds >= MIN_EXECUTION_DELAY, "W2E: Execution delay too short");

        licenseToken = IW2ELicense(_licenseToken); // Usar interfaz para desacoplamiento
        w2eLoomAddress = _w2eLoomAddress;

        quorumPercentage = _quorumPercentage;
        votingDelaySeconds = _votingDelaySeconds;
        votingPeriod = _votingPeriodSeconds;
        executionDelay = _executionDelaySeconds;
    }

    // ========== FUNCIONES DE PROPUESTA ==========

    /**
     * @notice Crea una nueva propuesta
     * @param targets Contratos a llamar
     * @param values Valores a enviar
     * @param calldatas Datos de las llamadas
     * @param description Descripción de la propuesta
     * @return proposalId ID de la propuesta creada
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public returns (uint256) {
        require(targets.length == values.length && values.length == calldatas.length, "W2E: Invalid proposal");
        require(targets.length > 0, "W2E: Empty proposal");

        proposalCount++;
        uint256 proposalId = proposalCount;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            targets: targets,
            values: values,
            calldatas: calldatas,
            description: description,
            startTime: block.timestamp + votingDelaySeconds,
            endTime: block.timestamp + votingDelaySeconds + votingPeriod,
            forVotes: 0,
            againstVotes: 0,
            state: ProposalState.Pending,
            proposalType: ProposalType.General,
            executed: false
        });

        // Optimización de gas: actualizar contador de propuestas activas
        activeProposalCount++;

        emit ProposalCreated(proposalId, msg.sender, description, ProposalType.General);
        return proposalId;
    }

    /**
     * @notice Crea una propuesta de liberación de fondos
     * @param recipient Destinatario de los fondos
     * @param amount Monto a liberar
     * @param description Descripción de la liberación
     * @return proposalId ID de la propuesta
     */
    function proposeFundingRelease(
        address payable recipient,
        uint256 amount,
        string memory description
    ) public returns (uint256) {
        require(recipient != address(0), "W2E: Invalid recipient");
        require(amount > 0, "W2E: Amount must be positive");

        // Codificar llamada al W2ELoom para crear tarea de funding
        bytes memory callData = abi.encodeWithSignature(
            "createFundingTask(uint256,address,string)",
            amount,
            recipient,
            description
        );

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = w2eLoomAddress;
        values[0] = 0;
        calldatas[0] = callData;

        uint256 proposalId = propose(targets, values, calldatas, description);
        proposals[proposalId].proposalType = ProposalType.Funding;

        return proposalId;
    }

    // ========== FUNCIONES DE VOTACIÓN ==========

    /**
     * @notice Vota en una propuesta
     * @param proposalId ID de la propuesta
     * @param support true = a favor, false = en contra
     */
    function vote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Pending || proposal.state == ProposalState.Active, "W2E: Proposal not active");
        require(block.timestamp >= proposal.startTime, "W2E: Voting not started");
        require(block.timestamp <= proposal.endTime, "W2E: Voting ended");
        require(!votes[proposalId][msg.sender].hasVoted, "W2E: Already voted");

        // Verificar que tiene licencia
        uint256 votingPower = licenseToken.getVotes(msg.sender);
        require(votingPower > 0, "W2E: No voting power");

        // Registrar voto
        votes[proposalId][msg.sender] = Vote({
            hasVoted: true,
            support: support,
            weight: votingPower
        });

        // Actualizar contadores
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }

        // Cambiar estado si es la primera vez
        if (proposal.state == ProposalState.Pending) {
            proposal.state = ProposalState.Active;
        }

        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }

    // ========== FUNCIONES DE EJECUCIÓN ==========

    /**
     * @notice Ejecuta una propuesta aprobada
     * @param proposalId ID de la propuesta
     */
    function execute(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "W2E: Already executed");
        require(block.timestamp > proposal.endTime, "W2E: Voting not ended");

        // Verificar resultado
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 totalSupply = licenseToken.totalMinted();
        uint256 quorumRequired = (totalSupply * quorumPercentage) / 100;

        require(totalVotes >= quorumRequired, "W2E: Quorum not reached");
        require(proposal.forVotes > proposal.againstVotes, "W2E: Proposal defeated");

        // Ejecutar llamadas con validación mejorada
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            address target = proposal.targets[i];
            
            // Validación de seguridad: verificar que es un contrato válido
            require(target.code.length > 0, "W2E: Target is not a contract");
            
            // Ejecutar llamada con validación
            (bool success,) = target.call{value: proposal.values[i]}(proposal.calldatas[i]);
            require(success, "W2E: Execution failed");
        }

        proposal.executed = true;
        proposal.state = ProposalState.Executed;

        // Optimización de gas: decrementar contador de propuestas activas
        if (proposal.state == ProposalState.Active) {
            activeProposalCount--;
        }

        emit ProposalExecuted(proposalId);
    }

    // ========== FUNCIONES DE CONFIGURACIÓN ==========

    /**
     * @notice Actualiza el cuórum mínimo
     * @param newQuorum Nuevo porcentaje de cuórum
     */
    function setQuorumPercentage(uint256 newQuorum) external onlyOwner {
        require(newQuorum >= MIN_QUORUM_PERCENTAGE && newQuorum <= 100, "W2E: Invalid quorum");
        quorumPercentage = newQuorum;
    }

    /**
     * @notice Actualiza el periodo de votación
     * @param newPeriod Nuevo periodo en segundos
     */
    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod >= 1 days && newPeriod <= MAX_VOTING_PERIOD, "W2E: Invalid period");
        votingPeriod = newPeriod;
    }

    // ========== FUNCIONES DE VISTA ==========

    /**
     * @notice Obtiene el estado de una propuesta
     * @param proposalId ID de la propuesta
     * @return Estado actual de la propuesta
     */
    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        return proposals[proposalId].state;
    }

    /**
     * @notice Verifica si una propuesta puede ser ejecutada
     * @param proposalId ID de la propuesta
     * @return True si puede ser ejecutada
     */
    function canExecute(uint256 proposalId) external view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.executed || block.timestamp <= proposal.endTime) {
            return false;
        }

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 totalSupply = licenseToken.totalMinted();
        uint256 quorumRequired = (totalSupply * quorumPercentage) / 100;

        return totalVotes >= quorumRequired && proposal.forVotes > proposal.againstVotes;
    }

    /**
     * @notice Obtiene métricas de gobernanza (optimizado para gas)
     * @return totalProposals Total de propuestas, activeProposals Propuestas activas
     */
    function getGovernanceMetrics()
        external
        view
        returns (uint256 totalProposals, uint256 activeProposals)
    {
        totalProposals = proposalCount;
        activeProposals = activeProposalCount; // Optimización: usar contador mantenido
    }

}
