/**
 * ✈️ Telegram Direct Sovereign Publisher (FASE 2)
 * apps/dashboard/src/lib/hermes/channels/publishers/telegram-publisher.ts
 *
 * Publishes directly to the tenant's own Telegram channel using the tenant's bot token.
 *
 * MANDATORY INVARIANTS:
 * 1. Zero Pandora-shared bot fallback: Strictly executes against tenant's decrypted botToken.
 * 2. Never prints or leaks botToken in receipts, errors, or logs.
 * 3. Never fakes success: requires verifiable `message_id` from Telegram API.
 * 4. Normalizes error codes into PublicationReceipt (retryable vs terminal).
 */

import type {
  IChannelPublisher,
  PublicationPayload,
  PublicationReceipt,
  PublisherContext,
  PublicationErrorCode,
} from './publisher.types';

export class TelegramPublisher implements IChannelPublisher {
  readonly channel = 'telegram' as const;

  async publish(
    credentials: Record<string, unknown>,
    payload: PublicationPayload,
    context: PublisherContext
  ): Promise<PublicationReceipt> {
    const botToken = credentials?.botToken as string;
    const chatId = (credentials?.chatId as string) || (context.metadata?.chatId as string) || context.accountHandle;

    if (!botToken || !chatId) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_AUTH_INVALID',
        errorMessage: 'Missing Telegram botToken or chatId in credentials.',
        retryable: false,
      };
    }

    // Format text with CTA link if present
    let formattedText = payload.text;
    if (payload.ctaUrl && !formattedText.includes(payload.ctaUrl)) {
      formattedText = `${formattedText}\n\n🔗 Más información: ${payload.ctaUrl}`;
    }

    const hasImage = payload.contentType === 'image' && payload.mediaUrls && payload.mediaUrls.length > 0;
    const endpoint = hasImage
      ? `https://api.telegram.org/bot${botToken}/sendPhoto`
      : `https://api.telegram.org/bot${botToken}/sendMessage`;

    const requestBody = hasImage
      ? {
          chat_id: chatId,
          photo: payload.mediaUrls![0],
          caption: formattedText.slice(0, 1024), // Telegram caption limit
          parse_mode: 'HTML',
        }
      : {
          chat_id: chatId,
          text: formattedText.slice(0, 4096), // Telegram text limit
          parse_mode: 'HTML',
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json().catch(() => ({ ok: false, description: 'Invalid JSON response from Telegram' }));

      if (res.ok && data.ok === true && data.result?.message_id) {
        const messageId = String(data.result.message_id);
        const cleanHandle = chatId.startsWith('@') ? chatId.replace('@', '') : null;
        const externalUrl = cleanHandle ? `https://t.me/${cleanHandle}/${messageId}` : undefined;

        return {
          success: true,
          channel: this.channel,
          externalPostId: messageId,
          externalUrl,
          publishedAt: new Date().toISOString(),
          idempotencyKey: payload.idempotencyKey,
        };
      }

      // External Provider returned error -> Normalize
      const description = (data?.description as string) || `HTTP ${res.status}`;
      const status = res.status;
      let errorCode: PublicationErrorCode = 'PROVIDER_PAYLOAD_INVALID';
      let retryable = false;

      if (status === 401 || status === 403 || description.toLowerCase().includes('unauthorized') || description.toLowerCase().includes('blocked')) {
        errorCode = 'PROVIDER_AUTH_INVALID';
        retryable = false;
      } else if (description.toLowerCase().includes('chat not found')) {
        errorCode = 'PROVIDER_CHAT_NOT_FOUND';
        retryable = false;
      } else if (status === 429 || description.toLowerCase().includes('too many requests')) {
        errorCode = 'PROVIDER_RATE_LIMIT';
        retryable = true;
      } else if (status >= 500) {
        errorCode = 'PROVIDER_NETWORK_ERROR';
        retryable = true;
      }

      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode,
        errorMessage: `Telegram API Error: ${description}`,
        retryable,
      };
    } catch (networkErr: any) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_NETWORK_ERROR',
        errorMessage: networkErr?.message || 'Network connection failed while reaching Telegram API',
        retryable: true,
      };
    }
  }
}
