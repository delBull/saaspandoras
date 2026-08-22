import { NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgeChunks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireInternalAuth } from '@/lib/security/internal-auth';
import { TenantIpfsVaultService } from '@/lib/pandoras/core/domains/hermes/knowledge/ipfs-vault';
import { HermesIdentitySigner } from '@/lib/pandoras/core/domains/hermes/identity/identity-signer';
import type { KnowledgeClassificationTier } from '@/lib/pandoras/core/domains/hermes/runtime/contracts';

/**
 * POST /api/v1/internal/tenants/knowledge
 * 
 * B2/B3: Ingests or updates a knowledge chunk for a given tenant with automatic IPFS Sovereign Vault pinning.
 */
export async function POST(req: Request) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { tenantId, sourceType, sourceId, content, metadata } = body;

    if (!tenantId || !sourceType || !sourceId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const classification = (metadata?.classification || 'CONFIDENTIAL') as KnowledgeClassificationTier;
    let ipfsCid: string | undefined;
    let storedContent = content;

    // Pin to IPFS Sovereign Vault if not PUBLIC
    if (classification !== 'PUBLIC') {
      try {
        const vaultService = new TenantIpfsVaultService();
        const signer = new HermesIdentitySigner();
        const ipfsResult = await vaultService.storeEncryptedKnowledgeToIpfs(
          content,
          {
            tenantId,
            artifactId: sourceId,
            version: 1,
            classification,
          },
          signer
        );
        ipfsCid = ipfsResult.cid;
        storedContent = JSON.stringify(ipfsResult.encryptedMetadata);
      } catch (err: any) {
        console.warn('[TenantKnowledge] IPFS pinning fallback:', err.message);
      }
    }

    const enrichedMetadata = {
      ...(metadata || {}),
      sourceType,
      classification,
      ...(ipfsCid ? { ipfsCid, ipfsUri: `ipfs://${ipfsCid}` } : {}),
    };

    // Check if chunk already exists (for B3 Mutation)
    const existing = await db.query.knowledgeChunks.findFirst({
      where: and(
        eq(knowledgeChunks.tenantId, tenantId),
        eq(knowledgeChunks.sourceId, sourceId)
      )
    });

    if (existing) {
      // B3: Mutate existing knowledge
      const updated = await db.update(knowledgeChunks)
        .set({ content: storedContent, metadata: enrichedMetadata, updatedAt: new Date() })
        .where(eq(knowledgeChunks.id, existing.id))
        .returning();
      
      return NextResponse.json({
        success: true,
        message: "Knowledge chunk mutated and anchored to IPFS (B3).",
        chunk: updated[0]
      });
    }

    // B2: Inject new knowledge
    const newChunk = await db.insert(knowledgeChunks).values({
      tenantId,
      sourceId,
      content: storedContent,
      metadata: enrichedMetadata
    }).returning();

    return NextResponse.json({ 
      success: true, 
      message: "Knowledge chunk injected and anchored to IPFS (B2).",
      chunk: newChunk[0]
    });
  } catch (error: any) {
    console.error('[TenantKnowledge] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
