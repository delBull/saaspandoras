/**
 * Tokens de entrega de contenido (P0.3).
 *
 * El token es una CREDENCIAL INDEPENDIENTE y de alcance limitado. NO es una API
 * key reutilizada como URL, y NO hereda los permisos de quien lo emite.
 *
 * Formato: `pdt.<jti>.<expEpochSeconds>.<hmacBase64url>`
 *  - `jti` identifica el registro persistido (revocación y auditoría).
 *  - El payload no revela el artefacto: la resolución es por `jti` en servidor.
 *  - HMAC-SHA256 con secreto dedicado (`CONTENT_DELIVERY_TOKEN_SECRET`).
 *
 * INVARIANTES:
 *  1. La firma sola NO autoriza: el proxy SIEMPRE revalida estado de negocio
 *     (publicado + versión vigente) y revocación. Así la revocación surte efecto
 *     aunque el token no haya expirado.
 *  2. Fail-closed: secreto ausente/débil, formato inválido, firma inválida,
 *     expirado, revocado o versión no vigente ⇒ NO se sirve.
 *  3. El token no permite publicar, aprobar, listar ni escribir.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const DELIVERY_TOKEN_PREFIX = 'pdt';
export const DEFAULT_DELIVERY_TTL_SECONDS = 60 * 60; // 1 hora
export const MAX_DELIVERY_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 días

export type IssuerKind = 'api_key' | 'human';

export interface DeliveryTokenRecord {
  /** `jti` — identificador opaco del token. */
  id: string;
  artifactId: string;
  version: number;
  tenantId: string;
  issuedByKind: IssuerKind;
  issuedById: string;
  /** Epoch en segundos. */
  expiresAt: number;
  /** Epoch en segundos, o `null` si está vigente. */
  revokedAt: number | null;
  /** Último uso registrado (auditoría). */
  lastUsedAt?: number | null;
}

export interface DeliveryTokenStore {
  create(record: DeliveryTokenRecord): Promise<void>;
  findById(jti: string): Promise<DeliveryTokenRecord | null>;
  revoke(jti: string, revokedAt: number): Promise<boolean>;
  touch(jti: string, usedAt: number): Promise<void>;
}

export class DeliveryTokenError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'SECRET_NOT_CONFIGURED'
      | 'INVALID_FORMAT'
      | 'INVALID_SIGNATURE'
      | 'EXPIRED'
      | 'REVOKED'
      | 'NOT_FOUND'
      | 'TTL_INVALID',
  ) {
    super(message);
    this.name = 'DeliveryTokenError';
  }
}

function readSecret(secret?: string): Buffer {
  const value = secret ?? process.env.CONTENT_DELIVERY_TOKEN_SECRET;
  if (!value || value.trim().length < 32) {
    throw new DeliveryTokenError(
      'CONTENT_DELIVERY_TOKEN_SECRET no está configurado (mínimo 32 caracteres).',
      'SECRET_NOT_CONFIGURED',
    );
  }
  return Buffer.from(value, 'utf8');
}

function sign(secret: Buffer, jti: string, exp: number): Buffer {
  return createHmac('sha256', secret).update(`${DELIVERY_TOKEN_PREFIX}|${jti}|${exp}`).digest();
}

function canonicalizeTtl(ttlSeconds?: number): number {
  if (ttlSeconds === undefined) return DEFAULT_DELIVERY_TTL_SECONDS;
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new DeliveryTokenError('TTL inválido: debe ser un entero positivo.', 'TTL_INVALID');
  }
  if (ttlSeconds > MAX_DELIVERY_TTL_SECONDS) {
    throw new DeliveryTokenError(
      `TTL inválido: máximo ${MAX_DELIVERY_TTL_SECONDS} segundos.`,
      'TTL_INVALID',
    );
  }
  return ttlSeconds;
}

/**
 * Emite un token. El llamador debe haber verificado antes:
 *  - capability `content.token.issue`
 *  - artefacto del tenant y versión vigente en estado `published`
 */
