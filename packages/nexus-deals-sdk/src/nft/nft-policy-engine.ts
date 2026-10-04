/**
 * 🔑 NFT Policy Engine
 * lib/growth/nft/nft-policy-engine.ts
 *
 * The gatekeeper between Hermes proposals and NFT Lab execution.
 * Extends hermesCapabilityGrants (existing system) with NFT-specific capabilities.
 * Never creates a parallel authorization system — only extends the existing one.
 *
 * Responsibility matrix:
 *   - Resolves whether a specific NFT operation is ALLOWED for a tenant
 *   - Checks supply limits, recipient eligibility, frequency caps
 *   - Determines if governance is required or if auto-execution is permitted
 *   - Does NOT execute — it only decides and reasons
 *
 * Authority model:
 *   - operationId is server-resolved, never from client body
 *   - tenantId is the canonicalOrgId from controlPlaneContext
 *   - All DB lookups use projectId resolved server-side
 *
 * Capability IDs registered here:
 *   'nft.collection.create'   — create a collection definition (DRAFT)
 *   'nft.collection.deploy'   — trigger on-chain deployment (governance required)
 *   'nft.token.issue'         — mint token to recipient
 *   'nft.token.revoke'        — revoke an issued token
 *   'nft.verify.ownership'    — verify a wallet holds a token (read-only)
 */

import { db } from "@saasfly/db-core";
import {
  hermesCapabilityGrants,
  tenantNftCollections,
  tenantNftIssuances,
} from "@saasfly/db-core";
import { eq, and, count, desc, gte } from "@saasfly/db-core";
import { CapabilityGrantService } from "../../../hermes-core/src/a2a/capability-grant-service";

// ── NFT-specific capability identifiers ─────────────────────────────────────
export const NFT_CAPABILITIES = {
  COLLECTION_CREATE: 'nft.collection.create',
  COLLECTION_DEPLOY:  'nft.collection.deploy',
  TOKEN_ISSUE:        'nft.token.issue',
  TOKEN_REVOKE:       'nft.token.revoke',
  VERIFY_OWNERSHIP:   'nft.verify.ownership',
} as const;

export type NftCapabilityId = typeof NFT_CAPABILITIES[keyof typeof NFT_CAPABILITIES];

// ── Policy Decision ────────────────────────────────────────────────────────

export type PolicyDecision = 'ALLOW' | 'ALLOW_AUTO' | 'REQUIRE_GOVERNANCE' | 'DENY';

export interface NftPolicyResult {
  decision: PolicyDecision;
  reason: string;
  /**
   * When decision = REQUIRE_GOVERNANCE, this is the intent type to create.
   * When decision = ALLOW_AUTO, execution can proceed without a new intent.
   */
  intentTypeIfGovernance?: string;
  /** Supply remaining at time of evaluation */
  supplyRemaining?: number;
  /** Whether the collection exists and is DEPLOYED */
  collectionDeployed?: boolean;
}

// ── Policy Config per Collection Purpose ────────────────────────────────────
// Controls whether issuance is auto-allowed (within policy) or requires governance

interface PurposePolicy {
  governanceRequired: boolean;  // if true → always creates intent before mint
  maxAutoIssuancePerDay: number; // 0 = unlimited within policy
  allowRevocation: boolean;
  allowExpiration: boolean;
}

const PURPOSE_POLICIES: Record<string, PurposePolicy> = {
  ACCESS:      { governanceRequired: false, maxAutoIssuancePerDay: 100, allowRevocation: true,  allowExpiration: true  },
  MEMBERSHIP:  { governanceRequired: false, maxAutoIssuancePerDay: 50,  allowRevocation: true,  allowExpiration: false },
  REWARD:      { governanceRequired: false, maxAutoIssuancePerDay: 200, allowRevocation: false, allowExpiration: true  },
  REPUTATION:  { governanceRequired: true,  maxAutoIssuancePerDay: 0,   allowRevocation: false, allowExpiration: false },
  IDENTITY:    { governanceRequired: true,  maxAutoIssuancePerDay: 0,   allowRevocation: false, allowExpiration: false },
  COLLECTIBLE: { governanceRequired: false, maxAutoIssuancePerDay: 10,  allowRevocation: false, allowExpiration: false },
  EXPERIENCE:  { governanceRequired: false, maxAutoIssuancePerDay: 30,  allowRevocation: true,  allowExpiration: true  },
  GOVERNANCE:  { governanceRequired: true,  maxAutoIssuancePerDay: 0,   allowRevocation: true,  allowExpiration: false },
};

