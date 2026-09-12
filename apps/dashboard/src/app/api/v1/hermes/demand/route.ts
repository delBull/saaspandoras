/**
 * 🛰️ Hermes API Boundary — Demand & Distribution Endpoint
 * GET /api/v1/hermes/demand
 *
 * Enforces:
 * 1. Server-side session resolution (cookie or Bearer). ZERO reliance on unverified query params.
 * 2. Canonical tenant scope (K27.1).
 * 3. Server-side capability check for 'demand.view'.
 * 4. Aggregated canonical performance metrics with fail-to-'—'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { TenantAuthorityService } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import {
  DemandDistributionService,
  DEMAND_OBJECTIVES,
} from '@/lib/hermes/demand/demand-distribution.service';
import { TenantCreditLedgerService } from '@/lib/hermes/compute/tenant-credit-ledger.service';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

export async function resolveDemandSession(req: NextRequest, clientTenantHint?: string): Promise<{
  canonicalOrgId: string;
  projectSlug: string;
} | null> {
  let tenantIdentifier: string | null = null;

  // 1. Session cookie
  const cookie = req.cookies.get('pandoras_portal_session')?.value;
  if (cookie) {
    const session = await validatePortalSession(cookie);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        tenantIdentifier = org.slug || org.organizationId;
      }
    }
  }

  // 2. Bearer token fallback
  if (!tenantIdentifier) {
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (bearer) {
      try {
        const payload = sessionTokenService.verifyToken(bearer);
        tenantIdentifier = payload.organizationId;
      } catch {
        return null;
      }
    }
  }

  // 3. Fallback to header x-tenant-id if in development / test harness
  if (!tenantIdentifier && process.env.NODE_ENV === 'test') {
    tenantIdentifier = req.headers.get('x-tenant-id');
  }

  if (!tenantIdentifier) {
    return null;
  }

  const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantIdentifier);
  if (!canonical) return null;

  // Anti-spoofing check
  if (clientTenantHint) {
    const cleanHint = clientTenantHint.toLowerCase().replace(/^org_/, '').trim();
    if (
      cleanHint !== canonical.projectSlug.toLowerCase() &&
      cleanHint !== canonical.canonicalOrgId.toLowerCase()
    ) {
      console.warn(`[Demand API] Cross-tenant spoofing attempt rejected: session=${canonical.projectSlug}, hint=${clientTenantHint}`);
      return null;
    }
  }

  return {
    canonicalOrgId: canonical.canonicalOrgId,
    projectSlug: canonical.projectSlug,
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveDemandSession(req);
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHENTICATED', message: 'Se requiere sesión activa para consultar Demand & Distribution.' },
        { status: 401 }
      );
    }

    const tenantId = auth.projectSlug;

    // Capability check: demand.view (Fail-closed)
    const hasViewCap = await CapabilityGrantService.isCapabilityGranted(tenantId, 'demand.view').catch(() => false);
    if (!hasViewCap) {
      return NextResponse.json(
        { ok: false, error: 'CAPABILITY_DENIED', message: 'No tienes la capacidad [demand.view] autorizada.' },
        { status: 403 }
      );
    }

    // 1. Fetch channel matrix (dynamically intersected)
    const channels = await DemandDistributionService.getChannelMatrix(tenantId);

    // 2. Fetch active/proposed campaign
    let activeCampaign = DemandDistributionService.getActiveCampaign(tenantId);
    if (!activeCampaign) {
      // Create initial recommendation if none exists yet
      activeCampaign = await DemandDistributionService.proposeCampaign(tenantId, 'GENERATE_LEADS');
    }

    // 3. Fetch canonical performance metrics
    const performance = await DemandDistributionService.getCampaignPerformance(tenantId);

    // 4. Generate closed-loop strategic learning insight
    const insight = DemandDistributionService.getStrategicInsight(performance);

    // 5. Fetch durable tenant compute credits
    const tenantCredits = await TenantCreditLedgerService.getOrCreateCredits(tenantId).catch(() => null);

    return NextResponse.json({
      ok: true,
      tenantId,
      canonicalOrgId: auth.canonicalOrgId,
      objectives: Object.values(DEMAND_OBJECTIVES),
      activeCampaign,
      channels,
      performance,
      insight,
      tenantCredits,
    });
  } catch (err: any) {
    console.error('[Demand API GET] Error:', err);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'Error al obtener estado de demanda' },
      { status: 500 }
    );
  }
}
