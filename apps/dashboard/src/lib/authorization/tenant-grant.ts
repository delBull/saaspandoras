/**
 * P0.1 — Grants de TENANT (autorización de operadores humanos).
 *
 * Cadena canónica que este módulo implementa:
 *
 *   Identidad autenticada → organización canónica → grant vigente →
 *   capability canónica → resource scope → decisión
 *
 * INVARIANTES
 *  1. Un rol de plataforma NO concede capabilities de tenant (ver
 *     `getCapabilityAuthorityModel`). Aquí solo hay grants explícitos.
 *  2. Las capabilities del grant se CANONIZAN al emitirlo. Guardar aliases como
 *     autoridad está prohibido; el alias solo sirve para compatibilidad de entrada.
 *  3. Fail-closed: grant ausente, revocado, expirado, de otra organización, con
 *     scope distinto o capability no canonizable ⇒ DENEGADO.
 *  4. Revocación efectiva en la SIGUIENTE petición: el grant se lee en cada
 *     evaluación; no hay caché de permisos en este módulo.
 *  5. Sin escalada de privilegios: quien emite un grant no puede conceder una
 *     capability que él mismo no posee.
 */

import {
  PlatformCapabilityRegistryService,
  resolveCanonicalCapability,
  TENANT_CAPABILITY_SET,
  type TenantCapability,
} from '@saasfly/shared';

export type GrantResourceScope =
  | { kind: 'organization' }
  | { kind: 'project'; projectId: number };

export interface TenantAuthorizationGrant {
  id: string;
  /** Organización canónica (UUID cuando exista) — autoridad, no el slug. */
  organizationId: string;
  subjectKind: 'human';
  subjectId: string;
  /** Identificadores CANÓNICOS. */
  capabilities: TenantCapability[];
  resourceScope: GrantResourceScope;
  issuedBy: string;
  /** Epoch en segundos. */
  issuedAt: number;
  expiresAt: number | null;
  revokedAt: number | null;
  /** Solicitud de aprobación que originó el grant, si aplica. */
  approvalRequestId?: string | null;
}

export type GrantDenialReason =
  | 'GRANT_MISSING'
  | 'SUBJECT_REQUIRED'
  | 'SUBJECT_MISMATCH'
  | 'ORG_MISMATCH'
  | 'GRANT_REVOKED'
  | 'GRANT_EXPIRED'
  | 'UNKNOWN_CAPABILITY'
  | 'NOT_A_TENANT_CAPABILITY'
  | 'CAPABILITY_NOT_GRANTED'
  | 'SCOPE_MISMATCH';

export interface GrantDecision {
  allowed: boolean;
  reason?: GrantDenialReason;
  canonicalCapability?: TenantCapability;
}

export class GrantError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'UNRESOLVED_CAPABILITY'
      | 'PRIVILEGE_ESCALATION'
      | 'TTL_INVALID'
      | 'ISSUER_REQUIRED'
      | 'NOT_A_TENANT_CAPABILITY',
  ) {
    super(message);
    this.name = 'GrantError';
  }
}

/** TTL máximo de un grant: 90 días. */
export const MAX_GRANT_TTL_SECONDS = 90 * 24 * 60 * 60;

/**
 * Evalúa una capability de tenant contra un grant.
 *
 * No lanza: devuelve decisión explícita para que el llamador pueda auditar el
 * motivo exacto del rechazo.
 */
export function evaluateTenantCapability(params: {
  grant: TenantAuthorizationGrant | null | undefined;
  subjectId: string;
  organizationId: string;
  /** Canónico o alias declarado. */
  capability: string;
  resource?: { projectId?: number | null } | null;
  nowSeconds: number;
}): GrantDecision {
  if (!params.subjectId) return { allowed: false, reason: 'SUBJECT_REQUIRED' };

  const canonical = resolveCanonicalCapability(params.capability);
  if (!canonical) {
    if (PlatformCapabilityRegistryService.isPlatformCapability(params.capability)) {
      return { allowed: false, reason: 'NOT_A_TENANT_CAPABILITY' };
    }
    return { allowed: false, reason: 'UNKNOWN_CAPABILITY' };
  }
  if (!TENANT_CAPABILITY_SET.has(canonical)) {
    return { allowed: false, reason: 'NOT_A_TENANT_CAPABILITY', canonicalCapability: canonical };
  }

  const grant = params.grant;
  if (!grant) return { allowed: false, reason: 'GRANT_MISSING', canonicalCapability: canonical };

  if (grant.subjectKind !== 'human' || grant.subjectId !== params.subjectId) {
    return { allowed: false, reason: 'SUBJECT_MISMATCH', canonicalCapability: canonical };
  }
  if (grant.organizationId !== params.organizationId) {
    return { allowed: false, reason: 'ORG_MISMATCH', canonicalCapability: canonical };
  }
  if (grant.revokedAt !== null) {
    return { allowed: false, reason: 'GRANT_REVOKED', canonicalCapability: canonical };
  }
  if (grant.expiresAt !== null && grant.expiresAt <= params.nowSeconds) {
    return { allowed: false, reason: 'GRANT_EXPIRED', canonicalCapability: canonical };
  }

  // Scope: un grant de organización cubre sus proyectos; un grant de proyecto no
  // cubre la organización ni otros proyectos.
  if (grant.resourceScope.kind === 'project') {
    const requestedProject = params.resource?.projectId ?? null;
    if (requestedProject === null || requestedProject !== grant.resourceScope.projectId) {
      return { allowed: false, reason: 'SCOPE_MISMATCH', canonicalCapability: canonical };
    }
  }

  if (!grant.capabilities.includes(canonical)) {
    return { allowed: false, reason: 'CAPABILITY_NOT_GRANTED', canonicalCapability: canonical };
  }

  return { allowed: true, canonicalCapability: canonical };
}

