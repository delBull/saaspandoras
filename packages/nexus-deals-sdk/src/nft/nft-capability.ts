/**
 * 🎫 NFT Capability Layer — Public Interface
 * lib/growth/nft/nft-capability.ts
 *
 * The public SDK that Growth OS, Hermes tools, and other modules consume
 * to interact with NFT Lab.
 *
 * Architecture mandate (Phase 0 Audit):
 *   "NFT Capability Layer como abstracción (SDK) que Growth/otros módulos
 *    consumen, evitando dependencia directa en el deployer."
 *
 * Operations exposed:
 *   createCollection()   → DRAFT in DB + governance intent (Phase 1 flow)
 *   issueToken()         → policy check → auto or governance intent
 *   verifyOwnership()    → TokenGate (on-chain + DB fallback)
 *   revokeToken()        → policy check → governance intent (always)
 *   explainCollection()  → read-only summary for Hermes narration
 *
 * This layer does NOT:
 *   - Deploy contracts directly (that's nft-deploy-executor.ts)
 *   - Bypass policy checks
 *   - Accept client-supplied authority values (tenantId, contractAddress)
 *   - Execute without governance when policy requires it
 *
 * Hermes tools call this layer at:
 *   Level 0 (Read):     verifyOwnership(), explainCollection()
 *   Level 2 (Auto):     issueToken() → ALLOW_AUTO path
 *   Level 3 (Propose):  issueToken() → REQUIRE_GOVERNANCE path
 *                       createCollection() → always REQUIRE_GOVERNANCE for deploy
 */

import { db } from "@saasfly/db-core";
import {
  tenantNftCollections,
  tenantNftIssuances,
  operationalIntents,
  outboxEvents,
  projects,
} from "@saasfly/db-core";
import { eq, and, or, count } from "@saasfly/db-core";
import { NftPolicyEngine, NFT_CAPABILITIES } from './nft-policy-engine';
import { verifyNftAccess, type TokenGateResult } from './token-gate';
import type { NftCollectionDTO, NftPurpose, NftStandard, NftCollectionStatus } from '@saasfly/shared';

// ── Operation Result Types ─────────────────────────────────────────────────

export interface CreateCollectionResult {
  collectionId: string;
  status: NftCollectionStatus;
  governanceIntentId: string;
  message: string;
}

export interface IssueTokenResult {
  issuanceId?: string;
  governanceIntentId?: string;
  autoExecuted: boolean;
  status: 'issued' | 'pending_governance' | 'denied';
  reason: string;
}

export interface RevokeTokenResult {
  governanceIntentId?: string;
  status: 'pending_governance' | 'denied';
  reason: string;
}

export interface CollectionSummary {
  id: string;
  name: string;
  symbol: string;
  purpose: NftPurpose;
  status: NftCollectionStatus;
  totalSupply: number;
  mintedSupply: number;
  supplyRemaining: number | null; // null = unlimited
  contractAddress?: string;
  chainId: number;
  policyNotes: string[];
}

// ── NFT Capability Layer ───────────────────────────────────────────────────

export class NftCapability {

