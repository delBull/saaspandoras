import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let mockAuth: any = { isAuthenticated: true, role: "SUPER_ADMIN" };

vi.mock("@saasfly/shared", () => ({
  getNexusAuthContext: vi.fn(async () => mockAuth),
}));

import { GET } from "../route";

const TOUCHED = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "MEET_JOIN_SECRET",
  "JITSI_APP_ID",
  "JITSI_API_KEY",
  "JITSI_PRIVATE_KEY_B64",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "REDIS_URL",
];

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/v1/internal/readiness", { headers }) as any;
}

describe("🩺 Readiness del ciclo de presentación", () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of TOUCHED) {
      original[key] = process.env[key];
      delete process.env[key];
    }
    mockAuth = { isAuthenticated: true, role: "SUPER_ADMIN" };
  });

  afterEach(() => {
    for (const key of TOUCHED) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  it("RDY-01: sin CRON_SECRET ni sesión admin, responde 401 (fail-closed)", async () => {
    mockAuth = { isAuthenticated: false };

    const res = await GET(request());

    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("UNAUTHORIZED");
  });

  it("RDY-02: reporta exactamente lo que falta, sin inventar disponibilidad", async () => {
    const res = await GET(request());
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ready).toBe(false);
    expect(data.capabilities).toEqual({
      database: false,
      email: false,
      meetings: false,
      cron: false,
    });
    expect(data.missing).toEqual(
      expect.arrayContaining(["DATABASE_URL", "RESEND_API_KEY", "MEET_JOIN_SECRET", "JITSI_APP_ID", "CRON_SECRET"])
    );
    // No se filtran valores de entorno, solo nombres.
    expect(JSON.stringify(data)).not.toContain("Bearer");
  });

  it("RDY-03: con todo configurado se declara listo", async () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.RESEND_API_KEY = "re_test";
    process.env.MEET_JOIN_SECRET = "secret";
    process.env.JITSI_APP_ID = "app";
    process.env.JITSI_API_KEY = "key";
    process.env.JITSI_PRIVATE_KEY_B64 = "b64";
    process.env.CRON_SECRET = "cron";

    const res = await GET(request({ authorization: "Bearer cron" }));
    const data = await res.json();

    expect(data.ready).toBe(true);
    expect(data.missing).toEqual([]);
    expect(data.notes).toEqual([]);
  });

  it("RDY-04: acepta CRON_SECRET como credencial de servicio", async () => {
    mockAuth = { isAuthenticated: false };
    process.env.CRON_SECRET = "cron-secret";

    const authorized = await GET(request({ authorization: "Bearer cron-secret" }));
    const denied = await GET(request({ authorization: "Bearer incorrecto" }));

    expect(authorized.status).toBe(200);
    expect(denied.status).toBe(401);
  });
});
