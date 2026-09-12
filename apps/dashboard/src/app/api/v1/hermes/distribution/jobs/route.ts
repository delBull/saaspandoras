/**
 * 📡 Hermes Distribution Jobs API (FASE 3)
 * apps/dashboard/src/app/api/v1/hermes/distribution/jobs/route.ts
 *
 * GET  /api/v1/hermes/distribution/jobs
 * POST /api/v1/hermes/distribution/jobs
 *
 * Enforces:
 * 1. Authority derived exclusively from authenticated server session (canonicalOrgId).
 * 2. Requires 'demand.distribute' capability.
 * 3. Durable, database-enforced idempotency on creation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveDemandSession } from '@/app/api/v1/hermes/demand/route';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { distributionOrchestratorService } from '@/lib/hermes/channels/distribution/distribution-orchestrator.service';
import { db } from '@/db';
import { distributionJobs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await resolveDemandSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 });
    }

    const hasViewAccess = await CapabilityGrantService.isCapabilityGranted(
      session.projectSlug,
      'demand.view'
    );
    if (!hasViewAccess) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Tenant missing 'demand.view' capability." },
        { status: 403 }
      );
    }

    const jobs = await db.query.distributionJobs.findMany({
      where: eq(distributionJobs.tenantId, session.canonicalOrgId),
      orderBy: [desc(distributionJobs.createdAt)],
      limit: 50,
    });

    return NextResponse.json({
      ok: true,
      count: jobs.length,
      jobs,
    });
  } catch (err: any) {
    console.error('[Distribution Jobs API] GET error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to list jobs.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json().catch(() => ({}));
    const { campaignId, pieceId, channel, integrationId, idempotencyKey, payload, autoDispatch } = body;

    if (!campaignId || !pieceId || !channel || !idempotencyKey || !payload) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: campaignId, pieceId, channel, idempotencyKey, payload.' },
        { status: 400 }
      );
    }

    const { job, isNew } = await distributionOrchestratorService.createOrGetJob(
      session.canonicalOrgId,
      {
        campaignId,
        pieceId,
        channel,
        integrationId,
        idempotencyKey,
        payload,
      }
    );

    let receipt = job.receipt;
    if (autoDispatch && job.status !== 'PUBLISHED') {
      receipt = await distributionOrchestratorService.dispatchJob(
        session.canonicalOrgId,
        job.id
      );
    }

    return NextResponse.json(
      {
        ok: true,
        isNew,
        job,
        receipt,
      },
      { status: isNew ? 201 : 200 }
    );
  } catch (err: any) {
    console.error('[Distribution Jobs API] POST error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to create job.' }, { status: 400 });
  }
}
