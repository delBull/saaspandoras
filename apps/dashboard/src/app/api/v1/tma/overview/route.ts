import { NextResponse } from "next/server";
import { getCanonicalAuth } from "@/lib/auth";
import { db } from "@/db";
import { daoMembers, projects, userBalances } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // 1. Authenticate via F10 Canonical Identity (Boundary Lock)
        const auth = await getCanonicalAuth();
        if (!auth.isVerified || !auth.user?.walletAddress) {
            return NextResponse.json({ error: "Unauthorized. Valid Canonical Session required." }, { status: 401 });
        }

        const wallet = auth.user.walletAddress;

        // 2. Fetch User Portfolio (Memberships)
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

        // 3. Fetch User Global Balances / Rewards
        const balance = await db.query.userBalances.findFirst({
            where: eq(userBalances.walletAddress, wallet)
        });

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
            user: {
                id: auth.user.userId,
                walletAddress: wallet,
                hasPandorasKey: auth.user.hasPandorasKey
            },
            portfolio,
            totalVotingPower: portfolio.reduce((acc, curr) => acc + parseInt(curr.votingPower || "0"), 0),
            totalClaimable: balance?.usdcBalance || "0.00"
        });

    } catch (e: any) {
        console.error("❌ [TMA Overview] Error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
