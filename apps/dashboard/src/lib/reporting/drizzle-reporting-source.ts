/**
 * Fuente de datos Drizzle para P0.4.
 *
 * ⚠️ ESTADO: IMPLEMENTADO — NO VERIFICADO.
 * Depende de `ad_spend_entries`/`report_snapshots` (0098) y de las tablas CRM
 * (0097), no aplicadas. El servicio está cubierto por pruebas con fuente en memoria.
 *
 * Regla: si una consulta falla o falta la fuente, se devuelve `unavailable` con
 * motivo. Nunca se devuelve 0 por error.
 */

import { and, eq, gte, lte, sql } from '@saasfly/db-core';
import { db } from '@saasfly/db';
import {
  adBudgetCommitments,
  adSpendEntries,
  crmActivities,
  crmOpportunities,
  marketingLeads,
} from '@saasfly/db/schema';
import type { PeriodRange } from './period';
import type { ReportingDataSource, SourceResult } from './report-service';

function rangeBounds(range: PeriodRange): { from: Date; to: Date } {
  return { from: new Date(range.fromUtc), to: new Date(range.toUtc) };
}

export class DrizzleReportingSource implements ReportingDataSource {
  /**
   * @param organizationId organización canónica (autoridad)
   * @param projectId proyecto del tenant — `marketing_leads` se particiona por
   *   `project_id`, no por organización.
   */
  constructor(
    private readonly organizationId: string,
    private readonly projectId: number,
  ) {}

  async leadsCaptured(range: PeriodRange): Promise<SourceResult<number>> {
    try {
      const { from, to } = rangeBounds(range);
      const [row] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(marketingLeads)
        .where(
          and(
            eq(marketingLeads.projectId, this.projectId),
            gte(marketingLeads.createdAt, from),
            lte(marketingLeads.createdAt, to),
          ),
        );

      return { status: 'ok', value: row?.total ?? 0 };
    } catch (error) {
      return {
        status: 'unavailable',
        reason: `No se pudo leer marketing_leads: ${(error as Error)?.message ?? 'error'}`,
      };
    }
  }

  async leadsValid(range: PeriodRange): Promise<SourceResult<number>> {
    try {
      const { from, to } = rangeBounds(range);
      const [row] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(marketingLeads)
        .where(
          and(
            eq(marketingLeads.projectId, this.projectId),
            eq(marketingLeads.consent, true),
            gte(marketingLeads.createdAt, from),
            lte(marketingLeads.createdAt, to),
          ),
        );

      return { status: 'ok', value: row?.total ?? 0 };
    } catch (error) {
      return {
        status: 'unavailable',
        reason: `No se pudo verificar consentimiento: ${(error as Error)?.message ?? 'error'}`,
      };
    }
  }

  async opportunitiesCreated(range: PeriodRange): Promise<SourceResult<number>> {
    return this.countOpportunities(range, { created: true });
  }

  async opportunitiesQualified(range: PeriodRange): Promise<SourceResult<number>> {
    return this.countOpportunities(range, { stage: 'calificado' });
  }

  async discoveryRequests(range: PeriodRange): Promise<SourceResult<number>> {
    return this.countOpportunities(range, { stage: 'discovery_solicitado' });
  }

  async visitsCompleted(range: PeriodRange): Promise<SourceResult<number>> {
    try {
      const { from, to } = rangeBounds(range);
      const [row] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(crmActivities)
        .where(
          and(
            eq(crmActivities.organizationId, this.organizationId),
            eq(crmActivities.type, 'visit'),
            gte(crmActivities.occurredAt, from),
            lte(crmActivities.occurredAt, to),
          ),
        );

      return {
        status: 'partial',
        value: row?.total ?? 0,
        missing: 'Las visitas registradas no incluyen la confirmación externa de Celeste.',
      };
    } catch (error) {
      return {
        status: 'unavailable',
        reason: `No se pudieron leer las visitas: ${(error as Error)?.message ?? 'error'}`,
      };
    }
  }

  async adSpendActual(
    range: PeriodRange,
  ): Promise<SourceResult<{ amountUsd: number; entryIds: string[] }>> {
    try {
      const { from, to } = rangeBounds(range);
      const rows = await db
        .select({ id: adSpendEntries.id, amountUsd: adSpendEntries.amountUsd })
        .from(adSpendEntries)
        .where(
          and(
            eq(adSpendEntries.organizationId, this.organizationId),
            gte(adSpendEntries.periodStart, from),
            lte(adSpendEntries.periodEnd, to),
          ),
        );

      if (rows.length === 0) {
        return {
          status: 'unavailable',
          reason: 'Sin gasto publicitario con evidencia registrado en el periodo.',
        };
      }

      const amountUsd = rows.reduce((total, row) => total + Number(row.amountUsd), 0);
      return {
        status: 'ok',
        value: { amountUsd: Math.round(amountUsd * 100) / 100, entryIds: rows.map((r) => r.id) },
      };
    } catch (error) {
      return {
        status: 'unavailable',
        reason: `No se pudo leer ad_spend_entries: ${(error as Error)?.message ?? 'error'}`,
      };
    }
  }

