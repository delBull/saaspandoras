import { describe, expect, it } from 'vitest';
import {
  assertValidOwnerEmail,
  assertValidSlug,
  normalizeSlug,
  TenantProvisioningError,
} from '../tenant-provisioning';

/**
 * Reglas del alta de tenants (lo que NO puede quedar en manos del cliente).
 */

describe('normalizeSlug', () => {
  it('normaliza mayúsculas, espacios y símbolos', () => {
    expect(normalizeSlug('  Forge Fitness  ')).toBe('forge-fitness');
    expect(normalizeSlug('ACME___Corp!!')).toBe('acme-corp');
    expect(normalizeSlug('--a--b--')).toBe('a-b');
  });

  it('recorta a 40 caracteres', () => {
    expect(normalizeSlug('x'.repeat(80)).length).toBe(40);
  });
});

describe('assertValidSlug', () => {
  it('acepta slugs razonables', () => {
    expect(() => assertValidSlug('forge')).not.toThrow();
    expect(() => assertValidSlug('forge-fitness-2026')).not.toThrow();
  });

  it('rechaza slugs demasiado cortos o con formato inválido', () => {
    for (const bad of ['ab', '', '-forge', 'forge_1', 'forgé']) {
      expect(() => assertValidSlug(bad)).toThrow(TenantProvisioningError);
    }
  });

  it('rechaza slugs reservados por la plataforma', () => {
    for (const reserved of ['snarai', 'pandoras', 'admin', 'api', 'portal']) {
      try {
        assertValidSlug(reserved);
        throw new Error('no lanzó');
      } catch (error) {
        expect(error).toBeInstanceOf(TenantProvisioningError);
        expect((error as TenantProvisioningError).code).toBe('RESERVED_SLUG');
        expect((error as TenantProvisioningError).status).toBe(400);
      }
    }
  });
});

describe('assertValidOwnerEmail', () => {
  it('acepta un correo válido', () => {
    expect(() => assertValidOwnerEmail('mkt@forgeos.fitness')).not.toThrow();
  });

  it('rechaza vacío o inválido (el tenant no podría entrar al Portal)', () => {
    for (const bad of ['', 'sin-arroba', 'a@b', 'a b@c.com']) {
      try {
        assertValidOwnerEmail(bad);
        throw new Error('no lanzó');
      } catch (error) {
        expect(error).toBeInstanceOf(TenantProvisioningError);
        expect((error as TenantProvisioningError).code).toBe('INVALID_OWNER_EMAIL');
      }
    }
  });
});
