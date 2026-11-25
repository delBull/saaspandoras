import { describe, it, expect } from 'vitest';
import { buildWeeklyPlan } from '../planner';

const lunes = new Date('2026-11-30T12:00:00.000Z');

describe('Plan semanal', () => {
  it('propone como máximo 3 piezas, una por red', () => {
    const plan = buildWeeklyPlan({ tenantId: 'snarai', now: lunes, hasAssets: true });
    expect(plan.items.length).toBeLessThanOrEqual(3);
    const platforms = plan.items.map((i) => i.platform);
    expect(new Set(platforms).size).toBe(platforms.length);
    expect(plan.weekStart).toBe('2026-11-30');
  });

  it('si hay preguntas abiertas, la primera pieza las responde', () => {
    const plan = buildWeeklyPlan({ tenantId: 'snarai', now: lunes, openQuestions: 4, hasAssets: true });
    expect(plan.items[0]!.angle).toBe('respuesta');
    expect(plan.items[0]!.channel).toBe('s-narai-preguntas');
    expect(plan.items[0]!.title).toContain('4');
  });

  it('sin assets, avisa que Instagram no se publica todavía', () => {
    const plan = buildWeeklyPlan({ tenantId: 'snarai', now: lunes, hasAssets: false });
    expect(plan.items.some((i) => i.platform === 'instagram')).toBe(true);
    expect(plan.notes.join(' ')).toContain('Sin assets reales');
  });

  it('no duplica canales con propuesta pendiente', () => {
    const plan = buildWeeklyPlan({
      tenantId: 'snarai',
      now: lunes,
      hasAssets: true,
      pendingChannels: ['s-narai-anuncios'],
    });
    expect(plan.items.some((i) => i.channel === 's-narai-anuncios')).toBe(false);
    expect(plan.notes.join(' ')).toContain('pendiente');
  });

  it('evita el ángulo de obra si ya se rechazó por eso', () => {
    const plan = buildWeeklyPlan({
      tenantId: 'snarai',
      now: lunes,
      hasAssets: true,
      repeatedRejectionReasons: ['no hay avance de obra verificable'],
    });
    expect(plan.items.some((i) => i.angle === 'obra')).toBe(false);
  });

  it('un tenant nuevo usa su slug en los canales', () => {
    const plan = buildWeeklyPlan({ tenantId: 'coffree', now: lunes, hasAssets: true });
    const discord = plan.items.find((i) => i.platform === 'discord');
    expect(discord?.channel.startsWith('coffree-')).toBe(true);
  });
});
