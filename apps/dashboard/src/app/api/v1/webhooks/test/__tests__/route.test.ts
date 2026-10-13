import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as webhookTestPost } from "../route";
import { IntegrationKeyService } from "@/lib/integrations/auth";

vi.mock("@/lib/integrations/auth", () => ({
  IntegrationKeyService: {
    validateKey: vi.fn(),
  },
}));

describe("POST /api/v1/webhooks/test (Phase 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("rechaza peticiones sin Authorization Bearer con 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/webhooks/test", {
      method: "POST",
      body: JSON.stringify({ targetUrl: "https://api.example.com/webhook" }),
    });

    const res = await webhookTestPost(req);
    expect(res.status).toBe(401);
  });

  it("rechaza URLs privadas o loopback por Anti-SSRF con 400", async () => {
    (IntegrationKeyService.validateKey as any).mockResolvedValue({
      id: "client-1",
      projectId: 101,
      environment: "staging",
    });

    const req = new NextRequest("http://localhost:3000/api/v1/webhooks/test", {
      method: "POST",
      headers: { authorization: "Bearer sk_test_valid_key_123" },
      body: JSON.stringify({ targetUrl: "http://127.0.0.1:8080/internal-admin" }),
    });

    const res = await webhookTestPost(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("SSRF_REJECTED");
  });

  it("despacha webhook ping exitosamente a URL pública válida", async () => {
    (IntegrationKeyService.validateKey as any).mockResolvedValue({
      id: "client-1",
      projectId: 101,
      environment: "staging",
    });

    (global.fetch as any).mockResolvedValue({
      status: 200,
      text: vi.fn().mockResolvedValue('{"received": true}'),
    });

    const req = new NextRequest("http://localhost:3000/api/v1/webhooks/test", {
      method: "POST",
      headers: { authorization: "Bearer sk_test_valid_key_123" },
      body: JSON.stringify({ targetUrl: "https://httpbin.org/post" }),
    });

    const res = await webhookTestPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.httpStatus).toBe(200);
  });
});
