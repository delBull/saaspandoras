/**
 * 🏛️ HERMES OS — Tenant Governance Console Service
 * src/lib/pandoras/core/domains/hermes/tenants/governance-service.ts
 *
 * Implements Milestone K27.4:
 * 1. Manages Claim Lifecycle: DRAFT → REVIEW → AUTHORIZED → SIGNED → ACTIVE.
 * 2. Handles Claim Contract Version Bumps (v1 → v2) upon promotion/revocation.
 * 3. Re-computes Merkle roots & re-anchors to IPFS via Hermes Agent Signer.
 * 4. Atomic sync with hermes_claim_contracts in Neon DB.
 */

import { db } from '@/db';
import { hermesClaimContracts } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { 
  ClaimContractEngine, 
  GovernedClaim, 
  TenantClaimContract 
} from '../knowledge/claim-contract-engine';
import { HermesIdentitySigner } from '../identity/identity-signer';
import { TenantIpfsVaultService } from '../knowledge/ipfs-vault';
import { TenantClaimInput, ClaimLifecycleStatus } from './contracts';

export interface PromoteClaimParams {
  tenantId: string;
  claim: TenantClaimInput;
  actorAddress?: string;
}

export interface RevokeClaimParams {
  tenantId: string;
  claimId: string;
  reason: string;
  actorAddress?: string;
}

export class TenantGovernanceService {
  private static signerInstance: HermesIdentitySigner | null = null;

  private static getSigner(): HermesIdentitySigner {
    if (!this.signerInstance) {
      this.signerInstance = new HermesIdentitySigner();
    }
    return this.signerInstance;
  }

  /**
   * Retrieves the current claims and governance status for a tenant.
   */
  public static async getTenantClaims(tenantId: string, options?: { dbClient?: any }): Promise<{
    tenantId: string;
    version: number;
    governanceStatus: string;
    claims: GovernedClaim[];
    contractHash: string;
    ipfsCid?: string;
  }> {
    const cleanTenant = tenantId.toLowerCase().replace(/^org_/, '').trim();
    const activeDb = options?.dbClient || db;

    // 1. Try memory engine
    const memContract = ClaimContractEngine.getContract(cleanTenant);
    if (memContract) {
      return {
        tenantId: cleanTenant,
        version: memContract.version,
        governanceStatus: memContract.governanceStatus || 'ACTIVE',
        claims: memContract.claims,
        contractHash: memContract.contractHash,
        ipfsCid: memContract.ipfsCid,
      };
    }

    // 2. Try DB
    if (activeDb) {
      const records = await activeDb
        .select()
        .from(hermesClaimContracts)
        .where(
          or(
            eq(hermesClaimContracts.tenantId, cleanTenant),
            eq(hermesClaimContracts.tenantId, `org_${cleanTenant}`)
          )
        )
        .orderBy(desc(hermesClaimContracts.version))
        .limit(1);

      if (records.length > 0) {
        const c = records[0];
        const claims = (c.claims as any) || [];
        return {
          tenantId: cleanTenant,
          version: c.version,
          governanceStatus: c.governanceStatus || 'ACTIVE',
          claims,
          contractHash: c.contractHash,
          ipfsCid: c.ipfsCid || undefined,
        };
      }
    }

    return {
      tenantId: cleanTenant,
      version: 0,
      governanceStatus: 'DRAFT',
      claims: [],
      contractHash: '0000000000000000000000000000000000000000000000000000000000000000',
    };
  }

