/**
 * Repositorio CRM EN MEMORIA — SOLO para pruebas.
 *
 * Implementa el contrato real (`CrmRepository`) con compare-and-set equivalente
 * al de la base de datos, para probar concurrencia e historial sin migraciones.
 */

import type { ActivityRecord, CrmRepository, OpportunityRecord } from './opportunity-service';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class InMemoryCrmRepository implements CrmRepository {
  private readonly opportunities = new Map<string, OpportunityRecord>();
  private readonly activities: ActivityRecord[] = [];

  private key(organizationId: string, id: string): string {
    return `${organizationId}::${id}`;
  }

  async createOpportunity(record: OpportunityRecord): Promise<void> {
    const key = this.key(record.organizationId, record.id);
    if (this.opportunities.has(key)) throw new Error(`Oportunidad duplicada: ${record.id}`);
    this.opportunities.set(key, clone(record));
  }

  async getOpportunity(organizationId: string, id: string): Promise<OpportunityRecord | null> {
    const found = this.opportunities.get(this.key(organizationId, id));
    return found ? clone(found) : null;
  }

  async listOpportunities(
    organizationId: string,
    filters: { stageKey?: string; ownerCollaboratorId?: string; limit?: number; offset?: number },
  ): Promise<OpportunityRecord[]> {
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 25;

    return [...this.opportunities.values()]
      .filter((record) => record.organizationId === organizationId)
      .filter((record) => (filters.stageKey ? record.stageKey === filters.stageKey : true))
      .filter((record) =>
        filters.ownerCollaboratorId
          ? record.ownerCollaboratorId === filters.ownerCollaboratorId
          : true,
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(offset, offset + limit)
      .map(clone);
  }

  async transitionStage(
    organizationId: string,
    id: string,
    fromStageKey: string,
    patch: Partial<OpportunityRecord> & { stageKey: string },
  ): Promise<boolean> {
    const key = this.key(organizationId, id);
    const current = this.opportunities.get(key);
    if (!current || current.stageKey !== fromStageKey) return false;
    this.opportunities.set(key, { ...current, ...clone(patch) });
    return true;
  }

  async updateOwner(
    organizationId: string,
    id: string,
    fromOwnerId: string,
    toOwnerId: string,
  ): Promise<boolean> {
    const key = this.key(organizationId, id);
    const current = this.opportunities.get(key);
    if (!current || current.ownerCollaboratorId !== fromOwnerId) return false;
    this.opportunities.set(key, { ...current, ownerCollaboratorId: toOwnerId });
    return true;
  }

  async setLastContactAt(organizationId: string, id: string, at: string): Promise<void> {
    const key = this.key(organizationId, id);
    const current = this.opportunities.get(key);
    if (!current) return;
    this.opportunities.set(key, { ...current, lastContactAt: at });
  }

  async appendActivity(record: ActivityRecord): Promise<void> {
    this.activities.push(clone(record));
  }

  async listActivities(organizationId: string, opportunityId: string): Promise<ActivityRecord[]> {
    return this.activities
      .filter((a) => a.organizationId === organizationId && a.opportunityId === opportunityId)
      .map(clone);
  }
}
