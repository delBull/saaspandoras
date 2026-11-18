import { NextResponse } from "next/server";
import { checkNexusPermission, getNexusAuthContext } from "@saasfly/shared";
import { canUserAccessDeal, getRoom, getRoomByPublicId } from "@saasfly/nexus-deals-sdk";
import { AgendaCore } from "@saasfly/agenda-sdk";
import { isKnownPresentation } from "@/lib/nexus/presentations-catalog";
import { defaultAppBaseUrl, sendMeetingInvites } from "@/lib/nexus/meeting-invites";
import { db } from "@saasfly/db-core";
import { nexusAuditEvents } from "@saasfly/db-core/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE: Deal → Meeting scheduling
 * ==============================================
 * Authority chain (all resolved server-side):
 *   Identity (Nexus session) → Capability (calendar.manage) → Resource scope (deal access)
 *   → Org/host resolved from the session, never from the body
 *   → Execution delegated to the canonical domain package `@saasfly/agenda-sdk`.
 *
 * The request body only proposes WHEN (and an optional deck reference). It never
 * proposes tenant, host or permissions — those are ignored if sent.
 *
 * The unlock-HMAC fallback (`?unlock=`) accepted by the read paths is intentionally
 * NOT honoured here: scheduling is a state-changing action that requires an
 * authenticated operator session (fail-closed).
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 240;
const DEFAULT_DURATION_MINUTES = 30;
const PAST_TOLERANCE_MS = 5 * 60 * 1000;
const HORIZON_DAYS = 365;