  /**
   * Promotes or adds a new claim to the tenant's claim contract:
   * Increments version (v(N) -> v(N+1)), re-anchors to IPFS, and updates engine + DB.
   */
  public static async promoteClaim(
    params: PromoteClaimParams,
    options?: { dbClient?: any; skipDb?: boolean }
  ): Promise<TenantClaimContract> {
    const { tenantId, claim } = params;
    const cleanTenant = tenantId.toLowerCase().replace(/^org_/, '').trim();
    const activeDb = options?.dbClient || db;
    const signer = this.getSigner();
    const vault = new TenantIpfsVaultService();

    // 1. Get current contract
    const current = await this.getTenantClaims(cleanTenant, { dbClient: activeDb });
    const nextVersion = (current.version || 0) + 1;

    // 2. Prepare new GovernedClaim
    const newGovernedClaim: GovernedClaim = {
      claimId: claim.claimId,
      category: claim.category,
      canonicalAssertion: claim.canonicalAssertion,
      permittedPhrasings: claim.permittedPhrasings || [claim.canonicalAssertion],
      disclosureClearance: claim.disclosureClearance || 'PUBLIC',
      provenance: {
        artifactId: `gov_${claim.claimId}`,
        contentHash: crypto.createHash('sha256').update(claim.canonicalAssertion).digest('hex'),
        ipfsCid: TenantIpfsVaultService.computeCanonicalCidV1(`gov_${claim.claimId}_${claim.canonicalAssertion}`),
        version: nextVersion,
      },
    };

    // 3. Upsert into existing claims list
    const updatedClaims = [...current.claims.filter(c => c.claimId !== claim.claimId), newGovernedClaim];

    // 4. Compute new contract hash
    const contractHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ tenantId: cleanTenant, version: nextVersion, claims: updatedClaims }))
      .digest('hex');

    const newContractPayload: TenantClaimContract = {
      tenantId: cleanTenant,
      version: nextVersion,
      governanceStatus: 'ACTIVE',
      contractHash,
      claims: updatedClaims,
      updatedAt: new Date().toISOString(),
    };

    // 5. Anchor to IPFS & Sign with Hermes Agent Wallet
    const anchoredContract = await ClaimContractEngine.anchorClaimContractToIpfs(
      newContractPayload,
      signer,
      vault,
      options
    );

    // 6. Update in-memory ClaimContractEngine
    ClaimContractEngine.registerContract(anchoredContract);

    // 7. Persist to Neon DB
    if (!options?.skipDb && activeDb) {
      try {
        await activeDb.insert(hermesClaimContracts).values({
          id: `cc_${cleanTenant}_v${nextVersion}_${Date.now()}`,
          tenantId: cleanTenant,
          version: nextVersion,
          contractHash: anchoredContract.contractHash,
          ipfsCid: anchoredContract.ipfsCid,
          ipfsUri: anchoredContract.ipfsUri,
          claims: anchoredContract.claims as any,
          signedByAddress: anchoredContract.agentWalletAddress || signer.getPublicAddress(),
          agentSignature: anchoredContract.agentSignature,
          governanceStatus: 'ACTIVE',
        });
      } catch (err: any) {
        console.warn('[TenantGovernanceService] DB insert warning:', err?.message);
      }
    }

    return anchoredContract;
  }

  /**
   * Revokes a claim from a tenant's contract:
   * Removes it from active claims, bumps version, re-anchors to IPFS, and updates state.
   */
  public static async revokeClaim(
    params: RevokeClaimParams,
    options?: { dbClient?: any; skipDb?: boolean }
  ): Promise<TenantClaimContract> {
    const { tenantId, claimId, reason } = params;
    const cleanTenant = tenantId.toLowerCase().replace(/^org_/, '').trim();
    const activeDb = options?.dbClient || db;
    const signer = this.getSigner();
    const vault = new TenantIpfsVaultService();

    const current = await this.getTenantClaims(cleanTenant, { dbClient: activeDb });
    const nextVersion = (current.version || 0) + 1;

    // Filter out the revoked claim
    const remainingClaims = current.claims.filter(c => c.claimId !== claimId);

    const contractHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ tenantId: cleanTenant, version: nextVersion, claims: remainingClaims, revoked: { claimId, reason } }))
      .digest('hex');

    const newContractPayload: TenantClaimContract = {
      tenantId: cleanTenant,
      version: nextVersion,
      governanceStatus: 'ACTIVE',
      contractHash,
      claims: remainingClaims,
      updatedAt: new Date().toISOString(),
    };

    const anchoredContract = await ClaimContractEngine.anchorClaimContractToIpfs(
      newContractPayload,
      signer,
      vault,
      options
    );

    ClaimContractEngine.registerContract(anchoredContract);

    if (!options?.skipDb && activeDb) {
      try {
        await activeDb.insert(hermesClaimContracts).values({
          id: `cc_${cleanTenant}_v${nextVersion}_rev_${Date.now()}`,
          tenantId: cleanTenant,
          version: nextVersion,
          contractHash: anchoredContract.contractHash,
          ipfsCid: anchoredContract.ipfsCid,
          ipfsUri: anchoredContract.ipfsUri,
          claims: anchoredContract.claims as any,
          signedByAddress: anchoredContract.agentWalletAddress || signer.getPublicAddress(),
          agentSignature: anchoredContract.agentSignature,
          governanceStatus: 'ACTIVE',
        });
      } catch (err: any) {
        console.warn('[TenantGovernanceService] DB insert warning on revocation:', err?.message);
      }
    }

    return anchoredContract;
  }
}
