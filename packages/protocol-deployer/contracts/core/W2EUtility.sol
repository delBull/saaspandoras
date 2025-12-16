// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title W2EUtility - Token de Utilidad W2E
 * @notice Contrato ERC-20 para el token de utilidad del sistema Work-to-Earn
 * @dev Maneja recompensas, staking y mecanismos deflacionarios
 */
contract W2EUtility is ERC20, Ownable, ERC20Pausable, ReentrancyGuard {
    // ========== ESTADO DEL CONTRATO ==========

    /// @notice Dirección del motor lógico W2E autorizado para mint/burn
    address public w2eLoomAddress;

    /// @notice Dirección de la tesorería para recaudar fees
    address public treasuryAddress;

    /// @notice Dirección que recibe las tarifas de transacción
    address public feeRecipient;

    /// @notice Tasa de fee por transacciones (en basis points, ej: 100 = 1%)
    uint256 public transactionFee = 50; // 0.5% por defecto

    /// @notice Constantes para optimización de gas
    uint256 public constant MAX_FEE_BPS = 1000; // Máximo 10%
    uint256 public constant DEFAULT_FEE_BPS = 50; // 0.5% por defecto
    uint256 public constant MIN_LOCK_PERIOD = 1 days; // Periodo mínimo de lock
    
    /// @notice Authority Address (Pandora) for Economic Schedule
    address public authority;

    /// @notice Current Phase ID for APY calculation
    uint256 public currentPhase = 1;

    /// @notice Mapping of Phase ID -> Staking APY (Basis Points)
    mapping(uint256 => uint256) public phaseAPY;

    // ...


    /// @notice Monto total quemado (para métricas deflacionarias)
    uint256 public totalBurned;

    /// @notice Decimales del token (customizable)
    uint8 private _decimals;

    // ========== ESTRUCTURAS DE STAKING ==========

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod;
        bool active;
    }

    /// @notice Información de staking por usuario
    mapping(address => StakeInfo) public stakes;

    /// @notice Total staked en el contrato
    uint256 public totalStaked;

    // ========== EVENTOS ==========

    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event FeeCollected(address indexed from, uint256 amount, uint256 fee);
    event LoomAddressUpdated(address indexed oldLoom, address indexed newLoom);

    // ========== CONSTRUCTOR ==========

    /**
     * @param name Nombre del token ERC-20 (ej: "Artefacto PHI Vista Horizonte")
     * @param symbol Símbolo del token ERC-20 (ej: "PHI_VH")
     * @param initialDecimals Número de decimales del token (generalmente 18)
     * @param _transactionFee Tasa de fee por transacción en basis points (ej: 50 = 0.5%)
     * @param _feeRecipient Dirección que recibe las tarifas de transacción
     * @param initialOwner Owner inicial del contrato
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 initialDecimals,
        uint256 _transactionFee,
        address _feeRecipient,
        address initialOwner
    ) ERC20(name, symbol) Ownable() {
        require(initialDecimals > 0 && initialDecimals <= 18, "W2E: Invalid decimals");
        require(_transactionFee <= MAX_FEE_BPS, "W2E: Fee cannot exceed 10%");
        require(_feeRecipient != address(0), "W2E: Invalid fee recipient");

        _decimals = initialDecimals;
        transactionFee = _transactionFee;
        feeRecipient = _feeRecipient;

        // Set Authority to deployer initially (Pandora)
        authority = msg.sender;
        
        // Define default schedule (can be updated by Authority)
        phaseAPY[1] = 500; // Phase 1: 5%
        phaseAPY[2] = 1000; // Phase 2: 10%
        phaseAPY[3] = 2000; // Phase 3: 20%
    }

    // ========== MODIFICADORES ==========

    /// @notice Solo el motor W2E puede llamar
    modifier onlyW2ELoom() {
        require(msg.sender == w2eLoomAddress, "W2E: Not W2E Loom Contract");
        _;
    }

    // ========== FUNCIONES DE EMISIÓN Y QUEMA ==========

    /**
     * @notice Acuña nuevos tokens
     * @dev Solo callable por el contrato W2ELoom para recompensas
     * @param to Dirección destinataria
     * @param amount Cantidad a acuñar
     */
    function mint(address to, uint256 amount)
        external
        onlyW2ELoom
        nonReentrant
    {
        require(to != address(0), "W2E: Invalid address");
        require(amount > 0, "W2E: Amount must be positive");

        _mint(to, amount);

        emit TokensMinted(to, amount);
    }

    /**
     * @notice Quema tokens del contrato
     * @dev Mecanismo deflacionario para slashing y fees
     * @param amount Cantidad a quemar
     */
    function burn(uint256 amount)
        external
        onlyW2ELoom
        nonReentrant
    {
        require(amount > 0, "W2E: Amount must be positive");
        require(balanceOf(address(this)) >= amount, "W2E: Insufficient balance to burn");

        _burn(address(this), amount);
        totalBurned += amount;

        emit TokensBurned(address(this), amount);
    }

    /**
     * @notice Quema tokens de un usuario específico
     * @dev Para penalizaciones (slashing) por mal comportamiento
     * @param from Dirección desde donde quemar
     * @param amount Cantidad a quemar
     */
    function burnFrom(address from, uint256 amount)
        external
        onlyW2ELoom
        nonReentrant
    {
        require(from != address(0), "W2E: Invalid address");
        require(amount > 0, "W2E: Amount must be positive");
        require(balanceOf(from) >= amount, "W2E: Insufficient balance");

        _burn(from, amount);
        totalBurned += amount;

        emit TokensBurned(from, amount);
    }

    /**
     * @notice Quema tokens de un usuario con verificación adicional
     * @dev Para penalizaciones y slashing seguros
     * @param from Dirección desde donde quemar
     * @param amount Cantidad a quemar
     */
    function burnFromWithValidation(address from, uint256 amount)
        external
        onlyW2ELoom
        nonReentrant
    {
        require(from != address(0), "W2E: Invalid address");
        require(amount > 0, "W2E: Amount must be positive");
        
        // Verificar que no está en stake activo
        require(!stakes[from].active || stakes[from].amount <= balanceOf(from) - amount,
                "W2E: Cannot burn staked tokens");
        
        require(balanceOf(from) >= amount, "W2E: Insufficient balance");

        _burn(from, amount);
        totalBurned += amount;

        emit TokensBurned(from, amount);
        emit StakingViolationPenalized(from, amount);
    }

    /// @notice Evento para penalizaciones de staking
    event StakingViolationPenalized(address indexed user, uint256 penaltyAmount);

    // ========== FUNCIONES DE STAKING ==========

    /**
     * @notice Stake tokens para participar en validación/votación
     * @param amount Cantidad a stakear
     * @param lockPeriod Periodo de lock en segundos
     */
    function stake(uint256 amount, uint256 lockPeriod)
        external
        nonReentrant
        whenNotPaused
    {
        require(amount > 0, "W2E: Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "W2E: Insufficient balance");
        require(!stakes[msg.sender].active, "W2E: Already staking");
        require(lockPeriod >= 1 days, "W2E: Minimum lock period is 1 day");

        // Transferir tokens al contrato
        _transfer(msg.sender, address(this), amount);

        // Registrar stake
        stakes[msg.sender] = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: lockPeriod,
            active: true
        });

        totalStaked += amount;

        emit Staked(msg.sender, amount, lockPeriod);
    }

    /**
     * @notice Unstake tokens después del periodo de lock
     */
    function unstake()
        external
        nonReentrant
        whenNotPaused
    {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.active, "W2E: No active stake");
        require(
            block.timestamp >= userStake.startTime + userStake.lockPeriod,
            "W2E: Lock period not ended"
        );

        uint256 amount = userStake.amount;
        uint256 reward = calculateStakingReward(msg.sender);

        // Reset stake info
        userStake.active = false;
        totalStaked -= amount;

        // Transferir tokens de vuelta + recompensa
        _mint(msg.sender, reward); // Recompensa adicional
        _transfer(address(this), msg.sender, amount);

        emit Unstaked(msg.sender, amount, reward);
    }

    /**
     * @notice Calcula la recompensa de staking basada en tiempo y monto
     * @param user Dirección del usuario
     * @return Recompensa calculada
     */
    function calculateStakingReward(address user) public view returns (uint256) {
        StakeInfo storage userStake = stakes[user];
        if (!userStake.active) return 0;

        uint256 timeStaked = block.timestamp - userStake.startTime;
        uint256 currentAPY = phaseAPY[currentPhase];
        // If APY is 0 (not set or set to 0), fallback to 0 reward
        if (currentAPY == 0 && currentPhase == 1) currentAPY = 500; // Fallback default for Phase 1
        
        uint256 baseReward = (userStake.amount * timeStaked * currentAPY) / (365 days * 10000); // APY en BPS

        return baseReward;
    }

    // ========== FUNCIONES DE TRANSFERENCIA CON FEE ==========

    /**
     * @dev Sobrescribe transfer para incluir fee
     */
    function transfer(address to, uint256 amount)
        public
        override
        nonReentrant
        whenNotPaused
        returns (bool)
    {
        require(to != address(0), "W2E: Invalid recipient");

        if (transactionFee > 0 && msg.sender != w2eLoomAddress && msg.sender != treasuryAddress) {
            uint256 fee = (amount * transactionFee) / 10000; // Convertir basis points
            uint256 netAmount = amount - fee;

            // Transferir fee al destinatario configurado
            _transfer(msg.sender, feeRecipient, fee);

            // Transferir monto neto
            _transfer(msg.sender, to, netAmount);

            emit FeeCollected(msg.sender, amount, fee);

            return true;
        } else {
            return super.transfer(to, amount);
        }
    }

    /**
     * @dev Sobrescribe transferFrom para incluir fee
     */
    function transferFrom(address from, address to, uint256 amount)
        public
        override
        nonReentrant
        whenNotPaused
        returns (bool)
    {
        require(to != address(0), "W2E: Invalid recipient");

        if (transactionFee > 0 && from != w2eLoomAddress && from != treasuryAddress) {
            uint256 fee = (amount * transactionFee) / 10000;
            uint256 netAmount = amount - fee;

            // Transferir fee al destinatario configurado
            _transfer(from, feeRecipient, fee);

            // Transferir monto neto usando allowance
            uint256 currentAllowance = allowance(from, msg.sender);
            require(currentAllowance >= amount, "W2E: Transfer amount exceeds allowance");

            _approve(from, msg.sender, currentAllowance - amount);
            _transfer(from, to, netAmount);

            emit FeeCollected(from, amount, fee);

            return true;
        } else {
            return super.transferFrom(from, to, amount);
        }
    }

    // ========== FUNCIONES DE ADMINISTRACIÓN ==========

    /**
     * @notice Establece la dirección del motor W2E
     * @param loomAddress Nueva dirección del W2ELoom
     */
    function setW2ELoomAddress(address loomAddress) external onlyOwner {
        require(loomAddress != address(0), "W2E: Invalid loom address");
        address oldLoom = w2eLoomAddress;
        w2eLoomAddress = loomAddress;

        emit LoomAddressUpdated(oldLoom, loomAddress);
    }

    /**
     * @notice Establece la dirección de la tesorería
     * @param treasury Nueva dirección de la tesorería
     */
    function setTreasuryAddress(address treasury) external onlyOwner {
        require(treasury != address(0), "W2E: Invalid treasury address");
        treasuryAddress = treasury;
    }

    /**
     * @notice Actualiza la tasa de fee por transacción
     * @param newFee Nueva tasa en basis points (ej: 100 = 1%)
     */
    function setTransactionFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE_BPS, "W2E: Fee cannot exceed 10%"); // Máximo 10%
        uint256 oldFee = transactionFee;
        transactionFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }

    /// @notice Evento para cambios de fee
    event FeeUpdated(uint256 indexed oldFee, uint256 indexed newFee);

    /**
     * @notice Updates the Phase Schedule (Authority Only)
     * @param phaseId Phase ID to update
     * @param apy New APY in basis points
     */
    function setPhaseSchedule(uint256 phaseId, uint256 apy) external {
        require(msg.sender == authority, "W2E: Only Authority");
        require(apy <= 5000, "W2E: APY exceeds 50%"); // Hard Limit 50%
        phaseAPY[phaseId] = apy;
        emit PhaseScheduleUpdated(phaseId, apy);
    }

    /**
     * @notice Advances the protocol to a new phase (Updates APY)
     * @dev Callable by Owner or W2ELoom
     */
    function updatePhase(uint256 newPhase) external {
        require(msg.sender == owner() || msg.sender == w2eLoomAddress, "W2E: Unauthorized");
        require(newPhase > currentPhase, "W2E: New phase must be greater");
        
        uint256 oldPhase = currentPhase;
        currentPhase = newPhase;
        
        emit PhaseUpdated(oldPhase, newPhase, phaseAPY[newPhase]);
    }

    /**
     * @notice Transfer authority role
     */
    function transferAuthority(address newAuthority) external {
        require(msg.sender == authority, "W2E: Only Authority");
        require(newAuthority != address(0), "W2E: Invalid address");
        authority = newAuthority;
    }

    /// @notice Event for Schedule Updates
    event PhaseScheduleUpdated(uint256 indexed phaseId, uint256 apy);
    
    /// @notice Event for Phase Transition
    event PhaseUpdated(uint256 indexed oldPhase, uint256 indexed newPhase, uint256 newAPY);

    // ========== FUNCIONES DE PAUSA/UNPAUSA ==========

    /**
     * @notice Pausa todas las transferencias (emergencia) con registro de causa
     */
    function pause(string calldata reason) external onlyOwner {
        require(paused() == false, "W2E: Already paused");
        _pause();
        
        emit EmergencyAction("PAUSE", reason, bytes(""));
    }

    /**
     * @notice Reanuda las transferencias con verificación de seguridad
     */
    function unpause() external onlyOwner {
        require(paused() == true, "W2E: Not paused");
        _unpause();
        
        emit EmergencyAction("UNPAUSE", "Manual unpause", bytes(""));
    }

    /// @notice Evento para acciones de emergencia
    event EmergencyAction(string indexed action, string indexed reason, bytes data);

    // ========== FUNCIONES DE VISTA ==========

    /**
     * @notice Obtiene información de staking de un usuario
     * @param user Dirección del usuario
     * @return amount Monto staked, startTime Inicio del stake, lockPeriod Periodo de lock, active Si está activo
     */
    function getStakeInfo(address user)
        external
        view
        returns (uint256 amount, uint256 startTime, uint256 lockPeriod, bool active)
    {
        StakeInfo storage userStake = stakes[user];
        return (userStake.amount, userStake.startTime, userStake.lockPeriod, userStake.active);
    }

    /**
     * @notice Verifica si un usuario puede hacer unstake
     * @param user Dirección del usuario
     * @return True si puede hacer unstake
     */
    function canUnstake(address user) external view returns (bool) {
        StakeInfo storage userStake = stakes[user];
        return userStake.active &&
               block.timestamp >= userStake.startTime + userStake.lockPeriod;
    }

    /**
     * @notice Obtiene métricas deflacionarias
     * @return currentSupply Total supply actual, burned Total quemado, staked Total staked
     */
    function getDeflationMetrics()
        external
        view
        returns (uint256 currentSupply, uint256 burned, uint256 staked)
    {
        return (super.totalSupply(), totalBurned, totalStaked);
    }

    // ========== FUNCIONES DE SOBREESCRITURA ==========

    /**
     * @dev Sobrescribe decimals para usar valor configurable
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Sobrescribe _beforeTokenTransfer para incluir pausa
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
