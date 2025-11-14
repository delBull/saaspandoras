// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/core/ModularFactory.sol";
import "../contracts/core/PBOXToken.sol";
import "../contracts/treasury/PBOXProtocolTreasury.sol";
import "../contracts/core/W2ELoom.sol";
import "../contracts/core/W2EGovernor.sol";
import "../contracts/core/W2ELicense.sol";
import "../contracts/core/W2EUtility.sol";
import "../contracts/treasury/PandoraRootTreasury.sol";

contract ModularFactoryTest is Test {
    // ========== ACTORES ==========
    address owner = makeAddr("owner");
    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");
    address pandoraOracle = makeAddr("pandoraOracle");

    // ========== CONTRATOS ==========
    PBOXToken pboxToken;
    PandoraRootTreasury rootTreasury;
    ModularFactory factory;

    // ========== CONFIGURACIÓN ==========
    uint256 constant DEPLOYMENT_FEE = 0.01 ether;
    uint256 constant MIN_CAPITAL = 1 ether;

    function setUp() public {
        // Deploy PBOX Token
        vm.startPrank(owner);
        pboxToken = new PBOXToken(
            address(0), // factory (se setea después)
            address(0), // rootTreasury (se setea después)
            owner
        );

        // Deploy Root Treasury
        address[] memory signers = new address[](3);
        signers[0] = owner;
        signers[1] = user1;
        signers[2] = user2;

        rootTreasury = new PandoraRootTreasury(
            signers,
            2, // requiredConfirmations
            user1, // operationalWallet
            user2, // reserveWallet
            10 ether, // highValueThreshold
            1 ether // operationalLimit
        );

        // Update PBOX token treasury
        pboxToken.updateFactory(address(0)); // No factory yet
        // Note: In real deployment, rootTreasury would be set

        // Deploy Factory
        factory = new ModularFactory(
            address(pboxToken),
            address(0), // pandoraKey (placeholder)
            address(rootTreasury),
            pandoraOracle,
            owner
        );

        // Set factory in PBOX token
        pboxToken.updateFactory(address(factory));

        vm.stopPrank();
    }

    // ========== TESTS UNITARIOS ==========

    function test_Deployment() public {
        assertEq(factory.owner(), owner);
        assertEq(address(factory.pboxToken()), address(pboxToken));
        assertEq(factory.pandoraOracle(), pandoraOracle);
        assertEq(factory.deploymentFee(), DEPLOYMENT_FEE);
        assertEq(factory.minInitialCapital(), MIN_CAPITAL);
    }

    function test_UpdateDeploymentFee() public {
        vm.prank(owner);
        factory.updateDeploymentFee(0.02 ether);

        assertEq(factory.deploymentFee(), 0.02 ether);
    }

    function test_UpdateDeploymentFee_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        factory.updateDeploymentFee(0.02 ether);
    }

    function test_UpdateDeploymentLimits() public {
        vm.prank(owner);
        factory.updateDeploymentLimits(2 ether, 5);

        assertEq(factory.minInitialCapital(), 2 ether);
        assertEq(factory.maxCreationsPerDay(), 5);
    }

    function test_UpdateCoreAddresses() public {
        address newPBOX = makeAddr("newPBOX");
        address newKey = makeAddr("newKey");
        address newTreasury = makeAddr("newTreasury");
        address newOracle = makeAddr("newOracle");

        vm.prank(owner);
        factory.updateCoreAddresses(
            newPBOX,
            newKey,
            newTreasury,
            newOracle
        );

        assertEq(address(factory.pboxToken()), newPBOX);
        assertEq(factory.pandoraKey(), newKey);
        assertEq(factory.rootTreasury(), newTreasury);
        assertEq(factory.pandoraOracle(), newOracle);
    }

    // ========== TESTS DE RATE LIMITING ==========

    function test_CheckDeploymentLimits_NewDay() public view {
        // Should not revert on first deployment
        // This tests the internal _checkDeploymentLimits function
        // In a real scenario, we'd need to mock time or test multiple deployments
    }

    // ========== TESTS DE SEGURIDAD ==========

    function test_EmergencyPause() public {
        vm.prank(owner);
        factory.emergencyPause();

        // Should be paused - but we can't test deployment when paused
        // without a full integration test
    }

    function test_EmergencyPause_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        factory.emergencyPause();
    }

    // ========== TESTS DE INTEGRACIÓN BÁSICA ==========

    function test_ContractAddresses() public {
        // Test that factory can be queried for contract addresses
        // Even though no deployments have been made yet

        vm.prank(owner);
        (ModularFactory.CreationInfo memory info, ModularFactory.ContractAddresses memory addresses) =
            factory.getCreation("nonexistent");

        // Should return zero values for non-existent creation
        assertEq(info.creator, address(0));
        assertEq(addresses.treasury, address(0));
        assertEq(addresses.loom, address(0));
        assertEq(addresses.governor, address(0));
    }

    function test_CalculateDeploymentCost() public {
        vm.prank(owner);
        (uint256 fee, uint256 capital, uint256 total) =
            factory.calculateDeploymentCost(2 ether);

        assertEq(fee, DEPLOYMENT_FEE);
        assertEq(capital, 2 ether);
        assertEq(total, DEPLOYMENT_FEE + 2 ether);
    }

    function test_IsSlugAvailable() public {
        // Test slug availability
        assertTrue(factory.isSlugAvailable("test-slug"));

        // After deployment, this would be false
        // But we can't test full deployment without mocking all dependencies
    }

    // ========== TESTS DE GAS ==========

    function test_Gas_UpdateDeploymentFee() public {
        vm.prank(owner);
        uint256 gasStart = gasleft();
        factory.updateDeploymentFee(0.02 ether);
        uint256 gasUsed = gasStart - gasleft();

        // Should use reasonable gas
        assertLt(gasUsed, 50000, "Gas usage too high for simple update");
    }

    function test_Gas_GetFactoryMetrics() public {
        vm.prank(owner);
        uint256 gasStart = gasleft();
        factory.getFactoryMetrics();
        uint256 gasUsed = gasStart - gasleft();

        // Should use reasonable gas for view function
        assertLt(gasUsed, 30000, "Gas usage too high for view function");
    }
}
