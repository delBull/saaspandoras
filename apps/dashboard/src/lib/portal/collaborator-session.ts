/**
 * P0.1 — Sesión de colaborador para el portal (multiusuario).
 *
 * El portal dejó de ser "un producto = un usuario". Ahora una PERSONA se
 * autentica con su credencial de colaborador (`nexus_collaborators.token`),
 * que es única, revocable y expira.
 *
 * Invariantes:
 *  - Sin fila, sin estado ACTIVE o expirada ⇒ no hay sesión (fail-closed).
 *  - El acceso a una organización exige pertenencia explícita
 *    (`project_collaborators`), no un rol global ni el correo.
 *  - El rol del portal se deriva del colaborador; nunca del producto ni del body.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { and, eq } from '@saasfly/db-core';
import { db } from '@saasfly/db';
import { nexusCollaborators, projectCollaborators } from '@saasfly/db/schema';
import {
  isCollaboratorActive,
  mapNexusRoleToPortalRole,
  type CollaboratorStatusInput,
} from './portal-identity';
import type { PortalRole } from './permissions';

export interface CollaboratorPortalSession {
  collaboratorId: number;
  canonicalOrgId: string;
  role: PortalRole;
  actorId: string;
}

export interface CollaboratorLookup {
  id: number;
  canonicalOrgId: string | null;
  role: string | null;
  status: string | null;
  expiresAt: Date | null;
}

export interface CollaboratorSessionDeps {
  findByToken(token: string): Promise<CollaboratorLookup | null>;
  findByCollaboratorId(collaboratorId: number): Promise<CollaboratorLookup | null>;
  rotateToken(collaboratorId: number, newToken: string): Promise<boolean>;
  hasProjectAccess(collaboratorId: number, projectSlug: string): Promise<boolean>;
  now?: Date;
}

export const collaboratorSessionDeps: CollaboratorSessionDeps = {
  async findByToken(token: string) {
    if (!token || token.trim().length === 0) return null;

    const [row] = await db
      .select({
        id: nexusCollaborators.id,
        canonicalOrgId: nexusCollaborators.canonicalOrgId,
        role: nexusCollaborators.role,
        status: nexusCollaborators.status,
        expiresAt: nexusCollaborators.expiresAt,
      })
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.token, token))
      .limit(1);

    if (!row) return null;
    return {
      id: row.id,
      canonicalOrgId: row.canonicalOrgId ?? null,
      role: row.role ?? null,
      status: row.status ?? null,
      expiresAt: row.expiresAt ?? null,
    };
  },

  async findByCollaboratorId(collaboratorId: number) {
    if (!Number.isInteger(collaboratorId)) return null;

    const [row] = await db
      .select({
        id: nexusCollaborators.id,
        canonicalOrgId: nexusCollaborators.canonicalOrgId,
        role: nexusCollaborators.role,
        status: nexusCollaborators.status,
        expiresAt: nexusCollaborators.expiresAt,
      })
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.id, collaboratorId))
      .limit(1);

    if (!row) return null;
    return {
      id: row.id,
      canonicalOrgId: row.canonicalOrgId ?? null,
      role: row.role ?? null,
      status: row.status ?? null,
      expiresAt: row.expiresAt ?? null,
    };
  },

  /** Rotación de la credencial de invitación: el enlace pasa a ser de un solo uso. */
  async rotateToken(collaboratorId: number, newToken: string) {
    if (!Number.isInteger(collaboratorId) || !newToken) return false;

    const updated = await db
      .update(nexusCollaborators)
      .set({ token: newToken, lastAccessAt: new Date() })
      .where(
        and(
          eq(nexusCollaborators.id, collaboratorId),
          eq(nexusCollaborators.status, 'ACTIVE'),
        ),
      )
      .returning({ id: nexusCollaborators.id });

    return updated.length > 0;
  },

  async hasProjectAccess(collaboratorId: number, projectSlug: string) {
    if (!projectSlug || !Number.isInteger(collaboratorId)) return false;

    const [row] = await db
      .select({ collaboratorId: projectCollaborators.collaboratorId })
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectSlug),
          eq(projectCollaborators.collaboratorId, collaboratorId),
        ),
      )
      .limit(1);

    return Boolean(row);
  },
};

/**
 * Resuelve la sesión de una persona a partir de su credencial.
 * @returns `null` si la credencial no es válida, está expirada o el rol es desconocido.
 */
export async function resolveCollaboratorSession(
  token: string,
  deps: CollaboratorSessionDeps = collaboratorSessionDeps,
): Promise<CollaboratorPortalSession | null> {
  const collaborator = await deps.findByToken(token);
  if (!collaborator) return null;

  const status: CollaboratorStatusInput = {
    status: collaborator.status,
    expiresAt: collaborator.expiresAt,
  };
  if (!isCollaboratorActive(status, deps.now ?? new Date())) return null;

  const role = mapNexusRoleToPortalRole(collaborator.role);
  if (!role) return null;
  if (!collaborator.canonicalOrgId) return null;

  return {
    collaboratorId: collaborator.id,
    canonicalOrgId: collaborator.canonicalOrgId,
    role,
    actorId: `collaborator:${collaborator.id}`,
  };
}

