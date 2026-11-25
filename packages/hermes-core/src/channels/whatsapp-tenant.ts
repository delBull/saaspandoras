/**
 * 🧭 Identidad del tenant por número de WhatsApp (ADR-020)
 *
 * La autoridad no es el remitente: es **el número que recibió el mensaje**. El
 * webhook de Meta entrega `phone_number_id`; ese número pertenece a un tenant y
 * por tanto su Hermes es quien debe responder.
 *
 * Antes se resolvía sólo por el interlocutor y, si no había vínculo, caía a
 * `pandoras`. Un prospecto escribiendo al número de S'Narai podía terminar en el
 * Hermes equivocado.
 */
import { db } from '@saasfly/db-core';
import { projects } from '@saasfly/db-core/schema';

/** `META_PHONE_NUMBER_ID_<SLUG>` — misma convención que `vault:channel:<org>`. */
function envKeyForTenant(slug: string): string {
  return `META_PHONE_NUMBER_ID_${slug.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
}

export async function resolveTenantByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
  const phoneId = String(phoneNumberId || '').trim();
  if (!phoneId) return null;

  // 1. Número dedicado por tenant (lo normal en producción).
  try {
    const rows = await db.select({ slug: projects.slug }).from(projects).limit(1000);
    for (const row of rows) {
      const slug = String(row.slug || '').toLowerCase();
      if (!slug) continue;
      if (process.env[envKeyForTenant(slug)] === phoneId) return slug;
    }
  } catch (err: any) {
    console.warn('[WhatsAppTenant] No se pudo leer proyectos:', err?.message || err);
  }

  // 2. Número maestro de la plataforma.
  const master = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID;
  if (master && master === phoneId) return 'pandoras';

  return null;
}
