import { describe, it, expect, vi, beforeEach } from "vitest";

let meetingRows: any[] = [];
let participantRows: any[] = [];
let updates: Array<{ patch: any }> = [];
let emailCalls: any[] = [];
let emailShouldFail = false;
let presenceRows: any[] = [];
let actionRows: any[] = [];

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
  meetings: { __t: "meetings", followUpEnabled: "follow_up_enabled" },
  meetingParticipants: { __t: "participants" },
  meetingPresenceSessions: { __t: "sessions" },
  channelIdentityBindings: { __t: "bindings" },
  meetingActionItems: { __t: "actions", task: "task", assigneeName: "assignee_name" },
}));

vi.mock("@saasfly/db", () => ({
  db: {
    select: () => ({
      from: (table: any) => ({
        where: (condition: any) => {
          let rows = (() => {
            if (table?.__t === "meetings") return meetingRows;
            if (table?.__t === "participants") return participantRows;
            if (table?.__t === "bindings") return [];
            if (table?.__t === "sessions") return presenceRows;
            if (table?.__t === "actions") return actionRows;
            return [];
          })();

          // El opt-out del host: meetings.follow_up_enabled = false no debe enviar.
          if (table?.__t === "meetings" && Array.isArray(condition)) {
            const wantsEnabled = condition.some(
              (part: any) => part?.column === "follow_up_enabled" && part?.value === true
            );
            if (wantsEnabled) rows = rows.filter((m: any) => m.followUpEnabled !== false);
          }
          return {
            limit: async (n: number) => rows.slice(0, n),
            then: (resolve: (value: any) => unknown) => resolve(rows),
          };
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
  meetings: { __t: "meetings", followUpEnabled: "follow_up_enabled" },
  meetingParticipants: { __t: "participants" },
  channelIdentityBindings: { __t: "bindings" },
}));

vi.mock("@saasfly/db-core", () => ({
  eq: (column: any, value: any) => ({ column, value }),
  and: (...args: any[]) => args,
}));

import { runSovereignFollowUps, sendMeetingSummaryFollowUp } from "../agenda-followups";

const MEETING_ID = "3f4b7c1e-0000-4000-8000-000000000001";
const TOKEN = "a".repeat(32);

describe("📬 Seguimiento post-presentación (audiencia y honestidad)", () => {
  beforeEach(() => {
    updates = [];
    emailCalls = [];
    emailShouldFail = false;
    presenceRows = [];
    actionRows = [];
    meetingRows = [
      {
        id: MEETING_ID,
        canonicalOrgId: "pandoras",
        status: "ended",
        presentationId: "real-estate-growth",
        followUpEnabled: true,
        aiSummary: null,
        title: null,
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

  it("FU-05: usa la permanencia real (segundos en sala), no solo la apertura del link", async () => {
    participantRows = [
      {
        id: "p1",
        meetingId: MEETING_ID,
        identityId: "presente@celeste.com",
        joinToken: TOKEN,
        joinedAt: new Date(),
        followUpStatus: "pending",
      },
      {
        id: "p2",
        meetingId: MEETING_ID,
        identityId: "entro-y-sallo@celeste.com",
        joinToken: "b".repeat(32),
        joinedAt: new Date(),
        followUpStatus: "pending",
      },
    ];

    const startedAt = new Date(Date.now() - 10 * 60 * 1000);
    presenceRows = [
      {
        id: "s1",
        meetingId: MEETING_ID,
        participantId: "p1",
        identity: "participant:p1",
        joinedAt: startedAt,
        lastSeenAt: new Date(startedAt.getTime() + 9 * 60 * 1000),
        leftAt: new Date(startedAt.getTime() + 9 * 60 * 1000),
      },
      {
        id: "s2",
        meetingId: MEETING_ID,
        participantId: "p2",
        identity: "participant:p2",
        joinedAt: startedAt,
        // Abrió el link y se fue a los 10 segundos: no cuenta como asistencia.
        lastSeenAt: new Date(startedAt.getTime() + 10 * 1000),
        leftAt: new Date(startedAt.getTime() + 10 * 1000),
      },
    ];

    const summary = await runSovereignFollowUps(MEETING_ID);

    expect(summary.sent).toBe(1);
    expect(summary.noShow).toBe(1);
    expect(emailCalls.map((call: any) => call.to)).toEqual(["presente@celeste.com"]);
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

  it("FU-06: la cortesía incluye resumen y tareas si ya existe el resumen", async () => {
    meetingRows[0].aiSummary = "Se revisó la propuesta y se acordó el piloto.";
    actionRows = [{ task: "Enviar contrato", assigneeName: "Ana" }];
    participantRows = [
      {
        id: "p1",
        meetingId: MEETING_ID,
        identityId: "asistio@celeste.com",
        joinToken: TOKEN,
        joinedAt: new Date(),
        followUpStatus: "pending",
        summarySentAt: null,
      },
    ];

    const summary = await runSovereignFollowUps(MEETING_ID);

    expect(summary.sent).toBe(1);
    expect(emailCalls[0].subject).toContain("Resumen de la sesión");
    expect(emailCalls[0].html).toContain("Se revisó la propuesta");
    expect(emailCalls[0].html).toContain("Enviar contrato");
    const sentUpdate = updates.find((u) => u.patch.followUpStatus === "sent");
    expect(sentUpdate?.patch.summarySentAt).toBeInstanceOf(Date);
  });

  it("FU-07: el envío manual del resumen omite a quien ya lo recibió y marca summarySentAt", async () => {
    meetingRows[0].aiSummary = "Resumen manual de la sesión.";
    actionRows = [{ task: "Cerrar propuesta", assigneeName: "Luis" }];
    participantRows = [
      {
        id: "p1",
        meetingId: MEETING_ID,
        identityId: "uno@celeste.com",
        joinToken: TOKEN,
        joinedAt: new Date(),
        followUpStatus: "sent",
        summarySentAt: null,
      },
      {
        id: "p2",
        meetingId: MEETING_ID,
        identityId: "dos@celeste.com",
        joinToken: TOKEN,
        joinedAt: new Date(),
        followUpStatus: "sent",
        summarySentAt: new Date(),
      },
    ];

    const result = await sendMeetingSummaryFollowUp(MEETING_ID);

    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(1);
    expect(emailCalls).toHaveLength(1);
    expect(emailCalls[0].to).toBe("uno@celeste.com");
    expect(emailCalls[0].html).toContain("Resumen manual de la sesión");
    expect(emailCalls[0].html).toContain("Cerrar propuesta");
    expect(updates.some((u) => u.patch.summarySentAt instanceof Date)).toBe(true);
  });

  it("FU-08: si el host desactivó el seguimiento, la cortesía no envía nada", async () => {
    meetingRows[0].followUpEnabled = false;
    participantRows = [
      {
        id: "p1",
        meetingId: MEETING_ID,
        identityId: "asistio@celeste.com",
        joinToken: TOKEN,
        joinedAt: new Date(),
        followUpStatus: "pending",
        summarySentAt: null,
      },
    ];

    const summary = await runSovereignFollowUps(MEETING_ID);

    expect(summary.sent).toBe(0);
    expect(emailCalls).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  it("FU-04: sin reuniones terminadas no envía nada", async () => {
    meetingRows = [];

    const summary = await runSovereignFollowUps(MEETING_ID);

    expect(summary).toEqual({ meetings: 0, sent: 0, pending: 0, noAction: 0, noShow: 0 });
    expect(emailCalls).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });
});
