import { describe, it, expect, vi } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

// Mock database to avoid real DB hits during route gate test
vi.mock("@saasfly/db-core", () => ({
  db: {
    query: {
      protocolNavs: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      pandoraBuybackPools: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
  protocolNavs: { protocolId: "protocolId", createdAt: "createdAt" },
  pandoraBuybackPools: { protocolId: "protocolId" },
  projects: {},
  eq: vi.fn(),
  desc: vi.fn(),
  and: vi.fn(),
}));

// Mock validateExternalKey to simulate no API key present (AI agent scenario)
vi.mock("@/lib/api-auth/validate-external-key", () => ({
  validateExternalKey: vi.fn().mockResolvedValue({ client: null, error: "Missing API key" }),
}));

describe("Agora NAV Route x402 Gateway", () => {
  it("challenges anonymous AI agents with HTTP 402 and x402 headers when no API key provided", async () => {
    const req = new NextRequest("https://dash.pandoras.finance/api/v1/external/agora/nav/1");
    const params = Promise.resolve({ protocolId: "1" });

    const res = await GET(req, { params });

    expect(res.status).toBe(402);

    const paymentRequiredHeader = res.headers.get("PAYMENT-REQUIRED");
    expect(paymentRequiredHeader).toBeTruthy();

    const decoded = JSON.parse(
      Buffer.from(paymentRequiredHeader!, "base64").toString("utf-8")
    );
    expect(decoded.x402Version).toBe("2.0");
    expect(decoded.amountUsd).toBe(0.01);
    expect(decoded.currency).toBe("USDC");
    expect(decoded.payTo).toBeTruthy();

    const body = await res.json();
    expect(body.error).toBe("PAYMENT_REQUIRED");
    expect(body.statusCode).toBe(402);
  });
});