/** Verifica pertenencia del colaborador a la organización (proyecto) solicitada. */
export async function collaboratorBelongsToOrganization(
  session: CollaboratorPortalSession,
  projectSlug: string,
  deps: CollaboratorSessionDeps = collaboratorSessionDeps,
): Promise<boolean> {
  return deps.hasProjectAccess(session.collaboratorId, projectSlug);
}

// ── Token de SESIÓN (independiente de la credencial de invitación) ────────────
//
// El enlace de invitación es de UN SOLO USO: al canjearlo se rota la credencial.
// La cookie NO contiene la credencial, sino un token firmado de vida corta:
//
//   pcs.<payloadBase64Url>.<hmacBase64Url>
//   payload = { cid, org, exp }
//
// Ventajas frente a reutilizar la credencial:
//  - Robar la cookie no permite volver a canjear el enlace.
//  - Vida corta (7 días) independiente de la expiración de la invitación.
//  - Revocación efectiva: cada petición revalida el colaborador en base.

export const COLLABORATOR_SESSION_PREFIX = 'pcs';
export const COLLABORATOR_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface CollaboratorSessionTokenPayload {
  collaboratorId: number;
  canonicalOrgId: string;
  expiresAt: number;
}

function sessionSecret(secret?: string, nowDate?: Date): Buffer {
  void nowDate;
  const value =
    secret ??
    process.env.PORTAL_SESSION_SECRET ??
    process.env.PORTAL_JWT_SECRET ??
    process.env.NEXTAUTH_SECRET;

  if (!value || value.trim().length < 32) {
    throw new Error('SESSION_SECRET_NOT_CONFIGURED');
  }
  return Buffer.from(value, 'utf8');
}

function signSession(secret: Buffer, payloadB64: string): Buffer {
  return createHmac('sha256', secret).update(`${COLLABORATOR_SESSION_PREFIX}|${payloadB64}`).digest();
}

/** Emite un token de sesión firmado (vida corta). */
export function mintCollaboratorSessionToken(params: {
  collaboratorId: number;
  canonicalOrgId: string;
  ttlSeconds?: number;
  nowSeconds?: number;
  secret?: string;
}): { token: string; expiresAt: number } {
  const secret = sessionSecret(params.secret);
  const ttl = params.ttlSeconds ?? COLLABORATOR_SESSION_TTL_SECONDS;
  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  const expiresAt = now + ttl;

  const payload: CollaboratorSessionTokenPayload = {
    collaboratorId: params.collaboratorId,
    canonicalOrgId: params.canonicalOrgId,
    expiresAt,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = signSession(secret, payloadB64).toString('base64url');

  return { token: `${COLLABORATOR_SESSION_PREFIX}.${payloadB64}.${signature}`, expiresAt };
}

/** Verifica firma y expiración. `null` si algo no cuadra (fail-closed). */
export function verifyCollaboratorSessionToken(
  token: string,
  options?: { nowSeconds?: number; secret?: string },
): CollaboratorSessionTokenPayload | null {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== COLLABORATOR_SESSION_PREFIX) return null;

  const [, payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  let secret: Buffer;
  try {
    secret = sessionSecret(options?.secret);
  } catch {
    return null;
  }

  const expected = signSession(secret, payloadB64);
  let received: Buffer;
  try {
    received = Buffer.from(signatureB64, 'base64url');
  } catch {
    return null;
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  let payload: CollaboratorSessionTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (
    !payload ||
    !Number.isInteger(payload.collaboratorId) ||
    typeof payload.canonicalOrgId !== 'string' ||
    !Number.isInteger(payload.expiresAt)
  ) {
    return null;
  }

  const now = options?.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (payload.expiresAt <= now) return null;

  return payload;
}

/**
 * Resuelve la sesión a partir del token de cookie (NO de la credencial).
 * Revalida el colaborador en base en cada petición: la revocación es inmediata.
 */
export async function resolveCollaboratorSessionToken(
  token: string,
  deps: CollaboratorSessionDeps = collaboratorSessionDeps,
): Promise<CollaboratorPortalSession | null> {
  const payload = verifyCollaboratorSessionToken(token);
  if (!payload) return null;

  const collaborator = await deps.findByCollaboratorId(payload.collaboratorId);
  if (!collaborator) return null;

  const active = isCollaboratorActive(
    { status: collaborator.status, expiresAt: collaborator.expiresAt },
    deps.now ?? new Date(),
  );
  if (!active) return null;

  const role = mapNexusRoleToPortalRole(collaborator.role);
  if (!role) return null;

  // El token no puede cambiar de organización: debe coincidir con la del colaborador.
  if (!collaborator.canonicalOrgId || collaborator.canonicalOrgId !== payload.canonicalOrgId) {
    return null;
  }

  return {
    collaboratorId: collaborator.id,
    canonicalOrgId: collaborator.canonicalOrgId,
    role,
    actorId: `collaborator:${collaborator.id}`,
  };
}

/** Invalida la credencial de invitación (el enlace queda de un solo uso). */
export async function rotateInvitationCredential(
  collaboratorId: number,
  deps: CollaboratorSessionDeps = collaboratorSessionDeps,
): Promise<boolean> {
  return deps.rotateToken(collaboratorId, randomBytes(32).toString('hex'));
}