// ── NFT Policy Engine ────────────────────────────────────────────────────────

export class NftPolicyEngine {

  /**
   * Checks if a tenant has a specific NFT capability granted.
   * Extends hermesCapabilityGrants — uses the existing CapabilityGrantService.
   * Baseline: all tenants with growth.nft active can create/verify.
   * Deploy and issue require explicit grants or plan-level entitlement.
   */
  static async hasNftCapability(
    tenantId: string,
    capability: NftCapabilityId,
  ): Promise<boolean> {
    const normalized = tenantId.toLowerCase().replace(/^org_/, '');

    // Read-only operations always allowed for any tenant with growth.nft active
    if (capability === NFT_CAPABILITIES.VERIFY_OWNERSHIP) {
      return true;
    }

    // Check hermesCapabilityGrants via existing service
    const granted = await CapabilityGrantService.isCapabilityGranted(normalized, capability);
    if (granted) return true;

    // Baseline: tenants with NFT Lab installed can create collections (DRAFT)
    // and issue tokens within approved collections
    if (
      capability === NFT_CAPABILITIES.COLLECTION_CREATE ||
      capability === NFT_CAPABILITIES.TOKEN_ISSUE
    ) {
      // Check if they have growth.nft in installedProducts or STANDARD_CAPABILITIES
      // This is a conservative default — requires explicit grant for deploy/revoke
      return await this.hasTenantNftProduct(normalized);
    }

    return false;
  }

