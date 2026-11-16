/**
 * 🔌 Model Context Protocol (MCP) Server Endpoint (JSON-RPC 2.0).
 * POST /api/v1/mcp
 *
 * Implements the standard MCP interface for Claude Desktop, Cursor, Windsurf,
 * and AI agent frameworks to autonomously consume Pandoras tools and RWA data.
 *
 * Each tool call is monetized via the open x402 Protocol in USDC on Base.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  extractX402Payment,
  buildX402Challenge,
  verifyX402Payment,
  attachX402Receipt,
  type X402PaymentConfig,
} from "@/lib/payments/x402";
import type { Hash } from "@/lib/payments/onchain-verify";
import { db } from "@saasfly/db-core";
import { protocolNavs, pandoraBuybackPools, projects, governanceProposals } from "@saasfly/db-core";
import { eq, desc } from "@saasfly/db-core";
import { harmonizeProject } from "@/lib/projects/harmonizer";

export const dynamic = "force-dynamic";

const MCP_TOOLS = [
  {
    name: "pandoras_get_nav",
    description: "Get real-time Net Asset Value (NAV), treasury backing, and buyback pool for an RWA protocol. Cost: $0.01 USDC on Base (x402).",
    priceUsd: 0.01,
    inputSchema: {
      type: "object",
      properties: {
        protocolId: { type: "number", description: "Protocol ID (e.g. 1)" },
      },
      required: ["protocolId"],
    },
  },
  {
    name: "pandoras_get_protocol_details",
    description: "Get full project metadata, token pricing, valuation, and funding progress. Cost: $0.005 USDC on Base (x402).",
    priceUsd: 0.005,
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Project slug (e.g. 'snarai')" },
      },
      required: ["slug"],
    },
  },
  {
    name: "pandoras_get_governance_proposals",
    description: "Get live DAO governance proposals, voting power, and quorum analytics. Cost: $0.002 USDC on Base (x402).",
    priceUsd: 0.002,
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Status filter (Active, Pending, Executed, Defeated)" },
      },
    },
  },
];

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }

  const { jsonrpc, id, method, params } = body;

  // 1. MCP Handshake: initialize
  if (method === "initialize") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
          name: "Pandoras Growth OS & Hermes Core MCP Server",
          version: "2.0.0",
          x402Enabled: true,
        },
      },
    });
  }

  // 2. MCP Tool Discovery: tools/list
  if (method === "tools/list") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: MCP_TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      },
    });
  }

  // 3. MCP Tool Execution: tools/call
  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments ?? {};
    const toolDef = MCP_TOOLS.find((t) => t.name === toolName);

    if (!toolDef) {
      return NextResponse.json(
        { jsonrpc: "2.0", id, error: { code: -32601, message: `Tool not found: ${toolName}` } },
        { status: 404 }
      );
    }

    // Enforce x402 Payment Gate for this tool
    const x402Config: X402PaymentConfig = {
      priceUsd: toolDef.priceUsd,
      description: `MCP Tool Execution: ${toolName}`,
    };

    const paymentProof = extractX402Payment(req);
    if (!paymentProof) {
      // Return HTTP 402 with machine-readable terms
      return buildX402Challenge(x402Config);
    }

    const verification = await verifyX402Payment(req, x402Config);
    if (!verification.ok) {
      return verification.challenge;
    }

    // Execute Tool Logic
    try {
      let toolResult: unknown;

      if (toolName === "pandoras_get_nav") {
        const protocolId = Number(args.protocolId ?? 1);
        const nav = await db.query.protocolNavs.findFirst({
          where: eq(protocolNavs.protocolId, protocolId),
          orderBy: [desc(protocolNavs.createdAt)],
        });
        const pool = await db.query.pandoraBuybackPools.findFirst({
          where: eq(pandoraBuybackPools.protocolId, protocolId),
        });
        toolResult = { nav, buybackPool: pool };
      } else if (toolName === "pandoras_get_protocol_details") {
        const slug = String(args.slug ?? "snarai");
        const project = await db.query.projects.findFirst({
          where: eq(projects.slug, slug),
        });
        toolResult = project ? harmonizeProject(project) : { error: "Project not found" };
      } else if (toolName === "pandoras_get_governance_proposals") {
        const list = await db.query.governanceProposals.findMany({
          limit: 20,
          orderBy: [desc(governanceProposals.createdAt)],
        });
        toolResult = { proposals: list };
      }

      const response = NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(toolResult, null, 2),
            },
          ],
        },
      });

      // Attach x402 settlement receipt
      return attachX402Receipt(response, {
        txHash: verification.txHash as Hash,
        amountUsd: verification.amountUsd,
      });
    } catch (toolErr: any) {
      return NextResponse.json(
        { jsonrpc: "2.0", id, error: { code: -32000, message: toolErr?.message ?? "Tool execution failed" } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not supported" } }, { status: 400 });
}
