/**
 * P0.1 — Capa de aplicación de autorización de tenant.
 *
 * Punto de entrada ÚNICO para que una ruta (CRM, Media, Reporting, Governance)
 * decida si una identidad puede ejecutar una capability sobre el tenant actual.
 *
 * Cadena (en este orden, sin atajos):
 *
 *   Actor autenticado (servidor)
 *     → organización canónica (resuelta en servidor, nunca del body)
 *       → grants vigentes del sujeto en esa organización (leídos por petición)
 *         → capability canónica + resource scope
 *           → decisión (fail-closed)
 *
 * Reglas duras:
 *  - Grants son de IDENTIDAD HUMANA. Una identidad de máquina (API key) NO recibe
 *    grants de tenant: se deniega explícitamente con `MACHINE_SUBJECT` en vez de
 *    "traducirla" a una persona.
 *  - Errores de resolución o de base de datos ⇒ DENEGADO. Nunca "allowed".
 *  - Sin caché: la revocación surte efecto en la siguiente petición por diseño.
 *  - Un rol de plataforma no participa aquí (ver `getCapabilityAuthorityModel`).
 */

import { resolveCanonicalCapability, type TenantCapability } from '@saasfly/shared';
import {
  evaluateTenantCapability,
  type GrantDenialReason,
  type TenantAuthorizationGrant,
} from './tenant-grant';

export type TenantActor =
  | { kind: 'human'; subjectId: string }
  | { kind: 'machine'; subjectId: string; ownerSubjectId?: string | null };

export interface ResolvedOrganization {
  canonicalOrgId: string;
  projectId: number;
  slug: string;
}

export interface CanonicalOrganizationResolver {
  /** Resuelve slug o id a la organización canónica. `null` si no existe. */
  resolve(slugOrId: string): Promise<ResolvedOrganization | null>;
}

export interface TenantGrantRepository {
  /** Grants del sujeto en la organización (incluye revocados/expirados: el evaluador decide). */
  listBySubject(organizationId: string, subjectId: string): Promise<TenantAuthorizationGrant[]>;
  create(grant: TenantAuthorizationGrant): Promise<void>;
  revoke(id: string, revokedAt: number): Promise<boolean>;
  countByOrganization(organizationId: string): Promise<number>;
}

export type TenantAuthorizationDenial =
  | GrantDenialReason
  | 'ORG_UNRESOLVED'
  | 'GRANTS_QUERY_FAILED'
  | 'MACHINE_SUBJECT'
  | 'SUBJECT_REQUIRED';

export type TenantAuthorizationOutcome =
  | {
      allowed: true;
      via: 'grant';
      capability: TenantCapability;
      organizationId: string;
      subjectId: string;
      grantId: string;
    }
  | {
      allowed: false;
      reason: TenantAuthorizationDenial;
      capability: TenantCapability | null;
      organizationId: string | null;
      subjectId: string | null;
    };

export class TenantAuthorizationError extends Error {
  constructor(
    message: string,
    readonly code: 'FORBIDDEN_TENANT_CAPABILITY',
    readonly outcome: Extract<TenantAuthorizationOutcome, { allowed: false }>,
  ) {
    super(message);
    this.name = 'TenantAuthorizationError';
  }
}

/** Normaliza las capabilities almacenadas: solo canónicas pueden conceder. */
function canonicalizeGrant(grant: TenantAuthorizationGrant): TenantAuthorizationGrant {
  const canonical: TenantCapability[] = [];
  for (const stored of grant.capabilities) {
    const resolved = resolveCanonicalCapability(stored);
    if (resolved && !canonical.includes(resolved)) canonical.push(resolved);
  }
  return { ...grant, capabilities: canonical };
}

/**
 * Decide si el actor puede ejecutar `capability` sobre el tenant solicitado.
 *
 * No lanza por denegación: devuelve un outcome explícito para auditoría.
 */
