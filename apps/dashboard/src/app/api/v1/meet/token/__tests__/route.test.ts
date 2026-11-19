import { describe, it, expect, beforeAll, vi } from "vitest";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const MEETING_ID = "3f4b7c1e-0000-4000-8000-000000000001";
const HOST_ID = 140;

const state = vi.hoisted(() => ({
  meeting: null as any,
}));

vi.mock("@saasfly/db-core", () => {
  const rows = () => (state.meeting ? [state.meeting] : []);
  // El route hace `await db.select().from().where()` (sin .limit),
  // así que el resultado de where debe ser "awaitable" además de tener .limit().
  const result = {
    limit: async () => rows(),
    then: (resolve: (value: unknown) => unknown) => resolve(rows()),
  };
  return {
    db: { select: () => ({ from: () => ({ where: () => result }) }) },
    meetings: {},
    nexusCollaborators: { id: "id", name: "name" },
    eq: (...args: any[]) => args,
    and: (...args: any[]) => args,
  };
});

let POST: (req: any) => Promise<Response>;

beforeAll(async () => {
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  } as any) as unknown as { privateKey: string };

  process.env.JITSI_APP_ID = "app-test";
  process.env.JITSI_API_KEY = "kid-test";
  process.env.JITSI_PRIVATE_KEY_B64 = Buffer.from(privateKey).toString("base64");
  process.env.MEET_JOIN_SECRET = "secret-test";

  state.meeting = {
    id: MEETING_ID,
    canonicalOrgId: "pandoras",
    hostCollaboratorId: HOST_ID,
    status: "live",
    jitsiRoomId: null,
    presentationId: null,
  };

  // El módulo lee las env en el import, así que se carga después de setearlas.
  vi.resetModules();
  ({ POST } = await import("../route"));
});

function signedRef(collaboratorId: string | number, extra: Record<string, unknown> = {}) {
  return jwt.sign(
    { meetingId: MEETING_ID, collaboratorId, orgId: "pandoras", ...extra },
    "secret-test",
    { algorithm: "HS256", expiresIn: "15m" }
  );
}

function request(ref: string) {
  return new Request("http://localhost/api/v1/meet/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ref }),
  }) as any;
}

describe("🎥 Meet token (/api/v1/meet/token)", () => {
  it("TK-01: el HOST entra con un joinRef de id numérico (regresión: daba 500)", async () => {
    const res = await POST(request(signedRef(HOST_ID)));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.role).toBe("host");
    expect(typeof data.token).toBe("string");
    expect(data.token.split(".")).toHaveLength(3);
  });

  it("TK-02: un invitado con joinRef 'guest:' entra como participante", async () => {
    const res = await POST(request(signedRef(`guest:${MEETING_ID}`)));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.role).toBe("participant");
  });

  it("TK-05: el nombre firmado se usa en la sala (no 'Collaborator abc')", async () => {
    const res = await POST(request(signedRef(HOST_ID, { name: "Marco Muñoz", email: "marco@pandoras.finance" })));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.displayName).toBe("Marco Muñoz");

    const decoded = jwt.decode(data.token) as any;
    expect(decoded.context.user.name).toBe("Marco Muñoz");
    expect(decoded.context.user.email).toBe("marco@pandoras.finance");
  });

  it("TK-06: un invitado muestra su correo como nombre, no 'Invitado'", async () => {
    const res = await POST(
      request(signedRef(`guest:${MEETING_ID}`, { email: "eduardo@celeste.com" }))
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.displayName).toBe("eduardo");
  });

  it("TK-03: un joinRef inválido se rechaza con 403", async () => {
    const res = await POST(request("no-es-un-jwt"));

    expect(res.status).toBe(403);
  });

  it("TK-04: una reunión cerrada no emite token", async () => {
    state.meeting = { ...state.meeting, status: "ended" };

    const res = await POST(request(signedRef(HOST_ID)));

    expect(res.status).toBe(403);
  });
});
