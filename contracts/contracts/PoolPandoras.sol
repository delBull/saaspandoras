// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/**
 * @title PoolPandoras
 * @notice Vault multi-token (ETH, USDC) con métricas avanzadas, utilidad claimable, reinversión, batch y control granular,
 *         y soporte para transacciones gasless mediante un trusted forwarder (ERC-2771).
 */
contract PoolPandoras is AccessControl, ReentrancyGuard, ERC2771Context {
    // --- Errores Personalizados ---
    error ZeroAddress();
    error DepositsPaused();
    error WithdrawalsPaused();
    error InvalidAmount();
    error CapReached();
    error NotWhitelisted();
    error AlreadyWithdrawn();
    error DepositLocked();
    error TransferFailed();
    error AlreadyUnlockedOrWithdrawn();
    error GlobalLiquidationAlreadyEnabled();
    error ExceedsTotalUtility();
    error NoUtilityToClaim();
    error InsufficientBalance();
    error ReturnedAmountExceedsInvested();
    error ArrayLengthMismatch();

    // --- Constantes y enums ---
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    enum TokenType { ETH, USDC }

    // --- Configuración de límites y periodos ---
    uint256 public lockupPeriod = 180 days;
    uint256 public maxCapETH   = 5_000_000 ether;
    uint256 public maxCapUSDC  = 5_000_000 * 1e6;

    // --- Flags operativos ---
    bool public pausedDeposits;
    bool public pausedWithdrawals;
    bool public whitelistEnabled;
    bool public globalLiquidationEnabled;
    uint48 public globalLiquidationTimestamp;

    address public utilityAddress;

    // --- Roles de AccessControl ---
    bytes32 public constant ADMIN_ROLE             = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE            = keccak256("PAUSER_ROLE");
    bytes32 public constant UNLOCKER_ROLE          = keccak256("UNLOCKER_ROLE");
    bytes32 public constant UTILITY_INJECTOR_ROLE  = keccak256("UTILITY_INJECTOR_ROLE");
    bytes32 public constant UTILITY_WITHDRAWER_ROLE= keccak256("UTILITY_WITHDRAWER_ROLE");
    bytes32 public constant MANAGER_ROLE           = keccak256("MANAGER_ROLE");

    // --- Estructura de depósito optimizada para gas ---
    struct DepositInfo {
        // Slot 1
        uint96 amount;
        uint96 yieldReceived;
        uint48 timestamp;
        // Slot 2
        uint48 withdrawnAt;
        TokenType token; // enum -> uint8
        // Flags: bit 0: withdrawn, bit 1: unlockedByAdmin, bit 2: fullyRedeemable, bit 3: isReinvestment
        uint8 flags;
    }

    // --- Almacenamiento de depósitos y métricas por usuario ---
    mapping(address => DepositInfo[]) public userDeposits;
    mapping(address => bool)        public isWhitelisted;
    mapping(address => bool)        public hasWithdrawn;
    mapping(address => uint256)     public userClaimableUtilityETH;
    mapping(address => uint256)     public userClaimableUtilityUSDC;
    mapping(address => uint256)     public userTotalReinvestedETH;
    mapping(address => uint256)     public userTotalReinvestedUSDC;
    mapping(address => bool)        public isKnownDepositor;

    address[] public withdrawnUsers;

    // --- Métricas globales ---
    uint256 public totalDepositedETH;
    uint256 public totalDepositedUSDC;
    uint256 public totalWithdrawnETH;
    uint256 public totalWithdrawnUSDC;
    uint256 public totalUtilityETH;
    uint256 public totalUtilityUSDC;
    uint256 public totalReinvestedETH;
    uint256 public totalReinvestedUSDC;
    uint256 public totalInvestedETH;
    uint256 public totalInvestedUSDC;

    // --- Eventos ---
    event Deposit(address indexed user, TokenType token, uint256 amount, uint256 when, uint256 depositIndex, bool reinvestment);
    event Withdraw(address indexed user, TokenType token, uint256 principal, uint256 yield, uint256 when, uint256 depositIndex);
    event BatchWithdraw(address indexed user, TokenType token, uint256[] indices, uint256 totalPrincipal, uint256 totalYield, uint256 when);
    event ClaimUtility(address indexed user, TokenType token, uint256 amount, uint256 when);
    event Reinvest(address indexed user, TokenType token, uint256 amount, uint256 when);
    event UtilityInjected(address indexed admin, TokenType token, uint256 amount, uint256 when);
    event UtilityWithdrawn(address indexed to, TokenType token, uint256 amount, uint256 when);
    event PauseChanged(bool depositsPaused, bool withdrawalsPaused);
    event LockupPeriodChanged(uint256 newPeriod);
    event MaxCapChanged(TokenType token, uint256 newCap);
    event UtilityAddressChanged(address newUtilityAddress);
    event UserWhitelisted(address indexed user, bool status);
    event DepositsUnlocked(address indexed user, uint256[] indices);
    event GlobalLiquidationEnabled(uint256 when);
    event ERC20Rescued(address indexed token, address indexed to, uint256 amount);
    event WithdrawnForInvestment(address indexed manager, TokenType token, address indexed to, uint256 amount, uint256 when);
    event InvestmentReturned(address indexed manager, TokenType token, uint256 amount, uint256 when);

    // --- Modificadores ---
    modifier whenDepositsNotPaused()    { if (pausedDeposits) revert DepositsPaused(); _; }
    modifier whenWithdrawalsNotPaused(){ if (pausedWithdrawals) revert WithdrawalsPaused(); _; }

    // --- Constructor ---
    constructor(
        address[] memory initialAdmins,
        address          _utilityAddress,
        address          trustedForwarder
    )
        ERC2771Context(trustedForwarder)
    {
        if (_utilityAddress == address(0)) revert ZeroAddress();
        utilityAddress = _utilityAddress;

        for (uint256 i = 0; i < initialAdmins.length; i++) {
            address admin = initialAdmins[i];
            _grantRole(DEFAULT_ADMIN_ROLE,      admin);
            _grantRole(ADMIN_ROLE,              admin);
            _grantRole(PAUSER_ROLE,             admin);
            _grantRole(UNLOCKER_ROLE,           admin);
            _grantRole(UTILITY_INJECTOR_ROLE,   admin);
            _grantRole(UTILITY_WITHDRAWER_ROLE, admin);
            _grantRole(MANAGER_ROLE,            admin);
        }
    }

    // --- Overrides para ERC2771Context ---
    function _msgSender() internal view override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _contextSuffixLength() internal view override(ERC2771Context, Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    // --- Funciones de administración ---
    function setLockupPeriod(uint256 newPeriod) external onlyRole(ADMIN_ROLE) {
        lockupPeriod = newPeriod;
        emit LockupPeriodChanged(newPeriod);
    }

    function setMaxCap(TokenType token, uint256 newCap) external onlyRole(ADMIN_ROLE) {
        if (token == TokenType.ETH)  maxCapETH  = newCap;
        else                           maxCapUSDC = newCap;
        emit MaxCapChanged(token, newCap);
    }

    function setPaused(bool _deposits, bool _withdrawals) external onlyRole(PAUSER_ROLE) {
        pausedDeposits    = _deposits;
        pausedWithdrawals = _withdrawals;
        emit PauseChanged(_deposits, _withdrawals);
    }

    function setWhitelistEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        whitelistEnabled = enabled;
    }

    function setWhitelist(address user, bool status) external onlyRole(ADMIN_ROLE) {
        isWhitelisted[user] = status;
        emit UserWhitelisted(user, status);
    }
    function setWhitelistBatch(address[] calldata users, bool[] calldata statuses) external onlyRole(ADMIN_ROLE) {
        if (users.length != statuses.length) revert ArrayLengthMismatch();
        for (uint256 i = 0; i < users.length; i++) {
            isWhitelisted[users[i]] = statuses[i];
            emit UserWhitelisted(users[i], statuses[i]);
        }
    }

    function setUtilityAddress(address newUtilityAddress) external onlyRole(ADMIN_ROLE) {
        if (newUtilityAddress == address(0)) revert ZeroAddress();
        utilityAddress = newUtilityAddress;
        emit UtilityAddressChanged(newUtilityAddress);
    }

    // --- Funciones de Manager ---
    function withdrawForInvestmentETH(address to, uint256 amount) external onlyRole(MANAGER_ROLE) nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount > address(this).balance) revert InsufficientBalance();

        totalInvestedETH += amount;

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit WithdrawnForInvestment(_msgSender(), TokenType.ETH, to, amount, block.timestamp);
    }

    function withdrawForInvestmentUSDC(address to, uint256 amount) external onlyRole(MANAGER_ROLE) nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount > IERC20(USDC).balanceOf(address(this))) revert InsufficientBalance();

        totalInvestedUSDC += amount;

        IERC20(USDC).transfer(to, amount);

        emit WithdrawnForInvestment(_msgSender(), TokenType.USDC, to, amount, block.timestamp);
    }

    function returnInvestmentETH() external payable onlyRole(MANAGER_ROLE) nonReentrant {
        if (msg.value == 0) revert InvalidAmount();
        if (msg.value > totalInvestedETH) revert ReturnedAmountExceedsInvested();
        
        totalInvestedETH -= msg.value;

        emit InvestmentReturned(_msgSender(), TokenType.ETH, msg.value, block.timestamp);
    }

    function returnInvestmentUSDC(uint256 amount) external onlyRole(MANAGER_ROLE) nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (amount > totalInvestedUSDC) revert ReturnedAmountExceedsInvested();

        totalInvestedUSDC -= amount;

        IERC20(USDC).transferFrom(_msgSender(), address(this), amount);

        emit InvestmentReturned(_msgSender(), TokenType.USDC, amount, block.timestamp);
    }

    // --- Depósitos ---
    function depositETH() external payable nonReentrant whenDepositsNotPaused {
        uint256 amt = msg.value;
        if (amt == 0) revert InvalidAmount();
        if (totalDepositedETH + amt > maxCapETH) revert CapReached();
        if (whitelistEnabled && !isWhitelisted[_msgSender()]) revert NotWhitelisted();

        _registerDeposit(_msgSender(), TokenType.ETH, amt, false);
        totalDepositedETH += amt;
    }

    function depositUSDC(uint256 amount) external nonReentrant whenDepositsNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (totalDepositedUSDC + amount > maxCapUSDC) revert CapReached();
        if (whitelistEnabled && !isWhitelisted[_msgSender()]) revert NotWhitelisted();

        IERC20(USDC).transferFrom(_msgSender(), address(this), amount);
        _registerDeposit(_msgSender(), TokenType.USDC, amount, false);
        totalDepositedUSDC += amount;
    }

    function _registerDeposit(address user, TokenType token, uint256 amount, bool isReinvestment) internal {
        uint8 flags;
        if (isReinvestment) {
            flags = flags | (1 << 3);
        }

        userDeposits[user].push(DepositInfo({
            amount: uint96(amount),
            yieldReceived: 0,
            timestamp: uint48(block.timestamp),
            withdrawnAt: 0,
            token: token,
            flags: flags
        }));

        if (!isKnownDepositor[user]) {
            isKnownDepositor[user] = true;
            // Event can be used off-chain to track unique depositors
            // emit NewDepositor(user);
        }
        emit Deposit(user, token, amount, block.timestamp, userDeposits[user].length - 1, isReinvestment);
    }

    // --- Retiros individuales ---
    function _isWithdrawn(uint8 flags) internal pure returns (bool) {
        return (flags & (1 << 0)) != 0;
    }

    function _isUnlockedByAdmin(uint8 flags) internal pure returns (bool) {
        return (flags & (1 << 1)) != 0;
    }

    function _isFullyRedeemable(uint8 flags) internal pure returns (bool) {
        return (flags & (1 << 2)) != 0;
    }

    function withdraw(uint256 depositIndex) external nonReentrant whenWithdrawalsNotPaused {
        address user = _msgSender();
        DepositInfo storage dep = userDeposits[user][depositIndex];

        if (_isWithdrawn(dep.flags)) revert AlreadyWithdrawn();
        if (
            block.timestamp < dep.timestamp + lockupPeriod &&
            !_isUnlockedByAdmin(dep.flags) &&
            !(globalLiquidationEnabled && _isFullyRedeemable(dep.flags))
        ) {
            revert DepositLocked();
        }

        dep.flags = dep.flags | (1 << 0); // Mark as withdrawn
        dep.withdrawnAt = uint48(block.timestamp);
        uint256 principal = dep.amount;
        uint256 yieldAmt  = dep.yieldReceived;

        if (dep.token == TokenType.ETH) {
            totalWithdrawnETH += principal;
            (bool ok, ) = user.call{value: principal + yieldAmt}("");
            if (!ok) revert TransferFailed();
        } else {
            totalWithdrawnUSDC += principal;
            IERC20(USDC).transfer(user, principal + yieldAmt);
        }

        if (!hasWithdrawn[user]) {
            withdrawnUsers.push(user);
            hasWithdrawn[user] = true;
        }

        emit Withdraw(user, dep.token, principal, yieldAmt, block.timestamp, depositIndex);
    }

    // --- Retiros por batch ---
    function batchWithdraw(uint256[] calldata depositIndices) external nonReentrant whenWithdrawalsNotPaused {
        address user = _msgSender();
        uint256 totalPrincipalETH;
        uint256 totalYieldETH;
        uint256 totalPrincipalUSDC;
        uint256 totalYieldUSDC;

        uint256 ethToWithdraw;
        uint256 usdcToWithdraw;

        for (uint256 i = 0; i < depositIndices.length; i++) {
            uint256 index = depositIndices[i];
            DepositInfo storage dep = userDeposits[user][index];

            if (_isWithdrawn(dep.flags)) revert AlreadyWithdrawn();
            if (
                block.timestamp < dep.timestamp + lockupPeriod &&
                !_isUnlockedByAdmin(dep.flags) &&
                !(globalLiquidationEnabled && _isFullyRedeemable(dep.flags))
            ) {
                revert DepositLocked();
            }

            dep.flags = dep.flags | (1 << 0); // Mark as withdrawn
            dep.withdrawnAt = uint48(block.timestamp);
            uint256 principal = dep.amount;
            uint256 yieldAmt = dep.yieldReceived;

            if (dep.token == TokenType.ETH) {
                ethToWithdraw += principal;
                totalPrincipalETH += principal;
                totalYieldETH += yieldAmt;
            } else {
                usdcToWithdraw += principal;
                totalPrincipalUSDC += principal;
                totalYieldUSDC += yieldAmt;
            }
            emit Withdraw(user, dep.token, principal, yieldAmt, block.timestamp, index);
        }

        if (ethToWithdraw > 0) {
            totalWithdrawnETH += ethToWithdraw;
        }
        if (usdcToWithdraw > 0) {
            totalWithdrawnUSDC += usdcToWithdraw;
        }

        if (!hasWithdrawn[user] && depositIndices.length > 0) {
            withdrawnUsers.push(user);
            hasWithdrawn[user] = true;
        }

        if (totalPrincipalETH + totalYieldETH > 0) {
            (bool ok, ) = user.call{value: totalPrincipalETH + totalYieldETH}("");
            if (!ok) revert TransferFailed();
            emit BatchWithdraw(user, TokenType.ETH, depositIndices, totalPrincipalETH, totalYieldETH, block.timestamp);
        }
        if (totalPrincipalUSDC + totalYieldUSDC > 0) {
            IERC20(USDC).transfer(user, totalPrincipalUSDC + totalYieldUSDC);
            emit BatchWithdraw(user, TokenType.USDC, depositIndices, totalPrincipalUSDC, totalYieldUSDC, block.timestamp);
        }
    }

    // --- Unlock granular / Liquidación global ---
    function unlockDepositsForUser(address user, uint256[] calldata depositIndices) external onlyRole(UNLOCKER_ROLE) {
        for (uint256 i = 0; i < depositIndices.length; i++) {
            DepositInfo storage dep = userDeposits[user][depositIndices[i]];
            if (_isWithdrawn(dep.flags) || _isUnlockedByAdmin(dep.flags)) {
                revert AlreadyUnlockedOrWithdrawn();
            }
            dep.flags = dep.flags | (1 << 1); // Mark as unlockedByAdmin
        }
        emit DepositsUnlocked(user, depositIndices);
    }

    function enableGlobalLiquidation() external onlyRole(ADMIN_ROLE) {
        if (globalLiquidationEnabled) revert GlobalLiquidationAlreadyEnabled();
        globalLiquidationEnabled = true;
        globalLiquidationTimestamp = uint48(block.timestamp);
        // The loop is removed to prevent extreme gas costs.
        // This functionality must be handled off-chain or on a per-user basis.
        // A user can now withdraw if globalLiquidationEnabled is true and their deposit is marked as fullyRedeemable.
        // An admin function can be added to mark specific deposits as redeemable if needed.
        emit GlobalLiquidationEnabled(block.timestamp);
    }

    function setDepositsAsRedeemable(address user, uint256[] calldata depositIndices) external onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < depositIndices.length; i++) {
            userDeposits[user][depositIndices[i]].flags |= (1 << 2);
        }
    }

    // --- Utility injection ---
    function injectUtilityETH() external payable onlyRole(UTILITY_INJECTOR_ROLE) {
        if (msg.value == 0) revert InvalidAmount();
        totalUtilityETH += msg.value;
        emit UtilityInjected(_msgSender(), TokenType.ETH, msg.value, block.timestamp);
    }

    function injectUtilityUSDC(uint256 amount) external onlyRole(UTILITY_INJECTOR_ROLE) {
        if (amount == 0) revert InvalidAmount();
        IERC20(USDC).transferFrom(_msgSender(), address(this), amount);
        totalUtilityUSDC += amount;
        emit UtilityInjected(_msgSender(), TokenType.USDC, amount, block.timestamp);
    }

    // --- Utility assignment (admin) ---
    function assignUtilityETH(address user, uint256 amount) external onlyRole(ADMIN_ROLE) {
        if (amount == 0) revert InvalidAmount();
        if (amount > totalUtilityETH) revert ExceedsTotalUtility();
        userClaimableUtilityETH[user] += amount;
        totalUtilityETH -= amount;
    }
    function assignUtilityUSDC(address user, uint256 amount) external onlyRole(ADMIN_ROLE) {
        if (amount == 0) revert InvalidAmount();
        if (amount > totalUtilityUSDC) revert ExceedsTotalUtility();
        userClaimableUtilityUSDC[user] += amount;
        totalUtilityUSDC -= amount;
    }

    function assignUtilityETHBatch(address[] calldata users, uint256[] calldata amounts) external onlyRole(ADMIN_ROLE) {
        if (users.length != amounts.length) revert ArrayLengthMismatch();
        uint256 sum;
        for (uint256 i = 0; i < users.length; i++) {
            uint256 amount = amounts[i];
            if (amount == 0) revert InvalidAmount();
            userClaimableUtilityETH[users[i]] += amount;
            sum += amount;
        }
        if (sum > totalUtilityETH) revert ExceedsTotalUtility();
        totalUtilityETH -= sum;
    }
    function assignUtilityUSDCBatch(address[] calldata users, uint256[] calldata amounts) external onlyRole(ADMIN_ROLE) {
        if (users.length != amounts.length) revert ArrayLengthMismatch();
        uint256 sum;
        for (uint256 i = 0; i < users.length; i++) {
            uint256 amount = amounts[i];
            if (amount == 0) revert InvalidAmount();
            userClaimableUtilityUSDC[users[i]] += amount;
            sum += amount;
        }
        if (sum > totalUtilityUSDC) revert ExceedsTotalUtility();
        totalUtilityUSDC -= sum;
    }

    // --- Claim utility (user) ---
    function claimUtilityETH() external nonReentrant {
        address user = _msgSender();
        uint256 amt = userClaimableUtilityETH[user];
        if (amt == 0) revert NoUtilityToClaim();
        userClaimableUtilityETH[user] = 0;
        (bool ok, ) = user.call{value: amt}("");
        if (!ok) revert TransferFailed();
        emit ClaimUtility(user, TokenType.ETH, amt, block.timestamp);
    }

    function claimUtilityUSDC() external nonReentrant {
        address user = _msgSender();
        uint256 amt = userClaimableUtilityUSDC[user];
        if (amt == 0) revert NoUtilityToClaim();
        userClaimableUtilityUSDC[user] = 0;
        IERC20(USDC).transfer(user, amt);
        emit ClaimUtility(user, TokenType.USDC, amt, block.timestamp);
    }

    // --- Reinvest utility (user) ---
    function reinvestUtilityETH() external nonReentrant {
        address user = _msgSender();
        uint256 amt = userClaimableUtilityETH[user];
        if (amt == 0) revert NoUtilityToClaim();
        userClaimableUtilityETH[user] = 0;
        _registerDeposit(user, TokenType.ETH, amt, true);
        totalReinvestedETH += amt;
        userTotalReinvestedETH[user] += amt;
        emit Reinvest(user, TokenType.ETH, amt, block.timestamp);
    }

    function reinvestUtilityUSDC() external nonReentrant {
        address user = _msgSender();
        uint256 amt = userClaimableUtilityUSDC[user];
        if (amt == 0) revert NoUtilityToClaim();
        userClaimableUtilityUSDC[user] = 0;
        _registerDeposit(user, TokenType.USDC, amt, true);
        totalReinvestedUSDC += amt;
        userTotalReinvestedUSDC[user] += amt;
        emit Reinvest(user, TokenType.USDC, amt, block.timestamp);
    }

    // --- Utility withdrawal by admin ---
    function withdrawUtilityETH(uint256 amount) external onlyRole(UTILITY_WITHDRAWER_ROLE) nonReentrant {
        if (utilityAddress == address(0)) revert ZeroAddress();
        if (amount > address(this).balance) revert InsufficientBalance();
        (bool ok, ) = utilityAddress.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit UtilityWithdrawn(utilityAddress, TokenType.ETH, amount, block.timestamp);
    }

    function withdrawUtilityUSDC(uint256 amount) external onlyRole(UTILITY_WITHDRAWER_ROLE) nonReentrant {
        if (utilityAddress == address(0)) revert ZeroAddress();
        IERC20(USDC).transfer(utilityAddress, amount);
        emit UtilityWithdrawn(utilityAddress, TokenType.USDC, amount, block.timestamp);
    }

    // --- Dashboard & consultas públicas ---
    function getVaultStats() external view returns (
        uint256 ethInVault,
        uint256 usdcInVault,
        uint256 totalDepositedETH_,
        uint256 totalDepositedUSDC_,
        uint256 totalWithdrawnETH_,
        uint256 totalWithdrawnUSDC_,
        uint256 totalUtilityETH_,
        uint256 totalUtilityUSDC_,
        uint256 totalReinvestedETH_,
        uint256 totalReinvestedUSDC_,
        uint256 totalInvestedETH_,
        uint256 totalInvestedUSDC_,
        uint256 numDepositors, // This is an approximation, relies on off-chain tracking for accuracy
        uint256 numWithdrawnUsers
    ) {
        ethInVault             = address(this).balance;
        usdcInVault            = IERC20(USDC).balanceOf(address(this));
        totalDepositedETH_     = totalDepositedETH;
        totalDepositedUSDC_    = totalDepositedUSDC;
        totalWithdrawnETH_     = totalWithdrawnETH;
        totalWithdrawnUSDC_    = totalWithdrawnUSDC;
        totalUtilityETH_       = totalUtilityETH;
        totalUtilityUSDC_      = totalUtilityUSDC;
        totalReinvestedETH_    = totalReinvestedETH;
        totalReinvestedUSDC_   = totalReinvestedUSDC;
        totalInvestedETH_      = totalInvestedETH;
        totalInvestedUSDC_     = totalInvestedUSDC;
        numDepositors          = 0; // Deprecated: Track off-chain via events
        numWithdrawnUsers      = withdrawnUsers.length;
    }

    function getUserStats(address user) external view returns (
        uint256 depositedETH,
        uint256 depositedUSDC,
        uint256 withdrawnETH,
        uint256 withdrawnUSDC,
        uint256 claimableUtilityETH,
        uint256 claimableUtilityUSDC,
        uint256 reinvestedETH,
        uint256 reinvestedUSDC
    ) {
        DepositInfo[] storage deps = userDeposits[user];
        for (uint256 i = 0; i < deps.length; i++) {
            DepositInfo memory dep = deps[i];
            bool isReinvestment = (dep.flags & (1 << 3)) != 0;
            if (dep.token == TokenType.ETH) {
                depositedETH += dep.amount;
                if (_isWithdrawn(dep.flags)) withdrawnETH += dep.amount;
                if (isReinvestment) reinvestedETH += dep.amount;
            } else {
                depositedUSDC += dep.amount;
                if (_isWithdrawn(dep.flags)) withdrawnUSDC += dep.amount;
                if (isReinvestment) reinvestedUSDC += dep.amount;
            }
        }
        claimableUtilityETH  = userClaimableUtilityETH[user];
        claimableUtilityUSDC = userClaimableUtilityUSDC[user];
    }

    function getUserDeposits(address user) external view returns (DepositInfo[] memory) {
        return userDeposits[user];
    }

    // --- Rescate de ERC20 atascados ---
    function rescueERC20(address token, address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).transfer(to, amount);
        emit ERC20Rescued(token, to, amount);
    }

    receive() external payable {}
}