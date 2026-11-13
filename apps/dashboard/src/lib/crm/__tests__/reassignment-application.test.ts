/**
 * 🧪 TESTS: aplicación de reasignaciones aprobadas (P0.2).
 *
 * Demuestran que el propietario cambia SOLO con aprobación efectiva, que el
 * solicitante no puede aprobar lo suyo, que no hay efectos parciales y que la
 * actividad `assignment` conserva dueño previo y nuevo.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyReassignmentDecision,
  ReassignmentApplicationError,
} from '../reassignment-application';
import { InMemoryCrmRepository } from '../memory-repository';
import { OpportunityService } from '../opportunity-service';
import type {
  ReassignmentRequest,
  ReassignmentRequestStore,
  TeamMembershipRepository,
} from '@/lib/authorization/team-membership';

const ORG = 'org-celeste-uuid';
const PROJECT = 42;
const NOW = 1_800_000_000;

class MemoryRequests implements ReassignmentRequestStore {
  rows: ReassignmentRequest[] = [];
  async create(request: ReassignmentRequest) {
    this.rows.push({ ...request });
  }
  async get(id: string) {
    const found = this.rows.find((r) => r.id === id);
    return found ? { ...found } : null;
  }
  async transition(
    id: string,
    from: ReassignmentRequest['status'],
    to: ReassignmentRequest['status'],
    patch: Partial<ReassignmentRequest>,
  ) {
    const index = this.rows.findIndex((r) => r.id === id);
    if (index === -1 || this.rows[index]!.status !== from) return false;
    this.rows[index] = { ...this.rows[index]!, ...patch, status: to };
    return true;
  }
}

const teams: TeamMembershipRepository = {
  teamsOf: async (_org, collaboratorId) =>
    collaboratorId === 'human_3' ? ['marketing'] : ['ventas'],
};

describe('applyReassignmentDecision (P0.2)', () => {
  let repo: InMemoryCrmRepository;
  let requests: MemoryRequests;
  let service: OpportunityService;
  let seq = 0;

  beforeEach(() => {
    repo = new InMemoryCrmRepository();
    requests = new MemoryRequests();
    seq = 0;
    service = new OpportunityService({
      repository: repo,
      references: {
        leadBelongsToProject: async () => true,
        clientScope: async () => 'unscoped',
      },
      teams,
      reassignmentRequests: requests,
      newId: () => `id_${++seq}`,
      clock: () => '2026-11-13T10:00:00.000Z',
    });
  });

  async function pendingRequest() {
    const { opportunity } = await service.createOpportunity({
      organizationId: ORG,
      projectId: PROJECT,
      actorId: 'human_1',
      input: {
        title: 'Fracción Punta Mita',
        ownerCollaboratorId: 'human_1',
        estimatedValueUsd: 150000,
        source: 'meta_ads',
      },
    });

    const result = await service.reassignOwner({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      newOwnerCollaboratorId: 'human_3',
      reason: 'cambio de cartera',
    });

    return { opportunityId: opportunity.id, requestId: result.requestId! };
  }

  function decide(params: {
    requestId: string;
    deciderId: string;
    decision: 'approved' | 'rejected';
    note?: string | null;
    organizationId?: string;
  }) {
    return applyReassignmentDecision({
      requests,
      repository: repo,
      organizationId: params.organizationId ?? ORG,
      requestId: params.requestId,
      deciderId: params.deciderId,
      decision: params.decision,
      note: params.note ?? null,
      nowSeconds: NOW,
      clock: () => '2026-11-13T11:00:00.000Z',
      newId: () => `id_${++seq}`,
    });
  }

  it('RA-01: la aprobación aplica el propietario y deja actividad con previo/nuevo', async () => {
    const { opportunityId, requestId } = await pendingRequest();

    // Antes de aprobar, el dueño sigue siendo el original.
    expect((await repo.getOpportunity(ORG, opportunityId))?.ownerCollaboratorId).toBe('human_1');

    const result = await decide({ requestId, deciderId: 'human_manager', decision: 'approved' });

    expect(result.applied).toBe(true);
    expect(result.ownerTo).toBe('human_3');
    expect(result.opportunity?.ownerCollaboratorId).toBe('human_3');
    expect((await requests.get(requestId))?.status).toBe('approved');

    const activities = await repo.listActivities(ORG, opportunityId);
    const assignment = activities.find((a) => a.type === 'assignment');
    expect(assignment?.metadata).toMatchObject({
      previousOwner: 'human_1',
      newOwner: 'human_3',
      approvalRequestId: requestId,
      decidedBy: 'human_manager',
    });
  });

  it('RA-02: el rechazo no cambia al propietario y exige motivo', async () => {
    const { opportunityId, requestId } = await pendingRequest();

    await expect(
      decide({ requestId, deciderId: 'human_manager', decision: 'rejected', note: '  ' }),
    ).rejects.toMatchObject({ code: 'DECISION_NOTE_REQUIRED' });

    const result = await decide({
      requestId,
      deciderId: 'human_manager',
      decision: 'rejected',
      note: 'no procede',
    });

    expect(result.applied).toBe(false);
    expect((await repo.getOpportunity(ORG, opportunityId))?.ownerCollaboratorId).toBe('human_1');
    expect((await requests.get(requestId))?.status).toBe('rejected');
  });

  it('RA-03: el solicitante no puede resolver su propia solicitud', async () => {
    const { opportunityId, requestId } = await pendingRequest();

    await expect(
      decide({ requestId, deciderId: 'human_1', decision: 'approved' }),
    ).rejects.toMatchObject({ code: 'SELF_APPROVAL' });

    expect((await repo.getOpportunity(ORG, opportunityId))?.ownerCollaboratorId).toBe('human_1');
    expect((await requests.get(requestId))?.status).toBe('pending');
  });

  it('RA-04: solicitud de otra organización ⇒ ORG_MISMATCH, sin efectos', async () => {
    const { opportunityId, requestId } = await pendingRequest();

    await expect(
      decide({
        requestId,
        deciderId: 'human_manager',
        decision: 'approved',
        organizationId: 'otra-org',
      }),
    ).rejects.toMatchObject({ code: 'ORG_MISMATCH' });

    expect((await repo.getOpportunity(ORG, opportunityId))?.ownerCollaboratorId).toBe('human_1');
  });

  it('RA-05: si el propietario cambió mientras estaba pendiente ⇒ OWNER_CHANGED y NINGÚN efecto', async () => {
    const { opportunityId, requestId } = await pendingRequest();

    // Cambio externo del propietario antes de resolver.
    await repo.updateOwner(ORG, opportunityId, 'human_1', 'human_2');

    await expect(
      decide({ requestId, deciderId: 'human_manager', decision: 'approved' }),
    ).rejects.toBeInstanceOf(ReassignmentApplicationError);

    expect((await repo.getOpportunity(ORG, opportunityId))?.ownerCollaboratorId).toBe('human_2');
    expect((await requests.get(requestId))?.status).toBe('pending');
  });

  it('RA-06: una solicitud ya resuelta no se vuelve a aplicar (idempotencia de decisión)', async () => {
    const { requestId } = await pendingRequest();

    await decide({ requestId, deciderId: 'human_manager', decision: 'approved' });

    await expect(
      decide({ requestId, deciderId: 'human_manager', decision: 'approved' }),
    ).rejects.toMatchObject({ code: 'NOT_PENDING' });
  });

  it('RA-07: si la solicitud no puede marcarse, el propietario se COMPENSA', async () => {
    const { opportunityId, requestId } = await pendingRequest();

    // Se fuerza un fallo del CAS de la solicitud: la transición siempre falla.
    const brokenStore: ReassignmentRequestStore = {
      create: (request) => requests.create(request),
      get: (id) => requests.get(id),
      transition: async () => false,
    };

    await expect(
      applyReassignmentDecision({
        requests: brokenStore,
        repository: repo,
        organizationId: ORG,
        requestId,
        deciderId: 'human_manager',
        decision: 'approved',
        note: null,
        nowSeconds: NOW,
        clock: () => '2026-11-13T11:00:00.000Z',
        newId: () => `id_${++seq}`,
      }),
    ).rejects.toBeInstanceOf(ReassignmentApplicationError);

    // Compensación: el propietario vuelve a su valor previo.
    expect((await repo.getOpportunity(ORG, opportunityId))?.ownerCollaboratorId).toBe('human_1');
    const activities = await repo.listActivities(ORG, opportunityId);
    expect(activities.some((a) => a.type === 'assignment')).toBe(false);
  });

  it('RA-08: solicitud inexistente ⇒ REQUEST_NOT_FOUND', async () => {
    await expect(
      decide({ requestId: 'req_fantasma', deciderId: 'human_manager', decision: 'approved' }),
    ).rejects.toMatchObject({ code: 'REQUEST_NOT_FOUND' });
  });
});
