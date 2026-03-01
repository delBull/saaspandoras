import { db } from "@/db";
import { purchases } from "@/db/schema";
import { gte, sql, and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // 1. Authorization Check
    const authHeader = req.headers.get("Authorization");
    const PANDORA_CORE_KEY = process.env.PANDORA_CORE_KEY;

    if (!PANDORA_CORE_KEY || authHeader !== `Bearer ${PANDORA_CORE_KEY}`) {
        // Also allow local/admin session check if needed, but for now strict S2S or Dashboard SWR
        // For Dashboard frontend SWR, we might need a different auth mechanism or allow Admin Token
        const dashboardAuth = req.headers.get("x-dashboard-auth");
        if (dashboardAuth !== process.env.DASHBOARD_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);

        // 2. Fetch Live Metrics (Last 60 minutes)

        // Purchase Intents Created (Any status)
        const intentsResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(purchases)
            .where(gte(purchases.createdAt, sixtyMinutesAgo));

        // Payments Completed (Status = 'completed')
        const completedResult = await db
            .select({ sum: sql<number>`sum(${purchases.amount})`, count: sql<number>`count(*)` })
            .from(purchases)
            .where(
                and(
                    gte(purchases.updatedAt, sixtyMinutesAgo),
                    eq(purchases.status, 'completed')
                )
            );

        const activeIntents = Number(intentsResult[0]?.count || 0);
        const paymentsCompleted = Number(completedResult[0]?.count || 0);
        const revenue60m = Number(completedResult[0]?.sum || 0);

        // Simulated Unlocked Protocols (could be linked to user table later)
        // For now, assume a 1:1 ratio with completed payments for the metric
        const protocolsUnlocked = paymentsCompleted;

        return NextResponse.json({
            status: "ok",
            window_minutes: 60,
            metrics: {
                active_intents: activeIntents,
                payments_completed: paymentsCompleted,
                revenue_usd: revenue60m,
                protocols_unlocked: protocolsUnlocked
            },
            timestamp: new Date().toISOString()
        });
    } catch (e: any) {
        console.error("Internal Live Metrics API Error:", e);
        return NextResponse.json({
            error: "Internal Server Error",
            message: e.message
        }, { status: 500 });
    }
}
