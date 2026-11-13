import { NextRequest, NextResponse } from 'next/server';
import { authorizeTenantCapability } from '@/lib/authorization/authorize-tenant-capability';
import {
  getCanonicalOrganizationResolver,
  getTenantGrantRepository,
} from '@/lib/authorization/service-factory';
import { resolveCrmRouteContext } from '@/lib/crm/route-context';
import { getOpportunityService } from '@/lib/crm/service-factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * GET /api/v1/crm/export.csv?organizationSlug=&from=&to=
 *
 * Exporta oportunidades del periodo. `closed_revenue_usd` va en columna propia:
 * la estimación NUNCA se presenta como ingreso.
 *
 * Capability: `crm.opportunity.read`.
 */
export async function GET(req: NextRequest) {
  if (process.env.P0_2_CRM_ENABLED !== 'true') {
    return NextResponse.json(
      { success: false, code: 'CRM_NOT_ENABLED', error: 'El CRM no está habilitado.' },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const ctx = await resolveCrmRouteContext(url.searchParams.get('organizationSlug'));
  if (!ctx.ok) return ctx.response;

  const auth = await authorizeTenantCapability({
    actor: { kind: 'human', subjectId: ctx.context.subjectId },
    requestedTenant: { canonicalOrgId: ctx.context.organizationId },
    capability: 'crm.opportunity.read',
    deps: {
      grants: getTenantGrantRepository(),
      organizations: getCanonicalOrganizationResolver(),
    },
  });

  if (!auth.allowed) {
    return NextResponse.json(
      { success: false, code: 'FORBIDDEN_TENANT_CAPABILITY', reason: auth.reason },
      { status: 403 },
    );
  }

  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const fromMs = from ? new Date(from).getTime() : null;
  const toMs = to ? new Date(to).getTime() : null;

  const opportunities = await getOpportunityService().listOpportunities({
    organizationId: ctx.context.organizationId,
    limit: 100,
    offset: 0,
  });

  const filtered = opportunities.filter((opportunity) => {
    const created = new Date(opportunity.createdAt).getTime();
    if (fromMs !== null && created < fromMs) return false;
    if (toMs !== null && created > toMs) return false;
    return true;
  });

  const header = [
    'id',
    'title',
    'stage',
    'owner',
    'source',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'estimated_value_usd',
    'closed_revenue_usd',
    'currency',
    'next_action',
    'next_action_at',
    'last_contact_at',
    'closed_at',
    'close_reason',
    'created_at',
  ].join(',');

  const rows = filtered.map((opportunity) =>
    [
      opportunity.id,
      opportunity.title,
      opportunity.stageKey,
      opportunity.ownerCollaboratorId,
      opportunity.source,
      opportunity.utmSource,
      opportunity.utmMedium,
      opportunity.utmCampaign,
      opportunity.estimatedValueUsd,
      opportunity.closedRevenueUsd,
      opportunity.currency,
      opportunity.nextAction,
      opportunity.nextActionAt,
      opportunity.lastContactAt,
      opportunity.closedAt,
      opportunity.closeReason,
      opportunity.createdAt,
    ]
      .map(csvCell)
      .join(','),
  );

  const csv = [header, ...rows].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="crm-${ctx.context.slug}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
