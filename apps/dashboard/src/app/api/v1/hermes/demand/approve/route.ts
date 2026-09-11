/**
 * 🛰️ Hermes API Boundary — Demand Approve & Distribute Endpoint
 * POST /api/v1/hermes/demand/approve
 *
 * Enforces:
 * 1. Server-side session resolution.
 * 2. Mandatory Capability checks for 'demand.approve' and 'demand.distribute'.
 * 3. Idempotent execution (duplicate calls do not re-dispatch A2A).
 * 4. Dispatch to Sofia / Media Co via A2A Outbound Protocol.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveDemandSession } from '../route';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { DemandDistributionService } from '@/lib/hermes/demand/demand-distribution.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { campaignId, idempotencyKey, tenantHint } = body;

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'El campo [campaignId] es obligatorio.' },
        { status: 400 }
      );
    }

    const auth = await resolveDemandSession(req, tenantHint);
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHENTICATED', message: 'Sesión no autorizada o cross-tenant spoofing detectado.' },
        { status: 401 }
      );
    }

    const tenantId = auth.projectSlug;

    // Capability check: demand.approve & demand.distribute (Fail-closed)
    const canApprove = await CapabilityGrantService.isCapabilityGranted(tenantId, 'demand.approve').catch(() => false);
    const canDistribute = await CapabilityGrantService.isCapabilityGranted(tenantId, 'demand.distribute').catch(() => false);

    if (!canApprove || !canDistribute) {
      return NextResponse.json(
        {
          ok: false,
          error: 'CAPABILITY_DENIED',
          message: 'No posees las capabilities requeridas [demand.approve, demand.distribute] para autorizar el despacho.',
        },
        { status: 403 }
      );
    }

    const result = await DemandDistributionService.approveAndDistribute(
      tenantId,
      campaignId,
      idempotencyKey
    );

    // Sanitize user-facing error to prevent infrastructure leakage (§4 and §9.D)
    const userFacingError = result.error
      ? (result.error.includes('en generación')
          ? result.error
          : result.error.includes('taild7a2e2') || result.error.includes('SOFIA_') || result.error.includes('signature')
          ? 'No pudimos distribuir esta campaña en este momento. Media Co rechazó la operación o el servicio no está disponible.'
          : result.error)
      : undefined;

    return NextResponse.json({
      ok: result.success,
      tenantId,
      campaign: result.campaign,
      dispatchedChannels: result.dispatchedChannels,
      failedChannels: result.failedChannels,
      isIdempotentReplay: result.isIdempotentReplay || false,
      error: userFacingError,
    });
  } catch (err: any) {
    console.error('[Demand Approve API] Internal infrastructure error:', err);
    return NextResponse.json(
      { ok: false, error: 'DISTRIBUTION_FAILED', message: 'No se pudo procesar la distribución en este momento. Inténtalo más tarde.' },
      { status: 500 }
    );
  }
}
