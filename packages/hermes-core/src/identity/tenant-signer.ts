/**
 * 🏛️ Identidad criptográfica por tenant (gap 1)
 *
 * Antes, todas las filas de `hermes_knowledge_registry` firmaban con una sola
 * `HERMES_IDENTITY_PRIVATE_KEY`: el sello probaba quién operó, no de quién era el
 * conocimiento. Aquí cada tenant tiene su par de llaves y la privada se guarda
 * cifrada con la KEK (la misma que protege el vault).
 *
 * Reglas:
 *  - La llave privada NUNCA se devuelve ni se registra en logs.
 *  - `ensureTenantSigner` es idempotente: si ya existe, no crea otra.
 *  - `getSignerForTenant` cae al firmante de plataforma si el tenant aún no tiene
 *    llave, y lo marca (`isPlatformFallback`) para poder auditarlo.
 */
import crypto from 'crypto';
import { db } from '@saasfly/db-core';
import { tenantSigningKeys } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { HermesIdentitySigner } from './identity-signer';

export interface TenantSignerInfo {
  tenantId: string;
  address: string;
  keyVersion: number;
  isPlatformFallback: boolean;
  signer: HermesIdentitySigner;
}

function kek(): Buffer {
  const secret =
    process.env.HERMES_KMS_KEK ||
    process.env.ENCRYPTION_KEY ||
    (process.env.NODE_ENV === 'production' ? '' : 'pandoras_hermes_dev_ephemeral_kek_salt_32bytes!');
  if (!secret) {
    throw new Error('[TenantSigner] Falta HERMES_KMS_KEK: sin KEK no se pueden guardar llaves (fail-closed).');
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

/** Cifra una llave privada en formato `v1:iv:tag:cipher` (AES-256-GCM). */
export function encryptTenantKey(privateKeyHex: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek(), iv);
  const enc = Buffer.concat([cipher.update(privateKeyHex, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${enc.toString('base64')}`;
}

export function decryptTenantKey(payload: string): string {
  const parts = String(payload || '').split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('[TenantSigner] Formato de llave cifrada no reconocido.');
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', kek(), Buffer.from(ivB64!, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64!, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64!, 'base64')), decipher.final()]).toString('utf8');
}

function newId(): string {
  return crypto.randomUUID();
}

/** Crea la llave del tenant si no existe. Idempotente. */
export async function ensureTenantSigner(
  tenantId: string,
  actor: string,
): Promise<{ address: string; created: boolean; keyVersion: number }> {
  const slug = String(tenantId || '').toLowerCase().trim();
  if (!slug) throw new Error('[TenantSigner] tenantId requerido.');

  const [existing] = await db
    .select({ address: tenantSigningKeys.address, keyVersion: tenantSigningKeys.keyVersion, status: tenantSigningKeys.status })
    .from(tenantSigningKeys)
    .where(eq(tenantSigningKeys.tenantId, slug))
    .limit(1);

  if (existing && existing.status === 'ACTIVE') {
    return { address: existing.address, created: false, keyVersion: existing.keyVersion };
  }

  const privateKey = generatePrivateKey();
  const address = privateKeyToAccount(privateKey).address;

  if (existing) {
    await db
      .update(tenantSigningKeys)
      .set({
        address,
        encryptedPrivateKey: encryptTenantKey(privateKey),
        keyVersion: (existing.keyVersion ?? 1) + 1,
        status: 'ACTIVE',
        rotatedAt: new Date(),
      })
      .where(eq(tenantSigningKeys.tenantId, slug));
    return { address, created: true, keyVersion: (existing.keyVersion ?? 1) + 1 };
  }

  await db.insert(tenantSigningKeys).values({
    id: newId(),
    tenantId: slug,
    address,
    encryptedPrivateKey: encryptTenantKey(privateKey),
    keyVersion: 1,
    status: 'ACTIVE',
    createdBy: actor,
  });

  return { address, created: true, keyVersion: 1 };
}

/** Firma con la llave del tenant; null si no tiene. */
export async function getTenantSigner(tenantId: string): Promise<TenantSignerInfo | null> {
  const slug = String(tenantId || '').toLowerCase().trim();
  if (!slug) return null;

  const [row] = await db
    .select({
      address: tenantSigningKeys.address,
      encryptedPrivateKey: tenantSigningKeys.encryptedPrivateKey,
      keyVersion: tenantSigningKeys.keyVersion,
      status: tenantSigningKeys.status,
    })
    .from(tenantSigningKeys)
    .where(eq(tenantSigningKeys.tenantId, slug))
    .limit(1);

  if (!row || row.status !== 'ACTIVE') return null;

  const signer = new HermesIdentitySigner(decryptTenantKey(row.encryptedPrivateKey));
  return { tenantId: slug, address: row.address, keyVersion: row.keyVersion, isPlatformFallback: false, signer };
}

/**
 * Firmante efectivo para un tenant. Si aún no tiene llave propia, usa el de
 * plataforma y lo marca: así nada se rompe, pero el sello se puede identificar.
 */
export async function getSignerForTenant(tenantId: string): Promise<TenantSignerInfo> {
  const tenant = await getTenantSigner(tenantId);
  if (tenant) return tenant;

  const platform = new HermesIdentitySigner();
  console.warn(
    `[TenantSigner] tenant '${tenantId}' sin llave propia: se firma con la identidad de plataforma (${platform.getPublicAddress()}). ` +
    `Ejecuta provision-tenant-signers para corregirlo.`,
  );
  return {
    tenantId: String(tenantId).toLowerCase(),
    address: platform.getPublicAddress(),
    keyVersion: 0,
    isPlatformFallback: true,
    signer: platform,
  };
}

/** Rota la llave (crea una nueva y sube la versión). */
export async function rotateTenantSigner(tenantId: string, actor: string): Promise<{ address: string; keyVersion: number }> {
  await db.delete(tenantSigningKeys).where(eq(tenantSigningKeys.tenantId, String(tenantId).toLowerCase()));
  const created = await ensureTenantSigner(tenantId, actor);
  return { address: created.address, keyVersion: created.keyVersion };
}
