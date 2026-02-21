// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProtocolRegistry
 * @notice Central registry for authorized artifacts (NFTs/Tokens) in a W2E Protocol ecosystem.
 * @dev Allows categorizing assets and checking ownership for governance and rewards.
 */
contract ProtocolRegistry is Ownable {
    
    /// @notice Explicit version of the protocol
    uint8 public constant PROTOCOL_VERSION = 2;
    
    enum ArtifactType {
        Access,
        Identity,
        Membership,
        Coupon,
        Reputation,
        Yield
    }

    struct ArtifactInfo {
        address artifactAddress;
        ArtifactType artifactType;
        bool isAuthorized;
        uint256 registeredAt;
    }

    /// @notice List of all registered artifacts
    address[] public artifactList;
    
    /// @notice Mapping from artifact address to its information
    mapping(address => ArtifactInfo) public artifacts;

    /// @notice Event emitted when a new artifact is registered
    event ArtifactRegistered(address indexed artifact, ArtifactType artifactType);
    
    /// @notice Event emitted when an artifact authorization is updated
    /// @dev This is the primary event for tracking lifecycle changes.
    /// State Transitions:
    /// - Authorization enabled: true (Artifact becomes active gatekeeper)
    /// - Authorization revoked: false (Access denied immediately for all holders)
    event ArtifactAuthorizationUpdated(address indexed artifact, bool isAuthorized);

    constructor(address initialOwner) Ownable() {
        if (initialOwner != address(0) && initialOwner != msg.sender) {
            transferOwnership(initialOwner);
        }
    }

    /**
     * @notice Registers a new artifact in the ecosystem
     * @param _artifact Address of the contract (ERC721, ERC1155, etc.)
     * @param _type Category of the artifact
     * @dev Automatically sets isAuthorized = true. 
     * Mutability: Only Owner (Governor/DAO) can register.
     */
    function registerArtifact(address _artifact, ArtifactType _type) external onlyOwner {
        require(_artifact != address(0), "Registry: Invalid address");
        require(artifacts[_artifact].artifactAddress == address(0), "Registry: Already registered");

        artifacts[_artifact] = ArtifactInfo({
            artifactAddress: _artifact,
            artifactType: _type,
            isAuthorized: true,
            registeredAt: block.timestamp
        });

        artifactList.push(_artifact);

        emit ArtifactRegistered(_artifact, _type);
    }

    /**
     * @notice Updates authorization status of an artifact
     */
    function setAuthorization(address _artifact, bool _isAuthorized) external onlyOwner {
        require(artifacts[_artifact].artifactAddress != address(0), "Registry: Not registered");
        artifacts[_artifact].isAuthorized = _isAuthorized;
        emit ArtifactAuthorizationUpdated(_artifact, _isAuthorized);
    }

    /**
     * @notice Checks if an artifact is authorized
     */
    function isAuthorizedArtifact(address _artifact) public view returns (bool) {
        return artifacts[_artifact].isAuthorized;
    }

    /**
     * @notice Checks if an address holds any authorized artifact
     * @dev Note: This function requires iterating or checking specific balances.
     * Since different artifacts have different standards (ERC721, 1155),
     * we will implement standardized checks here or in the Loom.
     * 
     * POLICY: "ANY" - If the user holds balance > 0 in at least ONE authorized artifact, they pass.
     */
    function hasAnyAuthorizedArtifact(address _user) external view returns (bool) {
        for (uint256 i = 0; i < artifactList.length; i++) {
            address artifact = artifactList[i];
            if (artifacts[artifact].isAuthorized) {
                if (_checkBalance(artifact, _user)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @dev Internal helper to check balance based on common interfaces
     */
    function _checkBalance(address _artifact, address _user) internal view returns (bool) {
        // Universal balance check (Standard ERC721/20/1155 balanceOf)
        try IStandardAsset(_artifact).balanceOf(_user) returns (uint256 balance) {
            return balance > 0;
        } catch {
            return false;
        }
    }

    /**
     * @notice Returns the list of all registered artifacts
     */
    function getArtifactList() external view returns (address[] memory) {
        return artifactList;
    }
}

interface IStandardAsset {
    function balanceOf(address account) external view returns (uint256);
}
