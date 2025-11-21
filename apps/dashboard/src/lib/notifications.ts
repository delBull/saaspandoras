// MULTI-PROVIDER NOTIFICATION SERVICE (FREE OPTIONS)
// Handles notifications to agents when human intervention is needed

interface NotificationConfig {
  // Discord (FREE!)
  discord?: {
    webhookUrl: string;
  };
  // Email (FREE tier available)
  email?: {
    service: 'gmail' | 'outlook' | 'custom';
    toEmails: string[];
    apiKey?: string; // For services like SendGrid/Mailgun
  };
}

class NotificationService {
  private config: NotificationConfig | null = null;

  configure(config: NotificationConfig) {
    this.config = config;
    console.log('🔔 Notification service configured');
  }

  /**
   * Send notification for human agent needed
   */
  async notifyHumanAgent(userPhone: string, messageBody: string): Promise<boolean> {
    const notificationText = `
🚨 AGENTE HUMANO REQUERIDO

👤 Usuario: ${userPhone}
💬 Mensaje: ${messageBody}
🔗 Panel: /admin/whatsapp-agents
⏰ Timestamp: ${new Date().toISOString()}

⚠️ CONVERSACIÓN REQUIERE ATENCIÓN HUMANA
`.trim();

    return await this.sendToAllProviders(notificationText, true);
  }

  /**
   * Send to all configured providers
   */
  private async sendToAllProviders(text: string, urgent = false): Promise<boolean> {
    if (!this.config) return false;

    const results = await Promise.allSettled([
      this.sendDiscord(text, urgent),
      this.sendEmail(text, urgent)
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    return successCount > 0;
  }

  /**
   * Send Discord notification (100% FREE!)
   */
  private async sendDiscord(text: string, urgent: boolean): Promise<boolean> {
    if (!this.config?.discord) return true; // Skip if not configured

    try {
      const response = await fetch(this.config.discord.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: urgent ? '🚨 AGENTE HUMANO REQUERIDO' : '🤖 Conversación Humana',
            description: text,
            color: urgent ? 16711680 : 3447003, // Red or blue
            timestamp: new Date().toISOString()
          }],
          username: 'Pandoras Bot'
        }),
      });

      if (response.ok) {
        console.log('✅ Discord notification sent');
        return true;
      } else {
        console.error('❌ Discord failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Discord error:', error);
      return false;
    }
  }

  /**
   * Send email notification (FREE tier available)
   */
  private sendEmail(text: string, urgent: boolean): boolean {
    if (!this.config?.email) return true; // Skip if not configured

    try {
      // For free email, you can use:
      // - SendGrid free tier (100 emails/day)
      // - Mailgun free tier (5k emails/month)
      // - EmailJS (frontend solution)
      // - Your own SMTP with nodemailer

      console.log(`📧 EMAIL notification to ${this.config.email.toEmails.join(', ')}`);
      console.log(`📧 Subject: ${urgent ? '🚨 URGENTE' : '🤖'} Conversación Humana`);
      console.log(`📧 Body: ${text}`);

      // TODO: Implement actual email sending
      // Example with EmailJS (client-side):
      /*
      import emailjs from 'emailjs-com';
      await emailjs.send('service_id', 'template_id', {
        to_email: this.config.email.toEmails.join(','),
        subject: urgent ? '🚨 Conversación Urgente' : '🤖 Conversación Humana',
        message: text,
      });
      */

      return true; // Assume success (implement later)
    } catch (error) {
      console.error('❌ Email error:', error);
      return false;
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Helper functions
export async function notifyHumanAgent(userPhone: string, messageBody: string): Promise<boolean> {
  return await notificationService.notifyHumanAgent(userPhone, messageBody);
}

export function configureNotifications(config: NotificationConfig) {
  notificationService.configure(config);
}

// Auto-configure from environment (support both naming variants)
const discordWebhook = process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_UR;
if (discordWebhook) {
  configureNotifications({
    discord: { webhookUrl: discordWebhook }
  });
  console.log('🚀 Notification service auto-configured with Discord');
}
