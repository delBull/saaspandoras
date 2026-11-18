import { NextRequest, NextResponse } from 'next/server';
import { authorizeTenantCapability } from '@/lib/authorization/authorize-tenant-capability';
import {
  getCanonicalOrganizationResolver,
  getTenantGrantRepository,
} from '@/lib/authorization/service-factory';
import { resolveCrmRouteContext } from '@/lib/crm/route-context';
import { DrizzleReportingSource } from '@/lib/reporting/drizzle-reporting-source';
import { buildWeeklyReport, isReportValid } from '@/lib/reporting/report-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REPORTING_ENABLED_ENV = 'P0_4_REPORTING_ENABLED';

/**
 * GET /api/v1/reporting/weekly?organizationSlug=&weekOf=<ISO>&attributionWindowDays=
 *
 * Capability: `reporting.report.read`.
 *
 * Regla: lo que falta es `unavailable`, nunca 0. El reporte se marca inválido si
 * alguna regla de reconciliación falla.
 */
export async function GET(req: NextRequest) {
  if (process.env[REPORTING_ENABLED_ENV] !== 'true') {
    return NextResponse.json(
      {
        success: false,
        code: 'REPORTING_NOT_ENABLED',
        error:
          'El reporting (P0.4) no está habilitado: falta aplicar la migración 0098 y activar P0_4_REPORTING_ENABLED.',
      },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const ctx = await resolveCrmRouteContext(url.searchParams.get('organizationSlug'));
  if (!ctx.ok) return ctx.response;

  const auth = await authorizeTenantCapability({
    actor: { kind: 'human', subjectId: ctx.context.subjectId },
    requestedTenant: { canonicalOrgId: ctx.context.organizationId },
    capability: 'reporting.report.read',
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

  const weekOfRaw = url.searchParams.get('weekOf');
  const weekOf = weekOfRaw ? new Date(weekOfRaw) : new Date();
  if (Number.isNaN(weekOf.getTime())) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION', error: 'weekOf debe ser una fecha ISO válida.' },
      { status: 422 },
    );
  }

  const attributionWindowDaysRaw = Number(url.searchParams.get('attributionWindowDays') ?? '90');
  const attributionWindowDays =
    Number.isInteger(attributionWindowDaysRaw) && attributionWindowDaysRaw > 0
      ? attributionWindowDaysRaw
      : 90;

  try {
    const report = await buildWeeklyReport({
      clientId: ctx.context.slug,
      reference: weekOf,
      source: new DrizzleReportingSource(ctx.context.organizationId, ctx.context.projectId),
      attributionWindowDays,
    });

    return NextResponse.json({
      success: true,
      report,
      valid: isReportValid(report),
      notes: [
        'Los valores faltantes se reportan como unavailable, nunca como 0.',
        'closed_revenue es ingreso efectivo; revenue_estimated es solo una estimación.',
        'El CPL solo se calcula con gasto comprobado y leads atribuibles.',
      ],
    });
  } catch (error: unknown) {
    console.error('[Reporting] GET /weekly failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal reporting error.',
      },
      { status: 500 },
    );
  }
}
