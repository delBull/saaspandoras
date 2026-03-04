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
        const supplySnapshot = parseFloat(proposal.totalVotingSupplySnapshot) || 1;

        const totalParticipation = votesFor + votesAgainst + votesAbstain;
        const participationRate = totalParticipation / supplySnapshot;
        const quorumReached = totalParticipation >= parseFloat(proposal.quorumSnapshot);

        return NextResponse.json({
            ...proposal,
            metrics: {
                votersCount: proposal.votes?.length || 0,
                participationRate,
                quorumReached,
                totalVotingSupplySnapshot: proposal.totalVotingSupplySnapshot,
                quorumSnapshot: proposal.quorumSnapshot
            }
        });

    } catch (error) {
        console.error("[API] Error fetching proposal detail:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
