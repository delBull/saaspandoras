import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "~/db";
import { getAuth, isAdmin } from "@/lib/auth";
import { shortlinkEvents, shortlinks } from "~/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        // Auth check
        const { session } = await getAuth(await headers());
        if (!session?.userId || !await isAdmin(session.userId)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");

        if (!slug) {
            // Global stats or error? For now, let's return error as we expect slug for detailed modal
            return NextResponse.json({ error: "Slug required" }, { status: 400 });
        }

        // 1. Fetch Basic Info
        const link = await db.query.shortlinks.findFirst({
            where: eq(shortlinks.slug, slug)
        });

        if (!link) {
            return NextResponse.json({ error: "Shortlink not found" }, { status: 404 });
        }

        // 2. Fetch Events (Limit to last 100 for table)
        const events = await db
            .select()
            .from(shortlinkEvents)
            .where(eq(shortlinkEvents.slug, slug))
            .orderBy(desc(shortlinkEvents.createdAt))
            .limit(100);

        // 3. Aggregate Stats
        // Total Clicks
        const totalClicksResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(shortlinkEvents)
            .where(eq(shortlinkEvents.slug, slug));

        // Unique IPs (Approx unique visitors)
        const uniqueVisitorsResult = await db
            .select({ count: sql<number>`count(distinct ${shortlinkEvents.ip})` })
            .from(shortlinkEvents)
            .where(eq(shortlinkEvents.slug, slug));

        // Timeline (Clicks per day for last 30 days) - Postgres specific
        // Simplified for now: just fetch all and process in frontend or use simple group by if Drizzle supports it easily with this driver
        // Let's use raw sql for daily truncate
        const dailyClicks = await db.execute(sql`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM ${shortlinkEvents}
        WHERE slug = ${slug}
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `);

        // Top Referrers
        const topReferrers = await db.execute(sql`
        SELECT referer, COUNT(*) as count
        FROM ${shortlinkEvents}
        WHERE slug = ${slug}
        GROUP BY referer
        ORDER BY count DESC
        LIMIT 5
    `);

        // Browser/Device
        const topBrowsers = await db.execute(sql`
        SELECT browser, COUNT(*) as count
        FROM ${shortlinkEvents}
        WHERE slug = ${slug}
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 5
    `);

        return NextResponse.json({
            slug,
            stats: {
                totalClicks: Number(totalClicksResult[0]?.count || 0),
                uniqueVisitors: Number(uniqueVisitorsResult[0]?.count || 0),
            },
            events,
            charts: {
                daily: dailyClicks,
                referrers: topReferrers,
                browsers: topBrowsers
            }
        });

    } catch (error) {
        console.error("Analytics API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
