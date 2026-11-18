import { describe, it, expect, vi, beforeEach } from "vitest";

let meetingRows: any[] = [];
let participantRows: any[] = [];
let updates: Array<{ patch: any }> = [];
let emailCalls: any[] = [];
let emailShouldFail = false;

vi.mock("@saasfly/shared", () => ({
  sendEmail: vi.fn(async (payload: any) => {
    emailCalls.push(payload);
    if (emailShouldFail) return { success: false, error: "NOT_CONFIGURED: RESEND_API_KEY" };
    return { success: true, id: "mock" };
  }),
}));

vi.mock("@saasfly/hermes-core", () => ({
  WhatsAppAdapter: class { async send() { return undefined; } },
  TelegramAdapter: class { async send() { return undefined; } },
}));

vi.mock("@saasfly/db/schema", () => ({
  meetings: { __t: "meetings" },
  meetingParticipants: { __t: "participants" },
  channelIdentityBindings: { __t: "bindings" },
}));

vi.mock("@saasfly/db", () => ({
  db: {
    select: () => ({
      from: (table: any) => ({
        where: async () => {
          if (table?.__t === "meetings") return meetingRows;
          if (table?.__t === "participants") return participantRows;
          if (table?.__t === "bindings") return [];
          return [];
        },
      }),
    }),
    update: () => ({
      set: (patch: any) => ({
        where: async () => {
          updates.push({ patch });
        },
      }),
    }),
  },
  eq: (...args: any[]) => args,
  and: (...args: any[]) => args,
  meetings: { __t: "meetings" },
  meetingParticipants: { __t: "participants" },
  channelIdentityBindings: { __t: "bindings" },
}));

vi.mock("@saasfly/db-core", () => ({
  eq: (...args: any[]) => args,
  and: (...args: any[]) => args,
}));

import { runSovereignFollowUps } from "../agenda-followups";

const MEETING_ID = "3f4b7c1e-0000-4000-8000-000000000001";
const TOKEN = "a".repeat(32);

describe("📬 Seguimiento post-presentación (audiencia y honestidad)", () => {
  beforeEach(() => {
    updates = [];
    emailCalls = [];
    emailShouldFail = false;
    meetingRows = [
      {
        id: MEETING_ID,
        canonicalOrgId: "pandoras",
        status: "ended",
        presentationId: "real-estate-growth",
      },
    ];
    participantRows = [];
  });

  it("FU-01: con asistencia conocida, el seguimiento va solo a quien entró y los no-show se marcan", async () => {
    participantRows = [
      {
        id: "p1",
        meetingId: MEETING_ID,
        identityId: "asistio@celeste.com",
        joinToken: TOKEN,
        joinedAt: new Date(),
        followUpStatus: "pending",
      },
      {
        id: "p2",
        meetingId: MEETING_ID,
        identityId: "no-show@celeste.com",
        joinToken: "b".repeat(32),
        joinedAt: null,
        followUpStatus: "pending",
      },
    ];

    const summary = await runSovereignFollowUps(MEETING_ID);

    expect(summary.sent).toBe(1);
    expect(summary.noShow).toBe(1);
    expect(emailCalls).toHaveLength(1);
    expect(emailCalls[0].to).toBe("asistio@celeste.com");

    const noShowUpdate = updates.find((u) => u.patch.followUpStatus === "no_action");
    expect(noShowUpdate).toBeDefined();
    expect(updates.some((u) => u.patch.followUpStatus === "sent")).toBe(true);
  });

  it("FU-02: sin evidencia de asistencia no se inventa no-show: se escribe a todos", async () => {
    participantRows = [
      {
        id: "p1",
        meetingId: MEETING_ID,
        identityId: "uno@celeste.com",
        joinToken: null,
        joinedAt: null,
        followUpStatus: "pending",
      },
      {
        id: "p2",
        meetingId: MEETING_ID,
        identityId: "dos@celeste.com",
        joinToken: null,
        joinedAt: null,
        followUpStatus: "pending",
      },
    ];

    const summary = await runSovereignFollowUps(MEETING_ID);

    expect(summary.sent).toBe(2);
    expect(summary.noShow).toBe(0);
    expect(emailCalls).toHaveLength(2);
  });

  it("FU-03: si el envío falla no se marca enviado; queda pending para el reintento", async () => {
    emailShouldFail = true;
    participantRows = [
      {
        id: "p1",
        meetingId: MEETING_ID,
        identityId: "falla@celeste.com",
        joinToken: TOKEN,
        joinedAt: new Date(),
        followUpStatus: "pending",
      },
    ];

    const summary = await runSovereignFollowUps(MEETING_ID);

    expect(summary.sent).toBe(0);
    expect(summary.pending).toBe(1);
    expect(updates.some((u) => u.patch.followUpStatus === "sent")).toBe(false);
    expect(updates.some((u) => u.patch.followUpStatus === "pending")).toBe(true);
  });

  it("FU-04: sin reuniones terminadas no envía nada", async () => {
    meetingRows = [];

    const summary = await runSovereignFollowUps(MEETING_ID);

    expect(summary).toEqual({ meetings: 0, sent: 0, pending: 0, noAction: 0, noShow: 0 });
    expect(emailCalls).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });
});
