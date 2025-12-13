// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

/**
 * @title W2ELicense - Licencia de Acceso W2E
 * @notice Contrato ERC-721A para licencias de acceso al sistema Work-to-Earn
 * @dev Otorga derechos de participación en validación, votación y recompensas
 */
contract W2ELicense is ERC721A, Ownable, ERC2981 {
    // ========== ESTADO DEL CONTRATO ==========
    
    // ... (Existing state variables) ...

    /// @notice Dirección autorizada para mintear licencias (backend de Pandora)
    address public pandoraOracle;

    /// @notice Supply máximo de licencias
    uint256 public maxSupply;

    /// @notice Precio base de la licencia (en wei)
    uint256 public licensePrice;

    /// @notice Dirección de la tesorería para recaudar fondos
    address public treasuryAddress;

    /// @notice Fase actual del protocolo (1, 2, 3...)
    uint256 public phaseId;

    /// @notice Supply máximo por fase
    mapping(uint256 => uint256) public phaseMaxSupply;

    /// @notice Contador de uso por licencia
    mapping(uint256 => uint256) public licenseUsageCount;

    // ========== EVENTOS ==========

    event LicenseMinted(address indexed recipient, uint256 quantity, uint256 totalMinted);
    event LicenseUpgraded(uint256 indexed tokenId, uint256 oldPhase, uint256 newPhase);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event LicensePriceUpdated(uint256 indexed oldPrice, uint256 indexed newPrice);
    event RoyaltyUpdated(address indexed receiver, uint96 feeNumerator);

    // ========== CONSTRUCTOR ==========

    /**
     * @param name Nombre del token ERC-721 (ej: "Licencia Vista Horizonte")
     * @param symbol Símbolo del token ERC-721 (ej: "VHORA")
     * @param _maxSupply Supply máximo de licencias
     * @param _licensePrice Precio base de la licencia en wei
     * @param _pandoraOracle Dirección del oráculo autorizado
     * @param _treasuryAddress Dirección de la tesorería
     * @param initialOwner Owner inicial del contrato
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        uint256 _licensePrice,
        address _pandoraOracle,
        address _treasuryAddress,
        address initialOwner
    ) ERC721A(name, symbol) Ownable() {
        require(_maxSupply > 0, "W2E: Max supply must be positive");
        // require(_licensePrice > 0, "W2E: License price must be positive"); // COMENTADO: Permitir precio 0 (Free)
        require(_pandoraOracle != address(0), "W2E: Invalid oracle address");
        require(_treasuryAddress != address(0), "W2E: Invalid treasury address");

        maxSupply = _maxSupply;
        licensePrice = _licensePrice;
        pandoraOracle = _pandoraOracle;
        treasuryAddress = _treasuryAddress;

        // Inicializar fase 1 con el supply máximo total
        phaseId = 1;
        phaseMaxSupply[1] = _maxSupply;

        // Configurar Royalty por defecto (5% a la tesorería)
        _setDefaultRoyalty(_treasuryAddress, 500);
    }

    // ... (Existing modifiers and mint functions) ...

    // ========== FUNCIONES DE ADMINISTRACIÓN ==========

    /**
     * @notice Actualiza la configuración de Royalties (ERC2981)
     * @param receiver Dirección que recibe los royalties
     * @param feeNumerator Porcentaje en basis points (ej: 500 = 5%)
     */
    function setRoyaltyInfo(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
        emit RoyaltyUpdated(receiver, feeNumerator);
    }

    // ... (Existing setPandoraOracle, setTreasuryAddress, setLicensePrice) ...

    /**
     * @dev Override supportsInterface para resolver conflictos de herencia
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721A, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    // ... (Rest of existing functions) ...

    // ========== MODIFICADORES ==========

    /// @notice Solo el oráculo de Pandora puede llamar
    modifier onlyPandoraOracle() {
        require(msg.sender == pandoraOracle, "W2E: Not Pandora Oracle");
        _;
    }

    // ========== FUNCIONES DE MINTING ==========

    /**
     * @notice Mintea nuevas licencias
     * @dev Solo callable por el backend verificado después de KYC/TOS off-chain
     * @param recipient Dirección del destinatario
     * @param quantity Cantidad de licencias a mintear
     */
    function mintLicense(address recipient, uint256 quantity)
        external
        onlyPandoraOracle
    {
        uint256 newTotal = _totalMinted() + quantity;
        require(newTotal <= maxSupply, "W2E: Max supply reached");
        require(recipient != address(0), "W2E: Invalid recipient");

        _safeMint(recipient, quantity);

        emit LicenseMinted(recipient, quantity, newTotal);
    }

    /**
     * @notice Mintea licencias con pago
     * @dev Permite a usuarios mintear pagando el precio establecido
     * @param quantity Cantidad de licencias a mintear
     */
    function mintWithPayment(uint256 quantity) external payable {
        require(quantity > 0, "W2E: Quantity must be positive");
        require(msg.value >= licensePrice * quantity, "W2E: Insufficient payment");

        uint256 newTotal = _totalMinted() + quantity;
        require(newTotal <= maxSupply, "W2E: Max supply reached");

        _safeMint(msg.sender, quantity);

        // Transferir fondos a tesorería
        (bool success,) = treasuryAddress.call{value: msg.value}("");
        require(success, "W2E: Treasury transfer failed");

        emit LicenseMinted(msg.sender, quantity, newTotal);
    }

    // ========== FUNCIONES DE ADMINISTRACIÓN ==========

    /**
     * @notice Actualiza la dirección del oráculo
     * @param newOracle Nueva dirección del oráculo
     */
    function setPandoraOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "W2E: Invalid oracle address");
        address oldOracle = pandoraOracle;
        pandoraOracle = newOracle;

        emit OracleUpdated(oldOracle, newOracle);
    }

    /**
     * @notice Actualiza la dirección de la tesorería
     * @param newTreasury Nueva dirección de la tesorería
     */
    function setTreasuryAddress(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "W2E: Invalid treasury address");
        address oldTreasury = treasuryAddress;
        treasuryAddress = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Actualiza el precio de la licencia
     * @param newPrice Nuevo precio en wei
     */
    function setLicensePrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = licensePrice;
        licensePrice = newPrice;
        emit LicensePriceUpdated(oldPrice, newPrice);
    }

    // ========== FUNCIONES DE VISTA ==========

    /**
     * @notice Verifica si una dirección tiene una licencia activa
     * @param account Dirección a verificar
     * @return True si tiene al menos una licencia
     */
    function hasActiveLicense(address account) external view returns (bool) {
        return balanceOf(account) > 0;
    }

    /**
     * @notice Obtiene el poder de voto de una dirección (1 licencia = 1 voto)
     * @param account Dirección a consultar
     * @return Número de votos (igual al balance de licencias)
     */
    function getVotes(address account) external view returns (uint256) {
        return balanceOf(account);
    }

    /**
     * @notice Obtiene el total de licencias minteadas
     * @return Total minteado
     */
    function totalMinted() external view returns (uint256) {
        return _totalMinted();
    }

    /**
     * @notice Obtiene el total de licencias disponibles para mintear
     * @return Supply restante
     */
    function remainingSupply() external view returns (uint256) {
        return maxSupply - _totalMinted();
    }

    // ========== FUNCIONES DE SOBREESCRITURA ERC721A ==========

    /**
     * @dev Sobrescribe _startTokenId para empezar desde el token ID 1
     */
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    /**
     * @dev Sobrescribe tokenURI para incluir metadata personalizada
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "W2E: Token does not exist");

        // TODO: Implementar metadata dinámica basada en tokenId
        // Por ahora retorna URI básico
        return string(abi.encodePacked("https://api.pandoras.com/license/", Strings.toString(tokenId)));
    }

    // ========== FUNCIONES DE FASES Y UPGRADES ==========

    /**
     * @notice Actualiza a una nueva fase del protocolo
     * @dev Solo callable por el owner para avanzar fases
     * @param newPhaseId Nueva fase (2, 3, 4...)
     * @param newPhaseMaxSupply Supply máximo para la nueva fase
     */
    function advanceToPhase(uint256 newPhaseId, uint256 newPhaseMaxSupply)
        external
        onlyOwner
    {
        require(newPhaseId > phaseId, "W2E: Can only advance to higher phase");
        require(newPhaseMaxSupply > 0, "W2E: Phase supply must be positive");

        phaseId = newPhaseId;
        phaseMaxSupply[newPhaseId] = newPhaseMaxSupply;

        // Ajustar el supply máximo total si es necesario
        if (newPhaseMaxSupply > maxSupply) {
            maxSupply = newPhaseMaxSupply;
        }
    }

    /**
     * @notice Registra el uso de una licencia
     * @dev Callable por contratos autorizados para trackear actividad
     * @param tokenId ID de la licencia
     */
    function recordLicenseUsage(uint256 tokenId)
        external
        onlyPandoraOracle
    {
        require(_exists(tokenId), "W2E: License does not exist");
        licenseUsageCount[tokenId]++;
    }

    /**
     * @notice Upgrade una licencia a una fase superior
     * @dev Solo callable por el oráculo después de verificar requisitos off-chain
     * @param tokenId ID de la licencia a upgradear
     * @param newPhaseId Nueva fase objetivo
     */
    function upgradeLicense(uint256 tokenId, uint256 newPhaseId)
        external
        onlyPandoraOracle
    {
        require(_exists(tokenId), "W2E: License does not exist");
        require(newPhaseId > getLicensePhase(tokenId), "W2E: Can only upgrade to higher phase");
        require(newPhaseId <= phaseId, "W2E: Phase not yet available");

        // Resetear contador de uso al upgradear
        uint256 oldPhase = getLicensePhase(tokenId);
        licenseUsageCount[tokenId] = 0;

        // Emitir evento de upgrade para trazabilidad
        emit LicenseUpgraded(tokenId, oldPhase, newPhaseId);
    }

    /**
     * @notice Obtiene la fase actual de una licencia
     * @dev Basado en el contador de uso y reglas del protocolo
     * @param tokenId ID de la licencia
     * @return Fase actual de la licencia
     */
    function getLicensePhase(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "W2E: License does not exist");

        // Lógica simple: fase basada en uso
        // En implementación real, esto sería más complejo
        uint256 usage = licenseUsageCount[tokenId];

        if (usage >= 100) return 3; // Fase 3: Muy activa
        if (usage >= 50) return 2;  // Fase 2: Activa
        return 1;                   // Fase 1: Nueva
    }

    /**
     * @notice Obtiene estadísticas de fases
     * @return currentPhase Fase actual, totalPhases Total de fases configuradas
     */
    function getPhaseStats() external view returns (uint256 currentPhase, uint256 totalPhases) {
        currentPhase = phaseId;

        // Contar fases configuradas
        totalPhases = 0;
        for (uint256 i = 1; i <= 10; i++) { // Máximo 10 fases
            if (phaseMaxSupply[i] > 0) {
                totalPhases = i;
            } else {
                break;
            }
        }
    }
}
