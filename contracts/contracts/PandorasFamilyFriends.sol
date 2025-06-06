// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TimeLockedInvestmentVault is ERC4626, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public constant LOCKUP_PERIOD = 180 days;
    uint256 public constant maxCap = 5_000_000 * 1e6;
    uint256 public totalDeposited;
    bool public paused;

    struct DepositInfo { uint256 amount; uint256 timestamp; uint256 shares; bool withdrawn; }
    mapping(address => DepositInfo[]) public userDeposits;

    event TimeLockedDeposit(address indexed user, uint256 amount, uint256 shares, uint256 when);
    event Withdraw(address indexed user, uint256 amount, uint256 shares, uint256 when);
    event AdminWithdraw(address indexed admin, address indexed to, uint256 amount, uint256 when);
    event PauseChanged(bool paused);

    modifier whenNotPaused() { require(!paused, "Vault paused"); _; }

    constructor(IERC20 _asset, string memory _name, string memory _symbol)
        ERC20(_name, _symbol) ERC4626(_asset)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function deposit(uint256 assets, address receiver)
        public override nonReentrant whenNotPaused returns (uint256 shares)
    {
        require(totalDeposited + assets <= maxCap, "Pool cap reached");
        shares = super.deposit(assets, receiver);
        userDeposits[receiver].push(DepositInfo({
            amount: assets,
            timestamp: block.timestamp,
            shares: shares,
            withdrawn: false
        }));
        totalDeposited += assets;
        emit TimeLockedDeposit(receiver, assets, shares, block.timestamp);
    }

    function withdraw(uint256 assets, address receiver, address owner)
        public override nonReentrant whenNotPaused returns (uint256 shares)
    {
        require(owner == msg.sender || allowance(owner, msg.sender) >= assets, "Not allowed");
        uint256 unlockedShares = getUnlockedShares(owner);
        require(unlockedShares > 0, "Nothing unlocked");
        shares = previewWithdraw(assets);
        require(shares <= unlockedShares, "Withdraw only unlocked shares");

        uint256 remaining = shares;
        for (uint256 i = 0; i < userDeposits[owner].length && remaining > 0; i++) {
            DepositInfo storage dep = userDeposits[owner][i];
            if (!dep.withdrawn && block.timestamp >= dep.timestamp + LOCKUP_PERIOD) {
                uint256 toWithdraw = dep.shares > remaining ? remaining : dep.shares;
                dep.shares -= toWithdraw;
                if (dep.shares == 0) dep.withdrawn = true;
                remaining -= toWithdraw;
            }
        }
        super.withdraw(assets, receiver, owner);
        emit Withdraw(owner, assets, shares, block.timestamp);
    }

    function adminWithdrawUnderlying(address to, uint256 amount)
        external onlyRole(ADMIN_ROLE) nonReentrant
    {
        require(to != address(0), "Invalid to");
        IERC20(asset()).safeTransfer(to, amount);
        emit AdminWithdraw(msg.sender, to, amount, block.timestamp);
    }

    function setPaused(bool _paused) external onlyRole(ADMIN_ROLE) {
        paused = _paused;
        emit PauseChanged(_paused);
    }

    function getUnlockedShares(address user) public view returns (uint256 unlocked) {
        DepositInfo[] storage deposits = userDeposits[user];
        for (uint256 i = 0; i < deposits.length; i++) {
            if (!deposits[i].withdrawn && block.timestamp >= deposits[i].timestamp + LOCKUP_PERIOD) {
                unlocked += deposits[i].shares;
            }
        }
    }

    function isPoolFull() public view returns (bool) {
        return totalDeposited >= maxCap;
    }

    function poolRoomLeft() public view returns (uint256) {
        return totalDeposited >= maxCap ? 0 : maxCap - totalDeposited;
    }
}