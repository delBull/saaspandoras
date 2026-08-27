// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SovereignEvidenceRegistry
 * @dev Lightweight, immutable on-chain registry for cryptographic document execution evidence.
 * Anchors SHA-256 document hashes, Evidence Package CIDs, and root verification hashes.
 * Low-gas (< 60,000 gas per anchor) with zero-platform dependency.
 */
contract SovereignEvidenceRegistry {
    struct EvidenceAnchor {
        bytes32 documentHash;       // Canonical SHA-256 digest of original PDF
        bytes32 rootEvidenceHash;   // SHA-256(documentHash + signaturesHash + manifestHash)
        string evidencePackageCid;  // IPFS CID of canonical Evidence Package v1 (ZIP / JSON)
        string organizationId;      // Tenant Slug (e.g. "snarai")
        uint32 signersCount;        // Total valid signers
        uint64 finalizedAt;         // Block timestamp
        address registrar;          // Submitting address or relayer
    }

    // Mapping: documentHash (bytes32) => EvidenceAnchor
    mapping(bytes32 => EvidenceAnchor) public anchors;

    // Mapping: envelopeId (string) => array of documentHashes
    mapping(string => bytes32[]) private _envelopeDocuments;

    event DocumentAnchored(
        bytes32 indexed documentHash,
        string indexed envelopeId,
        string evidencePackageCid,
        bytes32 rootEvidenceHash,
        string organizationId,
        uint32 signersCount,
        uint64 finalizedAt,
        address indexed registrar
    );

    /**
     * @notice Anchors a finalized document's cryptographic proof to the blockchain
     * @param envelopeId Unique UUID of the envelope
     * @param documentHash Canonical SHA-256 hash of the PDF
     * @param rootEvidenceHash SHA-256 of the aggregated Evidence Package manifest & signatures
     * @param evidencePackageCid Primary IPFS CID of the Evidence Package
     * @param organizationId Tenant identifier
     * @param signersCount Number of verified EIP-712 signers
     */
    function anchorDocument(
        string calldata envelopeId,
        bytes32 documentHash,
        bytes32 rootEvidenceHash,
        string calldata evidencePackageCid,
        string calldata organizationId,
        uint32 signersCount
    ) external {
        require(documentHash != bytes32(0), "INVALID_DOCUMENT_HASH");
        require(rootEvidenceHash != bytes32(0), "INVALID_ROOT_EVIDENCE_HASH");
        require(bytes(evidencePackageCid).length > 0, "INVALID_IPFS_CID");
        require(anchors[documentHash].finalizedAt == 0, "DOCUMENT_ALREADY_ANCHORED");

        anchors[documentHash] = EvidenceAnchor({
            documentHash: documentHash,
            rootEvidenceHash: rootEvidenceHash,
            evidencePackageCid: evidencePackageCid,
            organizationId: organizationId,
            signersCount: signersCount,
            finalizedAt: uint64(block.timestamp),
            registrar: msg.sender
        });

        _envelopeDocuments[envelopeId].push(documentHash);

        emit DocumentAnchored(
            documentHash,
            envelopeId,
            evidencePackageCid,
            rootEvidenceHash,
            organizationId,
            signersCount,
            uint64(block.timestamp),
            msg.sender
        );
    }

    /**
     * @notice Verifies if a given document hash is anchored and returns its evidence data
     */
    function verifyDocument(bytes32 documentHash)
        external
        view
        returns (
            bool isAnchored,
            bytes32 rootEvidenceHash,
            string memory evidencePackageCid,
            string memory organizationId,
            uint32 signersCount,
            uint64 finalizedAt,
            address registrar
        )
    {
        EvidenceAnchor memory anchor = anchors[documentHash];
        if (anchor.finalizedAt == 0) {
            return (false, bytes32(0), "", "", 0, 0, address(0));
        }
        return (
            true,
            anchor.rootEvidenceHash,
            anchor.evidencePackageCid,
            anchor.organizationId,
            anchor.signersCount,
            anchor.finalizedAt,
            anchor.registrar
        );
    }

    /**
     * @notice Retrieves all document hashes linked to a specific envelope ID
     */
    function getEnvelopeDocuments(string calldata envelopeId) external view returns (bytes32[] memory) {
        return _envelopeDocuments[envelopeId];
    }
}
