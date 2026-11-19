import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { meetings, meetingPresenceSessions } from "@saasfly/db-core";
import { and, eq, gte, isNull } from "@saasfly/db-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE: “Esperando al anfitrión”
 * ============================================
 * `GET /api/v1/meet/host-presence?meetingId=…` responde si el host está **dentro** de
 * la sala (heartbeat de presencia fresco). Sirve para el aviso que ven los invitados
 * cuando entran antes que el anfitrión, como en Meet/Zoom.
 *
 * Limitación explícita: solo detecta al host que entró **autenticado** en Nexus (su
 * sesión de presencia se registra como `collaborator:<id>`). Si el host entra con un
 * enlace sin sesión, su identidad es `guest:<meetingId>` y no se distingue de un
 * invitado; en ese caso se devuelve `hostPresent: null` (desconocido) en lugar de
 * afirmar que no está. No es un control de acceso: es un aviso de UI.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FRESH_MS = 90_000; // el cliente late cada 30 s

export async function GET(req: NextRequest) {
  const meetingId = new URL(req.url).searchParams.get("meetingId");
  if (!meetingId || !UUID_PATTERN.test(meetingId)) {
    return NextResponse.json({ error: "meetingId inválido", code: "INVALID_MEETING_ID" }, { status: 400 });
  }

  try {
    const [meeting] = await db
      .select({
        id: meetings.id,
        hostCollaboratorId: meetings.hostCollaboratorId,
        status: meetings.status,
      })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }

    if (!meeting.hostCollaboratorId) {
      return NextResponse.json({ hostPresent: null, status: meeting.status });
    }

    const [session] = await db
      .select({ id: meetingPresenceSessions.id })
      .from(meetingPresenceSessions)
      .where(
        and(
          eq(meetingPresenceSessions.meetingId, meetingId),
          eq(meetingPresenceSessions.identity, `collaborator:${meeting.hostCollaboratorId}`),
          isNull(meetingPresenceSessions.leftAt),
          gte(meetingPresenceSessions.lastSeenAt, new Date(Date.now() - FRESH_MS))
        )
      )
      .limit(1);

    return NextResponse.json({
      hostPresent: Boolean(session),
      status: meeting.status,
      hostId: meeting.hostCollaboratorId,
    });
  } catch (error) {
    console.error("[MeetHostPresence] error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}
