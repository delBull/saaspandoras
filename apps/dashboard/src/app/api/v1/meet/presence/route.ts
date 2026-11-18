import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { meetingPresenceSessions, meetings } from "@saasfly/db-core";
import { and, desc, eq, isNull } from "@saasfly/db-core";
import { resolveRoomActor } from "@/lib/meet/room-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE: Permanencia real en la sala
 * =================================================
 * `POST /api/v1/meet/presence` — el cliente que está DENTRO de la sala reporta:
 *   { meetingId | ref, event: 'join' | 'heartbeat' | 'leave' }
 *
 * Se guardan sesiones con `joined_at`, `last_seen_at` y `left_at`, y la duración se
 * calcula server-side. El seguimiento usa esa duración (no solo "abrió el link").
 *
 * Límite honesto y explícito: la evidencia es del CLIENTE, no del proveedor de video.
 * El modelo ya soporta `source = 'provider-webhook'` para cuando se conecte el webhook
 * de JaaS: mismo endpoint, misma tabla, misma agregación.
 */

const MIN_SESSION_REUSE_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: { meetingId?: unknown; ref?: unknown; event?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body inválido", code: "INVALID_BODY" }, { status: 400 });
  }

  const event = body.event === "join" || body.event === "leave" ? body.event : "heartbeat";

  try {
    const { actor, error } = await resolveRoomActor(req.headers, body.ref, body.meetingId);
    if (error || !actor) {
      const failure = error ?? { status: 401, code: "UNAUTHORIZED", message: "No autorizado" };
      return NextResponse.json({ error: failure.message, code: failure.code }, { status: failure.status });
    }

    const [meeting] = await db
      .select({ id: meetings.id, status: meetings.status })
      .from(meetings)
      .where(eq(meetings.id, actor.meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }
    if (meeting.status === "cancelled") {
      return NextResponse.json({ error: "La reunión fue cancelada", code: "MEETING_CANCELLED" }, { status: 409 });
    }

    const identity = actor.participantId
      ? `participant:${actor.participantId}`
      : actor.via === "session"
      ? `collaborator:${actor.actorCollaboratorId}`
      : actor.actorCollaboratorId;

    const now = new Date();

    // Sesión abierta más reciente para esta identidad en esta reunión
    const [openSession] = await db
      .select()
      .from(meetingPresenceSessions)
      .where(
        and(
          eq(meetingPresenceSessions.meetingId, actor.meetingId),
          eq(meetingPresenceSessions.identity, identity),
          isNull(meetingPresenceSessions.leftAt)
        )
      )
      .orderBy(desc(meetingPresenceSessions.joinedAt))
      .limit(1);

    const isStale =
      openSession && now.getTime() - new Date(openSession.lastSeenAt).getTime() > MIN_SESSION_REUSE_MS;

    if (event === "leave") {
      if (!openSession) {
        return NextResponse.json({ ok: true, closed: false, attendanceSeconds: 0 });
      }
      await db
        .update(meetingPresenceSessions)
        .set({ lastSeenAt: now, leftAt: now })
        .where(eq(meetingPresenceSessions.id, openSession.id));

      return NextResponse.json({
        ok: true,
        closed: true,
        attendanceSeconds: Math.max(
          0,
          Math.round((now.getTime() - new Date(openSession.joinedAt).getTime()) / 1000)
        ),
      });
    }

    if (openSession && !isStale) {
      await db
        .update(meetingPresenceSessions)
        .set({ lastSeenAt: now })
        .where(eq(meetingPresenceSessions.id, openSession.id));

      return NextResponse.json({
        ok: true,
        sessionId: openSession.id,
        joined: false,
        attendanceSeconds: Math.max(
          0,
          Math.round((now.getTime() - new Date(openSession.joinedAt).getTime()) / 1000)
        ),
      });
    }

    const [created] = await db
      .insert(meetingPresenceSessions)
      .values({
        meetingId: actor.meetingId,
        participantId: actor.participantId,
        identity,
        joinedAt: now,
        lastSeenAt: now,
        source: "client",
      })
      .returning({ id: meetingPresenceSessions.id });

    return NextResponse.json({ ok: true, sessionId: created?.id ?? null, joined: true, attendanceSeconds: 0 });
  } catch (error) {
    console.error("[MeetPresence] error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}
