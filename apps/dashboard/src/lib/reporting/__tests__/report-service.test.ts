/**
 * 🧪 TESTS: P0.4 — Reporte semanal.
 *
 * La regla que más se prueba: lo que falta es `unavailable`, NUNCA 0.
 * Incluye CPL (solo con gasto e insumos comprobados), separación estimado/cerrado,
 * zona horaria de negocio y reconciliación.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { buildWeeklyReport, isReportValid, RULE_VERSION } from '../report-service';
import { MemoryReportingSource } from '../memory-source';
import { BUSINESS_TIMEZONE, weekRangeFor } from '../period';

const REFERENCE = new Date('2026-11-11T18:00:00.000Z'); // miércoles

describe('P0.4 — reporte semanal', () => {
  let source: MemoryReportingSource;

  beforeEach(() => {
    source = new MemoryReportingSource();
  });

  function build(overrides: { attributionWindowDays?: number } = {}) {
    return buildWeeklyReport({
      clientId: 'celeste',
      reference: REFERENCE,
      source,
      now: () => '2026-11-13T12:00:00.000Z',
      ...overrides,
    });
  }

  it('RP-01: sin gasto registrado ⇒ ad_spend_actual y cpl `unavailable` (no 0)', async () => {
    const report = await build();

    expect(report.metrics['ad_spend_actual']!.status).toBe('unavailable');
    expect(report.metrics['ad_spend_actual']!.value).toBeNull();
    expect(report.metrics['cpl']!.status).toBe('unavailable');
    expect(report.metrics['cpl']!.value).toBeNull();
    expect(report.metrics['cpl']!.reason).toContain('gasto');
  });

  it('RP-02: gasto registrado pero 0 leads atribuibles ⇒ cpl `unavailable`', async () => {
    source.stubs.adSpendActual = { status: 'ok', value: { amountUsd: 2000, entryIds: ['sp_1'] } };
    source.stubs.attributableLeads = { status: 'ok', value: 0 };

    const report = await build();

    expect(report.metrics['ad_spend_actual']!.value).toBe(2000);
    expect(report.metrics['cpl']!.status).toBe('unavailable');
    expect(report.metrics['cpl']!.reason).toContain('cero leads');
  });

  it('RP-03: gasto + leads atribuibles comprobados ⇒ CPL calculado y trazable', async () => {
    source.stubs.adSpendActual = {
      status: 'ok',
      value: { amountUsd: 2000, entryIds: ['sp_1', 'sp_2'] },
    };
    source.stubs.attributableLeads = { status: 'ok', value: 40 };

    const report = await build();

    expect(report.metrics['cpl']!.status).toBe('ok');
    expect(report.metrics['cpl']!.value).toBe(50);
    expect(report.metrics['cpl']!.sourceIds).toEqual(['sp_1', 'sp_2']);
    expect(report.metrics['cpl']!.period.timezone).toBe(BUSINESS_TIMEZONE);
    expect(report.metrics['cpl']!.attributionWindowDays).toBe(90);
  });

  it('RP-04: presupuesto asignado ≠ gasto real; el presupuesto NUNCA se usa para CPL', async () => {
    source.stubs.adBudgetAssigned = { status: 'ok', value: 3000 };
    source.stubs.adSpendActual = { status: 'unavailable', reason: 'Sin factura registrada.' };
    source.stubs.attributableLeads = { status: 'ok', value: 40 };

    const report = await build();

    expect(report.metrics['ad_budget_assigned']!.value).toBe(3000);
    expect(report.metrics['ad_spend_actual']!.status).toBe('unavailable');
    expect(report.metrics['cpl']!.status).toBe('unavailable');
  });

  it('RP-05: estimación y cierre se reportan por separado', async () => {
    source.stubs.revenue = {
      status: 'ok',
      value: { estimatedUsd: 310000, closedUsd: 150000, wonOpportunityIds: ['opp_1'] },
    };

    const report = await build();

    expect(report.metrics['revenue_estimated']!.value).toBe(310000);
    expect(report.metrics['closed_revenue']!.value).toBe(150000);
    expect(report.metrics['closed_revenue']!.sourceIds).toEqual(['opp_1']);
    expect(report.metrics['closed_revenue']!.value).not.toBe(
      report.metrics['revenue_estimated']!.value,
    );
  });

  it('RP-06: visitas sin confirmar ⇒ `partial` con motivo', async () => {
    source.stubs.visitsCompleted = {
      status: 'partial',
      value: 3,
      missing: 'Dos visitas sin confirmación de Celeste.',
    };

    const report = await build();

    expect(report.metrics['visits_completed']!.status).toBe('partial');
    expect(report.metrics['visits_completed']!.value).toBe(3);
    expect(report.metrics['visits_completed']!.reason).toContain('sin confirmación');
  });

  it('RP-07: la frontera de semana respeta America/Mexico_City', () => {
    // Domingo 23:30 hora local (lunes 05:30 UTC).
    const sundayLateLocal = new Date('2026-11-16T05:30:00.000Z');
    const range = weekRangeFor(sundayLateLocal);

    // Debe pertenecer a la semana que empezó el lunes 9 de noviembre local.
    expect(range.fromUtc).toBe('2026-11-09T06:00:00.000Z');
    expect(range.toUtc).toBe('2026-11-16T05:59:59.999Z');

    // Un lunes 00:30 local cae en la semana nueva.
    const mondayEarly = new Date('2026-11-16T06:30:00.000Z');
    expect(weekRangeFor(mondayEarly).fromUtc).toBe('2026-11-16T06:00:00.000Z');
  });

  it('RP-08: fallo de consulta en leads ⇒ `unavailable` (nunca 0)', async () => {
    source.stubs.leadsCaptured = { status: 'unavailable', reason: 'DB timeout' };

    const report = await build();

    expect(report.metrics['leads_captured']!.status).toBe('unavailable');
    expect(report.metrics['leads_captured']!.value).toBeNull();
    expect(report.metrics['leads_captured']!.reason).toBe('DB timeout');
  });

  it('RP-09: leads captados y válidos son métricas distintas', async () => {
    source.stubs.leadsCaptured = { status: 'ok', value: 120 };
    source.stubs.leadsValid = { status: 'partial', value: 96, missing: '24 sin consentimiento.' };

    const report = await build();

    expect(report.metrics['leads_captured']!.value).toBe(120);
    expect(report.metrics['leads_valid']!.value).toBe(96);
    expect(report.metrics['leads_valid']!.status).toBe('partial');
  });

  it('RP-11: reconciliación inconsistente invalida el reporte', async () => {
    source.stubs.visitsCompleted = { status: 'ok', value: 5 };
    source.stubs.discoveryRequests = { status: 'ok', value: 2 };

    const report = await build();

    expect(report.reconciliation.some((rule) => rule.status === 'inconsistent')).toBe(true);
    expect(isReportValid(report)).toBe(false);
  });

  it('RP-12: mismo periodo e insumos ⇒ mismo hash (reproducible)', async () => {
    source.stubs.leadsCaptured = { status: 'ok', value: 10 };
    source.stubs.opportunitiesCreated = { status: 'ok', value: 4 };

    const first = await build();
    const second = await build();

    expect(first.inputsHash).toBe(second.inputsHash);
    expect(first.weekStart).toBe(second.weekStart);
    expect(first.metrics['leads_captured']!.source.ruleVersion).toBe(RULE_VERSION);
  });

  it('RP-13: cada métrica declara fuente, periodo y zona horaria', async () => {
    const report = await build();

    for (const metric of Object.values(report.metrics)) {
      expect(metric.source.table.length).toBeGreaterThan(0);
      expect(metric.source.ruleVersion).toBe(RULE_VERSION);
      expect(metric.period.timezone).toBe(BUSINESS_TIMEZONE);
      expect(metric.period.from).toBe(report.weekStart);
      expect(metric.period.to).toBe(report.weekEnd);
    }
  });

  it('RP-14: el CPL no se calcula con gasto parcial (y el motivo lo distingue)', async () => {
    source.stubs.adSpendActual = {
      status: 'partial',
      value: { amountUsd: 1500, entryIds: ['sp_1'] },
      missing: 'Falta la factura de Google.',
    };
    source.stubs.attributableLeads = { status: 'ok', value: 30 };

    const report = await build();

    expect(report.metrics['cpl']!.status).toBe('unavailable');
    expect(report.metrics['cpl']!.value).toBeNull();
    expect(report.metrics['cpl']!.reason).toContain('incompleto');
  });
});
