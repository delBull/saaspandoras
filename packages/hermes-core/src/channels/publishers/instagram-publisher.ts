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

    const httpsMedia = (payload.mediaUrls ?? []).filter((url) => /^https:\/\//i.test(String(url)));
    const isVideo = payload.contentType === 'video';

    if (httpsMedia.length === 0) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_PAYLOAD_INVALID',
        errorMessage: isVideo
          ? 'Instagram Reels requiere un video https público.'
          : 'Instagram requiere una imagen https pública.',
        retryable: false,
      };
    }

    const caption = payload.text.length > CAPTION_LIMIT
      ? `${payload.text.slice(0, CAPTION_LIMIT - 1)}…`
      : payload.text;

    try {
      /**
       * Instagram exige un contenedor por imagen y, para un carrusel, un
       * contenedor padre que los agrupe. Antes sólo se publicaba `mediaUrls[0]`,
       * así que un carrusel de 4 slides salía como una sola imagen.
       */
      const images = httpsMedia.slice(0, 10);
      let creationId: string | null = null;

      if (isVideo) {
        /**
         * Reels: Meta exige crear el contenedor con `media_type=REELS` y esperar
         * a que el video se procese (`FINISHED`) antes de publicar. Publicar un
         * contenedor en `IN_PROGRESS` devuelve error.
         */
        const reelRes = await fetch(`${graph}/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: 'REELS',
            video_url: images[0],
            caption,
            share_to_feed: true,
            access_token: accessToken,
          }),
        });
        const reel = await reelRes.json().catch(() => ({}));
        if (!reelRes.ok || !reel?.id) {
          const mapped = mapError(reelRes.status);
          return {
            success: false,
            channel: this.channel,
            idempotencyKey: payload.idempotencyKey,
            errorCode: mapped.errorCode,
            errorMessage: `Instagram (reel): ${reel?.error?.message || `HTTP ${reelRes.status}`}`,
            retryable: mapped.retryable,
          };
        }

        // Espera acotada: 12 intentos × 5 s = 1 minuto como máximo.
        const pollDelayMs = Number(process.env.IG_REELS_POLL_DELAY_MS ?? 5000);
        const maxAttempts = 12;
        let ready = false;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          const statusRes = await fetch(
            `${graph}/${reel.id}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`,
          );
          const statusData = await statusRes.json().catch(() => ({}));
          const status = String(statusData?.status_code || '');

          if (status === 'FINISHED') { ready = true; break; }
          if (status === 'ERROR' || status === 'EXPIRED') {
            return {
              success: false,
              channel: this.channel,
              idempotencyKey: payload.idempotencyKey,
              errorCode: 'PROVIDER_PAYLOAD_INVALID',
              errorMessage: `Instagram (reel): el video quedó en ${status}.`,
              retryable: false,
            };
          }
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, pollDelayMs));
          }
        }

        if (!ready) {
          return {
            success: false,
            channel: this.channel,
            idempotencyKey: payload.idempotencyKey,
            errorCode: 'PROVIDER_NETWORK_ERROR',
            errorMessage: 'Instagram (reel): el video sigue procesándose; reintenta en unos minutos.',
            retryable: true,
          };
        }

        creationId = reel.id;
      } else if (images.length > 1) {
        const children: string[] = [];
        for (const child of images) {
          const childRes = await fetch(`${graph}/${igUserId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: child, is_carousel_item: true, access_token: accessToken }),
          });
          const childData = await childRes.json().catch(() => ({}));
          if (!childRes.ok || !childData?.id) {
            const mapped = mapError(childRes.status);
            return {
              success: false,
              channel: this.channel,
              idempotencyKey: payload.idempotencyKey,
              errorCode: mapped.errorCode,
              errorMessage: `Instagram (carrusel · slide): ${childData?.error?.message || `HTTP ${childRes.status}`}`,
              retryable: mapped.retryable,
            };
          }
          children.push(childData.id);
        }

        const carouselRes = await fetch(`${graph}/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: 'CAROUSEL',
            children: children.join(','),
            caption,
            access_token: accessToken,
          }),
        });
        const carousel = await carouselRes.json().catch(() => ({}));
        if (!carouselRes.ok || !carousel?.id) {
          const mapped = mapError(carouselRes.status);
          return {
            success: false,
            channel: this.channel,
            idempotencyKey: payload.idempotencyKey,
            errorCode: mapped.errorCode,
            errorMessage: `Instagram (carrusel): ${carousel?.error?.message || `HTTP ${carouselRes.status}`}`,
            retryable: mapped.retryable,
          };
        }
        creationId = carousel.id;
      } else {
        const containerRes = await fetch(`${graph}/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: images[0], caption, access_token: accessToken }),
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
        creationId = container.id;
      }

      // 2. Publicación
      const publishRes = await fetch(`${graph}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
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
