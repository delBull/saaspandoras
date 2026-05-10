import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { daoMembers, projects, purchases } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    { params }: { params: { wallet: string } }
) {
    const { client, error } = await validateExternalKey(req, "read:users");
    if (error || !client) {
        return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    const { wallet } = params;

    try {
        // 1. Get all memberships for this wallet
        const memberships = await db.query.daoMembers.findMany({
            where: eq(daoMembers.wallet, wallet),
            with: {
                project: true
            }
        });

        // 2. Map with rewards (this is a simplified version, real yield might be complex)
        // For now, we return the voting power and a placeholder for rewards if not yet distributed
        const portfolio = memberships.map(m => ({
            projectId: m.projectId,
            projectSlug: (m as any).project?.slug || "",
            projectName: (m as any).project?.title || "Unknown Project",
            votingPower: m.votingPower,
            artifactsCount: m.artifactsCount,
            // In a real scenario, you'd fetch distributed rewards from a distributions table
            // For now, we'll return 0 or fetch from a hypothetical rewards field if it existed
            claimableRewards: "0.00", 
            currency: "USDC"
        }));

        return NextResponse.json({
            success: true,
            wallet,
            portfolio,
            totalVotingPower: portfolio.reduce((acc, curr) => acc + parseInt(curr.votingPower || "0"), 0)
        });

    } catch (e: any) {
        console.error("[external:users:portfolio] Error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
