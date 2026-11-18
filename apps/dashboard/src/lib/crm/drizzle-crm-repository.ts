/**
 * Repositorio CRM Drizzle (P0.2).
 *
 * ⚠️ ESTADO: IMPLEMENTADO — NO VERIFICADO.
 * Depende de `0097_p0_2_crm.sql` (no aplicada). El dominio está cubierto por
 * pruebas con repositorio en memoria; este adaptador queda pendiente de
 * verificación contra base de datos real.
 */

import { and, asc, desc, eq, sql } from '@saasfly/db-core';
import { db } from '@saasfly/db';
import { crmActivities, crmOpportunities } from '@saasfly/db/schema';
import type {
  ActivityRecord,
  ActivityType,
  CrmReferenceChecker,
  CrmRepository,
  OpportunityRecord,
  OpportunitySource,
} from './opportunity-service';

function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export class DrizzleCrmRepository implements CrmRepository {
  async createOpportunity(record: OpportunityRecord): Promise<void> {
    await db.insert(crmOpportunities).values({
      id: record.id,
      organizationId: record.organizationId,
      projectId: record.projectId,
      pipelineId: record.pipelineId,
      stageKey: record.stageKey,
      leadId: record.leadId,
      clientId: record.clientId,
      ownerCollaboratorId: record.ownerCollaboratorId,
      title: record.title,
      estimatedValueUsd: record.estimatedValueUsd.toFixed(2),
      closedRevenueUsd: record.closedRevenueUsd === null ? null : record.closedRevenueUsd.toFixed(2),
      currency: record.currency,
      source: record.source,
      utmSource: record.utmSource,
      utmMedium: record.utmMedium,
      utmCampaign: record.utmCampaign,
      nextAction: record.nextAction,
      nextActionAt: record.nextActionAt ? new Date(record.nextActionAt) : null,
      lastContactAt: record.lastContactAt ? new Date(record.lastContactAt) : null,
      closedAt: record.closedAt ? new Date(record.closedAt) : null,
      closeReason: record.closeReason,
      originLockedAt: new Date(record.originLockedAt),
      createdBy: record.createdBy,
    });
  }

  async getOpportunity(organizationId: string, id: string): Promise<OpportunityRecord | null> {
    const [row] = await db
      .select()
      .from(crmOpportunities)
      .where(and(eq(crmOpportunities.organizationId, organizationId), eq(crmOpportunities.id, id)))
      .limit(1);

    return row ? this.mapOpportunity(row) : null;
  }

  async listOpportunities(
    organizationId: string,
    filters: { stageKey?: string; ownerCollaboratorId?: string; limit?: number; offset?: number },
  ): Promise<OpportunityRecord[]> {
    const conditions = [eq(crmOpportunities.organizationId, organizationId)];
    if (filters.stageKey) conditions.push(eq(crmOpportunities.stageKey, filters.stageKey));
    if (filters.ownerCollaboratorId) {
      conditions.push(eq(crmOpportunities.ownerCollaboratorId, filters.ownerCollaboratorId));
    }

    const rows = await db
      .select()
      .from(crmOpportunities)
      .where(and(...conditions))
      .orderBy(asc(crmOpportunities.createdAt))
      .limit(filters.limit ?? 25)
      .offset(filters.offset ?? 0);

    return rows.map((row) => this.mapOpportunity(row));
  }

  async transitionStage(
    organizationId: string,
    id: string,
    fromStageKey: string,
    patch: Partial<OpportunityRecord> & { stageKey: string },
  ): Promise<boolean> {
    const updated = await db
      .update(crmOpportunities)
      .set({
        stageKey: patch.stageKey,
        ...(patch.nextAction !== undefined ? { nextAction: patch.nextAction } : {}),
        ...(patch.nextActionAt !== undefined
          ? { nextActionAt: patch.nextActionAt ? new Date(patch.nextActionAt) : null }
          : {}),
        ...(patch.closeReason !== undefined ? { closeReason: patch.closeReason } : {}),
        ...(patch.closedAt !== undefined
          ? { closedAt: patch.closedAt ? new Date(patch.closedAt) : null }
          : {}),
        ...(patch.closedRevenueUsd !== undefined
          ? {
              closedRevenueUsd:
                patch.closedRevenueUsd === null ? null : patch.closedRevenueUsd.toFixed(2),
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(crmOpportunities.organizationId, organizationId),
          eq(crmOpportunities.id, id),
          eq(crmOpportunities.stageKey, fromStageKey),
        ),
      )
      .returning({ id: crmOpportunities.id });

    return updated.length > 0;
  }

  async updateOwner(
    organizationId: string,
    id: string,
    fromOwnerId: string,
    toOwnerId: string,
  ): Promise<boolean> {
    const updated = await db
      .update(crmOpportunities)
      .set({ ownerCollaboratorId: toOwnerId, updatedAt: new Date() })
      .where(
        and(
          eq(crmOpportunities.organizationId, organizationId),
          eq(crmOpportunities.id, id),
          eq(crmOpportunities.ownerCollaboratorId, fromOwnerId),
        ),
      )
      .returning({ id: crmOpportunities.id });

    return updated.length > 0;
  }

  async setLastContactAt(organizationId: string, id: string, at: string): Promise<void> {
    await db
      .update(crmOpportunities)
      .set({ lastContactAt: new Date(at), updatedAt: new Date() })
      .where(and(eq(crmOpportunities.organizationId, organizationId), eq(crmOpportunities.id, id)));
  }

  async appendActivity(record: ActivityRecord): Promise<void> {
    await db.insert(crmActivities).values({
      id: record.id,
      organizationId: record.organizationId,
      opportunityId: record.opportunityId,
      type: record.type,
      authorCollaboratorId: record.authorCollaboratorId,
      content: record.content,
      outcome: record.outcome,
      occurredAt: new Date(record.occurredAt),
      metadata: record.metadata,
    });
  }

  async listActivities(organizationId: string, opportunityId: string): Promise<ActivityRecord[]> {
    const rows = await db
      .select()
      .from(crmActivities)
      .where(
        and(
          eq(crmActivities.organizationId, organizationId),
          eq(crmActivities.opportunityId, opportunityId),
        ),
      )
      .orderBy(desc(crmActivities.occurredAt));

    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      opportunityId: row.opportunityId,
      type: row.type as ActivityType,
      authorCollaboratorId: row.authorCollaboratorId,
      content: row.content,
      outcome: row.outcome ?? null,
      occurredAt: row.occurredAt.toISOString(),
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    }));
  }

  private mapOpportunity(row: typeof crmOpportunities.$inferSelect): OpportunityRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      projectId: row.projectId,
      pipelineId: row.pipelineId,
      pipelineName: 'Pipeline principal',
      leadId: row.leadId ?? null,
      clientId: row.clientId ?? null,
      stageKey: row.stageKey,
      ownerCollaboratorId: row.ownerCollaboratorId,
      title: row.title,
      estimatedValueUsd: num(row.estimatedValueUsd) ?? 0,
      closedRevenueUsd: num(row.closedRevenueUsd),
      currency: row.currency,
      source: row.source as OpportunitySource,
      utmSource: row.utmSource ?? null,
      utmMedium: row.utmMedium ?? null,
      utmCampaign: row.utmCampaign ?? null,
      nextAction: row.nextAction ?? null,
      nextActionAt: iso(row.nextActionAt),
      lastContactAt: iso(row.lastContactAt),
      closedAt: iso(row.closedAt),
      closeReason: row.closeReason ?? null,
      originLockedAt: row.originLockedAt.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

