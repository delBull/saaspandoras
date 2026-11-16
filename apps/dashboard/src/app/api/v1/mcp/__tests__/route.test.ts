import { describe, it, expect, vi } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

vi.mock("@saasfly/db-core", () => ({
  db: {
    query: {
      protocolNavs: { findFirst: vi.fn().mockResolvedValue({ nav: "1.05" }) },
      pandoraBuybackPools: { findFirst: vi.fn().mockResolvedValue(null) },
      projects: { findFirst: vi.fn().mockResolvedValue({ slug: "snarai", title: "S'Narai" }) },
      governanceProposals: { findMany: vi.fn().mockResolvedValue([]) },
    },
  },
  protocolNavs: { protocolId: "protocolId", createdAt: "createdAt" },
  pandoraBuybackPools: { protocolId: "protocolId" },
  projects: { slug: "slug" },
  governanceProposals: { createdAt: "createdAt" },
  eq: vi.fn(),
  desc: vi.fn(),
}));

describe("MCP Server x402 Gateway (JSON-RPC 2.0)", () => {
  it("responds to 'initialize' with MCP server capabilities", async () => {
    const req = new NextRequest("https://dash.pandoras.finance/api/v1/mcp", {
      method: "POST",
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBe(1);
    expect(body.result.serverInfo.name).toContain("Pandoras");
    expect(body.result.serverInfo.x402Enabled).toBe(true);
  });

  it("responds to 'tools/list' with monetized Pandoras tools", async () => {
    const req = new NextRequest("https://dash.pandoras.finance/api/v1/mcp", {
      method: "POST",
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.result.tools).toHaveLength(3);
    const toolNames = body.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain("pandoras_get_nav");
    expect(toolNames).toContain("pandoras_get_protocol_details");
    expect(toolNames).toContain("pandoras_get_governance_proposals");
  });

  it("challenges 'tools/call' with HTTP 402 when no payment proof is provided", async () => {
    const req = new NextRequest("https://dash.pandoras.finance/api/v1/mcp", {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "pandoras_get_nav", arguments: { protocolId: 1 } },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(402);

    const paymentHeader = res.headers.get("PAYMENT-REQUIRED");
    expect(paymentHeader).toBeTruthy();

    const decoded = JSON.parse(Buffer.from(paymentHeader!, "base64").toString("utf-8"));
    expect(decoded.amountUsd).toBe(0.01);
    expect(decoded.currency).toBe("USDC");
  });
});
