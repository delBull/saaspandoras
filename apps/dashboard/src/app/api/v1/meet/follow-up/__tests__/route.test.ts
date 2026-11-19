import { describe, it, expect, vi, beforeEach } from "vitest";

let meetingRow: any = null;
let mockSessionAuth: any = { isAuthenticated: false, role: null };
let mockActorResult: any = null;
let summaryCalls: string[] = [];

vi.mock("@saasfly/shared", () => ({
  getNexusAuthContext: vi.fn(async () => mockSessionAuth),
}));

vi.mock("@/lib/meet/room-credentials", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/meet/room-credentials")>();
  return {
    ...actual,
    resolveRoomActor: vi.fn(async () => mockActorResult),
  };
});

vi.mock("@/lib/nexus/agenda-followups", () => ({
  sendMeetingSummaryFollowUp: vi.fn(async (meetingId: string) => {
    summaryCalls.push(meetingId);
    return { sent: 2, skipped: 0, failed: 0 };
  }),
}));

vi.mock("@saasfly/db-core", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (meetingRow ? [meetingRow] : []),
        }),
      }),
    }),
  },
  and: (...args: any[]) => args,
  eq: (...args: any[]) => args,
  meetings: { id: "id", canonicalOrgId: "canonical_org_id" },
}));

import { POST } from "../route";

const MEETING_ID = "3f4b7c1e-0000-4000-8000-000000000001";

function request(body: unknown = { meetingId: MEETING_ID, ref: "signed-ref" }) {
  return new Request("http://localhost/api/v1/meet/follow-up", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

describe("📬 Envío manual del resumen (/api/v1/meet/follow-up)", () => {
  beforeEach(() => {
    summaryCalls = [];
    mockSessionAuth = { isAuthenticated: false, role: null };
    mockActorResult = {
      actor: {
        meetingId: MEETING_ID,
        orgId: "pandoras",
        actorCollaboratorId: "7",
        participantId: null,
        via: "joinRef",
      },
    };
    meetingRow = {
      id: MEETING_ID,
      canonicalOrgId: "pandoras",
      hostCollaboratorId: 7,
      status: "ended",
      aiSummary: "Resumen de la sesión.",
    };
  });

  it("FUP-01: el host con enlace temporal envía el resumen", async () => {
    const res = await POST(request());

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.sent).toBe(2);
    expect(summaryCalls).toEqual([MEETING_ID]);
  });

  it("FUP-02: un participante no puede enviar el resumen", async () => {
    mockActorResult = {
      actor: {
        meetingId: MEETING_ID,
        orgId: "pandoras",
        actorCollaboratorId: "99",
        participantId: "p1",
        via: "joinRef",
      },
    };

    const res = await POST(request());

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("HOST_ONLY");
    expect(summaryCalls).toHaveLength(0);
  });

  it("FUP-03: no se puede enviar si la reunión no ha terminado", async () => {
    meetingRow.status = "live";

    const res = await POST(request());

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("MEETING_NOT_ENDED");
    expect(summaryCalls).toHaveLength(0);
  });

  it("FUP-04: no se puede enviar si aún no hay resumen", async () => {
    meetingRow.aiSummary = null;

    const res = await POST(request());

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("NO_SUMMARY");
    expect(summaryCalls).toHaveLength(0);
  });

  it("FUP-05: un admin de operaciones con sesión también puede enviar", async () => {
    mockSessionAuth = { isAuthenticated: true, role: "ADMIN_OPERATIONS", collaboratorId: 1 };
    mockActorResult = {
      actor: {
        meetingId: MEETING_ID,
        orgId: "pandoras",
        actorCollaboratorId: "1",
        participantId: null,
        via: "session",
      },
    };

    const res = await POST(request({ meetingId: MEETING_ID }));

    expect(res.status).toBe(200);
    expect(summaryCalls).toEqual([MEETING_ID]);
  });
});
