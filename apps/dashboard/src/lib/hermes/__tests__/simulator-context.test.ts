import { describe, it, expect } from 'vitest';
import { resolveSafeDemoContext, buildSandboxTrace } from '../simulator-types';

describe('⚡ Hermes Simulator Context & Sanitizer', () => {
  it('Resolves clean defaults when parameters are empty', () => {
    const ctx = resolveSafeDemoContext({});
    expect(ctx.company).toBe('Tu Negocio');
    expect(ctx.industry).toBe('general');
    expect(ctx.goal).toBe('QUALIFY_LEADS');
    expect(ctx.attributionRep).toBeUndefined();
    expect(ctx.source).toBe('landing');
  });

  it('Sanitizes valid parameters properly', () => {
    const ctx = resolveSafeDemoContext({
      company: 'Grupo Altius Inmobiliaria',
      industry: 'real_estate',
      goal: 'BOOK_APPOINTMENTS',
      rep: 'marco_sales',
      source: 'whatsapp',
    });
    expect(ctx.company).toBe('Grupo Altius Inmobiliaria');
    expect(ctx.industry).toBe('real_estate');
    expect(ctx.goal).toBe('BOOK_APPOINTMENTS');
    expect(ctx.attributionRep).toBe('marco_sales');
    expect(ctx.source).toBe('whatsapp');
  });

  it('Rejects invalid industry/goal and falls back safely to closed enum defaults', () => {
    const ctx = resolveSafeDemoContext({
      company: 'Hacker Inc <script>alert(1)</script>',
      industry: 'crypto_ponzi_exploit' as any,
      goal: 'MALICIOUS_PROMPT_INJECTION' as any,
      rep: 'rep$#@!evil_admin_grant',
    });

    expect(ctx.company).toBe('Hacker Inc scriptalert1script');
    expect(ctx.industry).toBe('general');
    expect(ctx.goal).toBe('QUALIFY_LEADS');
    expect(ctx.attributionRep).toBe('repevil_admin_grant');
  });
});

describe('⚙️ Hermes OS Engine Trace Builder', () => {
  const base = {
    company: 'Altius',
    industry: 'real_estate' as const,
  };

  it('Builds the full 5-layer pipeline plus execution action (6 steps)', () => {
    const trace = buildSandboxTrace({ ...base, intent: null, message: '¿Qué son? cuéntame más' });
    expect(trace.steps).toHaveLength(6);
    expect(trace.steps.map((s) => s.id)).toEqual([
      'inbound',
      'authority',
      'intent',
      'knowledge',
      'governance',
      'action',
    ]);
    expect(trace.action).toBe('RESPOND');
  });

  it('Maps a purchase intent to AUTONOMOUS_CLOSE (self-closing outdoors sales)', () => {
    const trace = buildSandboxTrace({
      ...base,
      intent: { type: 'HIGH_PRIORITY_PURCHASE', label: 'Compra', confidence: '94%' },
      message: '¿Cuál es el precio final?',
    });
    expect(trace.action).toBe('AUTONOMOUS_CLOSE');
    expect(trace.actionLabel).toContain('link de pago');
  });

  it('Maps an appointment request to BOOK_APPOINTMENT', () => {
    const trace = buildSandboxTrace({
      ...base,
      intent: { type: 'APPOINTMENT_REQUEST', label: 'Cita', confidence: '91%' },
      message: 'Quiero agendar una visita',
    });
    expect(trace.action).toBe('BOOK_APPOINTMENT');
    expect(trace.actionLabel).toContain('Agenda conectada');
  });

  it('Escalates to a human when the prospect asks for one (HITL)', () => {
    const trace = buildSandboxTrace({
      ...base,
      intent: null,
      message: 'Quiero hablar con un humano, por favor',
    });
    expect(trace.action).toBe('ESCALATE_TO_HUMAN');
    expect(trace.actionLabel).toContain('tu equipo');
  });

  it('Keeps responding & qualifying for neutral chatter with no commercial signal', () => {
    const trace = buildSandboxTrace({
      ...base,
      intent: null,
      message: 'Hola, ¿cómo están?',
    });
    expect(trace.action).toBe('RESPOND');
    const intentStep = trace.steps.find((s) => s.id === 'intent')!;
    expect(intentStep.detail).toContain('Intención aún no comercial');
  });
});
