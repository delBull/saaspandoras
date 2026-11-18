import { describe, it, expect, vi, beforeEach } from "vitest";

let meetingRow: any = null;
let stateRow: any = null;
let lastPatch: any = null;
let mockAuth: any = { isAuthenticated: true, collaboratorId: 7, canonicalOrgId: "pandoras" };

vi.mock("@saasfly/shared", () => ({
  getNexusAuthContext: vi.fn(async () => mockAuth),
}));

vi.mock("@saasfly/db-core", () => {
  const select = () => ({
    from: (table: any) => ({
      where: () => ({
        limit: async () => {
          if (table?.__t === "state") return stateRow ? [stateRow] : [];
          return meetingRow ? [meetingRow] : [];
        },
      }),
    }),
  });

  return {
    db: {
      select,
      update: () => ({
        set: (patch: any) => {
          lastPatch = patch;
          return { where: async () => undefined };
        },
      }),
      insert: () => ({
        values: (values: any) => ({
          onConflictDoUpdate: () => ({
            returning: async () => {
              lastPatch = values;
              return [{ slideIndex: values.slideIndex, presentationOpen: values.presentationOpen }];
            },
          }),
        }),
      }),
    },
    and: (...args: any[]) => args,
    eq: (...args: any[]) => args,
    meetings: { __t: "meetings", id: "id" },
    meetingPresentationState: { __t: "state", meetingId: "meeting_id" },
  };
});

import { POST as presentationPost, GET as presentationGet } from "../route";

function postRequest(body: unknown) {
  return new Request("http://localhost/api/v1/meet/presentation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

const MEETING_ID = "3f4b7c1e-0000-4000-8000-000000000001";

describe("🎬 In-room presentation state (/api/v1/meet/presentation)", () => {
  beforeEach(() => {
    lastPatch = null;
    mockAuth = { isAuthenticated: true, collaboratorId: 7, canonicalOrgId: "pandoras" };
    meetingRow = {
      id: MEETING_ID,
      canonicalOrgId: "pandoras",
      hostCollaboratorId: 7,
      status: "scheduled",
      presentationId: "real-estate-growth",
    };
    stateRow = null;
  });

  it("PRS-01: host opens the deck at a given slide", async () => {
    const res = await presentationPost(postRequest({ meetingId: MEETING_ID, open: true, slide: 3 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.open).toBe(true);
    expect(data.slide).toBe(3);
    expect(data.presentationId).toBe("real-estate-growth");
    expect(lastPatch).toMatchObject({ presentationOpen: true, slideIndex: 3 });
  });

  it("PRS-02: rejects a non-host identity with 403 and writes nothing", async () => {
    mockAuth = { isAuthenticated: true, collaboratorId: 99, canonicalOrgId: "pandoras" };

    const res = await presentationPost(postRequest({ meetingId: MEETING_ID, slide: 2 }));

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("HOST_ONLY");
    expect(lastPatch).toBeNull();
  });

  it("PRS-03: rejects an unauthenticated caller with 401", async () => {
    mockAuth = { isAuthenticated: false, permissions: {} };

    const res = await presentationPost(postRequest({ meetingId: MEETING_ID, slide: 2 }));

    expect(res.status).toBe(401);
    expect(lastPatch).toBeNull();
  });

  it("PRS-04: refuses to drive a meeting that is already closed", async () => {
    meetingRow.status = "ended";

    const res = await presentationPost(postRequest({ meetingId: MEETING_ID, open: true }));

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("MEETING_NOT_ACTIVE");
    expect(lastPatch).toBeNull();
  });

  it("PRS-05: refuses when the meeting has no deck from the catalog", async () => {
    meetingRow.presentationId = "deck-inventado";

    const res = await presentationPost(postRequest({ meetingId: MEETING_ID, slide: 1 }));

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("NO_PRESENTATION");
  });

  it("PRS-06: rejects out-of-range slides before touching the DB", async () => {
    const res = await presentationPost(postRequest({ meetingId: MEETING_ID, slide: -1 }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_SLIDE");

    const high = await presentationPost(postRequest({ meetingId: MEETING_ID, slide: 999 }));
    expect(high.status).toBe(400);
    expect(lastPatch).toBeNull();
  });

  it("PRS-07: GET exposes only deck state (participants follow the host)", async () => {
    stateRow = { presentationOpen: true, slideIndex: 4 };

    const res = await presentationGet(
      new Request(`http://localhost/api/v1/meet/presentation?meetingId=${MEETING_ID}`) as any
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      presentationId: "real-estate-growth",
      open: true,
      slide: 4,
      status: "scheduled",
    });
  });

  it("PRS-08: GET validates the meeting id shape", async () => {
    const res = await presentationGet(
      new Request("http://localhost/api/v1/meet/presentation?meetingId=PDR-63C2E9") as any
    );

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_MEETING_ID");
  });
});
