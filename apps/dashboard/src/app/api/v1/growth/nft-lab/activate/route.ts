/**
 * 🔧 POST /api/v1/growth/nft-lab/activate
 *
 * Admin-only endpoint to activate the NFT_LAB product for a tenant.
 * Calls NftLabActivationService.activate() — idempotent.
 *
 * Auth: requires a valid admin session (Pandoras admin, not tenant).
 * The authorizedBy identity is resolved server-side from the session.
 *
 * Body:
 *   organizationId: string  (tenant slug or org_id)
 *   plan: 'sandbox' | 'starter' | 'growth' | 'enterprise'
 *
 * The tenant CANNOT call this endpoint — it's admin-gated.
 * Tenant-facing activation request goes through commercial flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, clientIpFromHeaders } from '@saasfly/hermes-core';
import { NftLabActivationService } from '@saasfly/nexus-deals-sdk';
import type { PlanKey } from '@saasfly/shared';

export const runtime = 'nodejs';

import { getNexusAuthContext } from '@saasfly/shared';

const VALID_PLANS = new Set<PlanKey>(['sandbox', 'starter', 'growth', 'enterprise']);

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`nft-activate:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    // ── Admin gate — fail-closed ─────────────────────────────────────────
    const auth = await getNexusAuthContext();
    if (!auth.isAuthenticated || (!auth.permissions?.ecosystem && !auth.permissions?.['tenants.manage'])) {
      return NextResponse.json({ code: 'FORBIDDEN', message: 'Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { organizationId, plan, authorizedBy } = body;

    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'organizationId is required.' }, { status: 400 });
    }

    const resolvedPlan: PlanKey = VALID_PLANS.has(plan) ? plan : 'starter';

    // authorizedBy can be passed explicitly for audit trail, or defaults to 'pandoras_admin'
    // In both cases, it's logged for auditing
    const resolvedAuthorizedBy = (typeof authorizedBy === 'string' && authorizedBy.trim())
      ? authorizedBy.trim()
      : 'pandoras_admin';

    const result = await NftLabActivationService.activate({
      organizationId: organizationId.trim(),
      plan: resolvedPlan,
      authorizedBy: resolvedAuthorizedBy,
    });

    return NextResponse.json(result, { status: result.alreadyActive ? 200 : 201 });

  } catch (error: any) {
    console.error('[NFT Lab Activate] Error:', error?.message || error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error?.message }, { status: 500 });
  }
}
