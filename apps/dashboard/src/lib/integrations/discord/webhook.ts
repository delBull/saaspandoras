import axios from 'axios';

export interface EscalationPayload {
  tenantSlug: string;
  externalConversationId: string;
  externalUserId: string;
  channel: string;
  reason: string;
  transcriptSummary: string;
  dashboardUrl: string;
}

export class DiscordWebhookService {
  /**
   * Resolves the proper Discord Webhook URL based on the tenant.
   * In a real DB, this would be stored in the tenant's integration settings.
   * For now, we rely on environment variables mapping.
   */
  private static getWebhookUrl(tenantSlug: string): string | undefined {
    // Expected env var format: DISCORD_WEBHOOK_SNARAI
    const envKey = `DISCORD_WEBHOOK_${tenantSlug.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
    return process.env[envKey] || process.env.DISCORD_WEBHOOK_PLATFORM_DEFAULT;
  }

  /**
   * Dispatches an escalation alert to the appropriate Discord channel.
   */
  public static async dispatchEscalation(payload: EscalationPayload): Promise<boolean> {
    const webhookUrl = this.getWebhookUrl(payload.tenantSlug);

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
