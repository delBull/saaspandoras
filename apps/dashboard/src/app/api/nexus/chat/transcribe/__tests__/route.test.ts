/**
 * Transcripción del chat interno (Whisper).
 *
 * Lo que se prueba aquí es el contrato de la frontera: sin sesión, sin clave,
 * sin audio o con audio enorme, responde con un código explícito y **no** llama
 * al proveedor. Sólo en el caso válido se transcribe.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let authContext: any = { isAuthenticated: true, email: 'marco@pandoras.finance' };
const createTranscription = vi.fn();

vi.mock('@saasfly/shared', () => ({
  getNexusAuthContext: async () => authContext,
}));

vi.mock('openai', () => {
  class FakeOpenAI {
    audio = { transcriptions: { create: createTranscription } };
    constructor(public options: any) {}
  }
  return {
    default: FakeOpenAI,
    toFile: async (buffer: Buffer, name: string, opts: any) => ({ buffer, name, ...opts }),
  };
});

import { POST } from '../route';

function formWithBytes(bytes: Uint8Array, type = 'audio/webm') {
  const form = new FormData();
  form.append('audio', new File([bytes], 'voice.webm', { type }));
  return form;
}

function post(form: FormData) {
  return POST(new Request('https://dash.pandoras.finance/api/nexus/chat/transcribe', {
    method: 'POST',
    body: form,
  }));
}

beforeEach(() => {
  createTranscription.mockReset();
  createTranscription.mockResolvedValue({ text: '  hola Pablo, revisa el deal  ' });
  authContext = { isAuthenticated: true, email: 'marco@pandoras.finance' };
  vi.stubEnv('OPENAI_API_KEY', 'sk-test');
  delete process.env.OPENAI_TRANSCRIBE_MODEL;
  delete process.env.OPENAI_TRANSCRIBE_LANGUAGE;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/nexus/chat/transcribe', () => {
  it('exige sesión Nexus', async () => {
    authContext = { isAuthenticated: false };
    const res = await post(formWithBytes(new Uint8Array([1, 2, 3])));
    expect(res.status).toBe(401);
    expect(createTranscription).not.toHaveBeenCalled();
  });

  it('falla cerrado si no hay clave del proveedor', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const res = await post(formWithBytes(new Uint8Array([1, 2, 3])));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('TRANSCRIPTION_NOT_CONFIGURED');
    expect(createTranscription).not.toHaveBeenCalled();
  });

  it('rechaza si falta el audio', async () => {
    const res = await post(new FormData());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('MISSING_AUDIO');
    expect(createTranscription).not.toHaveBeenCalled();
  });

  it('rechaza un audio vacío', async () => {
    const res = await post(formWithBytes(new Uint8Array([])));
    expect(res.status).toBe(400);
    expect(createTranscription).not.toHaveBeenCalled();
  });

  it('rechaza audio mayor a 25 MB sin llamar al proveedor', async () => {
    const big = new Uint8Array(25 * 1024 * 1024 + 1);
    const res = await post(formWithBytes(big));
    expect(res.status).toBe(413);
    expect(createTranscription).not.toHaveBeenCalled();
  });

  it('transcribe con whisper-1 en español por defecto', async () => {
    const res = await post(formWithBytes(new Uint8Array([1, 2, 3, 4])));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, text: 'hola Pablo, revisa el deal', model: 'whisper-1' });

    const args = createTranscription.mock.calls[0]![0];
    expect(args.model).toBe('whisper-1');
    expect(args.language).toBe('es');
    expect(args.file).toBeTruthy();
  });

  it('permite cambiar modelo e idioma por entorno', async () => {
    vi.stubEnv('OPENAI_TRANSCRIBE_MODEL', 'gpt-4o-mini-transcribe');
    vi.stubEnv('OPENAI_TRANSCRIBE_LANGUAGE', 'en');

    const res = await post(formWithBytes(new Uint8Array([9, 9])));
    expect(res.status).toBe(200);
    expect(createTranscription.mock.calls[0]![0]).toMatchObject({
      model: 'gpt-4o-mini-transcribe',
      language: 'en',
    });
  });

  it('no devuelve texto vacío como éxito', async () => {
    createTranscription.mockResolvedValue({ text: '   ' });
    const res = await post(formWithBytes(new Uint8Array([5])));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('EMPTY_TRANSCRIPTION');
  });

  it('traduce el 429 del proveedor', async () => {
    createTranscription.mockRejectedValue(Object.assign(new Error('rate limit'), { status: 429 }));
    const res = await post(formWithBytes(new Uint8Array([5])));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('PROVIDER_RATE_LIMIT');
  });

  it('cualquier otro fallo del proveedor es 502 y no filtra detalles', async () => {
    createTranscription.mockRejectedValue(new Error('invalid api key sk-secret'));
    const res = await post(formWithBytes(new Uint8Array([5])));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('TRANSCRIPTION_FAILED');
    expect(JSON.stringify(body)).not.toContain('sk-secret');
  });
});
