// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./PBOXToken.sol";

/**
 * @title ClaimVerifier
 * @notice Contrato intermediario para el Approach B (EIP-712 Voucher).
 * Valida firmas off-chain del Backend antes de acuñar PBOX on-chain.
 */
contract ClaimVerifier is EIP712, Ownable, Pausable {
    using ECDSA for bytes32;

    PBOXToken public pboxToken;
    address public claimSigner;

    // Prevención de Replay attacks on-chain (nonce por usuario)
    mapping(address => uint256) public userNonces;

    bytes32 private constant VOUCHER_TYPEHASH = keccak256(
        "Voucher(address user,uint256 amount,uint256 nonce,uint256 deadline)"
    );

    event VoucherClaimed(address indexed user, uint256 amount, uint256 nonce);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);

    constructor(
        address _pboxToken,
        address _claimSigner,
        address initialOwner
    ) EIP712("PandorasClaimSystem", "1") Ownable() {
        require(_pboxToken != address(0), "ClaimVerifier: Invalid token");
        require(_claimSigner != address(0), "ClaimVerifier: Invalid signer");
        pboxToken = PBOXToken(_pboxToken);
        claimSigner = _claimSigner;

        if (initialOwner != address(0) && initialOwner != msg.sender) {
            transferOwnership(initialOwner);
        }
    }

    struct Voucher {
        address user;
        uint256 amount;
        uint256 nonce;
        uint256 deadline;
    }

    /**
     * @notice Ejecuta un voucher EIP-712 reclamando PBOX 
     * @param voucher Estructura con datos del reclamo
     * @param signature Firma del backend 
     */
    function claim(Voucher calldata voucher, bytes calldata signature) external whenNotPaused {
        require(block.timestamp <= voucher.deadline, "ClaimVerifier: Voucher expired");
        require(voucher.user == msg.sender, "ClaimVerifier: Not intended for caller");
        require(voucher.nonce == userNonces[msg.sender], "ClaimVerifier: Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(
                VOUCHER_TYPEHASH,
                voucher.user,
                voucher.amount,
                voucher.nonce,
                voucher.deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        
        require(signer == claimSigner, "ClaimVerifier: Invalid signature");

        // Incrementar el nonce antes de interactuar (prevenir reentrancy)
        userNonces[msg.sender]++;

        // Call Mint on token (requiere MINTER_ROLE en PBOXToken)
        pboxToken.mint(msg.sender, voucher.amount, PBOXToken.MintReason.VOUCHER_CLAIM);

        emit VoucherClaimed(msg.sender, voucher.amount, voucher.nonce);
    }

    // ========== CONTROLES ADMINISTRATIVOS ==========

    function updateSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "ClaimVerifier: Invalid signer");
        address oldSigner = claimSigner;
        claimSigner = newSigner;
        emit SignerUpdated(oldSigner, newSigner);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
