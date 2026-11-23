import { createHash } from "node:crypto";
import { db } from "@saasfly/db";
import { nexusDealAccessRequests, nexusDealPods, nexusDealRooms, nexusOutreachLinks } from "@saasfly/db/schema";
import { and, desc, eq } from "@saasfly/db-core";
import { sendEmail } from "@saasfly/shared";
import {
  KIND_LABEL,
  addSigners,
  appendAudit,
  generateDealToken,
  getRoom,
  markMagicSent,
  sendDealMagicLink,
} from "@saasfly/nexus-deals-sdk";

/**
 * Solicitudes de acceso a un Deal Room — **categoría Deal Pod**.
 *
 * Regla de oro: una solicitud es una *propuesta*, no una autorización.
 *  · No crea firmante.
 *  · No envía magic link.
 *  · No toca `clients` ni `marketing_leads` (esos leads son de otros canales).
 *
 * El propietario del pod decide desde el hub: al aprobar se registra el firmante
 * y se envía el enlace; ahí sí hay ejecución, con actor y auditoría.
 */

const OPS_EMAIL = process.env.DEAL_OPS_EMAIL ?? "aztecaz@pandoras.finance";
const FROM = process.env.RESEND_FROM_EMAIL ?? "Pandora's Group <hello@pandoras.finance>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nexus.pandoras.finance";

export function hashIp(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 255 ? email : null;
}

