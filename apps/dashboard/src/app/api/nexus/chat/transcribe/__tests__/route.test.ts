/**
 * Transcripción del chat interno usando Ollama (modelo de audio).
 *
 * Lo que se prueba: contrato de la frontera (sesión, tamaño, errores) y que el
 * audio llegue al servidor de inferencia del tenant correcto — nunca a un
 * proveedor externo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let authContext: any = { isAuthenticated: true, email: 'marco@pandoras.finance' };

vi.mock('@saasfly/shared', () => ({
  getNexusAuthContext: async () => authContext,
}));

import { POST, cleanTranscript } from '../route';

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

const okResponse = (content: string) =>
  new Response(JSON.stringify({ message: { role: 'assistant', content } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  authContext = { isAuthenticated: true, email: 'marco@pandoras.finance' };
  vi.stubEnv('TRANSCRIBE_BASE_URL', 'http://mini.local:11434');
  vi.stubEnv('TRANSCRIBE_MODEL', 'lfm3-audio');
  delete process.env.TRANSCRIBE_API_KEY;
  vi.stubGlobal('fetch', vi.fn(async () => okResponse('"Hola Marco, esto es una prueba."')));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('cleanTranscript', () => {
  it('quita comillas y prefijos del modelo', () => {
    expect(cleanTranscript('"Hola mundo"')).toBe('Hola mundo');
    expect(cleanTranscript('Transcripción: hola mundo')).toBe('hola mundo');
    expect(cleanTranscript('  «hola   mundo»  ')).toBe('hola mundo');
    expect(cleanTranscript('')).toBe('');
    expect(cleanTranscript(null)).toBe('');
  });
});

describe('POST /api/nexus/chat/transcribe', () => {
  it('exige sesión Nexus', async () => {
    authContext = { isAuthenticated: false };
    const res = await post(formWithBytes(new Uint8Array([1, 2, 3])));
    expect(res.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rechaza audio faltante, vacío o demasiado grande sin llamar a Ollama', async () => {
    expect((await post(new FormData())).status).toBe(400);
    expect((await post(formWithBytes(new Uint8Array([])))).status).toBe(400);
    expect((await post(formWithBytes(new Uint8Array(25 * 1024 * 1024 + 1)))).status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('manda el audio a Ollama del tenant, no a un tercero', async () => {
    const res = await post(formWithBytes(new Uint8Array([1, 2, 3, 4])));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      text: 'Hola Marco, esto es una prueba.',
      model: 'lfm3-audio',
    });

    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toBe('http://mini.local:11434/api/chat');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('lfm3-audio');
    expect(body.stream).toBe(false);
    // Ollama recibe el clip en images[] (detecta RIFF/WAVE y lo enruta al encoder de audio)
    expect(Buffer.from(body.messages[0].images[0], 'base64')).toEqual(Buffer.from([1, 2, 3, 4]));
    expect(String(body.messages[0].content)).toMatch(/transcribe/i);
  });

  it('envía la API key cuando el servidor la exige', async () => {
    vi.stubEnv('TRANSCRIBE_API_KEY', 'clave-interna');
    await post(formWithBytes(new Uint8Array([7])));
    const [, init] = (fetch as any).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer clave-interna');
  });

  it('traduce un modelo inexistente a MODEL_NOT_FOUND', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ error: 'model not found' }), { status: 404 })));
    const res = await post(formWithBytes(new Uint8Array([1])));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('MODEL_NOT_FOUND');
  });

  it('no devuelve texto vacío como éxito', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse('   ')));
    const res = await post(formWithBytes(new Uint8Array([1])));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('EMPTY_TRANSCRIPTION');
  });

  it('timeout del servidor de inferencia es 504, no un cuelgue', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      const err = new Error('timeout');
      err.name = 'TimeoutError';
      throw err;
    }));
    const res = await post(formWithBytes(new Uint8Array([1])));
    expect(res.status).toBe(504);
    expect((await res.json()).error).toBe('TRANSCRIPTION_TIMEOUT');
  });

  it('red caída es 504 con código explícito', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('fetch failed');
    }));
    const res = await post(formWithBytes(new Uint8Array([1])));
    expect(res.status).toBe(504);
    expect((await res.json()).error).toBe('PROVIDER_UNREACHABLE');
  });

  it('el modelo se puede cambiar por entorno', async () => {
    vi.stubEnv('TRANSCRIBE_MODEL', 'otro-audio');
    await post(formWithBytes(new Uint8Array([1])));
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.model).toBe('otro-audio');
  });
});
