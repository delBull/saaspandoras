import { NextRequest, NextResponse } from "next/server";
import { checkNexusPermission, getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { meetings, meetingParticipants } from "@saasfly/db-core";
import { and, eq } from "@saasfly/db-core";
import { updateScheduledMeeting } from "@/lib/nexus/meeting-edit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Edición de una reunión PROGRAMADA (host).
 *
 * GET   → prefill del drawer: meeting + participantes (sin exponer joinToken).
 * PATCH → horario, duración, título, deck y participantes; notifica por email
 *         con ICS SEQUENCE=1 (mismo UID) para actualizar el calendario.
 *
 * Autoridad: sesión Nexus + calendar.manage + host de la reunión. Nunca se acepta
 * host ni org del body.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated || !auth.collaboratorId) {
    return NextResponse.json({ error: "Sesión de Nexus requerida.", code: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!checkNexusPermission(auth, "calendar.manage")) {
    return NextResponse.json(
      { error: "Tu identidad no tiene calendar.manage.", code: "MISSING_CALENDAR_MANAGE" },
      { status: 403 }
    );
  }

  if (!auth.canonicalOrgId) {
    return NextResponse.json(
      { error: "Tu identidad no tiene una organización canónica resuelta.", code: "ORG_UNRESOLVED" },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Falta meetingId.", code: "MISSING_MEETING_ID" }, { status: 400 });
  }

  try {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, id), eq(meetings.canonicalOrgId, auth.canonicalOrgId)))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada.", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }
    if (meeting.hostCollaboratorId !== auth.collaboratorId) {
      return NextResponse.json({ error: "Solo el host puede editarla.", code: "HOST_ONLY" }, { status: 403 });
    }

    const participants = await db
      .select({
        id: meetingParticipants.id,
        email: meetingParticipants.email,
        identityId: meetingParticipants.identityId,
        joinedAt: meetingParticipants.joinedAt,
      })
      .from(meetingParticipants)
      .where(eq(meetingParticipants.meetingId, meeting.id));

    return NextResponse.json({ meeting, participants });
  } catch (error) {
    console.error("[MeetingEdit] GET error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated || !auth.collaboratorId) {
    return NextResponse.json({ error: "Sesión de Nexus requerida.", code: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!checkNexusPermission(auth, "calendar.manage")) {
    return NextResponse.json(
      { error: "Tu identidad no tiene calendar.manage.", code: "MISSING_CALENDAR_MANAGE" },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Falta meetingId.", code: "MISSING_MEETING_ID" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body inválido.", code: "INVALID_BODY" }, { status: 400 });
  }

  try {
    const result = await updateScheduledMeeting(id, auth, {
      scheduledFor: typeof body.scheduledFor === "string" ? body.scheduledFor : undefined,
      durationMinutes:
        body.durationMinutes === undefined
          ? undefined
          : body.durationMinutes === null
            ? null
            : Number(body.durationMinutes),
      title: body.title === undefined ? undefined : body.title === null ? null : String(body.title),
      presentationId:
        body.presentationId === undefined
          ? undefined
          : body.presentationId === null
            ? null
            : String(body.presentationId),
      participants: Array.isArray(body.participants)
        ? body.participants.map((value) => String(value ?? ""))
        : body.participants === null
          ? null
          : undefined,
      notify: body.notify === undefined ? undefined : Boolean(body.notify),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[MeetingEdit] PATCH error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}
