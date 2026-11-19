import { db } from "@saasfly/db";
import { meetings, meetingPresenceSessions } from "@saasfly/db/schema";
import { and, eq, inArray, isNull } from "@saasfly/db-core";

/**
 * 🧹 Reaper de reuniones `live` colgadas.
 *
 * Una Meet Inmediata nace `live` y no tiene `endsAt`. Si el host cierra la pestaña
 * sin pulsar Finalizar (o el beacon de salida no llega), la reunión se queda `live`
 * para siempre: aparece en “Ahora”, se puede “Iniciar” y consume atención/consultas.
 *
 * Reglas:
 *   - `live` con `endsAt` → stale si terminó hace más de 30 min.
 *   - `live` sin `endsAt` → stale si empezó hace más de 2 h.
 *   - Al reap: `ended`, `followUpEnabled = false` (no dispara correos por sorpresa)
 *     y cierra las sesiones de presencia abiertas.
 *
 * No borra nada: el host puede archivar la reunión desde “Anteriores”.
 */
const NO_END_STALE_MS = 2 * 60 * 60 * 1000;
const END_GRACE_MS = 30 * 60 * 1000;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isStaleLiveMeeting(
  meeting: {
    status?: string | null;
    startsAt?: Date | string | null;
    endsAt?: Date | string | null;
  },
  now: Date = new Date()
): boolean {
  if (meeting.status !== "live") return false;

  const endsAt = toDate(meeting.endsAt);
  if (endsAt) {
    return endsAt.getTime() < now.getTime() - END_GRACE_MS;
  }

  const startsAt = toDate(meeting.startsAt);
  if (!startsAt) return false;
  return startsAt.getTime() < now.getTime() - NO_END_STALE_MS;
}

export async function reapStaleLiveMeetings(
  now: Date = new Date()
): Promise<{ reaped: number }> {
  const live = await db
    .select({
      id: meetings.id,
      status: meetings.status,
      startsAt: meetings.startsAt,
      endsAt: meetings.endsAt,
    })
    .from(meetings)
    .where(eq(meetings.status, "live"));

  const staleIds = live
    .filter((meeting) => isStaleLiveMeeting(meeting, now))
    .map((meeting) => meeting.id);

  if (staleIds.length === 0) return { reaped: 0 };

  await db.transaction(async (tx) => {
    await tx
      .update(meetings)
      .set({
        status: "ended",
        endedAt: now,
        updatedAt: now,
        // No mandar el correo de cortesía por un cierre automático.
        followUpEnabled: false,
      })
      .where(inArray(meetings.id, staleIds));

    await tx
      .update(meetingPresenceSessions)
      .set({ leftAt: now })
      .where(
        and(
          inArray(meetingPresenceSessions.meetingId, staleIds),
          isNull(meetingPresenceSessions.leftAt)
        )
      );
  });

  console.log(`[MeetingReaper] Reuniones live cerradas: ${staleIds.join(", ")}`);
  return { reaped: staleIds.length };
}
