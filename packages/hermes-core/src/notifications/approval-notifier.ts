/**
 * 🔔 Avisos de aprobación (ADR-019 · notificaciones)
 *
 * Cuando se crea una aprobación gobernada, hay que avisar a quien puede
 * resolverla. Hoy hay dos canales y sólo dos:
 *
 *   1. **In-app** (`hermes_tenant_notifications`) — registro durable, idempotente
 *      por `dedupeKey`. Siempre se escribe, aunque el resto falle.
 *   2. **Discord** — webhook del canal privado del tenant, configurado en
 *      `tenant_notification_channels`. Es un aviso: **no aprueba nada**.
 *
 * Reglas de diseño:
 *  - **Nunca hay fallback a un webhook global**: si el tenant no tiene canal, sólo
 *    queda el registro in-app. Evita que el contenido de un tenant termine en el
 *    canal de otro.
 *  - **El aviso no lleva el texto de la publicación**: sólo intención, número de
 *    publicaciones y canales. El texto se revisa en el portal, con la sesión del
 *    aprobador.
 *  - **Nunca lanza**: una notificación fallida no puede bloquear la creación de
 *    la aprobación.
 */
import crypto from 'crypto';
import { db } from '@saasfly/db-core';
import { and, eq } from '@saasfly/db-core';
import { hermesTenantNotifications, tenantNotificationChannels } from '@saasfly/db-core/schema';

const DEFAULT_BASE_URL = 'https://dash.pandoras.finance';
const WEBHOOK_TIMEOUT_MS = 3000;

export type WebhookDelivery = 'SENT' | 'SKIPPED' | 'FAILED';

export interface ApprovalNoticeInput {
  canonicalOrgId: string;
  approvalId: string;
  /** Qué se propone. Se trunca: es un aviso, no el contenido. */
  intent?: string | null;
  channels: string[];
  posts: number;
}

export interface ApprovalNotice {
  link: string;
  inApp: { title: string; body: string; dedupeKey: string };
  embed: {
    username: string;
    embeds: Array<Record<string, unknown>>;
  };
}

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

/** Ruta canónica de la bandeja de aprobaciones del tenant. */
export function approvalsLink(canonicalOrgId: string): string {
  return `${baseUrl()}/growth-os/organizations/${encodeURIComponent(canonicalOrgId)}/approvals`;
}

function truncate(value: string, max: number): string {
  const clean = value.trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

/** Construye el aviso (puro: sin DB ni red). */
export function buildApprovalNotice(input: ApprovalNoticeInput): ApprovalNotice {
  const link = approvalsLink(input.canonicalOrgId);
  const intent = input.intent?.trim() || 'Propuesta de publicación';
  const channelList = input.channels.length > 0 ? input.channels.map((c) => `#${c}`).join(', ') : '—';

  return {
    link,
    inApp: {
      title: truncate(`Aprobación pendiente · ${input.canonicalOrgId}`, 200),
      body: `${truncate(intent, 300)} — ${input.posts} publicación(es) en ${truncate(channelList, 300)}`,
      dedupeKey: `approval:${input.approvalId}`,
    },
    embed: {
      username: "Pandora's · Aprobaciones",
      embeds: [
        {
          title: 'Comunidad · publicación pendiente de aprobación',
          url: link,
          description: `**${truncate(intent, 500)}**`,
          color: 0xfbbf24,
          fields: [
            { name: 'Organización', value: truncate(input.canonicalOrgId, 100), inline: true },
            { name: 'Publicaciones', value: String(input.posts), inline: true },
            { name: 'Canales', value: truncate(channelList, 1000), inline: false },
            { name: 'Aprobación', value: `\`${truncate(input.approvalId, 100)}\``, inline: false },
          ],
          footer: {
            text: 'Se aprueba en el portal (Aprobaciones). Este mensaje no autoriza por sí mismo.',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    },
  };
}

/**
 * Webhook del tenant para avisos de aprobación.
 *
 * Devuelve `null` si no hay canal configurado o está deshabilitado. **No** cae a
 * variables globales: el tenant sin canal sólo recibe el aviso in-app.
 */
export async function resolveApprovalWebhook(canonicalOrgId: string): Promise<string | null> {
  try {
    const [row] = await db
      .select({ target: tenantNotificationChannels.target })
      .from(tenantNotificationChannels)
      .where(and(
        eq(tenantNotificationChannels.canonicalOrgId, canonicalOrgId),
        eq(tenantNotificationChannels.kind, 'approvals'),
        eq(tenantNotificationChannels.channel, 'discord_webhook'),
        eq(tenantNotificationChannels.enabled, true),
      ))
      .limit(1);

    return row?.target?.trim() || null;
  } catch (err: any) {
    console.warn('[ApprovalNotifier] No se pudo leer el canal del tenant:', err?.message || err);
    return null;
  }
}

async function postWebhook(url: string, payload: unknown): Promise<WebhookDelivery> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[ApprovalNotifier] Webhook respondió ${res.status}`);
      return 'FAILED';
    }
    return 'SENT';
  } catch (err: any) {
    // Nunca se registra la URL: es una credencial de canal.
    console.warn('[ApprovalNotifier] Webhook inaccesible:', err?.name || 'error');
    return 'FAILED';
  }
}

/**
 * Avisa que hay una aprobación pendiente.
 *
 * Escribe siempre el registro in-app (idempotente por aprobación) y, si el tenant
 * tiene canal, publica el aviso. No lanza nunca.
 */
export async function notifyApprovalPending(input: ApprovalNoticeInput): Promise<{
  inApp: boolean;
  webhook: WebhookDelivery;
}> {
  const notice = buildApprovalNotice(input);

  let inApp = false;
  try {
    const inserted = await db
      .insert(hermesTenantNotifications)
      .values({
        id: `ntf_${crypto.randomUUID()}`,
        tenantId: input.canonicalOrgId,
        kind: 'APPROVAL',
        severity: 'info',
        title: notice.inApp.title,
        body: notice.inApp.body,
        link: `/growth-os/organizations/${encodeURIComponent(input.canonicalOrgId)}/approvals`,
        dedupeKey: notice.inApp.dedupeKey,
        metadataJson: {
          approvalId: input.approvalId,
          posts: input.posts,
          channels: input.channels,
        } as any,
      })
      .onConflictDoNothing()
      .returning({ id: hermesTenantNotifications.id });
    inApp = Array.isArray(inserted) && inserted.length > 0;
  } catch (err: any) {
    console.warn('[ApprovalNotifier] No se pudo registrar el aviso in-app:', err?.message || err);
  }

  const webhookUrl = await resolveApprovalWebhook(input.canonicalOrgId);
  const webhook = webhookUrl ? await postWebhook(webhookUrl, notice.embed) : 'SKIPPED';

  return { inApp, webhook };
}
