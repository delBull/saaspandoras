import crypto from 'crypto';

/**
 * Cifrado del token de pinning que aporta cada tenant (BYO).
 *
 * Reutiliza la convención de secretos ya existente en Hermes:
 *   HERMES_KMS_KEK  (preferida)  ·  ENCRYPTION_KEY  (fallback)
 *
 * La clave se deriva con SHA-256 para aceptar cualquier formato de entrada.
 * Nunca se loguea ni se devuelve el token en claro.
 */
const PREFIX = 'v1';

function deriveKey(env: NodeJS.ProcessEnv = process.env): Buffer {
  const raw = env.HERMES_KMS_KEK ?? env.ENCRYPTION_KEY;
  if (!raw || raw.trim().length < 16) {
    throw new Error(
      '[PinningSecret] Define HERMES_KMS_KEK (o ENCRYPTION_KEY) para guardar credenciales de pinning de tenants.'
    );
  }
  return crypto.createHash('sha256').update(raw).digest();
}

export function sealPinningSecret(plaintext: string, env: NodeJS.ProcessEnv = process.env): string {
  const key = deriveKey(env);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString('hex'), tag.toString('hex'), ciphertext.toString('hex')].join(':');
}

export function openPinningSecret(sealed: string, env: NodeJS.ProcessEnv = process.env): string {
  const parts = sealed.split(':');
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new Error('[PinningSecret] Invalid sealed secret format.');
  }
  const key = deriveKey(env);
  const iv = Buffer.from(parts[1] ?? '', 'hex');
  const tag = Buffer.from(parts[2] ?? '', 'hex');
  const ciphertext = Buffer.from(parts[3] ?? '', 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
}

export function isPinningSecretConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean((env.HERMES_KMS_KEK ?? env.ENCRYPTION_KEY)?.trim());
}
