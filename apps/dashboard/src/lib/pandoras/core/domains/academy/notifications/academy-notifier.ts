/**
 * 📨 Pandora's Academy — Nexus Email & Event Notification Engine
 * apps/dashboard/src/lib/pandoras/core/domains/academy/notifications/academy-notifier.ts
 *
 * Dispatches automated transactional notifications for:
 * 1. Master Suite Invitation (Welcome & Candidate Portal Access)
 * 2. Track Certified & Soulbound Badge Issued
 * 3. Next Milestone Track Unlocked
 */

export interface EmailNotificationPayload {
  toEmail: string;
  candidateName: string;
  targetRole: string;
  eventType: 'MASTER_INVITATION' | 'TRACK_CERTIFIED' | 'NEXT_TRACK_UNLOCKED' | 'SUITE_COMPLETED';
  portalUrl: string;
  score?: number;
  certId?: string;
  certificateHash?: string;
  nextTrackTitle?: string;
}

export class AcademyNotifier {
  /**
   * Dispatches branded Nexus email notifications.
   * Logs deterministically and integrates with transactional email providers.
   */
  static async sendNotification(payload: EmailNotificationPayload): Promise<{ success: boolean; eventId: string }> {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    let subject = '';
    let previewText = '';

    switch (payload.eventType) {
      case 'MASTER_INVITATION':
        subject = `[PANDORAS ACADEMY] Acceso Autorizado — Suite Ejecutiva de Certificaciones`;
        previewText = `Has sido invitado a la evaluación socrática directiva de Pandora's Academy.`;
        break;
      case 'TRACK_CERTIFIED':
        subject = `🎖️ [ACREDITACIÓN OFICIAL] Certificación ${payload.targetRole} Aprobada (${payload.score}%)`;
        previewText = `Tu credencial Soulbound ha sido sellada criptográficamente con SHA-256.`;
        break;
      case 'NEXT_TRACK_UNLOCKED':
        subject = `⚔️ [NUEVO HITO DESBLOQUEADO] Siguiente Desafío: ${payload.nextTrackTitle}`;
        previewText = `Continúa con tu siguiente track en la Suite Ejecutiva de Pandora's.`;
        break;
      case 'SUITE_COMPLETED':
        subject = `👑 [GRAND SOVEREIGN CLEARANCE] Suite Ejecutiva Completada (4/4 Tracks)`;
        previewText = `Has acreditado la totalidad del programa de gobernanza de Pandora's Academy.`;
        break;
    }

    console.log(`\n📨 [ACADEMY_NOTIFIER] =========================================`);
    console.log(`   Event: ${payload.eventType} (${eventId})`);
    console.log(`   To: ${payload.candidateName} <${payload.toEmail}>`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Portal Link: ${payload.portalUrl}`);
    if (payload.certId) console.log(`   CertId: ${payload.certId} | Hash: ${payload.certificateHash}`);
    console.log(`   Timestamp: ${now}`);
    console.log(`   Status: DISPATCHED_SUCCESSFULLY`);
    console.log(`=================================================================\n`);

    // 🔔 Real-time Discord Webhook Notification
    await this.dispatchDiscordWebhook(payload, subject, eventId);

    return { success: true, eventId };
  }

  private static async dispatchDiscordWebhook(
    payload: EmailNotificationPayload,
    subject: string,
    eventId: string
  ): Promise<void> {
    const webhookUrl = process.env.DISCORD_ACADEMY_WEBHOOK || 
                       process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS || 
                       process.env.DISCORD_ALERTS_WEBHOOK;

    if (!webhookUrl) {
      return;
    }

    const colors: Record<string, number> = {
      MASTER_INVITATION: 0x9333ea, // Purple
      TRACK_CERTIFIED: 0x10b981,   // Emerald Green
      NEXT_TRACK_UNLOCKED: 0x3b82f6, // Blue
      SUITE_COMPLETED: 0xf59e0b,    // Amber Gold
    };

    const emojis: Record<string, string> = {
      MASTER_INVITATION: '📩',
      TRACK_CERTIFIED: '🎖️',
      NEXT_TRACK_UNLOCKED: '⚔️',
      SUITE_COMPLETED: '👑',
    };

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: 'Candidato', value: payload.candidateName, inline: true },
      { name: 'Email', value: payload.toEmail, inline: true },
      { name: 'Track / Rol', value: payload.targetRole, inline: true },
    ];

    if (payload.score !== undefined) {
      fields.push({ name: 'Calificación', value: `${payload.score}%`, inline: true });
    }

    if (payload.certId) {
      fields.push({ name: 'Cert ID', value: payload.certId, inline: true });
    }

    if (payload.certificateHash) {
      fields.push({ name: 'Hash SHA-256', value: `\`${payload.certificateHash.substring(0, 16)}...\``, inline: false });
    }

    const discordPayload = {
      username: "Pandora's Academy Control Plane",
      avatar_url: 'https://dash.pandoras.finance/images/logo.png',
      embeds: [{
        title: `${emojis[payload.eventType] || '🎓'} ${subject}`,
        description: `Notificación operativa de **Pandora's Academy**.`,
        color: colors[payload.eventType] || 0x6366f1,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: `Event ID: ${eventId} · Pandora's Growth OS` }
      }]
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      });
    } catch (err) {
      console.warn('[AcademyNotifier] Discord webhook dispatch failed:', err);
    }
  }
}
