/**
 * 🏛️ HERMES OS — Claim Contract Provenance & Canonical Integrity Certification
 * src/lib/pandoras/core/domains/hermes/knowledge/__tests__/claim-provenance-integrity.test.ts
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { 
  ClaimContractEngine, 
  CANONICAL_CID_REGEX, 
  CANONICAL_HASH_REGEX, 
  SNARAI_CANONICAL_CLAIM_CONTRACT,
  GovernedClaim
} from '../claim-contract-engine';

describe('Hermes OS — Claim Provenance Integrity & Anti-Synthetic Guard', () => {
  it('CPI-001: All claims in SNARAI_CANONICAL_CLAIM_CONTRACT pass canonical CIDv1 and SHA-256 validation', () => {
    expect(SNARAI_CANONICAL_CLAIM_CONTRACT.claims.length).toBeGreaterThanOrEqual(5);

    for (const claim of SNARAI_CANONICAL_CLAIM_CONTRACT.claims) {
      expect(claim.provenance).toBeDefined();
      expect(CANONICAL_CID_REGEX.test(claim.provenance.ipfsCid)).toBe(true);
      expect(claim.provenance.ipfsCid).toMatch(/^bafkrei[a-z2-7]{52,60}$/);
      expect(CANONICAL_HASH_REGEX.test(claim.provenance.contentHash)).toBe(true);
      expect(claim.provenance.contentHash.length).toBe(64);
    }
  });

  it('CPI-002: Rejects intake of contracts with synthetic or malformed provenance CIDs', () => {
    const invalidCidClaim: GovernedClaim = {
      claimId: 'claim_synthetic',
      category: 'FACT',
      canonicalAssertion: 'Invalid CID claim',
      permittedPhrasings: ['invalid'],
      provenance: {
        artifactId: 'art_fake',
        contentHash: 'f4d92a1b3c5e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a',
        ipfsCid: 'mock_synthetic_cid_not_base32',
        version: 1,
      },
    };

    expect(() => {
      ClaimContractEngine.validateProvenanceIntegrity([invalidCidClaim]);
    }).toThrow(/INVALID_PROVENANCE_CID/);
  });

  it('CPI-003: Rejects intake of contracts with non-hex or non-64-char content hashes', () => {
    const invalidHashClaim: GovernedClaim = {
      claimId: 'claim_fake_hash',
      category: 'FACT',
      canonicalAssertion: 'Invalid hash claim',
      permittedPhrasings: ['invalid'],
      provenance: {
        artifactId: 'art_fake',
        contentHash: '1a2b3c4d5e6f7a8b', // truncated keyboard hash
        ipfsCid: 'bafkreietmplfmv4piaqhbejt2jtdzpdr5olkxxpqnto2fg34hzwyvaj2iq',
        version: 1,
      },
    };

    expect(() => {
      ClaimContractEngine.validateProvenanceIntegrity([invalidHashClaim]);
    }).toThrow(/INVALID_PROVENANCE_HASH/);
  });

  it('CPI-004: Certifies 100% cryptographic closure on canonical engine-form payload vs contractHash', () => {
    const claims = SNARAI_CANONICAL_CLAIM_CONTRACT.claims;
    const version = 4;
    const tenantId = 'snarai';

    const canonicalPayload = JSON.stringify({
      tenantId,
      version,
      claims,
    });

    const computedHash = crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
    expect(computedHash).toBe('1f6b3e4100d289847ccea7015d659ceb18409e071b597bc22a968a9c6b688993');
  });
});
