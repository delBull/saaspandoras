import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { purchases, projects, users, marketingIdentities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
        // 1. Find user by wallet (Direct or via Marketing Identity)
        const user = await db.query.users.findFirst({
            where: eq(users.walletAddress, wallet)
        });

        let targetUserId = user?.id;

        if (!targetUserId) {
            // Check in marketing identities (common for Telegram linked accounts)
            const identity = await db.query.marketingIdentities.findFirst({
                where: eq(marketingIdentities.walletAddress, wallet)
            });
            targetUserId = identity?.userId || undefined;
        }

        if (!targetUserId) {
            return NextResponse.json({ success: true, wallet, purchases: [] });
        }

        // 2. Get purchases for this user
        const userPurchases = await db.query.purchases.findMany({
            where: eq(purchases.userId, targetUserId),
            orderBy: [desc(purchases.createdAt)],
            with: {
                project: true
            }
        });

        return NextResponse.json({
            success: true,
            wallet,
            purchases: userPurchases.map(p => ({
                id: p.id,
                projectId: p.projectId,
                projectName: (p as any).project?.title || "Unknown Project",
                amount: p.amount,
                status: p.status, 
                paymentMethod: p.paymentMethod,
                createdAt: p.createdAt,
                referenceCode: p.purchaseId // In our schema it is purchaseId
            }))
        });

    } catch (e: any) {
        console.error("[external:users:purchases] Error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
