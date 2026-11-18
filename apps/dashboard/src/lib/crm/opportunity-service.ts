/**
 * P0.2 — CRM mínimo: dominio de oportunidades.
 *
 * Implementa las invariantes de la especificación congelada v1.0:
 *
 *  1. Toda oportunidad tiene `owner`.
 *  2. Etapa con `requiresNextAction` ⇒ `nextAction` + `nextActionAt`.
 *  3. Cierre (`ganada`/`perdida`) ⇒ `closeReason`; `ganada` ⇒ `estimatedValueUsd > 0`.
 *  4. `estimated_value_usd` es ESTIMACIÓN; `closed_revenue_usd` es el único ingreso.
 *  5. Cambio de dueño ⇒ actividad `assignment` (o solicitud pendiente si cruza equipos).
 *  6. Cambio de etapa ⇒ actividad `stage_change` (desde/hacia).
 *  7. No se gana sin contacto previo verificable.
 *  8. Origen (`source`/UTM) INMUTABLE tras crear (`originLockedAt`).
 *  9. Aislamiento por organización canónica; el cliente nunca la determina.
 * 10. Concurrencia: transición por compare-and-set (sin historiales contradictorios).
 */

import {
  decideReassignment,
  type ReassignmentDecision,
  type ReassignmentRequestStore,
  type TeamMembershipRepository,
} from '@/lib/authorization/team-membership';
import {
  DEFAULT_PIPELINE_NAME,
  FIRST_STAGE_KEY,
  findStage,
  isContactActivity,
} from './pipeline';

export type OpportunitySource =
  | 'meta_ads'
  | 'google_ads'
  | 'referral'
  | 'organic'
  | 'outbound'
  | 'event'
  | 'manual';

export type ActivityType =
  | 'call'
  | 'message'
  | 'email'
  | 'visit'
  | 'note'
  | 'stage_change'
  | 'assignment';

export interface OpportunityRecord {
  id: string;
  /** Organización canónica (autoridad). */
  organizationId: string;
  projectId: number;
  pipelineId: string;
  pipelineName: string;
  leadId: string | null;
  clientId: string | null;
  stageKey: string;
  ownerCollaboratorId: string;
  title: string;
  /** ESTIMACIÓN. Nunca ingresos. */
  estimatedValueUsd: number;
  /** Ingreso efectivamente cerrado. Solo al ganar. */
  closedRevenueUsd: number | null;
  currency: string;
  source: OpportunitySource;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  lastContactAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  originLockedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRecord {
  id: string;
  organizationId: string;
  opportunityId: string;
  type: ActivityType;
  authorCollaboratorId: string;
  content: string;
  outcome: string | null;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
}

export interface CrmRepository {
  createOpportunity(record: OpportunityRecord): Promise<void>;
  getOpportunity(organizationId: string, id: string): Promise<OpportunityRecord | null>;
  listOpportunities(
    organizationId: string,
    filters: { stageKey?: string; ownerCollaboratorId?: string; limit?: number; offset?: number },
  ): Promise<OpportunityRecord[]>;
  /** Compare-and-set sobre la etapa actual. */
  transitionStage(
    organizationId: string,
    id: string,
    fromStageKey: string,
    patch: Partial<OpportunityRecord> & { stageKey: string },
  ): Promise<boolean>;
  /** Compare-and-set sobre el propietario actual. */
  updateOwner(
    organizationId: string,
    id: string,
    fromOwnerId: string,
    toOwnerId: string,
  ): Promise<boolean>;
  setLastContactAt(organizationId: string, id: string, at: string): Promise<void>;
  appendActivity(record: ActivityRecord): Promise<void>;
  listActivities(organizationId: string, opportunityId: string): Promise<ActivityRecord[]>;
}

/**
 * Verificación de referencias. `null` = no verificable (fail-closed).
 */
export interface CrmReferenceChecker {
  /** ¿El lead pertenece al proyecto/organización? */
  leadBelongsToProject(leadId: string, projectId: number): Promise<boolean | null>;
  /**
   * Ámbito de `clients` para el CRM. `clients` NO está particionado por
   * organización en el esquema actual, así que v1 no puede garantizar propiedad.
   */
  clientScope(clientId: string): Promise<'scoped' | 'unscoped' | 'missing'>;
}

export type CrmErrorCode =
  | 'VALIDATION'
  | 'STAGE_UNKNOWN'
  | 'LEAD_ORG_MISMATCH'
  | 'LEAD_UNVERIFIABLE'
  | 'CLIENT_ORG_UNVERIFIABLE'
  | 'CONTACT_REQUIRED_BEFORE_WON'
  | 'CLOSE_REASON_REQUIRED'
  | 'NEXT_ACTION_REQUIRED'
  | 'ESTIMATED_VALUE_REQUIRED'
  | 'ORIGIN_IMMUTABLE'
  | 'OWNER_UNCHANGED'
  | 'NOT_FOUND'
  | 'CONFLICT';

export class CrmError extends Error {
  constructor(
    message: string,
    readonly code: CrmErrorCode,
    readonly status = 422,
  ) {
    super(message);
    this.name = 'CrmError';
  }
}

export interface OpportunityServiceOptions {
  repository: CrmRepository;
  references: CrmReferenceChecker;
  /** Fuente autoritativa de equipos (P0.1). Sin ella ⇒ reasignación con aprobación. */
  teams?: TeamMembershipRepository | null;
  /** Sustrato de aprobaciones (reutiliza `nexus_action_requests`). */
  reassignmentRequests?: ReassignmentRequestStore | null;
  clock?: () => string;
  newId?: () => string;
}

export interface CreateOpportunityInput {
  title: string;
  ownerCollaboratorId: string;
  estimatedValueUsd: number;
  source: OpportunitySource;
  currency?: string;
  leadId?: string | null;
  clientId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
}

export interface TransitionStageInput {
  stageKey: string;
  ownerCollaboratorId?: never;
  nextAction?: string | null;
  nextActionAt?: string | null;
  closeReason?: string | null;
  closedRevenueUsd?: number | null;
  note?: string | null;
}

export class OpportunityService {
  private readonly repo: CrmRepository;
  private readonly references: CrmReferenceChecker;
  private readonly teams: TeamMembershipRepository | null;
  private readonly requests: ReassignmentRequestStore | null;
  private readonly clock: () => string;
  private readonly newId: () => string;

