import { describe, it, expect, vi, beforeEach } from "vitest";

let mockSessionAuth: any = { isAuthenticated: false, role: null, collaboratorId: null, canonicalOrgId: null };
let mockActorResult: any = null;
let meetingRow: any = null;
let deletedWhere: any = null;
let insertedValues: any = null;
let statusPatch: any = null;

const state = vi.hoisted(() => ({ geminiCalls: 0 }));

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

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: async () => {
          state.geminiCalls += 1;
          return {
            response: {
              text: () =>
                JSON.stringify({
                  summary: "Resumen de prueba",
                  actionItems: [{ task: "Llamar al cliente", assignee: "Ana" }],
                }),
            },
          };
        },
      };
    }
  },
}));

vi.mock("@saasfly/db-core", () => {
  const tx = {
    update: () => ({
      set: (patch: any) => {
        statusPatch = patch;
        return { where: async () => undefined };
      },
    }),
    delete: () => ({
      where: async (where: any) => {
        deletedWhere = where;
      },
    }),
    insert: () => ({
      values: async (values: any) => {
        insertedValues = values;
      },
    }),
  };

  return {
    db: {
      query: {
        meetings: {
          findFirst: async () => meetingRow,
        },
      },
      transaction: async (cb: any) => cb(tx),
    },
    meetings: { id: "id", canonicalOrgId: "canonical_org_id" },
    meetingActionItems: { meetingId: "meeting_id", source: "source" },
    eq: (column: any, value: any) => ({ column, value }),
    and: (...args: any[]) => args,
  };
});

import { POST } from "../route";

const MEETING_ID = "3f4b7c1e-0000-4000-8000-000000000001";

function request(file: File, ref = "signed-ref") {
  const form = new FormData();
  form.append("meetingId", MEETING_ID);
  form.append("ref", ref);
  form.append("file", file);
  return new Request("http://localhost/api/v1/internal/nexus/meets/process", {
    method: "POST",
    body: form,
  });
}

const audioFile = (bytes = 4) =>
  new File([new Uint8Array(bytes)], "reunion.mp3", { type: "audio/mpeg" });

describe("🎙️ Minuta IA (/api/v1/internal/nexus/meets/process)", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MEETING_MODEL = "gemini-2.5-flash";
    state.geminiCalls = 0;
    deletedWhere = null;
    insertedValues = null;
    statusPatch = null;
    mockSessionAuth = { isAuthenticated: false, role: null, collaboratorId: null, canonicalOrgId: null };
    meetingRow = {
      id: MEETING_ID,
      canonicalOrgId: "pandoras",
      hostCollaboratorId: 7,
      status: "ended",
    };
    mockActorResult = {
      actor: {
        meetingId: MEETING_ID,
        orgId: "pandoras",
        actorCollaboratorId: "7",
        participantId: null,
        via: "joinRef",
      },
    };
  });

  it("PRC-01: el host con enlace temporal procesa audio y conserva las tareas manuales", async () => {
    const res = await POST(request(audioFile()));
    expect(res.status).toBe(200);
    expect(state.geminiCalls).toBe(1);

    // Solo borra las tareas de IA, nunca las manuales.
    expect(deletedWhere).toContainEqual({ column: "source", value: "ai" });

    // Inserta las nuevas con source='ai'.
    expect(insertedValues).toHaveLength(1);
    expect(insertedValues[0]).toMatchObject({
      meetingId: MEETING_ID,
      canonicalOrgId: "pandoras",
      task: "Llamar al cliente",
      source: "ai",
    });
  });

  it("PRC-02: un participante con su ref NO puede procesar la minuta", async () => {
    mockActorResult = {
      actor: {
        meetingId: MEETING_ID,
        orgId: "pandoras",
        actorCollaboratorId: "99",
        participantId: "participant-1",
        via: "joinRef",
      },
    };

    const res = await POST(request(audioFile()));

    expect(res.status).toBe(403);
    expect(state.geminiCalls).toBe(0);
    expect(deletedWhere).toBeNull();
  });

  it("PRC-03: un colaborador con sesión que no es host ni admin tampoco puede", async () => {
    mockSessionAuth = {
      isAuthenticated: true,
      role: "COLLABORATOR",
      collaboratorId: 99,
      canonicalOrgId: "pandoras",
    };
    mockActorResult = {
      actor: {
        meetingId: MEETING_ID,
        orgId: "pandoras",
        actorCollaboratorId: "99",
        participantId: null,
        via: "session",
      },
    };

    const res = await POST(request(audioFile()));

    expect(res.status).toBe(403);
    expect(state.geminiCalls).toBe(0);
  });

  it("PRC-04: rechaza video (solo audio) antes de llamar a Gemini", async () => {
    const video = new File([new Uint8Array(4)], "reunion.mp4", { type: "video/mp4" });

    const res = await POST(request(video));

    expect(res.status).toBe(415);
    expect(state.geminiCalls).toBe(0);
  });

  it("PRC-05: rechaza audio de más de 10 MB antes de llamar a Gemini", async () => {
    const big = audioFile(10 * 1024 * 1024 + 1);

    const res = await POST(request(big));

    expect(res.status).toBe(413);
    expect(state.geminiCalls).toBe(0);
  });

  it("PRC-06: sin actor válido responde 401/403 y no toca nada", async () => {
    mockActorResult = { error: { status: 401, code: "UNAUTHORIZED", message: "No autorizado." } };

    const res = await POST(request(audioFile()));

    expect(res.status).toBe(401);
    expect(state.geminiCalls).toBe(0);
    expect(deletedWhere).toBeNull();
  });
});
