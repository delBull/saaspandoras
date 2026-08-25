import { NextRequest, NextResponse } from 'next/server';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { db } from '@/db';
import { hermesKnowledge } from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
const tokenService = new SessionTokenService();

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const payload = tokenService.verifyToken(token);
    const orgId = payload.organizationId;

    const pendingFacts = await db
      .select({
        id: hermesKnowledge.id,
        dimension: hermesKnowledge.dimension,
        key: hermesKnowledge.key,
        content: hermesKnowledge.content,
        status: hermesKnowledge.status,
        version: hermesKnowledge.version,
        source: hermesKnowledge.source,
        sourceReference: hermesKnowledge.sourceReference,
        createdAt: hermesKnowledge.createdAt,
      })
      .from(hermesKnowledge)
      .where(
        and(
          eq(hermesKnowledge.organizationId, orgId),
          inArray(hermesKnowledge.status, ['DISCOVERED', 'PENDING_REVIEW'])
        )
      )
      .orderBy(desc(hermesKnowledge.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      items: pendingFacts,
      count: pendingFacts.length,
      organizationId: orgId,
    });
  } catch (error: any) {
    console.error('[TMA Pending Knowledge Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pending knowledge' },
      { status: error?.statusCode || 401 }
    );
  }
}
