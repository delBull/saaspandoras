import { NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgeChunks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireInternalAuth } from '@/lib/security/internal-auth';

/**
 * POST /api/v1/internal/tenants/knowledge
 * 
 * B2/B3: Ingests or updates a knowledge chunk for a given tenant.
 * Demonstrates the Knowledge Lifecycle (upload -> mutate -> retrieve).
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
        .set({ content, metadata, updatedAt: new Date() })
        .where(eq(knowledgeChunks.id, existing.id))
        .returning();
      
      return NextResponse.json({
        success: true,
        message: "Knowledge chunk mutated successfully (B3).",
        chunk: updated[0]
      });
    }

    // B2: Inject new knowledge
    const newChunk = await db.insert(knowledgeChunks).values({
      tenantId,
      sourceType,
      sourceId,
      content,
      metadata: metadata || {}
    }).returning();

    return NextResponse.json({ 
      success: true, 
      message: "Knowledge chunk injected successfully (B2).",
      chunk: newChunk[0]
    });
  } catch (error: any) {
    console.error('[TenantKnowledge] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
