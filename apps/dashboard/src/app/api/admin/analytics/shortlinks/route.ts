import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { and, asc, desc, eq, gte, lte, like } from "drizzle-orm";
import { shortlinkEvents } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Load dependencies dynamically to avoid build issues
let db: any = null;
let getAuth: any = null;
let isAdmin: any = null;

async function loadDependencies() {
  if (!db) {
    const dbModule = await import("~/db");
    db = dbModule.db;
  }
}

async function loadAuthHelpers() {
  if (!getAuth || !isAdmin) {
    const authModule = await import("@/lib/auth");
    getAuth = authModule.getAuth;
    isAdmin = authModule.isAdmin;
  }
}

export async function GET(req: NextRequest) {
  try {
    await loadDependencies();
    await loadAuthHelpers();

    // Auth check
    const { session } = await getAuth(await headers());
    if (!session?.userId || !await isAdmin(session.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    // Parameters
    const slug = searchParams.get("slug") || "w";
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const utmSource = searchParams.get("utm_source");
    const utmMedium = searchParams.get("utm_medium");
    const utmCampaign = searchParams.get("utm_campaign");
    const device = searchParams.get("device");
    const country = searchParams.get("country");

    // Build where conditions
    const conditions = [eq(shortlinkEvents.slug, slug)];

    if (dateFrom) {
      conditions.push(gte(shortlinkEvents.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(shortlinkEvents.createdAt, new Date(dateTo)));
    }

    if (utmSource && utmSource !== "all") {
      conditions.push(eq(shortlinkEvents.utmSource, utmSource));
    }

    if (utmMedium && utmMedium !== "all") {
      conditions.push(eq(shortlinkEvents.utmMedium, utmMedium));
    }

    if (utmCampaign && utmCampaign !== "all") {
      conditions.push(eq(shortlinkEvents.utmCampaign, utmCampaign));
    }

    if (device && device !== "all") {
      conditions.push(eq(shortlinkEvents.deviceType, device));
    }

    if (country && country !== "all") {
      conditions.push(eq(shortlinkEvents.country, country));
    }

    // Execute query
    const events = await db
      .select()
      .from(shortlinkEvents)
      .where(and(...conditions))
      .orderBy(desc(shortlinkEvents.createdAt));

    // Calculate totals for analytics
    const totalClicks = events.length;
    const totalSources = new Set(events.map((e: any) => e.utmSource).filter(Boolean)).size;
    const devicesBreakdown = events.reduce((acc: Record<string, number>, event: any) => {
      const device = event.deviceType || "unknown";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      events,
      totals: {
        total_clicks: totalClicks,
        total_sources: totalSources,
        devices_breakdown: devicesBreakdown
      },
      query: {
        slug,
        filters: {
          dateFrom,
          dateTo,
          utmSource,
          utmMedium,
          utmCampaign,
          device,
          country
        }
      }
    });

  } catch (error) {
    console.error("Shortlinks analytics API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
