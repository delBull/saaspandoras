import { describe, it, expect } from 'vitest';
import { encryptTenantKey, decryptTenantKey } from '../tenant-signer';

process.env.HERMES_KMS_KEK = process.env.HERMES_KMS_KEK || 'test-kek-para-tenant-signer-32-bytes!!';

const KEY = '0xfc97c6ba902d611156f910d183d76f2810cc2cf0cac9bfb02754e2f2f2b33424';

describe('Identidad por tenant · cifrado de la llave privada', () => {
  it('cifra y descifra la llave sin pérdida', () => {
    const encrypted = encryptTenantKey(KEY);
    expect(encrypted.startsWith('v1:')).toBe(true);
    expect(encrypted).not.toContain(KEY);
    expect(decryptTenantKey(encrypted)).toBe(KEY);
  });

  it('cada cifrado es distinto (IV aleatorio)', () => {
    const a = encryptTenantKey(KEY);
    const b = encryptTenantKey(KEY);
    expect(a).not.toBe(b);
    expect(decryptTenantKey(a)).toBe(KEY);
    expect(decryptTenantKey(b)).toBe(KEY);
  });

  it('rechaza un payload manipulado (GCM detecta la alteración)', () => {
    const encrypted = encryptTenantKey(KEY);
    const parts = encrypted.split(':');
    const data = Buffer.from(parts[3]!, 'base64');
    data[0] = data[0]! ^ 0xff;
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${data.toString('base64')}`;
    expect(() => decryptTenantKey(tampered)).toThrow();
  });

  it('rechaza formatos desconocidos', () => {
    expect(() => decryptTenantKey('')).toThrow(/Formato/);
    expect(() => decryptTenantKey('v2:a:b:c')).toThrow(/Formato/);
    expect(() => decryptTenantKey('cualquier-cosa')).toThrow(/Formato/);
  });

  it('nunca devuelve un formato que contenga la llave en claro', () => {
    const encrypted = encryptTenantKey(KEY);
    expect(encrypted).not.toMatch(/fc97c6ba/);
  });
});
