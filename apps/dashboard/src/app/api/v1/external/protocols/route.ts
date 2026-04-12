import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { inArray, sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/protocols
 *
 * Returns list of active protocols with funding progress.
 * Requires API key with: read:protocols
 *
 * Query params:
 *   status  — live | approved | completed | all  (default: live,approved,completed)
 *   limit   — max 100 (default 50)
 *   offset  — pagination offset (default 0)
 */
export async function GET(req: NextRequest) {
  const { client, error } = await validateExternalKey(req, "read:protocols");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    const allowedStatuses = ["live", "approved", "completed", "pending", "draft"];

    const whereClause = statusFilter && allowedStatuses.includes(statusFilter)
      ? inArray(projects.status, [statusFilter as any])
      : inArray(projects.status, ["live", "approved", "completed"] as any[]);

    const list = await db.query.projects.findMany({
      where: whereClause,
      orderBy: [desc(projects.createdAt)],
      limit,
      offset,
      columns: {
        id: true,
        slug: true,
        title: true,
        status: true,
        businessCategory: true,
        tagline: true,
        description: true,
        targetAmount: true,
        raisedAmount: true,
        featured: true,
        accessType: true,
        price: true,
        totalValuationUsd: true,
        tokenType: true,
        estimatedApy: true,
        website: true,
        twitterUrl: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        // Always exclude sensitive/internal fields
        discordWebhookUrl: false,
        applicantEmail: false,
        applicantName: false,
        applicantPhone: false,
        applicantWalletAddress: false,
        applicantPosition: false,
      },
    });

    const countResult = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(projects)
      .where(whereClause);
    const total = countResult[0]?.total ?? 0;

    return NextResponse.json({
      success: true,
      protocols: list.map(p => ({
        ...p,
        targetAmount: p.targetAmount ? Number(p.targetAmount) : null,
        raisedAmount: p.raisedAmount ? Number(p.raisedAmount) : null,
        totalValuationUsd: p.totalValuationUsd ? Number(p.totalValuationUsd) : null,
        price: p.price ? Number(p.price) : null,
        fundingProgress: p.targetAmount && p.raisedAmount
          ? Math.round((Number(p.raisedAmount) / Number(p.targetAmount)) * 100)
          : 0,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[external:protocols] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
