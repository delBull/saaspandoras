/**
 * 🛰️ Growth OS API Boundary — Pipeline & CRM Service
 * /api/v1/growth/pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeads, projects } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { isWalletAuthorizedForTenant } from '@/lib/hermes/auth/wallet-tenant-membership';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type { GetPipelineResponseDTO, TenantLeadDTO, LeadStage } from '@/lib/dash-contracts/growth';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

async function resolveTenant(req: NextRequest, requestedOrg?: string | null): Promise<{
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

  // 3. Bearer Token
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
    const rl = checkRateLimit(`growth-pipeline-get:${ip}`, 60, 60_000);
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
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.crm');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(or(eq(projects.slug, cleanSlug), eq(projects.slug, orgParam)))
      .limit(1);

    const projectLeads = project
      ? await db
          .select()
          .from(marketingLeads)
          .where(eq(marketingLeads.projectId, project.id))
          .limit(100)
      : [];

    const mappedLeads: TenantLeadDTO[] = projectLeads.map((l, index) => {
      const statusStr = String(l.status);
      const stage: LeadStage = 
        statusStr === 'converted' ? 'CLOSED_WON' :
        statusStr === 'scheduled' || statusStr === 'hot' ? 'PRESENTATION' :
        statusStr === 'whitelisted' || statusStr === 'nurturing' ? 'QUALIFIED' :
        statusStr === 'cancelled' || statusStr === 'bounced' ? 'CLOSED_LOST' : 'DISCOVERY';

      return {
        id: String(l.id || `lead_${index}`),
        name: l.name || l.email || `Prospecto #${index + 1}`,
        email: l.email || undefined,
        phone: l.phoneNumber || undefined,
        stage,
        source: l.source || 'Hermes Web',
        score: l.score || 70,
        tags: ['VIP', 'Inversor'],
        estimatedValue: Number(l.conversionValue || 5000),
        lastInteractionAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    });

    const STAGES: LeadStage[] = ['DISCOVERY', 'QUALIFIED', 'PRESENTATION', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    const stagesSummary = STAGES.map((s) => {
      const matching = mappedLeads.filter((l) => l.stage === s);
      const totalValue = matching.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
      return {
        id: s,
        label: s.replace('_', ' '),
        count: matching.length,
        totalValue,
      };
    });

    const response: GetPipelineResponseDTO = {
      leads: mappedLeads,
      stages: stagesSummary,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Growth API: pipeline GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
