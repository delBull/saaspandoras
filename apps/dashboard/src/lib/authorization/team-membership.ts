/**
 * P0.1 — Pertenencia a equipo y reasignación de propietario.
 *
 * El concepto de "equipo" NO se infiere por rol global, correo, frontend ni por
 * un campo enviado por el usuario. Se resuelve en SERVIDOR desde una fuente
 * autoritativa (`TeamMembershipRepository`) dentro de la organización canónica.
 *
 * Si la pertenencia no se puede resolver, la reasignación requiere aprobación
 * (fail-closed): nunca se aplica directo.
 */

export interface TeamMembershipRepository {
  /** Equipos del colaborador dentro de la organización. Vacío = sin equipo. */
  teamsOf(organizationId: string, collaboratorId: string): Promise<string[]>;
}

export type TeamResolution =
  | { resolvable: true; sameTeam: boolean; sharedTeams: string[] }
  | { resolvable: false; reason: 'NO_SOURCE' | 'QUERY_FAILED' };

/**
 * Determina si una reasignación cruza equipos.
 *
 * - Ambos con equipo y al menos uno compartido ⇒ mismo equipo (aplica directo).
 * - Ambos resueltos, sin equipos compartidos ⇒ cruza equipos (requiere aprobación).
 * - Cualquiera sin equipo resoluble o fallo de consulta ⇒ NO resoluble ⇒ requiere
 *   aprobación (fail-closed).
 */
export async function resolveTeamRelation(params: {
  repository: TeamMembershipRepository | null | undefined;
  organizationId: string;
  currentOwnerId: string;
  newOwnerId: string;
}): Promise<TeamResolution> {
  if (!params.repository) {
    return { resolvable: false, reason: 'NO_SOURCE' };
  }
  if (params.currentOwnerId === params.newOwnerId) {
    return { resolvable: true, sameTeam: true, sharedTeams: [] };
  }

  try {
    const [currentTeams, newTeams] = await Promise.all([
      params.repository.teamsOf(params.organizationId, params.currentOwnerId),
      params.repository.teamsOf(params.organizationId, params.newOwnerId),
    ]);

    if (currentTeams.length === 0 || newTeams.length === 0) {
      return { resolvable: false, reason: 'NO_SOURCE' };
    }

    const shared = currentTeams.filter((team) => newTeams.includes(team));
    return { resolvable: true, sameTeam: shared.length > 0, sharedTeams: shared };
  } catch {
    return { resolvable: false, reason: 'QUERY_FAILED' };
  }
}

export type ReassignmentDecision =
  | { decision: 'APPLY_DIRECTLY'; sameTeam: true }
  | { decision: 'REQUIRE_APPROVAL'; reason: 'CROSS_TEAM' | 'TEAM_UNRESOLVED' };

/**
 * Decide el camino de una reasignación. No aplica nada: solo decide.
 * La aplicación ocurre en `applyApprovedReassignment` o en el llamador para el
 * caso de mismo equipo.
 */
export async function decideReassignment(params: {
  repository: TeamMembershipRepository | null | undefined;
  organizationId: string;
  currentOwnerId: string;
  newOwnerId: string;
}): Promise<ReassignmentDecision> {
  const relation = await resolveTeamRelation(params);

  if (!relation.resolvable) {
    return { decision: 'REQUIRE_APPROVAL', reason: 'TEAM_UNRESOLVED' };
  }
  if (relation.sameTeam) {
    return { decision: 'APPLY_DIRECTLY', sameTeam: true };
  }
  return { decision: 'REQUIRE_APPROVAL', reason: 'CROSS_TEAM' };
}

// ── Solicitudes de aprobación ────────────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ReassignmentRequest {
  id: string;
  organizationId: string;
  opportunityId: string;
  ownerFrom: string;
  ownerTo: string;
  requestedBy: string;
  reason: string | null;
  status: ApprovalStatus;
  /** Quién resolvió la solicitud (humano distinto del solicitante). */
  decidedBy: string | null;
  decidedAt: number | null;
  decisionNote: string | null;
  createdAt: number;
}

export interface ReassignmentRequestStore {
  create(request: ReassignmentRequest): Promise<void>;
  get(id: string): Promise<ReassignmentRequest | null>;
  /** Compare-and-set: solo transiciona si el estado actual es `from`. */
  transition(
    id: string,
    from: ApprovalStatus,
    to: ApprovalStatus,
    patch: Partial<ReassignmentRequest>,
  ): Promise<boolean>;
}

export class ReassignmentError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'REQUEST_NOT_FOUND'
      | 'NOT_PENDING'
      | 'SELF_APPROVAL'
      | 'DECISION_NOTE_REQUIRED'
      | 'ORG_MISMATCH'
      | 'CONFLICT',
  ) {
    super(message);
    this.name = 'ReassignmentError';
  }
}

/**
 * Resuelve una solicitud pendiente.
 *
 * @returns `{ decision: 'approved', ownerTo }` SOLO si la aprobación es efectiva.
 *          Hasta ese momento el propietario de la oportunidad no cambia: el
 *          llamador únicamente aplica el cambio con este resultado.
 */
export async function decideReassignmentRequest(params: {
  store: ReassignmentRequestStore;
  requestId: string;
  organizationId: string;
  deciderId: string;
  decision: 'approved' | 'rejected';
  note?: string | null;
  nowSeconds: number;
}): Promise<{ decision: 'approved'; ownerTo: string } | { decision: 'rejected' }> {
  const request = await params.store.get(params.requestId);
  if (!request) {
    throw new ReassignmentError('Solicitud inexistente.', 'REQUEST_NOT_FOUND');
  }
  if (request.organizationId !== params.organizationId) {
    throw new ReassignmentError('La solicitud pertenece a otra organización.', 'ORG_MISMATCH');
  }
  if (request.status !== 'pending') {
    throw new ReassignmentError(
      `La solicitud no está pendiente (estado: '${request.status}').`,
      'NOT_PENDING',
    );
  }
  if (params.deciderId === request.requestedBy) {
    throw new ReassignmentError(
      'El solicitante no puede resolver su propia solicitud de reasignación.',
      'SELF_APPROVAL',
    );
  }
  if (params.decision === 'rejected' && !params.note?.trim()) {
    throw new ReassignmentError('El rechazo exige un motivo.', 'DECISION_NOTE_REQUIRED');
  }

  const won = await params.store.transition(
    request.id,
    'pending',
    params.decision,
    {
      decidedBy: params.deciderId,
      decidedAt: params.nowSeconds,
      decisionNote: params.note ?? null,
    },
  );
  if (!won) {
    throw new ReassignmentError('Transición concurrente detectada.', 'CONFLICT');
  }

  if (params.decision === 'approved') {
    return { decision: 'approved', ownerTo: request.ownerTo };
  }
  return { decision: 'rejected' };
}
