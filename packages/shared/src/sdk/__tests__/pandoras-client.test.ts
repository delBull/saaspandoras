import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as crypto from 'crypto';
import { PandorasClient } from '../pandoras-client';

describe('PandorasClient SDK', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws if apiKey is missing in constructor', () => {
    expect(() => new PandorasClient({ apiKey: '' })).toThrow('apiKey is required');
  });

  it('emits an event successfully with auth header and payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        eventId: 'evt_123',
        canonicalId: 'usr_456',
        status: 'INGESTED',
      }),
    });
    global.fetch = mockFetch;

    const client = new PandorasClient({
      apiKey: 'sk_test_abc123',
      baseUrl: 'https://test.dash.pandoras.finance/api/v1',
    });

    const result = await client.emitEvent({
      eventType: 'lead.new',
      payload: { email: 'dev@test.com', name: 'Dev User' },
      idempotencyKey: 'idem_999',
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBe('evt_123');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const call = mockFetch.mock.calls[0]!;
    const url = call[0] as string;
    const options = call[1] as RequestInit & { headers: Record<string, string> };
    expect(url).toBe('https://test.dash.pandoras.finance/api/v1/integrations/events');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe('Bearer sk_test_abc123');
    expect(options.headers['Idempotency-Key']).toBe('idem_999');
    expect(JSON.parse(options.body as string)).toEqual({
      eventType: 'lead.new',
      payload: { email: 'dev@test.com', name: 'Dev User' },
    });
  });

  it('queries lead status via GET query params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        lead: { id: 'lead_1', email: 'prospect@acme.com', stage: 'Qualified', score: 90 },
      }),
    });
    global.fetch = mockFetch;

    const client = new PandorasClient({
      apiKey: 'sk_test_abc123',
    });

    const result = await client.getLeadStatus({ email: 'prospect@acme.com' });
    expect(result.success).toBe(true);
    expect(result.lead?.stage).toBe('Qualified');

    const call = mockFetch.mock.calls[0]!;
    const url = call[0] as string;
    expect(url).toContain('/leads/status?email=prospect%40acme.com');
  });

  it('calls Hermes A2A chat endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        response: 'Hello from Hermes agent',
        model: 'llama3.1',
        runtime: 'ollama_sovereign',
      }),
    });
    global.fetch = mockFetch;

    const client = new PandorasClient({
      apiKey: 'sk_test_abc123',
    });

    const result = await client.chatA2A({
      messages: [{ role: 'user', content: 'What is our lead score?' }],
    });

    expect(result.success).toBe(true);
    expect(result.response).toBe('Hello from Hermes agent');
    expect(result.runtime).toBe('ollama_sovereign');
  });

  it('verifies webhook HMAC signatures correctly with timingSafeEqual', () => {
    const secret = 'whsec_test_secret_12345';
    const payload = JSON.stringify({ event: 'lead.new', id: 'evt_1' });

    const validSig = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    const resultValid = PandorasClient.verifyWebhookSignature(payload, validSig, secret);
    expect(resultValid.isValid).toBe(true);

    const resultInvalid = PandorasClient.verifyWebhookSignature(payload, 'deadbeef1234', secret);
    expect(resultInvalid.isValid).toBe(false);

    const resultTampered = PandorasClient.verifyWebhookSignature(
      JSON.stringify({ event: 'lead.new', id: 'evt_tampered' }),
      validSig,
      secret
    );
    expect(resultTampered.isValid).toBe(false);
  });
});
