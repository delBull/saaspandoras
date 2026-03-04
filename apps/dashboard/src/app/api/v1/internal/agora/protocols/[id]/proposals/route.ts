import { NextRequest, NextResponse } from "next/server";
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
            const votesFor = p.votes.filter(v => v.support === 1).length;
            const votesAgainst = p.votes.filter(v => v.support === 0).length;
            const totalVPFor = p.votes.filter(v => v.support === 1).reduce((acc, v) => acc + (Number(v.weight) || 0), 0);
            const totalVPAgainst = p.votes.filter(v => v.support === 0).reduce((acc, v) => acc + (Number(v.weight) || 0), 0);

            return {
                ...p,
                metrics: {
                    votersCount: p.votes.length,
                    votesFor,
                    votesAgainst,
                    totalVPFor,
                    totalVPAgainst,
                    totalVP: totalVPFor + totalVPAgainst
                }
            };
        });

        return NextResponse.json(enrichedProposals);

    } catch (error) {
        console.error("[API] Error fetching proposals:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
