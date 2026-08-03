/**
 * Meta Cloud API Provider — WhatsApp Provider Layer 2
 *
 * Enterprise-grade WhatsApp via Meta's official Cloud API.
 * Recommended for high-availability production workloads.
 *
 * Tier: enterprise
 */

import type {
  IWhatsAppProvider,
  WhatsAppOutboundMessage,
  WhatsAppProviderResponse,
  WhatsAppInboundMessage,
} from './types.js';
import { WHATSAPP, validateWhatsAppConfig } from '../config.js';

export class MetaWhatsAppProvider implements IWhatsAppProvider {
  readonly providerId = 'meta';
  readonly displayName = 'Meta Cloud API';
  readonly tier = 'enterprise' as const;

  async sendMessage(message: WhatsAppOutboundMessage): Promise<WhatsAppProviderResponse> {
    if (!validateWhatsAppConfig()) {
      return { success: false, error: 'Meta WhatsApp: phone number ID or token not configured.' };
    }

    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: message.to,
      type: 'text',
      text: { body: message.body },
    };

    if (message.replyToMessageId) {
      body.context = { message_id: message.replyToMessageId };
    }

    try {
      const res = await fetch(`${WHATSAPP.API_URL}/${WHATSAPP.PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP.TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        return { success: false, error: JSON.stringify(json), rawResponse: json };
      }

      const messages = json.messages as Array<{ id: string }> | undefined;
      return { success: true, messageId: messages?.[0]?.id, rawResponse: json };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  verifyWebhook(payload: unknown, signature: string): boolean {
    // Meta uses X-Hub-Signature-256 — full HMAC verification
    // For now returns true; production should compute HMAC(WHATSAPP_APP_SECRET, rawBody)
    void payload;
    void signature;
    return true;
  }

  parseInbound(payload: unknown): WhatsAppInboundMessage | null {
    try {
      const p = payload as Record<string, unknown>;
      const entry = (p.entry as Record<string, unknown>[])?.[0];
      const changes = (entry?.changes as Record<string, unknown>[])?.[0];
      const value = changes?.value as Record<string, unknown> | undefined;
      const messages = value?.messages as Record<string, unknown>[] | undefined;
      const msg = messages?.[0];
      if (!msg) return null;

      return {
        from: msg.from as string,
        messageId: msg.id as string,
        body: (msg.text as Record<string, string>)?.body ?? '',
        type: (msg.type as WhatsAppInboundMessage['type']) ?? 'text',
        timestamp: msg.timestamp ? parseInt(String(msg.timestamp), 10) : undefined,
      };
    } catch {
      return null;
    }
  }
}
