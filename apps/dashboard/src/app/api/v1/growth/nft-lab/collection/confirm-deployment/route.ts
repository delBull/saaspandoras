/**
 * 🔗 NFT Collection Deployment Confirmation (TENANT_PAYS flow)
 * POST /api/v1/growth/nft-lab/collection/confirm-deployment
 *
 * Called by the tenant AFTER deploying from the browser with their own
 * connected wallet (deployNFTPass client-side). Verifies on-chain that:
 *   1. The contract actually exists (bytecode != 0x)
 * Then persists contractAddress + deployTxHash + feePaidBy='TENANT'
 * and emits outbox 'collection.deployed' (same event as platform flow).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { tenantNftCollections, outboxEvents } from '@saasfly/db/schema';
import { eq, and } from "@saasfly/db-core";
import { resolveCanonicalAuthSession } from '@saasfly/hermes-core';
import { checkRateLimit, clientIpFromHeaders } from '@saasfly/hermes-core';
import { createPublicClient, http, type Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';

export const runtime = 'nodejs';

function resolveChain(chainId: number) {
  if (chainId === 8453) return base;
  if (chainId === 11155111) return baseSepolia;
  return process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? base : baseSepolia;
}

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(`nft-confirm-deploy:${clientIpFromHeaders(req.headers)}`, 15, 60_000);
    if (!rl.allowed) return NextResponse.json({ code: 'RATE_LIMITED' }, { status: 429 });

    const body = await req.json();
    const { collectionId, contractAddress, deployTxHash, chainId } = body;

    if (!collectionId || !contractAddress || !deployTxHash) {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'collectionId, contractAddress and deployTxHash required' }, { status: 400 });
    }

    // ── 1. Auth — tenant must own the collection ──────────────────────────
    const url = new URL(req.url);
    const orgParam = url.searchParams.get('organizationId') || '';
    const session = await resolveCanonicalAuthSession(req, orgParam || undefined);
    if (!session) return NextResponse.json({ code: 'UNAUTHENTICATED' }, { status: 401 });

    const normalizedOrg = session.canonicalOrgId.replace(/^org_/, '').toLowerCase();
    const [collection] = await db
      .select()
      .from(tenantNftCollections)
      .where(and(
        eq(tenantNftCollections.id, String(collectionId)),
        eq(tenantNftCollections.organizationId, normalizedOrg),
      ))
      .limit(1);

    if (!collection) return NextResponse.json({ code: 'COLLECTION_NOT_FOUND' }, { status: 404 });

    // ── 2. On-chain verification (fail-closed) ─────────────────────────────
    const chain = resolveChain(Number(chainId || collection.chainId || 8453));
    const publicClient = createPublicClient({ chain, transport: http() });
    const onchainCode = await publicClient.getBytecode({ address: contractAddress as Address });
    if (!onchainCode || onchainCode === '0x') {
      return NextResponse.json({ code: 'CONTRACT_NOT_DEPLOYED', message: 'No bytecode at reported address — deployment not confirmed.' }, { status: 400 });
    }

    // ── 3. Persist deployment (feePaidBy: TENANT_PAYS) ────────────────────
    await db.update(tenantNftCollections).set({
      status: 'DEPLOYED',
      contractAddress: String(contractAddress),
      deployTxHash: String(deployTxHash),
      updatedAt: new Date(),
    } as any).where(eq(tenantNftCollections.id, collection.id));

    // ── 3b. Outbox event — after on-chain confirmation ────────────────────
    await db.insert(outboxEvents).values({
      organizationId: collection.organizationId,
      aggregateType: 'nft_collection',
      aggregateId: collection.id,
      eventType: 'collection.deployed',
      payload: {
        collectionId: collection.id,
        contractAddress,
        deployTxHash,
        feePaidBy: 'TENANT',
        deployedBy: session.canonicalOrgId,
        network: chain.name,
      },
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      collectionId: collection.id,
      contractAddress,
      deployTxHash,
      feePaidBy: 'TENANT',
    });
  } catch (error: any) {
    console.error('[NFT-CONFIRM-DEPLOY] Error:', error?.message);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error?.message }, { status: 500 });
  }
}
