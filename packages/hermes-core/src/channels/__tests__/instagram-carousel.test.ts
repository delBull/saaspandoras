import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstagramPublisher } from '../publishers/instagram-publisher';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const context = { canonicalOrgId: 'pandoras', integrationId: 'env:instagram', accountHandle: '@snarai', metadata: {} };
const credentials = { igUserId: '17841425380042995', accessToken: 'IGAAQtoken', apiBase: 'https://graph.instagram.com/v21.0' };

const basePayload = {
  text: 'Qué es un Título de Propiedad.',
  contentType: 'image' as const,
  idempotencyKey: 'proposal-1:instagram:env',
};

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('InstagramPublisher · imagen única', () => {
  it('crea un contenedor y publica', async () => {
    const calls: Array<{ url: string; body: any }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      const body = JSON.parse(init.body);
      calls.push({ url, body });
      if (url.endsWith('/media')) return jsonResponse({ id: 'container-1' });
      if (url.endsWith('/media_publish')) return jsonResponse({ id: 'post-1' });
      return jsonResponse({ error: { message: 'no esperado' } }, 500);
    }));

    const publisher = new InstagramPublisher();
    const receipt = await publisher.publish(credentials, {
      ...basePayload,
      mediaUrls: ['https://cdn.example.com/a.jpg'],
    }, context);

    expect(receipt.success).toBe(true);
    expect(receipt.externalPostId).toBe('post-1');
    expect(calls).toHaveLength(2);
    expect(calls[0].body.image_url).toBe('https://cdn.example.com/a.jpg');
    expect(calls[0].body.is_carousel_item).toBeUndefined();
    expect(calls[1].body.creation_id).toBe('container-1');
  });
});

describe('InstagramPublisher · carrusel', () => {
  it('crea un contenedor por slide, uno padre y publica', async () => {
    const calls: Array<{ url: string; body: any }> = [];
    let child = 0;

    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      const body = JSON.parse(init.body);
      calls.push({ url, body });

      if (url.endsWith('/media')) {
        if (body.media_type === 'CAROUSEL') return jsonResponse({ id: 'carousel-1' });
        child += 1;
        return jsonResponse({ id: `child-${child}` });
      }
      if (url.endsWith('/media_publish')) return jsonResponse({ id: 'post-carousel' });
      return jsonResponse({}, 500);
    }));

    const publisher = new InstagramPublisher();
    const receipt = await publisher.publish(credentials, {
      ...basePayload,
      text: 'Qué es un Título de Propiedad.',
      mediaUrls: [
        'https://cdn.example.com/1.jpg',
        'https://cdn.example.com/2.jpg',
        'https://cdn.example.com/3.jpg',
        'https://cdn.example.com/4.jpg',
      ],
    }, context);

    expect(receipt.success).toBe(true);
    expect(receipt.externalPostId).toBe('post-carousel');

    const mediaCalls = calls.filter((c) => c.url.endsWith('/media'));
    const carouselCall = mediaCalls.find((c) => c.body.media_type === 'CAROUSEL');
    const childCalls = mediaCalls.filter((c) => c.body.is_carousel_item === true);

    expect(childCalls).toHaveLength(4);
    expect(childCalls.every((c) => c.body.caption === undefined)).toBe(true);
    expect(carouselCall?.body.children).toBe('child-1,child-2,child-3,child-4');
    expect(carouselCall?.body.caption).toContain('Título de Propiedad');

    const publishCall = calls.find((c) => c.url.endsWith('/media_publish'));
    expect(publishCall?.body.creation_id).toBe('carousel-1');
  });

  it('si un slide falla, no publica nada', async () => {
    let mediaCount = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/media')) {
        mediaCount += 1;
        if (mediaCount === 2) return jsonResponse({ error: { message: 'imagen inválida' } }, 400);
        return jsonResponse({ id: `child-${mediaCount}` });
      }
      return jsonResponse({ id: 'no-deberia-llegar' });
    }));

    const publisher = new InstagramPublisher();
    const receipt = await publisher.publish(credentials, {
      ...basePayload,
      mediaUrls: ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg'],
    }, context);

    expect(receipt.success).toBe(false);
    expect(receipt.errorMessage).toContain('carrusel');
    expect(mediaCount).toBe(2); // no llegó al contenedor padre
  });

  it('sin imágenes https no intenta publicar', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const publisher = new InstagramPublisher();
    const receipt = await publisher.publish(credentials, {
      ...basePayload,
      mediaUrls: ['http://inseguro.example.com/a.jpg'],
    }, context);

    expect(receipt.success).toBe(false);
    expect(receipt.errorCode).toBe('PROVIDER_PAYLOAD_INVALID');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
