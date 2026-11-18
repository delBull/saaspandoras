import { describe, it, expect, vi, beforeEach } from "vitest";

let mockAuth: any = null;
let mockRoom: any = null;
let mockAccessAllowed = true;
let createMeetingCalls: any[] = [];
let auditInsertCalls: any[] = [];
let auditShouldFail = false;
let getRoomCalls: string[] = [];
let publicIdLookups: string[] = [];
let emailCalls: any[] = [];
let emailShouldFail = false;

vi.mock("@saasfly/shared", () => ({
  getNexusAuthContext: vi.fn(async () => mockAuth),
  checkNexusPermission: vi.fn((ctx: any, permission: string) => Boolean(ctx?.permissions?.[permission])),
  sendEmail: vi.fn(async (payload: any) => {
    emailCalls.push(payload);
    if (emailShouldFail) return { success: false, error: "NOT_CONFIGURED: RESEND_API_KEY" };
    return { success: true, id: "mock_email" };
  }),
}));

vi.mock("@saasfly/nexus-deals-sdk", () => ({
  getRoom: vi.fn(async (id: string) => {
    getRoomCalls.push(id);
    return mockRoom && mockRoom.id === id ? mockRoom : null;
  }),
  getRoomByPublicId: vi.fn(async (publicId: string) => {
    publicIdLookups.push(publicId);
    return mockRoom && mockRoom.publicId === publicId ? mockRoom : null;
  }),
  canUserAccessDeal: vi.fn(() => mockAccessAllowed),
}));

vi.mock("@saasfly/agenda-sdk", () => ({
  AgendaCore: {
    createMeeting: vi.fn(async (req: any) => {
      createMeetingCalls.push(req);
      const startsAt = new Date(req.scheduledFor);
      const endsAt = req.durationMinutes
        ? new Date(startsAt.getTime() + req.durationMinutes * 60_000)
        : null;
      return {
        id: "meeting-abc",
        jitsiRoomId: "nexus-pandoras-deadbeefdeadbeef",
        presentationId: req.presentationId ?? null,
        scheduledFor: startsAt.toISOString(),
        endsAt: endsAt ? endsAt.toISOString() : null,
        participants: (req.collaborators ?? []).map((identityId: string, index: number) => ({
          id: `participant-${index}`,
          identityId,
          joinToken: `token${index}`.padEnd(32, "0"),
        })),
      };
    }),
  },
}));

vi.mock("@saasfly/db-core", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(async (values: any) => {
        if (auditShouldFail) throw new Error("audit down");
        auditInsertCalls.push(values);
        return undefined;
      }),
    })),
  },
}));

vi.mock("@saasfly/db-core/schema", () => ({
  nexusAuditEvents: { __table: "nexus_audit_events" },
}));

import { POST } from "../route";

const ROOM = {
  id: "3f4b7c1e-0000-4000-8000-000000000001",
  publicId: "PDR-63C2E9",
  counterparty: "Celeste",
  signers: [
    { email: "Socio@Celeste.com" },
    { email: "socio@celeste.com" },
    { email: "" },
    { email: "legal@celeste.com" },
  ],
};

