import { NextRequest, NextResponse } from 'next/server';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { HermesAuthError } from '@/lib/hermes/auth/hermes-session.types';
import { db } from '@/db';
import { hermesKnowledge, hermesGovernanceAudit } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';

export const dynamic = 'force-dynamic';
const tokenService = new SessionTokenService();

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(`tma-reject:${clientIpFromHeaders(req.headers)}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token', code: 'MISSING_TOKEN' }, { status: 401 });
    }

    const payload = tokenService.verifyToken(token);
    const orgId = payload.organizationId;

    if (payload.role === 'OPERATOR') {
      return NextResponse.json(
        { error: 'OPERATOR role cannot reject knowledge facts', code: 'INSUFFICIENT_ROLE' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { knowledgeId, reason } = body;

    if (!knowledgeId || typeof knowledgeId !== 'string') {
      return NextResponse.json({ error: 'Missing knowledgeId', code: 'MISSING_KNOWLEDGE_ID' }, { status: 400 });
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
        { error: 'Knowledge fact not found or access denied for this workspace', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const timestamp = new Date();
    const previousStatus = item.status;

    // 2. Atomic update + immutable audit in one transaction (fail-closed:
    //    sin registro de auditoría no hay rechazo)
    const updatedItem = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(hermesKnowledge)
        .set({
          status: 'REJECTED',
          updatedAt: timestamp,
        })
        .where(
          and(
            eq(hermesKnowledge.id, knowledgeId),
            eq(hermesKnowledge.organizationId, orgId)
          )
        )
        .returning();

      if (!updated) {
        throw new HermesAuthError('Fact changed during rejection', 'CONCURRENT_MODIFICATION', 409);
      }

      await tx.insert(hermesGovernanceAudit).values({
        id: `evt_${Date.now()}_tma_rej_${Math.random().toString(36).substring(7)}`,
        organizationId: orgId,
        knowledgeId,
        version: item.version,
        eventType: 'REJECT',
        actorId: payload.sub,
        actorType: 'USER',
        oldStatus: previousStatus,
        newStatus: 'REJECTED',
        reason: reason || 'Rejected by operator in TMA',
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: 'Knowledge fact rejected successfully',
    });
  } catch (error: any) {
    console.error('[TMA Knowledge Reject Error]:', error);
    if (error instanceof HermesAuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to reject knowledge fact', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
