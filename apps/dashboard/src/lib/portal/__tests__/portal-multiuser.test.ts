/**
 * 🧪 TESTS: portal multiusuario (P0.1).
 *
 * Verifican que la identidad es la PERSONA (colaborador) y que el acceso a una
 * organización exige pertenencia explícita. Fail-closed en todos los bordes.
 */

import { describe, expect, it } from 'vitest';
import {
  isCollaboratorActive,
  mapNexusRoleToPortalRole,
} from '../portal-identity';
import {
  resolveCollaboratorSession,
  collaboratorBelongsToOrganization,
  type CollaboratorLookup,
  type CollaboratorSessionDeps,
} from '../collaborator-session';
import { PORTAL_ROLE_PERMISSIONS } from '../permissions';

const NOW = new Date('2026-11-13T12:00:00.000Z');

function lookup(overrides: Partial<CollaboratorLookup> = {}): CollaboratorLookup {
  return {
    id: 7,
    canonicalOrgId: 'org-uuid',
    role: 'OPERATOR',
    status: 'ACTIVE',
    expiresAt: new Date('2026-12-31T00:00:00.000Z'),
    ...overrides,
  };
}

function deps(
  collaborator: CollaboratorLookup | null,
  access: Record<string, boolean> = { celeste: true },
): CollaboratorSessionDeps & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async findByToken(token: string) {
      calls.push(`findByToken:${token}`);
      return collaborator;
    },
    async findByCollaboratorId(collaboratorId: number) {
      calls.push(`findByCollaboratorId:${collaboratorId}`);
      return collaborator;
    },
    async rotateToken(collaboratorId: number, newToken: string) {
      calls.push(`rotateToken:${collaboratorId}:${newToken.length > 0}`);
      return true;
    },
    async hasProjectAccess(collaboratorId: number, projectSlug: string) {
      calls.push(`hasProjectAccess:${collaboratorId}:${projectSlug}`);
      return access[projectSlug] ?? false;
    },
    now: NOW,
  };
}

