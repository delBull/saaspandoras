/**
 * 🪪 Almacén y compuerta de agentes (ADR-021, fase 2)
 *
 * `resolveAgentContext` es la compuerta única: valida la clave por petición
 * (sin caché), comprueba vigencia, delegación activa, límites y devuelve el
 * contexto autorizado. Si algo no cuadra, devuelve `null` (fail-closed).
 */
import { db } from '@saasfly/db-core';
import {
  agentActionProposals,
  agentKeys,
  agentDelegations,
  agentLimits,
  nexusCollaborators,
} from '@saasfly/db-core/schema';
import { and, desc, eq, gt } from '@saasfly/db-core';
import {
  AGENT_KEY_DEFAULT_DAYS,
  createAgentKey,
  extractAgentKey,
  hashAgentKey,
  isResourceInScope,
  isWithinValidity,
  normalizeDelegationDays,
  requiresHumanApproval,
} from './agent-identity';

export interface AgentContext {
  agentKeyId: string;
  collaboratorId: number;
  canonicalOrgId: string;
  label: string;
  capabilities: string[];
  scope: Record<string, string[]>;
  delegationId: string;
  limits: {
    maxMutationsPerHour: number;
    requireApprovalFor: string[];
    autoSuspendOnAnomaly: boolean;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Crea una clave de agente para el colaborador y sus límites por defecto. */
export async function issueAgentKey(input: {
  collaboratorId: number;
  canonicalOrgId: string;
  label: string;
  createdBy: string;
  days?: number;
}) {
  const { raw, prefix, hash } = createAgentKey();
  const days = Math.min(Math.max(1, input.days ?? AGENT_KEY_DEFAULT_DAYS), 365);
  const expiresAt = new Date(Date.now() + days * DAY_MS);

  const [row] = await db
    .insert(agentKeys)
    .values({
      collaboratorId: input.collaboratorId,
      canonicalOrgId: input.canonicalOrgId,
      label: input.label.slice(0, 120),
      keyPrefix: prefix,
      keyHash: hash,
      status: 'ACTIVE',
      expiresAt,
      createdBy: input.createdBy,
    })
    .returning();

  if (!row) {
    // Sin fila no hay clave: se falla cerrado en vez de devolver un secreto huérfano.
    throw new Error('AGENT_KEY_INSERT_FAILED');
  }

  await db
    .insert(agentLimits)
    .values({ agentKeyId: row.id })
    .onConflictDoNothing();

  // El valor en claro sólo viaja en esta respuesta.
  return { key: row, raw, expiresAt };
}

export async function listAgentKeys(collaboratorId: number) {
  const keys = await db
    .select({
      id: agentKeys.id,
      label: agentKeys.label,
      keyPrefix: agentKeys.keyPrefix,
      status: agentKeys.status,
      expiresAt: agentKeys.expiresAt,
      lastUsedAt: agentKeys.lastUsedAt,
      createdAt: agentKeys.createdAt,
    })
    .from(agentKeys)
    .where(eq(agentKeys.collaboratorId, collaboratorId))
    .orderBy(desc(agentKeys.createdAt))
    .limit(50);

  const delegations = await db
    .select()
    .from(agentDelegations)
    .where(eq(agentDelegations.collaboratorId, collaboratorId))
    .orderBy(desc(agentDelegations.createdAt))
    .limit(50);

  return { keys, delegations };
}

/** Revoca una clave (y con ella todas sus delegaciones, por cascade). */
export async function revokeAgentKey(input: {
  keyId: string;
  collaboratorId?: number | null;
  reason?: string | null;
}) {
  const where = input.collaboratorId
    ? and(eq(agentKeys.id, input.keyId), eq(agentKeys.collaboratorId, input.collaboratorId))
    : eq(agentKeys.id, input.keyId);

  const [row] = await db
    .update(agentKeys)
    .set({ status: 'REVOKED', revokedAt: new Date(), revokeReason: input.reason ?? null })
    .where(where)
    .returning({ id: agentKeys.id, status: agentKeys.status });

  return row ?? null;
}

/** Crea la solicitud de delegación (queda PENDING hasta que el owner apruebe). */
export async function requestDelegation(input: {
  agentKeyId: string;
  collaboratorId: number;
  capabilities: string[];
  scope: Record<string, string[]>;
  requestedBy: string;
  days?: number;
}) {
  const days = normalizeDelegationDays(input.days);
  const [row] = await db
    .insert(agentDelegations)
    .values({
      agentKeyId: input.agentKeyId,
      collaboratorId: input.collaboratorId,
      capabilities: input.capabilities,
      scope: input.scope,
      status: 'PENDING',
      requestedBy: input.requestedBy,
      expiresAt: new Date(Date.now() + days * DAY_MS),
    })
    .returning();

  return row;
}

/** Aprueba, rechaza o revoca una delegación. */
export async function decideDelegation(input: {
  id: string;
  decision: 'APPROVE' | 'REJECT' | 'REVOKE';
  actor: string;
  reason?: string | null;
}) {
  const patch =
    input.decision === 'APPROVE'
      ? { status: 'ACTIVE', approvedBy: input.actor, approvedAt: new Date() }
      : input.decision === 'REJECT'
        ? { status: 'REJECTED', approvedBy: input.actor, approvedAt: new Date(), revokeReason: input.reason ?? null }
        : { status: 'REVOKED', revokedAt: new Date(), revokeReason: input.reason ?? null };

  const [row] = await db
    .update(agentDelegations)
    .set(patch)
    .where(eq(agentDelegations.id, input.id))
    .returning();

  return row ?? null;
}

/**
 * Compuerta de ejecución. Valida:
 *   1. la clave existe y está ACTIVE y vigente,
 *   2. la delegación está ACTIVE y vigente,
 *   3. la capability pedida (si se indica) está delegada,
 *   4. el recurso (si se indica) cae en el scope,
 *   5. la acción no está en `require_approval_for`.
 *
 * Devuelve `null` si algo falla: nunca "casi autorizado".
 */
export async function resolveAgentContext(
  headers: Headers,
  requirement?: { capability?: string; resource?: { type: string; id: string }; action?: string },
): Promise<AgentContext | null> {
  const raw = extractAgentKey(headers);
  if (!raw) return null;

  const [key] = await db
    .select()
    .from(agentKeys)
    .where(eq(agentKeys.keyHash, hashAgentKey(raw)))
    .limit(1);

  if (!key || !isWithinValidity(key)) return null;

  const [delegation] = await db
    .select()
    .from(agentDelegations)
    .where(
      and(
        eq(agentDelegations.agentKeyId, key.id),
        eq(agentDelegations.status, 'ACTIVE'),
      ),
    )
    .orderBy(desc(agentDelegations.createdAt))
    .limit(1);

  if (!delegation || !isWithinValidity(delegation)) return null;

  const capabilities = (delegation.capabilities ?? []).map((c) => String(c).toLowerCase());
  const scope = (delegation.scope ?? {}) as Record<string, string[]>;

  if (requirement?.capability && !capabilities.includes(requirement.capability.toLowerCase())) {
    return null;
  }
  if (requirement?.resource && !isResourceInScope(scope, requirement.resource)) {
    return null;
  }

  const [limits] = await db
    .select()
    .from(agentLimits)
    .where(eq(agentLimits.agentKeyId, key.id))
    .limit(1);

  const requireApprovalFor = (limits?.requireApprovalFor ?? []) as string[];
  if (requirement?.action && requiresHumanApproval(requirement.action, requireApprovalFor)) {
    return null;
  }

  // Marca de uso (best-effort: no bloquea la operación si falla).
  void db
    .update(agentKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(agentKeys.id, key.id))
    .catch(() => undefined);

  return {
    agentKeyId: key.id,
    collaboratorId: key.collaboratorId,
    canonicalOrgId: key.canonicalOrgId,
    label: key.label,
    capabilities,
    scope,
    delegationId: delegation.id,
    limits: {
      maxMutationsPerHour: limits?.maxMutationsPerHour ?? 60,
      requireApprovalFor,
      autoSuspendOnAnomaly: limits?.autoSuspendOnAnomaly ?? true,
    },
  };
}

/** Permisos delegables de una persona (los que puede pedir para su agente). */
export function delegableCapabilities(collaborator: {
  role?: string | null;
  permissions?: Record<string, boolean> | null;
}): string[] {
  const role = String(collaborator.role ?? '').toUpperCase();
  const perms = (collaborator.permissions ?? {}) as Record<string, boolean>;
  const out = new Set<string>();

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    out.add('developer');
  }
  for (const flag of ['developer', 'dealRoom', 'settings', 'hermesQa', 'academy']) {
    if (perms[flag] === true) out.add(flag);
  }
  return Array.from(out).sort();
}

/** Colaborador por id (para validar que la clave le pertenece). */
export async function findCollaborator(id: number) {
  const [row] = await db
    .select({
      id: nexusCollaborators.id,
      name: nexusCollaborators.name,
      email: nexusCollaborators.email,
      role: nexusCollaborators.role,
      permissions: nexusCollaborators.permissions,
      status: nexusCollaborators.status,
    })
    .from(nexusCollaborators)
    .where(eq(nexusCollaborators.id, id))
    .limit(1);
  return row ?? null;
}

/** Propuestas creadas por esta clave en la última hora (límite de la fase 5). */
export async function countRecentProposals(agentKeyId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const rows = await db
    .select({ id: agentActionProposals.id })
    .from(agentActionProposals)
    .where(
      and(
        eq(agentActionProposals.agentKeyId, agentKeyId),
        gt(agentActionProposals.createdAt, since),
      ),
    )
    .limit(500);
  return rows.length;
}

/** Suspende una clave (emergencia o exceso de límite). */
export async function suspendAgentKey(agentKeyId: string, reason: string) {
  await db
    .update(agentKeys)
    .set({ status: 'SUSPENDED', revokeReason: reason.slice(0, 300) })
    .where(eq(agentKeys.id, agentKeyId));
}

/** Registra la propuesta del agente (nunca ejecuta). */
export async function proposeAgentAction(input: {
  context: AgentContext;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
}) {
  const [row] = await db
    .insert(agentActionProposals)
    .values({
      agentKeyId: input.context.agentKeyId,
      delegationId: input.context.delegationId,
      collaboratorId: input.context.collaboratorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      payload: input.payload,
      status: 'PENDING',
      proposedBy: input.context.label,
    })
    .returning();

  return row ?? null;
}
