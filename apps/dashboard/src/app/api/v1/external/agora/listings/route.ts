import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { agoraListings, protocolNavs, pandoraBuybackPools, projects } from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/agora/listings
 *
 * Returns active Agora Market listings with protocol context.
 * Requires API key with: read:agora
 *
 * Query params:
 *   status  — ACTIVE | SOLD | CANCELLED | all (default: ACTIVE)
 *   limit   — max 100 (default 50)
 *   offset  — pagination offset (default 0)
 */
export async function GET(req: NextRequest) {
  const { client, error } = await validateExternalKey(req, "read:agora");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") ?? "ACTIVE";
    const limit  = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    const allowedStatuses = ["ACTIVE", "SOLD", "CANCELLED", "LOCKED", "ROFR_PENDING"];
    const whereClause = statusFilter === "all"
      ? undefined
      : allowedStatuses.includes(statusFilter)
        ? eq(agoraListings.status, statusFilter as any)
        : eq(agoraListings.status, "ACTIVE" as any);

    const listings = await db.query.agoraListings.findMany({
      where: whereClause,
      orderBy: [desc(agoraListings.createdAt)],
      limit,
      offset,
      columns: {
        id: true,
        protocolId: true,
        artifactId: true,
        price: true,
        status: true,
        lockedAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
        // Strip seller identity
        sellerTelegramId: false,
        idempotencyKey: false,
      },
    });

    const countResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(agoraListings)
      .where(whereClause);
    const total = countResult[0]?.count ?? listings.length;

    // Aggregate: total volume by status
    const volume = await db
      .select({
        status: agoraListings.status,
        count: sql<number>`count(*)::int`,
        total_value: sql<string>`coalesce(sum(price::numeric), 0)::text`,
      })
      .from(agoraListings)
      .groupBy(agoraListings.status);

    return NextResponse.json({
      success: true,
      listings: listings.map(l => ({
        ...l,
        price: Number(l.price),
      })),
      market_summary: volume.map(v => ({
        status: v.status,
        count: v.count,
        total_value: Number(v.total_value),
      })),
      pagination: {
        limit,
        offset,
        returned: listings.length,
        hasMore: listings.length === limit,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[external:agora:listings] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
