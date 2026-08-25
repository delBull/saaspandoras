import { NextRequest, NextResponse } from 'next/server';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { db } from '@/db';
import { hermesKnowledge, hermesGovernanceAudit } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
const tokenService = new SessionTokenService();

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const payload = tokenService.verifyToken(token);
    const orgId = payload.organizationId;

    const body = await req.json();
    const { knowledgeId } = body;

    if (!knowledgeId || typeof knowledgeId !== 'string') {
      return NextResponse.json({ error: 'Missing knowledgeId' }, { status: 400 });
    }

    // 1. Fetch item to verify tenant ownership and current status
    const [item] = await db
      .select()
      .from(hermesKnowledge)
      .where(
        and(
          eq(hermesKnowledge.id, knowledgeId),
          eq(hermesKnowledge.organizationId, orgId)
        )
      )
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { error: 'Knowledge fact not found or access denied for this workspace' },
        { status: 404 }
      );
    }

    if (item.status === 'ACTIVE') {
      return NextResponse.json({ success: true, item, message: 'Fact already active' });
    }

    const timestamp = new Date();
    const previousStatus = item.status;

    // 2. Perform atomic update to ACTIVE
    const [updatedItem] = await db
      .update(hermesKnowledge)
      .set({
        status: 'ACTIVE',
        authority: 'TENANT_PROVIDED',
        updatedAt: timestamp,
      })
      .where(
        and(
          eq(hermesKnowledge.id, knowledgeId),
          eq(hermesKnowledge.organizationId, orgId)
        )
      )
      .returning();

    // 3. Append immutable audit event
    try {
      await db.insert(hermesGovernanceAudit).values({
        id: `evt_${Date.now()}_tma_app_${Math.random().toString(36).substring(7)}`,
        organizationId: orgId,
        knowledgeId,
        version: item.version,
        eventType: 'APPROVE',
        actorId: payload.sub,
        actorType: 'USER',
        oldStatus: previousStatus,
        newStatus: 'ACTIVE',
      });
    } catch (auditErr) {
      console.error('[TMA Knowledge Approve] Non-fatal audit log failure:', auditErr);
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: 'Knowledge fact approved successfully',
    });
  } catch (error: any) {
    console.error('[TMA Knowledge Approve Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to approve knowledge fact' },
      { status: error?.statusCode || 401 }
    );
  }
}
