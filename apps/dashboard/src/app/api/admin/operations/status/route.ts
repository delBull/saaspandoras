import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { webhookEvents, integrationClients } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // 1. Auth Check - Super Admin Only
        const { session } = await getAuth();
        const address = session?.address;

        const isUserAdmin = await isAdmin(address);
        if (!address || !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch Operational Metrics
        const webhooksEnabled = process.env.WEBHOOKS_ENABLED !== 'false';

        // Pending events count
        const pendingCount = await db.select({ count: sql<number>`count(*)` })
            .from(webhookEvents)
            .where(eq(webhookEvents.status, 'pending'));

        // Failed events count
        const failedCount = await db.select({ count: sql<number>`count(*)` })
            .from(webhookEvents)
            .where(eq(webhookEvents.status, 'failed'));

        // Recent failed events (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentFailures = await db.select({ count: sql<number>`count(*)` })
            .from(webhookEvents)
            .where(and(
                eq(webhookEvents.status, 'failed'),
                gte(webhookEvents.updatedAt, oneHourAgo)
            ));

        // Last successfully processed event
        const lastProcessed = await db.select({
            updatedAt: webhookEvents.updatedAt
        })
            .from(webhookEvents)
            .where(eq(webhookEvents.status, 'sent'))
            .orderBy(sql`${webhookEvents.updatedAt} DESC`)
            .limit(1);

        // Error rate (failed / total in last hour)
        const totalRecent = await db.select({ count: sql<number>`count(*)` })
            .from(webhookEvents)
            .where(gte(webhookEvents.updatedAt, oneHourAgo));

        const totalRecentCount = totalRecent[0]?.count || 0;
        const recentFailCount = recentFailures[0]?.count || 0;
        const errorRate = totalRecentCount > 0 ? (recentFailCount / totalRecentCount) * 100 : 0;

        return NextResponse.json({
            webhooksEnabled,
            pendingEvents: Number(pendingCount[0]?.count || 0),
            failedEvents: Number(failedCount[0]?.count || 0),
            recentFailures: Number(recentFailCount),
            lastProcessedAt: lastProcessed[0]?.updatedAt || null,
            errorRate: Math.round(errorRate * 100) / 100
        });

    } catch (error: any) {
        console.error("Operations Status Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
