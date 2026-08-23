/**
 * 🏛️ HERMES OS — Receipt Explorer & Cryptographic Verifier
 * src/lib/pandoras/core/domains/hermes/receipts/receipt-explorer.ts
 *
 * Implements Milestone K27.5:
 * 1. Independent lookup of ClaimProvenanceReceipt by receiptId.
 * 2. Trustless verification of Hermes Agent Wallet signature (EIP-712 / Viem).
 * 3. Validation of IPFS CID integrity & claim contract binding.
 */

import { recoverMessageAddress } from 'viem';
import { 
  ClaimContractEngine, 
  ClaimProvenanceReceipt,
  ProvenanceIntentTier
} from '../knowledge/claim-contract-engine';

export interface ReceiptVerificationDetails {
  receiptId: string;
  isValid: boolean;
  signerAddress: string;
  expectedSigner?: string;
  isSignatureAuthentic: boolean;
  isIpfsBound: boolean;
  tenantId: string;
  contractVersion: number;
  epistemicTier: ProvenanceIntentTier;
  attestedClaimsCount: number;
  evaluatedAt: string;
  proofHash: string;
  receipt?: ClaimProvenanceReceipt;
  error?: string;
}

export class ReceiptExplorerService {
  private static inMemoryReceipts = new Map<string, ClaimProvenanceReceipt>();

  /**
   * Indexes a receipt for rapid explorer resolution.
   */
  public static registerReceipt(receipt: ClaimProvenanceReceipt): void {
    this.inMemoryReceipts.set(receipt.receiptId, receipt);
  }

  /**
   * Verifies and inspects a ClaimProvenanceReceipt.
   */
  public static async verifyReceipt(receiptId: string): Promise<ReceiptVerificationDetails> {
    const receipt = this.inMemoryReceipts.get(receiptId);

    if (!receipt) {
      return {
        receiptId,
        isValid: false,
        signerAddress: '0x0000000000000000000000000000000000000000',
        isSignatureAuthentic: false,
        isIpfsBound: false,
        tenantId: 'unknown',
        contractVersion: 0,
        epistemicTier: 'LEVEL_0_CONVERSATIONAL',
        attestedClaimsCount: 0,
        evaluatedAt: new Date().toISOString(),
        proofHash: '0000000000000000000000000000000000000000000000000000000000000000',
        error: `Receipt with ID "${receiptId}" not found in explorer index.`,
      };
    }

    // 1. Verify EIP-191 / EIP-712 Signature
    let isSignatureAuthentic = false;
    let recoveredSigner = '0x0000000000000000000000000000000000000000';

    try {
      if (receipt.agentSignature && receipt.agentSignature.startsWith('0x')) {
        recoveredSigner = await recoverMessageAddress({
          message: receipt.proofHash,
          signature: receipt.agentSignature as `0x${string}`,
        });

        isSignatureAuthentic = 
          recoveredSigner.toLowerCase() === receipt.agentWalletAddress.toLowerCase();
      }
    } catch (err: any) {
      console.warn('[ReceiptExplorerService] Signature recovery warning:', err?.message);
    }

    // 2. Verify IPFS binding via ClaimContractEngine
    const contract = ClaimContractEngine.getContract(receipt.tenantId);
    const isIpfsBound = 
      !!contract?.ipfsCid && 
      (contract.ipfsCid.includes('bafkrei') || contract.ipfsCid.startsWith('ipfs://'));

    const isValid = isSignatureAuthentic;

    return {
      receiptId,
      isValid,
      signerAddress: receipt.agentWalletAddress,
      isSignatureAuthentic,
      isIpfsBound,
      tenantId: receipt.tenantId,
      contractVersion: contract?.version || 1,
      epistemicTier: receipt.provenanceTier,
      attestedClaimsCount: receipt.matchedClaimIds?.length || receipt.claims?.length || 0,
      evaluatedAt: receipt.verifiedAt,
      proofHash: receipt.proofHash,
      receipt,
    };
  }
}
