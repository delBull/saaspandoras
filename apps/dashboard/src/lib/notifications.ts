// MULTI-PROVIDER NOTIFICATION SERVICE (FREE OPTIONS)
// Handles notifications to agents when human intervention is needed

interface NotificationConfig {
  // Discord (FREE!)
  discord?: {
    webhookUrl: string; // Default/Support channel
    applyWebhookUrl?: string; // Dedicated Applications channel
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

  get isConfigured(): boolean {
    return !!this.config;
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
   * Send notification for new project application
   */
  async notifyNewApplication(projectData: any): Promise<boolean> {
    const notificationText = `
🎉 NUEVA APLICACIÓN RECIBIDA

🚀 Proyecto: ${projectData.title}
👤 Founder: ${projectData.applicantName || 'N/A'}
💰 Capital: ${projectData.targetAmount}
⏰ Timestamp: ${new Date().toISOString()}

🔗 Ver en Dashboard: /admin/projects/${projectData.slug}
`.trim();

    // Send to Discord with Green color (not urgent) to the APPS channel
    const appWebhook = this.config?.discord?.applyWebhookUrl;
    return await this.sendDiscord(notificationText, false, 5763719, appWebhook, "Nueva Aplicación");
  }

  /**
   * Send notification for a high-intent Growth Lead (Phase 1.5)
   */
  async notifyGrowthLead(lead: any, project: any): Promise<boolean> {
    const notificationText = `
💎 **NUEVO LEAD DE ALTA INTENCIÓN**

👤 **Nombre**: ${lead.name || 'Anónimo'}
📧 **Email**: ${lead.email}
🎯 **Intención**: ${lead.intent?.toUpperCase()}
📊 **Score**: ${lead.score || 0}/100
🚀 **Proyecto**: ${project.name}

🔗 **Ver Lead**: /admin/dashboard?tab=marketing&subtab=growth-os
`.trim();

    // Route to project-specific webhook if provided, else fallback to default
    const targetWebhook = project.discordWebhookUrl || this.config?.discord?.webhookUrl;
    
    return await this.sendDiscord(notificationText, true, 3447003, targetWebhook, "Growth OS Alert");
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
  private async sendDiscord(text: string, urgent: boolean, color?: number, targetWebhook?: string, titleOverride?: string): Promise<boolean> {
    const webhookToUse = targetWebhook || this.config?.discord?.webhookUrl;
    if (!webhookToUse) {
      console.warn('⚠️ Discord notification skipped: No webhook URL configured.');
      return false; // No longer returning true for skipped notifications
    }

    try {
      const response = await fetch(webhookToUse, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: titleOverride || (urgent ? '🚨 ALERTA CRÍTICA' : '🤖 Notificación del Sistema'),
            description: text,
            color: color || (urgent ? 16711680 : 3447003), // Custom or Red/Blue
            timestamp: new Date().toISOString()
          }],
          username: 'Pandoras Growth Bot'
        }),
      });

      if (response.ok) {
        console.log('✅ Discord notification sent successfully');
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ Discord API failed (${response.status}): ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Discord network/fetch error:', error);
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

export async function notifyNewApplication(projectData: any): Promise<boolean> {
  return await notificationService.notifyNewApplication(projectData);
}

export function configureNotifications(config: NotificationConfig) {
  notificationService.configure(config);
}

// Auto-configure from environment (support both naming variants)
// Auto-configure from environment - LAZY LOADED, NOT TOP LEVEL
// Auto-configure from environment - LAZY LOADED, NOT TOP LEVEL
const discordWebhook = process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_ALERTS;
const discordApplyWebhook = process.env.DISCORD_APPLY_WEBHOOK_URL || "https://discord.com/api/webhooks/1448752441838272622/r2rdM6ch5ajcrf0nZOuzFuUOSEYYJqo3l4j2W9cIxkAAAX-Hlf4Gy8R-XE0m6djm7mUv";

export function ensureNotificationServiceConfigured() {
  // Check if already configured to avoid spamming logs
  if (notificationService.isConfigured) return;

  if (discordWebhook || discordApplyWebhook) {
    configureNotifications({
      discord: {
        webhookUrl: discordWebhook || '',
        applyWebhookUrl: discordApplyWebhook
      }
    });
    console.log('🚀 Notification service auto-configured with Discord');
  }
}

// Call this lazily when needed, or in instrumentation
// if (discordWebhook || discordApplyWebhook) ...
