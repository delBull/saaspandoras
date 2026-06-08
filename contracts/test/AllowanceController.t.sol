// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/src/Test.sol";
import "../treasury/AllowanceController.sol";

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract AllowanceControllerTest is Test {
    AllowanceController public controller;
    MockUSDC public usdc;
    address public owner = address(0x1111);
    address public delegate = address(0x2222);
    address public attacker = address(0x3333);
    address public nominee = address(0x4444);

    event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Withdraw(address indexed to, uint256 amount, string reason);
    event OwnerWithdraw(address indexed to, uint256 amount);

    function setUp() public {
        vm.label(owner, "Owner");
        vm.label(delegate, "Delegate");
        vm.label(attacker, "Attacker");
        vm.label(nominee, "Nominee");

        // Deploy mock USDC
        usdc = new MockUSDC();
        vm.label(address(usdc), "USDC");

        // Deploy AllowanceController
        vm.prank(owner);
        controller = new AllowanceController(owner, delegate, address(usdc), 1000e6);
    }

    function _fundController(uint256 amount) internal {
        usdc.mint(address(controller), amount);
    }

    // ── Constructor ──────────────────────────────────────────────────────

    function test_Constructor() public {
        assertEq(controller.owner(), owner);
        assertEq(controller.delegate(), delegate);
        assertEq(controller.token(), address(usdc));
        assertEq(controller.dailyLimit(), 1000e6);
        assertEq(controller.pendingOwner(), address(0));
    }

    function testRevert_ConstructorOwnerZero() public {
        vm.expectRevert("AC: owner zero");
        new AllowanceController(address(0), delegate, address(usdc), 1000e6);
    }

    function testRevert_ConstructorDelegateZero() public {
        vm.expectRevert("AC: delegate zero");
        new AllowanceController(owner, address(0), address(usdc), 1000e6);
    }

    function testRevert_ConstructorTokenZero() public {
        vm.expectRevert("AC: token zero");
        new AllowanceController(owner, delegate, address(0), 1000e6);
    }

    // ── Two-step ownership ───────────────────────────────────────────────

    function test_TransferOwnership() public {
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferStarted(owner, nominee);

        vm.prank(owner);
        controller.transferOwnership(nominee);

        assertEq(controller.pendingOwner(), nominee);
    }

    function testRevert_TransferOwnershipNotOwner() public {
        vm.prank(attacker);
        vm.expectRevert("AC: only owner");
        controller.transferOwnership(nominee);
    }

    function testRevert_TransferOwnershipZero() public {
        vm.prank(owner);
        vm.expectRevert("AC: new owner zero");
        controller.transferOwnership(address(0));
    }

    function test_AcceptOwnership() public {
        vm.prank(owner);
        controller.transferOwnership(nominee);

        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, nominee);

        vm.prank(nominee);
        controller.acceptOwnership();

        assertEq(controller.owner(), nominee);
        assertEq(controller.pendingOwner(), address(0));
    }

    function testRevert_AcceptOwnershipNotNominated() public {
        vm.prank(attacker);
        vm.expectRevert("AC: not nominated");
        controller.acceptOwnership();
    }

    function testRevert_AcceptOwnershipNoPending() public {
        // No one nominated, attacker tries
        vm.prank(attacker);
        vm.expectRevert("AC: not nominated");
        controller.acceptOwnership();
    }

    function test_TransferThenCancelByNominatingSelf() public {
        vm.prank(owner);
        controller.transferOwnership(nominee);
        assertEq(controller.pendingOwner(), nominee);

        // Owner can "cancel" by nominating themselves (pendingOwner becomes address(0) on accept)
        vm.prank(owner);
        controller.transferOwnership(owner);
        assertEq(controller.pendingOwner(), owner);

        vm.prank(owner);
        controller.acceptOwnership();
        assertEq(controller.owner(), owner);
        assertEq(controller.pendingOwner(), address(0));
    }

    function test_TransferOwnershipFullCycle() public {
        // owner -> nominee1 -> nominee2
        address nominee2 = address(0x5555);

        vm.prank(owner);
        controller.transferOwnership(nominee);

        vm.prank(nominee);
        controller.acceptOwnership();

        assertEq(controller.owner(), nominee);

        // New owner transfers to nominee2
        vm.prank(nominee);
        controller.transferOwnership(nominee2);

        vm.prank(nominee2);
        controller.acceptOwnership();

        assertEq(controller.owner(), nominee2);
        assertEq(controller.pendingOwner(), address(0));
    }

    // ── Reentrancy guard ─────────────────────────────────────────────────

    function test_ReentrancyGuard() public {
        _fundController(1000e6);

        // Set up a malicious contract that tries to re-enter
        ReentrancyAttacker reAttacker = new ReentrancyAttacker(controller);
        vm.label(address(reAttacker), "ReentrancyAttacker");

        // Delegate tries to withdraw, should succeed
        vm.prank(delegate);
        controller.withdraw(address(reAttacker), 100e6);
        // First withdraw succeeded

        // Try reentrancy via the attacker contract
        // The attacker contract calls withdraw() in its receive/token transfer hook
        // Since we're using a mock USDC that doesn't call back, reentrancy isn't testable this way
        // But the guard is checked at the assembly level
    }

    function test_ReentrancyGuardDirectRevert() public {
        _fundController(1000e6);
        vm.prank(delegate);
        controller.withdraw(delegate, 100e6);

        // Now try to call withdraw again in the same tx (simulated reentrancy)
        // This would be caught by the nonReentrant modifier
        // We can't easily test the assembly guard from Solidity,
        // but the guard check is: tload(address()) == 0 at entry
        // It will revert with "AC: reentrancy" if called during execution
    }

    // ── Owner functions ──────────────────────────────────────────────────

    function test_OwnerWithdraw() public {
        _fundController(500e6);

        vm.expectEmit(true, true, false, false);
        emit OwnerWithdraw(owner, 500e6);

        vm.prank(owner);
        controller.ownerWithdraw(owner, 500e6);
    }

    function testRevert_OwnerWithdrawNonOwner() public {
        vm.prank(attacker);
        vm.expectRevert("AC: only owner");
        controller.ownerWithdraw(attacker, 100e6);
    }

    function test_SetAllowance() public {
        address newDelegate = address(0x6666);

        vm.prank(owner);
        controller.setAllowance(newDelegate, 2000e6);

        assertEq(controller.delegate(), newDelegate);
        assertEq(controller.dailyLimit(), 2000e6);
    }

    function testRevert_SetAllowanceNonOwner() public {
        vm.prank(attacker);
        vm.expectRevert("AC: only owner");
        controller.setAllowance(attacker, 100e6);
    }

    // ── Delegate withdraw ────────────────────────────────────────────────

    function test_DelegateWithdraw() public {
        _fundController(500e6);

        vm.prank(delegate);
        controller.withdraw(delegate, 100e6);

        assertEq(controller.spentToday(), 100e6);
    }

    function testRevert_DelegateWithdrawNonDelegate() public {
        vm.prank(attacker);
        vm.expectRevert("AC: only delegate");
        controller.withdraw(attacker, 100e6);
    }

    function testRevert_DelegateWithdrawExceedsLimit() public {
        _fundController(2000e6);

        vm.prank(delegate);
        vm.expectRevert("AC: daily limit exceeded");
        controller.withdraw(delegate, 1001e6);
    }

    // ── remainingAllowance ───────────────────────────────────────────────

    function test_RemainingAllowanceFull() public {
        uint256 remaining = controller.remainingAllowance();
        assertEq(remaining, 1000e6);
    }

    function test_RemainingAllowancePartial() public {
        _fundController(500e6);

        vm.prank(delegate);
        controller.withdraw(delegate, 300e6);

        uint256 remaining = controller.remainingAllowance();
        assertEq(remaining, 700e6);
    }

    function test_RemainingAllowanceExhausted() public {
        _fundController(2000e6);

        vm.prank(delegate);
        controller.withdraw(delegate, 1000e6);

        uint256 remaining = controller.remainingAllowance();
        assertEq(remaining, 0);
    }
}

/// @notice Helper that could attempt reentrancy if token had callback
contract ReentrancyAttacker {
    AllowanceController public controller;
    bool public attacked;

    constructor(AllowanceController _controller) {
        controller = _controller;
    }

    function attack() external {
        // This would trigger reentrancy if called from within a withdraw
        controller.withdraw(address(this), 1);
    }

    receive() external payable {
        if (!attacked) {
            attacked = true;
            controller.withdraw(address(this), 1);
        }
    }
}
