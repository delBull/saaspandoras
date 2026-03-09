// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interfaces for typing
import "../core/ProtocolRegistry.sol";
import "../core/W2EUtility.sol";
import "../core/W2ELoomV2.sol";
import "../treasury/PBOXProtocolTreasury.sol";
import "../core/W2EGovernor.sol";
import "../core/W2ELicense.sol";

/**
 * @title PandorasProtocolFactory
 * @notice Factory for deterministic, atomic deployment of the W2E Protocol suite using CREATE2.
 */
contract PandorasProtocolFactory is Ownable {

    event ProtocolDeployed(
        address indexed owner,
        bytes32 indexed salt,
        address registry,
        address utilityToken,
        address loom,
        address treasury,
        address governor,
        address licenseToken
    );

    // Grouping all primitive and simple struct parameters to avoid "Stack too deep" errors
    struct ProtocolConfig {
        address pandoraRootTreasury;
        address pandoraOracle;
        address platformFeeWallet;
        address creatorWallet;
        uint256 creatorPayoutPct;
        uint256 minQuorumPercentage;
        uint256 votingPeriodSeconds;
        uint256 emergencyPeriodSeconds;
        uint256 emergencyQuorumPct;
        uint256 stakingRewardRate;
        uint256 phiFundSplitPct;
        
        string utilityTokenName;
        string utilityTokenSymbol;
        uint256 utilityFeePercentage;
        
        string licenseName;
        string licenseSymbol;
        uint256 licenseMaxSupply;
        uint256 licensePrice;
        bool licenseTransferable;
        bool licenseBurnable;

        uint256 treasuryPandoraConfirmations;
        uint256 treasuryDaoConfirmations;
        uint256 treasuryEmergencyThreshold;
        uint256 treasuryEmergencyInactivityDays;
        uint256 treasuryDirectOperationLimit;
        uint256 treasuryDailySpendingLimit;
        
        address initialOwner; 
    }

    struct ProtocolActors {
        address[] treasuryPandoraSigners;
        address[] treasuryDaoSigners;
    }

    struct ProtocolBytecodes {
        bytes registry;
        bytes utility;
        bytes loom;
        bytes treasury;
        bytes governor;
        bytes license;
    }

    /**
     * @notice Computes the CREATE2 address for a given salt and bytecode mapping.
     * @param salt The unique bytes32 identifier (e.g. keccak256 of project slug)
     * @param creationCode The full compiled bytecode including constructor arguments
     */
    function predictAddress(bytes32 salt, bytes memory creationCode) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(creationCode)
            )
        );
        return address(uint160(uint256(hash)));
    }

    /**
     * @dev Internal deployment helper using inline assembly
     */
    function _deploy(bytes memory creationCode, bytes32 salt, string memory name) internal returns (address addr) {
        require(creationCode.length > 0, "PandorasFactory: Empty creation code");
        
        assembly ("memory-safe") {
            addr := create2(0, add(creationCode, 0x20), mload(creationCode), salt)
        }
        if (addr == address(0)) {
            revert(string(abi.encodePacked("PandorasFactory: Failed to deploy ", name)));
        }
        
        uint32 size;
        assembly { size := extcodesize(addr) }
        if (size == 0) {
            revert(string(abi.encodePacked("PandorasFactory: Empty codesize for ", name)));
        }
    }

    /**
     * @notice Atomically deploys the entire W2E V2 Protocol Suite deterministically.
     * @dev Bytecodes are passed directly so we don't have to re-deploy the factory when upgrading protocol implementations.
     */
    function deployProtocol(
        bytes32 salt,
        ProtocolConfig calldata config,
        ProtocolActors calldata actors,
        ProtocolBytecodes calldata bytecodes
    ) external onlyOwner returns (
        address registry,
        address utilityToken,
        address loom,
        address treasury,
        address governor,
        address licenseToken
    ) {
        // Step 1: Deploy components with `address(this)` as placeholder for circular dependencies.
        // Doing this ensures `creationCode` is strictly deterministic WITHOUT needing to know
        // the address of other cyclically dependent contracts.

        // 1a. Registry
        bytes memory regInit = abi.encodePacked(bytecodes.registry, abi.encode(address(this)));
        registry = _deploy(regInit, salt, "Registry");

        // 1b. Utility (W2EUtility.sol)
        bytes memory utilInit = abi.encodePacked(
            bytecodes.utility,
            abi.encode(
                config.utilityTokenName, 
                config.utilityTokenSymbol, 
                uint8(18), 
                config.utilityFeePercentage, 
                config.platformFeeWallet, 
                address(this)
            )
        );
        utilityToken = _deploy(utilInit, salt, "Utility");

        // 1c. Loom (W2ELoomV2.sol)
        bytes memory loomInit = abi.encodePacked(
            bytecodes.loom,
            abi.encode(
                registry,
                utilityToken,
                config.pandoraRootTreasury,
                address(this), // PLACEHOLDER: _protocolTreasuryAddress
                config.pandoraOracle,
                config.platformFeeWallet,
                config.creatorWallet,
                config.creatorPayoutPct,
                config.minQuorumPercentage,
                config.votingPeriodSeconds,
                config.emergencyPeriodSeconds,
                config.emergencyQuorumPct,
                config.stakingRewardRate,
                config.phiFundSplitPct,
                address(this) // initialOwner
            )
        );
        loom = _deploy(loomInit, salt, "Loom");

        // 1d. Treasury (PBOXProtocolTreasury.sol)
        bytes memory treasuryInit = abi.encodePacked(
            bytecodes.treasury,
            abi.encode(
                actors.treasuryPandoraSigners,
                actors.treasuryDaoSigners,
                config.pandoraOracle,
                address(this), // PLACEHOLDER: _protocolGovernor
                config.treasuryPandoraConfirmations,
                config.treasuryDaoConfirmations,
                config.treasuryEmergencyThreshold,
                config.treasuryEmergencyInactivityDays,
                config.treasuryDirectOperationLimit,
                config.treasuryDailySpendingLimit,
                address(this) // initialOwner (Not really used for treasury as it transfers to governor, but for consistency)
            )
        );
        treasury = _deploy(treasuryInit, salt, "Treasury");

        // 1e. Governor (W2EGovernor.sol)
        bytes memory governorInit = abi.encodePacked(
            bytecodes.governor,
            abi.encode(
                address(this), // PLACEHOLDER: _licenseToken
                loom,          // We already have loom locally!
                config.minQuorumPercentage,
                100,           // _votingDelaySeconds (Default value usually 100 blocks)
                config.votingPeriodSeconds,
                3600,          // _executionDelaySeconds (Default 1 hour)
                address(this)  // initialOwner
            )
        );
        governor = _deploy(governorInit, salt, "Governor");

        // 1f. License (W2ELicenseNFT.sol typically, but using W2ELicense ABI)
        bytes memory licenseInit = abi.encodePacked(
            bytecodes.license,
            abi.encode(
                config.licenseName,
                config.licenseSymbol,
                config.licenseMaxSupply,
                config.licensePrice,
                config.pandoraOracle,
                treasury,      // We already have treasury locally!
                address(this), // initialOwner
                config.licenseTransferable,
                config.licenseBurnable
            )
        );
        licenseToken = _deploy(licenseInit, salt, "License");

        // Step 2: Resolve Placeholders immediately via Setters
        W2ELoomV2(loom).setProtocolTreasuryAddress(treasury);
        PBOXProtocolTreasury(payable(treasury)).setProtocolGovernor(governor);
        W2EGovernor(governor).setLicenseToken(licenseToken);
        W2EGovernor(governor).setW2ELoomAddress(loom);

        // Wire Utility token mapping
        // Factory cast interface call, assuming W2EUtility has setW2ELoomAddress (even if IW2EUtility doesnt)
        (bool success, ) = utilityToken.call(abi.encodeWithSignature("setW2ELoomAddress(address)", loom));
        require(success, "PandorasFactory: setW2ELoomAddress failed");

        // Wire Ecosystem mapping
        ProtocolRegistry(registry).registerArtifact(licenseToken, ProtocolRegistry.ArtifactType.Membership);

        // Step 3: Transfer ownership to destination
        // Note: PBOXProtocolTreasury already transferred its ownership to `protocolGovernor` in constructor, 
        // which was address(this). So we just transfer it again to the REAL governor.
        PBOXProtocolTreasury(payable(treasury)).transferOwnership(governor);
        
        W2ELoomV2(loom).transferOwnership(governor);
        ProtocolRegistry(registry).transferOwnership(governor);
        
        // Use low-level call for transferOwnership on Utility and License to bypass interface requirements
        (bool uSuccess, ) = utilityToken.call(abi.encodeWithSignature("transferOwnership(address)", governor));
        require(uSuccess, "PandorasFactory: utility transferOwnership failed");
        
        (bool lSuccess, ) = licenseToken.call(abi.encodeWithSignature("transferOwnership(address)", governor));
        require(lSuccess, "PandorasFactory: license transferOwnership failed");

        // Governor is the ultimate owner of the protocol components.
        // User requesting deployment will own the Governor contract.
        W2EGovernor(governor).transferOwnership(config.initialOwner);

        emit ProtocolDeployed(
            config.initialOwner,
            salt,
            registry,
            utilityToken,
            loom,
            treasury,
            governor,
            licenseToken
        );
    }
}
