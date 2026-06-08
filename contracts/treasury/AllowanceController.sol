// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AllowanceController — Per-project daily-limited USDC withdraws
/// @author Pandora's Finance
/// @notice Owner sets daily limit for a delegate (admin wallet).
///         Delegate can withdraw up to limit/day. Owner has unlimited access.
/// @dev Intended to be deployed once per project, holding that project's USDC.
contract AllowanceController {
    address public owner;
    address public pendingOwner;
    address public delegate;
    address public token;
    uint256 public dailyLimit;
    uint256 public startTime;
    uint256 public spentToday;

    event AllowanceSet(address indexed delegate, uint256 dailyLimit);
    event Withdraw(address indexed to, uint256 amount, string reason);
    event OwnerWithdraw(address indexed to, uint256 amount);
    event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "AC: only owner");
        _;
    }

    modifier onlyDelegate() {
        _onlyDelegate();
        _;
    }

    function _onlyDelegate() internal view {
        require(msg.sender == delegate, "AC: only delegate");
    }

    modifier nonReentrant() {
        uint256 _status;
        assembly { _status := tload(address()) }
        require(_status == 0, "AC: reentrancy");
        assembly { tstore(address(), 1) }
        _;
        assembly { tstore(address(), 0) }
    }

    constructor(address _owner, address _delegate, address _token, uint256 _dailyLimit) {
        require(_owner != address(0), "AC: owner zero");
        require(_delegate != address(0), "AC: delegate zero");
        require(_token != address(0), "AC: token zero");
        owner = _owner;
        delegate = _delegate;
        token = _token;
        dailyLimit = _dailyLimit;
        startTime = block.timestamp;
    }

    /// @notice Delegate withdraws USDC to `to` (respects daily limit)
    function withdraw(address to, uint256 amount) external onlyDelegate nonReentrant {
        _resetDailyIfNeeded();
        require(spentToday + amount <= dailyLimit, "AC: daily limit exceeded");
        spentToday += amount;
        _safeTransfer(to, amount);
        emit Withdraw(to, amount, "delegate withdraw");
    }

    /// @notice Owner withdraws USDC (no limit)
    function ownerWithdraw(address to, uint256 amount) external onlyOwner {
        _safeTransfer(to, amount);
        emit OwnerWithdraw(to, amount);
    }

    /// @notice Owner updates delegate and/or daily limit
    function setAllowance(address _delegate, uint256 _dailyLimit) external onlyOwner {
        delegate = _delegate;
        dailyLimit = _dailyLimit;
        startTime = block.timestamp;
        spentToday = 0;
        emit AllowanceSet(_delegate, _dailyLimit);
    }

    /// @notice Owner nominates a new owner (two-step transfer)
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AC: new owner zero");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Pending owner accepts the ownership
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "AC: not nominated");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    /// @notice Check remaining allowance for today
    function remainingAllowance() external view returns (uint256) {
        uint256 limit = dailyLimit;
        uint256 spent = block.timestamp >= startTime + 1 days ? 0 : spentToday;
        return limit > spent ? limit - spent : 0;
    }

    function _resetDailyIfNeeded() internal {
        if (block.timestamp >= startTime + 1 days) {
            startTime = block.timestamp;
            spentToday = 0;
        }
    }

    function _safeTransfer(address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "AC: transfer failed");
    }
}
