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
} from '@/lib/crm/route-context';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function crmErrorStatus(error: CrmError): number {
  return error.status;
}

/**
 * GET /api/v1/crm/opportunities?organizationSlug=&stage=&owner=&limit=&offset=
 * Capability: `crm.opportunity.read`
 */
export async function GET(req: NextRequest) {
  if (!isCrmEnabled()) {
    return NextResponse.json({ success: false, ...CRM_DISABLED_RESPONSE }, { status: 503 });
  }

  const url = new URL(req.url);
  const ctx = await resolveCrmRouteContext(url.searchParams.get('organizationSlug'));
  if (!ctx.ok) return ctx.response;

  const auth = await authorizeTenantCapability({
    actor: { kind: 'human', subjectId: ctx.context.subjectId },
    requestedTenant: { canonicalOrgId: ctx.context.organizationId },
    capability: 'crm.opportunity.read',
    deps: { grants: getTenantGrantRepository(), organizations: getCanonicalOrganizationResolver() },
  });

  if (!auth.allowed) {
    return NextResponse.json(
      { success: false, code: 'FORBIDDEN_TENANT_CAPABILITY', reason: auth.reason },
      { status: 403 },
    );
  }

  try {
    const opportunities = await getOpportunityService().listOpportunities({
      organizationId: ctx.context.organizationId,
      stageKey: url.searchParams.get('stage') ?? undefined,
      ownerCollaboratorId: url.searchParams.get('owner') ?? undefined,
      limit: Number(url.searchParams.get('limit') ?? '25'),
      offset: Number(url.searchParams.get('offset') ?? '0'),
    });

    return NextResponse.json({ success: true, opportunities });
  } catch (error: unknown) {
    if (error instanceof CrmError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: crmErrorStatus(error) },
      );
    }
    console.error('[CRM] GET /opportunities failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}

/**
 * POST /api/v1/crm/opportunities
 * Capability: `crm.opportunity.write`
 * Body: { organizationSlug, title, ownerCollaboratorId, estimatedValueUsd, source, leadId?, utm*? }
 */
export async function POST(req: NextRequest) {
  if (!isCrmEnabled()) {
    return NextResponse.json({ success: false, ...CRM_DISABLED_RESPONSE }, { status: 503 });
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

  const auth = await authorizeTenantCapability({
    actor: { kind: 'human', subjectId: ctx.context.subjectId },
    requestedTenant: { canonicalOrgId: ctx.context.organizationId },
    capability: 'crm.opportunity.write',
    deps: { grants: getTenantGrantRepository(), organizations: getCanonicalOrganizationResolver() },
  });

  if (!auth.allowed) {
    return NextResponse.json(
      { success: false, code: 'FORBIDDEN_TENANT_CAPABILITY', reason: auth.reason },
      { status: 403 },
    );
  }

  try {
    const result = await getOpportunityService().createOpportunity({
      organizationId: ctx.context.organizationId,
      projectId: ctx.context.projectId,
      actorId: ctx.context.subjectId,
      input: {
        title: typeof body.title === 'string' ? body.title : '',
        ownerCollaboratorId:
          typeof body.ownerCollaboratorId === 'string' ? body.ownerCollaboratorId : '',
        estimatedValueUsd: Number(body.estimatedValueUsd ?? NaN),
        source: body.source as never,
        currency: typeof body.currency === 'string' ? body.currency : undefined,
        leadId: typeof body.leadId === 'string' ? body.leadId : null,
        clientId: typeof body.clientId === 'string' ? body.clientId : null,
        utmSource: typeof body.utmSource === 'string' ? body.utmSource : null,
        utmMedium: typeof body.utmMedium === 'string' ? body.utmMedium : null,
        utmCampaign: typeof body.utmCampaign === 'string' ? body.utmCampaign : null,
        nextAction: typeof body.nextAction === 'string' ? body.nextAction : null,
        nextActionAt: typeof body.nextActionAt === 'string' ? body.nextActionAt : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        opportunity: result.opportunity,
        activities: result.activities,
        notes: [
          'estimatedValueUsd es una ESTIMACIÓN; no cuenta como ingreso.',
          'El origen (source/UTM) queda bloqueado desde la creación.',
        ],
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof CrmError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: crmErrorStatus(error) },
      );
    }
    console.error('[CRM] POST /opportunities failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}
