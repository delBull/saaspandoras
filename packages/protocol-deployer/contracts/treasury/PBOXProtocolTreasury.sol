// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PBOXProtocolTreasury - Tesorería Específica de Protocolo
 * @notice Tesorería híbrida para fondos específicos de cada protocolo
 * @dev Control compartido entre Pandora (pandoraOracle) y DAO del protocolo
 */
contract PBOXProtocolTreasury is Ownable, ReentrancyGuard, Pausable {
    // ========== CONFIGURACIÓN HÍBRIDA ==========
    
    /// @notice Signatarios de Pandora (CEO, CTO, Legal)
    mapping(address => bool) public pandoraSigners;
    
    /// @notice Signatarios del DAO del protocolo
    mapping(address => bool) public daoSigners;
    
    /// @notice Confirmaciones requeridas de Pandora
    uint256 public requiredPandoraConfirmations;
    
    /// @notice Confirmaciones requeridas del DAO
    uint256 public requiredDaoConfirmations;
    
    /// @notice Oráculo de Pandora autorizado
    address public pandoraOracle;
    
    /// @notice Dirección del contrato de gobernanza del protocolo
    address public protocolGovernor;
    
    // ========== CONFIGURACIÓN DE SEGURIDAD ==========
    
    /// @notice Umbral para aplicar reglas de emergencia
    uint256 public emergencyThreshold;
    
    /// @notice Periodo de inactividad para activar emergencia (días)
    uint256 public emergencyInactivityDays;
    
    /// @notice Límite para operaciones directas sin confirmación dual
    uint256 public directOperationLimit;
    
    // ========== PROPuestas DE RETIRO ==========
    
    enum ProposalStatus { Pending, Approved, Rejected, Executed, Cancelled }
    enum SignerType { None, Pandora, DAO, Both }
    
    struct WithdrawalProposal {
        address recipient;
        uint256 amount;
        bytes32 purposeHash; // Reemplaza string purpose para optimizar gas
        uint256 pandoraConfirmations;
        uint256 daoConfirmations;
        uint256 timestamp;
        ProposalStatus status;
        bool expired;
        mapping(address => bool) pandoraConfirmed;
        mapping(address => bool) daoConfirmed;
    }
    
    mapping(uint256 => WithdrawalProposal) public proposals;
    uint256 public proposalCount;
    
    // ========== CONFIGURACIÓN OPERATIVA ==========
    
    /// @notice Límite diario para gastos operativos
    uint256 public dailySpendingLimit;
    
    /// @notice Monto ya gastado en el día actual
    uint256 public spentToday;
    
    /// @notice Timestamp del último reset de límite diario
    uint256 public lastDailyReset;
    
    // ========== EVENTOS ==========
    
    event ProposalCreated(
        uint256 indexed proposalId, 
        address indexed recipient, 
        uint256 amount, 
        string purpose
    );
    
    event PandoraConfirmed(uint256 indexed proposalId, address indexed signer);
    event DAOConfirmed(uint256 indexed proposalId, address indexed signer);
    event ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount);
    event ProposalRejected(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event DailyLimitReset(uint256 newSpentAmount, uint256 resetTimestamp);
    
    // ========== CONSTRUCTOR ==========
    
    constructor(
        address[] memory _pandoraSigners,
        address[] memory _daoSigners,
        address _pandoraOracle,
        address _protocolGovernor,
        uint256 _requiredPandoraConfirmations,
        uint256 _requiredDaoConfirmations,
        uint256 _emergencyThreshold,
        uint256 _emergencyInactivityDays,
        uint256 _directOperationLimit,
        uint256 _dailySpendingLimit,
        address initialOwner
    ) Ownable() {
        require(_pandoraSigners.length >= 2, "W2E: Need at least 2 Pandora signers");
        require(_daoSigners.length >= 3, "W2E: Need at least 3 DAO signers");
        require(_pandoraOracle != address(0), "W2E: Invalid oracle");
        require(_protocolGovernor != address(0), "W2E: Invalid governor");
        require(_requiredPandoraConfirmations >= 1 && _requiredPandoraConfirmations <= _pandoraSigners.length, "W2E: Invalid Pandora confirmations");
        require(_requiredDaoConfirmations >= 2 && _requiredDaoConfirmations <= _daoSigners.length, "W2E: Invalid DAO confirmations");
        
        // Configurar signatarios de Pandora
        for (uint256 i = 0; i < _pandoraSigners.length; i++) {
            require(_pandoraSigners[i] != address(0), "W2E: Invalid Pandora signer");
            require(!pandoraSigners[_pandoraSigners[i]], "W2E: Duplicate Pandora signer");
            pandoraSigners[_pandoraSigners[i]] = true;
        }
        
        // Configurar signatarios del DAO
        for (uint256 i = 0; i < _daoSigners.length; i++) {
            require(_daoSigners[i] != address(0), "W2E: Invalid DAO signer");
            require(!daoSigners[_daoSigners[i]], "W2E: Duplicate DAO signer");
            daoSigners[_daoSigners[i]] = true;
        }
        
        requiredPandoraConfirmations = _requiredPandoraConfirmations;
        requiredDaoConfirmations = _requiredDaoConfirmations;
        pandoraOracle = _pandoraOracle;
        protocolGovernor = _protocolGovernor;
        emergencyThreshold = _emergencyThreshold;
        emergencyInactivityDays = _emergencyInactivityDays;
        directOperationLimit = _directOperationLimit;
        dailySpendingLimit = _dailySpendingLimit;
        lastDailyReset = block.timestamp;
        
        // Transferir ownership al governor del protocolo
        transferOwnership(_protocolGovernor);
    }
    
    // ========== MODIFICADORES ==========
    
    modifier onlyPandoraSigner() {
        require(pandoraSigners[msg.sender], "W2E: Not Pandora signer");
        _;
    }
    
    modifier onlyDaoSigner() {
        require(daoSigners[msg.sender], "W2E: Not DAO signer");
        _;
    }
    
    modifier onlyPandoraOracle() {
        require(msg.sender == pandoraOracle, "W2E: Not Pandora oracle");
        _;
    }
    
    // ========== FUNCIONES DE PROPUESTAS ==========
    
    /**
     * @notice Crea propuesta de retiro con aprobación dual
     * @param recipient Destinatario de los fondos
     * @param amount Monto a retirar
     * @param purposeHash Hash del propósito (off-chain reference)
     * @return proposalId ID de la propuesta
     */
    function createWithdrawalProposal(
        address recipient,
        uint256 amount,
        bytes32 purposeHash
    ) external onlyOwner returns (uint256) {
        require(recipient != address(0), "W2E: Invalid recipient");
        require(amount > 0, "W2E: Amount must be positive");
        require(amount <= address(this).balance, "W2E: Insufficient balance");
        require(purposeHash != bytes32(0), "W2E: Invalid purpose hash");
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        proposals[proposalId].recipient = recipient;
        proposals[proposalId].amount = amount;
        proposals[proposalId].purposeHash = purposeHash;
        proposals[proposalId].timestamp = block.timestamp;
        proposals[proposalId].status = ProposalStatus.Pending;
        
        emit ProposalCreated(proposalId, recipient, amount, ""); // String no almacenada
        return proposalId;
    }
    
    /**
     * @notice Confirma propuesta por signatario de Pandora
     * @param proposalId ID de la propuesta
     */
    function confirmByPandora(uint256 proposalId) external onlyPandoraSigner {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Pending, "W2E: Proposal not pending");
        require(!proposal.pandoraConfirmed[msg.sender], "W2E: Already confirmed by this signer");
        
        proposal.pandoraConfirmed[msg.sender] = true;
        proposal.pandoraConfirmations++;
        
        emit PandoraConfirmed(proposalId, msg.sender);
        _checkProposalStatus(proposalId);
    }
    
    /**
     * @notice Confirma propuesta por signatario del DAO
     * @param proposalId ID de la propuesta
     */
    function confirmByDAO(uint256 proposalId) external onlyDaoSigner {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Pending, "W2E: Proposal not pending");
        require(!proposal.daoConfirmed[msg.sender], "W2E: Already confirmed by this signer");
        
        proposal.daoConfirmed[msg.sender] = true;
        proposal.daoConfirmations++;
        
        emit DAOConfirmed(proposalId, msg.sender);
        _checkProposalStatus(proposalId);
    }
    
    /**
     * @notice Verifica y actualiza estado de propuesta
     * @param proposalId ID de la propuesta
     */
    function _checkProposalStatus(uint256 proposalId) internal {
        WithdrawalProposal storage proposal = proposals[proposalId];
        
        if (proposal.pandoraConfirmations >= requiredPandoraConfirmations &&
            proposal.daoConfirmations >= requiredDaoConfirmations) {
            proposal.status = ProposalStatus.Approved;
        }
    }
    
    /**
     * @notice Ejecuta propuesta aprobada (solo pandoraOracle o pandoraSigner)
     * @param proposalId ID de la propuesta
     */
    function executeProposal(uint256 proposalId) external onlyPandoraOracle nonReentrant {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Approved, "W2E: Proposal not approved");
        require(!proposal.expired, "W2E: Proposal expired");
        
        proposal.status = ProposalStatus.Executed;
        
        // Verificar límites diarios
        _checkAndUpdateDailyLimit(proposal.amount);
        
        // Transferir fondos
        (bool success,) = proposal.recipient.call{value: proposal.amount}("");
        require(success, "W2E: Transfer failed");
        
        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }
    
    /**
     * @notice Ejecuta propuesta aprobada (alternativa para pandoraSigner)
     * @param proposalId ID de la propuesta
     */
    function executeProposalBySigner(uint256 proposalId) external onlyPandoraSigner nonReentrant {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Approved, "W2E: Proposal not approved");
        require(!proposal.expired, "W2E: Proposal expired");
        
        // Verificar que al menos 2 signatarios de Pandora hayan confirmado
        require(proposal.pandoraConfirmations >= 2, "W2E: Insufficient Pandora confirmations");
        
        proposal.status = ProposalStatus.Executed;
        
        _checkAndUpdateDailyLimit(proposal.amount);
        
        (bool success,) = proposal.recipient.call{value: proposal.amount}("");
        require(success, "W2E: Transfer failed");
        
        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }
    
    /**
     * @notice Rechaza propuesta
     * @param proposalId ID de la propuesta
     */
    function rejectProposal(uint256 proposalId) external {
        require(msg.sender == pandoraOracle || daoSigners[msg.sender], "W2E: Not authorized to reject");
        
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Pending, "W2E: Proposal not pending");
        
        proposal.status = ProposalStatus.Rejected;
        emit ProposalRejected(proposalId);
    }
    
    // ========== FUNCIONES OPERATIVAS ==========
    
    /**
     * @notice Verifica y actualiza límites diarios
     * @param amount Cantidad a gastar
     */
    function _checkAndUpdateDailyLimit(uint256 amount) internal {
        if (block.timestamp >= lastDailyReset + 1 days) {
            spentToday = 0;
            lastDailyReset = block.timestamp;
            emit DailyLimitReset(spentToday, lastDailyReset);
        }
        
        require(spentToday + amount <= dailySpendingLimit, "W2E: Daily limit exceeded");
        spentToday += amount;
    }
    
    /**
     * @notice Operación directa dentro de límites (emergencia/pagos menores)
     * @param recipient Destinatario
     * @param amount Monto
     * @param purpose Propósito
     */
    function directOperation(address recipient, uint256 amount, string calldata purpose) 
        external 
        onlyPandoraOracle 
        nonReentrant 
    {
        require(amount <= directOperationLimit, "W2E: Amount exceeds direct operation limit");
        require(amount <= address(this).balance, "W2E: Insufficient balance");
        
        _checkAndUpdateDailyLimit(amount);
        
        (bool success,) = recipient.call{value: amount}("");
        require(success, "W2E: Direct operation failed");
        
        emit OperationalWithdrawal(recipient, amount, purpose);
    }
    
    // ========== FUNCIONES DE EMERGENCIA ==========
    
    /**
     * @notice Activa liberación de emergencia por inactividad
     * @param proposalId ID de la propuesta a ejecutar
     */
    function emergencyExecutionByInactivity(uint256 proposalId) external onlyPandoraOracle {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(proposal.amount >= emergencyThreshold, "W2E: Amount below emergency threshold");
        require(block.timestamp >= proposal.timestamp + (emergencyInactivityDays * 1 days), "W2E: Emergency period not met");
        
        proposal.status = ProposalStatus.Executed;
        
        _checkAndUpdateDailyLimit(proposal.amount);
        
        (bool success,) = proposal.recipient.call{value: proposal.amount}("");
        require(success, "W2E: Emergency transfer failed");
        
        emit EmergencyExecution(proposalId, proposal.recipient, proposal.amount);
    }
    
    // ========== FUNCIONES DE CONFIGURACIÓN ==========
    
    /**
     * @notice Actualiza límites diarios
     * @param newDailyLimit Nuevo límite diario
     * @param newDirectLimit Nuevo límite de operación directa
     */
    function updateLimits(uint256 newDailyLimit, uint256 newDirectLimit) external onlyOwner {
        require(newDailyLimit > 0 && newDirectLimit > 0, "W2E: Invalid limits");
        require(newDirectLimit <= newDailyLimit, "W2E: Direct limit must be <= daily limit");
        
        dailySpendingLimit = newDailyLimit;
        directOperationLimit = newDirectLimit;
    }
    
    /**
     * @notice Actualiza parámetros de emergencia
     * @param newThreshold Nuevo umbral de emergencia
     * @param newInactivityDays Nuevos días de inactividad
     */
    function updateEmergencyParams(uint256 newThreshold, uint256 newInactivityDays) external onlyOwner {
        require(newThreshold > 0, "W2E: Invalid threshold");
        require(newInactivityDays >= 7, "W2E: Invalid inactivity period");
        
        emergencyThreshold = newThreshold;
        emergencyInactivityDays = newInactivityDays;
    }
    
    // ========== FUNCIONES DE VISTA ==========
    
    /**
     * @notice Verifica si una propuesta puede ser ejecutada
     * @param proposalId ID de la propuesta
     * @return Estado de ejecutabilidad
     */
    function canExecute(uint256 proposalId) external view returns (bool) {
        WithdrawalProposal storage proposal = proposals[proposalId];
        return proposal.status == ProposalStatus.Approved && !proposal.expired;
    }
    
    /**
     * @notice Obtiene balance disponible
     * @return Balance del contrato
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Obtiene información de propuesta
     * @param proposalId ID de la propuesta
     * @return recipient Dirección del destinatario
     * @return amount Monto de la propuesta
     * @return purposeHash Hash del propósito de la propuesta
     * @return pandoraConfirmations Confirmaciones de Pandora
     * @return daoConfirmations Confirmaciones del DAO
     * @return status Estado de la propuesta
     * @return expired Si ha expirado la propuesta
     */
    function getProposalInfo(uint256 proposalId) external view returns (
        address recipient,
        uint256 amount,
        bytes32 purposeHash,
        uint256 pandoraConfirmations,
        uint256 daoConfirmations,
        ProposalStatus status,
        bool expired
    ) {
        WithdrawalProposal storage proposal = proposals[proposalId];
        return (
            proposal.recipient,
            proposal.amount,
            proposal.purposeHash,
            proposal.pandoraConfirmations,
            proposal.daoConfirmations,
            proposal.status,
            proposal.expired
        );
    }
    
    // ========== EVENTOS ADICIONALES ==========
    
    event OperationalWithdrawal(address indexed recipient, uint256 amount, string purpose);
    event EmergencyExecution(uint256 indexed proposalId, address indexed recipient, uint256 amount);
    
    // ========== FUNCIONES DE ACTIVACIÓN ==========

    /**
     * @notice Activa el protocolo cuando se alcanzan las condiciones
     * @dev Callable por la fábrica después del despliegue
     */
    function activateProtocol() external onlyOwner {
        // Protocolo activado - lógica adicional puede agregarse aquí
    }

    // ========== FUNCIONES DE PAUSA (PAUSABLE) ==========

    /**
     * @notice Pausa la tesorería
     * @dev Solo callable por el owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Reanuda la tesorería pausada
     * @dev Solo callable por el owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ========== FUNCIONES RECEIVED ==========

    /**
     * @notice Permite recibir ETH
     */
    receive() external payable {
        // Permitir depósitos
    }
}
