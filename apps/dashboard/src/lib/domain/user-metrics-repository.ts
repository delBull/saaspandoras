import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql, not, isNull, gte } from "drizzle-orm";

export class UserMetricsRepository {
  /**
   * Obtiene estadísticas agregadas de usuarios
   */
  static async getUserStats(last7d: Date, last30d: Date) {
    const [totalUsers, activeUsers, initiatedUsers, kycUsers, walletUsers, newLast7d, newLast30d] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.status, "ACTIVE")),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(not(isNull(users.ritualCompletedAt))),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.kycCompleted, true)),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(not(isNull(users.walletAddress))),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(gte(users.createdAt, last7d)),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(gte(users.createdAt, last30d)),
    ]);

    const bySource = await db
      .select({
        source: users.acquisitionSource,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.acquisitionSource)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const byCohort = await db
      .select({
        cohort: users.accessCohort,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.accessCohort);

    const byTier = await db
      .select({
        tier: users.benefitsTier,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.benefitsTier);

    return {
      core: {
        total: totalUsers[0]?.count ?? 0,
        active: activeUsers[0]?.count ?? 0,
        initiated: initiatedUsers[0]?.count ?? 0,
        kycCompleted: kycUsers[0]?.count ?? 0,
        walletConnected: walletUsers[0]?.count ?? 0,
        newLast7d: newLast7d[0]?.count ?? 0,
        newLast30d: newLast30d[0]?.count ?? 0,
      },
      breakdowns: {
        bySource,
        byCohort,
        byTier
      }
    };
  }
}
