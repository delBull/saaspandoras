import crypto from "crypto";
import { db } from "@saasfly/db";
import {
  meetings,
  meetingParticipants,
  meetingPresentationState,
  nexusAuditEvents,
} from "@saasfly/db/schema";
import { and, eq, inArray } from "@saasfly/db-core";
import type { NexusAuthContext } from "@saasfly/shared";
import { MeetingPolicy } from "@/lib/nexus/meeting-domain";
import { findPresentation, isKnownPresentation } from "@/lib/nexus/presentations-catalog";
import { defaultAppBaseUrl, sendMeetingInvites, type InviteResult } from "@/lib/nexus/meeting-invites";

export interface UpdateScheduledMeetingInput {
  scheduledFor?: string | null;
  durationMinutes?: number | null;
  title?: string | null;
  presentationId?: string | null;
  participants?: string[] | null;
  notify?: boolean;
}

export interface UpdatedMeetingView {
  id: string;
  title: string | null;
  startsAt: string | null;
  endsAt: string | null;
  presentationId: string | null;
  status: string;
}

export type UpdateScheduledMeetingResult =
  | {
      success: true;
      meeting: UpdatedMeetingView;
      participants: Array<{ id: string; email: string | null; identityId: string | null; joinToken: string | null }>;
      invites?: InviteResult;
    }
  | { success: false; status: number; code: string; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PARTICIPANTS = 20;
const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 240;
const PAST_TOLERANCE_MS = 5 * 60 * 1000;
const MAX_TITLE_LENGTH = 160;

function fail(status: number, code: string, error: string): UpdateScheduledMeetingResult {
  return { success: false, status, code, error };
}

export async function updateScheduledMeeting(
  meetingId: string,
  authCtx: NexusAuthContext,
  input: UpdateScheduledMeetingInput
): Promise<UpdateScheduledMeetingResult> {
  if (!authCtx.isAuthenticated || !authCtx.collaboratorId || !authCtx.canonicalOrgId) {
    return fail(401, "UNAUTHORIZED", "Sesión de Nexus requerida.");
  }
  const orgId = authCtx.canonicalOrgId;

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(and(eq(meetings.id, meetingId), eq(meetings.canonicalOrgId, orgId)))
    .limit(1);

  if (!meeting) return fail(404, "MEETING_NOT_FOUND", "Reunión no encontrada.");
  if (!MeetingPolicy.canEdit(meeting, authCtx)) {
    return fail(403, "MEETING_NOT_EDITABLE", "Solo el host puede editar una reunión programada.");
  }

  const existingStart = meeting.startsAt ? new Date(meeting.startsAt) : null;
  const existingEnd = meeting.endsAt ? new Date(meeting.endsAt) : null;
  const existingDuration =
    existingStart && existingEnd
      ? Math.max(Math.round((existingEnd.getTime() - existingStart.getTime()) / 60_000), MIN_DURATION_MINUTES)
      : 30;

  // 1. Fecha/hora
  const start = input.scheduledFor ? new Date(input.scheduledFor) : existingStart;
  if (!start || Number.isNaN(start.getTime())) {
    return fail(400, "INVALID_SCHEDULED_FOR", "La fecha de inicio no es válida.");
  }
  if (start.getTime() < Date.now() - PAST_TOLERANCE_MS) {
    return fail(400, "SCHEDULED_FOR_IN_PAST", "La nueva fecha ya pasó.");
  }

  const duration =
    input.durationMinutes === undefined || input.durationMinutes === null
      ? existingDuration
      : Number(input.durationMinutes);
  if (
    !Number.isInteger(duration) ||
    duration < MIN_DURATION_MINUTES ||
    duration > MAX_DURATION_MINUTES
  ) {
    return fail(
      400,
      "INVALID_DURATION",
      `La duración debe estar entre ${MIN_DURATION_MINUTES} y ${MAX_DURATION_MINUTES} minutos.`
    );
  }
  const end = new Date(start.getTime() + duration * 60_000);

  // 2. Título
  let title = meeting.title;
  if (input.title !== undefined) {
    const raw = typeof input.title === "string" ? input.title.trim() : "";
    if (raw.length > MAX_TITLE_LENGTH) {
      return fail(400, "TITLE_TOO_LONG", `El asunto no puede exceder ${MAX_TITLE_LENGTH} caracteres.`);
    }
    title = raw || null;
  }

  // 3. Deck
  let presentationId = meeting.presentationId;
  if (input.presentationId !== undefined) {
    if (input.presentationId === null || input.presentationId === "") {
      presentationId = null;
    } else {
      const candidate = String(input.presentationId).trim();
      if (!isKnownPresentation(candidate)) {
        return fail(400, "INVALID_PRESENTATION_ID", "Ese deck no existe en el catálogo.");
      }
      presentationId = candidate;
    }
  }

  // 4. Participantes (si vienen; si no, se conservan)
  const existingParticipants = await db
    .select()
    .from(meetingParticipants)
    .where(eq(meetingParticipants.meetingId, meeting.id));

  let requestedEmails: string[] | null = null;
  if (input.participants !== null && input.participants !== undefined) {
    if (!Array.isArray(input.participants)) {
      return fail(400, "INVALID_PARTICIPANTS", "participants debe ser una lista de emails.");
    }
    requestedEmails = Array.from(
      new Set(
        input.participants
          .map((value) => String(value ?? "").trim().toLowerCase())
          .filter(Boolean)
      )
    );
    if (requestedEmails.length > MAX_PARTICIPANTS) {
      return fail(400, "TOO_MANY_PARTICIPANTS", `Máximo ${MAX_PARTICIPANTS} participantes.`);
    }
    const invalid = requestedEmails.filter((email) => !EMAIL_PATTERN.test(email));
    if (invalid.length > 0) {
      return fail(400, "INVALID_PARTICIPANT_EMAIL", `Emails inválidos: ${invalid.join(", ")}`);
    }
  }

  const existingEmails = new Set(
    existingParticipants
      .map((p) => (p.email || p.identityId || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const toAdd = requestedEmails ? requestedEmails.filter((email) => !existingEmails.has(email)) : [];
  const toRemove = requestedEmails
    ? existingParticipants.filter((p) => {
        const key = (p.email || p.identityId || "").trim().toLowerCase();
        return key && !requestedEmails.includes(key) && !p.joinedAt;
      })
    : [];

  const startChanged = !existingStart || existingStart.getTime() !== start.getTime();
  const endChanged = !existingEnd || existingEnd.getTime() !== end.getTime();
  const titleChanged = title !== meeting.title;
  const deckChanged = presentationId !== meeting.presentationId;
  const participantsChanged = toAdd.length > 0 || toRemove.length > 0;
  const changed = startChanged || endChanged || titleChanged || deckChanged || participantsChanged;

  // 5. Persistir
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(meetings)
        .set({
          startsAt: start,
          endsAt: end,
          title,
          presentationId,
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, meeting.id));

      if (toRemove.length > 0) {
        await tx
          .delete(meetingParticipants)
          .where(inArray(meetingParticipants.id, toRemove.map((p) => p.id)));
      }

      if (toAdd.length > 0) {
        await tx.insert(meetingParticipants).values(
          toAdd.map((email) => ({
            id: crypto.randomUUID(),
            meetingId: meeting.id,
            identityId: email,
            email,
            joinToken: crypto.randomBytes(16).toString("hex"),
            participantType: "anonymous_guest" as const,
            role: "guest" as const,
            followUpStatus: "pending" as const,
          }))
        );
      }

      // Si cambia el horario, los recordatorios 24h/1h deben volver a correr.
      if (startChanged) {
        await tx
          .update(meetingParticipants)
          .set({ reminder24hSentAt: null, reminder1hSentAt: null })
          .where(eq(meetingParticipants.meetingId, meeting.id));
      }

      // Si cambia el deck, el estado de presentación viejo no aplica.
      if (deckChanged) {
        await tx
          .delete(meetingPresentationState)
          .where(eq(meetingPresentationState.meetingId, meeting.id));
      }

      await tx.insert(nexusAuditEvents).values({
        canonicalOrgId: orgId,
        actorIdentityId: authCtx.collaboratorId!,
        eventType: "MEETING_UPDATED",
        resourceType: "meeting",
        resourceId: meeting.id,
        action: "UPDATE",
        newState: {
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          title,
          presentationId,
          participants: requestedEmails?.length ?? existingParticipants.length,
        },
        result: "SUCCESS",
      });
    });
  } catch (error) {
    console.error("[MeetingEdit] update error:", error);
    return fail(500, "UPDATE_FAILED", "No se pudo actualizar la reunión.");
  }

  const finalParticipants = await db
    .select({
      id: meetingParticipants.id,
      email: meetingParticipants.email,
      identityId: meetingParticipants.identityId,
      joinToken: meetingParticipants.joinToken,
    })
    .from(meetingParticipants)
    .where(eq(meetingParticipants.meetingId, meeting.id));

  let invites: InviteResult | undefined;
  if (input.notify !== false && changed) {
    const counterparty =
      title ||
      findPresentation(presentationId)?.title ||
      "Pandora's · Sovereign Meet";

    invites = await sendMeetingInvites({
      meetingId: meeting.id,
      startsAt: start,
      endsAt: end.toISOString(),
      deckSlug: presentationId,
      recipients: finalParticipants
        .map((p) => ({
          email: (p.email || p.identityId || "").trim().toLowerCase(),
          joinToken: p.joinToken,
        }))
        .filter((p) => EMAIL_PATTERN.test(p.email)),
      baseUrl: defaultAppBaseUrl(),
      counterparty,
      kind: "update",
    });
  }

  return {
    success: true,
    meeting: {
      id: meeting.id,
      title,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      presentationId,
      status: meeting.status,
    },
    participants: finalParticipants,
    invites,
  };
}