/**
 * Verificación de referencias contra la base real.
 *
 * - Lead: pertenece al proyecto si `marketing_leads.project_id` coincide.
 * - Cliente: `clients` no tiene organización ⇒ `unscoped` (v1 lo rechaza).
 */
export class DrizzleCrmReferenceChecker implements CrmReferenceChecker {
  async leadBelongsToProject(leadId: string, projectId: number): Promise<boolean | null> {
    const { marketingLeads } = await import('@saasfly/db/schema');
    const rows = await db
      .select({ projectId: marketingLeads.projectId })
      .from(marketingLeads)
      .where(eq(marketingLeads.id, leadId))
      .limit(1);

    if (rows.length === 0) return null;
    return rows[0]!.projectId === projectId;
  }

  async clientScope(_clientId: string): Promise<'scoped' | 'unscoped' | 'missing'> {
    // El esquema actual no permite verificar propiedad por organización.
    return 'unscoped';
  }
}

/** Utilidad para contar oportunidades por etapa (tablero). */
export async function countByStage(
  organizationId: string,
): Promise<Array<{ stageKey: string; total: number }>> {
  const rows = await db
    .select({
      stageKey: crmOpportunities.stageKey,
      total: sql<number>`count(*)::int`,
    })
    .from(crmOpportunities)
    .where(eq(crmOpportunities.organizationId, organizationId))
    .groupBy(crmOpportunities.stageKey);

  return rows;
}