  /**
   * Create a new NFT collection definition (DRAFT state).
   * Emits governance intent for on-chain deployment.
   *
   * Auth: tenantId must be canonicalOrgId (server-resolved)
   * Actor: who is creating (for audit trail)
   */
  static async createCollection(params: {
    tenantId: string;
    projectId: number;
    name: string;
    symbol: string;
    purpose: NftPurpose;
    standard?: NftStandard;
    transferable?: boolean;
    burnable?: boolean;
    expirable?: boolean;
    revokable?: boolean;
    totalSupply?: number;
    description?: string;
    actorId: string;
  }): Promise<CreateCollectionResult> {

    const { tenantId, projectId, actorId, ...collectionParams } = params;
    const normalized = tenantId.toLowerCase().replace(/^org_/, '');

    // Policy gate: can this tenant create collections?
    const policyResult = await NftPolicyEngine.evaluateCollectionCreatePolicy(normalized);
    if (policyResult.decision === 'DENY') {
      throw new Error(`[NftCapability.createCollection] ${policyResult.reason}`);
    }

    // Force behavior for IDENTITY/REPUTATION
    const isNonTransferable = params.purpose === 'IDENTITY' || params.purpose === 'REPUTATION';
    const resolvedTransferable = isNonTransferable ? false : (params.transferable ?? true);

    // Insert DRAFT
    const [newCollection] = await db
      .insert(tenantNftCollections)
      .values({
        projectId,
        organizationId: normalized,
        name: params.name.trim(),
        symbol: params.symbol.trim().toUpperCase(),
        description: params.description || null,
        purpose: params.purpose,
        standard: params.standard ?? 'ERC-721',
        transferable: resolvedTransferable,
        burnable: params.burnable ?? false,
        expirable: params.expirable ?? false,
        revokable: params.revokable ?? false,
        totalSupply: params.totalSupply ?? 0,
        chainId: 8453, // Base Mainnet — backend determined
        config: {},
        status: 'DRAFT',
        createdBy: actorId,
      })
      .returning({ id: tenantNftCollections.id });

    if (!newCollection) throw new Error('[NftCapability] Failed to insert collection.');

    // Governance intent
    const intentId = `intent_nft_col_${Date.now()}`;
    await db.insert(operationalIntents).values({
      id: intentId,
      organizationId: normalized,
      missionId: 'nft_issuance_mission',
      packId: 'core_nft_pack',
      packVersion: '1.0.0',
      strategyDecisionId: 'decision_deploy_collection',
      intentType: 'growth.nft.collection.v1',
      objective: `Deploy NFT collection "${params.name}" (${params.symbol}) — purpose: ${params.purpose}`,
      rationale: `Collection ID: ${newCollection.id}. Requested by: ${actorId}`,
      status: 'proposed',
    });

    // Update collection with intent reference
    await db
      .update(tenantNftCollections)
      .set({ status: 'GOVERNANCE_PENDING', governanceIntentId: intentId })
      .where(eq(tenantNftCollections.id, newCollection.id));

    // Outbox event
    await db.insert(outboxEvents).values({
      organizationId: normalized,
      aggregateType: 'nft_collection',
      aggregateId: newCollection.id,
      eventType: 'collection.governance_submitted',
      payload: { collectionId: newCollection.id, intentId, purpose: params.purpose, tenantId: normalized },
      status: 'pending',
    }).catch(err => console.warn('[NftCapability] Outbox event failed:', err));

    return {
      collectionId: newCollection.id,
      status: 'GOVERNANCE_PENDING',
      governanceIntentId: intentId,
      message: 'Collection pending governance approval for on-chain deployment.',
    };
  }

