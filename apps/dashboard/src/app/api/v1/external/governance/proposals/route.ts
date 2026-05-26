import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { governanceProposals, governanceVotes, projects } from "@/db/schema";
import { eq, desc, sql, and, or, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Governor status constants (matches OpenZeppelin Governor)
const PROPOSAL_STATUS = {
  0: "Pending",
  1: "Active",
  2: "Canceled",
  3: "Defeated",
  4: "Succeeded",
  5: "Queued",
  6: "Expired",
  7: "Executed",
} as const;

/**
 * GET /api/v1/external/governance/proposals
 *
 * Returns governance proposals from all protocols.
 * Requires API key with: read:governance
 *
 * Query params:
 *   status  — Pending | Active | Executed | Defeated | all (default: all)
 *   limit   — max 50 (default 20)
 *   offset  — default 0
 */
export async function GET(req: NextRequest) {
  const { client, error } = await validateExternalKey(req, "read:governance");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status"); // name like "Active"
    const protocolId = url.searchParams.get("protocolId");
    const limit  = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    // FIX #8: Scope validation - if API key has projectId restriction, only allow that project
    if (client.projectId !== null && client.projectId !== undefined && protocolId) {
      const parsedProtocolId = parseInt(protocolId);
      if (parsedProtocolId !== client.projectId) {
        return NextResponse.json({ 
          error: `API key restricted to project ${client.projectId}. You cannot access project ${parsedProtocolId}.` 
        }, { status: 403 });
      }
    }

    // Map status name → numeric code
    const statusCode = statusFilter
      ? Object.entries(PROPOSAL_STATUS).find(([, v]) => v.toLowerCase() === statusFilter.toLowerCase())?.[0]
      : null;

    let whereClause = statusCode !== null && statusCode !== undefined
      ? eq(governanceProposals.status, parseInt(statusCode))
      : undefined;

    // FIX #8: If key is scoped to a project, filter by it automatically
    if (client.projectId !== null && client.projectId !== undefined && !protocolId) {
      whereClause = eq(governanceProposals.protocolId, client.projectId);
    }

    // Filter by protocolId if provided
    if (protocolId) {
      const parsedProtocolId = parseInt(protocolId);
      if (!isNaN(parsedProtocolId)) {
        whereClause = whereClause 
          ? and(whereClause, eq(governanceProposals.protocolId, parsedProtocolId))
          : eq(governanceProposals.protocolId, parsedProtocolId);
      }
    }

    const proposals = await db.query.governanceProposals.findMany({
      where: whereClause,
      orderBy: [desc(governanceProposals.createdAt)],
      limit,
      offset,
      columns: {
        id: true,
        proposalId: true,
        protocolId: true,
        governorAddress: true,
        chainId: true,
        proposer: true,
        description: true,
        startBlock: true,
        endBlock: true,
        forVotes: true,
        againstVotes: true,
        abstainVotes: true,
        quorum: true,
        participationRate: true,
        quorumReached: true,
        status: true,
        isExecuted: true,
        isCanceled: true,
        createdTxHash: true,
        createdAt: true,
        updatedAt: true,
        // Internal governance data (not sensitive but not needed externally)
        targets: false,
        values: false,
        calldatas: false,
      },
    });

    // Summary stats
    const summaryQuery = db
      .select({
        status: governanceProposals.status,
        count: sql<number>`count(*)::int`,
      })
      .from(governanceProposals);

    if (whereClause) {
      summaryQuery.where(whereClause);
    }

    const summary = await summaryQuery.groupBy(governanceProposals.status);

    return NextResponse.json({
      success: true,
      proposals: proposals.map(p => ({
        ...p,
        status_name: PROPOSAL_STATUS[p.status as keyof typeof PROPOSAL_STATUS] ?? "Unknown",
        forVotes: p.forVotes,
        againstVotes: p.againstVotes,
        abstainVotes: p.abstainVotes,
        participationRate: Number(p.participationRate),
      })),
      summary: summary.map(s => ({
        status: s.status,
        status_name: PROPOSAL_STATUS[s.status as keyof typeof PROPOSAL_STATUS] ?? "Unknown",
        count: s.count,
      })),
      pagination: {
        limit,
        offset,
        returned: proposals.length,
        hasMore: proposals.length === limit,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[external:governance:proposals] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
