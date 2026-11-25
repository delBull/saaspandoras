/**
 * 📘 Facebook Page Publisher (ADR-020)
 *
 * Publica en la página del tenant con la Graph API de Meta.
 * Credenciales por tenant (cifradas en `tenant_social_integrations`):
 *   { pageId, accessToken }
 *
 * Invariantes:
 *  1. Sin `pageId` + `accessToken` no se intenta publicar (fail-closed).
 *  2. Se devuelve el id real que entrega Meta; nunca se inventa éxito.
 *  3. Los errores se normalizan a `PublicationReceipt` (auth, rate limit, red).
 */
import type {
  IChannelPublisher,
  PublicationPayload,
  PublicationReceipt,
  PublisherContext,
  PublicationErrorCode,
} from './publisher.types';

const GRAPH = 'https://graph.facebook.com/v21.0';

function mapError(status: number): { errorCode: PublicationErrorCode; retryable: boolean } {
  if (status === 401 || status === 403) return { errorCode: 'PROVIDER_AUTH_EXPIRED', retryable: false };
  if (status === 429) return { errorCode: 'PROVIDER_RATE_LIMIT', retryable: true };
  if (status >= 500) return { errorCode: 'PROVIDER_NETWORK_ERROR', retryable: true };
  return { errorCode: 'PROVIDER_PAYLOAD_INVALID', retryable: false };
}

export class FacebookPagePublisher implements IChannelPublisher {
  readonly channel = 'facebook' as const;

  async publish(
    credentials: Record<string, unknown>,
    payload: PublicationPayload,
    context: PublisherContext,
  ): Promise<PublicationReceipt> {
    const pageId = String(credentials?.pageId || '').trim();
    const accessToken = String(credentials?.accessToken || '').trim();

    if (!pageId || !accessToken) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_AUTH_INVALID',
        errorMessage: 'Faltan pageId o accessToken de la página de Facebook.',
        retryable: false,
      };
    }

    // Facebook no exige imagen: si hay, se publica como foto; si no, como texto.
    const imageUrl = payload.mediaUrls?.find((url) => /^https:\/\//i.test(url));
    const isPhoto = Boolean(imageUrl);

    const endpoint = isPhoto ? `${GRAPH}/${pageId}/photos` : `${GRAPH}/${pageId}/feed`;
    const body: Record<string, unknown> = isPhoto
      ? { url: imageUrl, caption: payload.text, access_token: accessToken }
      : { message: payload.text, access_token: accessToken };

    if (!isPhoto && payload.ctaUrl && !String(body.message).includes(payload.ctaUrl)) {
      body.message = `${payload.text}\n\n${payload.ctaUrl}`;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.id) {
        const rawId = String(data.id);
        const postId = rawId.includes('_') ? rawId.split('_').pop()! : rawId;
        return {
          success: true,
          channel: this.channel,
          externalPostId: rawId,
          externalUrl: `https://www.facebook.com/${postId}`,
          publishedAt: new Date().toISOString(),
          idempotencyKey: payload.idempotencyKey,
        };
      }

      const mapped = mapError(res.status);
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: mapped.errorCode,
        errorMessage: `Facebook API: ${data?.error?.message || `HTTP ${res.status}`}`,
        retryable: mapped.retryable,
      };
    } catch (err: any) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_NETWORK_ERROR',
        errorMessage: err?.message || 'No se pudo alcanzar la Graph API de Meta.',
        retryable: true,
      };
    }
  }
}
