import { afterEach, describe, expect, it } from 'vitest';
import { getTrustedClientIp } from '../security-utils';

const originalVercel = process.env.VERCEL;
const originalVercelEnv = process.env.VERCEL_ENV;

function h(headers: Record<string, string>): Headers {
  return new Headers(headers);
}

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
});

describe('getTrustedClientIp — sólo confía en headers que el proxy sella', () => {
  it('ignora x-real-ip falsificado cuando no corre en Vercel', () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    const ip = getTrustedClientIp(
      h({ 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '203.0.113.7', 'user-agent': 'ua' })
    );
    // El atacante controla x-real-ip; se usa el último salto de XFF (el proxy real).
    expect(ip).toBe('203.0.113.7');
  });

  it('usa x-real-ip cuando la plataforma es Vercel (header sellado)', () => {
    process.env.VERCEL = '1';
    const ip = getTrustedClientIp(h({ 'x-real-ip': '198.51.100.4' }));
    expect(ip).toBe('198.51.100.4');
  });

  it('acepta cf-connecting-ip sólo si viene con cf-ray', () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    expect(
      getTrustedClientIp(h({ 'cf-connecting-ip': '198.51.100.9', 'cf-ray': 'abc123' }))
    ).toBe('198.51.100.9');
    // Sin cf-ray el header es falsificable → se ignora.
    expect(
      getTrustedClientIp(h({ 'cf-connecting-ip': '198.51.100.9', 'user-agent': 'x' }))
    ).toMatch(/^untrusted_/);
  });

  it('toma el ÚLTIMO salto de x-forwarded-for, nunca el primero', () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    const ip = getTrustedClientIp(h({ 'x-forwarded-for': '1.1.1.1, 10.0.0.1, 203.0.113.50' }));
    expect(ip).toBe('203.0.113.50');
  });

  it('sin headers de proxy devuelve una huella particionada, no un bucket global', () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    const a = getTrustedClientIp(h({ 'user-agent': 'ua-a', 'accept-language': 'es' }));
    const b = getTrustedClientIp(h({ 'user-agent': 'ua-b', 'accept-language': 'es' }));
    expect(a).toMatch(/^untrusted_[a-f0-9]{16}$/);
    expect(a).not.toBe(b);
  });
});
