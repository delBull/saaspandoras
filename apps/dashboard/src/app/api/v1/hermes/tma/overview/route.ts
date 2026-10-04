import { NextRequest, NextResponse } from 'next/server';
import { SessionTokenService } from '@saasfly/hermes-core';
import { HermesAuthError } from '@saasfly/hermes-core';
import { db } from '@saasfly/db';
import { hermesKnowledge, hermesActorJourneys, hermesSecurityEvents } from '@saasfly/db/schema';
import { eq, and, sql, gte, inArray } from "@saasfly/db-core";
import { SovereignIpfsOrchestrator } from '@saasfly/hermes-core';
import { checkRateLimit, clientIpFromHeaders } from '@saasfly/hermes-core';

export const dynamic = 'force-dynamic';
const tokenService = new SessionTokenService();

export async function GET(req: NextRequest) {
  try {
    const rl = checkRateLimit(`tma-overview:${clientIpFromHeaders(req.headers)}`, 60, 60_000);
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

    let postgresOnline = false;
    try {
      await db.execute(sql`SELECT 1`);
      postgresOnline = true;
    } catch {
      postgresOnline = false;
    }

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
        postgres: {
          online: postgresOnline,
        },
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
    if (error instanceof HermesAuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch overview metrics', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
