// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PBOXToken - Token de Utilidad Interna de Pandora's
 * @notice Token de Propósito Único (SPUT) para el ecosistema Work-to-Earn
 * @dev Token nativo que representa el "Combustible del Trabajo" en la plataforma
 *
 * CARACTERÍSTICAS CLAVE:
 * - Unidad de cuenta para recompensas W2E
 * - Mecanismos de staking para gobernanza
 * - Burn mechanism para liquidez controlada
 * - Mint permissions delegados a Fábrica Modular
 * - NO es un token de inversión especulativa
 */
contract PBOXToken is ERC20, ERC20Burnable, AccessControl, ReentrancyGuard {
    // ========== ROLES DE ACCESO ==========

    /// @notice Rol para acuñar nuevos tokens (solo Fábrica Modular)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Rol para quemar tokens (solo contratos autorizados)
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @notice Rol administrativo (Pandora's multisig)
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ========== CONFIGURACIÓN CORE ==========

    /// @notice Dirección de la Fábrica Modular (único minter autorizado)
    address public factory;

    /// @notice Dirección de la Tesorería Root (recibe fees de quemas)
    address public rootTreasury;

    /// @notice Fee por conversión a liquidez (en basis points, 50 = 0.5%)
    uint256 public conversionFeeBps = 50; // 0.5%

    /// @notice Mínimo de tokens para conversión
    uint256 public minConversionAmount = 100 * 10**18; // 100 PBOX

    /// @notice Máximo de tokens por conversión diaria por usuario
    uint256 public maxDailyConversion = 1000 * 10**18; // 1000 PBOX

    // ========== CONTROL DE SUMINISTRO ==========

    /// @notice Suministro máximo total (para evitar inflación descontrolada)
    uint256 public constant MAX_TOTAL_SUPPLY = 100_000_000 * 10**18; // 100M PBOX

    // ========== CONTROL DE CONVERSIONES ==========

    /// @notice Conversiones diarias por usuario
    mapping(address => mapping(uint256 => uint256)) public dailyConversions;

    /// @notice Último día de conversión por usuario
    mapping(address => uint256) public lastConversionDay;

    // ========== EVENTOS ==========

    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event ConversionExecuted(
        address indexed user,
        uint256 pboxAmount,
        uint256 feeAmount,
        uint256 liquidityAmount,
        address indexed backingAsset
    );
    event ConversionFeeUpdated(uint256 oldFee, uint256 newFee);
    event FactoryUpdated(address indexed oldFactory, address indexed newFactory);

    // ========== CONSTRUCTOR ==========

    constructor(
        address _factory,
        address _rootTreasury,
        address admin
    ) ERC20("Pandora's BOX Token", "PBOX") {
        require(_factory != address(0), "PBOX: Invalid factory");
        require(_rootTreasury != address(0), "PBOX: Invalid treasury");
        require(admin != address(0), "PBOX: Invalid admin");

        factory = _factory;
        rootTreasury = _rootTreasury;

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, _factory); // Solo factory puede mint
        _grantRole(BURNER_ROLE, _factory); // Solo factory puede burn inicialmente
    }

    // ========== MODIFICADORES ==========

    modifier onlyFactory() {
        require(msg.sender == factory, "PBOX: Only factory");
        _;
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "PBOX: Only admin");
        _;
    }

    // ========== FUNCIONES DE MINT (SOLO FACTORY) ==========

    /**
     * @notice Acuña tokens para recompensas W2E y staking
     * @param to Dirección del destinatario
     * @param amount Cantidad a acuñar
     * @param reason Razón de la acuñación (para trazabilidad)
     */
    function mint(
        address to,
        uint256 amount,
        string calldata reason
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0), "PBOX: Invalid recipient");
        require(amount > 0, "PBOX: Amount must be positive");
        require(totalSupply() + amount <= MAX_TOTAL_SUPPLY, "PBOX: Max supply exceeded");

        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    // ========== FUNCIONES DE BURN Y CONVERSIÓN ==========

    /**
     * @notice Convierte PBOX a liquidez subyacente (ETH/USDC)
     * @param amount Cantidad de PBOX a convertir
     * @param backingAsset Dirección del asset de respaldo (ETH/USDC)
     */
    function convertToLiquidity(
        uint256 amount,
        address backingAsset
    ) external nonReentrant {
        require(amount >= minConversionAmount, "PBOX: Below minimum conversion");
        require(backingAsset != address(0), "PBOX: Invalid backing asset");

        // Control diario de conversiones
        uint256 today = block.timestamp / 1 days;
        if (lastConversionDay[msg.sender] != today) {
            lastConversionDay[msg.sender] = today;
            dailyConversions[msg.sender][today] = 0;
        }

        require(
            dailyConversions[msg.sender][today] + amount <= maxDailyConversion,
            "PBOX: Daily conversion limit exceeded"
        );

        // Calcular fee
        uint256 feeAmount = (amount * conversionFeeBps) / 10000;
        uint256 netAmount = amount - feeAmount;

        // Verificar balance del usuario
        require(balanceOf(msg.sender) >= amount, "PBOX: Insufficient balance");

        // Quemar PBOX del usuario (incluyendo el fee)
        _burn(msg.sender, amount);

        // Actualizar contadores
        dailyConversions[msg.sender][today] += amount;

        // El fee se queda quemado - Tesorería Root recibe equivalente en ETH/USDC
        // desde el contrato de Tesorería de Protocolo (llamado por Relayer/Oráculo)

        emit ConversionExecuted(msg.sender, amount, feeAmount, netAmount, backingAsset);
        emit TokensBurned(msg.sender, amount, "liquidity_conversion");
    }

    /**
     * @notice Burn controlado por contratos autorizados
     * @param from Dirección desde donde quemar
     * @param amount Cantidad a quemar
     * @param reason Razón del burn
     */
    function burnFromAuthorized(
        address from,
        uint256 amount,
        string calldata reason
    ) external onlyRole(BURNER_ROLE) {
        require(from != address(0), "PBOX: Invalid address");
        require(amount > 0, "PBOX: Amount must be positive");
        require(balanceOf(from) >= amount, "PBOX: Insufficient balance");

        _burn(from, amount);
        emit TokensBurned(from, amount, reason);
    }

    // ========== FUNCIONES ADMINISTRATIVAS ==========

    /**
     * @notice Actualiza la dirección de la fábrica
     * @param newFactory Nueva dirección de la fábrica
     */
    function updateFactory(address newFactory) external onlyAdmin {
        require(newFactory != address(0), "PBOX: Invalid factory");
        address oldFactory = factory;
        factory = newFactory;

        // Revocar permisos de la factory anterior
        _revokeRole(MINTER_ROLE, oldFactory);
        _revokeRole(BURNER_ROLE, oldFactory);

        // Otorgar permisos a la nueva factory
        _grantRole(MINTER_ROLE, newFactory);
        _grantRole(BURNER_ROLE, newFactory);

        emit FactoryUpdated(oldFactory, newFactory);
    }

    /**
     * @notice Actualiza el fee de conversión
     * @param newFeeBps Nuevo fee en basis points
     */
    function updateConversionFee(uint256 newFeeBps) external onlyAdmin {
        require(newFeeBps <= 500, "PBOX: Fee too high"); // Máximo 5%
        uint256 oldFee = conversionFeeBps;
        conversionFeeBps = newFeeBps;

        emit ConversionFeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @notice Actualiza límites de conversión
     * @param newMinConversion Nuevo mínimo de conversión
     * @param newMaxDaily Nuevo máximo diario
     */
    function updateConversionLimits(
        uint256 newMinConversion,
        uint256 newMaxDaily
    ) external onlyAdmin {
        require(newMinConversion > 0, "PBOX: Invalid min conversion");
        require(newMaxDaily > newMinConversion, "PBOX: Invalid max daily");

        minConversionAmount = newMinConversion;
        maxDailyConversion = newMaxDaily;
    }

    /**
     * @notice Otorga permisos de burner a contratos específicos
     * @param burner Dirección que puede quemar tokens
     */
    function authorizeBurner(address burner) external onlyAdmin {
        require(burner != address(0), "PBOX: Invalid burner");
        _grantRole(BURNER_ROLE, burner);
    }

    /**
     * @notice Revoca permisos de burner
     * @param burner Dirección a revocar
     */
    function revokeBurner(address burner) external onlyAdmin {
        _revokeRole(BURNER_ROLE, burner);
    }

    // ========== FUNCIONES DE VISTA ==========

    /**
     * @notice Obtiene información completa del token
     */
    function getTokenInfo() external view returns (
        uint256 totalSupply_,
        uint256 maxSupply_,
        uint256 conversionFee_,
        uint256 minConversion_,
        uint256 maxDailyConversion_
    ) {
        return (
            totalSupply(),
            MAX_TOTAL_SUPPLY,
            conversionFeeBps,
            minConversionAmount,
            maxDailyConversion
        );
    }

    /**
     * @notice Verifica si un usuario puede convertir tokens
     * @param user Dirección del usuario
     * @param amount Cantidad a convertir
     */
    function canConvert(address user, uint256 amount) external view returns (bool) {
        if (amount < minConversionAmount) return false;
        if (balanceOf(user) < amount) return false;

        uint256 today = block.timestamp / 1 days;
        uint256 dailyUsed = lastConversionDay[user] == today ?
            dailyConversions[user][today] : 0;

        return dailyUsed + amount <= maxDailyConversion;
    }

    /**
     * @notice Calcula el fee y neto de una conversión
     * @param amount Cantidad a convertir
     */
    function calculateConversion(uint256 amount) external view returns (
        uint256 feeAmount,
        uint256 netAmount,
        uint256 totalCost
    ) {
        feeAmount = (amount * conversionFeeBps) / 10000;
        netAmount = amount - feeAmount;
        totalCost = amount; // El usuario paga el 100%
    }

    // ========== OVERRIDE DE ERC20 ==========

    /**
     * @notice Override para prevenir burns directos (solo autorizados)
     */
    function burn(uint256 amount) public override onlyRole(BURNER_ROLE) {
        super.burn(amount);
    }

    /**
     * @notice Override para prevenir burns directos desde otros
     */
    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        super.burnFrom(account, amount);
    }

    // ========== RECEIVE FUNCTION ==========

    /**
     * @notice Acepta ETH para operaciones de respaldo
     */
    receive() external payable {
        // ETH recibido para operaciones de respaldo de liquidez
    }
}
