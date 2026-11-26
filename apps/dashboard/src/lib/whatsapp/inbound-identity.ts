/**
 * 🪪 Identidad de entrada por canal (WhatsApp)
 *
 * Hermes (plataforma) y cada tenant son **apps de Meta distintas**: número,
 * token y app secret propios. Este módulo resuelve, para un webhook entrante:
 *
 *   1. el `phone_number_id` que recibió el mensaje,
 *   2. el tenant dueño de ese número,
 *   3. el app secret con el que se debe validar la firma.
 *
 * Regla dura: si el número pertenece a un tenant, **sólo** vale el secreto de ese
 * tenant. El secreto global (plataforma) no se usa como respaldo: aceptar una
 * firma de otra app es exactamente la confusión que queremos evitar.
 */
import { resolveTenantByPhoneNumberId, tenantAppSecretEnvName } from '@saasfly/hermes-core';

export interface InboundWhatsAppIdentity {
  phoneNumberId: string;
  /** `null` cuando el número no está registrado (fail-closed aguas abajo). */
  tenantSlug: string | null;
  /** Nombre de la variable del secreto usado (nunca el valor). */
  secretSource: string;
  appSecret: string;
  isPlatform: boolean;
}

export function extractPhoneNumberId(body: any): string {
  return String(body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id || '').trim();
}

export class MissingTenantSecretError extends Error {
  constructor(public readonly tenantSlug: string, public readonly envName: string) {
    super(`Falta ${envName} para el número del tenant ${tenantSlug}`);
    this.name = 'MissingTenantSecretError';
  }
}

export async function resolveInboundIdentity(body: any): Promise<InboundWhatsAppIdentity> {
  const phoneNumberId = extractPhoneNumberId(body);
  const tenantSlug = phoneNumberId ? await resolveTenantByPhoneNumberId(phoneNumberId) : null;
  const isPlatform = !tenantSlug || tenantSlug === 'pandoras';

  const tenantEnvName = tenantAppSecretEnvName(tenantSlug);
  const globalSecret = (process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET || '').trim();

  if (!isPlatform && tenantEnvName) {
    const tenantSecret = (process.env[tenantEnvName] || '').trim();
    if (!tenantSecret) throw new MissingTenantSecretError(tenantSlug as string, tenantEnvName);
    return { phoneNumberId, tenantSlug, secretSource: tenantEnvName, appSecret: tenantSecret, isPlatform };
  }

  return {
    phoneNumberId,
    tenantSlug,
    secretSource: process.env.META_APP_SECRET ? 'META_APP_SECRET' : 'WHATSAPP_APP_SECRET',
    appSecret: globalSecret,
    isPlatform,
  };
}
