import { describe, expect, it } from 'vitest';
import {
  isPinningSecretConfigured,
  openPinningSecret,
  sealPinningSecret,
} from '../pinning-secret';

const KEK = 'kek-de-prueba-suficientemente-largo-para-derivar';

describe('pinning-secret (AES-256-GCM)', () => {
  it('PS-01: sella y abre el token (round-trip con la misma clave)', () => {
    const sealed = sealPinningSecret('token-de-forge', { HERMES_KMS_KEK: KEK } as any);

    expect(sealed.startsWith('v1:')).toBe(true);
    expect(sealed).not.toContain('token-de-forge');
    expect(openPinningSecret(sealed, { HERMES_KMS_KEK: KEK } as any)).toBe('token-de-forge');
  });

  it('PS-02: con otra clave NO se puede abrir', () => {
    const sealed = sealPinningSecret('token-de-forge', { HERMES_KMS_KEK: KEK } as any);

    expect(() =>
      openPinningSecret(sealed, { HERMES_KMS_KEK: 'otra-clave-distinta-y-larga' } as any)
    ).toThrow();
  });

  it('PS-03: sin clave configurada falla cerrado al sellar', () => {
    expect(() => sealPinningSecret('x', {} as any)).toThrow(/HERMES_KMS_KEK/);
    expect(isPinningSecretConfigured({} as any)).toBe(false);
  });

  it('PS-04: formato corrupto se rechaza', () => {
    expect(() => openPinningSecret('basura', { HERMES_KMS_KEK: KEK } as any)).toThrow(/format/);
  });

  it('PS-05: acepta ENCRYPTION_KEY como fallback cuando no hay KEK', () => {
    const sealed = sealPinningSecret('token-fallback', { ENCRYPTION_KEY: KEK } as any);
    expect(openPinningSecret(sealed, { ENCRYPTION_KEY: KEK } as any)).toBe('token-fallback');
    expect(isPinningSecretConfigured({ ENCRYPTION_KEY: KEK } as any)).toBe(true);
  });

  it('PS-06: cada sellado usa IV distinto (no determinista)', () => {
    const a = sealPinningSecret('mismo-token', { HERMES_KMS_KEK: KEK } as any);
    const b = sealPinningSecret('mismo-token', { HERMES_KMS_KEK: KEK } as any);
    expect(a).not.toBe(b);
  });
});
