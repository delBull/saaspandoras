/**
 * 🎧 Conversión de audio a lo que Ollama entiende
 *
 * Ollama no tiene API de audio: reconoce un clip por la cabecera **RIFF/WAVE**
 * dentro de `images[]` y lo manda al encoder de audio del modelo. El navegador
 * graba `webm/opus` (Safari `mp4`), así que hay que decodificar y reencodear a
 * **WAV 16 kHz mono PCM 16-bit** antes de subirlo.
 *
 * Se hace en el cliente a propósito: en Vercel no hay `ffmpeg` ni margen de CPU
 * para remuestrear audio por petición.
 */

export const TARGET_SAMPLE_RATE = 16_000;

/** Cabecera + muestras de un WAV PCM 16-bit mono. */
export function encodeWavPcm16(samples: Float32Array, sampleRate = TARGET_SAMPLE_RATE): Uint8Array {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // tamaño del bloque fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits por muestra
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Uint8Array(buffer);
}

/**
 * Decodifica lo que grabó el navegador y lo devuelve como WAV 16 kHz mono.
 * Lanza si el navegador no puede decodificar el contenedor.
 */
export async function blobToWav16k(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();

  const AudioCtx: typeof AudioContext | undefined =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;

  if (!AudioCtx) throw new Error('AUDIO_DECODE_UNSUPPORTED');

  const decoder = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await decoder.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    void decoder.close();
  }

  const frames = Math.max(1, Math.ceil(decoded.duration * TARGET_SAMPLE_RATE));
  const offline = new OfflineAudioContext(1, frames, TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();

  const rendered = await offline.startRendering();
  const samples = rendered.getChannelData(0);
  return new Blob([encodeWavPcm16(samples, TARGET_SAMPLE_RATE)], { type: 'audio/wav' });
}