  /**
   * Issue (mint) a token to a recipient wallet.
   * Policy engine determines whether auto-execution or governance is required.
   *
   * Auth: tenantId server-resolved, collectionId verified to belong to tenant
   * Level 2 (ALLOW_AUTO): creates issuance record, marks pending_mint
   * Level 3 (REQUIRE_GOVERNANCE): creates intent, no issuance record yet
   */
  static async issueToken(params: {
    tenantId: string;
    projectId: number;
    collectionId: string;
    recipientWallet: string;
    actorId: string;
    correlationLeadId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<IssueTokenResult> {

    const normalized = params.tenantId.toLowerCase().replace(/^org_/, '');

    // Capability check
    const hasCap = await NftPolicyEngine.hasNftCapability(normalized, NFT_CAPABILITIES.TOKEN_ISSUE);
    if (!hasCap) {
      return { status: 'denied', autoExecuted: false, reason: 'Tenant does not have nft.token.issue capability.' };
    }

    // Policy evaluation
    const policy = await NftPolicyEngine.evaluateIssuancePolicy(
      normalized,
      params.collectionId,
      params.recipientWallet,
    );

    if (policy.decision === 'DENY') {
      return { status: 'denied', autoExecuted: false, reason: policy.reason };
    }

    if (policy.decision === 'REQUIRE_GOVERNANCE') {
      // Create issuance record first (pending_mint) so the executor has a record to update
      // after governance approval triggers executeNftMint().
      const [pendingIssuance] = await db
        .insert(tenantNftIssuances)
        .values({
          collectionId: params.collectionId,
          projectId: params.projectId,
          recipientWallet: params.recipientWallet.toLowerCase(),
          recipientLeadId: params.correlationLeadId || null,
          status: 'pending_mint',
          metadata: {
            ...params.metadata,
            issuedBy: params.actorId,
            issuedAt: new Date().toISOString(),
            policyReason: policy.reason,
            awaitingGovernance: true,
          },
        })
        .returning({ id: tenantNftIssuances.id });

      if (!pendingIssuance) throw new Error('[NftCapability] Failed to create pending issuance record.');

      // Create governance intent — embed issuanceId in rationale for executor resolution
      const intentId = `intent_nft_mint_${Date.now()}`;
      await db.insert(operationalIntents).values({
        id: intentId,
        organizationId: normalized,
        missionId: 'nft_issuance_mission',
        packId: 'core_nft_pack',
        packVersion: '1.0.0',
        strategyDecisionId: 'decision_mint',
        intentType: policy.intentTypeIfGovernance || 'growth.nft.mint.v1',
        objective: `Mint NFT from collection ${params.collectionId} to ${params.recipientWallet}`,
        rationale: `Policy: ${policy.reason}. Actor: ${params.actorId}. Issuance: ${pendingIssuance.id}`,
        status: 'proposed',
      });

      // Link issuance to governance intent for traceability
      await db
        .update(tenantNftIssuances)
        .set({ governanceIntentId: intentId })
        .where(eq(tenantNftIssuances.id, pendingIssuance.id));

      return {
        issuanceId: pendingIssuance.id,
        governanceIntentId: intentId,
        autoExecuted: false,
        status: 'pending_governance',
        reason: policy.reason,
      };
    }

    // ALLOW_AUTO: create issuance record in pending_mint, then dispatch on-chain mint.
    // Policy permitted it, but the on-chain mint must still execute and confirm.
    // token.issued is emitted by nft-mint-executor ONLY after blockchain confirmation.
    const [issuance] = await db
      .insert(tenantNftIssuances)
      .values({
        collectionId: params.collectionId,
        projectId: params.projectId,
        recipientWallet: params.recipientWallet.toLowerCase(),
        recipientLeadId: params.correlationLeadId || null,
        status: 'pending_mint',
        metadata: {
          ...params.metadata,
          issuedBy: params.actorId,
          issuedAt: new Date().toISOString(),
          policyReason: policy.reason,
        },
      })
      .returning({ id: tenantNftIssuances.id });

    if (!issuance) throw new Error('[NftCapability] Failed to create issuance record.');

    // Dispatch on-chain mint asynchronously (same executor as governance path)
    // This is NOT fire-and-forget — the executor updates status to 'minted' or 'mint_failed'
    // and emits the correct outbox event based on actual blockchain outcome.
    setImmediate(async () => {
      try {
        const { executeNftMint } = await import('./nft-mint-executor');
        await executeNftMint(issuance.id, normalized);
      } catch (mintErr: any) {
        console.error(
          `[NftCapability] Auto-mint failed for issuance ${issuance.id}:`,
          mintErr?.message
        );
        // executor already set status='mint_failed' and emitted token.mint_failed outbox
      }
    });

    return {
      issuanceId: issuance.id,
      autoExecuted: true,
      status: 'issued',   // 'issued' here means: mint dispatched, pending on-chain confirmation
      reason: `${policy.reason} | On-chain mint dispatched — confirmation pending.`,
    };
  }

  /**
   * Verify if a wallet holds a token from a specific collection.
   * Level 0 operation — read-only, no governance required.
   * Tries on-chain first, falls back to DB.
   *
   * Auth: collectionId is server-verified to belong to tenant
   */
  static async verifyOwnership(params: {
    tenantId: string;
    collectionId: string;
    walletAddress: string;
  }): Promise<{ holds: boolean | null; balance: number | null; source: string; reason?: string }> {

    const normalized = params.tenantId.toLowerCase().replace(/^org_/, '');

    // Load collection (anti-IDOR: must belong to tenant)
    const [collection] = await db
      .select({
        id: tenantNftCollections.id,
        contractAddress: tenantNftCollections.contractAddress,
        chainId: tenantNftCollections.chainId,
        standard: tenantNftCollections.standard,
        status: tenantNftCollections.status,
      })
      .from(tenantNftCollections)
      .where(and(
        eq(tenantNftCollections.id, params.collectionId),
        eq(tenantNftCollections.organizationId, normalized),
      ))
      .limit(1);

    if (!collection) {
      return { holds: null, balance: null, source: 'UNAVAILABLE', reason: 'Collection not found.' };
    }

    if (!collection.contractAddress) {
      // Not deployed — can only check DB records
      const { verifyDbIssuance } = await import('./token-gate');
      const dbResult = await verifyDbIssuance(params.collectionId, params.walletAddress);
      return {
        holds: dbResult.holds,
        balance: dbResult.balance,
        source: dbResult.source,
        reason: 'Collection not deployed on-chain. Verified via DB records.',
      };
    }

    const result: TokenGateResult = await verifyNftAccess({
      contractAddress: collection.contractAddress,
      collectionId: params.collectionId,
      walletAddress: params.walletAddress,
      chainId: collection.chainId,
      standard: collection.standard,
      gateMode: 'INFORMATION', // Hermes read tool — DB fallback acceptable for narration
    });

    return {
      holds: result.holds,
      balance: result.balance,
      source: result.source,
      reason: result.source === 'UNAVAILABLE' ? (result as any).reason : undefined,
    };
  }

  /**
   * Propose revoking a specific token issuance.
   * Always creates a governance intent — revocation is never auto-executed.
   */
  static async revokeToken(params: {
    tenantId: string;
    issuanceId: string;
    reason: string;
    actorId: string;
  }): Promise<RevokeTokenResult> {
    const normalized = params.tenantId.toLowerCase().replace(/^org_/, '');

    const policy = await NftPolicyEngine.evaluateRevocationPolicy(normalized, params.issuanceId);

    if (policy.decision === 'DENY') {
      return { status: 'denied', reason: policy.reason };
    }

    const intentId = `intent_nft_revoke_${Date.now()}`;
    await db.insert(operationalIntents).values({
      id: intentId,
      organizationId: normalized,
      missionId: 'nft_issuance_mission',
      packId: 'core_nft_pack',
      packVersion: '1.0.0',
      strategyDecisionId: 'decision_revoke',
      intentType: 'growth.nft.revoke.v1',
      objective: `Revoke NFT issuance ${params.issuanceId}`,
      rationale: `Reason: ${params.reason}. Actor: ${params.actorId}`,
      status: 'proposed',
    });

    return {
      governanceIntentId: intentId,
      status: 'pending_governance',
      reason: 'Revocation intent submitted. Awaiting governance approval.',
    };
  }

  /**
   * Read-only collection summary for Hermes narration.
   * No capability gate — any authenticated session can query.
   * Anti-IDOR: tenantId is matched server-side.
   */
  static async explainCollection(params: {
    tenantId: string;
    collectionId: string;
  }): Promise<CollectionSummary | null> {
    const normalized = params.tenantId.toLowerCase().replace(/^org_/, '');

    const [collection] = await db
      .select()
      .from(tenantNftCollections)
      .where(and(
        eq(tenantNftCollections.id, params.collectionId),
        eq(tenantNftCollections.organizationId, normalized),
      ))
      .limit(1);

    if (!collection) return null;

    const [mintCount] = await db
      .select({ total: count() })
      .from(tenantNftIssuances)
      .where(eq(tenantNftIssuances.collectionId, collection.id));

    const minted = mintCount?.total ?? 0;
    const supplyRemaining = collection.totalSupply === 0
      ? null  // null = unlimited
      : Math.max(0, collection.totalSupply - minted);

    const purposePolicy = NftPolicyEngine.getPurposePolicy(collection.purpose);
    const policyNotes: string[] = [];
    if (purposePolicy?.governanceRequired) policyNotes.push('Issuance requires governance approval.');
    if (!collection.transferable) policyNotes.push('Non-transferable token.');
    if (collection.expirable) policyNotes.push('Tokens can expire.');
    if (collection.revokable) policyNotes.push('Tokens can be revoked.');
    if (supplyRemaining === 0) policyNotes.push('Supply exhausted.');
    if (!collection.contractAddress) policyNotes.push('Not yet deployed on-chain.');

    return {
      id: collection.id,
      name: collection.name,
      symbol: collection.symbol,
      purpose: collection.purpose as NftPurpose,
      status: collection.status as NftCollectionStatus,
      totalSupply: collection.totalSupply,
      mintedSupply: minted,
      supplyRemaining,
      contractAddress: collection.contractAddress ?? undefined,
      chainId: collection.chainId,
      policyNotes,
    };
  }
}
