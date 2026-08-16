import { db } from '@/db';
import { channelIdentityBindings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { WhatsAppAdapter } from '../channels/adapters/whatsapp-adapter';
import { TelegramAdapter } from '../channels/adapters/telegram-adapter';

export class HermesOperationalAlerts {
  private static async sendAlert(tenantId: string, message: string) {
    try {
      const activeBindings = await db.select().from(channelIdentityBindings).where(
        eq(channelIdentityBindings.identityId, tenantId)
      );

      // Deduplication: Pick WhatsApp > Telegram
      let whatsapp: string | undefined;
      let telegram: string | undefined;

      for (const b of activeBindings) {
        if (b.status !== 'ACTIVE') continue;
        if (b.channel === 'whatsapp') whatsapp = b.externalUserId;
        if (b.channel === 'telegram') telegram = b.externalUserId;
      }

      const whatsappAdapter = new WhatsAppAdapter();
      const telegramAdapter = new TelegramAdapter();

      if (whatsapp) {
        await whatsappAdapter.send({
          organizationId: tenantId,
          conversationId: `conv_wa_${tenantId}_${whatsapp}`,
          content: message,
          message: { messageId: `alert_${Date.now()}`, content: message, externalMessageId: '' }
        } as any);
      } else if (telegram) {
        await telegramAdapter.send({
          organizationId: tenantId,
          conversationId: `conv_tg_${tenantId}_${telegram}`,
          content: message,
          message: { messageId: `alert_${Date.now()}`, content: message, externalMessageId: '' }
        } as any);
      }
    } catch (error) {
      console.error(`[HermesOperationalAlerts] Failed to send alert to ${tenantId}:`, error);
    }
  }

  static async notifyNewUser(tenantId: string, userName: string) {
    const message = `🤖 *Hermes (Operaciones)*\n\nNotificación: Un nuevo cliente potencial (*${userName}*) se acaba de registrar en su Portal Operativo. Recomiendo monitorear su actividad o iniciar un acercamiento comercial.`;
    await this.sendAlert(tenantId, message);
  }

  static async notifyDeposit(tenantId: string, amount: number) {
    const message = `🤖 *Hermes (Finanzas)*\n\n¡Excelentes noticias! Se ha detectado un nuevo depósito de *$${amount.toLocaleString()} USDC* en su proyecto. Su tesorería ha sido actualizada.`;
    await this.sendAlert(tenantId, message);
  }
}
