/**
 * 🛰️ SCHEDULER TELEGRAM NOTIFIER
 * src/lib/scheduling/scheduler-telegram-notifier.ts
 *
 * Dedicated router for scheduling notifications via Telegram.
 * Strict architectural separation:
 * 1. Tenant Bookings: Dispatched via Tenant's bot & channel without leaking to Pandoras.
 * 2. Pandoras Bookings: Dispatched via Hermes master bot, separated by role:
 *    - Founder / SuperAdmin (Marco)
 *    - Operations / Growth pipeline
 */

export interface SchedulerTelegramNotificationParams {
  bookingId: string;
  startTime: Date;
  lead: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  };
  meetingLink?: string;
  tenantSlug?: string;
  project?: {
    id: number;
    title: string;
    slug: string;
    tenantRuntimeConfig?: any;
    extraConfig?: any;
  } | null;
  hostUserId?: string;
  hostRole?: 'FOUNDER' | 'OPERATIONS' | 'MEMBER';
}

export async function sendSchedulerTelegramAlert(
  params: SchedulerTelegramNotificationParams
): Promise<{ success: boolean; channel: 'tenant' | 'pandoras_founder' | 'pandoras_ops' | 'skipped'; error?: string }> {
  const { bookingId, startTime, lead, meetingLink, tenantSlug, project, hostUserId, hostRole } = params;

  const dateStr = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(startTime);

  const isPandorasProject = !project || project.slug === 'pandoras' || project.slug === 'saaspandoras' || tenantSlug === 'pandoras';

  // ─────────────────────────────────────────────────────────────
  // 1. TENANT DISPATCH ROUTE
  // ─────────────────────────────────────────────────────────────
  if (!isPandorasProject && project) {
    const tenantTitle = project.title || tenantSlug || 'Tenant Project';
    
    // Resolve Tenant Telegram Bot Token & Chat ID
    const tenantRuntime = project.tenantRuntimeConfig || {};
    const tenantSecrets = tenantRuntime.secrets || {};
    const tenantExtra = project.extraConfig || {};

    const tenantBotToken =
      tenantSecrets.telegramBotToken ||
      tenantRuntime.telegramBotToken ||
      (project.slug === 'snarai' ? process.env.TELEGRAM_SNARAI_BOT_TOKEN : null) ||
      process.env.TELEGRAM_TENANT_BOT_TOKEN;

    const tenantChatId =
      tenantRuntime.telegramNotificationChatId ||
      tenantRuntime.telegramChatId ||
      tenantExtra.telegramChatId ||
      (project.slug === 'snarai' ? process.env.TELEGRAM_SNARAI_CHAT_ID : null) ||
      process.env.TELEGRAM_TENANT_CHAT_ID;

    if (!tenantBotToken || !tenantChatId) {
      console.info(
        `[SchedulerTelegram] No Telegram bot credentials configured for tenant '${project.slug}'. Skipping tenant telegram alert.`
      );
      return { success: true, channel: 'skipped' };
    }

    const messageHtml = [
      `📅 <b>[Nueva Cita Agendada - ${tenantTitle}]</b>`,
      ``,
      `👤 <b>Prospecto:</b> ${lead.name}`,
      `📧 <b>Email:</b> ${lead.email}`,
      `📱 <b>Teléfono:</b> ${lead.phone || 'No especificado'}`,
      `⏰ <b>Fecha y Hora:</b> ${dateStr}`,
      meetingLink ? `🔗 <b>Enlace:</b> ${meetingLink}` : null,
      lead.notes ? `📝 <b>Notas:</b> ${lead.notes}` : null,
      ``,
      `<i>ID: ${bookingId} • Notificación del canal de ${tenantTitle}</i>`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const resp = await fetch(`https://api.telegram.org/bot${tenantBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tenantChatId,
          text: messageHtml,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`[SchedulerTelegram] Error dispatching to tenant telegram:`, errText);
        return { success: false, channel: 'tenant', error: errText };
      }

      return { success: true, channel: 'tenant' };
    } catch (err: any) {
      console.error(`[SchedulerTelegram] Exception sending tenant telegram alert:`, err);
      return { success: false, channel: 'tenant', error: err?.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PANDORAS HQ DISPATCH ROUTE (WITH ROLE SEPARATION)
  // ─────────────────────────────────────────────────────────────
  const masterBotToken = process.env.HERMES_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

  if (!masterBotToken) {
    console.warn(`[SchedulerTelegram] TELEGRAM_BOT_TOKEN not configured for Pandora's master alerts.`);
    return { success: false, channel: 'skipped', error: 'NO_MASTER_BOT_TOKEN' };
  }

  // Determine role destination
  const isFounderHost =
    hostRole === 'FOUNDER' ||
    (hostUserId && (
      hostUserId === 'marco_founder' ||
      hostUserId.toLowerCase().includes('founder') ||
      hostUserId.toLowerCase().includes('admin') ||
      hostUserId === 'usr_platform_admin_default'
    ));

  let targetChatId: string | undefined;
  let targetRole: 'pandoras_founder' | 'pandoras_ops';
  let headerTitle: string;
  let assignedLabel: string;

  if (isFounderHost) {
    targetRole = 'pandoras_founder';
    targetChatId =
      process.env.MARCO_TELEGRAM_ID ||
      process.env.FOUNDER_TELEGRAM_ID ||
      process.env.TELEGRAM_ADMIN_CHAT_ID;
    headerTitle = `👑 <b>[Pandora's Founder Session] Nueva Reunión VIP</b>`;
    assignedLabel = `Marco (Founder & SuperAdmin)`;
  } else {
    targetRole = 'pandoras_ops';
    targetChatId =
      process.env.TELEGRAM_OPS_CHAT_ID ||
      process.env.TELEGRAM_ADMIN_CHAT_ID;
    headerTitle = `⚙️ <b>[Pandora's Operations] Cita de Pipeline Agendada</b>`;
    assignedLabel = `Equipo de Operaciones & Growth`;
  }

  if (!targetChatId) {
    console.warn(`[SchedulerTelegram] No target Telegram Chat ID configured for ${targetRole}.`);
    return { success: true, channel: 'skipped' };
  }

  const messageHtml = [
    headerTitle,
    ``,
    `👤 <b>Prospecto:</b> ${lead.name}`,
    `📧 <b>Email:</b> ${lead.email}`,
    `📱 <b>Teléfono:</b> ${lead.phone || 'No especificado'}`,
    `⏰ <b>Fecha y Hora:</b> ${dateStr}`,
    meetingLink ? `🔗 <b>Enlace de llamada:</b> ${meetingLink}` : null,
    lead.notes ? `📝 <b>Notas:</b> ${lead.notes}` : null,
    ``,
    `🎯 <b>Asignado a:</b> ${assignedLabel}`,
    `<i>ID: ${bookingId} • Hermes Sovereign Scheduling</i>`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const resp = await fetch(`https://api.telegram.org/bot${masterBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[SchedulerTelegram] Error sending Pandoras ${targetRole} alert:`, errText);
      return { success: false, channel: targetRole, error: errText };
    }

    return { success: true, channel: targetRole };
  } catch (err: any) {
    console.error(`[SchedulerTelegram] Exception sending Pandoras telegram alert:`, err);
    return { success: false, channel: targetRole, error: err?.message };
  }
}
