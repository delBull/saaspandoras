import { NextRequest, NextResponse } from 'next/server';
import { authorizeTenantCapability } from '@/lib/authorization/authorize-tenant-capability';
import {
  getCanonicalOrganizationResolver,
  getTenantGrantRepository,
} from '@/lib/authorization/service-factory';
import {
  applyReassignmentDecision,
  ReassignmentApplicationError,
} from '@/lib/crm/reassignment-application';
import { getCrmRepository, getReassignmentRequests } from '@/lib/crm/service-factory';
import {
  CRM_DISABLED_RESPONSE,
  isCrmEnabled,
  resolveCrmRouteContext,
} from '@/lib/crm/route-context';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v1/crm/approvals/:requestId
 *
 * Resuelve una solicitud de reasignación pendiente.
 *
 * Capability: `governance.approval.review` (autoridad de gobierno, no de escritura
 * comercial). El solicitante NO puede resolver su propia solicitud, y el
 * propietario de la oportunidad solo cambia si la aprobación es efectiva.
 *
 * Body: { organizationSlug, decision: 'approved' | 'rejected', note? }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  if (!isCrmEnabled()) {
    return NextResponse.json({ success: false, ...CRM_DISABLED_RESPONSE }, { status: 503 });
  }

  const { requestId } = await params;
  if (!requestId) {
    return NextResponse.json({ success: false, error: 'Missing requestId.' }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const ctx = await resolveCrmRouteContext(
    typeof body.organizationSlug === 'string' ? body.organizationSlug : null,
  );
  if (!ctx.ok) return ctx.response;

  const decision = typeof body.decision === 'string' ? body.decision.trim().toLowerCase() : '';
  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json(
      { success: false, code: 'VALIDATION', error: "decision debe ser 'approved' o 'rejected'." },
      { status: 422 },
    );
  }

  const auth = await authorizeTenantCapability({
    actor: { kind: 'human', subjectId: ctx.context.subjectId },
    requestedTenant: { canonicalOrgId: ctx.context.organizationId },
    capability: 'governance.approval.review',
    deps: {
      grants: getTenantGrantRepository(),
      organizations: getCanonicalOrganizationResolver(),
    },
  });

  if (!auth.allowed) {
    return NextResponse.json(
      {
        success: false,
        code: 'FORBIDDEN_TENANT_CAPABILITY',
        reason: auth.reason,
        error: `Se requiere 'governance.approval.review' (${auth.reason}).`,
      },
      { status: 403 },
    );
  }

  try {
    const result = await applyReassignmentDecision({
      requests: getReassignmentRequests(),
      repository: getCrmRepository(),
      organizationId: ctx.context.organizationId,
      requestId,
      deciderId: ctx.context.subjectId,
      decision,
      note: typeof body.note === 'string' ? body.note : null,
      nowSeconds: Math.floor(Date.now() / 1000),
      clock: () => new Date().toISOString(),
      newId: () => crypto.randomUUID(),
    });

    return NextResponse.json({
      success: true,
      decision: result.decision,
      applied: result.applied,
      opportunityId: result.opportunityId,
      ownerTo: result.ownerTo,
      opportunity: result.opportunity,
      notes: [
        'El propietario cambia solo con aprobación efectiva.',
        'La actividad `assignment` queda registrada con dueño previo y nuevo.',
      ],
    });
  } catch (error: unknown) {
    if (error instanceof ReassignmentApplicationError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error('[CRM] POST /approvals/:id failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}
