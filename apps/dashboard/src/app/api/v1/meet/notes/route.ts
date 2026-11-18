import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { meetings } from "@saasfly/db-core";
import { and, eq } from "@saasfly/db-core";
import { isMeetingHost, resolveRoomActor } from "@/lib/meet/room-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE: Guión contextual de la sesión
 * ==================================================
 * `meetings.presenter_notes` es el ajuste del guión para ESTA reunión (contexto de
 * la sesión anterior, objeciones conocidas, acuerdos previos). Complementa —no
 * reemplaza— el guión canónico del deck (`lib/nexus/presentations-catalog.ts`).
 *
 * Host-only en ambos verbos: las notas pueden contener información comercial
 * sensible, por lo que NO se exponen en el estado público de la presentación.
 */

const MAX_NOTES_LENGTH = 8000;

function resolveActor(req: NextRequest, body: { ref?: unknown; meetingId?: unknown }) {
  return resolveRoomActor(req.headers, body.ref, body.meetingId);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  try {
    const { actor, error } = await resolveActor(req, {
      ref: url.searchParams.get("ref"),
      meetingId: url.searchParams.get("meetingId"),
    });
    if (error || !actor) {
      const failure = error ?? { status: 401, code: "UNAUTHORIZED", message: "No autorizado" };
      return NextResponse.json({ error: failure.message, code: failure.code }, { status: failure.status });
    }

    const [meeting] = await db
      .select()
      .from(meetings)
      .where(
        actor.orgId
          ? and(eq(meetings.id, actor.meetingId), eq(meetings.canonicalOrgId, actor.orgId))
          : eq(meetings.id, actor.meetingId)
      )
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }
    if (!isMeetingHost(meeting, actor.actorCollaboratorId)) {
      return NextResponse.json({ error: "Solo el host", code: "HOST_ONLY" }, { status: 403 });
    }

    return NextResponse.json({ meetingId: meeting.id, notes: meeting.presenterNotes ?? "" });
  } catch (error) {
    console.error("[MeetNotes] GET error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: { ref?: unknown; meetingId?: unknown; notes?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido", code: "INVALID_BODY" }, { status: 400 });
  }

  if (typeof body.notes !== "string") {
    return NextResponse.json({ error: "notes debe ser texto", code: "INVALID_NOTES" }, { status: 400 });
  }
  if (body.notes.length > MAX_NOTES_LENGTH) {
    return NextResponse.json(
      { error: `notes excede ${MAX_NOTES_LENGTH} caracteres`, code: "NOTES_TOO_LONG" },
      { status: 413 }
    );
  }

  try {
    const { actor, error } = await resolveActor(req, body);
    if (error || !actor) {
      const failure = error ?? { status: 401, code: "UNAUTHORIZED", message: "No autorizado" };
      return NextResponse.json({ error: failure.message, code: failure.code }, { status: failure.status });
    }

    const [meeting] = await db
      .select()
      .from(meetings)
      .where(
        actor.orgId
          ? and(eq(meetings.id, actor.meetingId), eq(meetings.canonicalOrgId, actor.orgId))
          : eq(meetings.id, actor.meetingId)
      )
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }
    if (!isMeetingHost(meeting, actor.actorCollaboratorId)) {
      return NextResponse.json({ error: "Solo el host", code: "HOST_ONLY" }, { status: 403 });
    }

    const notes = body.notes.trim() === "" ? null : body.notes;
    const [updated] = await db
      .update(meetings)
      .set({ presenterNotes: notes, updatedAt: new Date() })
      .where(eq(meetings.id, meeting.id))
      .returning({ id: meetings.id, presenterNotes: meetings.presenterNotes });

    return NextResponse.json({ meetingId: updated?.id ?? meeting.id, notes: updated?.presenterNotes ?? "", saved: true });
  } catch (error) {
    console.error("[MeetNotes] POST error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}
