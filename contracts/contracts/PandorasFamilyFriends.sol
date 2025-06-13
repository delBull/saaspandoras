// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TimeLockedEthInvestmentVault
 * @notice Vault robusto de inversión en ETH con lockup y utilidades administradas por roles
 * @dev Safe batch withdraw, circuit breaker, whitelists, utility pool y acceso granulado vía OpenZeppelin AccessControl.
 */
contract TimeLockedEthInvestmentVault is AccessControl, ReentrancyGuard {
    uint256 public constant LOCKUP_PERIOD = 180 days;
    uint256 public constant LIQUIDATION_DEFAULT_DELAY = 540 days;
    uint256 public constant maxCap = 5_000_000 ether;

    bool public paused;
    bool public whitelistEnabled;
    bool public globalLiquidationEnabled;
    uint256 public globalLiquidationTimestamp;
    uint256 public totalDeposited;
    uint256 public totalShares;
    uint256 public totalUtility;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNLOCKER_ROLE = keccak256("UNLOCKER_ROLE");
    bytes32 public constant UTILITY_INJECTOR_ROLE = keccak256("UTILITY_INJECTOR_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    struct DepositInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 shares;
        bool withdrawn;
        bool unlockedByAdmin;
        bool fullyRedeemable;
    }
    mapping(address => DepositInfo[]) public userDeposits;
    mapping(address => bool) public isWhitelisted;
    address[] public allUsers;

    event TimeLockedDeposit(address indexed user, uint256 amount, uint256 shares, uint256 when, uint256 depositIndex);
    event Withdraw(address indexed user, uint256 amount, uint256 utility, uint256 shares, uint256 when, uint256 depositIndex);
    event BatchWithdraw(address indexed user, uint256[] indices, uint256 totalPrincipal, uint256 totalUtility, uint256 when);
    event AdminWithdraw(address indexed admin, address indexed to, uint256 amount, uint256 when, string reason);
    event AdminUnlockDeposit(address indexed user, uint256 depositIndex);
    event BatchUnlock(address indexed admin, address[] users, uint256[][] indices);
    event GlobalLiquidationEnabled(uint256 when);
    event AdminUtilityInjection(address indexed admin, uint256 amount, uint256 when);
    event PauseChanged(bool paused);
    event UserWhitelisted(address indexed user, bool status);

    modifier whenNotPaused() { require(!paused, "Vault paused"); _; }

    // Constructor con asignación de todos los roles de forma segura
    constructor(address[] memory initialAdmins) {
        for (uint256 i = 0; i < initialAdmins.length; i++) {
            _grantRole(DEFAULT_ADMIN_ROLE, initialAdmins[i]);
            _grantRole(ADMIN_ROLE, initialAdmins[i]);
            _grantRole(PAUSER_ROLE, initialAdmins[i]);
            _grantRole(UNLOCKER_ROLE, initialAdmins[i]);
            _grantRole(UTILITY_INJECTOR_ROLE, initialAdmins[i]);
            _grantRole(WITHDRAWER_ROLE, initialAdmins[i]);
        }
    }

    // Whitelist y gestión
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
    function setWhitelistEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        whitelistEnabled = enabled;
    }

    // Depósito ETH
    function deposit(address receiver) external payable nonReentrant whenNotPaused returns (uint256 shares) {
        if (whitelistEnabled) require(isWhitelisted[receiver], "Not whitelisted");
        require(msg.value > 0, "No ETH sent");
        require(totalDeposited + msg.value <= maxCap, "Cap reached");
        shares = msg.value;
        userDeposits[receiver].push(DepositInfo({
            amount: msg.value,
            timestamp: block.timestamp,
            shares: shares,
            withdrawn: false,
            unlockedByAdmin: false,
            fullyRedeemable: false
        }));
        totalDeposited += msg.value;
        totalShares += shares;
        if (userDeposits[receiver].length == 1) {
            allUsers.push(receiver);
        }
        emit TimeLockedDeposit(receiver, msg.value, shares, block.timestamp, userDeposits[receiver].length - 1);
    }

    // Inyección de utilidad de admin (ROI, external funding, etc)
    function injectUtility() external payable onlyRole(UTILITY_INJECTOR_ROLE) whenNotPaused {
        require(msg.value > 0, "No ETH sent");
        totalUtility += msg.value;
        emit AdminUtilityInjection(msg.sender, msg.value, block.timestamp);
    }

    // Unlock granular y por lote
    function unlockDepositsForUser(address user, uint256[] calldata depositIndices) public onlyRole(UNLOCKER_ROLE) whenNotPaused {
        for (uint256 i = 0; i < depositIndices.length; i++) {
            uint256 idx = depositIndices[i];
            require(idx < userDeposits[user].length, "Deposit does not exist");
            DepositInfo storage dep = userDeposits[user][idx];
            require(!dep.withdrawn && !dep.unlockedByAdmin, "Already unlocked/withdrawn");
            dep.unlockedByAdmin = true;
            emit AdminUnlockDeposit(user, idx);
        }
    }

    function batchUnlock(address[] calldata users, uint256[][] calldata indices) external onlyRole(UNLOCKER_ROLE) whenNotPaused {
        require(users.length == indices.length, "Array mismatch");
        for (uint256 i=0; i < users.length; i++){
            unlockDepositsForUser(users[i], indices[i]);
        }
        emit BatchUnlock(msg.sender, users, indices);
    }

    // Batch withdraw memory wrapper seguro!
    function batchWithdraw(uint256[] calldata depositIndices) public nonReentrant whenNotPaused {
        _batchWithdrawMemory(depositIndices);
    }
    function _batchWithdrawMemory(uint256[] memory depositIndices) internal {
        uint256 totalPrincipal;
        uint256 totalUtil;
        for (uint256 i = 0; i < depositIndices.length; i++) {
            uint256 idx = depositIndices[i];
            require(idx < userDeposits[msg.sender].length, "Deposit does not exist");
            DepositInfo storage dep = userDeposits[msg.sender][idx];
            require(!dep.withdrawn, "Already withdrawn");
            bool unlocked = block.timestamp >= dep.timestamp + LOCKUP_PERIOD ||
                            dep.unlockedByAdmin ||
                            (globalLiquidationEnabled && dep.fullyRedeemable);
            require(unlocked, "Deposit locked");
            uint256 payoutPrincipal = dep.amount;
            uint256 utilityForDeposit = 0;
            if (totalUtility > 0 && dep.shares > 0 && totalShares > 0) {
                utilityForDeposit = (totalUtility * dep.shares) / totalShares;
                totalUtility -= utilityForDeposit;
            }
            dep.withdrawn = true;
            totalDeposited -= payoutPrincipal;
            totalShares -= dep.shares;
            totalPrincipal += payoutPrincipal;
            totalUtil += utilityForDeposit;
            emit Withdraw(msg.sender, payoutPrincipal, utilityForDeposit, dep.shares, block.timestamp, idx);
        }
        require(totalPrincipal + totalUtil > 0, "Nothing to withdraw");
        (bool success, ) = msg.sender.call{value: totalPrincipal + totalUtil}("");
        require(success, "ETH transfer failed");
        emit BatchWithdraw(msg.sender, depositIndices, totalPrincipal, totalUtil, block.timestamp);
    }

    // Retiro de un solo depósito
    function withdraw(uint256 depositIndex) external nonReentrant whenNotPaused {
        uint256[] memory single = new uint256[](1);
        single[0] = depositIndex;
        _batchWithdrawMemory(single);
    }

    // Liquidación global
    function enableGlobalLiquidation() external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(!globalLiquidationEnabled, "Already enabled");
        require(
            block.timestamp >= getEarliestDepositTimestamp() + LIQUIDATION_DEFAULT_DELAY ||
            block.timestamp >= getEarliestDepositTimestamp() + LOCKUP_PERIOD,
            "Too early"
        );
        globalLiquidationEnabled = true;
        globalLiquidationTimestamp = block.timestamp;
        _markAllDepositsFullyRedeemable();
        emit GlobalLiquidationEnabled(block.timestamp);
    }

    // Circuit breaker
    function setPaused(bool _paused) external onlyRole(PAUSER_ROLE) {
        paused = _paused;
        emit PauseChanged(_paused);
    }

    // Withdraw utiles y emergencia
    function adminWithdrawUtility(address to, uint256 amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Invalid 'to'");
        require(amount <= totalUtility, "Insufficient util");
        totalUtility -= amount;
        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit AdminWithdraw(msg.sender, to, amount, block.timestamp, "utility");
    }
    function adminEmergencyWithdrawAll(address to) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Invalid 'to'");
        require(totalDeposited == 0 && totalShares == 0, "Deposits pending");
        uint256 bal = address(this).balance;
        (bool success, ) = to.call{value: bal}("");
        require(success, "ETH transfer failed");
        emit AdminWithdraw(msg.sender, to, bal, block.timestamp, "emergency");
    }

    // Helpers vistas
    function getUnlockedDeposits(address user) external view returns (uint256 unlockedAmount, uint256[] memory unlockedIndexes) {
        DepositInfo[] storage deposits = userDeposits[user];
        uint256 count;
        unlockedIndexes = new uint256[](deposits.length);
        for (uint256 i = 0; i < deposits.length; i++) {
            DepositInfo storage dep = deposits[i];
            bool unlocked = !dep.withdrawn &&
                (block.timestamp >= dep.timestamp + LOCKUP_PERIOD ||
                dep.unlockedByAdmin ||
                (globalLiquidationEnabled && dep.fullyRedeemable));
            if (unlocked) {
                unlockedAmount += dep.amount;
                unlockedIndexes[count++] = i;
            }
        }
        assembly { mstore(unlockedIndexes, count) }
    }
    function getUtilityPool() external view returns (uint256 util) { return totalUtility; }
    function getEarliestDepositTimestamp() public view returns (uint256 earliest) {
        earliest = type(uint256).max;
        for (uint256 i=0; i<allUsers.length; i++){
            DepositInfo[] storage deposits = userDeposits[allUsers[i]];
            for (uint256 j=0; j<deposits.length; j++){
                if (deposits[j].timestamp < earliest) earliest = deposits[j].timestamp;
            }
        }
        if (earliest == type(uint256).max) earliest = block.timestamp;
    }
    function getUserDepositInfo(address user) external view returns (
        uint256[] memory amounts,
        uint256[] memory timestamps,
        bool[] memory withdrawn,
        bool[] memory unlockedByAdmin,
        bool[] memory fullyRedeemable
    ) {
        DepositInfo[] storage deposits = userDeposits[user];
        uint256 len = deposits.length;
        amounts = new uint256[](len);
        timestamps = new uint256[](len);
        withdrawn = new bool[](len);
        unlockedByAdmin = new bool[](len);
        fullyRedeemable = new bool[](len);
        for (uint256 i = 0; i < len; i++) {
            DepositInfo storage dep = deposits[i];
            amounts[i] = dep.amount;
            timestamps[i] = dep.timestamp;
            withdrawn[i] = dep.withdrawn;
            unlockedByAdmin[i] = dep.unlockedByAdmin;
            fullyRedeemable[i] = dep.fullyRedeemable;
        }
    }
    function isPoolFull() public view returns (bool) { return totalDeposited >= maxCap; }
    function poolRoomLeft() public view returns (uint256) { return totalDeposited >= maxCap ? 0 : maxCap - totalDeposited; }
    function getAllUsers(uint256 start, uint256 limit) public view returns (address[] memory users) {
        require(start < allUsers.length, "start out");
        uint256 l = limit;
        if (start + l > allUsers.length) l = allUsers.length - start;
        users = new address[](l);
        for (uint256 i=0; i < l; i++) users[i] = allUsers[start+i];
    }
    receive() external payable { revert("Use deposit/inject"); }

    function _markAllDepositsFullyRedeemable() internal {
        for(uint256 i=0; i<allUsers.length; i++){
            DepositInfo[] storage deposits = userDeposits[allUsers[i]];
            for (uint256 j = 0; j < deposits.length; j++) {
                if (!deposits[j].withdrawn) deposits[j].fullyRedeemable = true;
            }
        }
    }
}