export async function authorizeTenantCapability(params: {
  actor: TenantActor;
  /** Tenant resuelto en servidor (slug del proyecto o id canónico). */
  requestedTenant: { slug?: string | null; canonicalOrgId?: string | null };
  capability: string;
  resource?: { projectId?: number | null } | null;
  deps: {
    grants: TenantGrantRepository;
    organizations: CanonicalOrganizationResolver;
    nowSeconds?: number;
  };
}): Promise<TenantAuthorizationOutcome> {
  const capabilityHint = resolveCanonicalCapability(params.capability);

  if (!params.actor?.subjectId) {
    return {
      allowed: false,
      reason: 'SUBJECT_REQUIRED',
      capability: capabilityHint,
      organizationId: null,
      subjectId: null,
    };
  }

  // Una identidad de máquina no hereda la autoridad de su dueño.
  if (params.actor.kind !== 'human') {
    return {
      allowed: false,
      reason: 'MACHINE_SUBJECT',
      capability: capabilityHint,
      organizationId: null,
      subjectId: params.actor.subjectId,
    };
  }

  const tenantKey = params.requestedTenant.canonicalOrgId ?? params.requestedTenant.slug ?? null;
  if (!tenantKey) {
    return {
      allowed: false,
      reason: 'ORG_UNRESOLVED',
      capability: capabilityHint,
      organizationId: null,
      subjectId: params.actor.subjectId,
    };
  }

  let organization: ResolvedOrganization | null;
  try {
    organization = await params.deps.organizations.resolve(tenantKey);
  } catch {
    return {
      allowed: false,
      reason: 'ORG_UNRESOLVED',
      capability: capabilityHint,
      organizationId: null,
      subjectId: params.actor.subjectId,
    };
  }

  if (!organization) {
    return {
      allowed: false,
      reason: 'ORG_UNRESOLVED',
      capability: capabilityHint,
      organizationId: null,
      subjectId: params.actor.subjectId,
    };
  }

  let grants: TenantAuthorizationGrant[];
  try {
    grants = await params.deps.grants.listBySubject(organization.canonicalOrgId, params.actor.subjectId);
  } catch {
    // Fail-closed: un fallo de DB no puede convertirse en "permitido".
    return {
      allowed: false,
      reason: 'GRANTS_QUERY_FAILED',
      capability: capabilityHint,
      organizationId: organization.canonicalOrgId,
      subjectId: params.actor.subjectId,
    };
  }

  const nowSeconds = params.deps.nowSeconds ?? Math.floor(Date.now() / 1000);
  let mostSpecificDenial: TenantAuthorizationDenial = 'GRANT_MISSING';

  for (const rawGrant of grants) {
    const decision = evaluateTenantCapability({
      grant: canonicalizeGrant(rawGrant),
      subjectId: params.actor.subjectId,
      organizationId: organization.canonicalOrgId,
      capability: params.capability,
      resource: params.resource ?? null,
      nowSeconds,
    });

    if (decision.allowed && decision.canonicalCapability) {
      return {
        allowed: true,
        via: 'grant',
        capability: decision.canonicalCapability,
        organizationId: organization.canonicalOrgId,
        subjectId: params.actor.subjectId,
        grantId: rawGrant.id,
      };
    }

    // Se conserva el motivo más informativo para la auditoría.
    if (decision.reason && decision.reason !== 'GRANT_MISSING') {
      mostSpecificDenial = decision.reason;
    }
  }

  return {
    allowed: false,
    reason: mostSpecificDenial,
    capability: capabilityHint,
    organizationId: organization.canonicalOrgId,
    subjectId: params.actor.subjectId,
  };
}

/**
 * Variante fail-closed para rutas: lanza `TenantAuthorizationError` si no se
 * autoriza. Nunca devuelve un valor ambiguo.
 */
export async function requireTenantCapability(
  params: Parameters<typeof authorizeTenantCapability>[0],
): Promise<Extract<TenantAuthorizationOutcome, { allowed: true }>> {
  const outcome = await authorizeTenantCapability(params);
  if (!outcome.allowed) {
    throw new TenantAuthorizationError(
      `403 Forbidden: capability '${params.capability}' no autorizada (${outcome.reason}).`,
      'FORBIDDEN_TENANT_CAPABILITY',
      outcome,
    );
  }
  return outcome;
}
