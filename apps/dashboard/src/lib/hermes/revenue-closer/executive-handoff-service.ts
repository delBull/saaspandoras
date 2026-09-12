/**
 * Hermes Revenue Closer — Executive Handoff Service
 * src/lib/hermes/revenue-closer/executive-handoff-service.ts
 *
 * Dispatches compiled Executive Handoff summaries to brokers / sales directors.
 * Supports multi-channel push (Telegram notification, WhatsApp alert, or CRM event).
 */

import { ExecutiveHandoffSummary, HandoffDispatchResult } from '../contracts/handoff';

export interface HandoffNotificationSender {
  sendTelegramAlert?: (chatId: string, message: string) => Promise<boolean>;
  sendWhatsAppAlert?: (phone: string, message: string) => Promise<boolean>;
}

export class ExecutiveHandoffService {
  /**
   * Formats the Executive Handoff summary into an actionable Markdown / Telegram alert.
   */
  static formatHandoffNotification(handoff: ExecutiveHandoffSummary): string {
    const lines = [
      `🔥 *NUEVO LEAD CALIFICADO PARA CIERRE*`,
      ``,
      `👤 *Prospecto:* ${handoff.leadName}`,
      `📱 *Contacto:* ${handoff.contactIdentifier} (${handoff.primaryChannel.toUpperCase()})`,
      `💰 *Presupuesto Estimado:* ${handoff.opportunity.budgetEstimate || 'En evaluación'}`,
      `🎯 *Interés:* ${handoff.opportunity.interestSummary}`,
      `⚠️ *Urgencia:* ${handoff.urgency}`,
      ``,
      handoff.opportunity.appointmentDate
        ? `📅 *Cita Agendada:* ${new Date(handoff.opportunity.appointmentDate).toLocaleString()}`
        : `📅 *Estado de Cita:* Pendiente de confirmar hora`,
      handoff.opportunity.meetingLink ? `🔗 *Enlace Meet:* ${handoff.opportunity.meetingLink}` : '',
      ``,
      `💡 *Ángulo de Cierre Recomendado:*`,
      `${handoff.recommendedClosingAngle}`,
      ``,
      `📝 *Resumen de Conversación:*`,
      `${handoff.conversationSummary}`,
      ``,
      `_Hermes Revenue Closer · Pandoras Growth OS_`
    ].filter(Boolean);

    return lines.join('\n');
  }

  /**
   * Dispatches the handoff to the broker's destination channel.
   */
  static async dispatchHandoff(
    handoff: ExecutiveHandoffSummary,
    destination: {
      channel: 'telegram_push' | 'whatsapp_push' | 'crm_notification';
      recipientIdentifier: string;
    },
    sender?: HandoffNotificationSender
  ): Promise<HandoffDispatchResult> {
    const alertText = this.formatHandoffNotification(handoff);
    let success = true;

    try {
      if (destination.channel === 'telegram_push' && sender?.sendTelegramAlert) {
        success = await sender.sendTelegramAlert(destination.recipientIdentifier, alertText);
      } else if (destination.channel === 'whatsapp_push' && sender?.sendWhatsAppAlert) {
        success = await sender.sendWhatsAppAlert(destination.recipientIdentifier, alertText);
      }
    } catch {
      success = false;
    }

    return {
      success,
      handoffId: handoff.id,
      recipientChannel: destination.channel,
      deliveredAt: new Date().toISOString()
    };
  }
}
