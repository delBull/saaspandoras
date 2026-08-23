/**
 * 🏛️ HERMES OS — Receipt Explorer & Cryptographic Verification Tests (K27.5)
 * src/lib/pandoras/core/domains/hermes/receipts/__tests__/receipt-explorer.test.ts
 */

import { describe, it, expect } from 'vitest';
import { ReceiptExplorerService } from '../receipt-explorer';
import { ClaimContractEngine, ClaimProvenanceReceipt } from '../../knowledge/claim-contract-engine';
import { HermesIdentitySigner } from '../../identity/identity-signer';
import crypto from 'crypto';

describe('Hermes OS Milestone K27.5 — Receipt Explorer & Cryptographic Attestation', () => {
  const signer = new HermesIdentitySigner();
  const signerAddress = signer.getPublicAddress();

  it('RCP-001: Verifies a valid, signed ClaimProvenanceReceipt', async () => {
    const proofHash = crypto.createHash('sha256').update('Hermes valid response text proof').digest('hex');
    const signature = await signer.signMessage(proofHash);

    const receipt: ClaimProvenanceReceipt = {
      receiptId: 'rcp_test_valid_123',
      tenantId: 'snarai',
      agentId: 'hermes-snarai',
      responseHash: crypto.createHash('sha256').update('response').digest('hex'),
      provenanceTier: 'LEVEL_3_FINANCIAL_CONTRACTUAL',
      provenanceRequired: true,
      claimAuthorizationRequired: true,
      agentAttestationRequired: true,
      signatureRequired: true,
      coverage: {
        complete: true,
        unsupportedSegments: [],
        matchedClaimsCount: 2,
      },
      claims: [],
      matchedClaimIds: ['claim_price', 'claim_location'],
      policyVersion: '1.0.0',
      proofHash,
      agentWalletAddress: signerAddress,
      agentSignature: signature,
      verifiedAt: new Date().toISOString(),
      nonce: 'nonce_123',
    };

    ReceiptExplorerService.registerReceipt(receipt);

    const verification = await ReceiptExplorerService.verifyReceipt('rcp_test_valid_123');

    expect(verification.isValid).toBe(true);
    expect(verification.isSignatureAuthentic).toBe(true);
    expect(verification.tenantId).toBe('snarai');
    expect(verification.attestedClaimsCount).toBe(2);
  });

  it('RCP-002: Detects and rejects tampered or forged agent signatures', async () => {
    const proofHash = crypto.createHash('sha256').update('Hermes forged text').digest('hex');

    const forgedReceipt: ClaimProvenanceReceipt = {
      receiptId: 'rcp_test_forged_456',
      tenantId: 'snarai',
      agentId: 'hermes-snarai',
      responseHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      provenanceTier: 'LEVEL_3_FINANCIAL_CONTRACTUAL',
      provenanceRequired: true,
      claimAuthorizationRequired: true,
      agentAttestationRequired: true,
      signatureRequired: true,
      coverage: {
        complete: true,
        unsupportedSegments: [],
        matchedClaimsCount: 1,
      },
      claims: [],
      matchedClaimIds: ['claim_fake'],
      policyVersion: '1.0.0',
      proofHash,
      agentWalletAddress: '0x1111111111111111111111111111111111111111',
      agentSignature: '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b',
      verifiedAt: new Date().toISOString(),
      nonce: 'nonce_456',
    };

    ReceiptExplorerService.registerReceipt(forgedReceipt);

    const verification = await ReceiptExplorerService.verifyReceipt('rcp_test_forged_456');

    expect(verification.isValid).toBe(false);
    expect(verification.isSignatureAuthentic).toBe(false);
  });

  it('RCP-003: Returns 404-style payload for nonexistent receipt IDs', async () => {
    const verification = await ReceiptExplorerService.verifyReceipt('rcp_nonexistent_999');
    expect(verification.isValid).toBe(false);
    expect(verification.error).toContain('not found');
  });
});
