import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { meetings } from "@saasfly/db-core";
import { and, eq } from "@saasfly/db-core";
import { isKnownPresentation } from "@/lib/nexus/presentations-catalog";
import { isMeetingHost, resolveRoomActor } from "@/lib/meet/room-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE: Presentación inyectada en Sovereign Meet
 * =============================================================
 * Estado compartido del deck dentro de la sala (host-controlled):
 *
 *   GET  /api/v1/meet/presentation?meetingId=<uuid>
 *     Lectura pública POR DISEÑO: devuelve solo { presentationId, open, slide }.
 *     El deck (`/pitch/<slug>`) es contenido público: no hay PII ni autoridad aquí.
 *     Se usa para que los participantes sigan el slide del host (polling corto).
 *
 *   POST /api/v1/meet/presentation   { ref, open?, slide? }
 *     Solo el HOST del meeting puede mutar el estado. La identidad se resuelve con
 *     `resolveRoomActor` (sesión Nexus o joinRef firmado), nunca del body.
 *
 * Persistencia: `meetings.presentation_open` / `meetings.presentation_slide`.
 */

const MAX_SLIDE_INDEX = 200;

function stateOf(meeting: {
  presentationId: string | null;
  presentationOpen: boolean;
  presentationSlide: number;
  status: string;
}) {
  return {
    presentationId: meeting.presentationId,
    open: meeting.presentationOpen,
    slide: meeting.presentationSlide,
    status: meeting.status,
  };
}

export async function GET(req: NextRequest) {
  const meetingId = new URL(req.url).searchParams.get("meetingId");
  if (!meetingId || !/^[0-9a-fA-F-]{36}$/.test(meetingId)) {
    return NextResponse.json({ error: "meetingId inválido", code: "INVALID_MEETING_ID" }, { status: 400 });
  }

  try {
    const [meeting] = await db
      .select({
        presentationId: meetings.presentationId,
        presentationOpen: meetings.presentationOpen,
        presentationSlide: meetings.presentationSlide,
        status: meetings.status,
      })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(stateOf(meeting));
  } catch (error) {
    console.error("[MeetPresentation] GET error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: { ref?: unknown; meetingId?: unknown; open?: unknown; slide?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido", code: "INVALID_BODY" }, { status: 400 });
  }

  const hasOpen = typeof body.open === "boolean";
  const hasSlide = body.slide !== undefined && body.slide !== null;
  if (!hasOpen && !hasSlide) {
    return NextResponse.json({ error: "Nada que actualizar", code: "NOTHING_TO_UPDATE" }, { status: 400 });
  }

  let slideIndex: number | null = null;
  if (hasSlide) {
    const parsed = Number(body.slide);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_SLIDE_INDEX) {
      return NextResponse.json({ error: "slide fuera de rango", code: "INVALID_SLIDE" }, { status: 400 });
    }
    slideIndex = parsed;
  }

  try {
    const { actor, error } = await resolveRoomActor(req.headers, body.ref, body.meetingId);
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
      return NextResponse.json(
        { error: "Solo el host controla la presentación", code: "HOST_ONLY" },
        { status: 403 }
      );
    }

    if (meeting.status === "cancelled" || meeting.status === "ended") {
      return NextResponse.json({ error: "La reunión no está activa", code: "MEETING_NOT_ACTIVE" }, { status: 409 });
    }

    if (!meeting.presentationId || !isKnownPresentation(meeting.presentationId)) {
      return NextResponse.json(
        { error: "Esta reunión no tiene una presentación válida asociada", code: "NO_PRESENTATION" },
        { status: 409 }
      );
    }

    const patch: Partial<typeof meetings.$inferInsert> = { updatedAt: new Date() };
    if (hasOpen) patch.presentationOpen = body.open as boolean;
    if (slideIndex !== null) patch.presentationSlide = slideIndex;

    const [updated] = await db
      .update(meetings)
      .set(patch)
      .where(eq(meetings.id, actor.meetingId))
      .returning({
        presentationId: meetings.presentationId,
        presentationOpen: meetings.presentationOpen,
        presentationSlide: meetings.presentationSlide,
        status: meetings.status,
      });

    if (!updated) {
      return NextResponse.json({ error: "No se pudo actualizar", code: "UPDATE_FAILED" }, { status: 500 });
    }

    return NextResponse.json(stateOf(updated));
  } catch (error) {
    console.error("[MeetPresentation] POST error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}
