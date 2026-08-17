import { db } from "@/db";
import {
  nexusDealRooms,
  nexusDealSections,
  nexusDealAuditEvents,
  nexusDealSigners,
  nexusNdaAcceptances,
} from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { newRoomId, generatePublicId, defaultSections, SignerInput, DealKind } from "./types";
import { sendDealRoomActionRequiredAlert, sendDealRoomChainedReleaseAlert, sendSignatureAlert } from "./discord";
import { sendDealRoomReleaseEmail } from "@/lib/email/nexus-mailer";

export interface CreateRoomInput {
  kind: DealKind;
  counterparty: string;
  relation?: string;
  company?: string;
  summary?: string;
  note?: string;
  signers?: SignerInput[];
  taskRef?: string;
  openSign?: boolean;
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
      openSign: input.openSign ?? false,
      taskRef: input.taskRef ?? null,
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
    detail: `Deal Room ${publicId} abierto para ${input.counterparty} (${input.kind})${
      input.taskRef ? ` · vinculado a tarea ${input.taskRef}` : ""
    }`,
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
  taskRef?: string;
  openSign?: boolean;
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
  if (fields.taskRef !== undefined) patch.taskRef = fields.taskRef === "" ? null : fields.taskRef;
  if (fields.openSign !== undefined) patch.openSign = fields.openSign;

  if (fields.status === "EXECUTED" && !patch.enteredIntoForceAt) {
    patch.enteredIntoForceAt = new Date();
  }

  await db.update(nexusDealRooms).set(patch).where(eq(nexusDealRooms.id, id));
  await appendAudit(id, actor, "Room updated", JSON.stringify(fields).slice(0, 300));
  return getRoom(id);
}

// Ciclo de vida: cuando una propuesta pasa a acuerdo legítimo (SIGNED) se registra
// la fecha de entrada en vigor (15.15 del Charter: "entrará en vigor a partir de su
// firma por todas las partes"). Al marcar EXECUTING inicia la fase de ejecución.
export async function setRoomLifecycle(
  id: string,
  status: "SIGNED" | "EXECUTING" | "EXECUTED",
  actor: string,
  detail?: string
) {
  const now = new Date();
  const patch: Record<string, unknown> = { status, updatedAt: now };
  if (status === "SIGNED" || status === "EXECUTED") {
    patch.enteredIntoForceAt = now;
  }
  await db.update(nexusDealRooms).set(patch).where(eq(nexusDealRooms.id, id));
  await appendAudit(id, actor, status === "EXECUTED" ? "Executed" : status, detail ?? `Transición de ciclo de vida a ${status}`);
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

  // El room se adapta al nuevo conjunto de firmantes: si estaba SIGNED y ahora
  // hay alguien pendiente, vuelve a ACCEPTED hasta que todos firmen.
  await syncRoomSignStatus(roomId);
  return getRoom(roomId);
}

export async function removeSigner(roomId: string, signerId: string, actor: string) {
  await db.delete(nexusDealSigners).where(eq(nexusDealSigners.id, signerId));
  await appendAudit(roomId, actor, "Signer removed", signerId);

  // Si al quitar un pendiente todos los restantes ya firmaron → SIGNED.
  await syncRoomSignStatus(roomId);
  return getRoom(roomId);
}

