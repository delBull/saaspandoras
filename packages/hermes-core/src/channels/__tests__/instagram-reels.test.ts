import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstagramPublisher } from '../publishers/instagram-publisher';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const context = { canonicalOrgId: 'pandoras', integrationId: 'env:instagram', accountHandle: '@snarai', metadata: {} };
const credentials = { igUserId: '17841425380042995', accessToken: 'IGAAQtoken', apiBase: 'https://graph.facebook.com/v21.0' };

const reelPayload = {
  text: 'Recorrido por S\'Narai.',
  contentType: 'video' as const,
  mediaUrls: ['https://cdn.example.com/reel.mp4'],
  idempotencyKey: 'reel-1:instagram:env',
};

beforeEach(() => {
  vi.stubEnv('IG_REELS_POLL_DELAY_MS', '0');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('InstagramPublisher · reels', () => {
  it('crea el contenedor REELS, espera FINISHED y publica', async () => {
    const calls: Array<{ url: string; body?: any; method?: string }> = [];
    let polls = 0;

    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      if (init?.method === 'POST' && url.endsWith('/media')) {
        calls.push({ url, body: JSON.parse(init.body), method: 'POST' });
        return jsonResponse({ id: 'reel-container' });
      }
      if (init?.method === 'POST' && url.endsWith('/media_publish')) {
        calls.push({ url, body: JSON.parse(init.body), method: 'POST' });
        return jsonResponse({ id: 'reel-post-1' });
      }
      // Sondas de estado
      polls += 1;
      calls.push({ url, method: 'GET' });
      if (url.includes('fields=permalink')) return jsonResponse({ permalink: 'https://instagram.com/reel/1' });
      return jsonResponse({ status_code: polls < 3 ? 'IN_PROGRESS' : 'FINISHED' });
    }));

    const publisher = new InstagramPublisher();
    const receipt = await publisher.publish(credentials, reelPayload, context);

    expect(receipt.success).toBe(true);
    expect(receipt.externalPostId).toBe('reel-post-1');

    const create = calls.find((c) => c.method === 'POST' && c.url.endsWith('/media'));
    expect(create?.body.media_type).toBe('REELS');
    expect(create?.body.video_url).toBe('https://cdn.example.com/reel.mp4');
    expect(create?.body.caption).toContain("S'Narai");

    const publish = calls.find((c) => c.method === 'POST' && c.url.endsWith('/media_publish'));
    expect(publish?.body.creation_id).toBe('reel-container');

    // 2 sondas IN_PROGRESS + 1 FINISHED
    expect(calls.filter((c) => c.method === 'GET' && c.url.includes('status_code')).length).toBe(3);
  });

  it('no publica si Meta deja el video en ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      if (init?.method === 'POST' && url.endsWith('/media')) return jsonResponse({ id: 'reel-container' });
      if (init?.method === 'POST' && url.endsWith('/media_publish')) return jsonResponse({ id: 'no-deberia' });
      return jsonResponse({ status_code: 'ERROR' });
    }));

    const publisher = new InstagramPublisher();
    const receipt = await publisher.publish(credentials, reelPayload, context);

    expect(receipt.success).toBe(false);
    expect(receipt.errorMessage).toContain('ERROR');
  });

  it('si el video sigue procesándose, devuelve retryable (no lo da por publicado)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      if (init?.method === 'POST' && url.endsWith('/media')) return jsonResponse({ id: 'reel-container' });
      if (init?.method === 'POST' && url.endsWith('/media_publish')) return jsonResponse({ id: 'no-deberia' });
      return jsonResponse({ status_code: 'IN_PROGRESS' });
    }));

    const publisher = new InstagramPublisher();
    const receipt = await publisher.publish(credentials, reelPayload, context);

    expect(receipt.success).toBe(false);
    expect(receipt.retryable).toBe(true);
    expect(String(receipt.errorMessage)).toContain('procesándose');
  });

  it('un reel sin video https se rechaza sin llamar a Meta', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const publisher = new InstagramPublisher();
    const receipt = await publisher.publish(credentials, { ...reelPayload, mediaUrls: [] }, context);

    expect(receipt.success).toBe(false);
    expect(receipt.errorCode).toBe('PROVIDER_PAYLOAD_INVALID');
    expect(String(receipt.errorMessage)).toContain('Reels');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
