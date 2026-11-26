/**
 * Frontera del webhook: verificación GET, firma HMAC obligatoria y fail-closed
 * cuando el tenant no tiene app secret. La lógica de negocio vive en
 * `lib/social/instagram` y se prueba aparte; aquí se prueba el contrato con Meta.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const handleInstagramEvent = vi.fn(async () => 'SENT' as const);
const resolveInstagramIdentity = vi.fn();
const verifyMetaSignature = vi.fn(() => true);

vi.mock('@/lib/social/instagram', () => ({
  handleInstagramEvent: (...args: any[]) => handleInstagramEvent(...args as []),
  parseInstagramWebhook: (body: any) => {
    const entry = body?.entry?.[0];
    const events = (entry?.changes || []).map((change: any) => ({
      kind: change.field === 'comments' ? 'comment' : 'message',
      externalId: String(change.value?.id || change.value?.message?.mid || ''),
      senderId: 'u-1',
      text: String(change.value?.text || change.value?.message?.text || ''),
    }));
    return { igUserId: entry?.id ? String(entry.id) : null, events };
  },
  resolveInstagramIdentity: () => resolveInstagramIdentity(),
  verifyInstagramChallenge: (token: string | null) => token === 'verify-test',
}));

vi.mock('@/lib/whatsapp/security', () => ({
  verifyMetaSignature: (...args: any[]) => (verifyMetaSignature as any)(...args),
}));

import { GET, POST } from '../route';

const identity = {
  igUserId: '17841400000000001',
  tenantSlug: 'snarai',
  canonicalOrgId: '9079ecf5-2162-4078-bddf-66b607e2d32f',
  apiBase: 'https://graph.instagram.com/v21.0',
  appSecret: 'secreto-snarai',
  secretSource: 'META_APP_SECRET_SNARAI',
  isPlatform: false,
};

function post(body: any, headers: Record<string, string> = { 'x-hub-signature-256': 'sha256=abc' }) {
  return POST(new Request('https://dash.pandoras.finance/api/v1/external/instagram/webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }));
}

const COMMENT_BODY = {
  object: 'instagram',
  entry: [{
    id: '17841400000000001',
    changes: [{ field: 'comments', value: { id: 'c-1', text: 'SNARAI', from: { id: 'u-1' } } }],
  }],
};

beforeEach(() => {
  handleInstagramEvent.mockClear();
  verifyMetaSignature.mockClear();
  resolveInstagramIdentity.mockReset();
  resolveInstagramIdentity.mockResolvedValue(identity);
  vi.stubEnv('NODE_ENV', 'test');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET verificación de Meta', () => {
  it('devuelve el challenge con el token correcto', async () => {
    const res = await GET(new Request(
      'https://x/api/v1/external/instagram/webhook?hub.mode=subscribe&hub.verify_token=verify-test&hub.challenge=12345',
    ));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('12345');
  });

  it('rechaza con 403 un token distinto o un modo incorrecto', async () => {
    const wrong = await GET(new Request(
      'https://x/api/v1/external/instagram/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1',
    ));
    expect(wrong.status).toBe(403);

    const badMode = await GET(new Request(
      'https://x/api/v1/external/instagram/webhook?hub.mode=unsubscribe&hub.verify_token=verify-test',
    ));
    expect(badMode.status).toBe(403);
  });
});

describe('POST del webhook', () => {
  it('rechaza con 401 si la firma no valida', async () => {
    verifyMetaSignature.mockReturnValueOnce(false);
    const res = await post(COMMENT_BODY);

    expect(res.status).toBe(401);
    expect(handleInstagramEvent).not.toHaveBeenCalled();
  });

  it('rechaza con 401 si falta la cabecera de firma', async () => {
    const res = await POST(new Request('https://x/api/v1/external/instagram/webhook', {
      method: 'POST',
      body: JSON.stringify(COMMENT_BODY),
    }));

    expect(res.status).toBe(401);
    expect(handleInstagramEvent).not.toHaveBeenCalled();
  });

  it('valida la firma con el secreto del tenant, no con el global', async () => {
    await post(COMMENT_BODY);
    expect(verifyMetaSignature).toHaveBeenCalledWith(expect.any(String), 'sha256=abc', 'secreto-snarai');
  });

  it('procesa el evento y responde 200 con el resumen', async () => {
    const res = await post(COMMENT_BODY);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ received: true, tenant: 'snarai', events: 1, results: { SENT: 1 } });
    expect(handleInstagramEvent).toHaveBeenCalledTimes(1);
  });

  it('fail-closed con 500 si al tenant le falta el app secret en producción', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    resolveInstagramIdentity.mockResolvedValue({ ...identity, appSecret: '' });

    const res = await post(COMMENT_BODY);
    expect(res.status).toBe(500);
    expect(handleInstagramEvent).not.toHaveBeenCalled();
  });

  it('responde 200 sin procesar cuando la cuenta no tiene tenant', async () => {
    resolveInstagramIdentity.mockResolvedValue(null);

    const res = await post(COMMENT_BODY);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ received: true, tenant: null });
    expect(handleInstagramEvent).not.toHaveBeenCalled();
  });

  it('ignora con 200 un objeto que no es de Instagram', async () => {
    const res = await post({ object: 'page', entry: [] });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: 'page' });
  });

  it('no rompe la respuesta si el envío falla', async () => {
    handleInstagramEvent.mockResolvedValueOnce('FAILED' as any);
    const res = await post(COMMENT_BODY);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ results: { FAILED: 1 } });
  });

  it('rechaza un body que no es JSON', async () => {
    const res = await POST(new Request('https://x/api/v1/external/instagram/webhook', {
      method: 'POST',
      body: 'no-es-json',
    }));
    expect(res.status).toBe(400);
  });
});