function text(value: unknown, max = 255): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export interface CreateAccessRequestInput {
  podId: string;
  roomId: string;
  orgId: string;
  email: string;
  name?: string | null;
  company?: string | null;
  role?: string | null;
  message?: string | null;
  consent: boolean;
  source: "landing" | "room" | "manual";
  srcCode?: string | null;
  referrer?: string | null;
  utm?: Record<string, string>;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AccessRequestContext {
  podName: string;
  podCode: string;
  roomLabel: string;
  dealId: string;
  seedLabel: string | null;
  door: string | null;
}

export async function createAccessRequest(
  input: CreateAccessRequestInput,
): Promise<{ created: boolean; request: typeof nexusDealAccessRequests.$inferSelect } | null> {
  try {
    const [row] = await db
      .insert(nexusDealAccessRequests)
      .values({
        podId: input.podId,
        roomId: input.roomId,
        canonicalOrgId: input.orgId,
        email: input.email,
        name: text(input.name),
        company: text(input.company),
        role: text(input.role),
        message: text(input.message, 2000),
        consent: input.consent,
        source: input.source,
        srcCode: text(input.srcCode, 64),
        referrer: text(input.referrer, 500),
        utm: input.utm ?? {},
        ipHash: hashIp(input.ip),
        userAgent: text(input.userAgent, 500),
      })
      .onConflictDoNothing({ target: [nexusDealAccessRequests.roomId, nexusDealAccessRequests.email] })
      .returning();

    if (row) return { created: true, request: row };

    const [existing] = await db
      .select()
      .from(nexusDealAccessRequests)
      .where(
        and(
          eq(nexusDealAccessRequests.roomId, input.roomId),
          eq(nexusDealAccessRequests.email, input.email),
        ),
      )
      .limit(1);

    return existing ? { created: false, request: existing } : null;
  } catch (error) {
    console.error("[deal-access] no se pudo registrar la solicitud:", error);
    return null;
  }
}

/** Contexto legible para avisos (pod, sala, semilla de origen). */
export async function accessRequestContext(params: {
  podId: string;
  roomId: string;
  srcCode?: string | null;
}): Promise<AccessRequestContext | null> {
  const [pod] = await db
    .select({ name: nexusDealPods.displayName, code: nexusDealPods.code })
    .from(nexusDealPods)
    .where(eq(nexusDealPods.id, params.podId))
    .limit(1);
  const [room] = await db
    .select({ publicId: nexusDealRooms.publicId, title: nexusDealRooms.title })
    .from(nexusDealRooms)
    .where(eq(nexusDealRooms.id, params.roomId))
    .limit(1);

  let seedLabel: string | null = null;
  let door: string | null = null;
  if (params.srcCode) {
    const [link] = await db
      .select({ targetLabel: nexusOutreachLinks.targetLabel, targetOrg: nexusOutreachLinks.targetOrg, door: nexusOutreachLinks.door })
      .from(nexusOutreachLinks)
      .where(eq(nexusOutreachLinks.code, params.srcCode))
      .limit(1);
    seedLabel = link?.targetLabel ? [link.targetLabel, link.targetOrg].filter(Boolean).join(" · ") : null;
    door = link?.door ?? null;
  }

  if (!pod || !room) return null;
  return {
    podName: pod.name,
    podCode: pod.code,
    roomLabel: room.title,
    dealId: room.publicId,
    seedLabel,
    door,
  };
}

/**
 * Avisa la solicitud por Discord y por correo a operación.
 * Si un canal falla, se registra y se sigue: la solicitud ya está guardada.
 */
export async function notifyAccessRequest(params: {
  request: typeof nexusDealAccessRequests.$inferSelect;
  context: AccessRequestContext;
}): Promise<{ discord: boolean; email: boolean }> {
  const { request, context } = params;
  const who = [request.name, request.company].filter(Boolean).join(" · ") || request.email;
  const origin = request.srcCode ? `semilla /l/${request.srcCode}` : request.referrer || request.source;

  let discord = false;
  const webhook = process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_ALERTS;
  if (webhook) {
    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "🪪 Solicitud de acceso",
              description: `**${who}** pidió acceso a ${context.podName}.`,
              color: 0xf59e0b,
              fields: [
                { name: "Correo", value: request.email, inline: true },
                { name: "Empresa", value: request.company ?? "—", inline: true },
                { name: "Cargo", value: request.role ?? "—", inline: true },
                { name: "Origen", value: origin, inline: true },
                { name: "Puerta", value: context.door ?? "—", inline: true },
                { name: "Sala", value: `\`${context.dealId}\``, inline: true },
              ],
              footer: { text: "AZTECAZ · Deal Pod · pendiente de autorizar" },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      discord = response.ok;
    } catch (error) {
      console.error("[deal-access] Discord falló:", error);
    }
  }

  let email = false;
  try {
    const result = await sendEmail({
      from: FROM,
      to: OPS_EMAIL,
      replyTo: request.email,
      subject: `Solicitud de acceso · ${context.podName} · ${request.email}`,
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif;background:#08080C;color:#e5e5ea;padding:32px">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#fbbf24;margin:0 0 12px">
            Pandora's Nexus · Deal Pod
          </p>
          <h2 style="margin:0 0 8px;font-size:20px;color:#fff">Solicitud de acceso</h2>
          <p style="margin:0 0 20px;color:#a1a1aa">${context.podName} · ${context.roomLabel} (<code>${context.dealId}</code>)</p>
          <table cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.7;color:#e5e5ea">
            <tr><td style="color:#a1a1aa;padding-right:12px">Correo</td><td>${request.email}</td></tr>
            <tr><td style="color:#a1a1aa;padding-right:12px">Nombre</td><td>${request.name ?? "—"}</td></tr>
            <tr><td style="color:#a1a1aa;padding-right:12px">Empresa</td><td>${request.company ?? "—"}</td></tr>
            <tr><td style="color:#a1a1aa;padding-right:12px">Cargo</td><td>${request.role ?? "—"}</td></tr>
            <tr><td style="color:#a1a1aa;padding-right:12px">Origen</td><td>${origin}</td></tr>
            <tr><td style="color:#a1a1aa;padding-right:12px">Puerta</td><td>${context.door ?? "—"}</td></tr>
            <tr><td style="color:#a1a1aa;padding-right:12px">Mensaje</td><td>${request.message ?? "—"}</td></tr>
          </table>
          <p style="margin:22px 0 0;color:#a1a1aa;font-size:13px">
            No se envió ningún enlace. Autoriza desde el hub: <strong style="color:#fbbf24">OPS HUB → DEAL PODS → Solicitudes de acceso</strong>.
          </p>
        </div>`,
      text: [
        `Solicitud de acceso · ${context.podName} (${context.dealId})`,
        `Correo: ${request.email}`,
        `Nombre: ${request.name ?? "—"}`,
        `Empresa: ${request.company ?? "—"}`,
        `Cargo: ${request.role ?? "—"}`,
        `Origen: ${origin}`,
        `Puerta: ${context.door ?? "—"}`,
        `Mensaje: ${request.message ?? "—"}`,
        "No se envió ningún enlace: se autoriza desde OPS HUB → DEAL PODS.",
      ].join("\n"),
    });
    email = result.success;
  } catch (error) {
    console.error("[deal-access] correo a operación falló:", error);
  }

  return { discord, email };
}

/** Acuse al solicitante: no revela nada del activo ni del proceso interno. */
export async function acknowledgeAccessRequest(params: {
  request: typeof nexusDealAccessRequests.$inferSelect;
  context: AccessRequestContext;
}): Promise<boolean> {
  const { request, context } = params;
  const firstName = request.name?.split(" ")[0];

  try {
    const result = await sendEmail({
      from: FROM,
      to: request.email,
      subject: `Recibimos tu solicitud · ${context.podName}`,
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif;background:#08080C;color:#e5e5ea;padding:32px">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#34d399;margin:0 0 12px">
            AZTECAZ · Acceso institucional
          </p>
          <h2 style="margin:0 0 12px;font-size:20px;color:#fff">Solicitud recibida</h2>
          <p style="margin:0 0 14px;color:#d4d4d8;line-height:1.7">
            ${firstName ? `Hola ${firstName},` : "Hola,"} recibimos tu solicitud de acceso y estamos verificando elegibilidad.
          </p>
          <p style="margin:0 0 14px;color:#a1a1aa;line-height:1.7">
            Si tu perfil encaja con la operación, te enviaremos un enlace personal para revisar el acuerdo de
            confidencialidad. El acceso es individual y queda registrado.
          </p>
          <p style="margin:0;color:#71717a;font-size:12px">
            Si no solicitaste acceso, ignora este mensaje.
          </p>
        </div>`,
      text: `${firstName ? `Hola ${firstName},` : "Hola,"}\n\nRecibimos tu solicitud de acceso y estamos verificando elegibilidad. Si tu perfil encaja, te enviaremos un enlace personal para revisar el acuerdo de confidencialidad.\n\nSi no solicitaste acceso, ignora este mensaje.`,
    });
    return result.success;
  } catch (error) {
    console.error("[deal-access] acuse falló:", error);
    return false;
  }
}

