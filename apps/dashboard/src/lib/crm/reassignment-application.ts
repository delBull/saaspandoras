/**
 * P0.2 — Aplicación de una reasignación APROBADA.
 *
 * El propietario de la oportunidad cambia **solo** cuando la aprobación es
 * efectiva. Orden con compensación (no hay transacción entre ambos almacenes):
 *
 *   1. Validar solicitud (pendiente, misma org, decisor ≠ solicitante).
 *   2. Aprobada  → compare-and-set del propietario (ownerFrom → ownerTo).
 *        · si falla ⇒ CONFLICT, sin efectos.
 *        · si el CAS de la solicitud falla después ⇒ se COMPENSA el propietario
 *          y se reporta CONFLICT (nunca queda un cambio sin aprobación).
 *   3. Rechazada → CAS de la solicitud; el propietario no se toca.
 *
 * Toda aplicación exitosa deja actividad `assignment` con dueño previo y nuevo.
 */

import {
  decideReassignmentRequest,
  ReassignmentError,
  type ReassignmentRequestStore,
} from '@/lib/authorization/team-membership';
import type { CrmRepository, OpportunityRecord } from './opportunity-service';

export class ReassignmentApplicationError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'REQUEST_NOT_FOUND'
      | 'ORG_MISMATCH'
      | 'NOT_PENDING'
      | 'SELF_APPROVAL'
      | 'DECISION_NOTE_REQUIRED'
      | 'OWNER_CHANGED'
      | 'CONFLICT',
    readonly status = 409,
  ) {
    super(message);
    this.name = 'ReassignmentApplicationError';
  }
}

export interface ReassignmentApplicationResult {
  decision: 'approved' | 'rejected';
  applied: boolean;
  opportunityId: string;
  ownerTo: string;
  opportunity: OpportunityRecord | null;
}

export async function applyReassignmentDecision(params: {
  requests: ReassignmentRequestStore;
  repository: CrmRepository;
  organizationId: string;
  requestId: string;
  deciderId: string;
  decision: 'approved' | 'rejected';
  note?: string | null;
  nowSeconds: number;
  clock: () => string;
  newId: () => string;
}): Promise<ReassignmentApplicationResult> {
  const request = await params.requests.get(params.requestId);
  if (!request) {
    throw new ReassignmentApplicationError('Solicitud inexistente.', 'REQUEST_NOT_FOUND', 404);
  }
  if (request.organizationId !== params.organizationId) {
    throw new ReassignmentApplicationError(
      'La solicitud pertenece a otra organización.',
      'ORG_MISMATCH',
      404,
    );
  }
  if (request.status !== 'pending') {
    throw new ReassignmentApplicationError(
      `La solicitud no está pendiente (estado: '${request.status}').`,
      'NOT_PENDING',
    );
  }
  if (params.deciderId === request.requestedBy) {
    throw new ReassignmentApplicationError(
      'El solicitante no puede resolver su propia solicitud.',
      'SELF_APPROVAL',
      403,
    );
  }

  // Rechazo: solo se resuelve la solicitud; el propietario no cambia.
  if (params.decision === 'rejected') {
    if (!params.note?.trim()) {
      throw new ReassignmentApplicationError('El rechazo exige un motivo.', 'DECISION_NOTE_REQUIRED', 422);
    }

    await decideReassignmentRequest({
      store: params.requests,
      requestId: params.requestId,
      organizationId: params.organizationId,
      deciderId: params.deciderId,
      decision: 'rejected',
      note: params.note,
      nowSeconds: params.nowSeconds,
    });

    return {
      decision: 'rejected',
      applied: false,
      opportunityId: request.opportunityId,
      ownerTo: request.ownerTo,
      opportunity: await params.repository.getOpportunity(params.organizationId, request.opportunityId),
    };
  }

  // Aprobación: primero el propietario (único efecto observable), luego la solicitud.
  const ownerMoved = await params.repository.updateOwner(
    params.organizationId,
    request.opportunityId,
    request.ownerFrom,
    request.ownerTo,
  );

  if (!ownerMoved) {
    throw new ReassignmentApplicationError(
      'El propietario de la oportunidad cambió desde que se solicitó la reasignación.',
      'OWNER_CHANGED',
    );
  }

  try {
    await decideReassignmentRequest({
      store: params.requests,
      requestId: params.requestId,
      organizationId: params.organizationId,
      deciderId: params.deciderId,
      decision: 'approved',
      note: params.note ?? null,
      nowSeconds: params.nowSeconds,
    });
  } catch (error) {
    // Compensación: si la solicitud no pudo marcarse (decisión concurrente),
    // se devuelve el propietario a su valor previo.
    await params.repository.updateOwner(
      params.organizationId,
      request.opportunityId,
      request.ownerTo,
      request.ownerFrom,
    );

    if (error instanceof ReassignmentError) {
      throw new ReassignmentApplicationError(
        `No se pudo registrar la aprobación: ${error.message}`,
        error.code === 'CONFLICT' ? 'CONFLICT' : 'NOT_PENDING',
      );
    }
    throw error;
  }

  await params.repository.appendActivity({
    id: params.newId(),
    organizationId: params.organizationId,
    opportunityId: request.opportunityId,
    type: 'assignment',
    authorCollaboratorId: params.deciderId,
    content: params.note?.trim() || 'Reasignación aprobada',
    outcome: null,
    occurredAt: params.clock(),
    metadata: {
      previousOwner: request.ownerFrom,
      newOwner: request.ownerTo,
      approvalRequestId: request.id,
      decidedBy: params.deciderId,
    },
  });

  return {
    decision: 'approved',
    applied: true,
    opportunityId: request.opportunityId,
    ownerTo: request.ownerTo,
    opportunity: await params.repository.getOpportunity(params.organizationId, request.opportunityId),
  };
}
