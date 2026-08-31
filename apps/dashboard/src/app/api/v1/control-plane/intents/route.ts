/**
 * 🛰️ Control Plane API Boundary — Operational Intents Service
 * /api/v1/control-plane/intents
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { operationalIntents, operationalApprovals, projects, marketingLeads } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import type { GetPendingIntentsResponseDTO, OperationalIntentDTO } from '@/lib/dash-contracts/control-plane';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`cp-intents-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const orgParam = searchParams.get('organizationId') || '';
    const cleanSlug = orgParam.replace(/^org_/, '').trim();

    const auth = await getAuth();
    if (!auth.isVerified || !auth.session?.address) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Wallet authentication required.' }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(operationalIntents)
      .where(
        or(
          eq(operationalIntents.organizationId, orgParam),
          eq(operationalIntents.organizationId, `org_${cleanSlug}`),
          eq(operationalIntents.organizationId, cleanSlug)
        )
      )
      .orderBy(desc(operationalIntents.createdAt));

    const pendingIntents: OperationalIntentDTO[] = rows.map((r) => ({
      id: r.id,
      intentId: r.id,
      organizationId: r.organizationId,
      missionId: r.missionId,
      missionName: r.objective || 'Operational Intent Mission',
      strategyDecision: r.rationale || 'Autonomous Recommendation',
      reasonSummary: r.rationale || '',
      intentType: r.intentType,
      objective: r.objective,
      rationale: r.rationale || '',
      pack: r.packId || 'core_marketing_pack',
      budget: undefined,
      authorityRequired: 'Founder Approval',
      consequence: `Execution of ${r.intentType}`,
      status: (r.status === 'approved' ? 'APPROVED' : r.status === 'rejected' ? 'REJECTED' : 'PENDING') as any,
      riskScore: 10,
      decisionReason: null,
      createdAt: r.createdAt.toISOString(),
    }));

    const response: GetPendingIntentsResponseDTO = { pendingIntents };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/control-plane/intents GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch intents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`cp-intents-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await getAuth();
    if (!auth.isVerified || !auth.session?.address) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Wallet authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { action, organizationId, intentId, reason } = body;

    const cleanSlug = organizationId.replace(/^org_/, '').trim();
    const [project] = await db
      .select()
      .from(projects)
      .where(or(eq(projects.slug, cleanSlug), eq(projects.slug, organizationId)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Organization not found' }, { status: 404 });
    }

    if (action === 'SIMULATE') {
      const newIntentId = `oi_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
      const lead = await db.query.marketingLeads.findFirst({
        where: eq(marketingLeads.projectId, project.id),
      });

      await db.insert(operationalIntents).values({
        id: newIntentId,
        organizationId: `org_${cleanSlug}`,
        missionId: 'dev_test_mission_001',
        packId: 'core_marketing_pack',
        packVersion: '1.0.0',
        strategyDecisionId: 'sd_simulated_001',
        intentType: 'SEND_TELEGRAM_MESSAGE',
        objective: 'Re-engage lead ' + (lead?.name || 'Prospect'),
        rationale: 'El sistema detectó actividad relevante y propone contacto proactivo.',
        constraints: [],
        approvalPolicy: {},
        status: 'proposed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({ success: true, intentId: newIntentId });
    }

    if (action === 'APPROVE') {
      await db
        .update(operationalIntents)
        .set({
          status: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(operationalIntents.id, intentId));

      await db.insert(operationalApprovals).values({
        intentId,
        actorId: auth.session.address,
        decision: 'approved',
        reason: reason || 'Approved via control plane',
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'REJECT') {
      await db
        .update(operationalIntents)
        .set({
          status: 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(operationalIntents.id, intentId));

      await db.insert(operationalApprovals).values({
        intentId,
        actorId: auth.session.address,
        decision: 'rejected',
        reason: reason || 'Rejected via control plane',
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /api/v1/control-plane/intents POST] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to process intent action' }, { status: 500 });
  }
}
