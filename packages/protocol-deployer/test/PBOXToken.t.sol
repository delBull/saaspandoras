// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/core/PBOXToken.sol";

contract PBOXTokenTest is Test {
    // ========== ACTORES ==========
    address owner = makeAddr("owner");
    address factory = makeAddr("factory");
    address treasury = makeAddr("treasury");
    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");
    address burner = makeAddr("burner");

    // ========== CONTRATO ==========
    PBOXToken token;

    // ========== CONSTANTES ==========
    uint256 constant MAX_SUPPLY = 100_000_000 * 10**18;
    uint256 constant CONVERSION_FEE = 50; // 0.5%
    uint256 constant MIN_CONVERSION = 100 * 10**18;
    uint256 constant MAX_DAILY_CONVERSION = 1000 * 10**18;

    function setUp() public {
        vm.startPrank(owner);
        token = new PBOXToken(factory, treasury, owner);
        vm.stopPrank();

        // Autorizar burner
        vm.prank(owner);
        token.authorizeBurner(burner);
    }

    // ========== TESTS DE DEPLOYMENT ==========

    function test_Deployment() public {
        assertEq(token.name(), "Pandora's BOX Token");
        assertEq(token.symbol(), "PBOX");
        assertEq(token.factory(), factory);
        assertEq(token.rootTreasury(), treasury);
        assertEq(token.conversionFeeBps(), CONVERSION_FEE);
        assertEq(token.minConversionAmount(), MIN_CONVERSION);
        assertEq(token.maxDailyConversion(), MAX_DAILY_CONVERSION);
        assertEq(token.MAX_TOTAL_SUPPLY(), MAX_SUPPLY);
    }

    // ========== TESTS DE ROLES Y ACCESO ==========

    function test_Roles() public {
        // Owner should have admin role
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(token.hasRole(token.ADMIN_ROLE(), owner));

        // Factory should have minter role
        assertTrue(token.hasRole(token.MINTER_ROLE(), factory));

        // Burner should have burner role
        assertTrue(token.hasRole(token.BURNER_ROLE(), burner));
    }

    function test_UpdateFactory() public {
        address newFactory = makeAddr("newFactory");

        vm.prank(owner);
        token.updateFactory(newFactory);

        assertEq(token.factory(), newFactory);
        assertTrue(token.hasRole(token.MINTER_ROLE(), newFactory));
        assertTrue(token.hasRole(token.BURNER_ROLE(), newFactory));

        // Old factory should not have roles
        assertFalse(token.hasRole(token.MINTER_ROLE(), factory));
        assertFalse(token.hasRole(token.BURNER_ROLE(), factory));
    }

    function test_UpdateFactory_NotAdmin() public {
        address newFactory = makeAddr("newFactory");

        vm.prank(user1);
        vm.expectRevert("PBOX: Only admin");
        token.updateFactory(newFactory);
    }

    // ========== TESTS DE MINTING ==========

    function test_Mint() public {
        uint256 amount = 1000 * 10**18;

        vm.prank(factory);
        token.mint(user1, amount, "test mint");

        assertEq(token.balanceOf(user1), amount);
        assertEq(token.totalSupply(), amount);
    }

    function test_Mint_NotMinter() public {
        uint256 amount = 1000 * 10**18;

        vm.prank(user1);
        vm.expectRevert("AccessControl: account 0x0000000000000000000000000000000000000001 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b84012186bb8d1f2ffd703a83");
        token.mint(user1, amount, "test mint");
    }

    function test_Mint_ExceedMaxSupply() public {
        uint256 amount = MAX_SUPPLY + 1;

        vm.prank(factory);
        vm.expectRevert("PBOX: Max supply exceeded");
        token.mint(user1, amount, "test mint");
    }

    function test_Mint_ZeroAmount() public {
        vm.prank(factory);
        vm.expectRevert("PBOX: Amount must be positive");
        token.mint(user1, 0, "test mint");
    }

    function test_Mint_InvalidRecipient() public {
        uint256 amount = 1000 * 10**18;

        vm.prank(factory);
        vm.expectRevert("PBOX: Invalid recipient");
        token.mint(address(0), amount, "test mint");
    }

    // ========== TESTS DE BURNING ==========

    function test_BurnFromAuthorized() public {
        uint256 amount = 500 * 10**18;

        // First mint some tokens
        vm.prank(factory);
        token.mint(user1, amount, "mint for burn test");

        // Burn from authorized burner
        vm.prank(burner);
        token.burnFromAuthorized(user1, amount, "test burn");

        assertEq(token.balanceOf(user1), 0);
        assertEq(token.totalSupply(), 0); // Tokens were burned
    }

    function test_BurnFromAuthorized_NotBurner() public {
        uint256 amount = 500 * 10**18;

        vm.prank(factory);
        token.mint(user1, amount, "mint for burn test");

        vm.prank(user2);
        vm.expectRevert("AccessControl: account 0x0000000000000000000000000000000000000002 is missing role 0x3c11d16cba7c8f84e3aac36caeba3ce5a466f4705");
        token.burnFromAuthorized(user1, amount, "test burn");
    }

    function test_BurnFromAuthorized_InsufficientBalance() public {
        vm.prank(burner);
        vm.expectRevert("PBOX: Insufficient balance");
        token.burnFromAuthorized(user1, 100 * 10**18, "test burn");
    }

    // ========== TESTS DE CONVERSIÓN A LIQUIDEZ ==========

    function test_ConvertToLiquidity() public {
        uint256 amount = 1000 * 10**18; // 1000 PBOX
        address backingAsset = makeAddr("ETH");

        // Mint tokens to user
        vm.prank(factory);
        token.mint(user1, amount, "mint for conversion");

        // Convert to liquidity
        vm.prank(user1);
        token.convertToLiquidity(amount, backingAsset);

        // Check balances
        uint256 expectedFee = (amount * CONVERSION_FEE) / 10000; // 0.5%
        uint256 expectedNet = amount - expectedFee;

        assertEq(token.balanceOf(user1), 0); // All tokens burned
        assertEq(token.totalSupply(), 0); // Tokens were burned
    }

    function test_ConvertToLiquidity_BelowMinimum() public {
        uint256 amount = 50 * 10**18; // Below minimum

        vm.prank(factory);
        token.mint(user1, amount, "mint for conversion");

        vm.prank(user1);
        vm.expectRevert("PBOX: Below minimum conversion");
        token.convertToLiquidity(amount, makeAddr("ETH"));
    }

    function test_ConvertToLiquidity_ExceedDailyLimit() public {
        uint256 amount = MAX_DAILY_CONVERSION + 1;

        vm.prank(factory);
        token.mint(user1, amount, "mint for conversion");

        vm.prank(user1);
        vm.expectRevert("PBOX: Daily conversion limit exceeded");
        token.convertToLiquidity(amount, makeAddr("ETH"));
    }

    function test_ConvertToLiquidity_InvalidAsset() public {
        uint256 amount = MIN_CONVERSION;

        vm.prank(factory);
        token.mint(user1, amount, "mint for conversion");

        vm.prank(user1);
        vm.expectRevert("PBOX: Invalid backing asset");
        token.convertToLiquidity(amount, address(0));
    }

    // ========== TESTS DE CONFIGURACIÓN ==========

    function test_UpdateConversionFee() public {
        uint256 newFee = 100; // 1%

        vm.prank(owner);
        token.updateConversionFee(newFee);

        assertEq(token.conversionFeeBps(), newFee);
    }

    function test_UpdateConversionFee_TooHigh() public {
        uint256 newFee = 1001; // 10.01% - too high

        vm.prank(owner);
        vm.expectRevert("PBOX: Fee too high");
        token.updateConversionFee(newFee);
    }

    function test_UpdateConversionLimits() public {
        uint256 newMin = 200 * 10**18;
        uint256 newMax = 2000 * 10**18;

        vm.prank(owner);
        token.updateConversionLimits(newMin, newMax);

        assertEq(token.minConversionAmount(), newMin);
        assertEq(token.maxDailyConversion(), newMax);
    }

    function test_UpdateConversionLimits_Invalid() public {
        vm.prank(owner);
        vm.expectRevert("PBOX: Invalid max daily");
        token.updateConversionLimits(200 * 10**18, 100 * 10**18); // max < min
    }

    // ========== TESTS DE AUTORIZACIÓN DE BURNERS ==========

    function test_AuthorizeBurner() public {
        address newBurner = makeAddr("newBurner");

        vm.prank(owner);
        token.authorizeBurner(newBurner);

        assertTrue(token.hasRole(token.BURNER_ROLE(), newBurner));
    }

    function test_AuthorizeBurner_NotAdmin() public {
        address newBurner = makeAddr("newBurner");

        vm.prank(user1);
        vm.expectRevert("PBOX: Only admin");
        token.authorizeBurner(newBurner);
    }

    function test_RevokeBurner() public {
        vm.prank(owner);
        token.revokeBurner(burner);

        assertFalse(token.hasRole(token.BURNER_ROLE(), burner));
    }

    // ========== TESTS DE VISTAS ==========

    function test_GetTokenInfo() public {
        (
            uint256 totalSupply_,
            uint256 maxSupply_,
            uint256 conversionFee_,
            uint256 minConversion_,
            uint256 maxDailyConversion_
        ) = token.getTokenInfo();

        assertEq(totalSupply_, 0);
        assertEq(maxSupply_, MAX_SUPPLY);
        assertEq(conversionFee_, CONVERSION_FEE);
        assertEq(minConversion_, MIN_CONVERSION);
        assertEq(maxDailyConversion_, MAX_DAILY_CONVERSION);
    }

    function test_CanConvert() public {
        uint256 amount = MIN_CONVERSION;

        // No balance - should return false
        assertFalse(token.canConvert(user1, amount));

        // Mint tokens
        vm.prank(factory);
        token.mint(user1, amount, "test");

        // Now should return true
        assertTrue(token.canConvert(user1, amount));
    }

    function test_CalculateConversion() public {
        uint256 amount = 1000 * 10**18;

        (uint256 feeAmount, uint256 netAmount, uint256 totalCost) =
            token.calculateConversion(amount);

        uint256 expectedFee = (amount * CONVERSION_FEE) / 10000;
        uint256 expectedNet = amount - expectedFee;

        assertEq(feeAmount, expectedFee);
        assertEq(netAmount, expectedNet);
        assertEq(totalCost, amount);
    }

    // ========== TESTS DE GAS ==========

    function test_Gas_Mint() public {
        uint256 amount = 1000 * 10**18;

        vm.prank(factory);
        uint256 gasStart = gasleft();
        token.mint(user1, amount, "gas test");
        uint256 gasUsed = gasStart - gasleft();

        assertLt(gasUsed, 100000, "Mint gas usage too high");
    }

    function test_Gas_Transfer() public {
        uint256 amount = 1000 * 10**18;

        vm.prank(factory);
        token.mint(user1, amount, "mint for transfer");

        vm.prank(user1);
        uint256 gasStart = gasleft();
        token.transfer(user2, amount / 2);
        uint256 gasUsed = gasStart - gasleft();

        assertLt(gasUsed, 80000, "Transfer gas usage too high");
    }

    // ========== TESTS DE SEGURIDAD ==========

    function test_Burn_DirectBurnBlocked() public {
        uint256 amount = 1000 * 10**18;

        vm.prank(factory);
        token.mint(user1, amount, "mint for direct burn");

        vm.prank(user1);
        vm.expectRevert("AccessControl: account 0x0000000000000000000000000000000000000001 is missing role 0x3c11d16cba7c8f84e3aac36caeba3ce5a466f4705");
        token.burn(amount);
    }

    function test_BurnFrom_DirectBurnFromBlocked() public {
        uint256 amount = 1000 * 10**18;

        vm.prank(factory);
        token.mint(user1, amount, "mint for direct burnFrom");

        vm.prank(user1);
        vm.expectRevert("AccessControl: account 0x0000000000000000000000000000000000000001 is missing role 0x3c11d16cba7c8f84e3aac36caeba3ce5a466f4705");
        token.burnFrom(user1, amount);
    }
}
