/**
 * 🐦 X (Twitter) Direct Sovereign Publisher (FASE 2)
 * apps/dashboard/src/lib/hermes/channels/publishers/x-publisher.ts
 *
 * Publishes directly to X via Twitter API v2 using OAuth 2.0 PKCE User Token.
 *
 * MANDATORY INVARIANTS:
 * 1. OAuth 2.0 PKCE context (Bearer token), no manual 4-key API secret leaking.
 * 2. Requires verified Tweet ID from Twitter API; never fakes success.
 * 3. Normalizes API v2 error responses into formal PublicationReceipt.
 */

import type {
  IChannelPublisher,
  PublicationPayload,
  PublicationReceipt,
  PublisherContext,
  PublicationErrorCode,
} from './publisher.types';

export class XPublisher implements IChannelPublisher {
  readonly channel = 'x' as const;

  async publish(
    credentials: Record<string, unknown>,
    payload: PublicationPayload,
    context: PublisherContext
  ): Promise<PublicationReceipt> {
    const accessToken = credentials?.accessToken as string;

    if (!accessToken) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_AUTH_INVALID',
        errorMessage: 'Missing OAuth 2.0 User Access Token. Channel requires OAuth PKCE connection.',
        retryable: false,
      };
    }

    let tweetText = payload.text;
    if (payload.ctaUrl && !tweetText.includes(payload.ctaUrl)) {
      tweetText = `${tweetText}\n\n${payload.ctaUrl}`;
    }

    // Twitter limit 280 characters
    if (tweetText.length > 280) {
      tweetText = tweetText.slice(0, 277) + '...';
    }

    const endpoint = 'https://api.twitter.com/2/tweets';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: tweetText }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.data?.id) {
        const tweetId = String(data.data.id);
        const externalUrl = `https://x.com/i/status/${tweetId}`;

        return {
          success: true,
          channel: this.channel,
          externalPostId: tweetId,
          externalUrl,
          publishedAt: new Date().toISOString(),
          idempotencyKey: payload.idempotencyKey,
        };
      }

      const status = res.status;
      const errorDetail = data?.detail || data?.title || `HTTP ${status}`;
      let errorCode: PublicationErrorCode = 'PROVIDER_PAYLOAD_INVALID';
      let retryable = false;

      if (status === 401 || status === 403) {
        errorCode = 'PROVIDER_AUTH_EXPIRED';
        retryable = false;
      } else if (status === 429) {
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
        errorMessage: `Twitter API Error: ${errorDetail}`,
        retryable,
      };
    } catch (networkErr: any) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_NETWORK_ERROR',
        errorMessage: networkErr?.message || 'Network connection failed reaching Twitter API',
        retryable: true,
      };
    }
  }
}
