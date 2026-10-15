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
import { validatePortalSession } from '@saasfly/shared';
import { OrganizationSDK } from '@saasfly/shared';
import { SessionTokenService } from '@saasfly/hermes-core';
import { TenantAuthorityService } from '@saasfly/hermes-core';
import { CapabilityGrantService } from '@saasfly/hermes-core';
import {
  DemandDistributionService,
  DEMAND_OBJECTIVES,
} from '@saasfly/hermes-core';
import { TenantCreditLedgerService } from '@saasfly/hermes-core';
import { checkTenantRateLimit, buildRateLimitHeaders } from '@saasfly/hermes-core';
import { enforceA2AEnvironment } from '@/lib/integrations/a2a-env';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

export async function resolveDemandSession(req: NextRequest, clientTenantHint?: string): Promise<{
  canonicalOrgId: string;
  projectSlug: string;
  actorId?: string;
  environment?: 'staging' | 'production';
} | null> {
  let tenantIdentifier: string | null = null;
  let resolvedActorId: string | undefined = undefined;
  let resolvedEnvironment: 'staging' | 'production' | undefined = undefined;

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

  // 2. Bearer token fallback (Supports both Hermes SessionTokens and Developer Integration API Keys)
  if (!tenantIdentifier) {
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (bearer) {
      if (bearer.startsWith('sk_')) {
        try {
          const { IntegrationKeyService } = await import('@/lib/integrations/auth');
          const client = await IntegrationKeyService.validateKey(bearer);
          if (client && client.projectId) {
            // H2: Check API key permissions for Demand/A2A operations (Strict Fail-Closed)
            const permissions = Array.isArray(client.permissions) ? (client.permissions as string[]) : [];
            const hasA2APermission = 
              permissions.includes('hermes_a2a') || 
              permissions.includes('demand:manage') || 
              permissions.includes('demand.distribute') ||
              permissions.includes('*');

            if (!hasA2APermission) {
              console.warn('[Demand API] Integration key missing required permissions:', permissions);
              return null;
            }

            tenantIdentifier = String(client.projectId);
            resolvedActorId = `integration_client:${client.id}`;
            resolvedEnvironment = client.environment as 'staging' | 'production';
          }
        } catch (keyErr) {
          console.warn('[Demand API] Failed to validate integration API key:', keyErr);
          return null;
        }
      } else if (bearer.startsWith('pk_')) {
        // H1: Reject public keys for demand & operational mutations
        console.warn('[Demand API] Rejected public key pk_ for operational endpoint.');
        return null;
      } else {
        try {
          const payload = sessionTokenService.verifyToken(bearer);
          tenantIdentifier = payload.organizationId;
        } catch {
          return null;
        }
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
    actorId: resolvedActorId,
    environment: resolvedEnvironment,
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

    // H5: Environment allowlist enforcement (integration-key sessions).
    const envCheck = enforceA2AEnvironment(req, auth.environment);
    if (!envCheck.ok) {
      return NextResponse.json({ ok: false, error: envCheck.error }, { status: envCheck.status });
    }

    // H5: Tenant-scoped rate limiting (anti-abuse).
    const rl = checkTenantRateLimit(auth.canonicalOrgId, 60, 60_000);
    const rlHeaders = buildRateLimitHeaders(rl);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Límite de solicitudes por minuto excedido para este tenant.', retryAfter: rl.retryAfterSeconds },
        { status: 429, headers: rlHeaders }
      );
    }

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
