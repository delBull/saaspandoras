import { NextRequest, NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { meetings } from "@saasfly/db-core";
import { and, eq } from "@saasfly/db-core";
import { isMeetingHost, resolveRoomActor } from "@/lib/meet/room-credentials";
import { sendMeetingSummaryFollowUp } from "@/lib/nexus/agenda-followups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 🏛️ ARCHITECTURE NOTE — Enviar resumen/manual a participantes
 * ============================================================
 * `POST /api/v1/meet/follow-up` { meetingId, ref? }
 *
 * Acción explícita del host: envía resumen + tareas a los asistentes que aún no
 * recibieron el resumen (`summary_sent_at IS NULL`). No depende de
 * `meetings.follow_up_enabled` (ese flag solo controla el correo de cortesía
 * automático al finalizar).
 *
 * Autoridad: host por sesión o por `ref` firmado; admins de operaciones también.
 */
const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "ADMIN_OPERATIONS"]);

export async function POST(req: NextRequest) {
  let body: { meetingId?: unknown; ref?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido", code: "INVALID_BODY" }, { status: 400 });
  }

  const meetingId = typeof body.meetingId === "string" ? body.meetingId : "";
  if (!meetingId) {
    return NextResponse.json({ error: "meetingId es requerido", code: "MISSING_MEETING_ID" }, { status: 400 });
  }

  try {
    const { actor, error } = await resolveRoomActor(req.headers, body.ref, meetingId);
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

    const sessionAuth = await getNexusAuthContext();
    const isAdmin =
      sessionAuth.isAuthenticated && ADMIN_ROLES.has(String(sessionAuth.role ?? ""));
    const isHost = isMeetingHost(meeting, actor.actorCollaboratorId);

    if (!isHost && !isAdmin) {
      return NextResponse.json(
        { error: "Solo el anfitrión puede enviar el resumen.", code: "HOST_ONLY" },
        { status: 403 }
      );
    }

    if (meeting.status !== "ended") {
      return NextResponse.json(
        { error: "La reunión aún no ha terminado.", code: "MEETING_NOT_ENDED" },
        { status: 409 }
      );
    }

    if (!meeting.aiSummary?.trim()) {
      return NextResponse.json(
        { error: "Aún no hay resumen. Procesa el audio de la reunión primero.", code: "NO_SUMMARY" },
        { status: 409 }
      );
    }

    const result = await sendMeetingSummaryFollowUp(meeting.id);

    return NextResponse.json({
      ok: true,
      meetingId: meeting.id,
      ...result,
    });
  } catch (error) {
    console.error("[MeetSummaryFollowUp] error:", error);
    return NextResponse.json({ error: "Error interno al enviar el resumen.", code: "INTERNAL" }, { status: 500 });
  }
}
