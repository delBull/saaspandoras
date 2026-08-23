/**
 * 🏛️ HERMES OS — Governance Console & Claim Lifecycle Tests (K27.4)
 * src/lib/pandoras/core/domains/hermes/tenants/__tests__/governance-console.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TenantGovernanceService } from '../governance-service';
import { TenantProvisioner } from '../tenant-provisioner';
import { ClaimContractEngine } from '../../knowledge/claim-contract-engine';

describe('Hermes OS Milestone K27.4 — Tenant Governance Console & Version Bumps', () => {
  const testTenant = `gov_test_${Date.now()}`;

  beforeEach(async () => {
    await TenantProvisioner.provisionTenantIntelligence(
      {
        tenantId: testTenant,
        organizationName: 'Gov Test Corp',
        projectMetadata: {
          tokenPriceUsd: 100,
          location: 'Cancun, Mexico',
        },
      },
      { skipDb: true }
    );
  });

  it('GOV-001: Lists current claims and active contract metadata', async () => {
    const claimsData = await TenantGovernanceService.getTenantClaims(testTenant);
    expect(claimsData.tenantId).toBe(testTenant);
    expect(claimsData.version).toBe(1);
    expect(claimsData.claims.length).toBeGreaterThanOrEqual(2);
  });

  it('GOV-002: Promotes a new claim, bumping contract version from v1 to v2 and re-anchoring to IPFS', async () => {
    const updated = await TenantGovernanceService.promoteClaim(
      {
        tenantId: testTenant,
        claim: {
          claimId: 'claim_exclusive_beach_club',
          category: 'FACT',
          canonicalAssertion: 'Acceso exclusivo al club de playa privado para todos los socios.',
          permittedPhrasings: ['club de playa privado', 'acceso exclusivo a playa'],
          disclosureClearance: 'PUBLIC',
        },
      },
      { skipDb: true }
    );

    expect(updated.version).toBe(2);
    expect(updated.claims.length).toBeGreaterThanOrEqual(3);
    expect(updated.ipfsCid).toBeDefined();
    expect(updated.ipfsCid!.includes('bafkrei')).toBe(true);

    // Verify engine now serves v2 immediately
    const engineContract = ClaimContractEngine.getContract(testTenant);
    expect(engineContract?.version).toBe(2);
    expect(engineContract?.claims.some(c => c.claimId === 'claim_exclusive_beach_club')).toBe(true);
  });

  it('GOV-003: Revokes a claim, bumping contract version from v2 to v3 with active exclusion', async () => {
    // 1. Promote to v2
    await TenantGovernanceService.promoteClaim(
      {
        tenantId: testTenant,
        claim: {
          claimId: 'claim_exclusive_beach_club',
          category: 'FACT',
          canonicalAssertion: 'Acceso exclusivo al club de playa privado para todos los socios.',
          permittedPhrasings: ['club de playa privado'],
          disclosureClearance: 'PUBLIC',
        },
      },
      { skipDb: true }
    );

    // 2. Revoke to v3
    const updated = await TenantGovernanceService.revokeClaim(
      {
        tenantId: testTenant,
        claimId: 'claim_exclusive_beach_club',
        reason: 'El club de playa se encuentra temporalmente cerrado por remodelación.',
      },
      { skipDb: true }
    );

    expect(updated.version).toBe(3);
    expect(updated.claims.some(c => c.claimId === 'claim_exclusive_beach_club')).toBe(false);

    const engineContract = ClaimContractEngine.getContract(testTenant);
    expect(engineContract?.version).toBe(3);
  });
});
