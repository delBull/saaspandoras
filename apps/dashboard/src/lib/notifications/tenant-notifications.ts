import crypto from 'crypto';
import { db } from '@saasfly/db';
import { hermesTenantNotifications } from '@saasfly/db/schema';
import { and, desc, eq, isNull, inArray } from '@saasfly/db-core';

/**
 * Notificaciones in-app por tenant.
 *
 * Idempotencia: (tenant_id, dedupe_key) es único. El mismo aviso (p. ej. el
 * recordatorio de "faltan 2 días" de un trial concreto) no se duplica aunque el
 * cron corra varias veces al día.
 */

export type NotificationKind = 'TRIAL_REMINDER' | 'APPROVAL' | 'SYSTEM';
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface CreateNotificationInput {
  tenantId: string;
  kind: NotificationKind;
  severity?: NotificationSeverity;
  title: string;
  body: string;
  link?: string;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
}

export interface TenantNotification {
  id: string;
  tenantId: string;
  kind: string;
  severity: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: Date;
  readAt: Date | null;
}

/** Duración del periodo de gracia/trial, en días. */
export const TRIAL_DURATION_DAYS = 7;

/** Días (hacia el final) en los que se avisa: 2 días, 1 día y el último día. */
export const TRIAL_REMINDER_DAYS_LEFT = [2, 1, 0] as const;

export type TrialReminderStage = 'D5' | 'D6' | 'D7' | null;

/**
 * Etapa de recordatorio según lo que falta para `trialEndsAt`.
 *
 * - 2 días restantes → D5 (día 5 de 7)
 * - 1 día restante  → D6 (día 6)
 * - 0 días / hoy    → D7 (último día)
 *
 * Se calcula con redondeo: 47h ⇒ "faltan 2 días", 23h ⇒ "falta 1", ≤12h ⇒ "hoy".
 */
export function computeTrialReminderStage(
  trialEndsAt: Date | string | null | undefined,
  now: Date = new Date()
): { daysLeft: number | null; stage: TrialReminderStage } {
  if (!trialEndsAt) return { daysLeft: null, stage: null };
  const end = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) return { daysLeft: null, stage: null };

  const msLeft = end.getTime() - now.getTime();
  // Redondeo (no ceil): con un cron diario, "47h" son 2 días y "2h" es hoy.
  const daysLeft = Math.max(0, Math.round(msLeft / (24 * 60 * 60 * 1000)));

  if (daysLeft === 2) return { daysLeft, stage: 'D5' };
  if (daysLeft === 1) return { daysLeft, stage: 'D6' };
  if (daysLeft === 0) return { daysLeft, stage: 'D7' };
  return { daysLeft, stage: null };
}

const STAGE_COPY: Record<Exclude<TrialReminderStage, null>, { title: string; body: string; severity: NotificationSeverity }> = {
  D5: {
    title: 'Te quedan 2 días de tu periodo',
    body: 'Tu periodo de prueba termina en 2 días. Cuando finalice, el portal pasará a modo solo lectura hasta que se active tu plan.',
    severity: 'warning',
  },
  D6: {
    title: 'Mañana termina tu periodo',
    body: 'Mañana es el último día. Revisa tu saldo y el plan para no perder acceso de escritura.',
    severity: 'warning',
  },
  D7: {
    title: 'Hoy termina tu periodo',
    body: 'Hoy es el último día. Después de hoy el portal queda en solo lectura (tus datos se conservan).',
    severity: 'critical',
  },
};

export async function createTenantNotification(input: CreateNotificationInput): Promise<boolean> {
  const tenantId = input.tenantId.toLowerCase().trim();
  if (!db || !tenantId || !input.dedupeKey) return false;

  try {
    const inserted = await db
      .insert(hermesTenantNotifications)
      .values({
        id: `ntf_${crypto.randomUUID()}`,
        tenantId,
        kind: input.kind,
        severity: input.severity ?? 'info',
        title: input.title.slice(0, 200),
        body: input.body,
        link: input.link ?? null,
        dedupeKey: input.dedupeKey.slice(0, 160),
        metadataJson: (input.metadata ?? null) as any,
      })
      .onConflictDoNothing()
      .returning({ id: hermesTenantNotifications.id });

    return Array.isArray(inserted) && inserted.length > 0;
  } catch (error: unknown) {
    console.error('[TenantNotifications] No se pudo crear la notificación:', error);
    return false;
  }
}

export async function listTenantNotifications(
  tenantId: string,
  options: { limit?: number; unreadOnly?: boolean } = {}
): Promise<TenantNotification[]> {
  const normalized = tenantId.toLowerCase().trim();
  if (!db || !normalized) return [];
  try {
    const where = options.unreadOnly
      ? and(eq(hermesTenantNotifications.tenantId, normalized), isNull(hermesTenantNotifications.readAt))
      : eq(hermesTenantNotifications.tenantId, normalized);

    const rows = await db
      .select({
        id: hermesTenantNotifications.id,
        tenantId: hermesTenantNotifications.tenantId,
        kind: hermesTenantNotifications.kind,
        severity: hermesTenantNotifications.severity,
        title: hermesTenantNotifications.title,
        body: hermesTenantNotifications.body,
        link: hermesTenantNotifications.link,
        createdAt: hermesTenantNotifications.createdAt,
        readAt: hermesTenantNotifications.readAt,
      })
      .from(hermesTenantNotifications)
      .where(where)
      .orderBy(desc(hermesTenantNotifications.createdAt))
      .limit(Math.min(options.limit ?? 20, 100));

    return rows;
  } catch (error: unknown) {
    console.error('[TenantNotifications] Error listando:', error);
    return [];
  }
}

export async function markTenantNotificationsRead(tenantId: string, ids: string[]): Promise<number> {
  const normalized = tenantId.toLowerCase().trim();
  if (!db || !normalized || ids.length === 0) return 0;
  try {
    const updated = await db
      .update(hermesTenantNotifications)
      .set({ readAt: new Date() })
      .where(
        and(eq(hermesTenantNotifications.tenantId, normalized), inArray(hermesTenantNotifications.id, ids))
      )
      .returning({ id: hermesTenantNotifications.id });
    return Array.isArray(updated) ? updated.length : 0;
  } catch (error: unknown) {
    console.error('[TenantNotifications] Error marcando leídas:', error);
    return 0;
  }
}

/**
 * Crea el aviso de trial correspondiente (si toca) y devuelve la etapa aplicada.
 * El `dedupeKey` incluye la fecha de fin, así un ciclo futuro vuelve a avisar.
 */
export async function ensureTrialReminder(params: {
  tenantId: string;
  trialEndsAt: Date | string | null | undefined;
  now?: Date;
}): Promise<TrialReminderStage> {
  const { stage, daysLeft } = computeTrialReminderStage(params.trialEndsAt, params.now);
  if (!stage) return null;

  const endsAt = params.trialEndsAt instanceof Date ? params.trialEndsAt : new Date(params.trialEndsAt as string);
  const cycle = endsAt.toISOString().slice(0, 10);
  const copy = STAGE_COPY[stage];

  await createTenantNotification({
    tenantId: params.tenantId,
    kind: 'TRIAL_REMINDER',
    severity: copy.severity,
    title: copy.title,
    body: copy.body,
    link: '/portal',
    dedupeKey: `trial:${cycle}:${stage}`,
    metadata: { stage, daysLeft, trialEndsAt: endsAt.toISOString() },
  });

  return stage;
}
