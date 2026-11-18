import { describe, it, expect, vi, beforeEach } from "vitest";

let meetingRow: any = null;
let lastPatch: any = null;
let mockAuth: any = { isAuthenticated: true, collaboratorId: 7, canonicalOrgId: "pandoras" };

vi.mock("@saasfly/shared", () => ({
  getNexusAuthContext: vi.fn(async () => mockAuth),
}));

vi.mock("@saasfly/db-core", () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => (meetingRow ? [meetingRow] : []) }) }),
    }),
    update: () => ({
      set: (patch: any) => {
        lastPatch = patch;
        return { where: () => ({ returning: async () => [{ id: meetingRow?.id, presenterNotes: patch.presenterNotes }] }) };
      },
    }),
  },
  and: (...args: any[]) => args,
  eq: (...args: any[]) => args,
  meetings: { id: "id" },
}));

import { GET, POST } from "../route";

const MEETING_ID = "3f4b7c1e-0000-4000-8000-000000000001";

function post(body: unknown) {
  return new Request("http://localhost/api/v1/meet/notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

describe("📝 Guión contextual de la sesión (/api/v1/meet/notes)", () => {
  beforeEach(() => {
    lastPatch = null;
    mockAuth = { isAuthenticated: true, collaboratorId: 7, canonicalOrgId: "pandoras" };
    meetingRow = {
      id: MEETING_ID,
      canonicalOrgId: "pandoras",
      hostCollaboratorId: 7,
      status: "live",
      presenterNotes: "Acuerdo previo: revisar esquema de comisión.",
    };
  });

  it("NOTES-01: el host lee las notas de su reunión", async () => {
    const res = await GET(new Request(`http://localhost/api/v1/meet/notes?meetingId=${MEETING_ID}`) as any);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.notes).toContain("Acuerdo previo");
  });

  it("NOTES-02: el host guarda y se persiste en la reunión", async () => {
    const res = await POST(post({ meetingId: MEETING_ID, notes: "Objeción: precio por unidad." }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.saved).toBe(true);
    expect(lastPatch).toMatchObject({ presenterNotes: "Objeción: precio por unidad." });
  });

  it("NOTES-03: un colaborador que no es host no puede leer ni escribir", async () => {
    mockAuth = { isAuthenticated: true, collaboratorId: 99, canonicalOrgId: "pandoras" };

    const read = await GET(new Request(`http://localhost/api/v1/meet/notes?meetingId=${MEETING_ID}`) as any);
    const write = await POST(post({ meetingId: MEETING_ID, notes: "x" }));

    expect(read.status).toBe(403);
    expect(write.status).toBe(403);
    expect(lastPatch).toBeNull();
  });

  it("NOTES-04: rechaza notas excesivas antes de escribir", async () => {
    const res = await POST(post({ meetingId: MEETING_ID, notes: "x".repeat(8001) }));

    expect(res.status).toBe(413);
    expect((await res.json()).code).toBe("NOTES_TOO_LONG");
    expect(lastPatch).toBeNull();
  });

  it("NOTES-05: sin sesión ni referencia de sala devuelve 401", async () => {
    mockAuth = { isAuthenticated: false };

    const res = await POST(post({ meetingId: MEETING_ID, notes: "x" }));

    expect(res.status).toBe(401);
    expect(lastPatch).toBeNull();
  });
});