/**
 * Construye un grant canonicalizando las capabilities solicitadas.
 *
 * @throws GrantError si alguna capability no canoniza (fail-closed: nunca se
 *         guarda un permiso que no se entiende) o si hay escalada de privilegios.
 */
export function buildTenantGrant(params: {
  id: string;
  organizationId: string;
  subjectId: string;
  requestedCapabilities: readonly string[];
  resourceScope: GrantResourceScope;
  issuer: { subjectId: string; capabilities: readonly string[] };
  ttlSeconds?: number | null;
  nowSeconds: number;
  approvalRequestId?: string | null;
}): TenantAuthorizationGrant {
  if (!params.issuer?.subjectId) {
    throw new GrantError('El emisor del grant es obligatorio.', 'ISSUER_REQUIRED');
  }
  if (!params.subjectId) {
    throw new GrantError('El sujeto del grant es obligatorio.', 'ISSUER_REQUIRED');
  }

  const canonicalRequested: TenantCapability[] = [];
  for (const raw of params.requestedCapabilities) {
    const canonical = resolveCanonicalCapability(raw);
    if (!canonical) {
      // Distinguir "no existe" de "existe pero es de plataforma": ambos se
      // rechazan, pero el motivo debe ser exacto para la auditoría.
      if (PlatformCapabilityRegistryService.isPlatformCapability(raw)) {
        throw new GrantError(
          `'${raw}' no es una capability de tenant (autoridad de plataforma).`,
          'NOT_A_TENANT_CAPABILITY',
        );
      }
      throw new GrantError(
        `Capability no reconocida: '${raw}'. No se concede por aproximación.`,
        'UNRESOLVED_CAPABILITY',
      );
    }
    if (!TENANT_CAPABILITY_SET.has(canonical)) {
      throw new GrantError(
        `'${raw}' no es una capability de tenant (autoridad de plataforma).`,
        'NOT_A_TENANT_CAPABILITY',
      );
    }
    if (!canonicalRequested.includes(canonical)) canonicalRequested.push(canonical);
  }

  const issuerCanonical = new Set<TenantCapability>();
  for (const raw of params.issuer.capabilities) {
    const canonical = resolveCanonicalCapability(raw);
    if (canonical && TENANT_CAPABILITY_SET.has(canonical)) issuerCanonical.add(canonical);
  }

  const escalated = canonicalRequested.filter((capability) => !issuerCanonical.has(capability));
  if (escalated.length > 0) {
    throw new GrantError(
      `Escalada de privilegios: el emisor no posee [${escalated.join(', ')}].`,
      'PRIVILEGE_ESCALATION',
    );
  }

  const ttl = params.ttlSeconds ?? null;
  if (ttl !== null) {
    if (!Number.isInteger(ttl) || ttl <= 0 || ttl > MAX_GRANT_TTL_SECONDS) {
      throw new GrantError(
        `TTL inválido: debe ser entero positivo y ≤ ${MAX_GRANT_TTL_SECONDS}s.`,
        'TTL_INVALID',
      );
    }
  }

  return {
    id: params.id,
    organizationId: params.organizationId,
    subjectKind: 'human',
    subjectId: params.subjectId,
    capabilities: canonicalRequested,
    resourceScope: params.resourceScope,
    issuedBy: params.issuer.subjectId,
    issuedAt: params.nowSeconds,
    expiresAt: ttl === null ? null : params.nowSeconds + ttl,
    revokedAt: null,
    approvalRequestId: params.approvalRequestId ?? null,
  };
}

/** Revoca un grant. El efecto es inmediato en la siguiente evaluación. */
export function revokeTenantGrant(
  grant: TenantAuthorizationGrant,
  revokedAt: number,
): TenantAuthorizationGrant {
  return { ...grant, revokedAt };
}
