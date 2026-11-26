import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Límite de audio aceptado (una nota de voz no debería acercarse). */
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const DEFAULT_MODEL = 'lfm3-audio';
const DEFAULT_TIMEOUT_MS = 45_000;

const TRANSCRIBE_PROMPT =
  'Transcribe el audio exactamente como se dice, en español. Devuelve únicamente la ' +
  'transcripción, sin comillas, sin etiquetas y sin comentarios.';

/**
 * 🎙️ POST /api/nexus/chat/transcribe
 *
 * Transcribe una nota de voz del chat interno de Nexus.
 *
 * Motor: **Ollama** con un modelo de audio (`lfm3-audio` por defecto). Sin
 * proveedores externos: si el servidor de Ollama no responde, la ruta falla con
 * un código explícito en vez de inventar texto.
 *
 * Invariantes:
 *  - Requiere sesión Nexus (no es un endpoint público).
 *  - El audio no se persiste: viaja al servidor de inferencia y se descarta.
 *  - Límite de tamaño fail-closed.
 *  - Timeout propio: un Ollama colgado no deja la petición abierta.
 */
export async function POST(req: Request) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated || !auth.email) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const baseUrl = (
    process.env.TRANSCRIBE_BASE_URL ||
    process.env.OLLAMA_BASE_URL ||
    'http://127.0.0.1:11434'
  ).replace(/\/$/, '');
  const model = (process.env.TRANSCRIBE_MODEL || process.env.OLLAMA_TRANSCRIBE_MODEL || DEFAULT_MODEL).trim();
  const apiKey = (process.env.TRANSCRIBE_API_KEY || process.env.OLLAMA_API_KEY || '').trim();

  let form: FormData | null = null;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_FORM_DATA' }, { status: 400 });
  }

  const audio = form?.get('audio');
  if (!(audio instanceof File)) {
    return NextResponse.json({ ok: false, error: 'MISSING_AUDIO' }, { status: 400 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ ok: false, error: 'EMPTY_AUDIO' }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'AUDIO_TOO_LARGE', maxBytes: MAX_AUDIO_BYTES },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await audio.arrayBuffer());
  const timeoutMs = Number(process.env.TRANSCRIBE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        stream: false,
        options: { temperature: 0 },
        messages: [
          {
            role: 'user',
            content: TRANSCRIBE_PROMPT,
            // Ollama no tiene API de audio: si el base64 empieza con la cabecera
            // RIFF/WAVE dentro de `images`, lo enruta al encoder de audio del
            // modelo. Debe ser WAV 16 kHz mono (lo convierte el navegador).
            images: [bytes.toString('base64')],
          },
        ],
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      message?: { content?: string };
      error?: string;
    };

    if (!res.ok) {
      const detail = String(payload?.error || '').slice(0, 160);
      console.warn(`[nexus/chat/transcribe] Ollama ${res.status} (${model}): ${detail || 'sin detalle'}`);
      return NextResponse.json(
        { ok: false, error: res.status === 404 ? 'MODEL_NOT_FOUND' : 'TRANSCRIPTION_FAILED', model },
        { status: 502 },
      );
    }

    const text = cleanTranscript(payload?.message?.content);
    if (!text) {
      return NextResponse.json({ ok: false, error: 'EMPTY_TRANSCRIPTION', model }, { status: 502 });
    }

    return NextResponse.json({ ok: true, text, model });
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name;
    const isTimeout = name === 'TimeoutError' || name === 'AbortError';
    // Sólo metadatos: nunca el audio ni el texto.
    console.warn(
      `[nexus/chat/transcribe] sin respuesta de ${baseUrl} (${isTimeout ? 'timeout' : 'error de red'}, ${audio.size} bytes)`,
    );
    return NextResponse.json(
      { ok: false, error: isTimeout ? 'TRANSCRIPTION_TIMEOUT' : 'PROVIDER_UNREACHABLE', model },
      { status: 504 },
    );
  }
}

/** Quita comillas, prefijos y saltos sobrantes que agrega el modelo. */
export function cleanTranscript(raw: unknown): string {
  let text = String(raw ?? '').trim();
  if (!text) return '';

  text = text.replace(/^(transcripci[oó]n|transcript)\s*:\s*/i, '').trim();
  text = text.replace(/^["“'«]+|["”'»]+$/g, '').trim();
  return text.replace(/\s+/g, ' ');
}