export async function listAccessRequests(filters: {
  orgId: string;
  podId?: string;
  status?: string;
  limit?: number;
}) {
  const clauses = [eq(nexusDealAccessRequests.canonicalOrgId, filters.orgId)];
  if (filters.podId) clauses.push(eq(nexusDealAccessRequests.podId, filters.podId));
  if (filters.status) clauses.push(eq(nexusDealAccessRequests.status, filters.status));

  return db
    .select()
    .from(nexusDealAccessRequests)
    .where(and(...clauses))
    .orderBy(desc(nexusDealAccessRequests.createdAt))
    .limit(Math.min(filters.limit ?? 100, 200));
}

/**
 * Decisión del propietario del pod.
 *
 * `approve` es lo único que crea firmante y envía el enlace (actor + auditoría).
 * `reject` cierra la solicitud con motivo; el correo del solicitante no se registra.
 */
export async function decideAccessRequest(params: {
  requestId: string;
  podId: string;
  orgId: string;
  actor: string;
  action: "approve" | "reject";
  note?: string | null;
}): Promise<
  | { ok: true; status: "APPROVED" | "REJECTED"; magicSent: boolean; url?: string; alreadyDecided?: boolean }
  | { ok: false; status: number; error: string }
> {
  const [request] = await db
    .select()
    .from(nexusDealAccessRequests)
    .where(
      and(
        eq(nexusDealAccessRequests.id, params.requestId),
        eq(nexusDealAccessRequests.podId, params.podId),
        eq(nexusDealAccessRequests.canonicalOrgId, params.orgId),
      ),
    )
    .limit(1);

  if (!request) return { ok: false, status: 404, error: "Solicitud no encontrada." };

  if (request.status !== "PENDING") {
    return {
      ok: true,
      status: request.status === "APPROVED" ? "APPROVED" : "REJECTED",
      magicSent: false,
      alreadyDecided: true,
    };
  }

  if (params.action === "reject") {
    await db
      .update(nexusDealAccessRequests)
      .set({
        status: "REJECTED",
        decidedBy: params.actor,
        decidedAt: new Date(),
        decisionNote: params.note ?? null,
        updatedAt: new Date(),
      })
      .where(eq(nexusDealAccessRequests.id, request.id));
    await appendAudit(request.roomId, params.actor, "Access request rejected", request.email);
    return { ok: true, status: "REJECTED", magicSent: false };
  }

  const room = await getRoom(request.roomId);
  if (!room) return { ok: false, status: 404, error: "Sala no encontrada." };

  // 1. Firmante (mecanismo canónico del SDK: PENDING + auditoría + sync de estado)
  await addSigners(request.roomId, [request.email], params.actor);

  // 2. Enlace personal
  const token = generateDealToken(room.id, room.publicId, request.email);
  const magicUrl = `${BASE_URL}/deal/${room.publicId}?token=${encodeURIComponent(token)}&src=${encodeURIComponent(request.srcCode ?? "")}`;

  let magicSent = false;
  try {
    await sendDealMagicLink({
      to: request.email,
      firstName: request.name?.split(" ")[0] ?? request.email.split("@")[0],
      dealKindLabel: KIND_LABEL[room.kind] ?? room.kind,
      counterparty: room.counterparty,
      publicUrl: magicUrl,
    });
    await markMagicSent(room.id, request.email);
    magicSent = true;
  } catch (error) {
    console.error("[deal-access] no se pudo enviar el magic link:", error);
  }

  await db
    .update(nexusDealAccessRequests)
    .set({
      status: "APPROVED",
      decidedBy: params.actor,
      decidedAt: new Date(),
      decisionNote: params.note ?? null,
      updatedAt: new Date(),
    })
    .where(eq(nexusDealAccessRequests.id, request.id));

  await appendAudit(
    request.roomId,
    params.actor,
    "Access request approved",
    `${request.email}${magicSent ? " · magic link enviado" : " · magic link NO enviado"}`,
  );

  return { ok: true, status: "APPROVED", magicSent, url: magicSent ? magicUrl : undefined };
}
