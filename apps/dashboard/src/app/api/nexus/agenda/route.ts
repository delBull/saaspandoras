import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { eq, and, or, inArray } from "@saasfly/db-core";
import { meetings, meetingParticipants, meetingPresenceSessions } from "@saasfly/db-core/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE: Mis reuniones en Operations Hub
 * ====================================================
 * `GET /api/nexus/agenda` devuelve ÚNICAMENTE las reuniones del colaborador
 * autenticado (host o participante) en su organización. Es la superficie que faltaba:
 * antes la reunión agendada no aparecía en Operations Hub si el operador no era host.
 *
 * Autoridad: sesión de Nexus (server-side). Nunca se acepta collaboratorId del cliente.
 */
export async function GET(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated || !auth.collaboratorId) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const orgId = auth.canonicalOrgId ?? "pandoras";
    const collaboratorId = auth.collaboratorId;
    const email = auth.email?.toLowerCase() ?? null;

    // 1) Reuniones donde soy host
    const hosted = await db
      .select({
        id: meetings.id,
        startsAt: meetings.startsAt,
        endsAt: meetings.endsAt,
        status: meetings.status,
        presentationId: meetings.presentationId,
        dealRoomId: meetings.dealRoomId,
      })
      .from(meetings)
      .where(and(eq(meetings.canonicalOrgId, orgId), eq(meetings.hostCollaboratorId, collaboratorId)));

    // 2) Reuniones donde soy participante (por id de colaborador o por email)
    const participantConditions = [
      eq(meetingParticipants.identityId, String(collaboratorId)),
      ...(email ? [eq(meetingParticipants.email, email)] : []),
    ];
    const participantRows = await db
      .select({ meetingId: meetingParticipants.meetingId })
      .from(meetingParticipants)
      .where(participantConditions.length > 1 ? or(...participantConditions) : participantConditions[0]);

    const participantMeetingIds = Array.from(new Set(participantRows.map((row) => row.meetingId)));
    const invited =
      participantMeetingIds.length > 0
        ? await db
            .select({
              id: meetings.id,
              startsAt: meetings.startsAt,
              endsAt: meetings.endsAt,
              status: meetings.status,
              presentationId: meetings.presentationId,
              dealRoomId: meetings.dealRoomId,
            })
            .from(meetings)
            .where(
              and(
                eq(meetings.canonicalOrgId, orgId),
                inArray(meetings.id, participantMeetingIds)
              )
            )
        : [];

    // 3) Unir, filtrar (desde ayer en adelante) y ordenar
    const byId = new Map<string, (typeof hosted)[number]>();
    for (const row of [...hosted, ...invited]) byId.set(row.id, row);

    // Asistencia real: participantes con >= 60 s de permanencia en la sala.
    const meetingIds = Array.from(byId.keys());
    const participantsByMeeting = new Map<string, string[]>();
    const attendedByMeeting = new Map<string, number>();

    if (meetingIds.length > 0) {
      const participants = await db
        .select({ id: meetingParticipants.id, meetingId: meetingParticipants.meetingId })
        .from(meetingParticipants)
        .where(inArray(meetingParticipants.meetingId, meetingIds));

      for (const row of participants) {
        const list = participantsByMeeting.get(row.meetingId) ?? [];
        list.push(row.id);
        participantsByMeeting.set(row.meetingId, list);
      }

      const sessions = await db
        .select({
          meetingId: meetingPresenceSessions.meetingId,
          participantId: meetingPresenceSessions.participantId,
          joinedAt: meetingPresenceSessions.joinedAt,
          lastSeenAt: meetingPresenceSessions.lastSeenAt,
          leftAt: meetingPresenceSessions.leftAt,
        })
        .from(meetingPresenceSessions)
        .where(inArray(meetingPresenceSessions.meetingId, meetingIds));

      const secondsByParticipant = new Map<string, number>();
      for (const session of sessions) {
        if (!session.participantId) continue;
        const end = session.leftAt ?? session.lastSeenAt;
        const seconds = Math.max(
          0,
          Math.round((new Date(end).getTime() - new Date(session.joinedAt).getTime()) / 1000)
        );
        secondsByParticipant.set(
          session.participantId,
          (secondsByParticipant.get(session.participantId) ?? 0) + seconds
        );
      }

      for (const [meetingKey, ids] of participantsByMeeting) {
        attendedByMeeting.set(
          meetingKey,
          ids.filter((id) => (secondsByParticipant.get(id) ?? 0) >= 60).length
        );
      }
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime();
    const items = Array.from(byId.values())
      .filter((row) => {
        const start = row.startsAt ? new Date(row.startsAt).getTime() : 0;
        return start >= cutoff || row.status === "live";
      })
      .sort((a, b) => {
        const aTime = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const bTime = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        return aTime - bTime;
      })
      .map((row) => ({
        id: row.id,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        status: row.status,
        presentationId: row.presentationId,
        hasDealRoom: Boolean(row.dealRoomId),
        role: hosted.some((h) => h.id === row.id) ? "host" : "participant",
        joinPath: `/meet/${row.id}`,
        attendance: {
          attended: attendedByMeeting.get(row.id) ?? 0,
          total: (participantsByMeeting.get(row.id) ?? []).length,
        },
      }));

    return NextResponse.json({ meetings: items, meta: { collaboratorId, orgId, total: items.length } });
  } catch (error) {
    console.error("[NexusAgenda] GET error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}
