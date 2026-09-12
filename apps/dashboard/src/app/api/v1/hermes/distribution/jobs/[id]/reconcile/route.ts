/**
 * ⚖️ Hermes Forensic Distribution Reconciliation API (FASE 4)
 * apps/dashboard/src/app/api/v1/hermes/distribution/jobs/[id]/reconcile/route.ts
 *
 * POST /api/v1/hermes/distribution/jobs/[id]/reconcile
 *
 * MANDATORY INVARIANTS:
 * 1. Strictly authenticated server-side (resolveDemandSession -> canonicalOrgId).
 * 2. Requires 'demand.distribute' capability grant.
 * 3. ZERO CLIENT-SUPPLIED RESOLUTION: the client cannot dictate the resolution;
 *    Hermes queries the authoritative Sofia daemon status or external provider.
 * 4. Categorical transitions (Rule F4-2):
 *    - PROVEN_EXECUTED -> PUBLISHED
 *    - PROVEN_NOT_EXECUTED -> FAILED (safe retry authorized)
 *    - UNRESOLVED -> REMAINS UNKNOWN (NOT_FOUND != FAILED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveDemandSession } from '@/app/api/v1/hermes/demand/route';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { distributionOrchestratorService } from '@/lib/hermes/channels/distribution/distribution-orchestrator.service';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await resolveDemandSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 });
    }

    const hasDistributeAccess = await CapabilityGrantService.isCapabilityGranted(
      session.projectSlug,
      'demand.distribute'
    );
    if (!hasDistributeAccess) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Tenant missing 'demand.distribute' capability." },
        { status: 403 }
      );
    }

    // Invariant: Client-supplied payload is ignored for resolution determination
    const result = await distributionOrchestratorService.reconcileUnknownJob(
      session.canonicalOrgId,
      id
    );

    return NextResponse.json({
      ok: result.reconciled,
      jobId: id,
      status: result.status,
      receipt: result.receipt,
      reason: result.reason,
    });
  } catch (err: any) {
    console.error('[Distribution Reconciliation API] Error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Forensic reconciliation failed.' },
      { status: 400 }
    );
  }
}
