import { describe, it, expect } from 'vitest';
import {
  resolveTenantExperienceContext,
  type ResolveExperienceInput,
} from '../tenant-experience-context';

describe('🧭 TenantExperienceContext (UX Presentation Layer)', () => {
  const baseInput: ResolveExperienceInput = {
    canonicalOrgId: '00000000-0000-0000-0000-000000000001',
    slug: 'acme-corp',
  };

  it('Defaults to COMMERCIAL_FIRST with Growth OS focus when no products or intent are given', () => {
    const context = resolveTenantExperienceContext(baseInput);

    expect(context.canonicalOrgId).toBe('00000000-0000-0000-0000-000000000001');
    expect(context.slug).toBe('acme-corp');
    expect(context.primaryGoal).toBe('REVENUE_GROWTH');
    expect(context.experienceMode).toBe('COMMERCIAL_FIRST');
    expect(context.heroTitle).toContain('Sistema Operativo Comercial');
    expect(context.rwaStatus).toBe('BACKSTAGE');
    expect(context.recommendedActions.some((a) => a.id === 'growth-pipeline-setup')).toBe(true);
  });

  it('Respects Explicit Intent over acquisition source and installed products', () => {
    const context = resolveTenantExperienceContext({
      ...baseInput,
      installedModules: ['GROWTH_OS'],
      acquisitionSource: 'google-rwa-campaign',
      explicitIntent: 'CONVERSATIONAL_SALES',
    });

    expect(context.primaryGoal).toBe('CONVERSATIONAL_SALES');
    expect(context.experienceMode).toBe('HERMES_CLOSER_FIRST');
    expect(context.heroTitle).toContain('Cerrador de Ventas');
  });

  it('Infers CONVERSATIONAL_SALES when acquisitionSource points to hermes/bot', () => {
    const context = resolveTenantExperienceContext({
      ...baseInput,
      acquisitionSource: 'telegram-hermes-ad',
    });

    expect(context.primaryGoal).toBe('CONVERSATIONAL_SALES');
    expect(context.experienceMode).toBe('HERMES_CLOSER_FIRST');
  });

  it('Keeps RWA BACKSTAGE when RWA is not installed, but marks ACTIVE when deployed', () => {
    const withoutRwa = resolveTenantExperienceContext(baseInput);
    expect(withoutRwa.rwaStatus).toBe('BACKSTAGE');
    expect(withoutRwa.recommendedExpansions.some((e) => e.productKey === 'PANDORAS_RWA')).toBe(true);

    const withRwa = resolveTenantExperienceContext({
      ...baseInput,
      hasContractDeployed: true,
    });
    expect(withRwa.rwaStatus).toBe('ACTIVE');
    expect(withRwa.recommendedExpansions.some((e) => e.productKey === 'PANDORAS_RWA')).toBe(false);
  });

  it('Does NOT provide any authorization methods or tokens', () => {
    const context = resolveTenantExperienceContext(baseInput);
    expect((context as any).canAccess).toBeUndefined();
    expect((context as any).token).toBeUndefined();
    expect((context as any).role).toBeUndefined();
  });
});
