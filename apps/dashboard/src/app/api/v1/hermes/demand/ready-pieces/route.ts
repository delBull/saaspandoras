import { NextRequest, NextResponse } from 'next/server';
import { DemandDistributionService } from '@/lib/hermes/demand/demand-distribution.service';
import { resolveDemandSession } from '../route';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
export const dynamic = 'force-dynamic';

/**
 * 🚀 POST /api/v1/hermes/demand/ready-pieces
 *
 * Marks campaign pieces as READY once Sofia / Media Co delivers renders.
 * Fail-closed capability verification on demand.plan / demand.approve.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { campaignId, pieceId, asset, tenantHint } = body;

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'campaignId es requerido.' },
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

    // Fail-closed capability check
    const hasPerm = await CapabilityGrantService.isCapabilityGranted(tenantId, 'demand.plan').catch(() => false);
    if (!hasPerm) {
      return NextResponse.json(
        { ok: false, error: 'CAPABILITY_DENIED', message: 'No tienes permisos [demand.plan] para actualizar estado de piezas.' },
        { status: 403 }
      );
    }

    if (pieceId) {
      const updatedPiece = DemandDistributionService.notifyPieceContentReady(
        tenantId,
        campaignId,
        pieceId,
        asset
      );
      return NextResponse.json({ ok: true, piece: updatedPiece });
    } else {
      const updatedCampaign = DemandDistributionService.readyAllPieces(tenantId, campaignId);
      return NextResponse.json({ ok: true, campaign: updatedCampaign });
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR', message: err.message || 'Error al actualizar piezas.' },
      { status: 500 }
    );
  }
}
