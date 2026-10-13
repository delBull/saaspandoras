import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as configureWebhook } from "../config/route";
import { getAuth, isAdmin } from "@saasfly/auth-sdk";
import { db } from "@saasfly/db-core";
import { validateWebhookDestinationUrl } from "@/lib/integrations/url-validator";

vi.mock("@saasfly/auth-sdk", () => ({
  getAuth: vi.fn(),
  isAdmin: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/integrations/url-validator", () => ({
  validateWebhookDestinationUrl: vi.fn(),
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
  },
  projects: { id: "id", slug: "slug" },
  integrationClients: { id: "id", projectId: "projectId", environment: "environment", isActive: "isActive" },
  eq: vi.fn((a, b) => ({ a, b })),
  and: vi.fn((...args) => ({ and: args })),
}));

describe("POST /api/v1/dev/webhooks/config (Phase 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza sin autenticación con 401", async () => {
    (getAuth as any).mockResolvedValue({ session: null });

    const req = new NextRequest("http://localhost:3000/api/v1/dev/webhooks/config", {
      method: "POST",
      body: JSON.stringify({ slug: "acme", callbackUrl: "https://acme.com/webhook" }),
    });

    const res = await configureWebhook(req);
    expect(res.status).toBe(401);
  });

  it("rechaza URLs que violan Anti-SSRF con 400", async () => {
    const owner = "0xowner111111111111111111111111111111111111";
    (getAuth as any).mockResolvedValue({ session: { address: owner } });

    (db.query.projects.findFirst as any).mockResolvedValue({
      id: 101,
      slug: "acme",
      applicantWalletAddress: owner,
      isSimulationMode: false,
    });

    (validateWebhookDestinationUrl as any).mockResolvedValue({
      isValid: false,
      error: "Destination points to private IP address (192.168.1.1)",
    });

    const req = new NextRequest("http://localhost:3000/api/v1/dev/webhooks/config", {
      method: "POST",
      body: JSON.stringify({ slug: "acme", callbackUrl: "http://192.168.1.1/hook" }),
    });

    const res = await configureWebhook(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("SSRF_REJECTED");
  });

  it("guarda URL de webhook y emite secreto HMAC seguro", async () => {
    const owner = "0xowner111111111111111111111111111111111111";
    (getAuth as any).mockResolvedValue({ session: { address: owner } });

    (db.query.projects.findFirst as any).mockResolvedValue({
      id: 101,
      slug: "acme",
      applicantWalletAddress: owner,
      isSimulationMode: true,
    });

    (validateWebhookDestinationUrl as any).mockResolvedValue({
      isValid: true,
      resolvedIp: "93.184.216.34",
    });

    (db.query.integrationClients.findFirst as any).mockResolvedValue({
      id: "client-uuid-101",
      callbackUrl: null,
      callbackSecretHash: null,
    });

    const req = new NextRequest("http://localhost:3000/api/v1/dev/webhooks/config", {
      method: "POST",
      body: JSON.stringify({ slug: "acme", callbackUrl: "https://example.com/webhook", rotateSecret: true }),
    });

    const res = await configureWebhook(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.webhook.callbackUrl).toBe("https://example.com/webhook");
    expect(data.webhook.secret).toContain("whsec_");
  });
});
