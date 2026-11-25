import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstagramPublisher } from '../publishers/instagram-publisher';
import type { PublicationPayload } from '../publishers/publisher.types';

const fetchMock = vi.fn();
const publisher = new InstagramPublisher();

const creds = { igUserId: 'ig1', accessToken: 'tok' };
const ctx = { canonicalOrgId: 'snarai', integrationId: 'i1', accountHandle: 'snarai' };

function payload(overrides: Partial<PublicationPayload> = {}): PublicationPayload {
  return {
    text: 'Avance de obra en Bucerías.',
    mediaUrls: ['https://cdn/x.jpg'],
    contentType: 'image',
    idempotencyKey: 'k1',
    ...overrides,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('Instagram Publisher', () => {
  it('exige imagen: sin media no llama a la API', async () => {
    const r = await publisher.publish(creds, payload({ mediaUrls: [] }), ctx);
    expect(r.success).toBe(false);
    expect(r.errorCode).toBe('PROVIDER_PAYLOAD_INVALID');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('flujo contenedor → publicar → permalink', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'container1' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'media1' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ permalink: 'https://instagram.com/p/abc' }) });

    const r = await publisher.publish(creds, payload(), ctx);

    expect(r.success).toBe(true);
    expect(r.externalPostId).toBe('media1');
    expect(r.externalUrl).toBe('https://instagram.com/p/abc');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(fetchMock.mock.calls[1]![1].body)).creation_id).toBe('container1');
  });

  it('si el permalink falla, sigue siendo éxito (no se inventa URL)', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'container1' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'media1' }) })
      .mockRejectedValueOnce(new Error('permissions'));

    const r = await publisher.publish(creds, payload(), ctx);
    expect(r.success).toBe(true);
    expect(r.externalUrl).toBeUndefined();
  });

  it('falla en el contenedor y no publica', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: { message: 'bad image' } }) });
    const r = await publisher.publish(creds, payload(), ctx);
    expect(r.success).toBe(false);
    expect(r.errorCode).toBe('PROVIDER_PAYLOAD_INVALID');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rate limit al publicar es reintentable', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'container1' }) })
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ error: { message: 'slow' } }) });

    const r = await publisher.publish(creds, payload(), ctx);
    expect(r.errorCode).toBe('PROVIDER_RATE_LIMIT');
    expect(r.retryable).toBe(true);
  });

  it('trunca el caption a 2200 caracteres', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'c' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'm' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    await publisher.publish(creds, payload({ text: 'x'.repeat(3000) }), ctx);
    const caption = JSON.parse(String(fetchMock.mock.calls[0]![1].body)).caption;
    expect(caption.length).toBeLessThanOrEqual(2200);
  });
});
