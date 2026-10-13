import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { QuotaMeteringService } from "@/lib/integrations/quota-metering";
import { POST as eventsPost } from "@/app/api/v1/integrations/events/route";
import { POST as activateLivePost } from "@/app/api/v1/dev/keys/activate-live/route";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { checkRateLimit } from "@/lib/deal-signing/rate-limit";
import { getAuth, isAdmin } from "@saasfly/auth-sdk";
import { db } from "@saasfly/db-core";

vi.mock("@/lib/deal-signing/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@saasfly/auth-sdk", () => ({
  getAuth: vi.fn(),
  isAdmin: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/integrations/auth", () => ({
  IntegrationKeyService: {
    validateKey: vi.fn(),
    ensureKeyForProject: vi.fn(),
  },
}));

vi.mock("@saasfly/db-core", () => ({
  db: {
    query: {
      projects: {
        findFirst: vi.fn(),
      },
      platformEvents: {
        findFirst: vi.fn(),
      },
      marketingIdentities: {
        findFirst: vi.fn(),
      },
      installedProducts: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1, canonicalId: "canon_1", primaryEmail: "dev@acme.com" }]),
      }),
    }),
  },
  projects: { id: "id", slug: "slug" },
  platformEvents: { id: "id" },
  canonicalIdentities: { id: "id" },
  installedProducts: { id: "id", projectId: "projectId", plan: "plan", status: "status" },
  marketingIdentities: { id: "id", phone: "phone", email: "email", fingerprint: "fingerprint" },
  users: { id: "id" },
  eq: vi.fn((a, b) => ({ a, b })),
  or: vi.fn((...conds) => conds),
  and: vi.fn((...conds) => conds),
  inArray: vi.fn((...vals) => ({ inArray: true, vals })),
}));

describe("Phase 3 — Metering, Quotas & Production Activation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("QuotaMeteringService", () => {
    it("permite peticiones cuando el consumo está dentro del límite", async () => {
      (checkRateLimit as any).mockResolvedValue({
        allowed: true,
        limit: 120,
        remaining: 119,
        resetMs: 60000,
        retryAfterMs: 0,
      });

      const res = await QuotaMeteringService.checkEventQuota({
        clientId: "client-sandbox-1",
        projectId: 101,
        environment: "staging",
      });

      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(119);
    });

    it("rechaza peticiones con rate_limit fail-closed cuando se satura el minuto", async () => {
      (checkRateLimit as any).mockResolvedValueOnce({
        allowed: false,
        limit: 120,
        remaining: 0,
        resetMs: 45000,
        retryAfterMs: 45000,
      });

      const res = await QuotaMeteringService.checkEventQuota({
        clientId: "client-sandbox-1",
        projectId: 101,
        environment: "staging",
      });

      expect(res.allowed).toBe(false);
      expect(res.quotaType).toBe("rate_limit");
      expect(res.retryAfterSeconds).toBe(45);
      expect(res.reason).toContain("Excedido límite");
    });
  });

  describe("POST /api/v1/integrations/events con Quota Gate", () => {
    it("retorna 429 TOO_MANY_REQUESTS y headers estándar cuando se supera la cuota", async () => {
      (IntegrationKeyService.validateKey as any).mockResolvedValue({
        id: "client-sandbox-1",
        projectId: 101,
        environment: "staging",
        permissions: ["events:write"],
      });

      (checkRateLimit as any).mockResolvedValueOnce({
        allowed: false,
        limit: 120,
        remaining: 0,
        resetMs: 30000,
        retryAfterMs: 30000,
      });

      const req = new NextRequest("http://localhost:3000/api/v1/integrations/events", {
        method: "POST",
        headers: {
          authorization: "Bearer sk_test_valid_sandbox_key",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          eventId: "evt_test_quota_123",
          eventType: "lead.new",
          projectId: 101,
          payload: { email: "lead@test.com" },
        }),
      });

      const res = await eventsPost(req);
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("30");
      expect(res.headers.get("X-RateLimit-Limit")).toBe("120");
      const data = await res.json();
      expect(data.error).toBe("TOO_MANY_REQUESTS");
    });
  });

  describe("POST /api/v1/dev/keys/activate-live", () => {
    it("activa simulación a producción y emite credenciales live para el dueño", async () => {
      const owner = "0xowner000000000000000000000000000000000000";
      (getAuth as any).mockResolvedValue({ session: { address: owner } });

      (db.query.projects.findFirst as any).mockResolvedValue({
        id: 101,
        slug: "acme-corp",
        title: "Acme Corp",
        applicantWalletAddress: owner,
        isSimulationMode: true,
      });

      // Entitlement comercial DEV_ACCESS activo (requisito para activación live)
      (db.query.installedProducts.findFirst as any).mockResolvedValue({
        id: "ip-1",
        plan: "starter",
        status: "trial",
      });

      (IntegrationKeyService.ensureKeyForProject as any)
        .mockResolvedValueOnce({
          id: "live-secret-1",
          key: "sk_live_prodsecret_12345",
          fingerprint: "sk_live_prod...",
          isNew: true,
        })
        .mockResolvedValueOnce({
          id: "live-public-1",
          key: "pk_live_prodpublic_12345",
          fingerprint: "pk_live_prod...",
          isNew: true,
        });

      const req = new NextRequest("http://localhost:3000/api/v1/dev/keys/activate-live", {
        method: "POST",
        body: JSON.stringify({ slug: "acme-corp" }),
      });

      const res = await activateLivePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.tenant.isSimulationMode).toBe(false);
      expect(data.credentials.environment).toBe("production");
      expect(data.credentials.secretKey).toContain("sk_live_");
    });

    it("rechaza con 402 PAYMENT_REQUIRED cuando no hay entitlement comercial DEV_ACCESS activo", async () => {
      const owner = "0xowner000000000000000000000000000000000000";
      (getAuth as any).mockResolvedValue({ session: { address: owner } });

      (db.query.projects.findFirst as any).mockResolvedValue({
        id: 102,
        slug: "sandbox-only",
        title: "Sandbox Only",
        applicantWalletAddress: owner,
        isSimulationMode: true,
      });

      // Sin DEV_ACCESS comercial: findFirst resuelve a null (no entitlement)
      (db.query.installedProducts.findFirst as any).mockResolvedValue(null);

      (IntegrationKeyService.ensureKeyForProject as any).mockReset();

      const req = new NextRequest("http://localhost:3000/api/v1/dev/keys/activate-live", {
        method: "POST",
        body: JSON.stringify({ slug: "sandbox-only" }),
      });

      const res = await activateLivePost(req);
      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.error).toBe("PAYMENT_REQUIRED");
      // No debe emitirse ninguna credencial live
      expect(IntegrationKeyService.ensureKeyForProject).not.toHaveBeenCalled();
      expect(data.credentials).toBeUndefined();
    });
  });
});
