import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FacebookPagePublisher } from '../publishers/facebook-publisher';
import type { PublicationPayload } from '../publishers/publisher.types';

const fetchMock = vi.fn();
const publisher = new FacebookPagePublisher();

const creds = { pageId: '123', accessToken: 'tok' };
const ctx = { canonicalOrgId: 'snarai', integrationId: 'i1', accountHandle: 'snarai' };

function payload(overrides: Partial<PublicationPayload> = {}): PublicationPayload {
  return {
    text: 'Avance de obra en Bucerías.',
    contentType: 'text',
    idempotencyKey: 'k1',
    ...overrides,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('Facebook Page Publisher', () => {
  it('sin credenciales no llama a la API', async () => {
    const r = await publisher.publish({}, payload(), ctx);
    expect(r.success).toBe(false);
    expect(r.errorCode).toBe('PROVIDER_AUTH_INVALID');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('publica texto con enlace en /feed', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: '123_456' }) });
    const r = await publisher.publish(creds, payload({ ctaUrl: 'https://dash.pandoras.finance/join/snarai' }), ctx);

    expect(r.success).toBe(true);
    expect(r.externalUrl).toBe('https://www.facebook.com/456');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/123/feed');
    const body = JSON.parse(String(init.body));
    expect(body.message).toContain('join/snarai');
  });

  it('con imagen publica en /photos', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: '123_789' }) });
    const r = await publisher.publish(creds, payload({ mediaUrls: ['https://cdn/x.jpg'] }), ctx);

    expect(r.success).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/123/photos');
    expect(JSON.parse(String(init.body)).url).toBe('https://cdn/x.jpg');
  });

  it('traduce rate limit y auth', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ error: { message: 'slow' } }) });
    const limited = await publisher.publish(creds, payload(), ctx);
    expect(limited.errorCode).toBe('PROVIDER_RATE_LIMIT');
    expect(limited.retryable).toBe(true);

    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: { message: 'bad token' } }) });
    const expired = await publisher.publish(creds, payload(), ctx);
    expect(expired.errorCode).toBe('PROVIDER_AUTH_EXPIRED');
    expect(expired.retryable).toBe(false);
  });
});