describe('P0.1 — identidad de portal multiusuario', () => {
  it('MU-01: el rol del colaborador determina el rol del portal; desconocido ⇒ null', () => {
    expect(mapNexusRoleToPortalRole('OWNER')).toBe('owner');
    expect(mapNexusRoleToPortalRole('ADMIN')).toBe('admin');
    expect(mapNexusRoleToPortalRole('OPERATOR')).toBe('operator');
    expect(mapNexusRoleToPortalRole('COLLABORATOR')).toBe('operator');
    expect(mapNexusRoleToPortalRole('VIEWER')).toBe('viewer');
    // SUPER_ADMIN no se degrada a owner de un tenant.
    expect(mapNexusRoleToPortalRole('SUPER_ADMIN')).toBe('admin');
    // Desconocido / vacío ⇒ fail-closed.
    expect(mapNexusRoleToPortalRole('HACKER')).toBeNull();
    expect(mapNexusRoleToPortalRole('')).toBeNull();
    expect(mapNexusRoleToPortalRole(null)).toBeNull();
  });

  it('MU-02: solo ACTIVE y no expirado cuenta como vigente', () => {
    expect(isCollaboratorActive({ status: 'ACTIVE', expiresAt: NOW.getTime() + 1000 }, NOW)).toBe(true);
    expect(isCollaboratorActive({ status: 'ACTIVE', expiresAt: NOW.getTime() - 1000 }, NOW)).toBe(false);
    expect(isCollaboratorActive({ status: 'PENDING', expiresAt: NOW.getTime() + 1000 }, NOW)).toBe(false);
    expect(isCollaboratorActive({ status: 'DISABLED', expiresAt: NOW.getTime() + 1000 }, NOW)).toBe(false);
    // Sin expiración ⇒ no vigente (la columna es obligatoria).
    expect(isCollaboratorActive({ status: 'ACTIVE', expiresAt: null }, NOW)).toBe(false);
  });

  it('MU-03: una credencial válida resuelve la identidad de la persona', async () => {
    const session = await resolveCollaboratorSession('tok_valido', deps(lookup()));

    expect(session).toEqual({
      collaboratorId: 7,
      canonicalOrgId: 'org-uuid',
      role: 'operator',
      actorId: 'collaborator:7',
    });
  });

  it('MU-04: credencial inexistente, expirada o deshabilitada ⇒ sin sesión', async () => {
    expect(await resolveCollaboratorSession('tok_x', deps(null))).toBeNull();
    expect(
      await resolveCollaboratorSession(
        'tok_x',
        deps(lookup({ expiresAt: new Date('2026-01-01T00:00:00.000Z') })),
      ),
    ).toBeNull();
    expect(await resolveCollaboratorSession('tok_x', deps(lookup({ status: 'DISABLED' })))).toBeNull();
    expect(await resolveCollaboratorSession('tok_x', deps(lookup({ role: 'HACKER' })))).toBeNull();
  });

  it('MU-05: sin organización canónica no hay sesión (fail-closed)', async () => {
    expect(
      await resolveCollaboratorSession('tok_x', deps(lookup({ canonicalOrgId: null }))),
    ).toBeNull();
  });

  it('MU-06: el acceso exige pertenencia explícita al proyecto/organización', async () => {
    const session = (await resolveCollaboratorSession('tok_valido', deps(lookup())))!;

    expect(await collaboratorBelongsToOrganization(session, 'celeste', deps(lookup()))).toBe(true);
    expect(
      await collaboratorBelongsToOrganization(session, 'otra-org', deps(lookup())),
    ).toBe(false);

    // La verificación consulta la pertenencia, no el rol global.
    const spy = deps(lookup());
    await collaboratorBelongsToOrganization(session, 'celeste', spy);
    expect(spy.calls).toContain('hasProjectAccess:7:celeste');
  });

  it('MU-07: un VIEWER no hereda permisos de contenido (no puede aprobar)', async () => {
    const viewer = (await resolveCollaboratorSession(
      'tok_viewer',
      deps(lookup({ role: 'VIEWER' })),
    ))!;

    expect(viewer.role).toBe('viewer');
    expect(PORTAL_ROLE_PERMISSIONS.viewer).not.toContain('growth.content');
  });

  it('MU-08: dos personas pueden operar la misma organización con roles distintos', async () => {
    const admin = (await resolveCollaboratorSession(
      'tok_admin',
      deps(lookup({ id: 1, role: 'ADMIN' })),
    ))!;
    const operator = (await resolveCollaboratorSession(
      'tok_operator',
      deps(lookup({ id: 2, role: 'OPERATOR' })),
    ))!;

    expect(admin.actorId).not.toBe(operator.actorId);
    expect(admin.role).toBe('admin');
    expect(operator.role).toBe('operator');
    // Ambos autorizados para aprobar contenido (distinto actor ⇒ aprobador válido).
    expect(PORTAL_ROLE_PERMISSIONS.admin).toContain('growth.content');
    expect(PORTAL_ROLE_PERMISSIONS.operator).toContain('growth.content');
  });
});

// ── Token de sesión (cookie ≠ credencial) ─────────────────────────────────────

import {
  mintCollaboratorSessionToken,
  resolveCollaboratorSessionToken,
  verifyCollaboratorSessionToken,
  COLLABORATOR_SESSION_TTL_SECONDS,
} from '../collaborator-session';

const SECRET = 'sesion-de-prueba-con-mas-de-32-caracteres!!';
const NOW_S = 1_800_000_000;

