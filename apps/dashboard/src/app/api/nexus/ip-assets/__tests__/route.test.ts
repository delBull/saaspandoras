import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * 🛡️ Autoridad del registro de Activos IP
 *
 * Estas pruebas no tocan base de datos: verifican el orden de los gates
 * (sesión → organización → capability) y que un anónimo no reciba detalles
 * distintos a los de un usuario sin permiso.
 *
 * El aislamiento por `canonical_org_id` se prueba en integración (requiere DB),
 * porque el filtro vive en la query, no en el handler.
 */

let mockAuth: any = { isAuthenticated: false, role: null, canonicalOrgId: null, collaboratorId: null };

vi.mock("@saasfly/shared", () => ({
  getNexusAuthContext: vi.fn(async () => mockAuth),
  checkNexusPermission: vi.fn((auth: any, capability: string) =>
    Boolean(auth?.permissions?.[capability])
  ),
}));

vi.mock("@saasfly/db", () => ({
  db: {
    insert: () => ({ values: () => ({ returning: async () => [{ id: "row" }] }) }),
    select: () => ({ from: () => ({ where: () => ({ orderBy: async () => [] }) }) }),
  },
}));

vi.mock("@saasfly/db/schema", () => ({
  nexusIpAssets: {
    id: "id",
    canonicalOrgId: "canonical_org_id",
    archivedAt: "archived_at",
    createdAt: "created_at",
  },
}));

vi.mock("@saasfly/db-core", () => ({
  and: (...args: any[]) => args,
  eq: (...args: any[]) => args,
  isNull: (...args: any[]) => args,
  desc: (...args: any[]) => args,
}));

import { GET, POST } from "../route";

function post(body: unknown) {
  return new Request("http://localhost/api/nexus/ip-assets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

describe("📇 Activos IP · autoridad", () => {
  beforeEach(() => {
    mockAuth = { isAuthenticated: false, role: null, canonicalOrgId: null, collaboratorId: null };
  });

  it("IPA-01: sin sesión devuelve 401 y no revela el body", async () => {
    const res = await POST(post({ name: "PANDORAS" }));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("UNAUTHORIZED");
  });

  it("IPA-02: sesión sin organización devuelve 409 (nunca un tenant por defecto)", async () => {
    mockAuth = { isAuthenticated: true, role: "ADMIN", canonicalOrgId: null, collaboratorId: 7 };
    const res = await POST(post({ name: "PANDORAS" }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("ORG_UNRESOLVED");
  });

  it("IPA-03: sin capability ni rol admin devuelve 403", async () => {
    mockAuth = {
      isAuthenticated: true,
      role: "VIEWER",
      canonicalOrgId: "pandoras",
      collaboratorId: 9,
      permissions: {},
    };
    const res = await POST(post({ name: "PANDORAS" }));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("MISSING_CAPABILITY");
  });

  it("IPA-04: con permiso, un nombre vacío es 400 (validación después de autorizar)", async () => {
    mockAuth = {
      isAuthenticated: true,
      role: "ADMIN",
      canonicalOrgId: "pandoras",
      collaboratorId: 9,
      permissions: { "nexus.manage": true },
    };
    const res = await POST(post({ name: "   " }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_NAME");
  });

  it("IPA-05: GET sin sesión devuelve 401", async () => {
    const res = await GET(new Request("http://localhost/api/nexus/ip-assets") as any);
    expect(res.status).toBe(401);
  });

  it("IPA-06: GET con permiso devuelve lista vacía cuando no hay filas", async () => {
    mockAuth = {
      isAuthenticated: true,
      role: "ADMIN",
      canonicalOrgId: "pandoras",
      collaboratorId: 9,
      permissions: { "nexus.manage": true },
    };
    const res = await GET(new Request("http://localhost/api/nexus/ip-assets") as any);
    expect(res.status).toBe(200);
    expect((await res.json()).assets).toEqual([]);
  });
});
