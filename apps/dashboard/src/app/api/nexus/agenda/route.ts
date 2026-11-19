import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { eq, and, or, inArray, sql } from "@saasfly/db-core";
import { meetings, meetingParticipants, meetingPresenceSessions, nexusCollaborators } from "@saasfly/db-core/schema";
import { shortMeetingPath } from "@/lib/meet/meeting-links";

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

    // Fuente de verdad del tenant: la fila del colaborador. Si el contexto no la
    // trae (magic link sin proyectos), se resuelve aquí antes de fallar.
    let canonicalOrgId = auth.canonicalOrgId;
    if (!canonicalOrgId) {
      const [collabOrg] = await db
        .select({ canonicalOrgId: nexusCollaborators.canonicalOrgId })
        .from(nexusCollaborators)
        .where(eq(nexusCollaborators.id, auth.collaboratorId))
        .limit(1);
      canonicalOrgId = collabOrg?.canonicalOrgId ?? null;
    }

    // 🛡️ Fail-closed: sin tenant canónico no se cae a "pandoras".
    if (!canonicalOrgId) {
      return NextResponse.json(
        { error: "Tu identidad no tiene una organización canónica resuelta.", code: "ORG_UNRESOLVED" },
        { status: 403 }
      );
    }
    const orgId = canonicalOrgId;
    const collaboratorId = auth.collaboratorId;
    const email = auth.email?.toLowerCase().trim() || null;

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

    // 2) Reuniones donde soy participante. `identity_id` guarda el email con el
    // que se invitó (AgendaCore), así que se compara por id y por email; nunca
    // se mezcla con el host, que se resuelve por `host_collaborator_id`.
    const participantConditions = [
      eq(meetingParticipants.identityId, String(collaboratorId)),
      ...(email ? [sql`lower(${meetingParticipants.identityId}) = ${email}`] : []),
    ];
    const participantRows = await db
      .select({
        meetingId: meetingParticipants.meetingId,
        joinToken: meetingParticipants.joinToken,
      })
      .from(meetingParticipants)
      .where(participantConditions.length > 1 ? or(...participantConditions) : participantConditions[0]);

    const participantMeetingIds = Array.from(new Set(participantRows.map((row) => row.meetingId)));
    const participantTokenByMeeting = new Map(
      participantRows.map((row) => [row.meetingId, row.joinToken] as const)
    );
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
      .map((row) => {
        const isHost = hosted.some((h) => h.id === row.id);
        return {
        id: row.id,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        status: row.status,
        presentationId: row.presentationId,
        hasDealRoom: Boolean(row.dealRoomId),
        role: isHost ? "host" : "participant",
        // El participante entra con SU token (?p=) para que la asistencia se
        // registre; el host entra con la sesión, que lo identifica por id.
        joinPath: shortMeetingPath(row.id, isHost ? null : participantTokenByMeeting.get(row.id) ?? null),
        attendance: {
          attended: attendedByMeeting.get(row.id) ?? 0,
          total: (participantsByMeeting.get(row.id) ?? []).length,
        },
        };
      });

    return NextResponse.json({ meetings: items, meta: { collaboratorId, orgId, total: items.length } });
  } catch (error) {
    console.error("[NexusAgenda] GET error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}
