// Sources flattened with hardhat v2.24.2 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/access/IAccessControl.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (access/IAccessControl.sol)

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


// File @openzeppelin/contracts/utils/Context.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

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


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/introspection/IERC165.sol)

pragma solidity ^0.8.20;

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


// File @openzeppelin/contracts/utils/introspection/ERC165.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/introspection/ERC165.sol)

pragma solidity ^0.8.20;

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


// File @openzeppelin/contracts/access/AccessControl.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;



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


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

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


// File contracts/PoolFamilyAndFriends.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;



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
