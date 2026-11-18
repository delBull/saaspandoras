/**
 * 🧪 TESTS: P0.1 — capa de aplicación `authorizeTenantCapability`.
 *
 * Verifican la cadena completa: actor → organización canónica → grants → capability.
 * Incluyen los casos adversariales: aislamiento, revocación, fallo de DB (fail-closed),
 * identidad de máquina y scope de proyecto.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  authorizeTenantCapability,
  requireTenantCapability,
  TenantAuthorizationError,
  type CanonicalOrganizationResolver,
  type ResolvedOrganization,
  type TenantGrantRepository,
} from '../authorize-tenant-capability';
import { buildTenantGrant, revokeTenantGrant, type TenantAuthorizationGrant } from '../tenant-grant';

const NOW = 1_800_000_000;
const ORG_UUID = '8f1a3c2e-0000-4000-8000-000000000001';
const ISSUER = {
  subjectId: 'human_admin',
  capabilities: [
    'crm.opportunity.read',
    'crm.opportunity.write',
    'content.asset.approve',
    'media.image.create',
  ],
};

class MemoryGrants implements TenantGrantRepository {
  rows: TenantAuthorizationGrant[] = [];
  shouldThrow = false;

  async listBySubject(organizationId: string, subjectId: string) {
    if (this.shouldThrow) throw new Error('DB caída');
    return this.rows.filter(
      (grant) => grant.organizationId === organizationId && grant.subjectId === subjectId,
    );
  }
  async create(grant: TenantAuthorizationGrant) {
    this.rows.push(grant);
  }
  async revoke(id: string, revokedAt: number) {
    const index = this.rows.findIndex((grant) => grant.id === id);
    if (index === -1) return false;
    this.rows[index] = revokeTenantGrant(this.rows[index]!, revokedAt);
    return true;
  }
  async countByOrganization(organizationId: string) {
    return this.rows.filter((grant) => grant.organizationId === organizationId).length;
  }
}

const organizations: CanonicalOrganizationResolver = {
  resolve: async (slugOrId: string): Promise<ResolvedOrganization | null> => {
    if (slugOrId === 'celeste' || slugOrId === ORG_UUID) {
      return { canonicalOrgId: ORG_UUID, projectId: 42, slug: 'celeste' };
    }
    return null;
  },
};

function grant(overrides: Partial<Parameters<typeof buildTenantGrant>[0]> = {}) {
  return buildTenantGrant({
    id: 'grant_1',
    organizationId: ORG_UUID,
    subjectId: 'human_1',
    requestedCapabilities: ['crm.opportunity.read'],
    resourceScope: { kind: 'organization' },
    issuer: ISSUER,
    ttlSeconds: 3600,
    nowSeconds: NOW,
    ...overrides,
  });
}

describe('authorizeTenantCapability (P0.1)', () => {
  let grants: MemoryGrants;

  beforeEach(() => {
    grants = new MemoryGrants();
  });

  function call(overrides: Partial<Parameters<typeof authorizeTenantCapability>[0]> = {}) {
    return authorizeTenantCapability({
      actor: { kind: 'human', subjectId: 'human_1' },
      requestedTenant: { slug: 'celeste' },
      capability: 'crm.opportunity.read',
      deps: { grants, organizations, nowSeconds: NOW + 1 },
      ...overrides,
    });
  }

  it('AA-01: con grant vigente autoriza y reporta capability canónica + grantId', async () => {
    grants.rows = [grant()];

    const outcome = await call();

    expect(outcome.allowed).toBe(true);
    if (outcome.allowed) {
      expect(outcome.capability).toBe('crm.opportunity.read');
      expect(outcome.organizationId).toBe(ORG_UUID); // organización CANÓNICA, no el slug
      expect(outcome.subjectId).toBe('human_1');
      expect(outcome.grantId).toBe('grant_1');
      expect(outcome.via).toBe('grant');
    }
  });

  it('AA-02: sin grant ⇒ GRANT_MISSING', async () => {
    const outcome = await call();

    expect(outcome.allowed).toBe(false);
    if (!outcome.allowed) {
      expect(outcome.reason).toBe('GRANT_MISSING');
      expect(outcome.organizationId).toBe(ORG_UUID);
    }
  });

  it('AA-03: revocación efectiva en la siguiente petición', async () => {
    grants.rows = [grant()];
    expect((await call()).allowed).toBe(true);

    await grants.revoke('grant_1', NOW + 2);

    const after = await call({ deps: { grants, organizations, nowSeconds: NOW + 3 } });
    expect(after.allowed).toBe(false);
    if (!after.allowed) expect(after.reason).toBe('GRANT_REVOKED');
  });

  it('AA-04: grant expirado ⇒ GRANT_EXPIRED', async () => {
    grants.rows = [grant({ ttlSeconds: 10 })];

    const outcome = await call({ deps: { grants, organizations, nowSeconds: NOW + 11 } });

    expect(outcome.allowed).toBe(false);
    if (!outcome.allowed) expect(outcome.reason).toBe('GRANT_EXPIRED');
  });

  it('AA-05: fallo de base de datos ⇒ DENEGADO (fail-closed), nunca permitido', async () => {
    grants.rows = [grant()];
    grants.shouldThrow = true;

    const outcome = await call();

    expect(outcome.allowed).toBe(false);
    if (!outcome.allowed) expect(outcome.reason).toBe('GRANTS_QUERY_FAILED');
  });

  it('AA-06: organización no resoluble ⇒ ORG_UNRESOLVED', async () => {
    const unknown = await call({ requestedTenant: { slug: 'fantasma' } });
    expect(unknown.allowed).toBe(false);
    if (!unknown.allowed) expect(unknown.reason).toBe('ORG_UNRESOLVED');

    const noTenant = await call({ requestedTenant: {} });
    expect(noTenant.allowed).toBe(false);
    if (!noTenant.allowed) expect(noTenant.reason).toBe('ORG_UNRESOLVED');
  });

  it('AA-07: una identidad de máquina NO hereda la autoridad de su dueño', async () => {
    grants.rows = [grant({ subjectId: 'human_1' })];

    const outcome = await call({
      actor: { kind: 'machine', subjectId: 'integration_client:7', ownerSubjectId: 'human_1' },
    });

    expect(outcome.allowed).toBe(false);
    if (!outcome.allowed) expect(outcome.reason).toBe('MACHINE_SUBJECT');
  });

  it('AA-08: un grant de otra organización no autoriza (aislamiento)', async () => {
    grants.rows = [grant({ organizationId: 'otra-org' })];

    const outcome = await call();

    expect(outcome.allowed).toBe(false);
  });

  it('AA-09: capability no concedida ⇒ CAPABILITY_NOT_GRANTED', async () => {
    grants.rows = [grant()];

    const outcome = await call({ capability: 'content.asset.approve' });

    expect(outcome.allowed).toBe(false);
    if (!outcome.allowed) expect(outcome.reason).toBe('CAPABILITY_NOT_GRANTED');
  });

  it('AA-10: petición por alias se resuelve a la capability canónica concedida', async () => {
    grants.rows = [
      grant({ requestedCapabilities: ['media.image.create'] }),
    ];

    const outcome = await call({ capability: 'Media.Image' });

    expect(outcome.allowed).toBe(true);
    if (outcome.allowed) expect(outcome.capability).toBe('media.image.create');
  });

  it('AA-11: un grant antiguo con alias almacenado sigue concediendo (normalización al leer)', async () => {
    // Fila legado: capability guardada como alias, no como canónica.
    const legacy = { ...grant({ requestedCapabilities: ['media.image.create'] }), capabilities: ['Media.Image' as never] };
    grants.rows = [legacy];

    const outcome = await call({ capability: 'media.image.create' });

    expect(outcome.allowed).toBe(true);
  });

  it('AA-12: scope de proyecto exige el proyecto correcto', async () => {
    grants.rows = [grant({ resourceScope: { kind: 'project', projectId: 42 } })];

    expect((await call({ resource: { projectId: 42 } })).allowed).toBe(true);

    const wrongProject = await call({ resource: { projectId: 43 } });
    expect(wrongProject.allowed).toBe(false);
    if (!wrongProject.allowed) expect(wrongProject.reason).toBe('SCOPE_MISMATCH');

    const noResource = await call();
    expect(noResource.allowed).toBe(false);
    if (!noResource.allowed) expect(noResource.reason).toBe('SCOPE_MISMATCH');
  });

  it('AA-13: capability de plataforma ⇒ NOT_A_TENANT_CAPABILITY', async () => {
    grants.rows = [grant()];

    const outcome = await call({ capability: 'platform.tenants.suspend' });

    expect(outcome.allowed).toBe(false);
    if (!outcome.allowed) expect(outcome.reason).toBe('NOT_A_TENANT_CAPABILITY');
  });

  it('AA-14: capability desconocida ⇒ UNKNOWN_CAPABILITY', async () => {
    grants.rows = [grant()];

    const outcome = await call({ capability: 'crm.opportunity.magic' });

    expect(outcome.allowed).toBe(false);
    if (!outcome.allowed) expect(outcome.reason).toBe('UNKNOWN_CAPABILITY');
  });

  it('AA-15: con varios grants, basta uno que autorice', async () => {
    grants.rows = [
      grant({ id: 'grant_read', requestedCapabilities: ['crm.opportunity.read'] }),
      grant({ id: 'grant_approve', requestedCapabilities: ['content.asset.approve'] }),
    ];

    const outcome = await call({ capability: 'content.asset.approve' });

    expect(outcome.allowed).toBe(true);
    if (outcome.allowed) expect(outcome.grantId).toBe('grant_approve');
  });

  it('AA-16: requireTenantCapability lanza error tipado y fail-closed', async () => {
    await expect(requireTenantCapability({
      actor: { kind: 'human', subjectId: 'human_1' },
      requestedTenant: { slug: 'celeste' },
      capability: 'crm.opportunity.write',
      deps: { grants, organizations, nowSeconds: NOW + 1 },
    })).rejects.toBeInstanceOf(TenantAuthorizationError);

    grants.rows = [grant({ requestedCapabilities: ['crm.opportunity.write'] })];
    const ok = await requireTenantCapability({
      actor: { kind: 'human', subjectId: 'human_1' },
      requestedTenant: { canonicalOrgId: ORG_UUID },
      capability: 'crm.opportunity.write',
      deps: { grants, organizations, nowSeconds: NOW + 1 },
    });
    expect(ok.allowed).toBe(true);
  });

  it('AA-17: subject vacío no autoriza', async () => {
    grants.rows = [grant()];

    const outcome = await call({ actor: { kind: 'human', subjectId: '' } });

    expect(outcome.allowed).toBe(false);
    if (!outcome.allowed) expect(outcome.reason).toBe('SUBJECT_REQUIRED');
  });
});
