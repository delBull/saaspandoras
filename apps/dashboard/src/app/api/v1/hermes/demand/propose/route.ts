/**
 * 🛰️ Hermes API Boundary — Demand Propose Endpoint
 * POST /api/v1/hermes/demand/propose
 *
 * Enforces:
 * 1. Server-side session resolution.
 * 2. Capability check for 'demand.plan'.
 * 3. Proposes campaign according to selected commercial objective.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveDemandSession } from '../route';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import {
  DemandDistributionService,
  DemandObjective,
} from '@/lib/hermes/demand/demand-distribution.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { objective = 'GENERATE_LEADS', tenantHint } = body;

    const auth = await resolveDemandSession(req, tenantHint);
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHENTICATED', message: 'Sesión no autorizada o cross-tenant spoofing detectado.' },
        { status: 401 }
      );
    }

    const tenantId = auth.projectSlug;

    // Capability check: demand.plan (Fail-closed)
    const hasPlanCap = await CapabilityGrantService.isCapabilityGranted(tenantId, 'demand.plan').catch(() => false);
    if (!hasPlanCap) {
      return NextResponse.json(
        { ok: false, error: 'CAPABILITY_DENIED', message: 'No tienes la capacidad [demand.plan] autorizada.' },
        { status: 403 }
      );
    }

    const campaign = await DemandDistributionService.proposeCampaign(tenantId, objective as DemandObjective);

    return NextResponse.json({
      ok: true,
      tenantId,
      campaign,
    });
  } catch (err: any) {
    console.error('[Demand Propose API] Error:', err);
    return NextResponse.json(
      { ok: false, error: 'PROPOSAL_FAILED', message: err?.message || 'Error al proponer campaña' },
      { status: 500 }
    );
  }
}