export async function issueDeliveryToken(params: {
  store: DeliveryTokenStore;
  artifactId: string;
  version: number;
  tenantId: string;
  issuedByKind: IssuerKind;
  issuedById: string;
  ttlSeconds?: number;
  nowSeconds?: number;
  secret?: string;
}): Promise<{ token: string; record: DeliveryTokenRecord }> {
  const secret = readSecret(params.secret);
  const ttl = canonicalizeTtl(params.ttlSeconds);
  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  const jti = randomBytes(16).toString('base64url');
  const expiresAt = now + ttl;

  const record: DeliveryTokenRecord = {
    id: jti,
    artifactId: params.artifactId,
    version: params.version,
    tenantId: params.tenantId,
    issuedByKind: params.issuedByKind,
    issuedById: params.issuedById,
    expiresAt,
    revokedAt: null,
  };

  await params.store.create(record);

  const signature = sign(secret, jti, expiresAt).toString('base64url');
  return {
    token: `${DELIVERY_TOKEN_PREFIX}.${jti}.${expiresAt}.${signature}`,
    record,
  };
}

/** Verificación criptográfica (sin consultar estado de negocio). */
export function verifyDeliveryTokenSignature(
  token: string,
  options?: { nowSeconds?: number; secret?: string },
): { jti: string; expiresAt: number } {
  const secret = readSecret(options?.secret);
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== DELIVERY_TOKEN_PREFIX) {
    throw new DeliveryTokenError('Formato de token inválido.', 'INVALID_FORMAT');
  }

  const [, jti, expRaw, signatureRaw] = parts;
  const exp = Number(expRaw);
  if (!jti || !Number.isInteger(exp) || exp <= 0 || !signatureRaw) {
    throw new DeliveryTokenError('Formato de token inválido.', 'INVALID_FORMAT');
  }

  const expected = sign(secret, jti, exp);
  let received: Buffer;
  try {
    received = Buffer.from(signatureRaw, 'base64url');
  } catch {
    throw new DeliveryTokenError('Firma inválida.', 'INVALID_SIGNATURE');
  }

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new DeliveryTokenError('Firma inválida.', 'INVALID_SIGNATURE');
  }

  const now = options?.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (exp <= now) {
    throw new DeliveryTokenError('Token expirado.', 'EXPIRED');
  }

  return { jti, expiresAt: exp };
}

export interface DeliveryAuthorizationContext {
  /** Estado de negocio actual del artefacto y versión solicitada. */
  artifactPublished: boolean;
  currentVersion: number | null;
}

/**
 * Autorización completa de una entrega.
 *
 * Orden deliberado: firma → registro → revocación → tenant → estado de negocio.
 * Cualquier fallo es fail-closed.
 */
export async function authorizeDelivery(params: {
  token: string;
  store: DeliveryTokenStore;
  tenantId: string;
  artifactId: string;
  version: number;
  context: DeliveryAuthorizationContext;
  nowSeconds?: number;
  secret?: string;
}): Promise<DeliveryTokenRecord> {
  const { jti } = verifyDeliveryTokenSignature(params.token, {
    nowSeconds: params.nowSeconds,
    secret: params.secret,
  });

  const record = await params.store.findById(jti);
  if (!record) {
    throw new DeliveryTokenError('Token no registrado.', 'NOT_FOUND');
  }

  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (record.revokedAt !== null) {
    throw new DeliveryTokenError('Token revocado.', 'REVOKED');
  }
  if (record.expiresAt <= now) {
    throw new DeliveryTokenError('Token expirado.', 'EXPIRED');
  }

  // Aislamiento: el token pertenece a UN tenant, UN artefacto y UNA versión.
  if (
    record.tenantId !== params.tenantId ||
    record.artifactId !== params.artifactId ||
    record.version !== params.version
  ) {
    throw new DeliveryTokenError('El token no corresponde a este recurso.', 'NOT_FOUND');
  }

  // Estado de negocio vigente: revocación efectiva aunque el token siga firmado.
  if (!params.context.artifactPublished) {
    throw new DeliveryTokenError('El artefacto no está publicado.', 'NOT_FOUND');
  }
  if (params.context.currentVersion === null || params.context.currentVersion !== params.version) {
    throw new DeliveryTokenError('La versión solicitada no es la vigente.', 'NOT_FOUND');
  }

  return record;
}