describe('P0.1 — token de sesión del portal', () => {
  it('MU-09: emite un token verificable con expiración corta', () => {
    const { token, expiresAt } = mintCollaboratorSessionToken({
      collaboratorId: 7,
      canonicalOrgId: 'org-uuid',
      nowSeconds: NOW_S,
      secret: SECRET,
    });

    expect(token.startsWith('pcs.')).toBe(true);
    expect(expiresAt).toBe(NOW_S + COLLABORATOR_SESSION_TTL_SECONDS);
    // El token NO filtra la organización ni el id en claro.
    expect(token).not.toContain('org-uuid');

    expect(verifyCollaboratorSessionToken(token, { nowSeconds: NOW_S + 10, secret: SECRET })).toMatchObject({
      collaboratorId: 7,
      canonicalOrgId: 'org-uuid',
    });
  });

  it('MU-10: token manipulado, expirado o con otro secreto ⇒ null', () => {
    const { token } = mintCollaboratorSessionToken({
      collaboratorId: 7,
      canonicalOrgId: 'org-uuid',
      nowSeconds: NOW_S,
      secret: SECRET,
    });

    const tampered = `${token.slice(0, -3)}AAA`;
    expect(verifyCollaboratorSessionToken(tampered, { nowSeconds: NOW_S + 1, secret: SECRET })).toBeNull();

    expect(
      verifyCollaboratorSessionToken(token, {
        nowSeconds: NOW_S + COLLABORATOR_SESSION_TTL_SECONDS + 1,
        secret: SECRET,
      }),
    ).toBeNull();

    expect(verifyCollaboratorSessionToken(token, { nowSeconds: NOW_S + 1, secret: 'otro-secreto-de-32-caracteres-distinto!' })).toBeNull();
    expect(verifyCollaboratorSessionToken('pcs.a.b', { nowSeconds: NOW_S, secret: SECRET })).toBeNull();
    expect(verifyCollaboratorSessionToken('', { nowSeconds: NOW_S, secret: SECRET })).toBeNull();
  });

  it('MU-11: sin secreto configurado no se emite ni se valida nada (fail-closed)', () => {
    const previous = process.env.PORTAL_SESSION_SECRET;
    const previousJwt = process.env.PORTAL_JWT_SECRET;
    const previousNext = process.env.NEXTAUTH_SECRET;
    delete process.env.PORTAL_SESSION_SECRET;
    delete process.env.PORTAL_JWT_SECRET;
    delete process.env.NEXTAUTH_SECRET;

    try {
      expect(() =>
        mintCollaboratorSessionToken({ collaboratorId: 7, canonicalOrgId: 'org-uuid' }),
      ).toThrowError(/SESSION_SECRET_NOT_CONFIGURED/);
      expect(verifyCollaboratorSessionToken('pcs.a.b')).toBeNull();
    } finally {
      if (previous !== undefined) process.env.PORTAL_SESSION_SECRET = previous;
      if (previousJwt !== undefined) process.env.PORTAL_JWT_SECRET = previousJwt;
      if (previousNext !== undefined) process.env.NEXTAUTH_SECRET = previousNext;
    }
  });

  it('MU-12: la sesión revalida al colaborador en cada petición (revocación inmediata)', async () => {
    const { token } = mintCollaboratorSessionToken({
      collaboratorId: 7,
      canonicalOrgId: 'org-uuid',
      nowSeconds: Math.floor(Date.now() / 1000),
      secret: SECRET,
    });

    const activeDeps = {
      findByToken: async () => null,
      findByCollaboratorId: async () => ({
        id: 7,
        canonicalOrgId: 'org-uuid',
        role: 'OPERATOR',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 86_400_000),
      }),
      rotateToken: async () => true,
      hasProjectAccess: async () => true,
    };

    const previous = process.env.PORTAL_SESSION_SECRET;
    process.env.PORTAL_SESSION_SECRET = SECRET;
    try {
      expect(await resolveCollaboratorSessionToken(token, activeDeps)).toMatchObject({
        collaboratorId: 7,
        role: 'operator',
      });

      // Revocación: el colaborador queda DISABLED en la siguiente petición.
      const revoked = await resolveCollaboratorSessionToken(token, {
        ...activeDeps,
        findByCollaboratorId: async () => ({
          id: 7,
          canonicalOrgId: 'org-uuid',
          role: 'OPERATOR',
          status: 'DISABLED',
          expiresAt: new Date(Date.now() + 86_400_000),
        }),
      });
      expect(revoked).toBeNull();

      // El token no puede reclamar otra organización.
      const otherOrg = await resolveCollaboratorSessionToken(token, {
        ...activeDeps,
        findByCollaboratorId: async () => ({
          id: 7,
          canonicalOrgId: 'org-otra',
          role: 'OPERATOR',
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 86_400_000),
        }),
      });
      expect(otherOrg).toBeNull();
    } finally {
      if (previous === undefined) delete process.env.PORTAL_SESSION_SECRET;
      else process.env.PORTAL_SESSION_SECRET = previous;
    }
  });
});
