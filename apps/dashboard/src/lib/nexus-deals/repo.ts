import { db } from "@/db";
import {
  nexusDealRooms,
  nexusDealSections,
  nexusDealAuditEvents,
  nexusDealSigners,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { newRoomId, generatePublicId, defaultSections, SignerInput, DealKind } from "./types";

export interface CreateRoomInput {
  kind: DealKind;
  counterparty: string;
  relation?: string;
  company?: string;
  summary?: string;
  note?: string;
  signers?: SignerInput[];
  actor?: string;
}

export async function listRooms() {
  return db.query.nexusDealRooms.findMany({
    orderBy: [desc(nexusDealRooms.updatedAt)],
    with: {
      sections: { orderBy: (s, { asc }) => [asc(s.code)] },
      audit: { orderBy: (a, { desc }) => [desc(a.at)] },
      signers: true,
    },
  });
}

export async function getRoom(id: string) {
  return db.query.nexusDealRooms.findFirst({
    where: eq(nexusDealRooms.id, id),
    with: {
      sections: { orderBy: (s, { asc }) => [asc(s.code)] },
      audit: { orderBy: (a, { desc }) => [desc(a.at)] },
      signers: true,
    },
  });
}

export async function getRoomByPublicId(publicId: string) {
  return db.query.nexusDealRooms.findFirst({
    where: eq(nexusDealRooms.publicId, publicId),
    with: {
      sections: { orderBy: (s, { asc }) => [asc(s.code)] },
      audit: { orderBy: (a, { desc }) => [desc(a.at)] },
      signers: true,
    },
  });
}

export async function createRoom(input: CreateRoomInput) {
  const id = newRoomId();
  const publicId = generatePublicId();
  const actor = input.actor ?? "Nexus Ops";
  const now = new Date();

  const [room] = await db
    .insert(nexusDealRooms)
    .values({
      id,
      publicId,
      kind: input.kind,
      counterparty: input.counterparty,
      relation: input.relation ?? "Strategic Partner",
      company: input.company ?? "Pandoras USA Operations LLC",
      status: "DRAFT",
      summary: input.summary ?? null,
      autoShare: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const sections = defaultSections(input.note);
  if (sections.length > 0) {
    await db.insert(nexusDealSections).values(
      sections.map((s) => ({
        roomId: id,
        code: s.code,
        title: s.title,
        subtitle: s.subtitle,
        content: s.content,
      }))
    );
  }

  if (input.signers && input.signers.length > 0) {
    await db.insert(nexusDealSigners).values(
      input.signers.map((s) => ({ roomId: id, email: s.email.toLowerCase() }))
    );
  }

  await db.insert(nexusDealAuditEvents).values({
    roomId: id,
    actor,
    action: "Room created",
    detail: `Deal Room ${publicId} abierto para ${input.counterparty} (${input.kind})`,
    at: now,
  });

  return getRoom(id);
}

export async function updateRoom(input: {
  id: string;
  kind?: DealKind;
  counterparty?: string;
  relation?: string;
  company?: string;
  summary?: string;
  status?: string;
  actor?: string;
}) {
  const { id, actor = "Nexus Ops", ...fields } = input;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.kind !== undefined) patch.kind = fields.kind;
  if (fields.counterparty !== undefined) patch.counterparty = fields.counterparty;
  if (fields.relation !== undefined) patch.relation = fields.relation;
  if (fields.company !== undefined) patch.company = fields.company;
  if (fields.summary !== undefined) patch.summary = fields.summary;
  if (fields.status !== undefined) patch.status = fields.status;

  await db.update(nexusDealRooms).set(patch).where(eq(nexusDealRooms.id, id));
  await appendAudit(id, actor, "Room updated", JSON.stringify(fields).slice(0, 300));
  return getRoom(id);
}

export async function updateSection(roomId: string, code: string, content: string, actor: string) {
  const [section] = await db
    .select({ id: nexusDealSections.id, title: nexusDealSections.title })
    .from(nexusDealSections)
    .where(and(eq(nexusDealSections.roomId, roomId), eq(nexusDealSections.code, code)))
    .limit(1);
  if (!section) return null;

  await db.update(nexusDealSections).set({ content }).where(eq(nexusDealSections.id, section.id));
  await db.update(nexusDealRooms).set({ updatedAt: new Date() }).where(eq(nexusDealRooms.id, roomId));
  await appendAudit(roomId, actor, "Section updated", `Sección ${code} (${section.title}) actualizada`);
  return getRoom(roomId);
}

export async function appendAudit(
  roomId: string,
  actor: string,
  action: string,
  detail?: string
) {
  await db.insert(nexusDealAuditEvents).values({
    roomId,
    actor,
    action,
    detail: detail ?? null,
    at: new Date(),
  });
}

export async function addSigners(roomId: string, emails: string[], actor: string) {
  const clean = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"))));
  if (clean.length === 0) return getRoom(roomId);

  for (const email of clean) {
    const existing = await db
      .select({ id: nexusDealSigners.id })
      .from(nexusDealSigners)
      .where(and(eq(nexusDealSigners.roomId, roomId), eq(nexusDealSigners.email, email)))
      .limit(1);
    if (!existing[0]) {
      await db.insert(nexusDealSigners).values({ roomId, email, status: "PENDING" });
    }
  }
  await appendAudit(roomId, actor, "Signers added", clean.join(", "));
  return getRoom(roomId);
}

export async function removeSigner(roomId: string, signerId: string, actor: string) {
  await db.delete(nexusDealSigners).where(eq(nexusDealSigners.id, signerId));
  await appendAudit(roomId, actor, "Signer removed", signerId);
  return getRoom(roomId);
}

export async function markMagicSent(roomId: string, email: string) {
  await db
    .update(nexusDealSigners)
    .set({
      status: "MAGIC_SENT",
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .where(and(eq(nexusDealSigners.roomId, roomId), eq(nexusDealSigners.email, email)));
}

export async function markViewed(roomId: string, email: string) {
  await db
    .update(nexusDealSigners)
    .set({ status: "VIEWED" })
    .where(and(eq(nexusDealSigners.roomId, roomId), eq(nexusDealSigners.email, email)));
}

export async function signRoom(roomId: string, email: string, name: string, wallet?: string) {
  const now = new Date();
  await db
    .update(nexusDealSigners)
    .set({ status: "SIGNED", signedAt: now, signatureName: name, wallet: wallet ?? null })
    .where(and(eq(nexusDealSigners.roomId, roomId), eq(nexusDealSigners.email, email)));

  await appendAudit(roomId, name, "Signed", `${email} firmó el acuerdo (concepto)`);

  // Si todos los signers firmaron → el room pasa a SIGNED
  const signers = await db
    .select({ status: nexusDealSigners.status })
    .from(nexusDealSigners)
    .where(eq(nexusDealSigners.roomId, roomId));
  if (signers.length > 0 && signers.every((s) => s.status === "SIGNED")) {
    await db
      .update(nexusDealRooms)
      .set({ status: "SIGNED", updatedAt: now })
      .where(eq(nexusDealRooms.id, roomId));
    await appendAudit(roomId, "Nexus Ops", "Signed", "Todos los signers firmaron · estado SIGNED");
  }

  return getRoom(roomId);
}

export async function deleteRoom(id: string, actor: string) {
  await appendAudit(id, actor, "Room deleted", "Deal Room eliminado");
  await db.delete(nexusDealRooms).where(eq(nexusDealRooms.id, id));
}

export function publicRoomView(room: NonNullable<Awaited<ReturnType<typeof getRoomByPublicId>>>) {
  return {
    publicId: room.publicId,
    kind: room.kind,
    counterparty: room.counterparty,
    relation: room.relation,
    company: room.company,
    status: room.status,
    summary: room.summary,
    sections: room.sections,
  };
}
