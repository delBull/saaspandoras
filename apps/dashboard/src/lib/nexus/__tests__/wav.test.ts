import { describe, it, expect } from 'vitest';
import { encodeWavPcm16, TARGET_SAMPLE_RATE } from '../wav';

function readHeader(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const str = (offset: number, len: number) =>
    Array.from(bytes.slice(offset, offset + len))
      .map((b) => String.fromCharCode(b))
      .join('');
  return {
    riff: str(0, 4),
    wave: str(8, 4),
    fmt: str(12, 4),
    data: str(36, 4),
    audioFormat: view.getUint16(20, true),
    channels: view.getUint16(22, true),
    sampleRate: view.getUint32(24, true),
    bitsPerSample: view.getUint16(34, true),
    dataSize: view.getUint32(40, true),
    riffSize: view.getUint32(4, true),
  };
}

describe('encodeWavPcm16', () => {
  it('genera un WAV mono 16 kHz PCM 16-bit válido', () => {
    const wav = encodeWavPcm16(new Float32Array([0, 0.5, -0.5, 1, -1]));
    const h = readHeader(wav);

    expect(h.riff).toBe('RIFF');
    expect(h.wave).toBe('WAVE');
    expect(h.fmt).toBe('fmt ');
    expect(h.data).toBe('data');
    expect(h.audioFormat).toBe(1); // PCM
    expect(h.channels).toBe(1); // mono
    expect(h.sampleRate).toBe(TARGET_SAMPLE_RATE);
    expect(h.bitsPerSample).toBe(16);
  });

  it('declara los tamaños correctos (44 bytes de cabecera + 2 por muestra)', () => {
    const samples = new Float32Array(1600); // 0.1 s
    const wav = encodeWavPcm16(samples);
    const h = readHeader(wav);

    expect(wav.length).toBe(44 + 1600 * 2);
    expect(h.dataSize).toBe(1600 * 2);
    expect(h.riffSize).toBe(36 + 1600 * 2);
  });

  it('convierte amplitudes a PCM 16-bit y recorta fuera de rango', () => {
    const wav = encodeWavPcm16(new Float32Array([0, 0.5, -0.5, 2, -2]));
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);

    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBeGreaterThan(16000);
    expect(view.getInt16(46, true)).toBeLessThan(16400);
    expect(view.getInt16(48, true)).toBeLessThan(-16000);
    expect(view.getInt16(50, true)).toBe(32767); // saturado
    expect(view.getInt16(52, true)).toBe(-32768); // saturado
  });

  it('un audio vacío sigue siendo un WAV válido', () => {
    const wav = encodeWavPcm16(new Float32Array([]));
    expect(wav.length).toBe(44);
    expect(readHeader(wav).dataSize).toBe(0);
  });
});
