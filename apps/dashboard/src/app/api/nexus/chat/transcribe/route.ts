import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Límite de la API de transcripción de OpenAI. */
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const DEFAULT_MODEL = 'whisper-1';
const DEFAULT_LANGUAGE = 'es';

/**
 * 🎙️ POST /api/nexus/chat/transcribe
 *
 * Transcribe una nota de voz del chat interno de Nexus (Whisper).
 *
 * Invariantes:
 *  - Requiere sesión Nexus válida: la transcripción no es un endpoint público.
 *  - Sin `OPENAI_API_KEY` responde 503 con código explícito: nunca devuelve un
 *    texto vacío como si hubiera funcionado.
 *  - El audio no se persiste: se manda al proveedor y se descarta.
 *  - Límite de tamaño fail-closed (25 MB).
 */
export async function POST(req: Request) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated || !auth.email) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'TRANSCRIPTION_NOT_CONFIGURED', message: 'Falta OPENAI_API_KEY.' },
      { status: 503 },
    );
  }

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

  const model = (process.env.OPENAI_TRANSCRIBE_MODEL || DEFAULT_MODEL).trim();
  const language = (process.env.OPENAI_TRANSCRIBE_LANGUAGE || DEFAULT_LANGUAGE).trim();

  try {
    const { default: OpenAI, toFile } = await import('openai');
    const client = new OpenAI({ apiKey, timeout: 30_000 });

    const buffer = Buffer.from(await audio.arrayBuffer());
    const name = audio.type?.includes('mp4') ? 'voice.mp4' : 'voice.webm';
    const upload = await toFile(buffer, name, { type: audio.type || 'audio/webm' });

    const result = await client.audio.transcriptions.create({
      file: upload,
      model,
      language,
    });

    const text = String((result as { text?: string })?.text || '').trim();
    if (!text) {
      return NextResponse.json({ ok: false, error: 'EMPTY_TRANSCRIPTION' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, text, model });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    // Sólo metadatos: nunca el audio ni el texto transcrito.
    console.warn(
      `[nexus/chat/transcribe] fallo del proveedor (status=${e?.status ?? 'n/a'}, bytes=${audio.size}): ${e?.message?.slice(0, 160) ?? 'sin detalle'}`,
    );

    const status = e?.status === 429 ? 429 : 502;
    return NextResponse.json(
      { ok: false, error: status === 429 ? 'PROVIDER_RATE_LIMIT' : 'TRANSCRIPTION_FAILED' },
      { status },
    );
  }
}
