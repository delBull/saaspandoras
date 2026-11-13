import { NextRequest, NextResponse } from 'next/server';
import { authorizeTenantCapability } from '@/lib/authorization/authorize-tenant-capability';
import {
  getCanonicalOrganizationResolver,
  getTenantGrantRepository,
} from '@/lib/authorization/service-factory';
import { CrmError } from '@/lib/crm/opportunity-service';
import { getOpportunityService } from '@/lib/crm/service-factory';
import {
  CRM_DISABLED_RESPONSE,
  isCrmEnabled,
  resolveCrmRouteContext,
  type CrmRouteContext,
} from '@/lib/crm/route-context';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function authorize(
  context: CrmRouteContext,
  capability: 'crm.opportunity.read' | 'crm.opportunity.write' | 'crm.opportunity.reassign',
) {
  return authorizeTenantCapability({
    actor: { kind: 'human', subjectId: context.subjectId },
    requestedTenant: { canonicalOrgId: context.organizationId },
    capability,
    deps: {
      grants: getTenantGrantRepository(),
      organizations: getCanonicalOrganizationResolver(),
    },
  });
}

/** GET /api/v1/crm/opportunities/:id?organizationSlug= — incluye historial. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isCrmEnabled()) {
    return NextResponse.json({ success: false, ...CRM_DISABLED_RESPONSE }, { status: 503 });
  }

  const { id } = await params;
  const ctx = await resolveCrmRouteContext(
    new URL(req.url).searchParams.get('organizationSlug'),
  );
  if (!ctx.ok) return ctx.response;

  const auth = await authorize(ctx.context, 'crm.opportunity.read');
  if (!auth.allowed) {
    return NextResponse.json(
      { success: false, code: 'FORBIDDEN_TENANT_CAPABILITY', reason: auth.reason },
      { status: 403 },
    );
  }

  try {
    const result = await getOpportunityService().getOpportunity({
      organizationId: ctx.context.organizationId,
      opportunityId: id,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof CrmError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error('[CRM] GET /opportunities/:id failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/crm/opportunities/:id
 *
 * Body:
 *  - { organizationSlug, stageKey, nextAction?, nextActionAt?, closeReason?, closedRevenueUsd? }
 *      ⇒ `crm.opportunity.write`
 *  - { organizationSlug, ownerCollaboratorId, reason? }
 *      ⇒ `crm.opportunity.reassign` (puede quedar pendiente de aprobación)
 *
 * El origen (source/UTM) es inmutable: se rechaza con 403 ORIGIN_IMMUTABLE.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isCrmEnabled()) {
    return NextResponse.json({ success: false, ...CRM_DISABLED_RESPONSE }, { status: 503 });
  }

  const { id } = await params;
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

  const svc = getOpportunityService();

  // Origen inmutable: se evalúa ANTES de cualquier efecto.
  try {
    svc.assertOriginImmutable(body);
  } catch (error) {
    if (error instanceof CrmError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    throw error;
  }

  const isReassignment =
    typeof body.ownerCollaboratorId === 'string' && body.ownerCollaboratorId.length > 0;
  const isStageChange = typeof body.stageKey === 'string' && body.stageKey.length > 0;

  if (!isReassignment && !isStageChange) {
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION',
        error: 'Debe indicar stageKey (etapa) u ownerCollaboratorId (reasignación).',
      },
      { status: 422 },
    );
  }

  try {
    if (isReassignment) {
      const auth = await authorize(ctx.context, 'crm.opportunity.reassign');
      if (!auth.allowed) {
        return NextResponse.json(
          { success: false, code: 'FORBIDDEN_TENANT_CAPABILITY', reason: auth.reason },
          { status: 403 },
        );
      }

      const result = await svc.reassignOwner({
        organizationId: ctx.context.organizationId,
        opportunityId: id,
        actorId: ctx.context.subjectId,
        newOwnerCollaboratorId: body.ownerCollaboratorId as string,
        reason: typeof body.reason === 'string' ? body.reason : null,
      });

      return NextResponse.json({
        success: true,
        applied: result.applied,
        decision: result.decision,
        reason: result.reason ?? null,
        requestId: result.requestId ?? null,
        opportunity: result.opportunity,
      });
    }

    const auth = await authorize(ctx.context, 'crm.opportunity.write');
    if (!auth.allowed) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN_TENANT_CAPABILITY', reason: auth.reason },
        { status: 403 },
      );
    }

    const result = await svc.transitionStage({
      organizationId: ctx.context.organizationId,
      opportunityId: id,
      actorId: ctx.context.subjectId,
      input: {
        stageKey: body.stageKey as string,
        nextAction: typeof body.nextAction === 'string' ? body.nextAction : undefined,
        nextActionAt: typeof body.nextActionAt === 'string' ? body.nextActionAt : undefined,
        closeReason: typeof body.closeReason === 'string' ? body.closeReason : undefined,
        closedRevenueUsd:
          typeof body.closedRevenueUsd === 'number' ? body.closedRevenueUsd : undefined,
        note: typeof body.note === 'string' ? body.note : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      opportunity: result.opportunity,
      activity: result.activity,
      notes: ['closedRevenueUsd es el único valor que cuenta como ingreso.'],
    });
  } catch (error: unknown) {
    if (error instanceof CrmError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error('[CRM] PATCH /opportunities/:id failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}
