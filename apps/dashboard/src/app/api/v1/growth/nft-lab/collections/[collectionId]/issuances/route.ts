/**
 * GET /api/v1/growth/nft-lab/collections/[collectionId]/issuances
 *
 * Admin endpoint: returns all token issuances for a specific NFT collection.
 * Used by the dashboard admin panel to see who holds tokens from a given collection.
 *
 * Auth: project-level API key (organizationId resolved server-side)
 * Isolation: collection must belong to the authenticated org
 * Pagination: ?page=1&limit=50 (default limit 50, max 200)
 * Filtering: ?status=minted|pending_mint|mint_failed|revoked|expired
 * Sorting: ?sort=createdAt_desc (default) | createdAt_asc | mintedAt_desc
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { tenantNftCollections, tenantNftIssuances } from '@saasfly/db/schema';
import { eq, and, desc, asc, count } from "@saasfly/db-core";
import { IntegrationKeyService } from '@/lib/integrations/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!apiKey) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'API key required.' }, { status: 401 });
  }

  const auth = await IntegrationKeyService.validateKey(apiKey);
  if (!auth || !auth.projectId) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Invalid API key or missing project association.' }, { status: 403 });
  }

  // Resolve organizationId from the associated project
  const { projects } = await import('@/db/schema');
  const [project] = await db.select({ organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, auth.projectId))
    .limit(1);

  if (!project || !project.organizationId) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Project organization not found.' }, { status: 403 });
  }

  const normalizedOrg = project.organizationId.replace(/^org_/, '').toLowerCase();

  // ── 2. Params ─────────────────────────────────────────────────────────────
  const { collectionId } = await params;
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
  const statusFilter = url.searchParams.get('status') || null;
  const sortParam = url.searchParams.get('sort') || 'createdAt_desc';
  const offset = (page - 1) * limit;

  // ── 3. Verify collection belongs to this org (tenant isolation) ───────────
  const [collection] = await db
    .select({
      id: tenantNftCollections.id,
      name: tenantNftCollections.name,
      symbol: tenantNftCollections.symbol,
      totalSupply: tenantNftCollections.totalSupply,
      status: tenantNftCollections.status,
      contractAddress: tenantNftCollections.contractAddress,
      chainId: tenantNftCollections.chainId,
      standard: tenantNftCollections.standard,
    })
    .from(tenantNftCollections)
    .where(and(
      eq(tenantNftCollections.id, collectionId),
      eq(tenantNftCollections.organizationId, normalizedOrg),
    ))
    .limit(1);

  if (!collection) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Collection not found or does not belong to this organization.' },
      { status: 404 }
    );
  }

  // ── 4. Build query conditions ─────────────────────────────────────────────
  const conditions = [eq(tenantNftIssuances.collectionId, collectionId)];

  if (statusFilter) {
    const validStatuses = ['pending_mint', 'minted', 'mint_failed', 'revoked', 'expired'];
    if (!validStatuses.includes(statusFilter)) {
      return NextResponse.json(
        { error: 'INVALID_PARAM', message: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    conditions.push(eq(tenantNftIssuances.status, statusFilter as any));
  }

  // ── 5. Sort direction ────────────────────────────────────────────────────
  const orderBy = sortParam === 'mintedAt_desc'
    ? desc(tenantNftIssuances.mintedAt)
    : sortParam === 'createdAt_asc'
      ? asc(tenantNftIssuances.createdAt)
      : desc(tenantNftIssuances.createdAt); // default

  // ── 6. Count total (for pagination) ─────────────────────────────────────
  const [totalRow] = await db
    .select({ total: count() })
    .from(tenantNftIssuances)
    .where(and(...conditions));

  const total = totalRow?.total ?? 0;

  // ── 7. Fetch page of issuances ───────────────────────────────────────────
  const issuances = await db
    .select({
      id: tenantNftIssuances.id,
      recipientWallet: tenantNftIssuances.recipientWallet,
      recipientLeadId: tenantNftIssuances.recipientLeadId,
      tokenId: tenantNftIssuances.tokenId,
      mintTxHash: tenantNftIssuances.mintTxHash,
      mintedAt: tenantNftIssuances.mintedAt,
      expiresAt: tenantNftIssuances.expiresAt,
      revokedAt: tenantNftIssuances.revokedAt,
      revokedBy: tenantNftIssuances.revokedBy,
      status: tenantNftIssuances.status,
      governanceIntentId: tenantNftIssuances.governanceIntentId,
      createdAt: tenantNftIssuances.createdAt,
    })
    .from(tenantNftIssuances)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // ── 8. Enrich with expiration status for ACCESS_PASS ────────────────────
  const now = new Date();
  const enriched = issuances.map(issuance => ({
    ...issuance,
    isExpired: issuance.expiresAt ? new Date(issuance.expiresAt) < now : false,
    isActive: issuance.status === 'minted' && !issuance.revokedAt &&
              (issuance.expiresAt ? new Date(issuance.expiresAt) >= now : true),
  }));

  return NextResponse.json({
    collection: {
      id: collection.id,
      name: collection.name,
      symbol: collection.symbol,
      totalSupply: collection.totalSupply,
      status: collection.status,
      contractAddress: collection.contractAddress,
      chainId: collection.chainId,
      standard: collection.standard,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: offset + limit < total,
    },
    issuances: enriched,
  });
}
