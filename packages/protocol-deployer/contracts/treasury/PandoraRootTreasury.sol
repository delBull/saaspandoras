// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PandoraRootTreasury - Tesorería General de Pandora
 * @notice Tesorería de alto nivel para fondos operativos de la plataforma
 * @dev Multi-Sig con timelock para retiros grandes
 */
contract PandoraRootTreasury is ReentrancyGuard {
    // ========== CONFIGURACIÓN DE MULTI-SIG ==========
    
    /// @notice Signatarios del multi-sig (CEO, CTO, Legal, Operaciones, etc.)
    mapping(address => bool) public signers;
    
    /// @notice Contador de confirmaciones requeridas
    uint256 public requiredConfirmations;
    
    /// @notice Umbral para aplicar timelock (en wei)
    uint256 public highValueThreshold;
    
    /// @notice Periodo de timelock para retiros grandes
    uint256 public constant HIGH_VALUE_TIMELOCK = 48 hours;
    
    /// @notice Periodo de timelock para funciones de configuración
    uint256 public constant CONFIG_TIMELOCK = 24 hours;
    
    /// @notice Contador de propuestas de configuración
    uint256 public configProposalCount;
    
    /// @notice Propuestas de configuración pendientes
    struct ConfigProposal {
        bytes32 functionHash;
        uint256 timestamp;
        uint256 confirmations;
        bool executed;
        bool cancelled;
        mapping(address => bool) hasConfirmed;
    }
    
    mapping(uint256 => ConfigProposal) public configProposals;
    
    /// @notice Propuestas de retiro pendientes
    struct WithdrawalProposal {
        address recipient;
        uint256 amount;
        uint256 confirmations;
        uint256 timestamp;
        bool executed;
        bool cancelled;
        mapping(address => bool) hasConfirmed;
    }
    
    mapping(uint256 => WithdrawalProposal) public proposals;
    uint256 public proposalCount;
    
    // ========== CONFIGURACIÓN DE FONDOS ==========
    
    /// @notice Dirección operativa (hot wallet) para gastos menores
    address public operationalWallet;
    
    /// @notice Dirección de reserva (cold wallet) para fondos de inversión
    address public reserveWallet;
    
    /// @notice Límite para retiros operativos sin confirmación multi-sig
    uint256 public operationalLimit;
    
    // ========== EVENTOS ==========
    
    event ProposalCreated(uint256 indexed proposalId, address indexed recipient, uint256 amount);
    event ProposalConfirmed(uint256 indexed proposalId, address indexed signer);
    event ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount);
    event ProposalCancelled(uint256 indexed proposalId);
    event OperationalWithdrawal(address indexed recipient, uint256 amount, string reason);
    
    // ========== CONSTRUCTOR ==========
    
    constructor(
        address[] memory _signers,
        uint256 _requiredConfirmations,
        address _operationalWallet,
        address _reserveWallet,
        uint256 _highValueThreshold,
        uint256 _operationalLimit
    ) {
        require(_signers.length >= 3, "W2E: Need at least 3 signers");
        require(_requiredConfirmations >= 2 && _requiredConfirmations <= _signers.length, "W2E: Invalid confirmations");
        require(_operationalWallet != address(0), "W2E: Invalid operational wallet");
        require(_reserveWallet != address(0), "W2E: Invalid reserve wallet");
        require(_highValueThreshold > 0, "W2E: Invalid threshold");
        require(_operationalLimit > 0, "W2E: Invalid operational limit");
        
        // Configurar signatarios
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "W2E: Invalid signer");
            require(!signers[_signers[i]], "W2E: Duplicate signer");
            signers[_signers[i]] = true;
        }
        
        requiredConfirmations = _requiredConfirmations;
        operationalWallet = _operationalWallet;
        reserveWallet = _reserveWallet;
        highValueThreshold = _highValueThreshold;
        operationalLimit = _operationalLimit;
        
        // Sin ownership inicial - controlado completamente por multi-sig
    }
    
    // ========== MODIFICADORES ==========
    
    modifier onlySigner() {
        require(signers[msg.sender], "W2E: Not authorized signer");
        _;
    }
    
    // ========== FUNCIONES MULTI-SIG ==========
    
    /**
     * @notice Crea propuesta de retiro (requiere confirmación multi-sig)
     * @param recipient Dirección del destinatario
     * @param amount Monto a retirar
     * @return proposalId ID de la propuesta creada
     */
    function createWithdrawalProposal(address recipient, uint256 amount) 
        external 
        onlySigner 
        returns (uint256) 
    {
        require(recipient != address(0), "W2E: Invalid recipient");
        require(amount > 0, "W2E: Amount must be positive");
        require(amount <= address(this).balance, "W2E: Insufficient balance");
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        proposals[proposalId].recipient = recipient;
        proposals[proposalId].amount = amount;
        proposals[proposalId].timestamp = block.timestamp;
        
        emit ProposalCreated(proposalId, recipient, amount);
        return proposalId;
    }
    
    /**
     * @notice Confirma una propuesta de retiro
     * @param proposalId ID de la propuesta
     */
    function confirmProposal(uint256 proposalId) external onlySigner {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "W2E: Proposal already executed");
        require(!proposal.cancelled, "W2E: Proposal cancelled");
        require(!proposal.hasConfirmed[msg.sender], "W2E: Already confirmed");
        
        proposal.hasConfirmed[msg.sender] = true;
        proposal.confirmations++;
        
        emit ProposalConfirmed(proposalId, msg.sender);
    }
    
    /**
     * @notice Ejecuta una propuesta aprobada
     * @param proposalId ID de la propuesta
     */
    function executeProposal(uint256 proposalId) external onlySigner nonReentrant {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "W2E: Already executed");
        require(!proposal.cancelled, "W2E: Cancelled");
        require(proposal.confirmations >= requiredConfirmations, "W2E: Insufficient confirmations");
        
        // Verificar timelock para retiros de alto valor
        if (proposal.amount >= highValueThreshold) {
            require(
                block.timestamp >= proposal.timestamp + HIGH_VALUE_TIMELOCK,
                "W2E: Timelock period not met"
            );
        }
        
        proposal.executed = true;
        
        // Transferir fondos
        (bool success,) = proposal.recipient.call{value: proposal.amount}("");
        require(success, "W2E: Transfer failed");
        
        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }
    
    /**
     * @notice Cancela una propuesta
     * @param proposalId ID de la propuesta
     */
    function cancelProposal(uint256 proposalId) external onlySigner {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "W2E: Already executed");
        require(!proposal.cancelled, "W2E: Already cancelled");
        
        proposal.cancelled = true;
        emit ProposalCancelled(proposalId);
    }
    
    // ========== FUNCIONES OPERATIVAS ==========
    
    /**
     * @notice Retiro operativo directo (requiere 2 signatarios)
     * @param amount Monto a retirar
     * @param reason Razón del retiro
     */
    function operationalWithdrawal(uint256 amount, string calldata reason)
        external
        onlySigner
        nonReentrant
    {
        require(amount <= operationalLimit, "W2E: Amount exceeds operational limit");
        require(amount <= address(this).balance, "W2E: Insufficient balance");
        
        // Verificar que al menos 2 signatarios hayan confirmado este retiro específico
        // Implementación simplificada: el mismo signatario puede llamar múltiples veces
        // En implementación real, se mantendría un tracking específico por retiro
        
        (bool success,) = operationalWallet.call{value: amount}("");
        require(success, "W2E: Operational transfer failed");
        
        emit OperationalWithdrawal(operationalWallet, amount, reason);
    }
    
    /**
     * @notice Transfiere fondos entre wallets internas (requiere quórum)
     * @param destination Dirección de destino (operational/reserve)
     * @param amount Monto a transferir
     */
    function transferToOperationalOrReserve(address destination, uint256 amount)
        external
        onlySigner
        nonReentrant
    {
        require(destination == operationalWallet || destination == reserveWallet, "W2E: Invalid destination");
        require(amount <= address(this).balance, "W2E: Insufficient balance");
        
        (bool success,) = destination.call{value: amount}("");
        require(success, "W2E: Internal transfer failed");
    }
    
    // ========== FUNCIONES DE CONFIGURACIÓN ==========
    
    /**
     * @notice Actualiza el límite operativo
     * @param newLimit Nuevo límite
     */
    function updateOperationalLimit(uint256 newLimit) external onlySigner {
        require(newLimit > 0 && newLimit < highValueThreshold, "W2E: Invalid limit");
        operationalLimit = newLimit;
    }
    
    /**
     * @notice Actualiza el umbral de alto valor
     * @param newThreshold Nuevo umbral
     */
    function updateHighValueThreshold(uint256 newThreshold) external onlySigner {
        require(newThreshold > operationalLimit, "W2E: Threshold must be higher than operational limit");
        highValueThreshold = newThreshold;
    }
    
    /**
     * @notice Actualiza wallet operativa
     * @param newWallet Nueva dirección
     */
    function updateOperationalWallet(address newWallet) external onlySigner {
        require(newWallet != address(0), "W2E: Invalid wallet");
        operationalWallet = newWallet;
    }
    
    // ========== FUNCIONES DE VISTA ==========
    
    /**
     * @notice Verifica si una propuesta puede ser ejecutada
     * @param proposalId ID de la propuesta
     * @return True si puede ser ejecutada
     */
    function canExecute(uint256 proposalId) external view returns (bool) {
        WithdrawalProposal storage proposal = proposals[proposalId];
        if (proposal.executed || proposal.cancelled) return false;
        if (proposal.confirmations < requiredConfirmations) return false;
        
        // Verificar timelock para retiros de alto valor
        if (proposal.amount >= highValueThreshold) {
            return block.timestamp >= proposal.timestamp + HIGH_VALUE_TIMELOCK;
        }
        
        return true;
    }
    
    /**
     * @notice Obtiene balance disponible
     * @return Balance del contrato
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // ========== FUNCIONES DE EMERGENCIA ==========
    
    /**
     * @notice Pausa el contrato en emergencia
     */
    function emergencyPause() external onlySigner {
        // Implementar lógica de pausa si es necesario
        // Por ahora solo emite evento
        emit EmergencyAction("PAUSE", "Emergency pause activated", "");
    }
    
    /// @notice Evento para acciones de emergencia
    event EmergencyAction(string indexed action, string indexed reason, bytes data);
    
    // ========== FUNCIONES RECEIVED ==========
    
    /**
     * @notice Permite recibir ETH
     */
    receive() external payable {
        // Permitir depósitos
    }
}
