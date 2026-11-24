import crypto from 'node:crypto';

/**
 * Firma de cliente A2A (lado agente).
 *
 * Replica el hash canónico y el HMAC del servidor (`A2ASecurityValidator`) para
 * que un cliente externo —el bot de comunidad— pueda firmar sin importar el
 * paquete completo de Hermes (que arrastra `server-only` y no se puede empaquetar).
 *
 * El test `client-signing.test.ts` compara ambas implementaciones: si el contrato
 * del servidor cambia, el test falla antes de que un agente deje de autenticar.
 */
export function computePayloadCanonicalHash(message: Record<string, any>): string {
  const canonical = JSON.stringify({
    protocol: message.protocol,
    version: message.version,
    messageId: message.messageId,
    correlationId: message.correlationId,
    from: message.from,
    to: message.to,
    tenantId: message.tenantId,
    type: message.type,
    createdAt: message.createdAt,
    expiresAt: message.expiresAt,
    nonce: message.nonce,
    payload: message.payload,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

export function computeHmac(canonicalHash: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(canonicalHash).digest('hex');
}

/** Cabecera de transporte: `sha256=HMAC(secret, "<ts>.<body>")`. */
export function buildTransportSignature(timestampSeconds: number, rawBody: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(`${timestampSeconds}.${rawBody}`).digest('hex');
}
