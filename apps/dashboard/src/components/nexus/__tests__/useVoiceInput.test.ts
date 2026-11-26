import { describe, it, expect } from 'vitest';
import { pickRecorderMimeType, CANDIDATE_MIME_TYPES } from '../useVoiceInput';

describe('pickRecorderMimeType', () => {
  it('prefiere opus en webm (Chrome/Edge/Firefox)', () => {
    expect(pickRecorderMimeType((t) => t.startsWith('audio/webm'))).toBe('audio/webm;codecs=opus');
  });

  it('cae a mp4 en Safari', () => {
    expect(pickRecorderMimeType((t) => t === 'audio/mp4')).toBe('audio/mp4');
  });

  it('devuelve undefined si el navegador no declara ninguno (usa el default)', () => {
    expect(pickRecorderMimeType(() => false)).toBeUndefined();
  });

  it('el orden de preferencia está declarado de forma estable', () => {
    expect(CANDIDATE_MIME_TYPES[0]).toBe('audio/webm;codecs=opus');
    expect(CANDIDATE_MIME_TYPES).toContain('audio/mp4');
  });
});