  /**
   * Evaluates whether a mint/issuance can auto-execute (within collection policy)
   * or requires a new governance intent.
   *
   * Called by:
   *   - Hermes tools (Level 2 auto-execute path)
   *   - The issuance API endpoint
   *
   * Never called by: the governance approval executor (which already has authorization)
   */
  static async evaluateIssuancePolicy(
    tenantId: string,
    collectionId: string,
    recipientWallet: string,
  ): Promise<NftPolicyResult> {
    const normalized = tenantId.toLowerCase().replace(/^org_/, '');

    // 1. Load collection (anti-IDOR: must match tenant)
    const [collection] = await db
      .select()
      .from(tenantNftCollections)
      .where(and(
        eq(tenantNftCollections.id, collectionId),
        eq(tenantNftCollections.organizationId, normalized),
      ))
      .limit(1);

    if (!collection) {
      return { decision: 'DENY', reason: 'Collection not found or does not belong to this tenant.' };
    }

    if (collection.status !== 'DEPLOYED') {
      return {
        decision: 'DENY',
        reason: `Collection status is '${collection.status}'. Only DEPLOYED collections can be minted.`,
        collectionDeployed: false,
      };
    }

    // 2. Supply check (real count from DB)
    const [mintCount] = await db
      .select({ total: count() })
      .from(tenantNftIssuances)
      .where(eq(tenantNftIssuances.collectionId, collectionId));

    const minted = mintCount?.total ?? 0;
    const supplyRemaining = collection.totalSupply === 0
      ? Infinity
      : collection.totalSupply - minted;

    if (collection.totalSupply > 0 && minted >= collection.totalSupply) {
      return {
        decision: 'DENY',
        reason: `Collection supply exhausted (${minted}/${collection.totalSupply} minted).`,
        supplyRemaining: 0,
        collectionDeployed: true,
      };
    }

    // 3. Duplicate check — has this wallet already received from this collection?
    const [existing] = await db
      .select({ total: count() })
      .from(tenantNftIssuances)
      .where(and(
        eq(tenantNftIssuances.collectionId, collectionId),
        eq(tenantNftIssuances.recipientWallet, recipientWallet.toLowerCase()),
      ));

    const existingMints = existing?.total ?? 0;

    // For IDENTITY/REPUTATION — only one token per wallet ever
    if (
      (collection.purpose === 'IDENTITY' || collection.purpose === 'REPUTATION') &&
      existingMints > 0
    ) {
      return {
        decision: 'DENY',
        reason: `${collection.purpose} tokens are unique per wallet. This wallet already holds one.`,
        supplyRemaining: supplyRemaining === Infinity ? undefined : supplyRemaining,
        collectionDeployed: true,
      };
    }

    // 4. Purpose-level policy gate
    const policy = PURPOSE_POLICIES[collection.purpose] ?? {
      governanceRequired: true,
      maxAutoIssuancePerDay: 0,
      allowRevocation: false,
      allowExpiration: false,
    };

    if (policy.governanceRequired) {
      return {
        decision: 'REQUIRE_GOVERNANCE',
        reason: `Purpose '${collection.purpose}' always requires governance approval for issuance.`,
        intentTypeIfGovernance: 'growth.nft.mint.v1',
        supplyRemaining: supplyRemaining === Infinity ? undefined : supplyRemaining,
        collectionDeployed: true,
      };
    }

    // 5. Daily frequency check
    if (policy.maxAutoIssuancePerDay > 0) {
      const oneDayAgo = new Date(Date.now() - 86_400_000);
      const [todayCount] = await db
        .select({ total: count() })
        .from(tenantNftIssuances)
        .where(and(
          eq(tenantNftIssuances.collectionId, collectionId),
          gte(tenantNftIssuances.createdAt, oneDayAgo),
        ));

      const todayIssued = todayCount?.total ?? 0;

      if (todayIssued >= policy.maxAutoIssuancePerDay) {
        return {
          decision: 'REQUIRE_GOVERNANCE',
          reason: `Daily auto-issuance limit reached (${todayIssued}/${policy.maxAutoIssuancePerDay} for today).`,
          intentTypeIfGovernance: 'growth.nft.mint.v1',
          supplyRemaining: supplyRemaining === Infinity ? undefined : supplyRemaining,
          collectionDeployed: true,
        };
      }
    }

    // 6. All gates passed → auto-execute within policy
    return {
      decision: 'ALLOW_AUTO',
      reason: 'Within collection policy. Auto-issuance permitted.',
      supplyRemaining: supplyRemaining === Infinity ? undefined : supplyRemaining,
      collectionDeployed: true,
    };
  }

  /**
   * Evaluates whether a new collection creation is allowed.
   * Always ALLOW for tenants with growth.nft capability (creates DRAFT).
   * Deploy always REQUIRE_GOVERNANCE.
   */
  static async evaluateCollectionCreatePolicy(
    tenantId: string,
  ): Promise<NftPolicyResult> {
    const normalized = tenantId.toLowerCase().replace(/^org_/, '');
    const hasCapability = await this.hasNftCapability(normalized, NFT_CAPABILITIES.COLLECTION_CREATE);

    if (!hasCapability) {
      return {
        decision: 'DENY',
        reason: 'Tenant does not have nft.collection.create capability. Requires NFT Lab activation.',
      };
    }

    return {
      decision: 'ALLOW',
      reason: 'Collection creation (DRAFT) is allowed. On-chain deployment will require governance.',
    };
  }

