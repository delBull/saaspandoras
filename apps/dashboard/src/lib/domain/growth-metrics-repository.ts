import { db } from "@/db";
import { marketingLeads } from "@/db/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";

export class GrowthMetricsRepository {
  static async getLeadsMetrics(last24h: Date, last7d: Date, last30d: Date) {
    const totalLeads = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(eq(marketingLeads.isDeleted, false)))[0]?.count ?? 0;
    const newLeads24h = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.isDeleted, false), gte(marketingLeads.createdAt, last24h))))[0]?.count ?? 0;
    const newLeads7d = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.isDeleted, false), gte(marketingLeads.createdAt, last7d))))[0]?.count ?? 0;
    const hotLeads = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.isDeleted, false), eq(marketingLeads.quality, "high"))))[0]?.count ?? 0;
    const convertedLeads = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.isDeleted, false), eq(marketingLeads.status, "converted"))))[0]?.count ?? 0;

    const qualityBreakdown = await db
      .select({ quality: marketingLeads.quality, count: sql<number>`count(*)::int` })
      .from(marketingLeads)
      .where(eq(marketingLeads.isDeleted, false))
      .groupBy(marketingLeads.quality);

    const sourcesRaw = await db
      .select({ source: marketingLeads.origin, count: sql<number>`count(*)::int` })
      .from(marketingLeads)
      .where(and(eq(marketingLeads.isDeleted, false), gte(marketingLeads.createdAt, last30d)))
      .groupBy(marketingLeads.origin)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10);

    const statusBreakdown = await db
      .select({ status: marketingLeads.status, count: sql<number>`count(*)::int` })
      .from(marketingLeads)
      .where(eq(marketingLeads.isDeleted, false))
      .groupBy(marketingLeads.status);

    const intentBreakdown = await db
      .select({ intent: marketingLeads.intent, count: sql<number>`count(*)::int` })
      .from(marketingLeads)
      .where(eq(marketingLeads.isDeleted, false))
      .groupBy(marketingLeads.intent);

    return {
      total: totalLeads,
      new_24h: newLeads24h,
      new_7d: newLeads7d,
      hot: hotLeads,
      converted: convertedLeads,
      qualityBreakdown,
      sourcesRaw,
      statusBreakdown,
      intentBreakdown
    };
  }

  static async getNewsletterMetrics(last24h: Date) {
    const { newsletterSubscribers } = await import("@/db/schema");
    const newsletterTotal = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers))[0]?.count ?? 0;
    const newsletterConfirmed = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.isConfirmed, true)))[0]?.count ?? 0;
    const newsletterNew24h = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers).where(gte(newsletterSubscribers.createdAt, last24h)))[0]?.count ?? 0;

    return {
      total_subscribers: newsletterTotal,
      confirmed: newsletterConfirmed,
      new_24h: newsletterNew24h
    };
  }
}
