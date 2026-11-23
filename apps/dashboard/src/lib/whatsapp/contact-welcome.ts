import { db } from "@saasfly/db";
import { marketingIdentities } from "@saasfly/db/schema";
import { eq } from "@saasfly/db-core";

/**
 * Bienvenida de contacto para el canal de WhatsApp.
 *
 * Hermes reconoce a un cliente por su identidad canónica
 * (`marketing_identities.metadata.whatsapp`), no por lo que escriba en el primer
 * mensaje. La bienvenida es **determinista**: no depende del LLM ni de que el
 * conocimiento esté cargado, así que el primer contacto siempre sale bien.
 *
 * Se envía una vez cada 12 h como máximo y sólo si el perfil tiene
 * `whatsapp.welcome = true`.
 */

export interface ContactWhatsAppProfile {
  welcome?: boolean;
  status?: string;
  dealId?: string;
  dealUrl?: string;
  pdfUrl?: string;
  proposalUrl?: string;
  pending?: string[];
  lastWelcomedAt?: string;
  /** Horas mínimas entre bienvenidas. Por defecto 7 días. */
  cooldownHours?: number;
}

export interface ContactIdentity {
  /** El registro canónico expone `identityId` (no `id`). */
  identityId?: string;
  id?: string;
  metadata?: Record<string, unknown> | null;
  email?: string | null;
  phone?: string | null;
}

const DEFAULT_COOLDOWN_HOURS = 7 * 24;

export function whatsappProfileOf(identity: ContactIdentity | null | undefined): ContactWhatsAppProfile | null {
  const profile = (identity?.metadata as Record<string, unknown> | null | undefined)?.whatsapp;
  return profile && typeof profile === "object" ? (profile as ContactWhatsAppProfile) : null;
}

export function shouldWelcome(profile: ContactWhatsAppProfile | null, now = Date.now()): boolean {
  if (!profile?.welcome) return false;
  if (!profile.lastWelcomedAt) return true;
  const last = new Date(profile.lastWelcomedAt).getTime();
  if (!Number.isFinite(last)) return true;
  const hours = Number.isFinite(profile.cooldownHours) && (profile.cooldownHours ?? 0) > 0
    ? Number(profile.cooldownHours)
    : DEFAULT_COOLDOWN_HOURS;
  return now - last >= hours * 60 * 60 * 1000;
}

/** Texto de bienvenida. Sin enlaces inventados: sólo los del perfil. */
export function buildContactWelcome(input: {
  name: string;
  company?: string | null;
  profile: ContactWhatsAppProfile;
}): string {
  const firstName = input.name.trim().split(/\s+/)[0] || input.name;
  const lines: string[] = [
    `Hola ${firstName}, soy Hermes, el asistente de Marco.`,
  ];

  if (input.company) lines.push(`Te tengo registrado como ${input.company}.`);

  const pending = (input.profile.pending ?? []).filter(Boolean);
  if (pending.length > 0) {
    lines.push("");
    lines.push("Esto es lo que tengo pendiente:");
    for (const item of pending) lines.push(`• ${item}`);
  }

  if (input.profile.dealUrl) {
    lines.push("");
    lines.push(`Sala del contrato: ${input.profile.dealUrl}`);
  }
  if (input.profile.pdfUrl) lines.push(`Contrato en PDF: ${input.profile.pdfUrl}`);
  if (input.profile.proposalUrl) lines.push(`Propuesta: ${input.profile.proposalUrl}`);

  lines.push("");
  lines.push("Si quieres, te guío para firmar en dos minutos. Y cuando tengas los accesos del VPS y la base de datos, me los dices y arrancamos la Fase 0.");

  return lines.join("\n");
}

/** Marca la bienvenida enviada (lectura-modificación-escritura del metadata). */
export async function markWelcomed(identity: ContactIdentity, at = new Date()): Promise<void> {
  const identityId = identity.identityId ?? identity.id;
  if (!identityId) {
    console.warn('[contact-welcome] identidad sin id: no se puede marcar la bienvenida');
    return;
  }
  const metadata = { ...(identity.metadata ?? {}) } as Record<string, unknown>;
  const profile = { ...((metadata.whatsapp as ContactWhatsAppProfile | undefined) ?? {}) };
  profile.lastWelcomedAt = at.toISOString();
  metadata.whatsapp = profile;

  await db
    .update(marketingIdentities)
    .set({ metadata, updatedAt: new Date() })
    .where(eq(marketingIdentities.id, identityId));
}
