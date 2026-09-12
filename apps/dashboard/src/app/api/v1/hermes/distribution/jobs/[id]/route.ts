/**
 * 📡 Hermes Distribution Job Detail & Dispatch API (FASE 3)
 * apps/dashboard/src/app/api/v1/hermes/distribution/jobs/[id]/route.ts
 *
 * GET  /api/v1/hermes/distribution/jobs/[id]
 * POST /api/v1/hermes/distribution/jobs/[id] (dispatch / retry)
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveDemandSession } from '@/app/api/v1/hermes/demand/route';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { distributionOrchestratorService } from '@/lib/hermes/channels/distribution/distribution-orchestrator.service';
import { db } from '@/db';
import { distributionJobs, distributionExecutionAttempts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await resolveDemandSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 });
    }

    const job = await db.query.distributionJobs.findFirst({
      where: and(
        eq(distributionJobs.id, id),
        eq(distributionJobs.tenantId, session.canonicalOrgId)
      ),
    });

    if (!job) {
      return NextResponse.json({ ok: false, error: 'Distribution job not found.' }, { status: 404 });
    }

    const attempts = await db.query.distributionExecutionAttempts.findMany({
      where: and(
        eq(distributionExecutionAttempts.jobId, id),
        eq(distributionExecutionAttempts.tenantId, session.canonicalOrgId)
      ),
      orderBy: (t, { asc }) => [asc(t.attemptNumber)],
    });

    return NextResponse.json({
      ok: true,
      job,
      attempts,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch job details.' }, { status: 500 });
  }
}

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

    const receipt = await distributionOrchestratorService.dispatchJob(
      session.canonicalOrgId,
      id
    );

    return NextResponse.json({
      ok: receipt.success,
      receipt,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Dispatch failed.' }, { status: 400 });
  }
}
