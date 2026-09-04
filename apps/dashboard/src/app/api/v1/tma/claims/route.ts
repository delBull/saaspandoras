import { NextResponse } from "next/server";
import { getCanonicalAuth } from "@/lib/auth";
import { db } from "@/db";
import { purchases, projects, userBalances } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // 1. Authenticate via F10 Canonical Identity
        const auth = await getCanonicalAuth();
        if (!auth.isVerified || !auth.user?.userId) {
            return NextResponse.json({ error: "Unauthorized. Valid Canonical Session required." }, { status: 401 });
        }

        const userId = auth.user.userId;
        const wallet = auth.user.walletAddress;

        // 2. Fetch User Purchases / Claim Contracts
        const userPurchases = await db
            .select({
                id: purchases.id,
                purchaseId: purchases.purchaseId,
                amount: purchases.amount,
                currency: purchases.currency,
                status: purchases.status,
                tokenId: purchases.tokenId,
                transactionHash: purchases.transactionHash,
                legalPortalUrl: purchases.legalPortalUrl,
                agreementId: purchases.agreementId,
                createdAt: purchases.createdAt,
                projectSlug: projects.slug,
                projectName: projects.title,
            })
            .from(purchases)
            .leftJoin(projects, eq(purchases.projectId, projects.id))
            .where(eq(purchases.userId, userId))
            .orderBy(desc(purchases.createdAt))
            .limit(50);

        // 3. Fetch User Balances (Claimable USDC from protocol distributions)
        const balance = await db.query.userBalances.findFirst({
            where: eq(userBalances.walletAddress, wallet)
        });

        return NextResponse.json({
            success: true,
            user: {
                id: userId,
                walletAddress: wallet
            },
            claims: userPurchases.map(p => ({
                id: p.id,
                purchaseId: p.purchaseId,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                tokenId: p.tokenId,
                transactionHash: p.transactionHash,
                legalPortalUrl: p.legalPortalUrl,
                agreementId: p.agreementId,
                createdAt: p.createdAt,
                project: {
                    slug: p.projectSlug || "",
                    name: p.projectName || "Unknown Project"
                }
            })),
            claimableBalance: balance?.usdcBalance || "0.00"
        });

    } catch (e: any) {
        console.error("❌ [TMA Claims] Error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
