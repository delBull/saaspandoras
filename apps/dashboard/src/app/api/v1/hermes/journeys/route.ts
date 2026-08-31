import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesJourneys, hermesJourneyStages, hermesJourneyTransitions } from '@/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { HermesAuthError } from '@/lib/hermes/auth/hermes-session.types';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import type { 
  GetJourneysResponseDTO, 
  JourneyDTO, 
  ToggleJourneyStatusRequestDTO, 
  ToggleJourneyStatusResponseDTO,
  DashApiError 
} from '@/lib/dash-contracts/journeys';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

/**
 * Helper to resolve authorized tenant context from either cookie session or Bearer token.
 * Fail-Closed: throws or returns null if unauthenticated.
 */
async function resolveAuthorizedTenant(req: NextRequest, requestedSlug?: string | null): Promise<{
  organizationId: string;
  organizationSlug: string;
  projectId: number | null;
} | null> {
  // 1. Check pandoras_portal_session cookie (Hermes Web Portal)
  const portalSessionCookie = req.cookies.get('pandoras_portal_session')?.value;
  if (portalSessionCookie) {
    const session = await validatePortalSession(portalSessionCookie);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        // If client requested a specific slug, verify match (Anti-Spoofing)
        if (requestedSlug && requestedSlug !== org.slug && requestedSlug !== org.organizationId) {
          return null; // Cross-tenant access denied
        }
        return {
          organizationId: org.organizationId,
          organizationSlug: org.slug,
          projectId: session.projectId,
        };
      }
    }
  }

  // 2. Check Bearer Authorization token (TMA / External Clients)
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerToken) {
    try {
      const payload = sessionTokenService.verifyToken(bearerToken);
      const cleanTenant = payload.organizationId.toLowerCase().replace(/^org_/, '');
      if (requestedSlug && requestedSlug !== cleanTenant && requestedSlug !== payload.organizationId) {
        return null; // Cross-tenant access denied
      }
      return {
        organizationId: payload.organizationId,
        organizationSlug: cleanTenant,
        projectId: null,
      };
    } catch {
      return null;
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-journeys-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      const error: DashApiError = {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again shortly.',
      };
      return NextResponse.json(error, { 
        status: 429, 
        headers: { 'Retry-After': String(rl.retryAfterSeconds) } 
      });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationSlug');

    const auth = await resolveAuthorizedTenant(req, requestedSlug);
    if (!auth) {
      const error: DashApiError = {
        code: 'UNAUTHENTICATED',
        message: 'Valid Hermes portal session or bearer token required.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const orgId = auth.organizationId;
    const orgSlug = auth.organizationSlug;

    // Fetch journeys scoped strictly to authorized tenant
    const dbJourneys = await db
      .select()
      .from(hermesJourneys)
      .where(
        or(
          eq(hermesJourneys.organizationId, orgId),
          eq(hermesJourneys.organizationId, orgSlug),
          eq(hermesJourneys.organizationId, `org_${orgSlug}`)
        )
      )
      .orderBy(asc(hermesJourneys.createdAt));

    // Fetch stages & transitions for each journey
    const journeys: JourneyDTO[] = await Promise.all(
      dbJourneys.map(async (j) => {
        const stages = await db
          .select()
          .from(hermesJourneyStages)
          .where(eq(hermesJourneyStages.journeyId, j.id))
          .orderBy(asc(hermesJourneyStages.orderIndex));

        const transitions = await db
          .select()
          .from(hermesJourneyTransitions)
          .where(eq(hermesJourneyTransitions.journeyId, j.id));

        const milestones: string[] = [];
        for (const s of stages) {
          const objs = Array.isArray(s.objectives) ? (s.objectives as string[]) : [];
          if (objs.length > 0) {
            milestones.push(...objs);
          } else {
            milestones.push(s.name);
          }
        }

        return {
          id: j.id,
          organizationId: j.organizationId,
          name: j.name,
          description: j.description || undefined,
          version: j.version,
          status: j.status as any,
          isDefault: j.isDefault,
          stages: stages.map(s => ({
            id: s.id,
            name: s.name,
            orderIndex: s.orderIndex,
            objectives: Array.isArray(s.objectives) ? (s.objectives as string[]) : [],
          })),
          milestones: milestones.length > 0 ? milestones : [j.description || 'Proceso en curso'],
          transitionsCount: transitions.length,
          createdAt: j.createdAt.toISOString(),
          updatedAt: j.updatedAt.toISOString(),
        };
      })
    );

    const response: GetJourneysResponseDTO = { journeys };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/journeys GET] Error:', err);
    const error: DashApiError = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve journeys.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-journeys-patch:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      const error: DashApiError = {
        code: 'RATE_LIMITED',
        message: 'Too many requests.',
      };
      return NextResponse.json(error, { 
        status: 429, 
        headers: { 'Retry-After': String(rl.retryAfterSeconds) } 
      });
    }

    const body: ToggleJourneyStatusRequestDTO = await req.json();
    const { journeyId, active } = body;

    if (!journeyId || typeof active !== 'boolean') {
      const error: DashApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payload: journeyId (string) and active (boolean) are required.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const auth = await resolveAuthorizedTenant(req);
    if (!auth) {
      const error: DashApiError = {
        code: 'UNAUTHENTICATED',
        message: 'Valid Hermes portal session or bearer token required.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const orgId = auth.organizationId;
    const orgSlug = auth.organizationSlug;
    const newStatus = active ? 'ACTIVE' : 'INACTIVE';

    const result = await db
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
            eq(hermesJourneys.organizationId, orgSlug),
            eq(hermesJourneys.organizationId, `org_${orgSlug}`)
          )
        )
      )
      .returning({ id: hermesJourneys.id, status: hermesJourneys.status });

    if (!result || result.length === 0) {
      const error: DashApiError = {
        code: 'NOT_FOUND',
        message: 'Journey not found or does not belong to authorized organization.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    const response: ToggleJourneyStatusResponseDTO = {
      success: true,
      journeyId,
      status: result[0]?.status as any,
    };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/journeys PATCH] Error:', err);
    const error: DashApiError = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to update journey status.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthorizedTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, milestones = [] } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'name is required' }, { status: 400 });
    }

    const journeyId = crypto.randomUUID();
    const finalOrgIdentifier = auth.organizationSlug;

    await db.insert(hermesJourneys).values({
      id: journeyId,
      organizationId: finalOrgIdentifier,
      name: name.trim(),
      description: description?.trim() || `Workflow para ${name.trim()}`,
      status: 'ACTIVE',
      version: 1,
      isDefault: false,
    });

    const validMilestones = (milestones as string[]).map(m => m.trim()).filter(m => m.length > 0);
    if (validMilestones.length > 0) {
      for (let i = 0; i < validMilestones.length; i++) {
        const milestoneText = validMilestones[i] ?? 'Paso';
        await db.insert(hermesJourneyStages).values({
          id: crypto.randomUUID(),
          journeyId: journeyId,
          name: milestoneText,
          orderIndex: i + 1,
          objectives: [milestoneText],
        });
      }
    } else {
      await db.insert(hermesJourneyStages).values({
        id: crypto.randomUUID(),
        journeyId: journeyId,
        name: 'Identificar necesidades del prospecto',
        orderIndex: 1,
        objectives: ['Identificar necesidades del prospecto'],
      });
    }

    return NextResponse.json({ success: true, journeyId });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/journeys POST] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to create journey' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await resolveAuthorizedTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { journeyId, name, description, milestones = [] } = body;

    if (!journeyId || !name) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'journeyId and name required' }, { status: 400 });
    }

    await db
      .update(hermesJourneys)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(hermesJourneys.id, journeyId),
          or(
            eq(hermesJourneys.organizationId, auth.organizationId),
            eq(hermesJourneys.organizationId, auth.organizationSlug),
            eq(hermesJourneys.organizationId, `org_${auth.organizationSlug}`)
          )
        )
      );

    const validMilestones = (milestones as string[]).map(m => m.trim()).filter(m => m.length > 0);
    if (validMilestones.length > 0) {
      await db.delete(hermesJourneyStages).where(eq(hermesJourneyStages.journeyId, journeyId));

      for (let i = 0; i < validMilestones.length; i++) {
        const milestoneText = validMilestones[i] ?? 'Paso';
        await db.insert(hermesJourneyStages).values({
          id: crypto.randomUUID(),
          journeyId: journeyId,
          name: milestoneText,
          orderIndex: i + 1,
          objectives: [milestoneText],
        });
      }
    }

    return NextResponse.json({ success: true, journeyId });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/journeys PUT] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to update journey' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await resolveAuthorizedTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const journeyId = searchParams.get('journeyId');

    if (!journeyId) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'journeyId parameter required' }, { status: 400 });
    }

    await db.delete(hermesJourneyStages).where(eq(hermesJourneyStages.journeyId, journeyId));
    await db
      .delete(hermesJourneys)
      .where(
        and(
          eq(hermesJourneys.id, journeyId),
          or(
            eq(hermesJourneys.organizationId, auth.organizationId),
            eq(hermesJourneys.organizationId, auth.organizationSlug),
            eq(hermesJourneys.organizationId, `org_${auth.organizationSlug}`)
          )
        )
      );

    return NextResponse.json({ success: true, journeyId });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/journeys DELETE] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to delete journey' }, { status: 500 });
  }
}
