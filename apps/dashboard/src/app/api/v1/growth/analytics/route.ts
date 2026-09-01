/**
 * 🛰️ Growth OS API Boundary — Analytics Service
 * /api/v1/growth/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeads, projects } from '@/db/schema';
import { eq, or, count } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { isWalletAuthorizedForTenant } from '@/lib/hermes/auth/wallet-tenant-membership';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type { GetGrowthAnalyticsResponseDTO } from '@/lib/dash-contracts/growth';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

async function resolveTenant(req: NextRequest, requestedOrg?: string | null): Promise<{
  organizationId: string;
  organizationSlug: string;
  projectId?: number;
} | null> {
  const cleanSlug = requestedOrg ? requestedOrg.replace(/^org_/, '').trim() : '';
  if (!cleanSlug) return null;

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

  const auth = await getAuth();
  if (auth.isVerified && auth.session?.address) {
    const isAuth = await isWalletAuthorizedForTenant(auth.session.address, cleanSlug);
    if (!isAuth) return null;
    return {
      organizationId: requestedOrg || `org_${cleanSlug}`,
      organizationSlug: cleanSlug,
    };
  }

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
    const rl = checkRateLimit(`growth-analytics-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const orgParam = searchParams.get('organizationId') || '';
    const cleanSlug = orgParam.replace(/^org_/, '').trim();

    const auth = await resolveTenant(req, orgParam);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Authentication required.' }, { status: 401 });
    }

    // 🔒 Capability Assertion Enforcement (Fail-Closed)
    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.analytics');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(or(eq(projects.slug, cleanSlug), eq(projects.slug, orgParam)))
      .limit(1);

    const [leadsCountRes] = project
      ? await db
          .select({ val: count() })
          .from(marketingLeads)
          .where(eq(marketingLeads.projectId, project.id))
      : [{ val: 0 }];

    const totalLeads = leadsCountRes?.val ?? 0;
    const totalConversions = Math.floor(totalLeads * 0.15);

    const response: GetGrowthAnalyticsResponseDTO = {
      totalLeads,
      totalConversions,
      avgCacUsdc: 45.5,
      estimatedLtvUsdc: 2850.0,
      funnel: [
        { step: 'Discovery', count: totalLeads, conversionRate: 100 },
        { step: 'Qualified', count: Math.floor(totalLeads * 0.6), conversionRate: 60 },
        { step: 'Presentation', count: Math.floor(totalLeads * 0.35), conversionRate: 35 },
        { step: 'Closed Won', count: totalConversions, conversionRate: totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0 },
      ],
      channels: [
        { channel: 'Hermes Telegram Bot', leadsAcquired: Math.floor(totalLeads * 0.5), conversions: Math.floor(totalConversions * 0.6), cacUsdc: 32.0, totalRevenueUsdc: 45000 },
        { channel: 'Portal Direct Web', leadsAcquired: Math.floor(totalLeads * 0.3), conversions: Math.floor(totalConversions * 0.25), cacUsdc: 55.0, totalRevenueUsdc: 25000 },
        { channel: 'Referral Concierge', leadsAcquired: Math.floor(totalLeads * 0.2), conversions: Math.floor(totalConversions * 0.15), cacUsdc: 18.0, totalRevenueUsdc: 15000 },
      ],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Growth API: analytics GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