function makeRequest(body: unknown, id = ROOM.id) {
  return new Request(`http://localhost/api/nexus/deals/${id}/schedule`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const futureIso = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe("📅 Deal schedule route (/api/nexus/deals/[id]/schedule)", () => {
  beforeEach(() => {
    mockAuth = {
      isAuthenticated: true,
      role: "SUPER_ADMIN",
      wallet: "0xabc",
      email: "marco@pandoras.finance",
      collaboratorId: 7,
      canonicalOrgId: "pandoras",
      permissions: { "calendar.manage": true },
    };
    mockRoom = { ...ROOM, signers: [...ROOM.signers] };
    mockAccessAllowed = true;
    createMeetingCalls = [];
    auditInsertCalls = [];
    auditShouldFail = false;
    getRoomCalls = [];
    publicIdLookups = [];
    emailCalls = [];
    emailShouldFail = false;
    vi.clearAllMocks();
  });

  it("SCH-01: rejects unauthenticated callers with 401 and creates nothing", async () => {
    mockAuth = { isAuthenticated: false, permissions: {} };

    const res = await POST(makeRequest({ scheduledFor: futureIso() }), { params: Promise.resolve({ id: ROOM.id }) });

    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("UNAUTHORIZED");
    expect(createMeetingCalls).toHaveLength(0);
  });

  it("SCH-02: rejects identities without calendar.manage with 403", async () => {
    mockAuth.permissions = { "calendar.manage": false };

    const res = await POST(makeRequest({ scheduledFor: futureIso() }), { params: Promise.resolve({ id: ROOM.id }) });

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("MISSING_CALENDAR_MANAGE");
    expect(createMeetingCalls).toHaveLength(0);
  });

  it("SCH-03: rejects an invalid scheduledFor with 400", async () => {
    const res = await POST(makeRequest({ scheduledFor: "no-es-fecha" }), { params: Promise.resolve({ id: ROOM.id }) });

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_SCHEDULED_FOR");
  });

  it("SCH-04: rejects scheduling in the past with 400", async () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const res = await POST(makeRequest({ scheduledFor: past }), { params: Promise.resolve({ id: ROOM.id }) });

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("SCHEDULED_FOR_IN_PAST");
  });

  it("SCH-05: rejects an out-of-range duration with 400", async () => {
    const res = await POST(makeRequest({ scheduledFor: futureIso(), durationMinutes: 5 }), {
      params: Promise.resolve({ id: ROOM.id }),
    });

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_DURATION");
  });

  it("SCH-06: returns 404 for an unknown deal resolved by public id", async () => {
    const res = await POST(makeRequest({ scheduledFor: futureIso() }, "PDR-NOPE"), {
      params: Promise.resolve({ id: "PDR-NOPE" }),
    });

    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("DEAL_NOT_FOUND");
    expect(publicIdLookups).toContain("PDR-NOPE");
    // A public id must never be sent to the uuid column.
    expect(getRoomCalls).toHaveLength(0);
  });

  it("SCH-06b: returns 404 for an unknown uuid without falling back to the public id lookup", async () => {
    const missingUuid = "00000000-0000-4000-8000-000000000000";

    const res = await POST(makeRequest({ scheduledFor: futureIso() }, missingUuid), {
      params: Promise.resolve({ id: missingUuid }),
    });

    expect(res.status).toBe(404);
    expect(getRoomCalls).toEqual([missingUuid]);
    expect(publicIdLookups).toHaveLength(0);
  });

  it("SCH-07: enforces resource scope with 403 when the identity cannot access the deal", async () => {
    mockAccessAllowed = false;

    const res = await POST(makeRequest({ scheduledFor: futureIso() }), { params: Promise.resolve({ id: ROOM.id }) });

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("DEAL_ACCESS_DENIED");
    expect(createMeetingCalls).toHaveLength(0);
  });

  it("SCH-08: fails closed with 409 when the session has no collaborator record", async () => {
    mockAuth.collaboratorId = null;

    const res = await POST(makeRequest({ scheduledFor: futureIso() }), { params: Promise.resolve({ id: ROOM.id }) });

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("HOST_COLLABORATOR_UNRESOLVED");
    expect(createMeetingCalls).toHaveLength(0);
  });

  it("SCH-09: schedules the meeting using server-resolved authority, not body values", async () => {
    const scheduledFor = futureIso();

    const res = await POST(
      makeRequest({
        scheduledFor,
        durationMinutes: 45,
        presentationId: "institutional-os",
        // Attempted client-side authority injection — must be ignored:
        canonicalOrgId: "tenant-evil",
        hostCollaboratorId: 999,
        collaborators: ["attacker@evil.com"],
      }),
      { params: Promise.resolve({ id: ROOM.publicId }) }
    );

    expect(res.status).toBe(201);
    const data = await res.json();

    expect(createMeetingCalls).toHaveLength(1);
    const call = createMeetingCalls[0];
    expect(call.canonicalOrgId).toBe("pandoras");
    expect(call.hostCollaboratorId).toBe(7);
    expect(call.presentationId).toBe("institutional-os");
    expect(call.durationMinutes).toBe(45);
    expect(call.collaborators).toEqual(["socio@celeste.com", "legal@celeste.com"]);

    expect(data.meetingId).toBe("meeting-abc");
    expect(data.dealRoomUrl).toBe(`/deal/${ROOM.publicId}`);
    expect(data.agendaUrl).toBe("/nexus/agenda");
    expect(data.participants).toBe(2);
    expect(data.audit).toBe("RECORDED");
    expect(new Date(data.endsAt).getTime() - new Date(data.scheduledFor).getTime()).toBe(45 * 60 * 1000);

    expect(auditInsertCalls).toHaveLength(1);
    expect(auditInsertCalls[0]).toMatchObject({
      canonicalOrgId: "pandoras",
      actorIdentityId: 7,
      eventType: "MEETING_SCHEDULED",
      resourceType: "meeting",
      resourceId: "meeting-abc",
      result: "SUCCESS",
    });
    expect(auditInsertCalls[0].newState.dealPublicId).toBe(ROOM.publicId);
    expect(data.joinUrl).toContain("/meet/meeting-abc");
    expect(data.invites).toEqual({ sent: 2, failed: 0, errors: [] });
    expect(emailCalls).toHaveLength(2);
    expect(emailCalls[0].to).toBe("socio@celeste.com");
    // Cada invitación lleva el link personal que registra asistencia.
    const tokenFor = (index: number) => `token${index}`.padEnd(32, "0");
    expect(String(emailCalls[0].html)).toContain(`?p=${tokenFor(0)}`);
    expect(String(emailCalls[1].html)).toContain(`?p=${tokenFor(1)}`);
    // El link del host no lleva token de participante.
    expect(data.joinUrl).not.toContain("?p=");
  });

  it("SCH-09b: reporta invitaciones fallidas con números reales (no finge éxito)", async () => {
    emailShouldFail = true;

    const res = await POST(makeRequest({ scheduledFor: futureIso() }), { params: Promise.resolve({ id: ROOM.id }) });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.meetingId).toBe("meeting-abc");
    expect(data.invites.sent).toBe(0);
    expect(data.invites.failed).toBe(2);
    expect(data.invites.errors[0]).toContain("NOT_CONFIGURED");
  });

  it("SCH-10: reports audit failure explicitly instead of claiming it was recorded", async () => {
    auditShouldFail = true;

    const res = await POST(makeRequest({ scheduledFor: futureIso() }), { params: Promise.resolve({ id: ROOM.id }) });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.meetingId).toBe("meeting-abc");
    expect(data.audit).toBe("FAILED");
  });

  it("SCH-12: el deck del deal manda sobre el deck propuesto en el body", async () => {
    mockRoom.presentationId = "real-estate-growth";

    const res = await POST(
      makeRequest({ scheduledFor: futureIso(), presentationId: "institutional-os" }),
      { params: Promise.resolve({ id: ROOM.id }) }
    );

    expect(res.status).toBe(201);
    expect(createMeetingCalls[0].presentationId).toBe("real-estate-growth");
  });

  it("SCH-13: un deck que no existe en el catálogo se rechaza antes de crear nada", async () => {
    const res = await POST(
      makeRequest({ scheduledFor: futureIso(), presentationId: "deck-inexistente" }),
      { params: Promise.resolve({ id: ROOM.id }) }
    );

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_PRESENTATION_ID");
    expect(createMeetingCalls).toHaveLength(0);
  });

  it("SCH-11: rejects a malformed presentationId with 400", async () => {
    const res = await POST(makeRequest({ scheduledFor: futureIso(), presentationId: "../../etc/passwd" }), {
      params: Promise.resolve({ id: ROOM.id }),
    });

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_PRESENTATION_ID");
    expect(createMeetingCalls).toHaveLength(0);
  });
});