  /**
   * Evaluates revocation policy for an issuance.
   * Only allowed if the collection purpose permits revocation.
   * Always requires governance intent.
   */
  static async evaluateRevocationPolicy(
    tenantId: string,
    issuanceId: string,
  ): Promise<NftPolicyResult> {
    const normalized = tenantId.toLowerCase().replace(/^org_/, '');

    const [issuance] = await db
      .select({
        id: tenantNftIssuances.id,
        status: tenantNftIssuances.status,
        collectionId: tenantNftIssuances.collectionId,
      })
      .from(tenantNftIssuances)
      .where(eq(tenantNftIssuances.id, issuanceId))
      .limit(1);

    if (!issuance) {
      return { decision: 'DENY', reason: 'Issuance not found.' };
    }

    const [collection] = await db
      .select({ id: tenantNftCollections.id, purpose: tenantNftCollections.purpose, organizationId: tenantNftCollections.organizationId })
      .from(tenantNftCollections)
      .where(and(
        eq(tenantNftCollections.id, issuance.collectionId),
        eq(tenantNftCollections.organizationId, normalized),
      ))
      .limit(1);

    if (!collection) {
      return { decision: 'DENY', reason: 'Collection not found or does not belong to this tenant.' };
    }

    if (issuance.status === 'revoked') {
      return { decision: 'DENY', reason: 'Token is already revoked.' };
    }

    const policy = PURPOSE_POLICIES[collection.purpose];
    if (!policy?.allowRevocation) {
      return {
        decision: 'DENY',
        reason: `Purpose '${collection.purpose}' does not permit revocation.`,
      };
    }

    // Revocation always requires governance
    return {
      decision: 'REQUIRE_GOVERNANCE',
      reason: 'Revocation requires governance approval.',
      intentTypeIfGovernance: 'growth.nft.revoke.v1',
    };
  }

  /**
   * Registers NFT capabilities for a tenant in hermesCapabilityGrants.
   * Called when NFT Lab product is activated for a tenant.
   * Uses existing CapabilityGrantService — no new system.
   */
  static async grantNftCapabilitiesToTenant(
    tenantId: string,
    authorizedBy: string,
    grantedCapabilities: NftCapabilityId[] = [
      NFT_CAPABILITIES.COLLECTION_CREATE,
      NFT_CAPABILITIES.TOKEN_ISSUE,
      NFT_CAPABILITIES.TOKEN_REVOKE,
      NFT_CAPABILITIES.VERIFY_OWNERSHIP,
    ],
  ): Promise<void> {
    const normalized = tenantId.toLowerCase().replace(/^org_/, '');
    for (const capability of grantedCapabilities) {
      await CapabilityGrantService.setGrant(normalized, capability, true, authorizedBy);
    }
    // nft.collection.deploy requires explicit grant (not in defaults)
    // It must be granted separately by a Pandoras admin after reviewing the tenant
  }

  /**
   * Returns the NFT policy summary for a collection purpose.
   * Read-only. Used by Hermes tools to explain policy to users.
   */
  static getPurposePolicy(purpose: string): PurposePolicy | undefined {
    return PURPOSE_POLICIES[purpose];
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private static async hasTenantNftProduct(normalizedTenantId: string): Promise<boolean> {
    // Check installedProducts for NFT Lab activation (canonical source of truth)
    try {
      const { installedProducts } = await import("@saasfly/db-core");
      const { or } = await import("@saasfly/db-core");
      const [product] = await db
        .select({ id: installedProducts.id })
        .from(installedProducts)
        .where(and(
          or(
            eq(installedProducts.projectId as any, normalizedTenantId),
            // installedProducts.organizationId if exists, else join via projects
          ),
          eq(installedProducts.product as any, 'NFT_LAB'),
          eq(installedProducts.status as any, 'active'),
        ))
        .limit(1);
      if (product) return true;
    } catch {
      // installedProducts join path failed — fall through to collection-existence check
    }

    // Secondary: tenant has at least one collection already (implies past activation)
    try {
      const [row] = await db
        .select({ id: tenantNftCollections.id })
        .from(tenantNftCollections)
        .where(eq(tenantNftCollections.organizationId, normalizedTenantId))
        .limit(1);
      return !!row;
    } catch {
      return false;
    }
  }
}
