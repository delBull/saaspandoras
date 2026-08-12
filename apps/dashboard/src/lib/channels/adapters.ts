import { db } from "@/db";
import { channelIdentityBindings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface ChannelSendRequest {
  identityId: string;
  correlationId: string;
  projectId: string | null;
  content: string;
}

export interface ExecutionResult {
  success: boolean;
  channel: string;
  error?: string;
  messageId?: string;
}

export interface ChannelAdapter {
  send(request: ChannelSendRequest): Promise<ExecutionResult>;
}

// ------------------------------------------------------------------
// Telegram Adapter
// ------------------------------------------------------------------
export class TelegramAdapter implements ChannelAdapter {
  async send(request: ChannelSendRequest): Promise<ExecutionResult> {
    // 1. Resolve Channel Identity
    const binding = await db.query.channelIdentityBindings.findFirst({
      where: and(
        eq(channelIdentityBindings.identityId, request.identityId),
        eq(channelIdentityBindings.channel, "telegram")
      )
    });

    if (!binding) {
      return { success: false, channel: "telegram", error: "No Telegram binding found for identity" };
    }

    const chatId = binding.externalUserId;
    // 2. Fetch Channel Credentials
    // For Phase 4, we use env. Future: fetch from tenant db based on request.projectId
    const token = process.env.HERMES_TELEGRAM_BOT_TOKEN;
    if (!token) {
      return { success: false, channel: "telegram", error: "Telegram bot token missing" };
    }

    // 3. Execute Send
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: request.content
        })
      });

      const data = await res.json();
      if (!data.ok) {
        return { success: false, channel: "telegram", error: data.description };
      }

      return { success: true, channel: "telegram", messageId: data.result.message_id.toString() };
    } catch (err: any) {
      return { success: false, channel: "telegram", error: err.message };
    }
  }
}

// ------------------------------------------------------------------
// WhatsApp Adapter
// ------------------------------------------------------------------
export class WhatsAppAdapter implements ChannelAdapter {
  async send(request: ChannelSendRequest): Promise<ExecutionResult> {
    const binding = await db.query.channelIdentityBindings.findFirst({
      where: and(
        eq(channelIdentityBindings.identityId, request.identityId),
        eq(channelIdentityBindings.channel, "whatsapp")
      )
    });

    if (!binding) {
      return { success: false, channel: "whatsapp", error: "No WhatsApp binding found for identity" };
    }

    const waId = binding.externalUserId;
    // For Phase 4, we use env. Future: fetch from tenant db.
    const phoneNumberId = process.env.HERMES_WHATSAPP_PHONE_NUMBER_ID || process.env.HERMES_WHATSAPP_PHONE_NUMBER;
    const token = process.env.WHATSAPP_ACCESS_TOKEN; 

    if (!phoneNumberId || !token) {
      return { success: false, channel: "whatsapp", error: "WhatsApp configuration missing" };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: waId,
          type: "text",
          text: { body: request.content }
        })
      });

      const data = await res.json();
      if (data.error) {
        return { success: false, channel: "whatsapp", error: data.error.message };
      }

      return { success: true, channel: "whatsapp", messageId: data.messages?.[0]?.id };
    } catch (err: any) {
      return { success: false, channel: "whatsapp", error: err.message };
    }
  }
}

// ------------------------------------------------------------------
// Email Adapter
// ------------------------------------------------------------------
export class EmailAdapter implements ChannelAdapter {
  async send(request: ChannelSendRequest): Promise<ExecutionResult> {
    const binding = await db.query.channelIdentityBindings.findFirst({
      where: and(
        eq(channelIdentityBindings.identityId, request.identityId),
        eq(channelIdentityBindings.channel, "email")
      )
    });

    if (!binding) {
      return { success: false, channel: "email", error: "No Email binding found for identity" };
    }

    // Stub for Resend / SendGrid
    console.log(`[EmailAdapter] Stub: Sending email to ${binding.address}`);
    return { success: true, channel: "email", messageId: `email_${Date.now()}` };
  }
}
