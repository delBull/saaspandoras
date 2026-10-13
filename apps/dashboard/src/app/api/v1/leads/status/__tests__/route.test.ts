import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getLeadStatus } from "../route";
import { integrationGuard } from "@/lib/integrations/guard";
import { db } from "@saasfly/db-core";

vi.mock("@/lib/integrations/guard", () => ({
  integrationGuard: vi.fn(),
}));

vi.mock("@saasfly/db-core", () => ({
  db: {
    query: {
      marketingLeads: {
        findFirst: vi.fn(),
      },
    },
  },
  marketingLeads: { id: "id", projectId: "projectId", email: "email" },
  eq: vi.fn((a, b) => ({ a, b })),
  and: vi.fn((...args) => ({ and: args })),
}));

describe("GET /api/v1/leads/status (Phase 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloquea llamadas no autorizadas si integrationGuard falla", async () => {
    (integrationGuard as any).mockResolvedValue({
      ok: false,
      error: "UNAUTHORIZED",
      status: 401,
    });

    const req = new NextRequest("http://localhost:3000/api/v1/leads/status?email=test@example.com");
    const res = await getLeadStatus(req);
    expect(res.status).toBe(401);
  });

  it("rechaza peticiones sin email ni leadId con 400", async () => {
    (integrationGuard as any).mockResolvedValue({
      ok: true,
      client: { id: "c-1", projectId: 101, environment: "staging" },
    });

    const req = new NextRequest("http://localhost:3000/api/v1/leads/status");
    const res = await getLeadStatus(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("INVALID_REQUEST");
  });

  it("retorna lead encontrado con aislamiento de tenant (200 OK)", async () => {
    (integrationGuard as any).mockResolvedValue({
      ok: true,
      client: { id: "c-1", projectId: 101, environment: "staging" },
    });

    (db.query.marketingLeads.findFirst as any).mockResolvedValue({
      id: "lead-uuid-99",
      email: "buyer@example.com",
      name: "Alice Builder",
      phoneNumber: "+1234567890",
      status: "active",
      intent: "invest",
      score: 95,
      quality: "high",
      source: "api_integration",
      createdAt: new Date("2026-10-10T12:00:00Z"),
      updatedAt: new Date("2026-10-10T12:00:00Z"),
    });

    const req = new NextRequest("http://localhost:3000/api/v1/leads/status?email=buyer@example.com");
    const res = await getLeadStatus(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.lead.email).toBe("buyer@example.com");
    expect(data.lead.score).toBe(95);
  });

  it("retorna 404 NOT_FOUND cuando el prospecto no existe en el tenant", async () => {
    (integrationGuard as any).mockResolvedValue({
      ok: true,
      client: { id: "c-1", projectId: 101, environment: "staging" },
    });

    (db.query.marketingLeads.findFirst as any).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/leads/status?email=unknown@example.com");
    const res = await getLeadStatus(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("NOT_FOUND");
  });
});
