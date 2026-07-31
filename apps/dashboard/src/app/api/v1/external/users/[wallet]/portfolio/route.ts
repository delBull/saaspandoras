import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { daoMembers, projects, purchases, userBalances } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ wallet: string }> }
) {
    const { client, error } = await validateExternalKey(req, "read:users");
    if (error || !client) {
        return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    const { wallet } = await params;

    try {
        // 1. Get all memberships for this wallet
        const memberships = await db
            .select({
                projectId: daoMembers.projectId,
                votingPower: daoMembers.votingPower,
                artifactsCount: daoMembers.artifactsCount,
                projectSlug: projects.slug,
                projectName: projects.title,
            })
            .from(daoMembers)
            .leftJoin(projects, eq(daoMembers.projectId, projects.id))
            .where(eq(daoMembers.wallet, wallet));

        // 2. Get user balances (for global claimable rewards)
        const balance = await db.query.userBalances.findFirst({
            where: eq(userBalances.walletAddress, wallet)
        });

        // 3. Map with rewards
        const portfolio = memberships.map(m => ({
            projectId: m.projectId,
            projectSlug: m.projectSlug || "",
            projectName: m.projectName || "Unknown Project",
            votingPower: m.votingPower,
            artifactsCount: m.artifactsCount,
            claimableRewards: balance?.usdcBalance || "0.00", 
            currency: "USDC"
        }));

        return NextResponse.json({
            success: true,
            wallet,
            portfolio,
            totalVotingPower: portfolio.reduce((acc, curr) => acc + parseInt(curr.votingPower || "0"), 0)
        }, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
            }
        });

    } catch (e: any) {
        console.error("[external:users:portfolio] Error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
