/**
 * 🎨 Growth OS — Tenant NFT Collection Creation Boundary
 * apps/dashboard/src/app/api/v1/growth/nft-lab/collection/route.ts
 *
 * Phase 1 Architecture:
 *   POST → creates DRAFT in tenant_nft_collections + operationalIntent (GOVERNANCE_PENDING)
 *          Does NOT deploy on-chain yet. Deployment happens in the governance approval handler.
 *
 * Old behavior (immediate deploy) was architecturally incorrect:
 *   - It bypassed governance for a high-risk action (on-chain deployment).
 *   - It could block the request thread for 30-60s waiting for RPC.
 *   - The Hermes flow mandates: propose → governance → execute.
 *
 * Tenant isolation guarantees:
 *   - organizationId is resolved server-side from the canonical session (never from body).
 *   - owner/treasury are resolved from the projects table (never from client body).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { projects, operationalIntents, tenantNftCollections } from '@saasfly/db/schema';
import { eq, or } from "@saasfly/db-core";
import { checkRateLimit, clientIpFromHeaders } from '@saasfly/hermes-core';
import { resolveCanonicalAuthSession } from '@saasfly/hermes-core';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type {
  CreateNftCollectionResponseDTO,
  NftPurpose,
  NftStandard,
} from '@saasfly/shared';

export const runtime = 'nodejs';

// Valid purposes (YIELD excluded — regulatory risk)
const VALID_PURPOSES = new Set<NftPurpose>([
  'ACCESS', 'IDENTITY', 'MEMBERSHIP', 'REWARD',
  'REPUTATION', 'COLLECTIBLE', 'EXPERIENCE', 'GOVERNANCE',
]);

const VALID_STANDARDS = new Set<NftStandard>(['ERC-721', 'ERC-1155', 'SBT']);

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(`growth-nft-collection:${clientIpFromHeaders(req.headers)}`, 5, 60_000);
    if (!rl.allowed) return NextResponse.json({ code: 'RATE_LIMITED' }, { status: 429 });

    // ── Parse body ──────────────────────────────────────────────────────────
    const body = await req.json();
    const {
      organizationId: orgParam,
      name,
      symbol,
      description,
      purpose,
      standard,
      transferable,
      burnable,
      expirable,
      revokable,
      maxSupply,
      royaltyFeeBps,
      imageIpfsCid,
      config: purposeConfig,
    } = body;

    const organizationSlug = (orgParam || '').replace(/^org_/, '').trim();
    if (!organizationSlug) {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'organizationId is required.' }, { status: 400 });
    }

    // ── Auth: canonical session (server-authoritative tenant isolation) ─────
    const session = await resolveCanonicalAuthSession(req, organizationSlug);
    if (!session) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Tenant auth required.' }, { status: 401 });
    }

    // ── Capability Gate (fail-closed) ────────────────────────────────────
    try {
      await capabilityRegistry.assertCapability(session.canonicalOrgId, 'growth.nft');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    // ── Input Validation ──────────────────────────────────────────────────
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'name is required.' }, { status: 400 });
    }
    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'symbol is required.' }, { status: 400 });
    }
    if (symbol.trim().length > 10) {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'symbol must be ≤ 10 characters.' }, { status: 400 });
    }
    if (!purpose || !VALID_PURPOSES.has(purpose as NftPurpose)) {
      return NextResponse.json({
        code: 'INVALID_REQUEST',
        message: `purpose must be one of: ${[...VALID_PURPOSES].join(', ')}.`,
      }, { status: 400 });
    }
    const resolvedStandard: NftStandard = VALID_STANDARDS.has(standard) ? standard : 'ERC-721';

    // ── Resolve project (server-authoritative — never from body) ───────────
    const [project] = await db
      .select({ id: projects.id, wallet: projects.applicantWalletAddress, orgId: projects.organizationId })
      .from(projects)
      .where(or(
        eq(projects.organizationId, session.canonicalOrgId),
        eq(projects.slug, organizationSlug),
      ))
      .limit(1);

    if (!project) {
      return NextResponse.json({ code: 'PROJECT_NOT_FOUND', message: 'Project not found for this organization.' }, { status: 404 });
    }

    // ── Behavior flags ────────────────────────────────────────────────────
    // IDENTITY purpose forces non-transferable (on-chain SBT via PandorasKey).
    // REPUTATION also defaults to non-transferable.
    const isIdentityOrReputation = purpose === 'IDENTITY' || purpose === 'REPUTATION';
    const resolvedTransferable = isIdentityOrReputation ? false : (transferable ?? true);

    // ── Create DRAFT collection in DB ─────────────────────────────────────
    const [newCollection] = await db
      .insert(tenantNftCollections)
      .values({
        projectId: project.id,
        organizationId: session.canonicalOrgId,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        description: description ? String(description).trim() : null,
        purpose: purpose as NftPurpose,
        standard: resolvedStandard,
        transferable: resolvedTransferable,
        burnable: burnable ?? false,
        expirable: expirable ?? false,
        revokable: revokable ?? false,
        totalSupply: Number(maxSupply) || 0,
        royaltyFeeBps: Number(royaltyFeeBps) ?? 250,
        // chainId: always backend-determined (Base Mainnet default)
        chainId: 8453,
        imageIpfsCid: imageIpfsCid || null,
        config: purposeConfig && typeof purposeConfig === 'object' ? purposeConfig : {},
        status: 'DRAFT',
        createdBy: session.actorId,
      })
      .returning({ id: tenantNftCollections.id });

    if (!newCollection) {
      throw new Error('Failed to insert collection record.');
    }

    // ── Emit Governance Intent (GOVERNANCE_PENDING) ───────────────────────
    // The actual on-chain deployment happens ONLY after governance approval.
    // The approval handler (governance center) calls deployNFTPassServer().
    const intentId = `intent_nft_col_${Date.now()}`;
    await db.insert(operationalIntents).values({
      id: intentId,
      organizationId: session.canonicalOrgId,
      missionId: 'nft_issuance_mission',
      packId: 'core_nft_pack',
      packVersion: '1.0.0',
      strategyDecisionId: 'decision_deploy_collection',
      intentType: 'growth.nft.collection.v1',
      objective: `Deploy NFT collection "${name.trim()}" (${symbol.trim().toUpperCase()}) — purpose: ${purpose}`,
      rationale: `Tenant: ${session.canonicalOrgId}. Collection ID: ${newCollection.id}. Awaiting governance approval for on-chain deployment.`,
      status: 'proposed',
    });

    // Link governance intent back to the collection
    await db
      .update(tenantNftCollections)
      .set({ status: 'GOVERNANCE_PENDING', governanceIntentId: intentId })
      .where(eq(tenantNftCollections.id, newCollection.id));

    // ── Emit outbox event for downstream consumers (Hermes, etc.) ─────────
    try {
      const { outboxEvents } = await import('@/db/schema');
      await db.insert(outboxEvents).values({
        organizationId: session.canonicalOrgId,
        aggregateType: 'nft_collection',
        aggregateId: newCollection.id,
        eventType: 'collection.governance_submitted',
        payload: {
          collectionId: newCollection.id,
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          purpose,
          standard: resolvedStandard,
          governanceIntentId: intentId,
          tenantId: session.canonicalOrgId,
        },
        status: 'pending',
      });
    } catch (outboxErr) {
      // Outbox failure is non-fatal — governance intent is already created
      console.warn('[GrowthOS NFT] Outbox event failed (non-fatal):', outboxErr);
    }

    console.log(`[GrowthOS NFT] ✓ Collection DRAFT created: ${newCollection.id} | Intent: ${intentId} | Org: ${session.canonicalOrgId}`);

    const response: CreateNftCollectionResponseDTO = {
      success: true,
      collectionId: newCollection.id,
      status: 'GOVERNANCE_PENDING',
      governanceIntentId: intentId,
      message: 'Colección creada. Pendiente de aprobación en Governance Center para despliegue on-chain.',
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('[GrowthOS NFT Collection] Error:', error?.message || error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error?.message }, { status: 500 });
  }
}
