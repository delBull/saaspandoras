// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PoolFamilyAndFriends
 * @notice Vault multi-token (ETH, USDC) con métricas avanzadas, utilidad claimable, reinversión, batch y control granular.
 */
contract PoolFamilyAndFriends is AccessControl, ReentrancyGuard {
    // Tokens soportados
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    enum TokenType { ETH, USDC }

    uint256 public lockupPeriod = 180 days;
    uint256 public maxCapETH = 5_000_000 ether;
    uint256 public maxCapUSDC = 5_000_000 * 1e6;

    bool public pausedDeposits;
    bool public pausedWithdrawals;
    bool public whitelistEnabled;
    bool public globalLiquidationEnabled;
    uint256 public globalLiquidationTimestamp;

    address public utilityAddress;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNLOCKER_ROLE = keccak256("UNLOCKER_ROLE");
    bytes32 public constant UTILITY_INJECTOR_ROLE = keccak256("UTILITY_INJECTOR_ROLE");
    bytes32 public constant UTILITY_WITHDRAWER_ROLE = keccak256("UTILITY_WITHDRAWER_ROLE");

    struct DepositInfo {
        TokenType token;
        uint256 amount;
        uint256 timestamp;
        bool withdrawn;
        bool unlockedByAdmin;
        bool fullyRedeemable;
        bool isReinvestment;
        uint256 withdrawnAt;
        uint256 yieldReceived;
    }
    mapping(address => DepositInfo[]) public userDeposits;
    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public hasWithdrawn;
    mapping(address => uint256) public userClaimableUtilityETH;
    mapping(address => uint256) public userClaimableUtilityUSDC;
    mapping(address => uint256) public userTotalReinvestedETH;
    mapping(address => uint256) public userTotalReinvestedUSDC;

    address[] public allUsers;
    address[] public withdrawnUsers;
    address[] public allDepositors;

    // Métricas globales
    uint256 public totalDepositedETH;
    uint256 public totalDepositedUSDC;
    uint256 public totalWithdrawnETH;
    uint256 public totalWithdrawnUSDC;
    uint256 public totalUtilityETH;
    uint256 public totalUtilityUSDC;
    uint256 public totalReinvestedETH;
    uint256 public totalReinvestedUSDC;

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

    modifier whenDepositsNotPaused() { require(!pausedDeposits, "Deposits paused"); _; }
    modifier whenWithdrawalsNotPaused() { require(!pausedWithdrawals, "Withdrawals paused"); _; }

    constructor(
        address[] memory initialAdmins,
        address _utilityAddress
    ) {
        for (uint256 i = 0; i < initialAdmins.length; i++) {
            _grantRole(DEFAULT_ADMIN_ROLE, initialAdmins[i]);
            _grantRole(ADMIN_ROLE, initialAdmins[i]);
            _grantRole(PAUSER_ROLE, initialAdmins[i]);
            _grantRole(UNLOCKER_ROLE, initialAdmins[i]);
            _grantRole(UTILITY_INJECTOR_ROLE, initialAdmins[i]);
            _grantRole(UTILITY_WITHDRAWER_ROLE, initialAdmins[i]);
        }
        utilityAddress = _utilityAddress;
    }

    // --- ADMIN FLEXIBILIDAD ---

    function setLockupPeriod(uint256 newPeriod) external onlyRole(ADMIN_ROLE) {
        lockupPeriod = newPeriod;
        emit LockupPeriodChanged(newPeriod);
    }

    function setMaxCap(TokenType token, uint256 newCap) external onlyRole(ADMIN_ROLE) {
        if (token == TokenType.ETH) maxCapETH = newCap;
        else if (token == TokenType.USDC) maxCapUSDC = newCap;
        emit MaxCapChanged(token, newCap);
    }

    function setPaused(bool _deposits, bool _withdrawals) external onlyRole(PAUSER_ROLE) {
        pausedDeposits = _deposits;
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
        require(users.length == statuses.length, "Mismatch");
        for (uint256 i=0; i < users.length; i++) {
            isWhitelisted[users[i]] = statuses[i];
            emit UserWhitelisted(users[i], statuses[i]);
        }
    }

    function setUtilityAddress(address newUtilityAddress) external onlyRole(ADMIN_ROLE) {
        require(newUtilityAddress != address(0), "Zero address");
        utilityAddress = newUtilityAddress;
        emit UtilityAddressChanged(newUtilityAddress);
    }

    // --- DEPÓSITOS ---

    function depositETH() external payable nonReentrant whenDepositsNotPaused {
        require(msg.value > 0, "No ETH sent");
        require(totalDepositedETH + msg.value <= maxCapETH, "Cap reached");
        if (whitelistEnabled) require(isWhitelisted[msg.sender], "Not whitelisted");
        _registerDeposit(msg.sender, TokenType.ETH, msg.value, false);
        totalDepositedETH += msg.value;
    }

    function depositUSDC(uint256 amount) external nonReentrant whenDepositsNotPaused {
        require(amount > 0, "No USDC sent");
        require(totalDepositedUSDC + amount <= maxCapUSDC, "Cap reached");
        if (whitelistEnabled) require(isWhitelisted[msg.sender], "Not whitelisted");
        IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        _registerDeposit(msg.sender, TokenType.USDC, amount, false);
        totalDepositedUSDC += amount;
    }


    function _registerDeposit(address user, TokenType token, uint256 amount, bool reinvestment) internal {
        userDeposits[user].push(DepositInfo({
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            withdrawn: false,
            unlockedByAdmin: false,
            fullyRedeemable: false,
            isReinvestment: reinvestment,
            withdrawnAt: 0,
            yieldReceived: 0
        }));
        if (userDeposits[user].length == 1) {
            allUsers.push(user);
            allDepositors.push(user);
        }
        emit Deposit(user, token, amount, block.timestamp, userDeposits[user].length - 1, reinvestment);
    }

    // --- RETIROS ---

    function withdraw(uint256 depositIndex) external nonReentrant whenWithdrawalsNotPaused {
        DepositInfo storage dep = userDeposits[msg.sender][depositIndex];
        require(!dep.withdrawn, "Already withdrawn");
        require(
            block.timestamp >= dep.timestamp + lockupPeriod ||
            dep.unlockedByAdmin ||
            (globalLiquidationEnabled && dep.fullyRedeemable),
            "Deposit locked"
        );
        dep.withdrawn = true;
        dep.withdrawnAt = block.timestamp;
        uint256 yield = dep.yieldReceived;
        if (dep.token == TokenType.ETH) {
            totalWithdrawnETH += dep.amount;
            (bool success, ) = msg.sender.call{value: dep.amount + yield}("");
            require(success, "ETH transfer failed");
        } else if (dep.token == TokenType.USDC) {
            totalWithdrawnUSDC += dep.amount;
            IERC20(USDC).transfer(msg.sender, dep.amount + yield);
        }
        if (!hasWithdrawn[msg.sender]) {
            withdrawnUsers.push(msg.sender);
            hasWithdrawn[msg.sender] = true;
        }
        emit Withdraw(msg.sender, dep.token, dep.amount, yield, block.timestamp, depositIndex);
    }

    // --- BATCH WITHDRAW ---

    function batchWithdraw(uint256[] calldata depositIndices) external nonReentrant whenWithdrawalsNotPaused {
        uint256 totalPrincipalETH;
        uint256 totalYieldETH;
        uint256 totalPrincipalUSDC;
        uint256 totalYieldUSDC;
        for (uint256 i = 0; i < depositIndices.length; i++) {
            DepositInfo storage dep = userDeposits[msg.sender][depositIndices[i]];
            require(!dep.withdrawn, "Already withdrawn");
            require(
                block.timestamp >= dep.timestamp + lockupPeriod ||
                dep.unlockedByAdmin ||
                (globalLiquidationEnabled && dep.fullyRedeemable),
                "Deposit locked"
            );
            dep.withdrawn = true;
            dep.withdrawnAt = block.timestamp;
            uint256 yield = dep.yieldReceived;
            if (dep.token == TokenType.ETH) {
                totalWithdrawnETH += dep.amount;
                totalPrincipalETH += dep.amount;
                totalYieldETH += yield;
            } else if (dep.token == TokenType.USDC) {
                totalWithdrawnUSDC += dep.amount;
                totalPrincipalUSDC += dep.amount;
                totalYieldUSDC += yield;
            }
            if (!hasWithdrawn[msg.sender]) {
                withdrawnUsers.push(msg.sender);
                hasWithdrawn[msg.sender] = true;
            }
            emit Withdraw(msg.sender, dep.token, dep.amount, yield, block.timestamp, depositIndices[i]);
        }
        if (totalPrincipalETH + totalYieldETH > 0) {
            (bool success, ) = msg.sender.call{value: totalPrincipalETH + totalYieldETH}("");
            require(success, "ETH transfer failed");
            emit BatchWithdraw(msg.sender, TokenType.ETH, depositIndices, totalPrincipalETH, totalYieldETH, block.timestamp);
        }
        if (totalPrincipalUSDC + totalYieldUSDC > 0) {
            IERC20(USDC).transfer(msg.sender, totalPrincipalUSDC + totalYieldUSDC);
            emit BatchWithdraw(msg.sender, TokenType.USDC, depositIndices, totalPrincipalUSDC, totalYieldUSDC, block.timestamp);
        }
    }

    // --- UNLOCK GRANULAR Y LIQUIDACIÓN GLOBAL ---

    function unlockDepositsForUser(address user, uint256[] calldata depositIndices) external onlyRole(UNLOCKER_ROLE) {
        for (uint256 i = 0; i < depositIndices.length; i++) {
            DepositInfo storage dep = userDeposits[user][depositIndices[i]];
            require(!dep.withdrawn && !dep.unlockedByAdmin, "Already unlocked/withdrawn");
            dep.unlockedByAdmin = true;
        }
        emit DepositsUnlocked(user, depositIndices);
    }

    function enableGlobalLiquidation() external onlyRole(ADMIN_ROLE) {
        require(!globalLiquidationEnabled, "Already enabled");
        globalLiquidationEnabled = true;
        globalLiquidationTimestamp = block.timestamp;
        for(uint256 i=0; i<allUsers.length; i++){
            DepositInfo[] storage deposits = userDeposits[allUsers[i]];
            for (uint256 j = 0; j < deposits.length; j++) {
                if (!deposits[j].withdrawn) deposits[j].fullyRedeemable = true;
            }
        }
        emit GlobalLiquidationEnabled(block.timestamp);
    }

    // --- UTILITY INJECTION (ADMIN/ROL) ---

    function injectUtilityETH() external payable onlyRole(UTILITY_INJECTOR_ROLE) {
        require(msg.value > 0, "No ETH sent");
        totalUtilityETH += msg.value;
        emit UtilityInjected(msg.sender, TokenType.ETH, msg.value, block.timestamp);
    }

    function injectUtilityUSDC(uint256 amount) external onlyRole(UTILITY_INJECTOR_ROLE) {
        require(amount > 0, "No USDC sent");
        IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        totalUtilityUSDC += amount;
        emit UtilityInjected(msg.sender, TokenType.USDC, amount, block.timestamp);
    }


    // --- ASIGNACIÓN DE UTILIDAD (ADMIN/ROL) ---

    function assignUtilityETH(address user, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Zero");
        require(amount <= totalUtilityETH, "Exceeds pool");
        userClaimableUtilityETH[user] += amount;
        totalUtilityETH -= amount;
    }
    function assignUtilityUSDC(address user, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Zero");
        require(amount <= totalUtilityUSDC, "Exceeds pool");
        userClaimableUtilityUSDC[user] += amount;
        totalUtilityUSDC -= amount;
    }

    // --- BATCH ASIGNACIÓN DE UTILIDAD ---

    function assignUtilityETHBatch(address[] calldata users, uint256[] calldata amounts) external onlyRole(ADMIN_ROLE) {
        require(users.length == amounts.length, "Mismatch");
        uint256 total;
        for (uint256 i = 0; i < users.length; i++) {
            require(amounts[i] > 0, "Zero");
            userClaimableUtilityETH[users[i]] += amounts[i];
            total += amounts[i];
        }
        require(total <= totalUtilityETH, "Exceeds pool");
        totalUtilityETH -= total;
    }
    function assignUtilityUSDCBatch(address[] calldata users, uint256[] calldata amounts) external onlyRole(ADMIN_ROLE) {
        require(users.length == amounts.length, "Mismatch");
        uint256 total;
        for (uint256 i = 0; i < users.length; i++) {
            require(amounts[i] > 0, "Zero");
            userClaimableUtilityUSDC[users[i]] += amounts[i];
            total += amounts[i];
        }
        require(total <= totalUtilityUSDC, "Exceeds pool");
        totalUtilityUSDC -= total;
    }

    // --- UTILITY CLAIM (USUARIO) ---

    function claimUtilityETH() external nonReentrant {
        uint256 amount = userClaimableUtilityETH[msg.sender];
        require(amount > 0, "No utility");
        userClaimableUtilityETH[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit ClaimUtility(msg.sender, TokenType.ETH, amount, block.timestamp);
    }

    function claimUtilityUSDC() external nonReentrant {
        uint256 amount = userClaimableUtilityUSDC[msg.sender];
        require(amount > 0, "No utility");
        userClaimableUtilityUSDC[msg.sender] = 0;
        IERC20(USDC).transfer(msg.sender, amount);
        emit ClaimUtility(msg.sender, TokenType.USDC, amount, block.timestamp);
    }


    // --- REINVERSIÓN (USUARIO) ---

    function reinvestUtilityETH() external nonReentrant {
        uint256 amount = userClaimableUtilityETH[msg.sender];
        require(amount > 0, "No utility");
        userClaimableUtilityETH[msg.sender] = 0;
        _registerDeposit(msg.sender, TokenType.ETH, amount, true);
        totalReinvestedETH += amount;
        userTotalReinvestedETH[msg.sender] += amount;
        emit Reinvest(msg.sender, TokenType.ETH, amount, block.timestamp);
    }

    function reinvestUtilityUSDC() external nonReentrant {
        uint256 amount = userClaimableUtilityUSDC[msg.sender];
        require(amount > 0, "No utility");
        userClaimableUtilityUSDC[msg.sender] = 0;
        _registerDeposit(msg.sender, TokenType.USDC, amount, true);
        totalReinvestedUSDC += amount;
        userTotalReinvestedUSDC[msg.sender] += amount;
        emit Reinvest(msg.sender, TokenType.USDC, amount, block.timestamp);
    }


    // --- UTILITY WITHDRAWAL (ADMIN O ROL) ---

    function withdrawUtilityETH(uint256 amount) external onlyRole(UTILITY_WITHDRAWER_ROLE) nonReentrant {
        require(utilityAddress != address(0), "Utility address not set");
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = utilityAddress.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit UtilityWithdrawn(utilityAddress, TokenType.ETH, amount, block.timestamp);
    }

    function withdrawUtilityUSDC(uint256 amount) external onlyRole(UTILITY_WITHDRAWER_ROLE) nonReentrant {
        require(utilityAddress != address(0), "Utility address not set");
        IERC20(USDC).transfer(utilityAddress, amount);
        emit UtilityWithdrawn(utilityAddress, TokenType.USDC, amount, block.timestamp);
    }


    // --- DASHBOARD MÉTRICAS Y CONSULTAS ---

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
        uint256 numUsers,
        uint256 numWithdrawnUsers
    ) {
        ethInVault = address(this).balance;
        usdcInVault = IERC20(USDC).balanceOf(address(this));
        totalDepositedETH_ = totalDepositedETH;
        totalDepositedUSDC_ = totalDepositedUSDC;
        totalWithdrawnETH_ = totalWithdrawnETH;
        totalWithdrawnUSDC_ = totalWithdrawnUSDC;
        totalUtilityETH_ = totalUtilityETH;
        totalUtilityUSDC_ = totalUtilityUSDC;
        totalReinvestedETH_ = totalReinvestedETH;
        totalReinvestedUSDC_ = totalReinvestedUSDC;
        numUsers = allUsers.length;
        numWithdrawnUsers = withdrawnUsers.length;
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
        DepositInfo[] storage deposits = userDeposits[user];
        for (uint256 i = 0; i < deposits.length; i++) {
            if (deposits[i].token == TokenType.ETH) {
                depositedETH += deposits[i].amount;
                if (deposits[i].withdrawn) withdrawnETH += deposits[i].amount;
                if (deposits[i].isReinvestment) reinvestedETH += deposits[i].amount;
            } else if (deposits[i].token == TokenType.USDC) {
                depositedUSDC += deposits[i].amount;
                if (deposits[i].withdrawn) withdrawnUSDC += deposits[i].amount;
                if (deposits[i].isReinvestment) reinvestedUSDC += deposits[i].amount;
            }
        }
        claimableUtilityETH = userClaimableUtilityETH[user];
        claimableUtilityUSDC = userClaimableUtilityUSDC[user];
    }

    function getUserDeposits(address user) external view returns (DepositInfo[] memory) {
        return userDeposits[user];
    }

    // --- RESCATE DE ERC20 ATASCADOS ---

    function rescueERC20(address token, address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(to != address(0), "Zero address");
        IERC20(token).transfer(to, amount);
        emit ERC20Rescued(token, to, amount);
    }

    receive() external payable {}
}