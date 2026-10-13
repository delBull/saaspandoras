import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as bootstrapPost } from "../bootstrap/route";
import { POST as rotatePost } from "../keys/rotate/route";
import { getAuth } from "@saasfly/auth-sdk";
import { db } from "@saasfly/db-core";
import { TenantProvisioningService } from "@saasfly/shared";
import { IntegrationKeyService } from "@/lib/integrations/auth";

vi.mock("@saasfly/auth-sdk", () => ({
  getAuth: vi.fn(),
  isAdmin: vi.fn().mockResolvedValue(false),
}));

vi.mock("@saasfly/db-core", () => ({
  db: {
    query: {
      projects: {
        findFirst: vi.fn(),
      },
      integrationClients: {
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
        returning: vi.fn().mockResolvedValue([{ id: "uuid-client-1", keyFingerprint: "sk_test_..." }]),
      }),
    }),
  },
  projects: { id: "id", slug: "slug" },
  integrationClients: { id: "id", projectId: "projectId" },
  eq: vi.fn((a, b) => ({ a, b })),
}));

vi.mock("@saasfly/shared", () => {
  class MockTenantProvisioningService {
    sanitizeSlug(name: string) {
      return name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    }
    async provisionTenant() {
      return {
        success: true,
        organizationId: "101",
        organizationSlug: "acme-corp",
        organizationName: "Acme Corp",
        installedProducts: [{ id: 1, productFamily: "DEVELOPER", plan: "sandbox", status: "trial" }],
        redirectUrl: "/ecosystem/acme-corp",
        isIdempotentReplay: false,
      };
    }
  }
  return { TenantProvisioningService: MockTenantProvisioningService };
});

vi.mock("@/lib/integrations/auth", () => ({
  IntegrationKeyService: {
    ensureKeyForProject: vi.fn(),
  },
}));

describe("Sandbox Provisioning & Dev Console APIs (Phase 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/v1/dev/bootstrap", () => {
    it("rechaza peticiones sin sesión ni wallet con 401", async () => {
      (getAuth as any).mockResolvedValue({ session: null });

      const req = new NextRequest("http://localhost:3000/api/v1/dev/bootstrap", {
        method: "POST",
        body: JSON.stringify({ organizationName: "Acme Corp" }),
      });

      const res = await bootstrapPost(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("UNAUTHORIZED");
    });

    it("rechaza nombres vacíos de organización con 400", async () => {
      (getAuth as any).mockResolvedValue({
        session: { address: "0x1234567890123456789012345678901234567890" },
      });

      const req = new NextRequest("http://localhost:3000/api/v1/dev/bootstrap", {
        method: "POST",
        body: JSON.stringify({ organizationName: "   " }),
      });

      const res = await bootstrapPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("INVALID_REQUEST");
    });

    it("crea workspace en sandbox y emite credenciales sk_test_...", async () => {
      const wallet = "0x1234567890123456789012345678901234567890";
      (getAuth as any).mockResolvedValue({ session: { address: wallet } });

      (db.query.projects.findFirst as any).mockResolvedValue({
        id: 101,
        slug: "acme-corp",
        title: "Acme Corp",
        applicantWalletAddress: wallet,
        isSimulationMode: true,
      });

      (IntegrationKeyService.ensureKeyForProject as any)
        .mockReset()
        .mockResolvedValueOnce({
          id: "c-1",
          key: "sk_test_mocksecret123456",
          fingerprint: "sk_test_mock...",
          isNew: true,
        })
        .mockResolvedValueOnce({
          id: "c-2",
          key: "pk_test_mockpublic123456",
          fingerprint: "pk_test_mock...",
          isNew: true,
        });

      const req = new NextRequest("http://localhost:3000/api/v1/dev/bootstrap", {
        method: "POST",
        body: JSON.stringify({ organizationName: "Acme Corp" }),
      });

      const res = await bootstrapPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.tenant.slug).toBe("acme-corp");
      expect(data.tenant.isSimulationMode).toBe(true);
      expect(data.credentials.secretKey).toContain("sk_test_");
      expect(data.credentials.publicKey).toContain("pk_test_");
    });
  });

  describe("POST /api/v1/dev/keys/rotate", () => {
    it("bloquea rotación de credenciales a identidades ajenas con 403", async () => {
      (getAuth as any).mockResolvedValue({
        session: { address: "0xhacker0000000000000000000000000000000000" },
      });

      (db.query.projects.findFirst as any).mockResolvedValue({
        id: 101,
        slug: "acme-corp",
        title: "Acme Corp",
        applicantWalletAddress: "0xlegitowner000000000000000000000000000000",
      });

      const req = new NextRequest("http://localhost:3000/api/v1/dev/keys/rotate", {
        method: "POST",
        body: JSON.stringify({ slug: "acme-corp" }),
      });

      const res = await rotatePost(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("FORBIDDEN");
    });

    it("rota y revoca credenciales exitosamente para el dueño legítimo", async () => {
      const owner = "0xlegitowner000000000000000000000000000000";
      (getAuth as any).mockResolvedValue({ session: { address: owner } });

      (db.query.projects.findFirst as any).mockResolvedValue({
        id: 101,
        slug: "acme-corp",
        title: "Acme Corp",
        applicantWalletAddress: owner,
      });

      (IntegrationKeyService.ensureKeyForProject as any)
        .mockReset()
        .mockResolvedValueOnce({
          id: "c-rotated-1",
          key: "sk_test_rotated_secret_999",
          fingerprint: "sk_test_rot...",
          isNew: true,
        })
        .mockResolvedValueOnce({
          id: "c-rotated-2",
          key: "pk_test_rotated_public_999",
          fingerprint: "pk_test_rot...",
          isNew: true,
        });

      const req = new NextRequest("http://localhost:3000/api/v1/dev/keys/rotate", {
        method: "POST",
        body: JSON.stringify({ slug: "acme-corp" }),
      });

      const res = await rotatePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.credentials.secretKey).toBe("sk_test_rotated_secret_999");
      expect(data.credentials.isNew).toBe(true);
    });
  });
});
