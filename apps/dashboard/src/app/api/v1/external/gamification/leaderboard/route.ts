import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { gamificationProfiles, users, pboxClaims } from "@/db/schema";
import { sql, desc, eq, and, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/gamification/leaderboard
 *
 * Returns top users by points (no PII — only wallet address and stats).
 * Requires API key with: read:gamification
 *
 * Query params:
 *   limit — max 50 (default 20)
 *   page  — page number (default 1)
 */
export async function GET(req: NextRequest) {
  const { client, error } = await validateExternalKey(req, "read:gamification");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);
    const page  = Math.max(parseInt(url.searchParams.get("page") ?? "1"), 1);
    const offset = (page - 1) * limit;

    // Top profiles by totalPoints
    const topProfiles = await db.query.gamificationProfiles.findMany({
      orderBy: [desc(gamificationProfiles.totalPoints)],
      limit,
      offset,
      columns: {
        id: true,
        walletAddress: true,
        totalPoints: true,
        claimedPoints: true,
        currentLevel: true,
        levelProgress: true,
        communityRank: true,
        reputationScore: true,
        currentStreak: true,
        longestStreak: true,
        totalActiveDays: true,
        referralsCount: true,
        projectsApproved: true,
        totalInvested: true,
        lastActivityDate: true,
        // userId is internal — expose wallet only
        userId: false,
      },
    });

    // Global stats
    const [totalProfiles, avgPoints, totalPboxClaimed] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(gamificationProfiles),
      db.select({ avg: sql<number>`round(avg(total_points))::int` }).from(gamificationProfiles),
      db.select({ total: sql<number>`coalesce(sum(amount_claimed)::numeric, 0)::numeric` }).from(pboxClaims).where(eq(pboxClaims.status, "completed")),
    ]);

    return NextResponse.json({
      success: true,
      leaderboard: topProfiles.map((p, idx) => ({
        rank: offset + idx + 1,
        wallet: p.walletAddress,
        level: p.currentLevel,
        total_points: p.totalPoints,
        claimed_pbox: p.claimedPoints,
        reputation: p.reputationScore,
        current_streak: p.currentStreak,
        longest_streak: p.longestStreak,
        active_days: p.totalActiveDays,
        referrals: p.referralsCount,
        last_active: p.lastActivityDate,
      })),
      global_stats: {
        total_participants: totalProfiles[0]?.count ?? 0,
        avg_points: avgPoints[0]?.avg ?? 0,
        total_pbox_claimed: Number(totalPboxClaimed[0]?.total ?? 0),
      },
      pagination: { page, limit },
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[external:gamification:leaderboard] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