function fail(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, code, ...(extra ?? {}) }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Identity + capability (server-authoritative)
  const auth = await getNexusAuthContext(request.headers);
  if (!auth.isAuthenticated) {
    return fail(401, "UNAUTHORIZED", "Sesión de Nexus requerida para agendar.");
  }
  if (!checkNexusPermission(auth, "calendar.manage")) {
    return fail(403, "MISSING_CALENDAR_MANAGE", "Tu identidad no tiene la capability calendar.manage.");
  }

  // 2. Payload validation (client proposes; server decides)
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "INVALID_BODY", "El cuerpo de la petición no es JSON válido.");
  }

  const rawScheduledFor = body.scheduledFor ?? body.startsAt;
  const startsAt = new Date(String(rawScheduledFor ?? ""));
  if (!rawScheduledFor || Number.isNaN(startsAt.getTime())) {
    return fail(400, "INVALID_SCHEDULED_FOR", "scheduledFor debe ser una fecha ISO válida.");
  }

  const now = Date.now();
  if (startsAt.getTime() < now - PAST_TOLERANCE_MS) {
    return fail(400, "SCHEDULED_FOR_IN_PAST", "La fecha de inicio ya pasó.");
  }
  const horizon = now + HORIZON_DAYS * 24 * 60 * 60 * 1000;
  if (startsAt.getTime() > horizon) {
    return fail(400, "SCHEDULED_FOR_OUT_OF_HORIZON", `La fecha excede el horizonte de ${HORIZON_DAYS} días.`);
  }

  const rawDuration = body.durationMinutes ?? DEFAULT_DURATION_MINUTES;
  const durationMinutes = Number(rawDuration);
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < MIN_DURATION_MINUTES ||
    durationMinutes > MAX_DURATION_MINUTES
  ) {
    return fail(
      400,
      "INVALID_DURATION",
      `durationMinutes debe ser un entero entre ${MIN_DURATION_MINUTES} y ${MAX_DURATION_MINUTES}.`
    );
  }

  // The body may PROPOSE a deck, but only as a fallback: the deal's own deck wins.
  const rawDeckFromBody =
    body.presentationId !== undefined && body.presentationId !== null && body.presentationId !== ""
      ? String(body.presentationId).trim()
      : null;
  if (rawDeckFromBody && !isKnownPresentation(rawDeckFromBody)) {
    return fail(400, "INVALID_PRESENTATION_ID", "presentationId no existe en el catálogo de presentaciones.");
  }

  // 3. Resource scope: the deal must be reachable by this identity
  // The path segment may be the room UUID or its public id (PDR-...). The id column is a
  // uuid, so a public id must NEVER be passed to getRoom() — Postgres would reject it.
  const roomIdParam = decodeURIComponent((await params).id);
  const room = UUID_PATTERN.test(roomIdParam)
    ? await getRoom(roomIdParam)
    : await getRoomByPublicId(roomIdParam);
  if (!room) {
    return fail(404, "DEAL_NOT_FOUND", "Deal Room no encontrada.");
  }

  const isSuperAdmin = auth.role === "SUPER_ADMIN";
  const userIdentifier = auth.wallet || auth.email || "";
  if (!canUserAccessDeal(room, userIdentifier, auth.email ?? undefined, isSuperAdmin)) {
    return fail(403, "DEAL_ACCESS_DENIED", "No tienes acceso a esta Deal Room.");
  }

  // 4. Host + tenant resolved from the session (never from the body)
  const hostCollaboratorId = auth.collaboratorId ?? null;
  if (!hostCollaboratorId) {
    return fail(
      409,
      "HOST_COLLABORATOR_UNRESOLVED",
      "Tu sesión no está vinculada a un colaborador de Nexus; no se puede asignar host a la reunión."
    );
  }
  const canonicalOrgId = auth.canonicalOrgId || "pandoras";

  // Deck: la fuente de verdad es el deal (server-side). El body solo si el deal no tiene deck.
  const dealDeck = (room as { presentationId?: string | null }).presentationId ?? null;
  const presentationId: string | null = dealDeck || rawDeckFromBody;

  const participantEmails = Array.from(
    new Set(
      (room.signers ?? [])
        .map((signer: { email?: string | null }) => (signer.email ?? "").trim().toLowerCase())
        .filter(Boolean)
    )
  );

  // 5. Execution through the canonical agenda domain
  let meeting: Awaited<ReturnType<typeof AgendaCore.createMeeting>>;
  try {
    meeting = await AgendaCore.createMeeting({
      canonicalOrgId,
      hostCollaboratorId,
      presentationId,
      scheduledFor: startsAt,
      durationMinutes,
      collaborators: participantEmails,
    });
  } catch (error) {
    console.error("[DealSchedule] AgendaCore error:", error);
    return fail(500, "MEETING_CREATION_FAILED", "No se pudo crear la reunión.");
  }

  // 6. Invitaciones (side effect reportado con números reales, nunca fingidos)
  const baseUrl = defaultAppBaseUrl();
  const joinUrl = `${baseUrl}/meet/${meeting.id}`;
  const dealRoomUrl = `${baseUrl}/deal/${room.publicId}`;

  // Cada invitado recibe su link personal (?p=<joinToken>): es lo que registra asistencia.
  const joinTokenByEmail = new Map<string, string>(
    (meeting.participants ?? []).map((participant) => [
      participant.identityId.toLowerCase(),
      participant.joinToken,
    ])
  );

  const invites = await sendMeetingInvites({
    meetingId: meeting.id,
    startsAt,
    endsAt: meeting.endsAt,
    deckSlug: presentationId,
    recipients: participantEmails.map((email) => ({
      email,
      joinToken: joinTokenByEmail.get(email) ?? null,
    })),
    baseUrl,
    counterparty: room.counterparty,
    dealRoomUrl,
  });

  // 7. Audit (explicit status — never reported as recorded when it is not)
  let audit: "RECORDED" | "FAILED" = "RECORDED";
  try {
    await db.insert(nexusAuditEvents).values({
      canonicalOrgId,
      actorIdentityId: hostCollaboratorId,
      eventType: "MEETING_SCHEDULED",
      resourceType: "meeting",
      resourceId: meeting.id,
      action: "CREATE",
      newState: {
        dealRoomId: room.id,
        dealPublicId: room.publicId,
        scheduledFor: meeting.scheduledFor,
        endsAt: meeting.endsAt,
        presentationId,
        participants: participantEmails,
        invitesSent: invites.sent,
        invitesFailed: invites.failed,
      },
      result: "SUCCESS",
    });
  } catch (error) {
    audit = "FAILED";
    console.error("[DealSchedule] Audit write failed:", error);
  }

  return NextResponse.json(
    {
      meetingId: meeting.id,
      jitsiRoomId: meeting.jitsiRoomId,
      scheduledFor: meeting.scheduledFor,
      endsAt: meeting.endsAt,
      presentationId,
      participants: participantEmails.length,
      joinUrl,
      dealRoomUrl: `/deal/${room.publicId}`,
      agendaUrl: "/nexus/agenda",
      invites,
      audit,
    },
    { status: 201 }
  );
}
