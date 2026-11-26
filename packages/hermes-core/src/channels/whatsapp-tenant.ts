/**
 * 🧭 Identidad del tenant por número de WhatsApp (ADR-020)
 *
 * La autoridad no es el remitente: es **el número que recibió el mensaje**. El
 * webhook de Meta entrega `phone_number_id`; ese número pertenece a un tenant y
 * por tanto su Hermes es quien debe responder.
 *
 * Un solo algoritmo, con el mismo orden que usa el dispatcher del portal:
 *   1. número maestro → plataforma (`pandoras`)
 *   2. `META_PHONE_NUMBER_ID_<SLUG>` (mayúsculas o el slug tal cual)
 *   3. `projects.tenantRuntimeConfig.secrets.whatsappPhoneId` (lo que se conecta por portal)
 *   4. `projects.w2eConfig.whatsappPhoneId` (legacy)
 *
 * Hermes (plataforma) y S'Narai son apps de Meta diferentes: cada número tiene su
 * token y su app secret. Resolver el tenant *antes* de validar la firma es lo que
 * evita que un mensaje de una app se procese con las credenciales de la otra.
 */
import { db } from '@saasfly/db-core';
import { projects } from '@saasfly/db-core/schema';

/** Número maestro de la plataforma (Hermes), si está configurado. */
export function masterWhatsAppPhoneNumberId(): string {
  return (
    process.env.HERMES_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.META_PHONE_NUMBER_ID ||
    ''
  ).trim();
}

function envPhoneIdForTenant(slug: string): string {
  const upper = `META_PHONE_NUMBER_ID_${slug.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  const raw = `META_PHONE_NUMBER_ID_${slug.replace(/-/g, '_')}`;
  return (process.env[upper] || process.env[raw] || '').trim();
}

export async function resolveTenantByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
  const phoneId = String(phoneNumberId || '').trim();
  if (!phoneId) return null;

  const master = masterWhatsAppPhoneNumberId();
  if (master && master === phoneId) return 'pandoras';

  try {
    const rows = await db
      .select({
        slug: projects.slug,
        runtimeConfig: projects.tenantRuntimeConfig,
        w2eConfig: projects.w2eConfig,
      })
      .from(projects)
      .limit(1000);

    for (const row of rows) {
      const slug = String(row.slug || '').toLowerCase();
      if (!slug) continue;

      const runtime = (row.runtimeConfig as any) || {};
      const w2e = (row.w2eConfig as any) || {};
      const candidates = [
        envPhoneIdForTenant(slug),
        String(runtime?.secrets?.whatsappPhoneId || '').trim(),
        String(w2e?.whatsappPhoneId || '').trim(),
      ].filter(Boolean);

      if (candidates.includes(phoneId) && phoneId !== master) return slug;
    }
  } catch (err: any) {
    console.warn('[WhatsAppTenant] No se pudo leer proyectos:', err?.message || err);
  }

  // Un número dedicado que no está en el registro no se asigna a nadie: fail-closed.
  return null;
}

/** Slug cuyo secreto de app corresponde a ese número (o `null` si es de plataforma). */
export function tenantAppSecretEnvName(slug: string | null): string | null {
  if (!slug || slug === 'pandoras') return null;
  return `META_APP_SECRET_${slug.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
}
