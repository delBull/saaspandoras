import { describe, it, expect, vi, beforeEach } from "vitest";

let participantRow: any = null;
let updateCalls: any[] = [];

vi.mock("@saasfly/db-core", () => {
  const selectChain = {
    from: () => ({
      where: () => ({ limit: async () => (participantRow ? [participantRow] : []) }),
    }),
  };
  return {
    db: {
      select: () => selectChain,
      update: () => ({
        set: (patch: any) => {
          updateCalls.push(patch);
          return { where: async () => undefined };
        },
      }),
    },
    and: (...args: any[]) => args,
    eq: (...args: any[]) => args,
    meetingParticipants: { id: "id", meetingId: "meeting_id", joinToken: "join_token" },
  };
});

import { resolveParticipantJoin } from "../participant-join";

const MEETING_ID = "3f4b7c1e-0000-4000-8000-000000000001";
const TOKEN = "a".repeat(32);

describe("🎟️ Asistencia de invitados (joinToken)", () => {
  beforeEach(() => {
    updateCalls = [];
    participantRow = {
      id: "participant-1",
      identityId: "Socio@Celeste.com",
      joinedAt: null,
    };
  });

  it("ATT-01: el primer acceso marca joinedAt una sola vez", async () => {
    const first = await resolveParticipantJoin(MEETING_ID, TOKEN);

    expect(first).toEqual({
      participantId: "participant-1",
      identityId: "Socio@Celeste.com",
      alreadyJoined: false,
    });
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].joinedAt).toBeInstanceOf(Date);

    // Segundo acceso con la misma fila ya marcada: no vuelve a escribir.
    participantRow.joinedAt = new Date();
    const second = await resolveParticipantJoin(MEETING_ID, TOKEN);

    expect(second?.alreadyJoined).toBe(true);
    expect(updateCalls).toHaveLength(1);
  });

  it("ATT-02: un token con formato inválido no toca la base", async () => {
    expect(await resolveParticipantJoin(MEETING_ID, "no-es-token")).toBeNull();
    expect(await resolveParticipantJoin(MEETING_ID, null)).toBeNull();
    expect(await resolveParticipantJoin(MEETING_ID, "A".repeat(32))).toBeNull(); // mayúsculas fuera del alfabeto
    expect(updateCalls).toHaveLength(0);
  });

  it("ATT-03: un token válido que no pertenece a la reunión devuelve null sin escribir", async () => {
    participantRow = null;

    const result = await resolveParticipantJoin(MEETING_ID, TOKEN);

    expect(result).toBeNull();
    expect(updateCalls).toHaveLength(0);
  });
});
