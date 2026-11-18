import jwt from "jsonwebtoken";
import { getNexusAuthContext } from "@saasfly/shared";

/**
 * 🏛️ ARCHITECTURE NOTE: Credenciales de sala (Sovereign Meet)
 * =========================================================
 * Mecanismo único para resolver QUIÉN actúa dentro de una sala, sin confiar en
 * identificadores enviados por el cliente.
 *
 * Dos credenciales aceptadas, ambas verificadas en servidor:
 *   1. Sesión Nexus autenticada (cookies/headers) + `ref` para identificar la sala.
 *   2. `ref` = joinRef HS256 emitido por el servidor (agenda, meet/[meetingId], TMA).
 *
 * El `ref` solo aporta meetingId/orgId/collaboratorId firmados. Nunca se acepta un
 * collaboratorId del body.
 */

export interface RoomActor {
  meetingId: string;
  orgId: string | null;
  /** Identidad que actúa (id de colaborador, o `guest:<meetingId>` para invitados) */
  actorCollaboratorId: string;
  via: "session" | "joinRef";
}

export interface JoinRefClaims {
  meetingId: string;
  collaboratorId: string | number;
  orgId: string;
}

export type RoomActorError = {
  status: number;
  code: string;
  message: string;
};

function verifyJoinRef(ref: string, secret: string): JoinRefClaims | null {
  try {
    return jwt.verify(ref, secret, { algorithms: ["HS256"] }) as JoinRefClaims;
  } catch {
    return null;
  }
}

export async function resolveRoomActor(
  headers: Headers,
  ref: unknown,
  meetingIdFromBody?: unknown
): Promise<{ actor?: RoomActor; error?: RoomActorError }> {
  const secret = process.env.MEET_JOIN_SECRET;
  const refValue = typeof ref === "string" && ref.length > 0 ? ref : null;
  const bodyMeetingId =
    typeof meetingIdFromBody === "string" && /^[0-9a-fA-F-]{36}$/.test(meetingIdFromBody)
      ? meetingIdFromBody
      : null;

  const auth = await getNexusAuthContext(headers);

  if (auth.isAuthenticated && auth.collaboratorId) {
    // Con sesión Nexus la reunión puede identificarse por el body: la autorización
    // real es la relación host↔meeting verificada después contra la DB. El `ref`,
    // si viene, se usa como fuente preferente (nunca como única prueba).
    const claims = refValue && secret ? verifyJoinRef(refValue, secret) : null;
    const meetingId = claims?.meetingId ?? bodyMeetingId;
    if (!meetingId) {
      return { error: { status: 400, code: "MISSING_MEETING_REFERENCE", message: "Falta meetingId o referencia de sala" } };
    }
    return {
      actor: {
        meetingId,
        orgId: claims?.orgId ?? auth.canonicalOrgId ?? null,
        actorCollaboratorId: String(auth.collaboratorId),
        via: "session",
      },
    };
  }

  if (!refValue || !secret) {
    return { error: { status: 401, code: "UNAUTHORIZED", message: "No autorizado" } };
  }
  const claims = verifyJoinRef(refValue, secret);
  if (!claims) {
    return { error: { status: 403, code: "INVALID_JOIN_REF", message: "Referencia de sala inválida o expirada" } };
  }
  return {
    actor: {
      meetingId: claims.meetingId,
      orgId: claims.orgId ?? null,
      actorCollaboratorId: String(claims.collaboratorId),
      via: "joinRef",
    },
  };
}

/** ¿La identidad que actúa es el host de la reunión? */
export function isMeetingHost(
  meeting: { hostCollaboratorId: number | null },
  actorCollaboratorId: string
): boolean {
  return meeting.hostCollaboratorId !== null && String(meeting.hostCollaboratorId) === actorCollaboratorId;
}
