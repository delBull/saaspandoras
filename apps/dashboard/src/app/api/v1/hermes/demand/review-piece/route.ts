/**
 * 🛰️ Hermes API Boundary — Content Piece Review Endpoint
 * POST /api/v1/hermes/demand/review-piece
 *
 * Allows tenant to approve, edit copy/CTA, or reject individual ContentPieces
 * during the Content Review stage before general campaign distribution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveDemandSession } from '../route';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { DemandDistributionService } from '@/lib/hermes/demand/demand-distribution.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { campaignId, pieceId, action, feedback, tenantHint } = body;

    if (!campaignId || !pieceId || !action) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'Campos [campaignId, pieceId, action] son obligatorios.' },
        { status: 400 }
      );
    }

    if (!['APPROVE', 'REJECT', 'EDIT'].includes(action)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_ACTION', message: 'Acción debe ser APPROVE, REJECT o EDIT.' },
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

    // Capability check: demand.plan or demand.approve (Fail-closed)
    const hasPerm = await CapabilityGrantService.isCapabilityGranted(tenantId, 'demand.plan').catch(() => false);
    if (!hasPerm) {
      return NextResponse.json(
        { ok: false, error: 'CAPABILITY_DENIED', message: 'No tienes permisos para revisar piezas de contenido.' },
        { status: 403 }
      );
    }

    const updatedPiece = DemandDistributionService.reviewPiece(
      tenantId,
      campaignId,
      pieceId,
      action,
      feedback
    );

    return NextResponse.json({
      ok: true,
      tenantId,
      piece: updatedPiece,
    });
  } catch (err: any) {
    console.error('[Demand Review Piece API] Error:', err);
    return NextResponse.json(
      { ok: false, error: 'REVIEW_FAILED', message: err?.message || 'Error al revisar pieza de contenido' },
      { status: 500 }
    );
  }
}
