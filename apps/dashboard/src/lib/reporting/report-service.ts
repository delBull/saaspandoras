/**
 * P0.4 — Servicio de reporte semanal.
 *
 * Regla central: **lo que falta se reporta como `unavailable`, nunca como 0**.
 *
 * Cada métrica declara:
 *  - unidad y estado (`ok` | `partial` | `unavailable` | `inconsistent`)
 *  - fuente (tabla y, si aplica, campo) + `ruleVersion`
 *  - periodo (UTC), zona horaria y ventana de atribución
 *  - trazabilidad (`sourceIds` o hash de la muestra)
 *
 * CPL solo se calcula con gasto COMPROBADO y leads ATRIBUIBLES.
 * Ingreso = `closedRevenueUsd`; la estimación va en campo aparte.
 */

import { weekRangeFor, type PeriodRange } from './period';

export type MetricStatus = 'ok' | 'partial' | 'unavailable' | 'inconsistent';
export type MetricUnit = 'count' | 'usd' | 'ratio';

export const RULE_VERSION = 'p0.4.0';

export type SourceResult<T> =
  | { status: 'ok'; value: T; sourceIds?: string[] }
  | { status: 'partial'; value: T; missing: string; sourceIds?: string[] }
  | { status: 'unavailable'; reason: string };

export interface Metric {
  key: string;
  value: number | null;
  unit: MetricUnit;
  status: MetricStatus;
  reason?: string;
  source: { table: string; field?: string; ruleVersion: string };
  period: { from: string; to: string; timezone: string };
  attributionWindowDays?: number;
  sourceIds?: string[];
}

export interface ReportingDataSource {
  leadsCaptured(range: PeriodRange): Promise<SourceResult<number>>;
  leadsValid(range: PeriodRange): Promise<SourceResult<number>>;
  opportunitiesCreated(range: PeriodRange): Promise<SourceResult<number>>;
  opportunitiesQualified(range: PeriodRange): Promise<SourceResult<number>>;
  discoveryRequests(range: PeriodRange): Promise<SourceResult<number>>;
  visitsCompleted(range: PeriodRange): Promise<SourceResult<number>>;
  adSpendActual(range: PeriodRange): Promise<SourceResult<{ amountUsd: number; entryIds: string[] }>>;
  adBudgetAssigned(range: PeriodRange): Promise<SourceResult<number>>;
  revenue(range: PeriodRange): Promise<
    SourceResult<{ estimatedUsd: number; closedUsd: number; wonOpportunityIds: string[] }>
  >;
  /** Leads con atribución comprobada (para CPL). */
  attributableLeads(range: PeriodRange): Promise<SourceResult<number>>;
}

export interface ReconciliationRule {
  rule: string;
  status: MetricStatus;
  detail?: string;
}

export interface WeeklyReport {
  clientId: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  timezone: string;
  attributionWindowDays: number;
  metrics: Record<string, Metric>;
  reconciliation: ReconciliationRule[];
  /** Hash de los insumos para reproducibilidad. */
  inputsHash: string;
}

export interface BuildWeeklyReportParams {
  clientId: string;
  reference: Date;
  source: ReportingDataSource;
  attributionWindowDays?: number;
  timezone?: string;
  now?: () => string;
}

function toMetric(params: {
  key: string;
  unit: MetricUnit;
  result: SourceResult<number>;
  table: string;
  field?: string;
  range: PeriodRange;
  attributionWindowDays?: number;
}): Metric {
  const period = { from: params.range.fromUtc, to: params.range.toUtc, timezone: params.range.timezone };

  if (params.result.status === 'unavailable') {
    return {
      key: params.key,
      value: null,
      unit: params.unit,
      status: 'unavailable',
      reason: params.result.reason,
      source: { table: params.table, field: params.field, ruleVersion: RULE_VERSION },
      period,
      attributionWindowDays: params.attributionWindowDays,
    };
  }

  return {
    key: params.key,
    value: params.result.value,
    unit: params.unit,
    status: params.result.status === 'partial' ? 'partial' : 'ok',
    reason: params.result.status === 'partial' ? params.result.missing : undefined,
    source: { table: params.table, field: params.field, ruleVersion: RULE_VERSION },
    period,
    attributionWindowDays: params.attributionWindowDays,
    sourceIds: params.result.sourceIds,
  };
}