  constructor(options: OpportunityServiceOptions) {
    this.repo = options.repository;
    this.references = options.references;
    this.teams = options.teams ?? null;
    this.requests = options.reassignmentRequests ?? null;
    this.clock = options.clock ?? (() => new Date().toISOString());
    this.newId = options.newId ?? (() => crypto.randomUUID());
  }

  async createOpportunity(params: {
    organizationId: string;
    projectId: number;
    actorId: string;
    input: CreateOpportunityInput;
  }): Promise<{ opportunity: OpportunityRecord; activities: ActivityRecord[] }> {
    const { input } = params;

    if (!params.organizationId) {
      throw new CrmError('Falta la organización canónica.', 'VALIDATION');
    }
    const title = (input.title ?? '').trim();
    if (!title) throw new CrmError('El título es obligatorio.', 'VALIDATION');
    if (!input.ownerCollaboratorId) {
      throw new CrmError('La oportunidad exige propietario.', 'VALIDATION');
    }
    if (!Number.isFinite(input.estimatedValueUsd) || input.estimatedValueUsd < 0) {
      throw new CrmError('estimatedValueUsd debe ser un número ≥ 0.', 'VALIDATION');
    }
    if (!input.source) throw new CrmError('source es obligatorio (origen inmutable).', 'VALIDATION');

    // Referencias: nunca se confía en el ID enviado.
    if (input.leadId) {
      const belongs = await this.references.leadBelongsToProject(input.leadId, params.projectId);
      if (belongs === null) {
        throw new CrmError(
          'No se pudo verificar la organización del lead: se rechaza (fail-closed).',
          'LEAD_UNVERIFIABLE',
        );
      }
      if (!belongs) {
        throw new CrmError(
          'El lead pertenece a otra organización.',
          'LEAD_ORG_MISMATCH',
        );
      }
    }

    if (input.clientId) {
      const scope = await this.references.clientScope(input.clientId);
      if (scope !== 'scoped') {
        throw new CrmError(
          scope === 'missing'
            ? 'El cliente no existe.'
            : 'El cliente no está particionado por organización en el modelo actual: no se puede garantizar propiedad.',
          'CLIENT_ORG_UNVERIFIABLE',
        );
      }
    }

    const now = this.clock();
    const opportunity: OpportunityRecord = {
      id: this.newId(),
      organizationId: params.organizationId,
      projectId: params.projectId,
      pipelineId: `default:${params.organizationId}`,
      pipelineName: DEFAULT_PIPELINE_NAME,
      leadId: input.leadId ?? null,
      clientId: input.clientId ?? null,
      stageKey: FIRST_STAGE_KEY,
      ownerCollaboratorId: input.ownerCollaboratorId,
      title,
      estimatedValueUsd: input.estimatedValueUsd,
      closedRevenueUsd: null,
      currency: (input.currency ?? 'USD').toUpperCase(),
      source: input.source,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      nextAction: input.nextAction ?? null,
      nextActionAt: input.nextActionAt ?? null,
      lastContactAt: null,
      closedAt: null,
      closeReason: null,
      // Origen bloqueado desde el nacimiento.
      originLockedAt: now,
      createdBy: params.actorId,
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.createOpportunity(opportunity);

    const creation: ActivityRecord = {
      id: this.newId(),
      organizationId: params.organizationId,
      opportunityId: opportunity.id,
      type: 'note',
      authorCollaboratorId: params.actorId,
      content: 'Oportunidad creada',
      outcome: null,
      occurredAt: now,
      metadata: {
        event: 'opportunity_created',
        stageKey: FIRST_STAGE_KEY,
        source: opportunity.source,
        originLockedAt: opportunity.originLockedAt,
      },
    };
    await this.repo.appendActivity(creation);

    return { opportunity, activities: [creation] };
  }

  async transitionStage(params: {
    organizationId: string;
    opportunityId: string;
    actorId: string;
    input: TransitionStageInput;
  }): Promise<{ opportunity: OpportunityRecord; activity: ActivityRecord }> {
    const current = await this.requireOpportunity(params.organizationId, params.opportunityId);
    const target = findStage(params.input.stageKey);

    if (!target) {
      throw new CrmError(`Etapa desconocida: '${params.input.stageKey}'.`, 'STAGE_UNKNOWN');
    }
    if (target.key === current.stageKey) {
      throw new CrmError('La oportunidad ya está en esa etapa.', 'VALIDATION');
    }

    const nextAction = params.input.nextAction ?? current.nextAction;
    const nextActionAt = params.input.nextActionAt ?? current.nextActionAt;

    if (target.requiresNextAction && (!nextAction || !nextActionAt)) {
      throw new CrmError(
        `La etapa '${target.key}' exige próxima acción y fecha.`,
        'NEXT_ACTION_REQUIRED',
      );
    }

    let closedRevenue = current.closedRevenueUsd;
    let closeReason = current.closeReason;
    let closedAt = current.closedAt;

    if (target.kind === 'won' || target.kind === 'lost') {
      const reason = (params.input.closeReason ?? '').trim();
      if (!reason) {
        throw new CrmError('El cierre exige motivo (closeReason).', 'CLOSE_REASON_REQUIRED');
      }
      closeReason = reason;

      if (target.kind === 'won') {
        if (!(current.estimatedValueUsd > 0)) {
          throw new CrmError(
            'No se puede ganar con estimatedValueUsd = 0.',
            'ESTIMATED_VALUE_REQUIRED',
          );
        }
        const activities = await this.repo.listActivities(params.organizationId, current.id);
        const hasContact = activities.some((activity) => isContactActivity(activity.type));
        if (!hasContact) {
          throw new CrmError(
            'No se puede marcar como ganada sin contacto previo verificable.',
            'CONTACT_REQUIRED_BEFORE_WON',
          );
        }
        if (params.input.closedRevenueUsd !== undefined && params.input.closedRevenueUsd !== null) {
          if (!Number.isFinite(params.input.closedRevenueUsd) || params.input.closedRevenueUsd < 0) {
            throw new CrmError('closedRevenueUsd debe ser ≥ 0.', 'VALIDATION');
          }
          closedRevenue = params.input.closedRevenueUsd;
        }
      }

      closedAt = this.clock();
    }

    const now = this.clock();
    const won = await this.repo.transitionStage(params.organizationId, current.id, current.stageKey, {
      stageKey: target.key,
      nextAction: nextAction ?? null,
      nextActionAt: nextActionAt ?? null,
      closedRevenueUsd: closedRevenue,
      closeReason,
      closedAt,
      updatedAt: now,
    });

    if (!won) {
      throw new CrmError(
        'Transición concurrente detectada: la oportunidad cambió de etapa.',
        'CONFLICT',
        409,
      );
    }

    const activity: ActivityRecord = {
      id: this.newId(),
      organizationId: params.organizationId,
      opportunityId: current.id,
      type: 'stage_change',
      authorCollaboratorId: params.actorId,
      content: params.input.note?.trim() || `Etapa: ${current.stageKey} → ${target.key}`,
      outcome: null,
      occurredAt: now,
      metadata: {
        from: current.stageKey,
        to: target.key,
        closeReason: closeReason ?? null,
        closedRevenueUsd: closedRevenue,
      },
    };
    await this.repo.appendActivity(activity);

    const updated = await this.requireOpportunity(params.organizationId, current.id);
    return { opportunity: updated, activity };
  }

  /**
   * Reasigna propietario.
   *
   * - Mismo equipo ⇒ se aplica y se registra actividad `assignment`.
   * - Cruza equipos o equipo no resuelto ⇒ se crea solicitud PENDIENTE y el
   *   propietario NO cambia.
   */
  async reassignOwner(params: {
    organizationId: string;
    opportunityId: string;
    actorId: string;
    newOwnerCollaboratorId: string;
    reason?: string | null;
  }): Promise<{
    applied: boolean;
    decision: ReassignmentDecision['decision'] | 'APPLIED';
    reason?: string;
    requestId?: string;
    opportunity: OpportunityRecord;
  }> {
    const current = await this.requireOpportunity(params.organizationId, params.opportunityId);

    if (!params.newOwnerCollaboratorId) {
      throw new CrmError('Falta el nuevo propietario.', 'VALIDATION');
    }
    if (params.newOwnerCollaboratorId === current.ownerCollaboratorId) {
      throw new CrmError('El nuevo propietario es el actual.', 'OWNER_UNCHANGED');
    }

    const decision = await decideReassignment({
      repository: this.teams,
      organizationId: params.organizationId,
      currentOwnerId: current.ownerCollaboratorId,
      newOwnerId: params.newOwnerCollaboratorId,
    });

    if (decision.decision === 'REQUIRE_APPROVAL') {
      if (!this.requests) {
        throw new CrmError(
          'No hay sustrato de aprobaciones configurado: la reasignación no se aplica.',
          'VALIDATION',
          503,
        );
      }

      const requestId = this.newId();
      await this.requests.create({
        id: requestId,
        organizationId: params.organizationId,
        opportunityId: current.id,
        ownerFrom: current.ownerCollaboratorId,
        ownerTo: params.newOwnerCollaboratorId,
        requestedBy: params.actorId,
        reason: params.reason ?? null,
        status: 'pending',
        decidedBy: null,
        decidedAt: null,
        decisionNote: null,
        createdAt: Math.floor(new Date(this.clock()).getTime() / 1000),
      });

      return {
        applied: false,
        decision: 'REQUIRE_APPROVAL',
        reason: decision.reason,
        requestId,
        opportunity: current,
      };
    }

    const now = this.clock();
    const applied = await this.repo.updateOwner(
      params.organizationId,
      current.id,
      current.ownerCollaboratorId,
      params.newOwnerCollaboratorId,
    );
    if (!applied) {
      throw new CrmError('Transición concurrente detectada en el propietario.', 'CONFLICT', 409);
    }

    await this.repo.appendActivity({
      id: this.newId(),
      organizationId: params.organizationId,
      opportunityId: current.id,
      type: 'assignment',
      authorCollaboratorId: params.actorId,
      content: params.reason?.trim() || 'Reasignación de propietario',
      outcome: null,
      occurredAt: now,
      metadata: {
        previousOwner: current.ownerCollaboratorId,
        newOwner: params.newOwnerCollaboratorId,
      },
    });

    return {
      applied: true,
      decision: 'APPLIED',
      opportunity: await this.requireOpportunity(params.organizationId, current.id),
    };
  }

  /**
   * Registra actividad manual. Las de contacto actualizan `lastContactAt`.
   * `stage_change` y `assignment` NO se aceptan aquí: las produce el dominio.
   */
  async logActivity(params: {
    organizationId: string;
    opportunityId: string;
    actorId: string;
    type: ActivityType;
    content: string;
    outcome?: string | null;
  }): Promise<ActivityRecord> {
    if (params.type === 'stage_change' || params.type === 'assignment') {
      throw new CrmError(
        'Las actividades de etapa y asignación las genera el sistema, no el cliente.',
        'VALIDATION',
      );
    }
    const content = (params.content ?? '').trim();
    if (!content) throw new CrmError('La actividad exige contenido.', 'VALIDATION');

    const opportunity = await this.requireOpportunity(params.organizationId, params.opportunityId);
    const now = this.clock();

    const activity: ActivityRecord = {
      id: this.newId(),
      organizationId: params.organizationId,
      opportunityId: opportunity.id,
      type: params.type,
      authorCollaboratorId: params.actorId,
      content,
      outcome: params.outcome ?? null,
      occurredAt: now,
      metadata: null,
    };
    await this.repo.appendActivity(activity);

    if (isContactActivity(params.type)) {
      await this.repo.setLastContactAt(params.organizationId, opportunity.id, now);
    }

    return activity;
  }

  async getOpportunity(params: {
    organizationId: string;
    opportunityId: string;
  }): Promise<{ opportunity: OpportunityRecord; activities: ActivityRecord[] }> {
    const opportunity = await this.requireOpportunity(params.organizationId, params.opportunityId);
    const activities = await this.repo.listActivities(params.organizationId, opportunity.id);
    return { opportunity, activities };
  }

  async listOpportunities(params: {
    organizationId: string;
    stageKey?: string;
    ownerCollaboratorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<OpportunityRecord[]> {
    return this.repo.listOpportunities(params.organizationId, {
      stageKey: params.stageKey,
      ownerCollaboratorId: params.ownerCollaboratorId,
      limit: Math.min(Math.max(params.limit ?? 25, 1), 100),
      offset: Math.max(params.offset ?? 0, 0),
    });
  }

  /** Intento de reescribir el origen: siempre se rechaza. */
  assertOriginImmutable(patch: Record<string, unknown>): void {
    for (const field of ['source', 'utmSource', 'utmMedium', 'utmCampaign', 'originLockedAt']) {
      if (patch[field] !== undefined) {
        throw new CrmError(
          'El origen (source/UTM) es inmutable desde la creación.',
          'ORIGIN_IMMUTABLE',
          403,
        );
      }
    }
  }

  private async requireOpportunity(
    organizationId: string,
    id: string,
  ): Promise<OpportunityRecord> {
    const record = await this.repo.getOpportunity(organizationId, id);
    if (!record) {
      throw new CrmError('Oportunidad no encontrada.', 'NOT_FOUND', 404);
    }
    return record;
  }
}

/**
 * Ingresos: SOLO `closedRevenueUsd` de oportunidades ganadas.
 * La estimación nunca se suma como ingreso.
 */
export function summarizeRevenue(opportunities: readonly OpportunityRecord[]): {
  closedRevenueUsd: number;
  estimatedValueUsd: number;
  wonCount: number;
} {
  let closedRevenueUsd = 0;
  let estimatedValueUsd = 0;
  let wonCount = 0;

  for (const opportunity of opportunities) {
    if (opportunity.stageKey === 'ganada') {
      wonCount += 1;
      closedRevenueUsd += opportunity.closedRevenueUsd ?? 0;
    }
    estimatedValueUsd += opportunity.estimatedValueUsd;
  }

  return { closedRevenueUsd, estimatedValueUsd, wonCount };
}
