import { db } from "@saasfly/db";
import { nexusPodContacts } from "@saasfly/db/schema";
import { and, eq, sql } from "@saasfly/db-core";

/**
 * Contacto de un **Deal Pod** en el canal WhatsApp.
 *
 * Deliberadamente separado de `marketing_identities`, `marketing_leads` y del
 * knowledge de cada tenant: esta ficha vive en su pod y sólo sirve para que
 * Hermes reconozca a la persona en el número maestro de Pandora's.
 *
 * La bienvenida es determinista: no depende del LLM ni del knowledge cargado, así
 * que el primer contacto siempre sale bien. Cooldown configurable por contacto.
 */

export interface PodContactContext {
  company?: string;
  projectSummary?: string;
  dealId?: string;
  dealUrl?: string;
  pdfUrl?: string;
  proposalUrl?: string;
  pending?: string[];
  [key: string]: unknown;
}

export interface PodContact {
  id: string;
  name: string;
  role: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  context: PodContactContext;
  welcomeEnabled: boolean;
  welcomeCooldownHours: number;
  lastWelcomedAt: Date | null;
}

export function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Busca la ficha del contacto por teléfono, dentro de una organización y sus pods. */
export async function findPodContactByPhone(
  phone: string,
  orgId = "pandoras",
): Promise<PodContact | null> {
  const digits = normalizePhone(phone);
  if (digits.length < 10) return null;

  const [row] = await db
    .select()
    .from(nexusPodContacts)
    .where(
      and(
        eq(nexusPodContacts.canonicalOrgId, orgId),
        sql`right(regexp_replace(${nexusPodContacts.phone}, '[^0-9]', '', 'g'), 10) = right(${digits}, 10)`,
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    relationship: row.relationship,
    phone: row.phone,
    email: row.email,
    context: (row.context as PodContactContext) ?? {},
    welcomeEnabled: row.welcomeEnabled,
    welcomeCooldownHours: row.welcomeCooldownHours,
    lastWelcomedAt: row.lastWelcomedAt,
  };
}

export function shouldWelcome(contact: PodContact | null, now = Date.now()): boolean {
  if (!contact?.welcomeEnabled) return false;
  if (!contact.lastWelcomedAt) return true;
  const last = new Date(contact.lastWelcomedAt).getTime();
  if (!Number.isFinite(last)) return true;
  const hours = contact.welcomeCooldownHours > 0 ? contact.welcomeCooldownHours : 168;
  return now - last >= hours * 60 * 60 * 1000;
}

/**
 * Bienvenida. Hermes habla con su propia identidad (Pandora's / el ecosistema),
 * no como "asistente de" nadie. Tono cercano, contexto en prosa y una pregunta.
 */
export function buildPodWelcome(contact: PodContact): string {
  const firstName = contact.name.trim().split(/\s+/)[0] || contact.name;
  const ctx = contact.context ?? {};
  const lines: string[] = [];

  lines.push(`Hola ${firstName}, soy Hermes, de Pandora's. Qué gusto tenerte por aquí.`);

  if (ctx.projectSummary) {
    lines.push("");
    lines.push(ctx.projectSummary);
  }

  if (ctx.dealUrl) {
    lines.push("");
    lines.push("Cuando quieras, la sala con el contrato está aquí:");
    lines.push(ctx.dealUrl);
  }
  if (ctx.pdfUrl) {
    lines.push(`Y si prefieres revisarlo en PDF: ${ctx.pdfUrl}`);
  }

  const pending = (ctx.pending ?? []).filter(Boolean);
  if (pending.length > 0) {
    lines.push("");
    lines.push(
      pending.length === 1
        ? `Por ahora seguimos con un pendiente: ${pending[0]}.`
        : `Por ahora seguimos con dos cosas: ${pending.slice(0, -1).join(" y ")}; y ${pending[pending.length - 1]}.`,
    );
  }

  lines.push("");
  lines.push(
    "¿Te gustaría que empecemos por la firma o prefieres que te explique primero qué incluye la Fase 0?",
  );

  return lines.join("\n");
}

/** Marca la bienvenida enviada. */
export async function markPodWelcomed(contactId: string, at = new Date()): Promise<void> {
  await db
    .update(nexusPodContacts)
    .set({ lastWelcomedAt: at, updatedAt: new Date() })
    .where(eq(nexusPodContacts.id, contactId));
}
