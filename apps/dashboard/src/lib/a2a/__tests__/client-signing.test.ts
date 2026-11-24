import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { A2ASecurityValidator } from '@saasfly/hermes-core';
import {
  computePayloadCanonicalHash,
  computeHmac,
  buildTransportSignature,
} from '../client-signing';

/**
 * El cliente del bot firma con su propia copia del contrato. Si el servidor
 * cambia el orden o los campos del hash canónico, esto falla y evitamos que un
 * agente deje de autenticar en silencio.
 */
describe('A2A · firma de cliente vs servidor', () => {
  process.env.A2A_HMAC_SECRET = process.env.A2A_HMAC_SECRET || 'test-secret-a2a';

  const message = {
    protocol: 'pandoras-a2a',
    version: '1.1',
    messageId: 'msg_1',
    correlationId: 'corr_1',
    from: 'community',
    to: 'hermes',
    tenantId: 'snarai',
    type: 'capability.request',
    createdAt: '2026-11-24T20:00:00.000Z',
    nonce: 'nonce_1',
    payload: { capability: 'community.report', canonicalOrgId: 'snarai', projectId: 17 },
  };

  it('el hash canónico coincide con el del servidor', () => {
    expect(computePayloadCanonicalHash(message)).toBe(
      A2ASecurityValidator.computePayloadCanonicalHash(message as any),
    );
  });

  it('el hash canónico incluye expiresAt cuando existe', () => {
    const withExpiry = { ...message, expiresAt: '2026-11-24T21:00:00.000Z' };
    expect(computePayloadCanonicalHash(withExpiry)).toBe(
      A2ASecurityValidator.computePayloadCanonicalHash(withExpiry as any),
    );
  });

  it('el HMAC coincide con el del servidor', () => {
    const hash = computePayloadCanonicalHash(message);
    expect(computeHmac(hash, 'secreto')).toBe(
      crypto.createHmac('sha256', 'secreto').update(hash).digest('hex'),
    );
    expect(A2ASecurityValidator.computeHmac(hash)).toBe(
      crypto.createHmac('sha256', process.env.A2A_HMAC_SECRET as string).update(hash).digest('hex'),
    );
  });

  it('la firma de transporte usa "<ts>.<body>"', () => {
    const ts = 1730000000;
    const body = JSON.stringify(message);
    const expected = 'sha256=' + crypto.createHmac('sha256', 's3cr3t').update(`${ts}.${body}`).digest('hex');
    expect(buildTransportSignature(ts, body, 's3cr3t')).toBe(expected);
  });
});