  /**
   * Presupuesto COMPROMETIDO del periodo (tabla propia, nunca el gasto real).
   * Se compara contra `ad_spend_actual`; jamás entra en el CPL.
   */
  async adBudgetAssigned(range: PeriodRange): Promise<SourceResult<number>> {
    try {
      const { from, to } = rangeBounds(range);
      const rows = await db
        .select({ amountUsd: adBudgetCommitments.amountUsd })
        .from(adBudgetCommitments)
        .where(
          and(
            eq(adBudgetCommitments.organizationId, this.organizationId),
            gte(adBudgetCommitments.periodStart, from),
            lte(adBudgetCommitments.periodEnd, to),
          ),
        );

      if (rows.length === 0) {
        return {
          status: 'unavailable',
          reason: 'Sin presupuesto comprometido registrado para el periodo.',
        };
      }

      const amountUsd = rows.reduce((total, row) => total + Number(row.amountUsd), 0);
      return { status: 'ok', value: Math.round(amountUsd * 100) / 100 };
    } catch (error) {
      return {
        status: 'unavailable',
        reason: `No se pudo leer ad_budget_commitments: ${(error as Error)?.message ?? 'error'}`,
      };
    }
  }

  async revenue(
    range: PeriodRange,
  ): Promise<SourceResult<{ estimatedUsd: number; closedUsd: number; wonOpportunityIds: string[] }>> {
    try {
      const { from, to } = rangeBounds(range);
      const rows = await db
        .select({
          id: crmOpportunities.id,
          estimated: crmOpportunities.estimatedValueUsd,
          closed: crmOpportunities.closedRevenueUsd,
          closedAt: crmOpportunities.closedAt,
          stageKey: crmOpportunities.stageKey,
        })
        .from(crmOpportunities)
        .where(eq(crmOpportunities.organizationId, this.organizationId));

      let estimatedUsd = 0;
      let closedUsd = 0;
      const wonOpportunityIds: string[] = [];

      for (const row of rows) {
        estimatedUsd += Number(row.estimated ?? 0);
        if (
          row.stageKey === 'ganada' &&
          row.closedAt &&
          row.closedAt >= from &&
          row.closedAt <= to
        ) {
          closedUsd += Number(row.closed ?? 0);
          wonOpportunityIds.push(row.id);
        }
      }

      return {
        status: 'ok',
        value: {
          estimatedUsd: Math.round(estimatedUsd * 100) / 100,
          closedUsd: Math.round(closedUsd * 100) / 100,
          wonOpportunityIds,
        },
      };
    } catch (error) {
      return {
        status: 'unavailable',
        reason: `No se pudo leer crm_opportunities: ${(error as Error)?.message ?? 'error'}`,
      };
    }
  }

  async attributableLeads(range: PeriodRange): Promise<SourceResult<number>> {
    try {
      const { from, to } = rangeBounds(range);
      const [row] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(marketingLeads)
        .where(
          and(
            eq(marketingLeads.projectId, this.projectId),
            gte(marketingLeads.createdAt, from),
            lte(marketingLeads.createdAt, to),
            sql`(${marketingLeads.source} IS NOT NULL OR ${marketingLeads.origin} IS NOT NULL)`,
          ),
        );

      return { status: 'ok', value: row?.total ?? 0 };
    } catch (error) {
      return {
        status: 'unavailable',
        reason: `No se pudo leer la atribución de leads: ${(error as Error)?.message ?? 'error'}`,
      };
    }
  }

  private async countOpportunities(
    range: PeriodRange,
    filter: { created?: true; stage?: string },
  ): Promise<SourceResult<number>> {
    try {
      const { from, to } = rangeBounds(range);
      const conditions = [eq(crmOpportunities.organizationId, this.organizationId)];
      if (filter.stage) conditions.push(eq(crmOpportunities.stageKey, filter.stage));
      if (filter.created) {
        conditions.push(gte(crmOpportunities.createdAt, from), lte(crmOpportunities.createdAt, to));
      }

      const [row] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(crmOpportunities)
        .where(and(...conditions));

      return { status: 'ok', value: row?.total ?? 0 };
    } catch (error) {
      return {
        status: 'unavailable',
        reason: `No se pudo leer el CRM: ${(error as Error)?.message ?? 'error'}`,
      };
    }
  }
}
