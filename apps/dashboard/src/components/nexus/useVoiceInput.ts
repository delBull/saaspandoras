'use client';

/**
 * 🎙️ Nota de voz → texto (chat interno de Nexus)
 *
 * Graba con `MediaRecorder`, manda el audio a `/api/nexus/chat/transcribe` y
 * devuelve el texto para que la persona lo revise antes de enviarlo (no se
 * envía solo: una transcripción puede equivocarse).
 *
 * Se transcribe en el servidor porque la clave del proveedor nunca debe llegar
 * al navegador.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceInputState = 'idle' | 'recording' | 'transcribing';

/** Tipos que los navegadores soportan para grabar; orden de preferencia. */
export const CANDIDATE_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const;

/** Primer contenedor soportado por el navegador (o `undefined` = default). */
export function pickRecorderMimeType(
  isSupported: (type: string) => boolean = () => false,
): string | undefined {
  return CANDIDATE_MIME_TYPES.find((type) => isSupported(type));
}

function messageForStatus(status: number, error?: string): string {
  if (status === 401) return 'Tu sesión expiró. Vuelve a entrar para usar el micrófono.';
  if (status === 503) return 'La transcripción no está configurada en el servidor.';
  if (status === 413) return 'La nota de voz es demasiado larga.';
  if (status === 429) return 'Demasiadas solicitudes. Espera unos segundos.';
  if (error === 'EMPTY_TRANSCRIPTION') return 'No se entendió el audio. Intenta de nuevo.';
  return 'No se pudo transcribir el audio.';
}

export interface UseVoiceInputOptions {
  /** Texto transcrito, listo para revisar. */
  onTranscript: (text: string) => void;
  /** Mensaje legible para mostrar (permiso, red, proveedor). */
  onError: (message: string) => void;
}

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions) {
  const [state, setState] = useState<VoiceInputState>('idle');
  const [supported, setSupported] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setSupported(
      typeof window !== 'undefined' &&
        typeof MediaRecorder !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia,
    );
    return () => {
      mountedRef.current = false;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
    };
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
  }, []);

  const transcribe = useCallback(
    async (blob: Blob) => {
      setState('transcribing');
      try {
        const form = new FormData();
        form.append('audio', blob, blob.type.includes('mp4') ? 'voice.mp4' : 'voice.webm');

        const res = await fetch('/api/nexus/chat/transcribe', { method: 'POST', body: form });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; text?: string; error?: string };

        if (!res.ok || !data.ok || !data.text) {
          onError(messageForStatus(res.status, data.error));
          return;
        }
        onTranscript(data.text);
      } catch {
        onError('No se pudo enviar el audio. Revisa tu conexión.');
      } finally {
        if (mountedRef.current) setState('idle');
      }
    },
    [onError, onTranscript],
  );

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickRecorderMimeType((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        releaseStream();
        recorderRef.current = null;

        if (blob.size === 0) {
          setState('idle');
          onError('No se grabó audio. Mantén presionado un momento más.');
          return;
        }
        void transcribe(blob);
      };

      recorder.onerror = () => {
        releaseStream();
        recorderRef.current = null;
        setState('idle');
        onError('La grabación falló en este navegador.');
      };

      recorder.start();
      setState('recording');
    } catch {
      releaseStream();
      setState('idle');
      onError('Necesitamos permiso del micrófono para transcribir.');
    }
  }, [onError, releaseStream, state, transcribe]);

  const toggle = useCallback(() => {
    if (state === 'recording') {
      stop();
      return;
    }
    if (state === 'idle') {
      void start();
    }
  }, [start, state, stop]);

  return { state, supported, toggle };
}
