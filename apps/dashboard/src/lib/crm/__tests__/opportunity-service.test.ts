/**
 * 🧪 TESTS: P0.2 — CRM mínimo.
 *
 * Cubren las invariantes de la especificación congelada y los casos adversariales
 * (CRM-12…19 incluidos): aislamiento, origen inmutable, estimación ≠ ingreso,
 * contacto verificable para ganar, concurrencia y aprobación al cruzar equipos.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  CrmError,
  OpportunityService,
  summarizeRevenue,
  type CrmReferenceChecker,
  type OpportunityRecord,
} from '../opportunity-service';
import { InMemoryCrmRepository } from '../memory-repository';
import type {
  ReassignmentRequestStore,
  ReassignmentRequest,
  TeamMembershipRepository,
} from '@/lib/authorization/team-membership';

const ORG = 'org-celeste-uuid';
const ORG_B = 'org-otra-uuid';
const PROJECT = 42;

const references: CrmReferenceChecker = {
  leadBelongsToProject: async (leadId, projectId) => {
    if (leadId === 'lead_unverifiable') return null;
    if (leadId === 'lead_org_b') return false;
    return projectId === PROJECT;
  },
  clientScope: async (clientId) => {
    if (clientId === 'client_missing') return 'missing';
    return 'unscoped';
  },
};

function teams(map: Record<string, string[]>): TeamMembershipRepository {
  return { teamsOf: async (_org, collaboratorId) => map[collaboratorId] ?? [] };
}

class MemoryRequests implements ReassignmentRequestStore {
  rows: ReassignmentRequest[] = [];
  async create(request: ReassignmentRequest) {
    this.rows.push(request);
  }
  async get(id: string) {
    return this.rows.find((r) => r.id === id) ?? null;
  }
  async transition() {
    return false;
  }
}

describe('P0.2 — CRM mínimo', () => {
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
      references,
      teams: teams({ human_1: ['ventas'], human_2: ['ventas'], human_3: ['marketing'] }),
      reassignmentRequests: requests,
      newId: () => `id_${++seq}`,
      clock: () => '2026-11-13T10:00:00.000Z',
    });
  });

  async function create(overrides: Partial<Parameters<OpportunityService['createOpportunity']>[0]['input']> = {}) {
    return service.createOpportunity({
      organizationId: ORG,
      projectId: PROJECT,
      actorId: 'human_1',
      input: {
        title: 'Fracción en Punta Mita',
        ownerCollaboratorId: 'human_1',
        estimatedValueUsd: 150000,
        source: 'meta_ads',
        utmSource: 'meta',
        utmMedium: 'cpc',
        utmCampaign: 'punta-mita',
        ...overrides,
      },
    });
  }

  it('CRM-01: crear exige propietario, estimación y origen; nace en `nuevo` con actividad inicial', async () => {
    const { opportunity, activities } = await create();

    expect(opportunity.stageKey).toBe('nuevo');
    expect(opportunity.ownerCollaboratorId).toBe('human_1');
    expect(opportunity.closedRevenueUsd).toBeNull();
    expect(opportunity.originLockedAt).toBe('2026-11-13T10:00:00.000Z');
    expect(activities).toHaveLength(1);
    expect(activities[0]!.metadata).toMatchObject({ event: 'opportunity_created' });

    await expect(create({ ownerCollaboratorId: '' })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
    await expect(create({ estimatedValueUsd: -1 })).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('CRM-02: etapa con `requiresNextAction` sin próxima acción ⇒ 422 NEXT_ACTION_REQUIRED', async () => {
    const { opportunity } = await create();

    await expect(
      service.transitionStage({
        organizationId: ORG,
        opportunityId: opportunity.id,
        actorId: 'human_1',
        input: { stageKey: 'calificado' },
      }),
    ).rejects.toMatchObject({ code: 'NEXT_ACTION_REQUIRED' });

    const ok = await service.transitionStage({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      input: {
        stageKey: 'calificado',
        nextAction: 'Llamar para confirmar presupuesto',
        nextActionAt: '2026-11-15T17:00:00.000Z',
      },
    });
    expect(ok.opportunity.stageKey).toBe('calificado');
    expect(ok.activity.type).toBe('stage_change');
    expect(ok.activity.metadata).toMatchObject({ from: 'nuevo', to: 'calificado' });
  });

  it('CRM-12: lead de otra organización ⇒ 422 LEAD_ORG_MISMATCH (no se crea nada)', async () => {
    await expect(create({ leadId: 'lead_org_b' })).rejects.toMatchObject({
      code: 'LEAD_ORG_MISMATCH',
    });
    expect(await repo.listOpportunities(ORG, {})).toHaveLength(0);
  });

  it('CRM-12b: lead no verificable ⇒ 422 LEAD_UNVERIFIABLE (fail-closed)', async () => {
    await expect(create({ leadId: 'lead_unverifiable' })).rejects.toMatchObject({
      code: 'LEAD_UNVERIFIABLE',
    });
  });

  it('CRM-13: cliente no particionado por organización ⇒ 422 CLIENT_ORG_UNVERIFIABLE', async () => {
    await expect(create({ clientId: 'client_1' })).rejects.toMatchObject({
      code: 'CLIENT_ORG_UNVERIFIABLE',
    });
  });

  it('CRM-19: el origen es inmutable (source/UTM/originLockedAt)', () => {
    expect(() => service.assertOriginImmutable({ source: 'referral' })).toThrowError(CrmError);
    expect(() => service.assertOriginImmutable({ utmSource: 'otro' })).toThrowError(CrmError);
    expect(() => service.assertOriginImmutable({ title: 'cambio permitido' })).not.toThrow();

    try {
      service.assertOriginImmutable({ source: 'referral' });
    } catch (error) {
      expect((error as CrmError).code).toBe('ORIGIN_IMMUTABLE');
      expect((error as CrmError).status).toBe(403);
    }
  });

  it('CRM-17: no se gana sin contacto previo verificable', async () => {
    const { opportunity } = await create();

    await expect(
      service.transitionStage({
        organizationId: ORG,
        opportunityId: opportunity.id,
        actorId: 'human_1',
        input: { stageKey: 'ganada', closeReason: 'firmó' },
      }),
    ).rejects.toMatchObject({ code: 'CONTACT_REQUIRED_BEFORE_WON' });

    // Una nota NO cuenta como contacto.
    await service.logActivity({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      type: 'note',
      content: 'Hablé con el cliente (nota)',
    });

    await expect(
      service.transitionStage({
        organizationId: ORG,
        opportunityId: opportunity.id,
        actorId: 'human_1',
        input: { stageKey: 'ganada', closeReason: 'firmó' },
      }),
    ).rejects.toMatchObject({ code: 'CONTACT_REQUIRED_BEFORE_WON' });
  });

  it('CRM-05: ganar exige motivo y registra closedRevenueUsd + actividad', async () => {
    const { opportunity } = await create();

    await service.logActivity({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      type: 'call',
      content: 'Llamada de calificación',
      outcome: 'interesado',
    });

    await expect(
      service.transitionStage({
        organizationId: ORG,
        opportunityId: opportunity.id,
        actorId: 'human_1',
        input: { stageKey: 'ganada' },
      }),
    ).rejects.toMatchObject({ code: 'CLOSE_REASON_REQUIRED' });

    const won = await service.transitionStage({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      input: { stageKey: 'ganada', closeReason: 'contrato firmado', closedRevenueUsd: 150000 },
    });

    expect(won.opportunity.stageKey).toBe('ganada');
    expect(won.opportunity.closedRevenueUsd).toBe(150000);
    expect(won.opportunity.closedAt).toBe('2026-11-13T10:00:00.000Z');
    expect(won.activity.metadata).toMatchObject({
      from: 'nuevo',
      to: 'ganada',
      closedRevenueUsd: 150000,
    });

    const stored = await repo.getOpportunity(ORG, opportunity.id);
    expect(stored?.lastContactAt).toBe('2026-11-13T10:00:00.000Z');
  });

  it('CRM-16: la estimación NO se cuenta como ingreso; solo closedRevenueUsd', async () => {
    const { opportunity } = await create({ estimatedValueUsd: 155000 });
    await service.logActivity({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      type: 'message',
      content: 'Contacto por WhatsApp',
    });
    await service.transitionStage({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      input: { stageKey: 'ganada', closeReason: 'cerrado', closedRevenueUsd: 150000 },
    });

    const all = await repo.listOpportunities(ORG, {});
    const summary = summarizeRevenue(all);

    expect(summary.closedRevenueUsd).toBe(150000);
    expect(summary.estimatedValueUsd).toBe(155000);
    expect(summary.closedRevenueUsd).not.toBe(summary.estimatedValueUsd);
    expect(summary.wonCount).toBe(1);
  });

  it('CRM-14: reasignación que cruza equipos queda PENDIENTE y el owner NO cambia', async () => {
    const { opportunity } = await create();

    const result = await service.reassignOwner({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      newOwnerCollaboratorId: 'human_3', // equipo marketing
      reason: 'cambio de cartera',
    });

    expect(result.applied).toBe(false);
    expect(result.decision).toBe('REQUIRE_APPROVAL');
    expect(result.reason).toBe('CROSS_TEAM');
    expect(result.requestId).toBeTruthy();

    const stored = await repo.getOpportunity(ORG, opportunity.id);
    expect(stored?.ownerCollaboratorId).toBe('human_1');
    expect(requests.rows).toHaveLength(1);
    expect(requests.rows[0]).toMatchObject({
      ownerFrom: 'human_1',
      ownerTo: 'human_3',
      status: 'pending',
      requestedBy: 'human_1',
    });

    const activities = await repo.listActivities(ORG, opportunity.id);
    expect(activities.some((a) => a.type === 'assignment')).toBe(false);
  });

  it('CRM-15: reasignación dentro del mismo equipo se aplica y deja actividad `assignment`', async () => {
    const { opportunity } = await create();

    const result = await service.reassignOwner({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      newOwnerCollaboratorId: 'human_2',
      reason: 'vacaciones',
    });

    expect(result.applied).toBe(true);
    expect(result.opportunity.ownerCollaboratorId).toBe('human_2');

    const activities = await repo.listActivities(ORG, opportunity.id);
    const assignment = activities.find((a) => a.type === 'assignment');
    expect(assignment?.metadata).toMatchObject({
      previousOwner: 'human_1',
      newOwner: 'human_2',
    });
  });

  it('CRM-14b: sin fuente de equipos, la reasignación requiere aprobación (fail-closed)', async () => {
    const sinEquipos = new OpportunityService({
      repository: repo,
      references,
      teams: null,
      reassignmentRequests: requests,
      newId: () => `id_${++seq}`,
      clock: () => '2026-11-13T10:00:00.000Z',
    });
    const { opportunity } = await create();

    const result = await sinEquipos.reassignOwner({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      newOwnerCollaboratorId: 'human_2',
    });

    expect(result.applied).toBe(false);
    expect(result.reason).toBe('TEAM_UNRESOLVED');
    expect((await repo.getOpportunity(ORG, opportunity.id))?.ownerCollaboratorId).toBe('human_1');
  });

  it('CRM-06: cambios de etapa concurrentes no producen historial contradictorio', async () => {
    const { opportunity } = await create();
    const base = {
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
    };

    const first = service.transitionStage({
      ...base,
      input: { stageKey: 'contactado', nextAction: 'llamar', nextActionAt: '2026-11-14T10:00:00Z' },
    });
    const second = service.transitionStage({
      ...base,
      input: { stageKey: 'calificado', nextAction: 'visita', nextActionAt: '2026-11-15T10:00:00Z' },
    });

    const results = await Promise.allSettled([first, second]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({ code: 'CONFLICT' });

    const stageChanges = (await repo.listActivities(ORG, opportunity.id)).filter(
      (a) => a.type === 'stage_change',
    );
    expect(stageChanges).toHaveLength(1);
  });

  it('CRM-07: el historial lo escribe el sistema, no el cliente', async () => {
    const { opportunity } = await create();

    await expect(
      service.logActivity({
        organizationId: ORG,
        opportunityId: opportunity.id,
        actorId: 'human_1',
        type: 'stage_change',
        content: 'me salté el flujo',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });

    await expect(
      service.logActivity({
        organizationId: ORG,
        opportunityId: opportunity.id,
        actorId: 'human_1',
        type: 'assignment',
        content: 'me asigné solo',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('CRM-08: aislamiento — otra organización no ve ni transiciona la oportunidad', async () => {
    const { opportunity } = await create();

    await expect(
      service.transitionStage({
        organizationId: ORG_B,
        opportunityId: opportunity.id,
        actorId: 'human_1',
        input: { stageKey: 'contactado', nextAction: 'x', nextActionAt: '2026-11-14T10:00:00Z' },
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    expect(await repo.listOpportunities(ORG_B, {})).toHaveLength(0);
    expect(await service.listOpportunities({ organizationId: ORG })).toHaveLength(1);
  });

  it('CRM-09: multi-oportunidad por lead (nunca se fusiona automáticamente)', async () => {
    const first = await create({ leadId: 'lead_1', source: 'meta_ads' });
    const second = await create({ leadId: 'lead_1', source: 'referral', title: 'Segunda unidad' });

    expect(first.opportunity.id).not.toBe(second.opportunity.id);
    const all = await service.listOpportunities({ organizationId: ORG });
    expect(all).toHaveLength(2);
    expect(all.every((o) => o.leadId === 'lead_1')).toBe(true);
  });

  it('CRM-10: no se gana con estimación 0', async () => {
    const { opportunity } = await create({ estimatedValueUsd: 0 });
    await service.logActivity({
      organizationId: ORG,
      opportunityId: opportunity.id,
      actorId: 'human_1',
      type: 'visit',
      content: 'Visita realizada',
    });

    await expect(
      service.transitionStage({
        organizationId: ORG,
        opportunityId: opportunity.id,
        actorId: 'human_1',
        input: { stageKey: 'ganada', closeReason: 'cerrado' },
      }),
    ).rejects.toMatchObject({ code: 'ESTIMATED_VALUE_REQUIRED' });
  });

  it('CRM-11: etapa desconocida ⇒ STAGE_UNKNOWN', async () => {
    const { opportunity } = await create();

    await expect(
      service.transitionStage({
        organizationId: ORG,
        opportunityId: opportunity.id,
        actorId: 'human_1',
        input: { stageKey: 'inventada' },
      }),
    ).rejects.toMatchObject({ code: 'STAGE_UNKNOWN' });
  });

  it('CRM-18: filtros por etapa y propietario, con límites acotados', async () => {
    await create({ title: 'A' });
    await create({ title: 'B', ownerCollaboratorId: 'human_2' });

    const byOwner = await service.listOpportunities({
      organizationId: ORG,
      ownerCollaboratorId: 'human_2',
    });
    expect(byOwner).toHaveLength(1);

    const byStage = await service.listOpportunities({ organizationId: ORG, stageKey: 'nuevo' });
    expect(byStage).toHaveLength(2);

    const bounded = await service.listOpportunities({ organizationId: ORG, limit: 500 });
    expect(bounded.length).toBeLessThanOrEqual(100);
  });
});
