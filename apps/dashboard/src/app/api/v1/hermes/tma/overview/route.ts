import { NextRequest, NextResponse } from 'next/server';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { db } from '@/db';
import { hermesKnowledge, hermesActorJourneys, hermesSecurityEvents } from '@/db/schema';
import { eq, and, sql, gte, inArray } from 'drizzle-orm';
import { SovereignIpfsOrchestrator } from '@/lib/pandoras/core/domains/hermes/knowledge/ipfs/orchestrator';

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

    // 1. Facts count: verified vs pending
    const [verifiedCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(hermesKnowledge)
      .where(
        and(
          eq(hermesKnowledge.organizationId, orgId),
          eq(hermesKnowledge.status, 'ACTIVE')
        )
      );

    const [pendingCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(hermesKnowledge)
      .where(
        and(
          eq(hermesKnowledge.organizationId, orgId),
          inArray(hermesKnowledge.status, ['DISCOVERED', 'PENDING_REVIEW'])
        )
      );

    // 2. Journeys count: active journeys
    let activeJourneysCount = 0;
    try {
      const [journeysResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(hermesActorJourneys)
        .where(
          and(
            eq(hermesActorJourneys.organizationId, orgId),
            eq(hermesActorJourneys.status, 'IN_PROGRESS')
          )
        );
      activeJourneysCount = journeysResult?.count || 0;
    } catch {
      // Table or journey state might be empty
    }

    // 3. Security events count (last 24h)
    let securityEvents24h = 0;
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [securityResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(hermesSecurityEvents)
        .where(
          and(
            eq(hermesSecurityEvents.organizationId, orgId),
            gte(hermesSecurityEvents.createdAt, twentyFourHoursAgo)
          )
        );
      securityEvents24h = securityResult?.count || 0;
    } catch {
      // Security events table check
    }

    // 4. IPFS Vault Health Check
    let ipfsStatus = 'DURABLE';
    let ipfsProvider = 'KUBO';
    try {
      const orchestrator = new SovereignIpfsOrchestrator();
      const ipfsHealth = await orchestrator.healthCheck();
      ipfsStatus = ipfsHealth.durability.status;
      ipfsProvider = ipfsHealth.primary.providerType;
    } catch {
      ipfsStatus = 'LOCAL_ONLY';
    }

    return NextResponse.json({
      success: true,
      role: payload.role,
      actorId: payload.sub,
      metrics: {
        facts: {
          verified: verifiedCountResult?.count || 0,
          pending: pendingCountResult?.count || 0,
        },
        journeys: {
          active: activeJourneysCount,
        },
        security: {
          events24h: securityEvents24h,
        },
        ipfs: {
          status: ipfsStatus,
          provider: ipfsProvider,
        },
      },
    });
  } catch (error: any) {
    console.error('[TMA Overview API Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch overview metrics' },
      { status: error?.statusCode || 401 }
    );
  }
}
