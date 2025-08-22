// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev External interface of AccessControl declared to support ERC-165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted to signal this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165 is IERC165 {
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}


/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` from `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


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
