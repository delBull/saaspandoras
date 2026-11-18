/**
 * Fuente de datos de reporting EN MEMORIA — SOLO para pruebas.
 *
 * Permite simular explícitamente cada estado: `ok`, `partial`, `unavailable`.
 */

import type { PeriodRange } from './period';
import type { ReportingDataSource, SourceResult } from './report-service';

type Stub<T> = SourceResult<T> | (() => SourceResult<T>);

function resolve<T>(stub: Stub<T> | undefined, fallbackReason: string): SourceResult<T> {
  if (!stub) return { status: 'unavailable', reason: fallbackReason };
  return typeof stub === 'function' ? stub() : stub;
}

export class MemoryReportingSource implements ReportingDataSource {
  stubs: Record<string, Stub<unknown>> = {};
  calls: Array<{ method: string; range: PeriodRange }> = [];

  private take<T>(method: string, range: PeriodRange, fallbackReason: string): SourceResult<T> {
    this.calls.push({ method, range });
    return resolve(this.stubs[method] as Stub<T> | undefined, fallbackReason);
  }

  async leadsCaptured(range: PeriodRange) {
    return this.take<number>('leadsCaptured', range, 'No se pudo leer marketing_leads.');
  }
  async leadsValid(range: PeriodRange) {
    return this.take<number>('leadsValid', range, 'No hay registro de consentimiento.');
  }
  async opportunitiesCreated(range: PeriodRange) {
    return this.take<number>('opportunitiesCreated', range, 'CRM no disponible.');
  }
  async opportunitiesQualified(range: PeriodRange) {
    return this.take<number>('opportunitiesQualified', range, 'CRM no disponible.');
  }
  async discoveryRequests(range: PeriodRange) {
    return this.take<number>('discoveryRequests', range, 'CRM no disponible.');
  }
  async visitsCompleted(range: PeriodRange) {
    return this.take<number>('visitsCompleted', range, 'Sin confirmación de visitas.');
  }
  async adSpendActual(range: PeriodRange) {
    return this.take<{ amountUsd: number; entryIds: string[] }>(
      'adSpendActual',
      range,
      'Sin gasto publicitario registrado en el periodo.',
    );
  }
  async adBudgetAssigned(range: PeriodRange) {
    return this.take<number>('adBudgetAssigned', range, 'Sin presupuesto asignado registrado.');
  }
  async revenue(range: PeriodRange) {
    return this.take<{ estimatedUsd: number; closedUsd: number; wonOpportunityIds: string[] }>(
      'revenue',
      range,
      'CRM no disponible.',
    );
  }
  async attributableLeads(range: PeriodRange) {
    return this.take<number>('attributableLeads', range, 'Sin atribución comprobada.');
  }
}
