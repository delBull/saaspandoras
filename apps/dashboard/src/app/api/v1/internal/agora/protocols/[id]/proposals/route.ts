import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { governanceProposals, governanceVotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const protocolId = parseInt(params.id);

        if (isNaN(protocolId)) {
            return NextResponse.json({ error: "Invalid protocol ID" }, { status: 400 });
        }

        // Fetch proposals with their votes
        const proposals = await db.query.governanceProposals.findMany({
            where: eq(governanceProposals.protocolId, protocolId),
            orderBy: [desc(governanceProposals.startBlock)],
            with: {
                votes: true // Requiere relation en schema.ts
            }
        });

        // Calculate aggregated metrics
        const enrichedProposals = proposals.map(p => {
            const votesFor = parseFloat(p.forVotes);
            const votesAgainst = parseFloat(p.againstVotes);
            const votesAbstain = parseFloat(p.abstainVotes);
            const supplySnapshot = parseFloat(p.totalVotingSupplySnapshot) || 1;

            const totalParticipation = votesFor + votesAgainst + votesAbstain;
            const participationRate = totalParticipation / supplySnapshot;
            const quorumReached = totalParticipation >= parseFloat(p.quorumSnapshot);

            return {
                ...p,
                metrics: {
                    votersCount: p.votes?.length || 0,
                    participationRate,
                    quorumReached,
                    totalVotingSupplySnapshot: p.totalVotingSupplySnapshot,
                    quorumSnapshot: p.quorumSnapshot
                }
            };
        });

        return NextResponse.json(enrichedProposals);

    } catch (error) {
        console.error("[API] Error fetching proposals:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
