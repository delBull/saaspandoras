import axios from 'axios';

export interface EscalationPayload {
  tenantSlug: string;
  externalConversationId: string;
  externalUserId: string;
  channel: string;
  reason: string;
  transcriptSummary: string;
  dashboardUrl: string;
  operatorId?: string;
}

export class DiscordWebhookService {
  /**
   * Resolves the proper Discord Webhook URL based on the tenant.
   * Priority: 1) Operator Webhook, 2) Tenant Webhook, 3) ENV Fallback
   */
  private static async getWebhookUrl(tenantSlug: string, operatorId?: string): Promise<string | undefined> {
    const { db } = await import('@/db');
    const { projects, users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // 1. Try Operator's personal webhook if assigned
    if (operatorId) {
      const operator = await db.query.users.findFirst({
        where: eq(users.id, operatorId),
        columns: { discordWebhookUrl: true }
      });
      if (operator?.discordWebhookUrl) {
        return operator.discordWebhookUrl;
      }
    }

    // 2. Try Tenant's configured webhook
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, tenantSlug),
      columns: { discordWebhookUrl: true }
    });
    if (project?.discordWebhookUrl) {
      return project.discordWebhookUrl;
    }

    // 3. Fallback to env variables
    const envKey = `DISCORD_WEBHOOK_${tenantSlug.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
    return process.env[envKey] || process.env.DISCORD_WEBHOOK_PLATFORM_DEFAULT;
  }

  /**
   * Dispatches an escalation alert to the appropriate Discord channel.
   */
  public static async dispatchEscalation(payload: EscalationPayload): Promise<boolean> {
    const webhookUrl = await this.getWebhookUrl(payload.tenantSlug, payload.operatorId);

    if (!webhookUrl) {
      console.warn(`[Discord Webhook] No webhook configured for tenant: ${payload.tenantSlug}`);
      return false;
    }

    try {
      const discordPayload = {
        embeds: [
          {
            title: `🚨 Nueva Escalación (HITL): ${payload.tenantSlug}`,
            description: `**Razón:** ${payload.reason}\n\n**Resumen de la IA:**\n${payload.transcriptSummary}`,
            color: 0xff0000, // Red
            fields: [
              { name: 'Canal', value: payload.channel, inline: true },
              { name: 'Usuario', value: payload.externalUserId, inline: true },
              { name: 'Chat ID', value: payload.externalConversationId, inline: true },
            ],
            // Link to the Growth OS Kanban / Inbox
            url: payload.dashboardUrl,
            footer: {
              text: "Pandora's Growth OS - HITL Escalation Router"
            },
            timestamp: new Date().toISOString()
          }
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Atender en Growth OS',
                style: 5,
                url: payload.dashboardUrl
              }
            ]
          }
        ]
      };

      await axios.post(webhookUrl, discordPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      console.log(`[Discord Webhook] Escalation dispatched for ${payload.externalConversationId} to tenant ${payload.tenantSlug}`);
      return true;
    } catch (error: any) {
      console.error('[Discord Webhook] Failed to dispatch escalation:', error.message);
      // Fail-open for the bot: we don't want the bot to crash if Discord is down.
      // We just log it so the Admin pipeline can catch failed dispatches.
      return false;
    }
  }
}
