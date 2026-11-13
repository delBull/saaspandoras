/**
 * 🧪 TESTS: P0.1 — grants de tenant, equipos y reasignación.
 *
 * Prueban las invariantes de autoridad:
 *  - aislamiento por organización
 *  - revocación efectiva en la siguiente petición
 *  - expiración y scope
 *  - canonicalización (alias aceptado en entrada, canónico guardado)
 *  - sin escalada de privilegios
 *  - equipo resuelto en servidor; sin fuente ⇒ aprobación (fail-closed)
 *  - el propietario no cambia hasta la aprobación efectiva
 */

import { describe, it, expect } from 'vitest';
import {
  buildTenantGrant,
  evaluateTenantCapability,
  revokeTenantGrant,
  GrantError,
  MAX_GRANT_TTL_SECONDS,
} from '../tenant-grant';
import {
  capabilitiesFromModulePermissions,
  decomposeModulePermission,
  MODULE_PERMISSION_DECOMPOSITION,
} from '../module-permission-decomposition';
import {
  decideReassignment,
  decideReassignmentRequest,
  ReassignmentError,
  resolveTeamRelation,
  type ReassignmentRequest,
  type ReassignmentRequestStore,
  type TeamMembershipRepository,
} from '../team-membership';

const NOW = 1_800_000_000;
const ORG = 'org-celeste-uuid';

function grant(overrides: Partial<Parameters<typeof buildTenantGrant>[0]> = {}) {
  return buildTenantGrant({
    id: 'grant_1',
    organizationId: ORG,
    subjectId: 'human_1',
    requestedCapabilities: ['crm.opportunity.read', 'crm.opportunity.write'],
    resourceScope: { kind: 'organization' },
    issuer: {
      subjectId: 'human_admin',
      capabilities: ['crm.opportunity.read', 'crm.opportunity.write', 'governance.grant.manage'],
    },
    ttlSeconds: 3600,
    nowSeconds: NOW,
    ...overrides,
  });
}

class MemoryRequestStore implements ReassignmentRequestStore {
  private readonly rows = new Map<string, ReassignmentRequest>();

  async create(request: ReassignmentRequest): Promise<void> {
    this.rows.set(request.id, { ...request });
  }
  async get(id: string): Promise<ReassignmentRequest | null> {
    const found = this.rows.get(id);
    return found ? { ...found } : null;
  }
  async transition(
    id: string,
    from: ReassignmentRequest['status'],
    to: ReassignmentRequest['status'],
    patch: Partial<ReassignmentRequest>,
  ): Promise<boolean> {
    const current = this.rows.get(id);
    if (!current || current.status !== from) return false;
    this.rows.set(id, { ...current, ...patch, status: to });
    return true;
  }
}

function teams(map: Record<string, string[]>): TeamMembershipRepository {
  return { teamsOf: async (_org, collaboratorId) => map[collaboratorId] ?? [] };
}

