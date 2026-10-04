/**
 * 🛰️ Growth OS API Boundary — NFT Lab Service
 * /api/v1/growth/nft-lab
 *
 * Phase 1 rewrite: reads tenant_nft_collections from DB (real, tenant-scoped).
 * mintedSupply = COUNT from tenant_nft_issuances per collection.
 * No hardcoded collections. Supported chains = backend-determined.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { projects, tenantNftCollections, tenantNftIssuances } from '@saasfly/db/schema';
import { eq, or, count } from "@saasfly/db-core";
import { checkRateLimit, clientIpFromHeaders } from '@saasfly/hermes-core';
import { resolveCanonicalAuthSession } from '@saasfly/hermes-core';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type {
  GetNftLabResponseDTO,
  NftCollectionDTO,
  NftPurpose,
  NftStandard,
  NftCollectionStatus,
} from '@saasfly/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Backend-determined chain list. Tenant cannot override chain without plan gate.
const SUPPORTED_CHAINS = [
  { id: 8453, name: 'Base Mainnet', isTestnet: false },
  { id: 84532, name: 'Base Sepolia', isTestnet: true },
];

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`growth-nft-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const orgParam = searchParams.get('organizationId') || '';
    const cleanSlug = orgParam.replace(/^org_/, '').trim();
    if (!cleanSlug) {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'organizationId required.' }, { status: 400 });
    }

    // ── Auth: resolve canonical session (anti-IDOR, tenant isolation) ──────
    const session = await resolveCanonicalAuthSession(req, cleanSlug);
    if (!session) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Authentication required.' }, { status: 401 });
    }

    // ── Capability Gate (fail-closed) ────────────────────────────────────
    try {
      await capabilityRegistry.assertCapability(session.canonicalOrgId, 'growth.nft');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    // ── Resolve project (server-authoritative) ───────────────────────────
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(or(
        eq(projects.organizationId, session.canonicalOrgId),
        eq(projects.slug, cleanSlug),
      ))
      .limit(1);

    if (!project) {
      // Tenant exists (auth passed) but no project yet — return empty state honestly
      const response: GetNftLabResponseDTO = { collections: [], supportedChains: SUPPORTED_CHAINS };
      return NextResponse.json(response);
    }

    // ── Fetch real collections from DB ────────────────────────────────────
    const rawCollections = await db
      .select()
      .from(tenantNftCollections)
      .where(eq(tenantNftCollections.projectId, project.id))
      .orderBy(tenantNftCollections.createdAt);

    // ── Mint counts per collection (real from issuances) ──────────────────
    const mintCounts = new Map<string, number>();
    if (rawCollections.length > 0) {
      const counts = await db
        .select({
          collectionId: tenantNftIssuances.collectionId,
          total: count(),
        })
        .from(tenantNftIssuances)
        .where(
          or(...rawCollections.map(c => eq(tenantNftIssuances.collectionId, c.id)))
        )
        .groupBy(tenantNftIssuances.collectionId);

      for (const row of counts) {
        mintCounts.set(row.collectionId, row.total);
      }
    }

    const collections: NftCollectionDTO[] = rawCollections.map(col => ({
      id: col.id,
      organizationId: session.canonicalOrgId,
      name: col.name,
      symbol: col.symbol,
      purpose: col.purpose as NftPurpose,
      standard: col.standard as NftStandard,
      transferable: col.transferable,
      burnable: col.burnable,
      expirable: col.expirable,
      revokable: col.revokable,
      contractAddress: col.contractAddress ?? undefined,
      chainId: col.chainId,
      totalSupply: col.totalSupply,
      mintedSupply: mintCounts.get(col.id) ?? 0,
      royaltyFeeBps: col.royaltyFeeBps ?? 250,
      status: col.status as NftCollectionStatus,
      governanceIntentId: col.governanceIntentId ?? undefined,
      imageIpfsCid: col.imageIpfsCid ?? undefined,
      metadataIpfsCid: col.metadataIpfsCid ?? undefined,
      deployTxHash: col.deployTxHash ?? undefined,
      config: (col.config as Record<string, unknown>) ?? {},
      createdAt: col.createdAt.toISOString(),
    }));

    const response: GetNftLabResponseDTO = {
      collections,
      supportedChains: SUPPORTED_CHAINS,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Growth API: nft-lab GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}

/**
 * POST — kept for backward compat: submit a mint intent for an existing collection.
 * For creating NEW collections, use POST /api/v1/growth/nft-lab/collection.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`growth-nft-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const body = await req.json();
    const { organizationId, collectionId, recipientWallet } = body;

    const cleanSlug = (organizationId || '').replace(/^org_/, '').trim();
    if (!cleanSlug) {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'organizationId required.' }, { status: 400 });
    }

    const session = await resolveCanonicalAuthSession(req, cleanSlug);
    if (!session) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Authentication required.' }, { status: 401 });
    }

    try {
      await capabilityRegistry.assertCapability(session.canonicalOrgId, 'growth.nft');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    if (!collectionId || !recipientWallet) {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'collectionId and recipientWallet required.' }, { status: 400 });
    }

    // ── Verify collection belongs to this tenant (anti-IDOR) ─────────────
    const [collection] = await db
      .select({ id: tenantNftCollections.id, status: tenantNftCollections.status, projectId: tenantNftCollections.projectId })
      .from(tenantNftCollections)
      .where(eq(tenantNftCollections.id, collectionId))
      .limit(1);

    if (!collection) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Collection not found.' }, { status: 404 });
    }

    // Verify the project belongs to the authenticated tenant
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(or(
        eq(projects.organizationId, session.canonicalOrgId),
        eq(projects.slug, cleanSlug),
      ))
      .limit(1);

    if (!project || collection.projectId !== project.id) {
      return NextResponse.json({ code: 'FORBIDDEN', message: 'Collection does not belong to this tenant.' }, { status: 403 });
    }

    if (collection.status !== 'DEPLOYED') {
      return NextResponse.json({
        code: 'COLLECTION_NOT_DEPLOYED',
        message: `Collection status is '${collection.status}'. Only DEPLOYED collections can be minted.`,
      }, { status: 409 });
    }

    // ── Create issuance record + governance intent ────────────────────────
    const { db: dbInstance } = await import('@/db');
    const { operationalIntents, tenantNftIssuances: issuancesTable } = await import('@/db/schema');

    const [issuance] = await dbInstance
      .insert(issuancesTable)
      .values({
        collectionId,
        projectId: project.id,
        recipientWallet: recipientWallet.toLowerCase().trim(),
        status: 'pending_mint',
        metadata: { requestedBy: session.actorId, requestedAt: new Date().toISOString() },
      })
      .returning({ id: issuancesTable.id });

    const intentId = `intent_nft_mint_${Date.now()}`;
    await dbInstance.insert(operationalIntents).values({
      id: intentId,
      organizationId: session.canonicalOrgId,
      missionId: 'nft_issuance_mission',
      packId: 'core_nft_pack',
      packVersion: '1.0.0',
      strategyDecisionId: 'decision_mint_1',
      intentType: 'growth.nft.mint.v1',
      objective: `Mint NFT from collection ${collectionId} to ${recipientWallet}`,
      rationale: `Issuance record: ${issuance?.id}`,
      status: 'proposed',
    });

    return NextResponse.json({
      success: true,
      issuanceId: issuance?.id,
      governanceIntentId: intentId,
      autoExecuted: false,
      message: 'Solicitud de mint registrada. Pendiente de aprobación en Governance Center.',
    });
  } catch (error: any) {
    console.error('[Growth API: nft-lab POST] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
