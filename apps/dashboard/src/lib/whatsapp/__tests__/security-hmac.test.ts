// @ts-ignore
import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyMetaSignature } from '../security';

/**
 * El webhook de Meta debe rechazar cualquier payload sin firma válida.
 * Esta prueba existe para que nadie pueda "arreglar" el canal desactivando el HMAC.
 */
describe('WhatsApp webhook · HMAC (Meta X-Hub-Signature-256)', () => {
  const secret = 'test_app_secret_123';
  const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
  const sign = (payload: string, key = secret) =>
    'sha256=' + crypto.createHmac('sha256', key).update(payload, 'utf8').digest('hex');

  it('acepta una firma correcta', () => {
    expect(verifyMetaSignature(body, sign(body), secret)).toBe(true);
  });

  it('rechaza cuando falta la cabecera', () => {
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
  });

  it('rechaza un prefijo distinto de sha256=', () => {
    expect(verifyMetaSignature(body, 'sha1=abc', secret)).toBe(false);
  });

  it('rechaza si el cuerpo fue alterado', () => {
    const signature = sign(body);
    expect(verifyMetaSignature(body + ' ', signature, secret)).toBe(false);
  });

  it('rechaza una firma hecha con otro secreto', () => {
    expect(verifyMetaSignature(body, sign(body, 'otro_secreto'), secret)).toBe(false);
  });

  it('rechaza una firma de longitud distinta sin lanzar', () => {
    expect(() => verifyMetaSignature(body, 'sha256=deadbeef', secret)).not.toThrow();
    expect(verifyMetaSignature(body, 'sha256=deadbeef', secret)).toBe(false);
  });
});
