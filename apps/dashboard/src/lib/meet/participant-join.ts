import { db } from "@saasfly/db-core";
import { meetingParticipants } from "@saasfly/db-core";
import { and, eq } from "@saasfly/db-core";

/**
 * 🏛️ ARCHITECTURE NOTE: Asistencia de invitados (Sovereign Meet)
 * ============================================================
 * El email de invitación lleva un link personal:
 *   /meet/<meetingId>?p=<joinToken>
 *
 * Ese token (32 hex, aleatorio, único por participante) es lo que permite saber
 * QUIÉN entró, sin pedirle cuenta ni exponer su email en la URL. El primer acceso
 * marca `joined_at` (idempotente); el registro vive en `meeting_participants`.
 *
 * Consecuencia aguas abajo: el seguimiento post-presentación puede dirigirse a los
 * asistentes reales en vez de a toda la lista de invitados.
 */

const TOKEN_PATTERN = /^[a-f0-9]{32}$/;

export interface ParticipantJoin {
  participantId: string;
  /** Identidad registrada del participante (email en el flujo de Deal Room) */
  identityId: string | null;
  alreadyJoined: boolean;
}

export async function resolveParticipantJoin(
  meetingId: string,
  token: string | null | undefined
): Promise<ParticipantJoin | null> {
  if (!token || !TOKEN_PATTERN.test(token)) return null;

  const rows = await db
    .select({
      id: meetingParticipants.id,
      identityId: meetingParticipants.identityId,
      joinedAt: meetingParticipants.joinedAt,
    })
    .from(meetingParticipants)
    .where(
      and(
        eq(meetingParticipants.meetingId, meetingId),
        eq(meetingParticipants.joinToken, token)
      )
    )
    .limit(1);

  const participant = rows[0];
  if (!participant) return null;

  const alreadyJoined = Boolean(participant.joinedAt);
  if (!alreadyJoined) {
    await db
      .update(meetingParticipants)
      .set({ joinedAt: new Date() })
      .where(eq(meetingParticipants.id, participant.id));
  }

  return {
    participantId: participant.id,
    identityId: participant.identityId ?? null,
    alreadyJoined,
  };
}
