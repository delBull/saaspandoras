import { db } from "@saasfly/db";
import { nexusDealSigners, nexusPodContacts } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { sendDealSignedEmail } from "@saasfly/nexus-deals-sdk";
import { buildRoomPdf } from "./room-pdf";

const KIND_LABEL: Record<string, string> = {
  PROPOSAL: "Propuesta de Colaboración",
  AGREEMENT: "Acuerdo",
  CONTRACT: "Contrato",
  AMENDMENT: "Convenio Modificatorio",
  CHARTER: "Carta",
  NDA: "Acuerdo de Confidencialidad",
};

/**
 * Efectos posteriores a una firma, en un solo lugar para que el flujo sea igual
 * en deal pods (Village, Patria) y en salas internas:
 *
 *  1. Deja al firmante como contacto del Deal Pod (nombre, correo, teléfono).
 *  2. Genera el PDF del documento firmado y lo **adjunta** al correo.
 *  3. Pide la POF en el mismo correo cuando el deal la exige.
 *  4. Explica qué sigue y con quién dar seguimiento.
 *  5. Marca `document_sent_at` para no reenviar y poder auditar la entrega.
 */
export async function afterSignature(params: {
  room: any;
  signerEmail: string;
  name: string;
  phone?: string | null;
  company?: string | null;
  role?: string | null;
  wallet?: string | null;
  signature?: string | null;
  signedAt?: Date | null;
}): Promise<{ emailed: boolean; attached: boolean; documentSentAt: Date | null; podContactId?: string }> {
  const { room, signerEmail, name } = params;
  const email = (signerEmail || "").toLowerCase();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://dash.pandoras.finance").replace(/\/$/, "");
  const kindLabel = KIND_LABEL[room.kind] ?? room.kind;
  const now = new Date();

  // 1. Contacto del Deal Pod (sólo deals externos, que viven en un pod).
  let podContactId: string | undefined;
  if (room.podId && isEmail) {
    try {
      const [existing] = await db
        .select({ id: nexusPodContacts.id })
        .from(nexusPodContacts)
        .where(and(eq(nexusPodContacts.podId, room.podId), eq(nexusPodContacts.email, email)))
        .limit(1);

      const relationship = `${kindLabel} firmado · ${room.publicId}`;
      if (existing) {
        await db
          .update(nexusPodContacts)
          .set({
            name,
            phone: params.phone || null,
            relationship,
            updatedAt: now,
          })
          .where(eq(nexusPodContacts.id, existing.id));
        podContactId = existing.id;
      } else {
        const [inserted] = await db
          .insert(nexusPodContacts)
          .values({
            podId: room.podId,
            canonicalOrgId: "pandoras",
            name,
            email,
            phone: params.phone || null,
            role: "CLIENT",
            relationship,
            context: { dealRoom: room.publicId, dealKind: room.kind, signedAt: now.toISOString() },
          })
          .returning({ id: nexusPodContacts.id });
        podContactId = inserted?.id;
      }
    } catch (err: any) {
      console.warn("[afterSignature] pod contact upsert failed:", err?.message || err);
    }
  }

  if (!isEmail) {
    // Firma por wallet (openSign sin correo): no hay a quién enviarle el PDF.
    return { emailed: false, attached: false, documentSentAt: null, podContactId };
  }

  // 2. PDF del documento firmado.
  let attachment: { filename: string; content: string; content_type: string } | undefined;
  try {
    const pdf = await buildRoomPdf({
      title: room.title || kindLabel,
      subtitle: `${kindLabel} · ${room.counterparty}`,
      dealId: room.publicId,
      counterparty: room.counterparty,
      provider: room.company || "Pandora's",
      sections: (room.sections ?? []).map((s: any) => ({ title: s.title, content: s.content })),
      signature: {
        name: params.name,
        company: params.company ?? null,
        role: params.role ?? null,
        signedAt: (params.signedAt ?? now).toISOString(),
        wallet: params.wallet ?? null,
        signature: params.signature ?? null,
      },
    });
    attachment = {
      filename: `${room.publicId}-${kindLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      content: Buffer.from(pdf).toString("base64"),
      content_type: "application/pdf",
    };
  } catch (err: any) {
    console.warn("[afterSignature] PDF generation failed:", err?.message || err);
  }

  // 3. Correo único y completo.
  let emailed = false;
  try {
    const result = await sendDealSignedEmail({
      to: email,
      firstName: name.split(" ")[0],
      dealKindLabel: kindLabel,
      counterparty: room.counterparty,
      publicId: room.publicId,
      enteredIntoForce: room.status === "SIGNED",
      contactEmail: process.env.DEAL_OPS_EMAIL || undefined,
      attachments: attachment ? [attachment] : undefined,
      pofRequired: Boolean(room.pofEnabled),
      pofUrl: `${base}/deal/${room.publicId}`,
      registered: { name, email, phone: params.phone || null },
    });
    emailed = Boolean(result?.success ?? true);
  } catch (err: any) {
    console.warn("[afterSignature] signed email failed:", err?.message || err);
  }

  // 4. Constancia de envío (por firmante).
  if (emailed) {
    try {
      await db
        .update( nexusDealSigners)
        .set({ documentSentAt: now })
        .where(and(eq(nexusDealSigners.roomId, room.id), eq(nexusDealSigners.email, email)));
    } catch (err: any) {
      console.warn("[afterSignature] documentSentAt update failed:", err?.message || err);
    }
  }

  return { emailed, attached: Boolean(attachment), documentSentAt: emailed ? now : null, podContactId };
}
