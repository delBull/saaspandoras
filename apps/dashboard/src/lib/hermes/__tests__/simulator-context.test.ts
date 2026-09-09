import { describe, it, expect } from 'vitest';
import { resolveSafeDemoContext } from '../simulator-types';

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
