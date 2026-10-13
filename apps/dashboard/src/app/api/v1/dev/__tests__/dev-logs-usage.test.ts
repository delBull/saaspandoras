import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getLogs } from "../logs/route";
import { GET as getUsage } from "../usage/route";
import { integrationGuard } from "@/lib/integrations/guard";
import { QuotaMeteringService } from "@/lib/integrations/quota-metering";
import { db } from "@saasfly/db-core";

vi.mock("@/lib/integrations/guard", () => ({
  integrationGuard: vi.fn(),
}));

vi.mock("@/lib/integrations/quota-metering", () => ({
  QuotaMeteringService: {
    getUsageMetrics: vi.fn(),
  },
}));

vi.mock("@saasfly/db-core", () => ({
  db: {
    query: {
      webhookEvents: {
        findMany: vi.fn(),
      },
      installedProducts: {
        findFirst: vi.fn(),
      },
    },
  },
  webhookEvents: { clientId: "clientId", createdAt: "createdAt" },
  installedProducts: { projectId: "projectId", productFamily: "productFamily", product: "product", status: "status" },
  eq: vi.fn((a, b) => ({ a, b })),
  and: vi.fn((...args) => ({ and: args })),
  inArray: vi.fn((a, b) => ({ inArray: [a, b] })),
  desc: vi.fn((a) => ({ desc: a })),
}));

describe("Phase 6: Developer Telemetry, Logs & Usage Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/dev/logs", () => {
    it("bloquea llamadas sin credencial autorizada con 401", async () => {
      (integrationGuard as any).mockResolvedValue({
        ok: false,
        error: "Missing or malformed Authorization header",
        status: 401,
      });

      const req = new NextRequest("http://localhost:3000/api/v1/dev/logs");
      const res = await getLogs(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Authorization");
    });

    it("retorna únicamente los logs pertenecientes al clientId del token", async () => {
      (integrationGuard as any).mockResolvedValue({
        ok: true,
        client: { id: "client_uuid_101", projectId: 101, environment: "staging" },
      });

      const mockEvents = [
        {
          id: "evt_1",
          clientId: "client_uuid_101",
          event: "lead.new",
          status: "sent",
          attempts: 1,
          payload: { email: "builder@test.com" },
          nextRetryAt: null,
          createdAt: new Date("2026-10-13T10:00:00Z"),
          updatedAt: new Date("2026-10-13T10:00:01Z"),
        },
      ];

      (db.query.webhookEvents.findMany as any).mockResolvedValue(mockEvents);

      const req = new NextRequest("http://localhost:3000/api/v1/dev/logs?limit=10");
      const res = await getLogs(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(1);
      expect(data.events[0].id).toBe("evt_1");
      expect(data.events[0].status).toBe("sent");
    });
  });

  describe("GET /api/v1/dev/usage", () => {
    it("retorna las métricas de consumo en tiempo real del tenant", async () => {
      (integrationGuard as any).mockResolvedValue({
        ok: true,
        client: { id: "client_uuid_101", projectId: 101, environment: "production" },
      });

      (db.query.installedProducts.findFirst as any).mockResolvedValue({
        plan: "starter",
      });

      (QuotaMeteringService.getUsageMetrics as any).mockResolvedValue({
        plan: "starter",
        environment: "production",
        monthlyEvents: {
          used: 4250,
          limit: 50000,
          remaining: 45750,
          resetDate: "2026-11-01T00:00:00.000Z",
        },
        rateLimit: {
          used: 12,
          limit: 300,
          remaining: 288,
          resetSeconds: 45,
        },
      });

      const req = new NextRequest("http://localhost:3000/api/v1/dev/usage");
      const res = await getUsage(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.plan).toBe("starter");
      expect(data.monthlyEvents.used).toBe(4250);
      expect(data.monthlyEvents.limit).toBe(50000);
      expect(data.rateLimit.limit).toBe(300);
    });
  });
});
