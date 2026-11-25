import { describe, it, expect } from 'vitest';
import {
  formatHours,
  formatRate,
  medianHours,
  summarizeDecisions,
  topReasons,
  type DecisionRow,
} from '../approval-history';

function row(overrides: Partial<DecisionRow>): DecisionRow {
  return {
    status: 'APPROVED',
    createdAt: new Date('2026-11-25T08:00:00.000Z'),
    resolvedAt: new Date('2026-11-25T10:00:00.000Z'),
    reason: null,
    ...overrides,
  };
}

describe('Historial · resumen', () => {
  it('cuenta aprobadas y rechazadas, con tasa de aprobación', () => {
    const summary = summarizeDecisions([
      row({ status: 'APPROVED' }),
      row({ status: 'APPROVED' }),
      row({ status: 'REJECTED', reason: 'no menciones precios' }),
    ]);

    expect(summary.total).toBe(3);
    expect(summary.approved).toBe(2);
    expect(summary.rejected).toBe(1);
    expect(summary.approvalRate).toBeCloseTo(0.666, 2);
  });

  it('sin decisiones la tasa es null, no cero', () => {
    const summary = summarizeDecisions([]);
    expect(summary.total).toBe(0);
    expect(summary.approvalRate).toBeNull();
    expect(summary.medianHours).toBeNull();
  });

  it('la mediana de tiempo usa sólo filas con ambas fechas', () => {
    expect(medianHours([])).toBeNull();
    expect(medianHours([row({}), row({ resolvedAt: null })])).toBe(2);
    expect(
      medianHours([
        row({ resolvedAt: new Date('2026-11-25T09:00:00.000Z') }), // 1h
        row({ resolvedAt: new Date('2026-11-25T13:00:00.000Z') }), // 5h
        row({ resolvedAt: new Date('2026-11-26T08:00:00.000Z') }), // 24h
      ]),
    ).toBe(5);
  });

  it('con número par de decisiones promedia los dos valores centrales', () => {
    expect(
      medianHours([
        row({ resolvedAt: new Date('2026-11-25T09:00:00.000Z') }), // 1h
        row({ resolvedAt: new Date('2026-11-25T10:00:00.000Z') }), // 2h
        row({ resolvedAt: new Date('2026-11-25T11:00:00.000Z') }), // 3h
        row({ resolvedAt: new Date('2026-11-25T18:00:00.000Z') }), // 10h
      ]),
    ).toBe(2.5);
  });
});

describe('Historial · motivos de rechazo', () => {
  it('agrupa motivos equivalentes sin perder el texto original', () => {
    const reasons = topReasons([
      row({ status: 'REJECTED', reason: 'No menciones precios' }),
      row({ status: 'REJECTED', reason: '  no menciones   precios ' }),
      row({ status: 'REJECTED', reason: 'falta el enlace' }),
      row({ status: 'APPROVED', reason: 'ignorado' }),
    ]);

    expect(reasons).toHaveLength(2);
    expect(reasons[0]).toEqual({ reason: 'No menciones precios', count: 2 });
    expect(reasons[1]).toEqual({ reason: 'falta el enlace', count: 1 });
  });

  it('ignora motivos vacíos y recorta los largos', () => {
    const long = 'x'.repeat(200);
    const reasons = topReasons([
      row({ status: 'REJECTED', reason: '   ' }),
      row({ status: 'REJECTED', reason: long }),
    ]);

    expect(reasons).toHaveLength(1);
    expect(reasons[0]!.reason.length).toBeLessThanOrEqual(90);
  });
});

describe('Historial · formato', () => {
  it('formatea tasa y horas', () => {
    expect(formatRate(null)).toBe('—');
    expect(formatRate(0.5)).toBe('50%');
    expect(formatHours(null)).toBe('—');
    expect(formatHours(2.34)).toBe('2.34 h');
    expect(formatHours(52)).toBe('2 d 4 h');
    expect(formatHours(48)).toBe('2 d');
  });
});
