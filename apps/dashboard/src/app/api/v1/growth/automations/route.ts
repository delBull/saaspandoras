/**
 * 🛰️ Growth OS API Boundary — Automations Service
 * /api/v1/growth/automations
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { eq, or } from "@saasfly/db-core";
import { getAuth } from '@saasfly/auth-sdk';
import { checkRateLimit, clientIpFromHeaders } from '@saasfly/hermes-core';
import { validatePortalSession } from '@saasfly/shared';
import { OrganizationSDK } from '@saasfly/shared';
import { SessionTokenService } from '@saasfly/hermes-core';
import { isWalletAuthorizedForTenant } from '@saasfly/hermes-core';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type { GetAutomationsResponseDTO, GrowthWorkflowRuleDTO } from '@saasfly/shared';

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
    const rl = checkRateLimit(`growth-automations-get:${ip}`, 60, 60_000);
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
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.automations');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    const workflows: GrowthWorkflowRuleDTO[] = [
      {
        id: 'wf_vip_lead_welcome',
        name: 'Auto-Disparo Email de Bienvenida VIP',
        triggerEvent: 'LEAD_QUALIFIED',
        actionType: 'SEND_EMAIL',
        status: 'ACTIVE',
        executionsCount: 84,
        lastExecutedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      },
      {
        id: 'wf_token_mint_intent',
        name: 'Notificación Hermes a Fundador ante Pago',
        triggerEvent: 'PAYMENT_RECEIVED',
        actionType: 'NOTIFY_HERMES',
        status: 'ACTIVE',
        executionsCount: 22,
        lastExecutedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
    ];

    const response: GetAutomationsResponseDTO = {
      workflows,
      activeCount: workflows.filter((w) => w.status === 'ACTIVE').length,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Growth API: automations GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
