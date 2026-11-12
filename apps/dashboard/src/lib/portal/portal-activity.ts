import { db } from '@saasfly/db';
import { hermesPortalActivity } from '@saasfly/db/schema';
import { sql } from '@saasfly/db-core';

/**
 * Actividad del Portal ("quién está dentro").
 *
 * Una fila por tenant con el último acceso. Se actualiza desde el layout del
 * portal con throttle en memoria (5 min) para no escribir en cada request.
 *
 * No es un log de auditoría: para eso están los eventos de seguridad. Esto
 * responde a "¿cuándo entró por última vez este tenant?".
 */

const THROTTLE_MS = 5 * 60 * 1000;
const lastWriteByTenant = new Map<string, number>();

export interface PortalActivityRow {
  tenantId: string;
  lastSeenAt: Date;
  firstSeenAt: Date;
  lastActorId: string | null;
  hits: number;
}

export function shouldRecordActivity(tenantId: string, now: number = Date.now()): boolean {
  const last = lastWriteByTenant.get(tenantId) ?? 0;
  return now - last >= THROTTLE_MS;
}

export function resetActivityThrottleForTesting(): void {
  lastWriteByTenant.clear();
}

export async function recordPortalActivity(params: {
  tenantId: string;
  actorId?: string | null;
  now?: number;
}): Promise<boolean> {
  const tenantId = (params.tenantId ?? '').toLowerCase().trim();
  if (!db || !tenantId) return false;

  const now = params.now ?? Date.now();
  if (!shouldRecordActivity(tenantId, now)) return false;

  lastWriteByTenant.set(tenantId, now);

  try {
    await db
      .insert(hermesPortalActivity)
      .values({
        tenantId,
        lastSeenAt: new Date(now),
        firstSeenAt: new Date(now),
        lastActorId: params.actorId ?? null,
        hits: 1,
        updatedAt: new Date(now),
      })
      .onConflictDoUpdate({
        target: hermesPortalActivity.tenantId,
        set: {
          lastSeenAt: new Date(now),
          lastActorId: params.actorId ?? null,
          hits: sql`${hermesPortalActivity.hits} + 1`,
          updatedAt: new Date(now),
        },
      });
    return true;
  } catch (error: unknown) {
    // Nunca romper el render del portal por telemetría.
    console.error('[PortalActivity] No se pudo registrar la actividad:', error);
    return false;
  }
}

export async function getPortalActivity(tenantIds: string[]): Promise<Map<string, PortalActivityRow>> {
  const out = new Map<string, PortalActivityRow>();
  if (!db || tenantIds.length === 0) return out;

  try {
    const rows = await db.select().from(hermesPortalActivity);
    for (const row of rows) {
      const key = row.tenantId.toLowerCase();
      if (tenantIds.includes(key)) out.set(key, row as PortalActivityRow);
    }
  } catch (error: unknown) {
    console.error('[PortalActivity] Error leyendo actividad:', error);
  }
  return out;
}
