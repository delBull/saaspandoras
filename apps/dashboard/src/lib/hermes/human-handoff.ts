import { Redis } from 'ioredis';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/lib/whatsapp/utils/client';

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 }) : null;

// In-memory fallback map for paused state when Redis is unavailable (Vercel serverless memory TTL)
const inMemoryPauseStore = new Map<string, number>();

function cleanExpiredInMemoryPauses() {
  const now = Date.now();
  for (const [key, expiresAt] of inMemoryPauseStore.entries()) {
    if (now > expiresAt) {
      inMemoryPauseStore.delete(key);
    }
  }
}

/**
 * Escapes HTML characters to prevent HTML Injection in emails and Telegram HTML parse_mode.
 */
function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates that a Discord webhook URL is strictly a legitimate Discord domain to prevent SSRF.
 */
export function isValidDiscordWebhookUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === 'https:' &&
        (parsed.hostname === 'discord.com' || parsed.hostname === 'discordapp.com') &&
        parsed.pathname.startsWith('/api/webhooks/'))
    );
  } catch {
    return false;
  }
}

export interface HandoffAlertChannelConfig {
  preferredChannel?: 'email' | 'telegram' | 'whatsapp' | 'discord';
  email?: string;
  telegramChatId?: string;
  whatsappPhone?: string;
  discordWebhookUrl?: string;
}

export class HumanHandoffProtocol {
  static async triggerHandoff(opts: {
    projectId: number;
    chatId: string;
    reason: string;
    lastUserMessage: string;
  }): Promise<{ paused: boolean; alertSent: boolean }> {
    const { projectId, chatId, reason, lastUserMessage } = opts;
    const handoffKey = `hermes:handoff:${projectId}:${chatId}`;

    // 1. Pause conversation for 24h in Redis or in-memory fallback
    if (redis) {
      try {
        await redis.set(handoffKey, JSON.stringify({
          pausedAt: Date.now(),
          reason,
          lastUserMessage
        }), 'EX', 86400); // 24 hours pause
      } catch (redisErr) {
        console.warn('[HumanHandoff] Redis pause write skipped, using in-memory store:', redisErr);
        inMemoryPauseStore.set(handoffKey, Date.now() + 86400 * 1000);
      }
    } else {
      inMemoryPauseStore.set(handoffKey, Date.now() + 86400 * 1000);
      cleanExpiredInMemoryPauses();
    }

    // 2. Fetch project runtime config to get tenant's chosen alert channel
    let alertSent = false;
    let tenantTitle = `Project #${projectId}`;
    let alertConfig: HandoffAlertChannelConfig = { preferredChannel: 'discord' };
    let botToken = '';

    try {
      const [project] = await db.select({
        title: projects.title,
        tenantRuntimeConfig: projects.tenantRuntimeConfig,
      }).from(projects).where(eq(projects.id, projectId)).limit(1);

      if (project) {
        tenantTitle = project.title;
        const config = (project.tenantRuntimeConfig as any) || {};
        if (config.handoffAlertConfig) {
          alertConfig = config.handoffAlertConfig;
        }
        botToken = config.secrets?.telegramBotToken || '';
      }
    } catch (dbErr) {
      console.warn('[HumanHandoff] DB fetch tenant config error:', dbErr);
    }

    const channel = alertConfig.preferredChannel || 'discord';
    const alertTitle = `🚨 [Hermes Handoff] Atención requerida en ${tenantTitle}`;
    const safeReason = escapeHtml(reason);
    const safeLastMessage = escapeHtml(lastUserMessage);

    // 3. Dispatch to Tenant's chosen channel with timeouts and safe encoding
    try {
      switch (channel) {
        case 'discord': {
          const webhookUrl = alertConfig.discordWebhookUrl || process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;
          if (webhookUrl && isValidDiscordWebhookUrl(webhookUrl)) {
            const res = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(5000),
              body: JSON.stringify({
                embeds: [{
                  title: alertTitle,
                  color: 0xef4444,
                  fields: [
                    { name: 'Organización', value: tenantTitle, inline: true },
                    { name: 'Cliente / Chat ID', value: chatId, inline: true },
                    { name: 'Motivo de Escalación', value: reason.substring(0, 500), inline: false },
                    { name: 'Último Mensaje del Cliente', value: lastUserMessage.substring(0, 1000), inline: false },
                  ],
                  timestamp: new Date().toISOString(),
                }],
              }),
            });
            alertSent = res.ok;
          }
          break;
        }

        case 'telegram': {
          const targetChatId = alertConfig.telegramChatId;
          const tgToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
          if (targetChatId && tgToken) {
            const tgText = `<b>${escapeHtml(alertTitle)}</b>\n\n<b>Cliente:</b> ${escapeHtml(chatId)}\n<b>Motivo:</b> ${safeReason}\n<b>Último mensaje:</b> <i>${safeLastMessage}</i>\n\nAccede al portal para responder.`;
            const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(5000),
              body: JSON.stringify({
                chat_id: targetChatId,
                text: tgText,
                parse_mode: 'HTML',
              }),
            });
            alertSent = res.ok;
          }
          break;
        }

        case 'whatsapp': {
          const targetPhone = alertConfig.whatsappPhone;
          if (targetPhone) {
            const plainText = `${alertTitle}\n\nCliente: ${chatId}\nMotivo: ${reason}\nÚltimo mensaje: "${lastUserMessage}"\nAccede al portal para responder.`;
            const waRes = await sendWhatsAppMessage(targetPhone, plainText);
            alertSent = Boolean(waRes.success);
          }
          break;
        }

        case 'email': {
          const targetEmail = alertConfig.email;
          if (targetEmail && process.env.RESEND_API_KEY) {
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(5000),
              body: JSON.stringify({
                from: "Hermes Alert <noreply@dash.pandoras.finance>",
                to: [targetEmail],
                subject: alertTitle,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; color: #111;">
                    <h2 style="color: #ef4444;">🚨 Intervención Humana Requerida</h2>
                    <p>Hermes ha pausado la respuesta automática para atender a un cliente que requiere asistencia humana directa.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Organización</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(tenantTitle)}</td></tr>
                      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Cliente</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(chatId)}</td></tr>
                      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Motivo</td><td style="padding: 8px; border: 1px solid #ddd;">${safeReason}</td></tr>
                      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Mensaje</td><td style="padding: 8px; border: 1px solid #ddd;">${safeLastMessage}</td></tr>
                    </table>
                  </div>
                `,
              }),
            });
            alertSent = res.ok;
          }
          break;
        }
      }
    } catch (dispatchErr) {
      console.error(`[HumanHandoff] Error dispatching alert to channel ${channel}:`, dispatchErr);
    }

    return { paused: true, alertSent };
  }

  static async isPaused(projectId: number, chatId: string): Promise<boolean> {
    const key = `hermes:handoff:${projectId}:${chatId}`;
    if (redis) {
      try {
        const exists = await redis.exists(key);
        if (exists === 1) return true;
      } catch {
        // Fallback to in-memory store
      }
    }

    const expiresAt = inMemoryPauseStore.get(key);
    if (expiresAt && Date.now() < expiresAt) {
      return true;
    }

    return false;
  }
}
