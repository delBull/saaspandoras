import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { governanceProposals } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

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
 * GET /api/v1/external/governance/proposals/[proposalId]
 * 
 * Returns details for a single proposal.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ proposalId: string }> }
) {
    const { client, error } = await validateExternalKey(req, "read:governance");
    if (error || !client) {
        return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    const { proposalId } = await params;
    const url = new URL(req.url);
    const protocolId = url.searchParams.get("protocolId");

    // FIX #8: Scope validation
    if (client.projectId !== null && client.projectId !== undefined && protocolId) {
        const parsedProtocolId = parseInt(protocolId);
        if (parsedProtocolId !== client.projectId) {
            return NextResponse.json({ 
                error: `API key restricted to project ${client.projectId}. You cannot access project ${parsedProtocolId}.` 
            }, { status: 403 });
        }
    }

    try {
        let whereClause = eq(governanceProposals.proposalId, proposalId);
        
        // FIX #8: If key is scoped to a project, filter by it automatically
        if (client.projectId !== null && client.projectId !== undefined && !protocolId) {
            whereClause = and(whereClause, eq(governanceProposals.protocolId, client.projectId)) as any;
        }

        if (protocolId) {
            const parsedProtocolId = parseInt(protocolId);
            if (!isNaN(parsedProtocolId)) {
                whereClause = and(whereClause, eq(governanceProposals.protocolId, parsedProtocolId)) as any;
            }
        }

        const proposal = await db.query.governanceProposals.findFirst({
            where: whereClause,
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
                targets: true,
                values: true,
                calldatas: true,
            },
        });

        if (!proposal) {
            return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            proposal: {
                ...proposal,
                status_name: PROPOSAL_STATUS[proposal.status as keyof typeof PROPOSAL_STATUS] ?? "Unknown",
                participationRate: Number(proposal.participationRate),
            }
        });

    } catch (e: any) {
        console.error("[external:governance:proposal:detail] Error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
