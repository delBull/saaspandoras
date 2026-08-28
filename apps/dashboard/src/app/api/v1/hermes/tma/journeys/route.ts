import { NextRequest, NextResponse } from 'next/server';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { HermesAuthError } from '@/lib/hermes/auth/hermes-session.types';
import { db } from '@/db';
import { hermesJourneys, hermesJourneyStages, hermesJourneyTransitions } from '@/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';

export const dynamic = 'force-dynamic';
const tokenService = new SessionTokenService();

export async function GET(req: NextRequest) {
  try {
    const rl = checkRateLimit(`tma-journeys:${clientIpFromHeaders(req.headers)}`, 60, 60_000);
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
    const cleanTenant = orgId.toLowerCase().replace(/^org_/, '');

    // 1. Fetch persistent journeys for this tenant
    const journeys = await db
      .select()
      .from(hermesJourneys)
      .where(
        or(
          eq(hermesJourneys.organizationId, orgId),
          eq(hermesJourneys.organizationId, cleanTenant),
          eq(hermesJourneys.organizationId, `org_${cleanTenant}`)
        )
      )
      .orderBy(asc(hermesJourneys.createdAt));

    // 2. Fetch stages for each journey
    const result = await Promise.all(
      journeys.map(async (j) => {
        const stages = await db
          .select()
          .from(hermesJourneyStages)
          .where(eq(hermesJourneyStages.journeyId, j.id))
          .orderBy(asc(hermesJourneyStages.orderIndex));

        const transitions = await db
          .select()
          .from(hermesJourneyTransitions)
          .where(eq(hermesJourneyTransitions.journeyId, j.id));

        return {
          id: j.id,
          name: j.name,
          description: j.description,
          version: j.version,
          status: j.status,
          isDefault: j.isDefault,
          stages: stages.map((s) => ({
            id: s.id,
            name: s.name,
            orderIndex: s.orderIndex,
            objectives: Array.isArray(s.objectives) ? s.objectives : [],
          })),
          transitionsCount: transitions.length,
          createdAt: j.createdAt.toISOString(),
          updatedAt: j.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ journeys: result });
  } catch (err: any) {
    if (err instanceof HermesAuthError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 401 });
    }
    console.error('[API /api/v1/hermes/tma/journeys GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token', code: 'MISSING_TOKEN' }, { status: 401 });
    }

    const payload = tokenService.verifyToken(token);
    const orgId = payload.organizationId;
    const cleanTenant = orgId.toLowerCase().replace(/^org_/, '');

    const body = await req.json();
    const { journeyId, action } = body; // action: 'ACTIVATE' | 'PAUSE'

    if (!journeyId || !['ACTIVATE', 'PAUSE'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const newStatus = action === 'ACTIVATE' ? 'ACTIVE' : 'PAUSED';

    await db
      .update(hermesJourneys)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(hermesJourneys.id, journeyId),
          or(
            eq(hermesJourneys.organizationId, orgId),
            eq(hermesJourneys.organizationId, cleanTenant),
            eq(hermesJourneys.organizationId, `org_${cleanTenant}`)
          )
        )
      );

    return NextResponse.json({ success: true, journeyId, status: newStatus });
  } catch (err: any) {
    if (err instanceof HermesAuthError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 401 });
    }
    console.error('[API /api/v1/hermes/tma/journeys POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