/** Hash determinista de los insumos (sin criptografía de seguridad). */
function hashInputs(parts: Array<string | number | null>): string {
  const payload = parts.map((part) => String(part ?? 'null')).join('|');
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a_${(hash >>> 0).toString(16)}`;
}

export async function buildWeeklyReport(params: BuildWeeklyReportParams): Promise<WeeklyReport> {
  const attributionWindowDays = params.attributionWindowDays ?? 90;
  const range = weekRangeFor(params.reference, params.timezone);

  const [
    leadsCaptured,
    leadsValid,
    opportunitiesCreated,
    opportunitiesQualified,
    discoveryRequests,
    visitsCompleted,
    adSpend,
    adBudget,
    revenue,
    attributableLeads,
  ] = await Promise.all([
    params.source.leadsCaptured(range),
    params.source.leadsValid(range),
    params.source.opportunitiesCreated(range),
    params.source.opportunitiesQualified(range),
    params.source.discoveryRequests(range),
    params.source.visitsCompleted(range),
    params.source.adSpendActual(range),
    params.source.adBudgetAssigned(range),
    params.source.revenue(range),
    params.source.attributableLeads(range),
  ]);

  const metrics: Record<string, Metric> = {};

  metrics['leads_captured'] = toMetric({
    key: 'leads_captured',
    unit: 'count',
    result: leadsCaptured,
    table: 'marketing_leads',
    field: 'created_at',
    range,
  });

  metrics['leads_valid'] = toMetric({
    key: 'leads_valid',
    unit: 'count',
    result: leadsValid,
    table: 'marketing_leads',
    field: 'consent+contact',
    range,
  });

  metrics['opportunities_created'] = toMetric({
    key: 'opportunities_created',
    unit: 'count',
    result: opportunitiesCreated,
    table: 'crm_opportunities',
    field: 'created_at',
    range,
  });

  metrics['opportunities_qualified'] = toMetric({
    key: 'opportunities_qualified',
    unit: 'count',
    result: opportunitiesQualified,
    table: 'crm_opportunities',
    field: 'stage_key',
    range,
  });

  metrics['discovery_requests'] = toMetric({
    key: 'discovery_requests',
    unit: 'count',
    result: discoveryRequests,
    table: 'crm_opportunities',
    field: 'stage_key',
    range,
  });

  metrics['visits_completed'] = toMetric({
    key: 'visits_completed',
    unit: 'count',
    result: visitsCompleted,
    table: 'crm_activities',
    field: 'type=visit',
    range,
  });

  metrics['ad_budget_assigned'] = toMetric({
    key: 'ad_budget_assigned',
    unit: 'usd',
    result: adBudget,
    table: 'ad_budget_assignments',
    field: 'amount_usd',
    range,
  });

  if (adSpend.status === 'unavailable') {
    metrics['ad_spend_actual'] = {
      key: 'ad_spend_actual',
      value: null,
      unit: 'usd',
      status: 'unavailable',
      reason: adSpend.reason,
      source: { table: 'ad_spend_entries', field: 'amount_usd', ruleVersion: RULE_VERSION },
      period: { from: range.fromUtc, to: range.toUtc, timezone: range.timezone },
    };
  } else {
    metrics['ad_spend_actual'] = {
      key: 'ad_spend_actual',
      value: adSpend.value.amountUsd,
      unit: 'usd',
      status: adSpend.status === 'partial' ? 'partial' : 'ok',
      reason: adSpend.status === 'partial' ? adSpend.missing : undefined,
      source: { table: 'ad_spend_entries', field: 'amount_usd', ruleVersion: RULE_VERSION },
      period: { from: range.fromUtc, to: range.toUtc, timezone: range.timezone },
      sourceIds: adSpend.value.entryIds,
    };
  }

  // ── CPL: solo con gasto comprobado Y leads atribuibles ────────────────────
  const spendOk = adSpend.status === 'ok';
  const attributableOk = attributableLeads.status === 'ok';

  if (!spendOk || !attributableOk) {
    const reasons: string[] = [];
    if (adSpend.status === 'partial') reasons.push('gasto publicitario incompleto');
    else if (!spendOk) reasons.push('gasto publicitario no comprobado');
    if (!attributableOk) reasons.push('leads atribuibles no comprobados');
    metrics['cpl'] = {
      key: 'cpl',
      value: null,
      unit: 'usd',
      status: 'unavailable',
      reason: `No calculable: ${reasons.join(' y ')}.`,
      source: { table: 'ad_spend_entries+attribution', ruleVersion: RULE_VERSION },
      period: { from: range.fromUtc, to: range.toUtc, timezone: range.timezone },
      attributionWindowDays,
    };
  } else if (attributableLeads.value === 0) {
    metrics['cpl'] = {
      key: 'cpl',
      value: null,
      unit: 'usd',
      status: 'unavailable',
      reason: 'No calculable: cero leads atribuibles en el periodo.',
      source: { table: 'ad_spend_entries+attribution', ruleVersion: RULE_VERSION },
      period: { from: range.fromUtc, to: range.toUtc, timezone: range.timezone },
      attributionWindowDays,
    };
  } else {
    const spend = (adSpend as Extract<typeof adSpend, { status: 'ok' }>).value.amountUsd;
    metrics['cpl'] = {
      key: 'cpl',
      value: Math.round((spend / attributableLeads.value) * 100) / 100,
      unit: 'usd',
      status: 'ok',
      source: { table: 'ad_spend_entries+attribution', ruleVersion: RULE_VERSION },
      period: { from: range.fromUtc, to: range.toUtc, timezone: range.timezone },
      attributionWindowDays,
      sourceIds: (adSpend as Extract<typeof adSpend, { status: 'ok' }>).value.entryIds,
    };
  }

  // ── Ingresos: estimado vs cerrado (NUNCA se mezclan) ──────────────────────
  if (revenue.status === 'unavailable') {
    for (const key of ['revenue_estimated', 'closed_revenue']) {
      metrics[key] = {
        key,
        value: null,
        unit: 'usd',
        status: 'unavailable',
        reason: revenue.reason,
        source: { table: 'crm_opportunities', field: 'estimated_value_usd|closed_revenue_usd', ruleVersion: RULE_VERSION },
        period: { from: range.fromUtc, to: range.toUtc, timezone: range.timezone },
      };
    }
  } else {
    metrics['revenue_estimated'] = {
      key: 'revenue_estimated',
      value: revenue.value.estimatedUsd,
      unit: 'usd',
      status: revenue.status === 'partial' ? 'partial' : 'ok',
      reason: revenue.status === 'partial' ? revenue.missing : undefined,
      source: { table: 'crm_opportunities', field: 'estimated_value_usd', ruleVersion: RULE_VERSION },
      period: { from: range.fromUtc, to: range.toUtc, timezone: range.timezone },
      attributionWindowDays,
    };
    metrics['closed_revenue'] = {
      key: 'closed_revenue',
      value: revenue.value.closedUsd,
      unit: 'usd',
      status: revenue.status === 'partial' ? 'partial' : 'ok',
      reason: revenue.status === 'partial' ? revenue.missing : undefined,
      source: { table: 'crm_opportunities', field: 'closed_revenue_usd', ruleVersion: RULE_VERSION },
      period: { from: range.fromUtc, to: range.toUtc, timezone: range.timezone },
      attributionWindowDays,
      sourceIds: revenue.value.wonOpportunityIds,
    };
  }

  const reconciliation = buildReconciliation({
    leadsCaptured,
    opportunitiesCreated,
    visitsCompleted,
    discoveryRequests,
  });

  const inputsHash = hashInputs([
    range.fromUtc,
    range.toUtc,
    leadsCaptured.status === 'unavailable' ? null : leadsCaptured.value,
    leadsValid.status === 'unavailable' ? null : leadsValid.value,
    opportunitiesCreated.status === 'unavailable' ? null : opportunitiesCreated.value,
    adSpend.status === 'unavailable' ? null : adSpend.value.amountUsd,
    attributableLeads.status === 'unavailable' ? null : attributableLeads.value,
    revenue.status === 'unavailable' ? null : revenue.value.closedUsd,
    RULE_VERSION,
  ]);

  return {
    clientId: params.clientId,
    weekStart: range.fromUtc,
    weekEnd: range.toUtc,
    generatedAt: params.now ? params.now() : new Date().toISOString(),
    timezone: range.timezone,
    attributionWindowDays,
    metrics,
    reconciliation,
    inputsHash,
  };
}

/**
 * Reglas de reconciliación. Si una no se puede evaluar por falta de datos, se
 * reporta `unavailable` (no se asume que cuadra).
 */
function buildReconciliation(input: {
  leadsCaptured: SourceResult<number>;
  opportunitiesCreated: SourceResult<number>;
  visitsCompleted: SourceResult<number>;
  discoveryRequests: SourceResult<number>;
}): ReconciliationRule[] {
  const rules: ReconciliationRule[] = [];

  if (input.leadsCaptured.status === 'unavailable' || input.opportunitiesCreated.status === 'unavailable') {
    rules.push({
      rule: 'opportunities ⊆ leads contactados',
      status: 'unavailable',
      detail: 'Faltan leads u oportunidades del periodo.',
    });
  } else {
    rules.push({
      rule: 'opportunities ⊆ leads contactados',
      status: 'ok',
      detail: `${input.opportunitiesCreated.value} oportunidades vs ${input.leadsCaptured.value} leads.`,
    });
  }

  if (input.visitsCompleted.status === 'unavailable' || input.discoveryRequests.status === 'unavailable') {
    rules.push({
      rule: 'visitas realizadas ≤ discovery solicitados',
      status: 'unavailable',
      detail: 'Faltan visitas o solicitudes del periodo.',
    });
  } else {
    rules.push({
      rule: 'visitas realizadas ≤ discovery solicitados',
      status:
        input.visitsCompleted.value <= input.discoveryRequests.value ? 'ok' : 'inconsistent',
      detail: `${input.visitsCompleted.value} visitas vs ${input.discoveryRequests.value} solicitudes.`,
    });
  }

  return rules;
}

/** El reporte solo es válido si ninguna regla de reconciliación falla. */
export function isReportValid(report: WeeklyReport): boolean {
  return report.reconciliation.every((rule) => rule.status !== 'inconsistent');
}
