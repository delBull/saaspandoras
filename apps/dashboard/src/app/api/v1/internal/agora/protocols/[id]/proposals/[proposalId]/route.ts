import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { governanceProposals } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string, proposalId: string }> }
) {
    try {
        const { id, proposalId } = await params;
        const protocolId = parseInt(id);

        if (isNaN(protocolId)) {
            return NextResponse.json({ error: "Invalid protocol ID" }, { status: 400 });
        }

        // Fetch single proposal with scoped keys
        const proposal = await db.query.governanceProposals.findFirst({
            where: and(
                eq(governanceProposals.protocolId, protocolId),
                eq(governanceProposals.proposalId, proposalId)
            ),
            with: {
                votes: true
            }
        });

        if (!proposal) {
            return NextResponse.json({ error: "Proposal not found in this protocol scope" }, { status: 404 });
        }

        // Calculate aggregated metrics (Institutional Logic)
        const votesFor = parseFloat(proposal.forVotes);
        const votesAgainst = parseFloat(proposal.againstVotes);
        const votesAbstain = parseFloat(proposal.abstainVotes);

        // CONSTITUTIONAL VALIDATION (No Fallback)
        const supplySnapshot = parseFloat(proposal.totalVotingSupplySnapshot);
        if (supplySnapshot <= 0 && !proposal.isInvalid) {
            return NextResponse.json({
                error: "Missing or invalid constitutional snapshot",
                detail: "Total voting supply at snapshot block is 0 or uninitialized."
            }, { status: 422 });
        }

        const totalParticipation = votesFor + votesAgainst + votesAbstain;

        // Deterministic Rounding (4 decimals)
        const rawParticipationRate = supplySnapshot > 0 ? totalParticipation / supplySnapshot : 0;
        const participationRate = Math.floor(rawParticipationRate * 10000) / 10000;

        const quorumSnapshot = parseFloat(proposal.quorumSnapshot);
        const quorumReached = totalParticipation >= quorumSnapshot;

        return NextResponse.json({
            ...proposal,
            metrics: {
                votersCount: proposal.votes?.length || 0,
                participationRate,
                quorumReached,
                totalVotingSupplySnapshot: proposal.totalVotingSupplySnapshot,
                quorumSnapshot: proposal.quorumSnapshot,
                blockNumberIndexed: proposal.blockNumberIndexed,
                indexerVersion: proposal.indexerVersion
            }
        });

    } catch (error) {
        console.error("[API] Error fetching proposal detail:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
