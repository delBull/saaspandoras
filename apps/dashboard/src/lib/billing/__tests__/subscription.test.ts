import { describe, expect, it } from 'vitest';
import { computeSubscriptionReminderStage, computeSubscriptionState, monthlyFeeForProducts } from '../subscription';

const NOW = new Date('2026-11-12T12:00:00Z');
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

describe('fee mensual por producto (registry)', () => {
  it('Hermes en sandbox/trial cobra el tier de entrada', () => {
    const fee = monthlyFeeForProducts([{ product: 'HERMES', plan: 'sandbox' }]);
    expect(fee.totalUsd).toBe(299);
    expect(fee.lines[0]).toMatchObject({ product: 'HERMES', tier: 'starter', priceUsd: 299 });
  });

  it('Hermes en growth cobra 699', () => {
    expect(monthlyFeeForProducts([{ product: 'HERMES', plan: 'growth' }]).totalUsd).toBe(699);
  });

  it('suma varios productos instalados', () => {
    const fee = monthlyFeeForProducts([
      { product: 'HERMES', plan: 'starter' },
      { product: 'GROWTH_OS', plan: 'starter' },
    ]);
    expect(fee.totalUsd).toBe(548); // 299 + 249
    expect(fee.lines).toHaveLength(2);
  });

  it('enterprise se pacta (0 en tabla)', () => {
    expect(monthlyFeeForProducts([{ product: 'HERMES', plan: 'enterprise' }]).totalUsd).toBe(0);
  });

  it('producto desconocido no suma', () => {
    expect(monthlyFeeForProducts([{ product: 'NOPE', plan: 'starter' }]).totalUsd).toBe(0);
  });
});

describe('estado de la suscripción', () => {
  it('con periodo futuro → activo con días al cargo', () => {
    const state = computeSubscriptionState({ status: 'active', currentPeriodEnd: days(10) }, NOW);
    expect(state.status).toBe('active');
    expect(state.daysToCharge).toBe(10);
    expect(state.isReadOnly).toBe(false);
  });

  it('periodo vencido sin gracia → suspendido (solo lectura)', () => {
    const state = computeSubscriptionState({ status: 'active', currentPeriodEnd: days(-1) }, NOW);
    expect(state.status).toBe('suspended');
    expect(state.isReadOnly).toBe(true);
  });

  it('periodo vencido con gracia vigente → gracia', () => {
    const state = computeSubscriptionState(
      { status: 'grace', currentPeriodEnd: days(-2), graceEndsAt: days(5) },
      NOW
    );
    expect(state.status).toBe('grace');
    expect(state.graceDaysLeft).toBe(5);
    expect(state.isReadOnly).toBe(false);
  });

  it('gracia vencida → suspendido', () => {
    const state = computeSubscriptionState(
      { status: 'grace', currentPeriodEnd: days(-10), graceEndsAt: days(-1) },
      NOW
    );
    expect(state.status).toBe('suspended');
  });

  it('sin periodo configurado no suspende (datos incompletos no bloquean)', () => {
    const state = computeSubscriptionState({ status: 'active', currentPeriodEnd: null }, NOW);
    expect(state.status).toBe('active');
    expect(state.isReadOnly).toBe(false);
  });

  it('cancelado es solo lectura', () => {
    expect(computeSubscriptionState({ status: 'canceled' }, NOW).isReadOnly).toBe(true);
  });
});

describe('recordatorios de cobro', () => {
  it('3 días antes → D3', () => {
    expect(computeSubscriptionReminderStage(days(3), NOW)).toBe('D3');
    expect(computeSubscriptionReminderStage(new Date(NOW.getTime() + 2.6 * 86_400_000), NOW)).toBe('D3');
  });

  it('el último día (0 o vencido) → D0', () => {
    expect(computeSubscriptionReminderStage(days(0), NOW)).toBe('D0');
    expect(computeSubscriptionReminderStage(days(-1), NOW)).toBe('D0');
  });

  it('fuera de ventana no envía', () => {
    expect(computeSubscriptionReminderStage(days(5), NOW)).toBeNull();
    expect(computeSubscriptionReminderStage(days(2), NOW)).toBeNull();
  });

  it('sin periodo no envía', () => {
    expect(computeSubscriptionReminderStage(null, NOW)).toBeNull();
    expect(computeSubscriptionReminderStage('no-es-fecha', NOW)).toBeNull();
  });
});
