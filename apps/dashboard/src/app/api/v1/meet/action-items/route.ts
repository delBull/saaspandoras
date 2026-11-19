import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { meetings, meetingActionItems } from "@saasfly/db-core";
import { and, eq, asc } from "@saasfly/db-core";
import { isMeetingHost, resolveRoomActor } from "@/lib/meet/room-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE: Minuta de la sesión (host)
 * ===============================================
 * Zoom/Meet permiten anotar acuerdos y tareas durante la llamada. Aquí viven en
 * `meeting_action_items` (tabla canónica) y se pueden:
 *   - crear a mano por el host durante la sesión,
 *   - generar en bloque al procesar la grabación con Gemini
 *     (`/api/v1/internal/nexus/meets/process`, misma tabla).
 *
 * Autoridad: host únicamente, resuelto por `resolveRoomActor` (sesión o joinRef).
 */

const MAX_TASK_LENGTH = 500;

async function loadMeeting(actor: { meetingId: string; orgId: string | null }) {
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(
      actor.orgId
        ? and(eq(meetings.id, actor.meetingId), eq(meetings.canonicalOrgId, actor.orgId))
        : eq(meetings.id, actor.meetingId)
    )
    .limit(1);
  return meeting ?? null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  try {
    const { actor, error } = await resolveRoomActor(req.headers, url.searchParams.get("ref"), url.searchParams.get("meetingId"));
    if (error || !actor) {
      const failure = error ?? { status: 401, code: "UNAUTHORIZED", message: "No autorizado" };
      return NextResponse.json({ error: failure.message, code: failure.code }, { status: failure.status });
    }

    const meeting = await loadMeeting(actor);
    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }
    if (!isMeetingHost(meeting, actor.actorCollaboratorId)) {
      return NextResponse.json({ error: "Solo el host", code: "HOST_ONLY" }, { status: 403 });
    }

    const items = await db
      .select()
      .from(meetingActionItems)
      .where(eq(meetingActionItems.meetingId, meeting.id))
      .orderBy(asc(meetingActionItems.createdAt));

    return NextResponse.json({ meetingId: meeting.id, items });
  } catch (error) {
    console.error("[MeetActionItems] GET error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: { ref?: unknown; meetingId?: unknown; task?: unknown; assigneeName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido", code: "INVALID_BODY" }, { status: 400 });
  }

  const task = typeof body.task === "string" ? body.task.trim() : "";
  if (task.length < 3 || task.length > MAX_TASK_LENGTH) {
    return NextResponse.json(
      { error: `La tarea debe tener entre 3 y ${MAX_TASK_LENGTH} caracteres`, code: "INVALID_TASK" },
      { status: 400 }
    );
  }
  const assigneeName =
    typeof body.assigneeName === "string" && body.assigneeName.trim()
      ? body.assigneeName.trim().slice(0, 120)
      : null;

  try {
    const { actor, error } = await resolveRoomActor(req.headers, body.ref, body.meetingId);
    if (error || !actor) {
      const failure = error ?? { status: 401, code: "UNAUTHORIZED", message: "No autorizado" };
      return NextResponse.json({ error: failure.message, code: failure.code }, { status: failure.status });
    }

    const meeting = await loadMeeting(actor);
    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }
    if (!isMeetingHost(meeting, actor.actorCollaboratorId)) {
      return NextResponse.json({ error: "Solo el host", code: "HOST_ONLY" }, { status: 403 });
    }

    const [created] = await db
      .insert(meetingActionItems)
      .values({
        meetingId: meeting.id,
        canonicalOrgId: meeting.canonicalOrgId,
        task,
        assigneeName,
      })
      .returning();

    return NextResponse.json({ ok: true, item: created ?? null }, { status: 201 });
  } catch (error) {
    console.error("[MeetActionItems] POST error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}
