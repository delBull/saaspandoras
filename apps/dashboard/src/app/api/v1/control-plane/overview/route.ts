/**
 * 🛰️ Control Plane API Boundary — Overview Service
 * /api/v1/control-plane/overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, installedProducts, operationalIntents } from '@/db/schema';
import { eq, and, or, count } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { isWalletAuthorizedForTenant } from '@/lib/hermes/auth/wallet-tenant-membership';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type { ControlPlaneOverviewDTO } from '@/lib/dash-contracts/control-plane';

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
          return null; // Anti-spoofing
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
  const incomingWallet = req.headers.get('x-wallet-address')?.toLowerCase() ||
    req.cookies.get('wallet-address')?.value?.toLowerCase() ||
    req.cookies.get('thirdweb:wallet-address')?.value?.toLowerCase();

  if (incomingWallet) {
    const isAuth = await isWalletAuthorizedForTenant(incomingWallet, cleanSlug);
    if (isAuth) {
      return {
        organizationId: requestedOrg || `org_${cleanSlug}`,
        organizationSlug: cleanSlug,
      };
    }
  }

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
    const rl = checkRateLimit(`cp-overview-get:${ip}`, 60, 60_000);
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

    const [project] = await db
      .select()
      .from(projects)
      .where(or(eq(projects.slug, cleanSlug), eq(projects.slug, orgParam)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Organization not found' }, { status: 404 });
    }

    const hermesInstall = await db.query.installedProducts.findFirst({
      where: and(
        eq(installedProducts.projectId, project.id),
        eq(installedProducts.productFamily, 'HERMES')
      ),
    });

    const [pendingRes] = await db
      .select({ val: count() })
      .from(operationalIntents)
      .where(
        and(
          or(
            eq(operationalIntents.organizationId, orgParam),
            eq(operationalIntents.organizationId, `org_${cleanSlug}`),
            eq(operationalIntents.organizationId, cleanSlug)
          ),
          eq(operationalIntents.status, 'proposed')
        )
      );

    const response: ControlPlaneOverviewDTO = {
      id: `org_${project.slug}`,
      name: project.title || project.slug,
      slug: project.slug,
      hasHermes: Boolean(hermesInstall),
      stats: {
        totalInteractions: 0,
        activeJourneys: 0,
        governanceScore: 100,
        knowledgeSourcesCount: 0,
      },
      metrics: {
        activeMissionsCount: 1,
        pendingIntentsCount: pendingRes?.val ?? 0,
        completedMissionsCount: 0,
        riskScore: 0,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[ControlPlane API: overview GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