describe('P0.1 — grants de tenant', () => {
  it('PA-01: una capability desconocida se deniega (sin aproximación)', () => {
    const decision = evaluateTenantCapability({
      grant: grant(),
      subjectId: 'human_1',
      organizationId: ORG,
      capability: 'crm.opportunity',
      nowSeconds: NOW + 1,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('UNKNOWN_CAPABILITY');
  });

  it('PA-02: sin grant no hay acceso', () => {
    const decision = evaluateTenantCapability({
      grant: null,
      subjectId: 'human_1',
      organizationId: ORG,
      capability: 'crm.opportunity.read',
      nowSeconds: NOW,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('GRANT_MISSING');
  });

  it('PA-03: un grant de otra organización no sirve (aislamiento)', () => {
    const decision = evaluateTenantCapability({
      grant: grant({ organizationId: 'org-otra' }),
      subjectId: 'human_1',
      organizationId: ORG,
      capability: 'crm.opportunity.read',
      nowSeconds: NOW,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('ORG_MISMATCH');
  });

  it('PA-04: la revocación surte efecto en la SIGUIENTE petición', () => {
    const active = grant();

    expect(
      evaluateTenantCapability({
        grant: active,
        subjectId: 'human_1',
        organizationId: ORG,
        capability: 'crm.opportunity.read',
        nowSeconds: NOW + 5,
      }).allowed,
    ).toBe(true);

    const revoked = revokeTenantGrant(active, NOW + 6);

    const after = evaluateTenantCapability({
      grant: revoked,
      subjectId: 'human_1',
      organizationId: ORG,
      capability: 'crm.opportunity.read',
      nowSeconds: NOW + 7,
    });

    expect(after.allowed).toBe(false);
    expect(after.reason).toBe('GRANT_REVOKED');
  });

  it('PA-05: un grant expirado no sirve', () => {
    const decision = evaluateTenantCapability({
      grant: grant({ ttlSeconds: 60 }),
      subjectId: 'human_1',
      organizationId: ORG,
      capability: 'crm.opportunity.read',
      nowSeconds: NOW + 61,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('GRANT_EXPIRED');
  });

  it('PA-06: el sujeto del grant debe coincidir con la identidad de la petición', () => {
    const decision = evaluateTenantCapability({
      grant: grant(),
      subjectId: 'otro_humano',
      organizationId: ORG,
      capability: 'crm.opportunity.read',
      nowSeconds: NOW + 1,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('SUBJECT_MISMATCH');
  });

  it('PA-07: alias de entrada se canonicaliza al emitir y sigue funcionando', () => {
    const g = grant({
      requestedCapabilities: ['Media.Image', 'managed.crm.read'],
      issuer: {
        subjectId: 'human_admin',
        capabilities: ['media.image.create', 'crm.opportunity.read'],
      },
    });

    expect(g.capabilities).toEqual(['media.image.create', 'crm.opportunity.read']);
    expect(
      evaluateTenantCapability({
        grant: g,
        subjectId: 'human_1',
        organizationId: ORG,
        capability: 'Media.Image',
        nowSeconds: NOW + 1,
      }).allowed,
    ).toBe(true);
  });

  it('PA-08: capability no canonizable ⇒ el grant no se emite (fail-closed)', () => {
    expect(() => grant({ requestedCapabilities: ['crm.opportunity.magic'] })).toThrowError(GrantError);
    try {
      grant({ requestedCapabilities: ['crm.opportunity.magic'] });
    } catch (error) {
      expect((error as GrantError).code).toBe('UNRESOLVED_CAPABILITY');
    }
  });

  it('PA-09: no se puede emitir un grant con capabilities que el emisor no posee', () => {
    expect(() =>
      grant({
        requestedCapabilities: ['crm.opportunity.close'],
        issuer: { subjectId: 'human_admin', capabilities: ['crm.opportunity.read'] },
      }),
    ).toThrowError(/Escalada de privilegios/);
  });

  it('PA-10: una capability de plataforma no se concede como grant de tenant', () => {
    expect(() => grant({ requestedCapabilities: ['platform.tenants.suspend'] })).toThrowError(
      /no es una capability de tenant/,
    );

    const decision = evaluateTenantCapability({
      grant: grant(),
      subjectId: 'human_1',
      organizationId: ORG,
      capability: 'platform.tenants.suspend',
      nowSeconds: NOW,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('NOT_A_TENANT_CAPABILITY');
  });

  it('PA-11: TTL fuera de rango no se acepta', () => {
    expect(() => grant({ ttlSeconds: 0 })).toThrowError(/TTL inválido/);
    expect(() => grant({ ttlSeconds: MAX_GRANT_TTL_SECONDS + 1 })).toThrowError(/TTL inválido/);
  });

  it('PA-12: un grant de proyecto no cubre la organización ni otro proyecto', () => {
    const scoped = grant({ resourceScope: { kind: 'project', projectId: 42 } });

    expect(
      evaluateTenantCapability({
        grant: scoped,
        subjectId: 'human_1',
        organizationId: ORG,
        capability: 'crm.opportunity.read',
        resource: { projectId: 42 },
        nowSeconds: NOW + 1,
      }).allowed,
    ).toBe(true);

    const otherProject = evaluateTenantCapability({
      grant: scoped,
      subjectId: 'human_1',
      organizationId: ORG,
      capability: 'crm.opportunity.read',
      resource: { projectId: 43 },
      nowSeconds: NOW + 1,
    });
    expect(otherProject.allowed).toBe(false);
    expect(otherProject.reason).toBe('SCOPE_MISMATCH');

    const noResource = evaluateTenantCapability({
      grant: scoped,
      subjectId: 'human_1',
      organizationId: ORG,
      capability: 'crm.opportunity.read',
      nowSeconds: NOW + 1,
    });
    expect(noResource.allowed).toBe(false);
    expect(noResource.reason).toBe('SCOPE_MISMATCH');
  });

  it('PA-13: una capability no concedida se deniega aunque el grant exista', () => {
    const decision = evaluateTenantCapability({
      grant: grant(),
      subjectId: 'human_1',
      organizationId: ORG,
      capability: 'content.asset.approve',
      nowSeconds: NOW + 1,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('CAPABILITY_NOT_GRANTED');
  });
});

describe('P0.1 — equipos y reasignación', () => {
  it('PA-14: mismo equipo ⇒ aplica directo', async () => {
    const decision = await decideReassignment({
      repository: teams({ human_1: ['equipo_ventas'], human_2: ['equipo_ventas'] }),
      organizationId: ORG,
      currentOwnerId: 'human_1',
      newOwnerId: 'human_2',
    });

    expect(decision).toEqual({ decision: 'APPLY_DIRECTLY', sameTeam: true });
  });

  it('PA-15: equipos distintos ⇒ requiere aprobación', async () => {
    const decision = await decideReassignment({
      repository: teams({ human_1: ['equipo_ventas'], human_2: ['equipo_marketing'] }),
      organizationId: ORG,
      currentOwnerId: 'human_1',
      newOwnerId: 'human_2',
    });

    expect(decision).toEqual({ decision: 'REQUIRE_APPROVAL', reason: 'CROSS_TEAM' });
  });

  it('PA-16: pertenencia no resoluble ⇒ requiere aprobación (fail-closed)', async () => {
    const noSource = await decideReassignment({
      repository: null,
      organizationId: ORG,
      currentOwnerId: 'human_1',
      newOwnerId: 'human_2',
    });
    expect(noSource).toEqual({ decision: 'REQUIRE_APPROVAL', reason: 'TEAM_UNRESOLVED' });

    const emptyTeams = await decideReassignment({
      repository: teams({}),
      organizationId: ORG,
      currentOwnerId: 'human_1',
      newOwnerId: 'human_2',
    });
    expect(emptyTeams).toEqual({ decision: 'REQUIRE_APPROVAL', reason: 'TEAM_UNRESOLVED' });

    const failing = {
      teamsOf: async () => {
        throw new Error('DB caída');
      },
    };
    const relation = await resolveTeamRelation({
      repository: failing,
      organizationId: ORG,
      currentOwnerId: 'human_1',
      newOwnerId: 'human_2',
    });
    expect(relation).toEqual({ resolvable: false, reason: 'QUERY_FAILED' });
  });

  it('PA-17: la reasignación NO cambia el propietario hasta la aprobación efectiva', async () => {
    const store = new MemoryRequestStore();
    await store.create({
      id: 'req_1',
      organizationId: ORG,
      opportunityId: 'opp_1',
      ownerFrom: 'human_1',
      ownerTo: 'human_2',
      requestedBy: 'human_1',
      reason: 'cambio de cartera',
      status: 'pending',
      decidedBy: null,
      decidedAt: null,
      decisionNote: null,
      createdAt: NOW,
    });

    // Estado de la oportunidad: el propietario sigue siendo human_1.
    let opportunityOwner = 'human_1';

    const pending = await store.get('req_1');
    expect(pending?.status).toBe('pending');
    expect(opportunityOwner).toBe('human_1');

    const decided = await decideReassignmentRequest({
      store,
      requestId: 'req_1',
      organizationId: ORG,
      deciderId: 'human_manager',
      decision: 'approved',
      nowSeconds: NOW + 10,
    });

    // Solo con la decisión efectiva se aplica el cambio.
    if (decided.decision === 'approved') {
      opportunityOwner = decided.ownerTo;
    }

    expect(opportunityOwner).toBe('human_2');
    expect((await store.get('req_1'))?.decidedBy).toBe('human_manager');
  });

  it('PA-18: el solicitante no puede aprobar su propia reasignación', async () => {
    const store = new MemoryRequestStore();
    await store.create({
      id: 'req_2',
      organizationId: ORG,
      opportunityId: 'opp_1',
      ownerFrom: 'human_1',
      ownerTo: 'human_2',
      requestedBy: 'human_1',
      reason: null,
      status: 'pending',
      decidedBy: null,
      decidedAt: null,
      decisionNote: null,
      createdAt: NOW,
    });

    await expect(
      decideReassignmentRequest({
        store,
        requestId: 'req_2',
        organizationId: ORG,
        deciderId: 'human_1',
        decision: 'approved',
        nowSeconds: NOW + 1,
      }),
    ).rejects.toMatchObject({ code: 'SELF_APPROVAL' });

    expect((await store.get('req_2'))?.status).toBe('pending');
  });

  it('PA-19: rechazar exige motivo y no devuelve cambio de propietario', async () => {
    const store = new MemoryRequestStore();
    await store.create({
      id: 'req_3',
      organizationId: ORG,
      opportunityId: 'opp_1',
      ownerFrom: 'human_1',
      ownerTo: 'human_2',
      requestedBy: 'human_1',
      reason: null,
      status: 'pending',
      decidedBy: null,
      decidedAt: null,
      decisionNote: null,
      createdAt: NOW,
    });

    await expect(
      decideReassignmentRequest({
        store,
        requestId: 'req_3',
        organizationId: ORG,
        deciderId: 'human_manager',
        decision: 'rejected',
        note: '  ',
        nowSeconds: NOW + 1,
      }),
    ).rejects.toMatchObject({ code: 'DECISION_NOTE_REQUIRED' });

    const rejected = await decideReassignmentRequest({
      store,
      requestId: 'req_3',
      organizationId: ORG,
      deciderId: 'human_manager',
      decision: 'rejected',
      note: 'no procede',
      nowSeconds: NOW + 2,
    });

    expect(rejected).toEqual({ decision: 'rejected' });
    expect((await store.get('req_3'))?.status).toBe('rejected');
  });

  it('PA-20: una solicitud de otra organización no se puede resolver', async () => {
    const store = new MemoryRequestStore();
    await store.create({
      id: 'req_4',
      organizationId: 'org-otra',
      opportunityId: 'opp_9',
      ownerFrom: 'human_1',
      ownerTo: 'human_2',
      requestedBy: 'human_1',
      reason: null,
      status: 'pending',
      decidedBy: null,
      decidedAt: null,
      decisionNote: null,
      createdAt: NOW,
    });

    await expect(
      decideReassignmentRequest({
        store,
        requestId: 'req_4',
        organizationId: ORG,
        deciderId: 'human_manager',
        decision: 'approved',
        nowSeconds: NOW + 1,
      }),
    ).rejects.toBeInstanceOf(ReassignmentError);
  });
});

describe('P0.1 — permisos de módulo (RBAC legacy)', () => {
  it('PA-21: la tabla de descomposición está vacía por diseño (sin traducción automática)', () => {
    expect(Object.keys(MODULE_PERMISSION_DECOMPOSITION)).toHaveLength(0);
  });

  it('PA-22: un permiso de módulo no aporta capabilities ni se declara resuelto', () => {
    const result = capabilitiesFromModulePermissions(['growth.manage', 'users.manage']);

    expect(result.capabilities).toEqual([]);
    expect(result.undeclared).toEqual(['growth.manage', 'users.manage']);
    expect(decomposeModulePermission('growth.manage')).toEqual({ kind: 'undeclared' });
  });

  it('PA-23: una capability canónica no se confunde con permiso de módulo', () => {
    expect(decomposeModulePermission('crm.opportunity.write')).toEqual({
      kind: 'not_a_module_permission',
    });
  });
});
