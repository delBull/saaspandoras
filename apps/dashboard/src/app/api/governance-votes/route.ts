import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { governanceVotes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export function POST(req: NextRequest) {
    // Legacy endpoint: now handled by GovernanceIndexerService
    return NextResponse.json({ error: "Method not allowed. Use smart contract." }, { status: 405 });
}

export async function GET(req: NextRequest) {
    // Fetch aggregated votes for a proposal
    const { searchParams } = new URL(req.url);
    const proposalId = searchParams.get("proposalId");
    const voterAddress = searchParams.get("voterAddress");

    if (!proposalId) return NextResponse.json({ error: "Missing proposalId" }, { status: 400 });

    try {
        // We aggregate by string to avoid potential big decimal precision loss 
        const votesRes = await db
            .select({
                support: governanceVotes.support,
                totalWeight: sql<string>`sum(${governanceVotes.weight})`
            })
            .from(governanceVotes)
            .where(eq(governanceVotes.proposalId, proposalId))
            .groupBy(governanceVotes.support);

        // Map values assuming 0=Against, 1=For, 2=Abstain
        const votes = {
            for: "0",
            against: "0",
            abstain: "0"
        };

        votesRes.forEach(row => {
            if (row.support === 1) votes.for = row.totalWeight || "0";
            if (row.support === 0) votes.against = row.totalWeight || "0";
            if (row.support === 2) votes.abstain = row.totalWeight || "0";
        });

        let userVote = null;
        if (voterAddress) {
            const normalizedAddress = voterAddress.toLowerCase();
            const userRes = await db
                .select({ support: governanceVotes.support })
                .from(governanceVotes)
                .where(and(
                    eq(governanceVotes.proposalId, proposalId),
                    sql`lower(${governanceVotes.voterAddress}) = ${normalizedAddress}`
                ))
                .limit(1);

            if (userRes.length > 0 && userRes[0]) {
                userVote = userRes[0].support;
            }
        }

        return NextResponse.json({ votes, userVote });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
