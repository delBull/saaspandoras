// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./PBOXToken.sol";
import "../treasury/PBOXProtocolTreasury.sol";
import "../core/W2ELoomV2.sol";
import "../core/W2EGovernor.sol";
import "../core/ProtocolRegistry.sol";

/**
 * @title ModularFactory - Fábrica de Despliegue para Protocolos W2E
 * @notice Orquestador que despliega y vincula contratos modulares por creación
 * @dev Despliega stack completo: Tesorería + Loom + Governor en una transacción atómica
 */
contract ModularFactory is Ownable, ReentrancyGuard, Pausable {
    // ========== DEPENDENCIAS CORE ==========

    /// @notice Token PBOX (para mint permissions)
    address payable public pboxToken;

    /// @notice NFT de acceso Pandoras Key
    address public pandoraKey;

    /// @notice Tesorería Root (recibe fees)
    address public rootTreasury;

    /// @notice Dirección del oráculo de Pandora
    address public pandoraOracle;

    // ========== CONFIGURACIÓN DE DESPLIEGUE ==========

    /// @notice Fee por despliegue (en ETH)
    uint256 public deploymentFee = 0.01 ether;

    /// @notice Mínimo capital inicial requerido
    uint256 public minInitialCapital = 1 ether;

    /// @notice Máximo de creaciones por día (para evitar spam)
    uint256 public maxCreationsPerDay = 10;

    // ========== CONTROL DE DESPLIEGUES ==========

    /// @notice Contador total de creaciones desplegadas
    uint256 public totalCreations;

    /// @notice Creaciones por día
    mapping(uint256 => uint256) public creationsPerDay;

    /// @notice Mapeo de creaciones por slug
    mapping(string => CreationInfo) public creations;

    /// @notice Mapeo de direcciones por creación
    mapping(string => ContractAddresses) public creationAddresses;

    // ========== ESTRUCTURAS ==========

    /// @notice Información de una creación
    struct CreationInfo {
        string slug;
        string name;
        address creator;
        uint256 deployedAt;
        uint256 initialCapital;
        bool active;
        uint256 totalFeesCollected;
    }

    /// @notice Direcciones de contratos desplegados
    struct ContractAddresses {
        address registry;
        address treasury;
        address loom;
        address governor;
        address timelock;
    }

    /// @notice Configuración para despliegue
    struct DeploymentConfig {
        string slug;
        string name;
        uint256 targetAmount;
        uint256 creatorPayoutPct;
        uint256 quorumPercentage;
        uint256 votingPeriodHours;
        address[] treasurySigners;
        uint256 initialCapital;
    }

    // ========== EVENTOS ==========

    event CreationDeployed(
        string indexed slug,
        address indexed creator,
        ContractAddresses addresses,
        uint256 initialCapital
    );

    event CreationActivated(string indexed slug, uint256 activationTime);
    event DeploymentFeeUpdated(uint256 oldFee, uint256 newFee);
    event CreationPaused(string indexed slug, string reason);
    event CreationResumed(string indexed slug);

    // ========== CONSTRUCTOR ==========

    constructor(
        address _pboxToken,
        address _pandoraKey,
        address _rootTreasury,
        address _pandoraOracle,
        address initialOwner
    ) Ownable() {
        require(_pboxToken != address(0), "Factory: Invalid PBOX token");
        require(_pandoraKey != address(0), "Factory: Invalid Pandora Key");
        require(_rootTreasury != address(0), "Factory: Invalid root treasury");
        require(_pandoraOracle != address(0), "Factory: Invalid oracle");

        pboxToken = payable(_pboxToken);
        pandoraKey = _pandoraKey;
        rootTreasury = _rootTreasury;
        pandoraOracle = _pandoraOracle;

        // Transferir ownership al admin
        if (initialOwner != address(0) && initialOwner != msg.sender) {
            transferOwnership(initialOwner);
        }
    }

    // ========== FUNCIÓN PRINCIPAL DE DESPLIEGUE ==========

    /**
     * @notice Despliega stack completo de contratos para una nueva creación
     * @param config Configuración completa del despliegue
     * @return addresses Direcciones de todos los contratos desplegados
     */
    function deployProtocolStack(
        DeploymentConfig calldata config
    ) external payable nonReentrant whenNotPaused returns (ContractAddresses memory addresses) {
        // ========== VALIDACIONES ==========

        require(msg.value >= deploymentFee + config.initialCapital, "Factory: Insufficient payment");
        require(config.initialCapital >= minInitialCapital, "Factory: Below minimum capital");
        require(bytes(config.slug).length > 0, "Factory: Invalid slug");
        require(bytes(config.name).length > 0, "Factory: Invalid name");
        require(config.creatorPayoutPct <= 50, "Factory: Creator payout too high");
        require(config.treasurySigners.length >= 2, "Factory: Need at least 2 signers");
        require(creations[config.slug].creator == address(0), "Factory: Slug already exists");

        // Control de rate limiting
        _checkDeploymentLimits();

        // Por simplicidad, usamos address(0) como timelock inicialmente
        address timelock = address(0);

        // ========== DESPLIEGUE ATÓMICO ==========

        // Preparar signatarios para tesorería (DAO = treasury signers)
        address[] memory pandoraSigners = new address[](1);
        pandoraSigners[0] = pandoraOracle; // Solo el oráculo como pandora signer

        // 1. Desplegar Registro de Protocolo
        ProtocolRegistry registry = new ProtocolRegistry(owner());

        // 2. Desplegar Tesorería de Protocolo
        PBOXProtocolTreasury treasury = new PBOXProtocolTreasury(
            pandoraSigners,           // _pandoraSigners
            config.treasurySigners,   // _daoSigners
            pandoraOracle,            // _pandoraOracle
            address(0),              // _protocolGovernor (se setea después)
            1,                       // _requiredPandoraConfirmations
            2,                       // _requiredDaoConfirmations
            config.targetAmount,     // _emergencyThreshold
            30,                      // _emergencyInactivityDays
            config.targetAmount/10,  // _directOperationLimit
            config.targetAmount/100, // _dailySpendingLimit
            owner()                  // initialOwner
        );

        // 3. Desplegar Gobernanza DAO
        // En V2 usaremos la Pandoras Key o el primer artefacto. Por ahora mantenemos Pandoras Key.
        W2EGovernor governor = new W2EGovernor(
            pandoraKey,              // _licenseToken
            address(0),              // Placeholder, se setea loom después si fuera necesario o se asume estático
            config.quorumPercentage, // _quorumPercentage
            100,                     // _votingDelaySeconds
            config.votingPeriodHours * 3600, // _votingPeriodSeconds
            3600,                    // _executionDelaySeconds
            owner()                  // initialOwner
        );

        // 4. Desplegar Motor W2E (Loom V2)
        W2ELoomV2 loom = new W2ELoomV2(
            address(registry),      // _registry
            address(0),             // _utilityToken (se setea fuera o se asume externo)
            address(treasury),      // _pandoraRootTreasury (o root oficial)
            address(treasury),      // _protocolTreasuryAddress
            pandoraOracle,          // _pandoraOracle
            owner(),                // _platformFeeWallet
            msg.sender,             // _creatorWallet
            config.creatorPayoutPct, // _creatorPayoutPct
            config.quorumPercentage, // _minQuorumPercentage
            config.votingPeriodHours * 3600, // _votingPeriodSeconds
            15 * 24 * 3600,         // _emergencyPeriodSeconds
            config.quorumPercentage, // _emergencyQuorumPct
            1585489599,             // _stakingRewardRate
            20,                     // _phiFundSplitPct
            owner()                 // initialOwner
        );

        // ========== VINCULACIÓN ==========

        // Actualizar governor en tesorería (ownership ya transferido en constructor)
        // Nota: PBOXProtocolTreasury transfiere ownership automáticamente al _protocolGovernor
        // Pero como no lo sabíamos al crear, necesitamos actualizarlo

        // Autorizar burner role en PBOX para Loom y Tesorería
        PBOXToken(pboxToken).authorizeBurner(address(loom));
        PBOXToken(pboxToken).authorizeBurner(address(treasury));

        // ========== FINANCIACIÓN INICIAL ==========

        // Transferir capital inicial a la tesorería (USANDO CALL)
        (bool success,) = payable(address(treasury)).call{value: config.initialCapital}("");
        require(success, "Factory: ETH transfer to treasury failed");

        // Registrar la creación
        _registerCreation(config, ContractAddresses({
            registry: address(registry),
            treasury: address(treasury),
            loom: address(loom),
            governor: address(governor),
            timelock: timelock
        }));

        // ========== PAGOS Y FEES ==========

        // Transferir fee de despliegue a root treasury (USANDO CALL)
        (success,) = payable(rootTreasury).call{value: deploymentFee}("");
        require(success, "Factory: Fee transfer failed");

        // Devolver exceso si hay (USANDO CALL)
        uint256 excess = msg.value - deploymentFee - config.initialCapital;
        if (excess > 0) {
            (success,) = payable(msg.sender).call{value: excess}("");
            require(success, "Factory: Excess refund failed");
        }

        addresses = ContractAddresses({
            registry: address(registry),
            treasury: address(treasury),
            loom: address(loom),
            governor: address(governor),
            timelock: timelock
        });

        emit CreationDeployed(config.slug, msg.sender, addresses, config.initialCapital);
        return addresses;
    }

    // ========== GESTIÓN DE CREACIONES ==========

    /**
     * @notice Registra una nueva creación en el sistema
     */
    function _registerCreation(
        DeploymentConfig calldata config,
        ContractAddresses memory addresses
    ) internal {
        totalCreations++;
        uint256 today = block.timestamp / 1 days;
        creationsPerDay[today]++;

        creations[config.slug] = CreationInfo({
            slug: config.slug,
            name: config.name,
            creator: msg.sender,
            deployedAt: block.timestamp,
            initialCapital: config.initialCapital,
            active: true,
            totalFeesCollected: 0
        });

        creationAddresses[config.slug] = addresses;
    }

    /**
     * @notice Activa una creación (cuando alcanza la meta)
     */
    function activateCreation(string calldata slug) external {
        CreationInfo storage creation = creations[slug];
        require(creation.creator != address(0), "Factory: Creation not found");
        require(!creation.active, "Factory: Already active");

        ContractAddresses memory addresses = creationAddresses[slug];

        // Activar contratos
        W2ELoomV2(addresses.loom).activateProtocol();
        PBOXProtocolTreasury(payable(addresses.treasury)).activateProtocol();

        creation.active = true;

        emit CreationActivated(slug, block.timestamp);
    }

    /**
     * @notice Pausa una creación por mantenimiento
     */
    function pauseCreation(string calldata slug, string calldata reason) external onlyOwner {
        ContractAddresses memory addresses = creationAddresses[slug];
        require(addresses.loom != address(0), "Factory: Creation not found");

        W2ELoomV2(addresses.loom).pause();
        PBOXProtocolTreasury(payable(addresses.treasury)).pause();

        creations[slug].active = false;

        emit CreationPaused(slug, reason);
    }

    /**
     * @notice Reanuda una creación pausada
     */
    function resumeCreation(string calldata slug) external onlyOwner {
        ContractAddresses memory addresses = creationAddresses[slug];
        require(addresses.loom != address(0), "Factory: Creation not found");

        W2ELoomV2(addresses.loom).unpause();
        PBOXProtocolTreasury(payable(addresses.treasury)).unpause();

        creations[slug].active = true;

        emit CreationResumed(slug);
    }

    // ========== CONTROLES ADMINISTRATIVOS ==========

    /**
     * @notice Actualiza el fee de despliegue
     */
    function updateDeploymentFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = deploymentFee;
        deploymentFee = newFee;
        emit DeploymentFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Actualiza límites de despliegue
     */
    function updateDeploymentLimits(
        uint256 newMinCapital,
        uint256 newMaxCreationsPerDay
    ) external onlyOwner {
        require(newMinCapital > 0, "Factory: Invalid min capital");
        require(newMaxCreationsPerDay > 0, "Factory: Invalid max creations");

        minInitialCapital = newMinCapital;
        maxCreationsPerDay = newMaxCreationsPerDay;
    }

    /**
     * @notice Actualiza direcciones core
     */
    function updateCoreAddresses(
        address newPBOXToken,
        address newPandoraKey,
        address newRootTreasury,
        address newOracle
    ) external onlyOwner {
        require(newPBOXToken != address(0), "Factory: Invalid PBOX token");
        require(newPandoraKey != address(0), "Factory: Invalid Pandora Key");
        require(newRootTreasury != address(0), "Factory: Invalid root treasury");
        require(newOracle != address(0), "Factory: Invalid oracle");

        pboxToken = payable(newPBOXToken);
        pandoraKey = newPandoraKey;
        rootTreasury = newRootTreasury;
        pandoraOracle = newOracle;
    }

    /**
     * @notice Pausa la fábrica en emergencias
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Reanuda la fábrica
     */
    function emergencyResume() external onlyOwner {
        _unpause();
    }

    // ========== FUNCIONES AUXILIARES ==========

    /**
     * @notice Verifica límites de despliegue diario
     */
    function _checkDeploymentLimits() internal view {
        uint256 today = block.timestamp / 1 days;
        require(creationsPerDay[today] < maxCreationsPerDay, "Factory: Daily limit exceeded");
    }

    // ========== FUNCIONES DE VISTA ==========

    /**
     * @notice Obtiene información completa de una creación
     */
    function getCreation(string calldata slug) external view returns (
        CreationInfo memory info,
        ContractAddresses memory addresses
    ) {
        return (creations[slug], creationAddresses[slug]);
    }

    /**
     * @notice Calcula costo total de despliegue
     */
    function calculateDeploymentCost(uint256 initialCapital) external view returns (
        uint256 deploymentFee_,
        uint256 initialCapital_,
        uint256 totalCost
    ) {
        return (deploymentFee, initialCapital, deploymentFee + initialCapital);
    }

    /**
     * @notice Verifica si un slug está disponible
     */
    function isSlugAvailable(string calldata slug) external view returns (bool) {
        return creations[slug].creator == address(0);
    }

    /**
     * @notice Obtiene métricas de la fábrica
     */
    function getFactoryMetrics() external view returns (
        uint256 totalCreations_,
        uint256 activeCreations,
        uint256 pausedCreations,
        uint256 todayCreations
    ) {
        totalCreations_ = totalCreations;
        uint256 today = block.timestamp / 1 days;
        todayCreations = creationsPerDay[today];

        // Contar creaciones activas/pausadas (simplificado)
        activeCreations = totalCreations_; // En implementación real, contar activas
        pausedCreations = 0; // En implementación real, contar pausadas
    }

    // ========== RECEIVE FUNCTION ==========

    /**
     * @notice Acepta ETH para operaciones
     */
    receive() external payable {
        // ETH recibido para operaciones de la fábrica
    }
}