// Recalcula el estado del room según el conjunto actual de firmantes.
// - Todos firmaron → SIGNED (entrada en vigor; se preserva enteredIntoForceAt previo si existía).
// - Falta alguno por firmar y el room estaba SIGNED → vuelve a ACCEPTED
//   y se limpia la entrada en vigor para que el nuevo firmante pueda firmar.
// La acción se registra como "AutoSigned" (evento del sistema, no de una persona).
async function syncRoomSignStatus(roomId: string) {
  const signers = await db
    .select({ status: nexusDealSigners.status, email: nexusDealSigners.email })
    .from(nexusDealSigners)
    .where(eq(nexusDealSigners.roomId, roomId));

  const [room] = await db
    .select({ 
      publicId: nexusDealRooms.publicId,
      counterparty: nexusDealRooms.counterparty,
      status: nexusDealRooms.status, 
      enteredIntoForceAt: nexusDealRooms.enteredIntoForceAt,
      nextRoomId: nexusDealRooms.nextRoomId
    })
    .from(nexusDealRooms)
    .where(eq(nexusDealRooms.id, roomId))
    .limit(1);
  if (!room) return;

  const allSigned = signers.length > 0 && signers.every((s) => s.status === "SIGNED");
  const now = new Date();

  if (allSigned && room.status !== "SIGNED") {
    await db
      .update(nexusDealRooms)
      .set({ status: "SIGNED", enteredIntoForceAt: room.enteredIntoForceAt ?? now, updatedAt: now })
      .where(eq(nexusDealRooms.id, roomId));
    await appendAudit(
      roomId,
      "Nexus Ops",
      "AutoSigned",
      "Todos los signers firmaron · estado SIGNED · acuerdo legítimo en vigor"
    );

    // --- DEAL ROOM CHAINING LOGIC ---
    if (room.nextRoomId) {
      const nextRoom = await getRoom(room.nextRoomId);
      if (nextRoom) {
        // Transferir firmantes si no existen en el siguiente room
        const existingNextSigners = new Set(nextRoom.signers.map(s => s.email));
        const newSigners = signers.filter(s => !existingNextSigners.has(s.email));
        if (newSigners.length > 0) {
          await db.insert(nexusDealSigners).values(
            newSigners.map(s => ({ roomId: nextRoom.id, email: s.email, status: "PENDING" as const }))
          );
        }

        // Actualizar el estado del siguiente room para liberarlo
        await db
          .update(nexusDealRooms)
          .set({ status: "PROPOSAL_SENT", updatedAt: now })
          .where(eq(nexusDealRooms.id, nextRoom.id));
        
        await appendAudit(nextRoom.id, "Nexus Ops", "Document Released", `Liberado automáticamente tras la firma del documento previo (${room.publicId})`);

        // Enviar correos a todos los firmantes
        const allNextSigners = [...existingNextSigners, ...newSigners.map(s => s.email)];
        for (const email of allNextSigners) {
           await sendDealRoomReleaseEmail({
              email,
              roomLabel: nextRoom.publicId,
              publicId: nextRoom.publicId,
              company: nextRoom.company,
              counterparty: nextRoom.counterparty,
           });
        }

        // Alerta de Discord
        await sendDealRoomChainedReleaseAlert({
          roomLabel: nextRoom.publicId,
          previousRoomLabel: room.publicId,
        });
      }
    } else {
      // Si no hay siguiente documento, notificar alerta de acción requerida
      await sendDealRoomActionRequiredAlert({ roomLabel: `${room.publicId} · ${room.counterparty}` });
    }
  } else if (!allSigned && room.status === "SIGNED") {
    await db
      .update(nexusDealRooms)
      .set({ status: "ACCEPTED", enteredIntoForceAt: null, updatedAt: now })
      .where(eq(nexusDealRooms.id, roomId));
    const pending = signers.filter((s) => s.status !== "SIGNED").length;
    await appendAudit(
      roomId,
      "Nexus Ops",
      "AutoSigned",
      `Cambió el conjunto de firmantes · estado reabierto a ACCEPTED · ${pending} pendiente(s) de firma`
    );
  }
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

export async function signRoom(
  roomId: string,
  email: string,
  name: string,
  opts: { wallet?: string; signature?: string; signatureMessage?: string } = {}
) {
  const now = new Date();
  await db
    .update(nexusDealSigners)
    .set({
      status: "SIGNED",
      signedAt: now,
      signatureName: name,
      wallet: opts.wallet ?? null,
      signature: opts.signature ?? null,
      signatureMessage: opts.signatureMessage ?? null,
    })
    .where(and(eq(nexusDealSigners.roomId, roomId), eq(nexusDealSigners.email, email)));

  await appendAudit(
    roomId,
    name,
    "Signed",
    `${email} firmó on-chain${opts.wallet ? ` (${opts.wallet})` : ""}${opts.signature ? ` · sig ${opts.signature.slice(0, 12)}…` : ""}`
  );

  const roomBefore = await getRoom(roomId);
  
  // Estado del room se recalcula según el conjunto actual de firmantes:
  // todos firmaron → SIGNED; queda alguien pendiente → se reabre.
  await syncRoomSignStatus(roomId);
  
  const roomAfter = await getRoom(roomId);
  
  await sendSignatureAlert({
      roomLabel: `${roomAfter?.publicId} · ${roomAfter?.counterparty}`,
      signerName: name,
      email,
      kind: roomAfter?.kind,
      online: false,
      enteredIntoForce: roomBefore?.status !== "SIGNED" && roomAfter?.status === "SIGNED"
  });

  return roomAfter;
}

// Firma "online": el firmante abre el link público de un room con openSign,
// registra su nombre + wallet on-chain sin necesidad de email pre-registrado.
export async function signRoomOnline(
  roomId: string,
  name: string,
  opts: { wallet: string; signature: string; signatureMessage: string }
) {
  const now = new Date();
  const email = opts.wallet.toLowerCase();

  const existing = await db
    .select({ id: nexusDealSigners.id })
    .from(nexusDealSigners)
    .where(and(eq(nexusDealSigners.roomId, roomId), eq(nexusDealSigners.email, email)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(nexusDealSigners)
      .set({
        status: "SIGNED",
        signedAt: now,
        signatureName: name,
        wallet: opts.wallet,
        signature: opts.signature,
        signatureMessage: opts.signatureMessage,
      })
      .where(eq(nexusDealSigners.id, existing[0].id));
  } else {
    await db.insert(nexusDealSigners).values({
      roomId,
      email,
      status: "SIGNED",
      signedAt: now,
      signatureName: name,
      wallet: opts.wallet,
      signature: opts.signature,
      signatureMessage: opts.signatureMessage,
    });
  }

  await appendAudit(
    roomId,
    name,
    "Signed",
    `Firma online (openSign) · ${opts.wallet} · sig ${opts.signature.slice(0, 12)}…`
  );

  const roomBefore = await getRoom(roomId);
  
  // Estado del room se recalcula según el conjunto actual de firmantes:
  // todos firmaron → SIGNED; queda alguien pendiente → se reabre.
  await syncRoomSignStatus(roomId);
  
  const roomAfter = await getRoom(roomId);

  await sendSignatureAlert({
      roomLabel: `${roomAfter?.publicId} · ${roomAfter?.counterparty}`,
      signerName: name,
      email,
      kind: roomAfter?.kind,
      online: true,
      enteredIntoForce: roomBefore?.status !== "SIGNED" && roomAfter?.status === "SIGNED"
  });

  return roomAfter;
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
    openSign: room.openSign,
    enteredIntoForceAt: room.enteredIntoForceAt ? room.enteredIntoForceAt.toISOString() : null,
    // NDA Engine
    ndaEnabled: room.ndaEnabled,
    ndaPhase: room.ndaPhase,
    ndaVersion: room.ndaVersion,
    sections: room.sections,
  };
}

// Agrega una sección nueva editable al room (para extender una propuesta o
// adecuar el documento con cláusulas propias antes de firmar).
export async function addSection(roomId: string, actor: string) {
  const sections = await db
    .select({ code: nexusDealSections.code })
    .from(nexusDealSections)
    .where(eq(nexusDealSections.roomId, roomId))
    .orderBy(nexusDealSections.code);
  const code = String(sections.length + 1).padStart(2, "0").slice(0, 2);
  await db.insert(nexusDealSections).values({
    roomId,
    code,
    title: "Nueva Cláusula",
    subtitle: "En edición",
    content: "",
  });
  await db.update(nexusDealRooms).set({ updatedAt: new Date() }).where(eq(nexusDealRooms.id, roomId));
  await appendAudit(roomId, actor, "Section added", `Sección ${code} agregada (editable)`);
  return getRoom(roomId);
}

// Boilerplate legal que se anexa al convertir una propuesta en Acuerdo.
// Cada cláusula queda editable por las partes desde la consola.
const AGREEMENT_BOILERPLATE: { title: string; subtitle: string; content: string }[] = [
  {
    title: "Objeto del Acuerdo",
    subtitle: "Propósito y alcance",
    content: [
      "Las Partes acuerdan formalizar la colaboración descrita en esta propuesta, que pasa a tener carácter vinculante.",
      "El presente Acuerdo sustituye y absorbe la propuesta original, conservando su numeración y contenido salvo lo aquí modificado.",
      "Cualquier término adicional o modificación constará como cláusula y quedará refrendada por las Partes.",
    ].join("\n"),
  },
  {
    title: "Obligaciones de las Partes",
    subtitle: "Deberes y compromisos",
    content: [
      "Cada Parte cumplirá las obligaciones descritas en las secciones precedentes.",
      "Los entregables, plazos y condiciones de pago acordados en la propuesta se incorporan como Anexo de este Acuerdo.",
      "Ninguna Parte podrá ceder sus derechos u obligaciones sin consentimiento escrito de la otra.",
    ].join("\n"),
  },
  {
    title: "Confidencialidad",
    subtitle: "Protección de información",
    content: [
      "La información intercambiada bajo esta colaboración se tratará como confidencial durante la vigencia y 2 años posteriores.",
      "Queda prohibida la divulgación de información sensible del ecosistema Pandora's sin autorización previa por escrito.",
      "El incumplimiento de esta cláusula dará derecho a la Parte afectada a reclamar daños y perjuicios.",
    ].join("\n"),
  },
  {
    title: "Terminación y Ley Aplicable",
    subtitle: "Causas de extinción y jurisdicción",
    content: [
      "El Acuerdo podrá terminarse por mutuo acuerdo, incumplimiento grave, o decisión unilateral con 30 días de aviso por escrito.",
      "Las controversias se resolverán conforme a la ley del estado de Delaware, Estados Unidos.",
      "Toda enmienda requerirá firma de ambas Partes y quedará registrada en el audit trail del Deal Room.",
    ].join("\n"),
  },
  {
    title: "Firma y Entrada en Vigor",
    subtitle: "Ejecución y vigencia",
    content: [
      "El presente Acuerdo entrará en vigor a partir de su firma por todas las Partes (firma on-chain verificada).",
      "La firma electrónica de cada Parte genera un evento inmutable en el audit trail del Deal Room.",
      "Cada Parte declara tener capacidad legal para obligarse y que ha leído y entiende el contenido completo.",
    ].join("\n"),
  },
];

// Convierte una propuesta en un Acuerdo Legal en el mismo room: mantiene
// publicId, signers, audit y taskRef; anexa cláusulas legales editables y
// pasa el room a REVIEW para poder adecuar el contenido antes de firmar.
export async function convertToAgreement(roomId: string, actor: string) {
  const [room] = await db
    .select({ kind: nexusDealRooms.kind })
    .from(nexusDealRooms)
    .where(eq(nexusDealRooms.id, roomId))
    .limit(1);
  if (!room) return null;

  const sections = await db
    .select({ code: nexusDealSections.code })
    .from(nexusDealSections)
    .where(eq(nexusDealSections.roomId, roomId))
    .orderBy(nexusDealSections.code);

  let next = sections.length + 1;
  for (const block of AGREEMENT_BOILERPLATE) {
    await db.insert(nexusDealSections).values({
      roomId,
      code: String(next).padStart(2, "0").slice(0, 2),
      title: block.title,
      subtitle: block.subtitle,
      content: block.content,
    });
    next++;
  }

  const now = new Date();
  await db
    .update(nexusDealRooms)
    .set({ kind: "AGREEMENT", status: "REVIEW", updatedAt: now })
    .where(eq(nexusDealRooms.id, roomId));
  await appendAudit(
    roomId,
    actor,
    "Converted to agreement",
    `Propuesta extendida y convertida en Acuerdo Legal · ${AGREEMENT_BOILERPLATE.length} cláusulas anexadas (editables) · estado REVIEW`
  );
  return getRoom(roomId);
}

// ── NDA ENGINE FUNCTIONS ────────────────────────────────────────────────────

/**
 * Check if an email has already signed the NDA (global bypass).
 * Returns the acceptance record if found, null otherwise.
 */
export async function hasEmailSignedNda(
  email: string,
  ndaVersion: string = "v1.0"
): Promise<{ acceptedAt: Date; wallet: string | null } | null> {
  const row = await db.query.nexusNdaAcceptances.findFirst({
    where: and(
      eq(nexusNdaAcceptances.email, email.toLowerCase()),
      eq(nexusNdaAcceptances.ndaVersion, ndaVersion)
    ),
    columns: { acceptedAt: true, wallet: true },
  });
  return row ?? null;
}

/**
 * Record an NDA acceptance (used when someone signs for the first time).
 * Silently skips duplicates due to the unique index on (email, nda_version).
 */
export async function recordNdaAcceptance(input: {
  email: string;
  ndaVersion?: string;
  wallet?: string;
  signature?: string;
  signatureMessage?: string;
  roomId?: string;
  ip?: string;
  userAgent?: string;
}) {
  const ndaVersion = input.ndaVersion ?? "v1.0";
  const email = input.email.toLowerCase();
  try {
    await db
      .insert(nexusNdaAcceptances)
      .values({
        email,
        ndaVersion,
        acceptedAt: new Date(),
        wallet: input.wallet ?? null,
        signature: input.signature ?? null,
        signatureMessage: input.signatureMessage ?? null,
        firstRoomId: input.roomId ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      })
      .onConflictDoNothing(); // If already signed, skip silently
  } catch {
    // Already exists — bypass is already in place, nothing to do
  }
}

/**
 * Enable or disable NDA for a specific room from the admin console.
 */
export async function enableNdaForRoom(
  roomId: string,
  enabled: boolean,
  phase: "before_proposal" | "after_proposal",
  actor: string
) {
  const now = new Date();
  await db
    .update(nexusDealRooms)
    .set({ ndaEnabled: enabled, ndaPhase: phase, updatedAt: now })
    .where(eq(nexusDealRooms.id, roomId));
  await appendAudit(
    roomId,
    actor,
    enabled ? "NDA enabled" : "NDA disabled",
    `NDA ${enabled ? "habilitado" : "deshabilitado"} · fase: ${phase}`
  );
}
