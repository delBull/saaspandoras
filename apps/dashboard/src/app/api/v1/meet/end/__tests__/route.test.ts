import { describe, it, expect, vi, beforeEach } from "vitest";

let meetingRow: any = null;
let lastPatch: any = null;
let patches: any[] = [];
let followUpCalls: string[] = [];
let followUpShouldThrow = false;
let followUpSummary = { meetings: 1, sent: 2, pending: 0, noAction: 0 };
let mockAuth: any = { isAuthenticated: true, collaboratorId: 7, canonicalOrgId: "pandoras" };

vi.mock("@saasfly/shared", () => ({
  getNexusAuthContext: vi.fn(async () => mockAuth),
}));

vi.mock("@/lib/nexus/agenda-followups", () => ({
  runSovereignFollowUps: vi.fn(async (meetingId?: string) => {
    followUpCalls.push(meetingId ?? "ALL");
    if (followUpShouldThrow) throw new Error("resend down");
    return followUpSummary;
  }),
}));

vi.mock("@saasfly/db-core", () => {
  const selectChain = {
    from: () => ({ where: () => ({ limit: async () => (meetingRow ? [meetingRow] : []) }) }),
  };
  return {
    db: {
      select: () => selectChain,
      update: () => ({
        set: (patch: any) => {
          lastPatch = patch;
          patches.push(patch);
          return {
            where: () => ({
              returning: async () => [{ id: meetingRow?.id, endedAt: patch.endedAt ?? null }],
            }),
          };
        },
      }),
    },
    and: (...args: any[]) => args,
    eq: (...args: any[]) => args,
    meetings: { id: "id", canonicalOrgId: "canonical_org_id" },
    meetingPresentationState: { meetingId: "meeting_id" },
  };
});

import { POST } from "../route";

const MEETING_ID = "3f4b7c1e-0000-4000-8000-000000000001";

function request(body: unknown = { meetingId: MEETING_ID }) {
  return new Request("http://localhost/api/v1/meet/end", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

describe("📴 Cierre de reunión (/api/v1/meet/end)", () => {
  beforeEach(() => {
    lastPatch = null;
    patches = [];
    followUpCalls = [];
    followUpShouldThrow = false;
    followUpSummary = { meetings: 1, sent: 2, pending: 0, noAction: 0 };
    mockAuth = { isAuthenticated: true, collaboratorId: 7, canonicalOrgId: "pandoras" };
    meetingRow = {
      id: MEETING_ID,
      canonicalOrgId: "pandoras",
      hostCollaboratorId: 7,
      status: "live",
      presentationId: "real-estate-growth",
      presentationOpen: true,
      presentationSlide: 5,
    };
  });

  it("END-01: the host closes the meeting and the follow-up runs for that meeting", async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.followUp).toEqual({ dispatched: 2, pending: 0 });

    expect(patches.some((patch) => patch.status === "ended")).toBe(true);
    const endPatch = patches.find((patch) => patch.status === "ended");
    expect(endPatch?.endedAt).toBeInstanceOf(Date);
    expect(followUpCalls).toEqual([MEETING_ID]);
  });

  it("END-02: a participant cannot close the meeting", async () => {
    mockAuth = { isAuthenticated: true, collaboratorId: 99, canonicalOrgId: "pandoras" };

    const res = await POST(request());

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("HOST_ONLY");
    expect(lastPatch).toBeNull();
    expect(followUpCalls).toHaveLength(0);
  });

  it("END-03: closing an already-ended meeting is idempotent and does not resend", async () => {
    meetingRow.status = "ended";

    const res = await POST(request());
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.alreadyEnded).toBe(true);
    expect(lastPatch).toBeNull();
    expect(followUpCalls).toHaveLength(0);
  });

  it("END-04: refuses to close a cancelled meeting", async () => {
    meetingRow.status = "cancelled";

    const res = await POST(request());

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("MEETING_CANCELLED");
    expect(lastPatch).toBeNull();
  });

  it("END-05: rejects unauthenticated callers without a room reference", async () => {
    mockAuth = { isAuthenticated: false };

    const res = await POST(request());

    expect(res.status).toBe(401);
    expect(lastPatch).toBeNull();
  });

  it("END-06: if the follow-up fails, the meeting stays ended and the failure is reported (cron retries)", async () => {
    followUpShouldThrow = true;

    const res = await POST(request());
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(patches.some((patch) => patch.status === "ended")).toBe(true);
    expect(data.followUp).toEqual({ dispatched: 0, pending: 0, error: "FOLLOW_UP_FAILED_RETRY_VIA_CRON" });
  });
});
