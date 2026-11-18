import { describe, expect, it } from 'vitest';
import { computeTrialReminderStage, TRIAL_DURATION_DAYS } from '../tenant-notifications';

const NOW = new Date('2026-11-12T12:00:00Z');
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 3600_000);

describe('periodo de gracia (7 días)', () => {
  it('la duración es 7 días', () => {
    expect(TRIAL_DURATION_DAYS).toBe(7);
  });

  it('día 5 (≈2 días restantes) → D5', () => {
    expect(computeTrialReminderStage(hoursFromNow(47), NOW)).toEqual({ daysLeft: 2, stage: 'D5' });
  });

  it('día 6 (≈1 día restante) → D6', () => {
    expect(computeTrialReminderStage(hoursFromNow(23), NOW)).toEqual({ daysLeft: 1, stage: 'D6' });
  });

  it('último día (≤12h o ya vencido) → D7', () => {
    expect(computeTrialReminderStage(hoursFromNow(2), NOW).stage).toBe('D7');
    expect(computeTrialReminderStage(hoursFromNow(-1), NOW).stage).toBe('D7');
  });

  it('fuera de ventana no genera aviso', () => {
    expect(computeTrialReminderStage(hoursFromNow(60), NOW).stage).toBeNull(); // día 4
    expect(computeTrialReminderStage(hoursFromNow(120), NOW).stage).toBeNull(); // día 2
  });

  it('sin fecha válida no avisa', () => {
    expect(computeTrialReminderStage(null, NOW)).toEqual({ daysLeft: null, stage: null });
    expect(computeTrialReminderStage('no-es-fecha', NOW)).toEqual({ daysLeft: null, stage: null });
  });
});
