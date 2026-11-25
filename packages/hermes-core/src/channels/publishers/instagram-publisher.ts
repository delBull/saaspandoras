/**
 * 📸 Instagram Publisher (ADR-020)
 *
 * Instagram **exige imagen**: el flujo es contenedor → publicar.
 * Credenciales por tenant: `{ igUserId, accessToken }` (cuenta profesional
 * vinculada a la página de Facebook).
 *
 * Invariantes:
 *  1. Sin imagen https pública no se intenta: se devuelve PAYLOAD_INVALID.
 *  2. Sólo se declara éxito cuando Meta devuelve el id del media publicado.
 *  3. Si no se puede leer el permalink, se devuelve el media id igual (sin inventar URL).
 */
import type {
  IChannelPublisher,
  PublicationPayload,
  PublicationReceipt,
  PublisherContext,
  PublicationErrorCode,
} from './publisher.types';

/**
 * Meta tiene dos caminos para publicar en Instagram:
 *  - **Instagram Login** (recomendado cuando no hay Página): `graph.instagram.com`
 *    con `instagram_business_basic` + `instagram_business_content_publish`.
 *  - **Facebook Login** (requiere Página vinculada): `graph.facebook.com`.
 * El host sale de las credenciales; nunca se adivina por el token.
 */
const DEFAULT_GRAPH = 'https://graph.facebook.com/v21.0';
const CAPTION_LIMIT = 2200;

function mapError(status: number): { errorCode: PublicationErrorCode; retryable: boolean } {
  if (status === 401 || status === 403) return { errorCode: 'PROVIDER_AUTH_EXPIRED', retryable: false };
  if (status === 429) return { errorCode: 'PROVIDER_RATE_LIMIT', retryable: true };
  if (status >= 500) return { errorCode: 'PROVIDER_NETWORK_ERROR', retryable: true };
  return { errorCode: 'PROVIDER_PAYLOAD_INVALID', retryable: false };
}

export class InstagramPublisher implements IChannelPublisher {
  readonly channel = 'instagram' as const;

  async publish(
    credentials: Record<string, unknown>,
    payload: PublicationPayload,
    context: PublisherContext,
  ): Promise<PublicationReceipt> {
    const igUserId = String(credentials?.igUserId || '').trim();
    const accessToken = String(credentials?.accessToken || '').trim();
    // `apiBase` permite usar Instagram Login (graph.instagram.com) sin Página.
    const graph = String(credentials?.apiBase || DEFAULT_GRAPH).replace(/\/$/, '');

    if (!igUserId || !accessToken) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_AUTH_INVALID',
        errorMessage: 'Faltan igUserId o accessToken de Instagram.',
        retryable: false,
      };
    }

    const imageUrl = payload.mediaUrls?.find((url) => /^https:\/\//i.test(url));
    if (!imageUrl) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_PAYLOAD_INVALID',
        errorMessage: 'Instagram requiere una imagen https pública.',
        retryable: false,
      };
    }

    const caption = payload.text.length > CAPTION_LIMIT
      ? `${payload.text.slice(0, CAPTION_LIMIT - 1)}…`
      : payload.text;

    try {
      // 1. Contenedor
      const containerRes = await fetch(`${graph}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
      });
      const container = await containerRes.json().catch(() => ({}));

      if (!containerRes.ok || !container?.id) {
        const mapped = mapError(containerRes.status);
        return {
          success: false,
          channel: this.channel,
          idempotencyKey: payload.idempotencyKey,
          errorCode: mapped.errorCode,
          errorMessage: `Instagram (contenedor): ${container?.error?.message || `HTTP ${containerRes.status}`}`,
          retryable: mapped.retryable,
        };
      }

      // 2. Publicación
      const publishRes = await fetch(`${graph}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
      });
      const published = await publishRes.json().catch(() => ({}));

      if (!publishRes.ok || !published?.id) {
        const mapped = mapError(publishRes.status);
        return {
          success: false,
          channel: this.channel,
          idempotencyKey: payload.idempotencyKey,
          errorCode: mapped.errorCode,
          errorMessage: `Instagram (publish): ${published?.error?.message || `HTTP ${publishRes.status}`}`,
          retryable: mapped.retryable,
        };
      }

      // 3. Permalink (best effort: si falla, la publicación ya existe)
      let externalUrl: string | undefined;
      try {
        const permalinkRes = await fetch(
          `${graph}/${published.id}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`,
        );
        const permalink = await permalinkRes.json().catch(() => ({}));
        if (permalink?.permalink) externalUrl = String(permalink.permalink);
      } catch {
        // sin URL, pero con id: no se inventa nada
      }

      return {
        success: true,
        channel: this.channel,
        externalPostId: String(published.id),
        externalUrl,
        publishedAt: new Date().toISOString(),
        idempotencyKey: payload.idempotencyKey,
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
