// @ts-ignore
import { describe, it, expect, afterEach } from 'vitest';
import { tenantSlug, tenantEnv } from '@saasfly/hermes-core';
import { disclosureSeverity } from '@saasfly/hermes-core';

/**
 * Fase 2 · configuración por tenant sin hardcode.
 * Fase 3 · severidad proporcional del Channel Mesh.
 */
describe('Ollama por tenant (slug de entorno)', () => {
  afterEach(() => {
    delete process.env.OLLAMA_SNARAI_BASE_URL;
  });

  it('normaliza apóstrofes y acentos al slug del env', () => {
    expect(tenantSlug("S'Narai")).toBe('snarai');
    expect(tenantSlug('Pandora’s Growth OS')).toBe('pandoras_growth_os');
    expect(tenantSlug('  ')).toBe('');
  });

  it('lee OLLAMA_<SLUG>_* y devuelve undefined si no existe', () => {
    process.env.OLLAMA_SNARAI_BASE_URL = 'https://ollama.com';
    expect(tenantEnv("S'Narai", 'BASE_URL')).toBe('https://ollama.com');
    expect(tenantEnv("S'Narai", 'MODEL')).toBeUndefined();
    expect(tenantEnv(undefined, 'MODEL')).toBeUndefined();
  });
});

describe('Channel Mesh · severidad del bloqueo', () => {
  it('trata los drops rutinarios como INFO', () => {
    expect(disclosureSeverity('PUBLIC')).toBe('INFO');
    expect(disclosureSeverity('TENANT_RESTRICTED')).toBe('INFO');
    expect(disclosureSeverity('INTERNAL_OPERATIONAL')).toBe('INFO');
  });

  it('reserva CRITICAL para lo sensible o desconocido', () => {
    expect(disclosureSeverity('CONFIDENTIAL')).toBe('CRITICAL');
    expect(disclosureSeverity('SECRET')).toBe('CRITICAL');
    expect(disclosureSeverity('B2B_RESTRICTED')).toBe('CRITICAL');
    expect(disclosureSeverity(undefined)).toBe('CRITICAL');
  });
});
