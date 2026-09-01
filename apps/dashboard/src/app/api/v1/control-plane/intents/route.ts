/**
 * 🛰️ Control Plane API Boundary — Intents Service
 * /api/v1/control-plane/intents
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { operationalIntents, operationalApprovals } from '@/db/schema';
import { eq, desc, or } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { isWalletAuthorizedForTenant } from '@/lib/hermes/auth/wallet-tenant-membership';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type { 
  OperationalIntentDTO, 
  GetPendingIntentsResponseDTO 
} from '@/lib/dash-contracts/control-plane';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

async function resolveControlPlaneTenant(req: NextRequest, requestedOrg?: string | null): Promise<{
  organizationId: string;
  organizationSlug: string;
  projectId?: number;
} | null> {
  const cleanSlug = requestedOrg ? requestedOrg.replace(/^org_/, '').trim() : '';
  if (!cleanSlug) return null;

  // 1. Portal Session Cookie
  const portalCookie = req.cookies.get('pandoras_portal_session')?.value;
  if (portalCookie) {
    const session = await validatePortalSession(portalCookie);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        if (cleanSlug !== org.slug && cleanSlug !== org.organizationId) {
          return null;
        }
        return {
          organizationId: org.organizationId,
          organizationSlug: org.slug,
          projectId: session.projectId,
        };
      }
    }
  }

  // 2. Web Wallet Session (Anti-IDOR)
  const auth = await getAuth();
  if (auth.isVerified && auth.session?.address) {
    const isAuth = await isWalletAuthorizedForTenant(auth.session.address, cleanSlug);
    if (!isAuth) return null;
    return {
      organizationId: requestedOrg || `org_${cleanSlug}`,
      organizationSlug: cleanSlug,
    };
  }

  // 3. Bearer token
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerToken) {
    try {
      const payload = sessionTokenService.verifyToken(bearerToken);
      const tenant = payload.organizationId.toLowerCase().replace(/^org_/, '');
      if (cleanSlug !== tenant && cleanSlug !== payload.organizationId) {
        return null;
      }
      return {
        organizationId: payload.organizationId,
        organizationSlug: tenant,
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
    const rl = checkRateLimit(`cp-intents-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const orgParam = searchParams.get('organizationId') || '';
    const cleanSlug = orgParam.replace(/^org_/, '').trim();

    const auth = await resolveControlPlaneTenant(req, orgParam);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Session or wallet authentication required.' }, { status: 401 });
    }

    // 🔒 Capability Assertion Enforcement (Fail-Closed)
    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.governance');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    const rows = await db
      .select()
      .from(operationalIntents)
      .where(
        or(
          eq(operationalIntents.organizationId, orgParam),
          eq(operationalIntents.organizationId, `org_${cleanSlug}`),
          eq(operationalIntents.organizationId, cleanSlug)
        )
      )
      .orderBy(desc(operationalIntents.createdAt));

    const pendingIntents: OperationalIntentDTO[] = rows.map((r) => ({
      id: r.id,
      intentId: r.id,
      organizationId: r.organizationId,
      missionId: r.missionId,
      missionName: r.objective || 'Operational Intent Mission',
      strategyDecision: r.rationale || 'Autonomous Recommendation',
      reasonSummary: r.rationale || '',
      intentType: r.intentType,
      objective: r.objective,
      rationale: r.rationale || '',
      pack: r.packId || 'core_marketing_pack',
      budget: undefined,
      authorityRequired: 'Founder Approval',
      consequence: `Execution of ${r.intentType}`,
      status: (r.status === 'approved' ? 'APPROVED' : r.status === 'rejected' ? 'REJECTED' : 'PENDING') as any,
      riskScore: 10,
      decisionReason: null,
      createdAt: r.createdAt.toISOString(),
    }));

    const response: GetPendingIntentsResponseDTO = { pendingIntents };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[ControlPlane API: intents GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`cp-intents-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const body = await req.json();
    const { action, organizationId, intentId, reason, simulationPayload } = body;

    const auth = await resolveControlPlaneTenant(req, organizationId);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Session or wallet authentication required.' }, { status: 401 });
    }

    // 🔒 Capability Assertion Enforcement (Fail-Closed)
    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.governance');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    if (action === 'SIMULATE') {
      const missionId = simulationPayload?.missionId || 'mission_demo_1';
      const cleanOrgId = (organizationId || auth.organizationId).trim();
      const generatedId = `intent_${Date.now()}`;

      const inserted = await db
        .insert(operationalIntents)
        .values({
          id: generatedId,
          organizationId: cleanOrgId,
          missionId,
          packId: 'core_marketing_pack',
          packVersion: '1.0.0',
          strategyDecisionId: 'decision_sim_1',
          intentType: simulationPayload?.intentType || 'hermes.governance.intervention.v1',
          objective: simulationPayload?.objective || 'Simulated Hermes Autonomous Operational Intent',
          rationale: simulationPayload?.rationale || 'Triggered via founder control panel testing',
          status: 'proposed',
        })
        .returning();

      return NextResponse.json({ success: true, intentId: inserted[0]?.id || generatedId });
    }

    if (!intentId) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'intentId is required' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      await db
        .update(operationalIntents)
        .set({
          status: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(operationalIntents.id, intentId));

      await db.insert(operationalApprovals).values({
        intentId,
        actorId: 'founder',
        decision: 'approved',
        reason: reason || 'Approved via Control Plane API',
      });

      return NextResponse.json({ success: true, intentId, status: 'APPROVED' });
    }

    if (action === 'REJECT') {
      await db
        .update(operationalIntents)
        .set({
          status: 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(operationalIntents.id, intentId));

      await db.insert(operationalApprovals).values({
        intentId,
        actorId: 'founder',
        decision: 'rejected',
        reason: reason || 'Rejected via Control Plane API',
      });

      return NextResponse.json({ success: true, intentId, status: 'REJECTED' });
    }

    return NextResponse.json({ code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[ControlPlane API: intents POST] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
