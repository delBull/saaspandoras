
import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { db } from "@/db";
import { governanceVotes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const { proposalId, voterAddress, support, signature } = await req.json();

        if (!proposalId || !voterAddress || support === undefined || !signature) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // 1. Verify Signature
        const message = `Vote for Proposal #${proposalId}\nSupport: ${support}\nVoter: ${voterAddress}`;

        const isValid = await verifyMessage({
            address: voterAddress as `0x${string}`,
            message: message,
            signature: signature as `0x${string}`
        });

        if (!isValid) {
            console.error(`[VOTE_ERROR] Invalid signature for ${voterAddress}`);
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // 2. Upsert Vote using Drizzle
        await db.insert(governanceVotes)
            .values({
                proposalId,
                voterAddress: voterAddress.toLowerCase(), // Normalize casing
                support,
                signature
            })
            .onConflictDoUpdate({
                target: [governanceVotes.proposalId, governanceVotes.voterAddress],
                set: {
                    support,
                    signature,
                    createdAt: new Date()
                }
            });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[VOTE_ERROR] Error submitting vote:", error);
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    // Fetch votes for a proposal
    const { searchParams } = new URL(req.url);
    const proposalId = parseInt(searchParams.get("proposalId") || "0");
    const voterAddress = searchParams.get("voterAddress");

    if (!proposalId) return NextResponse.json({ error: "Missing proposalId" }, { status: 400 });

    try {
        // Aggregate votes
        const votesRes = await db
            .select({
                support: governanceVotes.support,
                count: sql<number>`count(*)`
            })
            .from(governanceVotes)
            .where(eq(governanceVotes.proposalId, proposalId))
            .groupBy(governanceVotes.support);

        const votes = {
            for: 0,
            against: 0,
            abstain: 0
        };

        votesRes.forEach(row => {
            if (row.support === 1) votes.for = Number(row.count);
            if (row.support === 0) votes.against = Number(row.count);
            if (row.support === 2) votes.abstain = Number(row.count);
        });

        let userVote = null;
        if (voterAddress) {
            const normalizedAddress = voterAddress.toLowerCase();
            const userRes = await db
                .select({ support: governanceVotes.support })
                .from(governanceVotes)
                .where(and(
                    eq(governanceVotes.proposalId, proposalId),
                    eq(governanceVotes.voterAddress, normalizedAddress)
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
