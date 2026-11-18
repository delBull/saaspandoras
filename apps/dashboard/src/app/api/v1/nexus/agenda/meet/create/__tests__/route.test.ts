import { describe, it, expect, vi, beforeEach } from "vitest";

let mockAuth: any = { isAuthenticated: true, collaboratorId: 7, canonicalOrgId: "pandoras", name: "Marco" };
let createCalls: any[] = [];
let inviteCalls: any[] = [];

vi.mock("@saasfly/shared", () => ({
  getNexusAuthContext: vi.fn(async () => mockAuth),
  checkNexusPermission: vi.fn((ctx: any, permission: string) => Boolean(ctx?.permissions?.[permission])),
}));

vi.mock("@saasfly/agenda-sdk", () => ({
  AgendaCore: {
    createMeeting: vi.fn(async (req: any) => {
      createCalls.push(req);
      return {
        id: "meeting-xyz",
        jitsiRoomId: "nexus-pandoras-abc",
        presentationId: req.presentationId ?? null,
        scheduledFor: new Date(req.scheduledFor).toISOString(),
        endsAt: req.durationMinutes
          ? new Date(new Date(req.scheduledFor).getTime() + req.durationMinutes * 60_000).toISOString()
          : null,
        participants: (req.participants ?? []).map((participant: { email: string }, index: number) => ({
          id: `p-${index}`,
          identityId: participant.email,
          email: participant.email,
          joinToken: `tok${index}`.padEnd(32, "0"),
        })),
      };
    }),
  },
}));

vi.mock("@/lib/nexus/meeting-invites", () => ({
  defaultAppBaseUrl: () => "https://dash.pandoras.finance",
  sendMeetingInvites: vi.fn(async (input: any) => {
    inviteCalls.push(input);
    return { sent: input.recipients.length, failed: 0, errors: [] };
  }),
}));

import { POST } from "../route";

function req(body: unknown) {
  return new Request("http://localhost/api/v1/nexus/agenda/meet/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

const futureIso = () => new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

describe("🗓️ Agenda Soberana — crear presentación (/api/v1/nexus/agenda/meet/create)", () => {
  beforeEach(() => {
    createCalls = [];
    inviteCalls = [];
    mockAuth = {
      isAuthenticated: true,
      collaboratorId: 7,
      canonicalOrgId: "pandoras",
      name: "Marco",
      permissions: { "calendar.manage": true },
    };
  });

  it("AGD-01: exige capability calendar.manage", async () => {
    mockAuth.permissions = { "calendar.manage": false };

    const res = await POST(req({ scheduledFor: futureIso() }));

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("MISSING_CALENDAR_MANAGE");
    expect(createCalls).toHaveLength(0);
  });

  it("AGD-02: rechaza un deck fuera del catálogo antes de crear nada", async () => {
    const res = await POST(req({ scheduledFor: futureIso(), presentationId: "deck-fantasma" }));

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_PRESENTATION_ID");
    expect(createCalls).toHaveLength(0);
  });

  it("AGD-03: rechaza emails inválidos", async () => {
    const res = await POST(req({ scheduledFor: futureIso(), participants: ["no-es-email"] }));

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_PARTICIPANT_EMAIL");
    expect(createCalls).toHaveLength(0);
  });

  it("AGD-04: crea la reunión con deck del catálogo e invita con link personal", async () => {
    const res = await POST(
      req({
        scheduledFor: futureIso(),
        durationMinutes: 45,
        presentationId: "celeste",
        participants: ["Eduardo@Celeste.com", "comercial@celeste.com"],
        // intento de inyección de autoridad — debe ignorarse:
        canonicalOrgId: "otro-tenant",
        hostCollaboratorId: 999,
      })
    );

    expect(res.status).toBe(201);
    const data = await res.json();

    expect(createCalls[0].canonicalOrgId).toBe("pandoras");
    expect(createCalls[0].hostCollaboratorId).toBe(7);
    expect(createCalls[0].presentationId).toBe("celeste");
    expect(createCalls[0].participants).toEqual([{ email: "eduardo@celeste.com" }, { email: "comercial@celeste.com" }]);

    expect(data.meeting.joinUrl).toBe("https://dash.pandoras.finance/meet/meeting-xyz");
    expect(data.meeting.presentationId).toBe("celeste");
    expect(data.invites).toEqual({ sent: 2, failed: 0, errors: [] });

    expect(inviteCalls).toHaveLength(1);
    expect(inviteCalls[0].deckSlug).toBe("celeste");
    expect(inviteCalls[0].recipients[0].joinToken).toBe(`tok0`.padEnd(32, "0"));
  });

  it("AGD-05: falla cerrado si la sesión no tiene colaborador", async () => {
    mockAuth.collaboratorId = null;

    const res = await POST(req({ scheduledFor: futureIso() }));

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("HOST_COLLABORATOR_UNRESOLVED");
    expect(createCalls).toHaveLength(0);
  });
});
