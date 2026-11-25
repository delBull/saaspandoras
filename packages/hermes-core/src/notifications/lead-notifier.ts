/**
 * 🧲 Aviso de lead capturado (ADR-020 · canales por tenant)
 *
 * Un lead es un evento de negocio: lo ve el equipo del tenant y, si el tenant
 * configuró su canal, se publica ahí. El aviso operativo de plataforma lo sigue
 * mandando el Growth Engine (con el nombre del proyecto y el score); aquí **no** se
 * duplica para no llenar dos canales con el mismo evento.
 */
import { insertTenantNotification, postWebhook, resolveTenantWebhook, type WebhookDelivery } from './approval-notifier';

const DEFAULT_BASE_URL = 'https://dash.pandoras.finance';

export interface LeadCapturedNoticeInput {
  canonicalOrgId: string;
  leadId: string;
  name?: string | null;
  source?: string | null;
  interest?: string | null;
}

export function buildLeadNotice(input: LeadCapturedNoticeInput) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const who = (input.name || 'Sin nombre').slice(0, 120);
  const origin = input.source ? ` · origen \`${input.source}\`` : '';

  return {
    link: `/portal/${encodeURIComponent(input.canonicalOrgId)}/crm`,
    inApp: {
      kind: 'LEAD',
      title: `Nuevo lead · ${input.canonicalOrgId}`,
      body: `${who}${origin}${input.interest ? ` · interés: ${input.interest}` : ''}`,
      dedupeKey: `lead:${input.leadId}`,
    },
    embed: {
      username: "Pandora's · Growth",
      embeds: [
        {
          title: 'Nuevo lead capturado',
          url: `${base}${'/portal/' + encodeURIComponent(input.canonicalOrgId) + '/crm'}`,
          description: `**${who}**${origin}`,
          color: 0x10b981,
          fields: [
            { name: 'Organización', value: input.canonicalOrgId, inline: true },
            { name: 'Interés', value: input.interest || 'no indicado', inline: true },
            { name: 'Lead', value: `\`${input.leadId}\``, inline: false },
          ],
          footer: { text: 'Aviso del tenant. El seguimiento se hace en el portal.' },
          timestamp: new Date().toISOString(),
        },
      ],
    },
  };
}

/**
 * Avisa del lead al tenant (in-app + su canal, si lo tiene). Nunca lanza y no
 * manda nada a canales globales: si el tenant no configuró canal, sólo queda el
 * registro in-app.
 */
export async function notifyLeadCaptured(input: LeadCapturedNoticeInput): Promise<{
  inApp: boolean;
  webhook: WebhookDelivery;
}> {
  const notice = buildLeadNotice(input);

  const inApp = await insertTenantNotification({
    tenantId: input.canonicalOrgId,
    kind: notice.inApp.kind,
    title: notice.inApp.title,
    body: notice.inApp.body,
    link: notice.link,
    dedupeKey: notice.inApp.dedupeKey,
    metadata: { leadId: input.leadId, source: input.source ?? null, interest: input.interest ?? null },
  });

  // Mismo criterio que las aprobaciones: si ya estaba avisado, no se repite.
  if (!inApp) return { inApp: false, webhook: 'SKIPPED' };

  const webhookUrl = await resolveTenantWebhook(input.canonicalOrgId, 'leads');
  const webhook = webhookUrl ? await postWebhook(webhookUrl, notice.embed) : 'SKIPPED';

  return { inApp, webhook };
}
