import { Redis } from 'ioredis';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/lib/whatsapp/utils/client';

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

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

    if (redis) {
      try {
        await redis.set(handoffKey, JSON.stringify({
          pausedAt: Date.now(),
          reason,
          lastUserMessage
        }), 'EX', 86400); // 24 hours pause
      } catch (redisErr) {
        console.warn('[HumanHandoff] Redis pause write skipped:', redisErr);
      }
    }

    // 1. Fetch project runtime config to get tenant's chosen alert channel
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
    const alertBody = `Cliente: ${chatId}\nMotivo: ${reason}\nÚltimo mensaje: "${lastUserMessage}"\nAccede al portal para responder.`;

    // 2. Dispatch to the Tenant's chosen channel
    try {
      switch (channel) {
        case 'discord': {
          const webhookUrl = alertConfig.discordWebhookUrl || process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;
          if (webhookUrl) {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                embeds: [{
                  title: alertTitle,
                  color: 0xef4444,
                  fields: [
                    { name: 'Organización', value: tenantTitle, inline: true },
                    { name: 'Cliente / Chat ID', value: chatId, inline: true },
                    { name: 'Motivo de Escalación', value: reason, inline: false },
                    { name: 'Último Mensaje del Cliente', value: lastUserMessage, inline: false },
                  ],
                  timestamp: new Date().toISOString(),
                }],
              }),
            });
            alertSent = true;
          }
          break;
        }

        case 'telegram': {
          const targetChatId = alertConfig.telegramChatId;
          const tgToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
          if (targetChatId && tgToken) {
            await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: targetChatId,
                text: `${alertTitle}\n\n${alertBody}`,
                parse_mode: 'HTML',
              }),
            });
            alertSent = true;
          }
          break;
        }

        case 'whatsapp': {
          const targetPhone = alertConfig.whatsappPhone;
          if (targetPhone) {
            await sendWhatsAppMessage(targetPhone, `${alertTitle}\n\n${alertBody}`);
            alertSent = true;
          }
          break;
        }

        case 'email': {
          const targetEmail = alertConfig.email;
          if (targetEmail && process.env.RESEND_API_KEY) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: "Hermes Alert <noreply@dash.pandoras.finance>",
                to: [targetEmail],
                subject: alertTitle,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; color: #111;">
                    <h2 style="color: #ef4444;">🚨 Intervención Humana Requerida</h2>
                    <p>Hermes ha pausado la respuesta automática para atender a un cliente que requiere asistencia humana directa.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Organización</td><td style="padding: 8px; border: 1px solid #ddd;">${tenantTitle}</td></tr>
                      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Cliente</td><td style="padding: 8px; border: 1px solid #ddd;">${chatId}</td></tr>
                      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Motivo</td><td style="padding: 8px; border: 1px solid #ddd;">${reason}</td></tr>
                      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Mensaje</td><td style="padding: 8px; border: 1px solid #ddd;">${lastUserMessage}</td></tr>
                    </table>
                  </div>
                `,
              }),
            });
            alertSent = true;
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
    if (!redis) return false;
    const key = `hermes:handoff:${projectId}:${chatId}`;
    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch {
      return false;
    }
  }
}
