/**
 * 🛰️ Hermes API Boundary — Activity & Security Audit Service
 * /api/v1/hermes/activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesSecurityEvents, hermesAddonAudit } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

async function resolveAuthorizedTenant(req: NextRequest, requestedSlug?: string | null): Promise<{
  organizationId: string;
  organizationSlug: string;
  projectId: number | null;
} | null> {
  const portalSessionCookie = req.cookies.get('pandoras_portal_session')?.value;
  if (portalSessionCookie) {
    const session = await validatePortalSession(portalSessionCookie);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        if (requestedSlug && requestedSlug !== org.slug && requestedSlug !== org.organizationId) {
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

  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerToken) {
    try {
      const payload = sessionTokenService.verifyToken(bearerToken);
      const cleanTenant = payload.organizationId.toLowerCase().replace(/^org_/, '');
      if (requestedSlug && requestedSlug !== cleanTenant && requestedSlug !== payload.organizationId) {
        return null;
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
    const rl = checkRateLimit(`hermes-activity-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationSlug');

    const auth = await resolveAuthorizedTenant(req, requestedSlug);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const tenantSlug = auth.organizationSlug;
    const orgId = auth.organizationId;

    const rawSecurityEvents = await db
      .select()
      .from(hermesSecurityEvents)
      .where(
        or(
          eq(hermesSecurityEvents.organizationId, tenantSlug),
          eq(hermesSecurityEvents.organizationId, orgId),
          eq(hermesSecurityEvents.organizationId, `org_${tenantSlug}`)
        )
      )
      .orderBy(desc(hermesSecurityEvents.sequenceNumber), desc(hermesSecurityEvents.createdAt))
      .limit(100);

    const rawAddonAudits = await db
      .select()
      .from(hermesAddonAudit)
      .where(
        or(
          eq(hermesAddonAudit.organizationId, tenantSlug),
          eq(hermesAddonAudit.organizationId, orgId),
          eq(hermesAddonAudit.organizationId, `org_${tenantSlug}`)
        )
      )
      .orderBy(desc(hermesAddonAudit.createdAt))
      .limit(50);

    const securityEvents = rawSecurityEvents.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      severity: (e.severity === 'CRITICAL' ? 'CRITICAL' : e.severity === 'WARN' ? 'WARN' : 'INFO') as any,
      policyDecision: (e.policyDecision === 'DENY' ? 'DENY' : e.policyDecision === 'AUDIT' ? 'AUDIT' : 'ALLOW') as any,
      sequenceNumber: e.sequenceNumber,
      contentHash: e.contentHash,
      eventHash: e.eventHash,
      previousEventHash: e.previousEventHash,
      actorId: e.actorId,
      toolId: e.toolId,
      classification: e.classification,
      metadata: (e.metadata as Record<string, unknown>) || null,
      createdAt: e.createdAt.toISOString(),
    }));

    const addonAudits = rawAddonAudits.map((a) => ({
      id: a.id,
      addonId: a.addonId,
      eventType: a.eventType || 'ADDON_UPDATE',
      actorId: a.actorId || null,
      actorType: a.actorType || 'OPERATOR',
      oldStatus: a.oldStatus || null,
      newStatus: a.newStatus || 'ACTIVE',
      version: a.version || null,
      reason: a.reason || null,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({
      securityEvents,
      addonAudits,
      organizationName: tenantSlug,
    });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/activity GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch activity' }, { status: 500 });
  }
}
