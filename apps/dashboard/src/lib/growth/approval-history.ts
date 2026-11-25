/**
 * 📊 Historial de aprobaciones — métricas sobre decisiones ya tomadas.
 *
 * No hay almacén nuevo: se leen las decisiones que ya existen en
 * `nexus_approvals` (+ el motivo en `community_proposals.result`). Estas
 * funciones son puras para poder probarlas sin base de datos.
 */

export interface DecisionRow {
  status: string; // APPROVED | REJECTED | BLOCKED | FAILED
  createdAt: Date;
  resolvedAt: Date | null;
  reason?: string | null;
}

export interface DecisionSummary {
  total: number;
  approved: number;
  rejected: number;
  /** 0..1, o `null` si todavía no hay decisiones (no es lo mismo que 0 %). */
  approvalRate: number | null;
  /** Horas medianas hasta resolver; `null` si ninguna fila trae ambas fechas. */
  medianHours: number | null;
}

export function medianHours(rows: DecisionRow[]): number | null {
  const hours = rows
    .filter((row) => row.resolvedAt instanceof Date && row.createdAt instanceof Date)
    .map((row) => (row.resolvedAt!.getTime() - row.createdAt.getTime()) / 3_600_000)
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);

  if (hours.length === 0) return null;
  const mid = Math.floor(hours.length / 2);
  const median = hours.length % 2 === 0 ? (hours[mid - 1]! + hours[mid]!) / 2 : hours[mid]!;
  return Math.round(median * 10) / 10;
}

export function summarizeDecisions(rows: DecisionRow[]): DecisionSummary {
  const approved = rows.filter((row) => row.status === 'APPROVED').length;
  const rejected = rows.filter((row) => row.status === 'REJECTED').length;
  const total = approved + rejected;

  return {
    total,
    approved,
    rejected,
    approvalRate: total > 0 ? approved / total : null,
    medianHours: medianHours(rows),
  };
}

/**
 * Motivos de rechazo agrupados.
 *
 * Se normaliza para agrupar ("No menciones precios" y "no menciones precios "
 * son el mismo motivo) pero se conserva la primera forma vista para mostrarla.
 */
export function topReasons(
  rows: DecisionRow[],
  limit = 5,
): Array<{ reason: string; count: number }> {
  const groups = new Map<string, { reason: string; count: number }>();

  for (const row of rows) {
    if (row.status !== 'REJECTED') continue;
    const raw = String(row.reason ?? '').trim().replace(/\s+/g, ' ');
    if (!raw) continue;
    const key = raw.toLowerCase();
    const current = groups.get(key);
    if (current) current.count += 1;
    else groups.set(key, { reason: raw.length > 90 ? `${raw.slice(0, 89)}…` : raw, count: 1 });
  }

  return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

/** Formato legible de la tasa de aprobación. */
export function formatRate(rate: number | null): string {
  if (rate === null) return '—';
  return `${Math.round(rate * 100)}%`;
}

/** Formato legible de horas → "2.5 h" o "3 d 4 h". */
export function formatHours(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 48) return `${hours} h`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours % 24);
  return rest > 0 ? `${days} d ${rest} h` : `${days} d`;
}
