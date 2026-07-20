import { db } from "@/db";
import { campaigns, campaignStats, projects, demandEvents, campaignTrackers, shortlinks, campaignAssets, platformAssets, marketingCampaigns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { EventRepository } from "./event-repository";

export class CampaignRepository {
  static async findAllCampaigns() {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  static async findAllAutomations() {
    return await db.select().from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt));
  }

  static async findByProjectId(projectId: number) {
    return await db.select().from(campaigns).where(eq(campaigns.projectId, projectId));
  }

  static async createCampaign(projectId: number, data: any) {
    const [inserted] = await db.insert(campaigns).values({
      projectId,
      name: data.name || 'New Campaign',
      status: 'paused',
      type: data.type || 'awareness',
      budget: '0'
    }).returning({ id: campaigns.id });
    return inserted?.id || 0;
  }

  /**
   * Obtiene el agregado completo de una campaña para el Dashboard
   */
  static async getCampaignDashboardData(campaignId: number) {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    if (!campaign) return null;

    const [stats] = await db.select().from(campaignStats).where(eq(campaignStats.campaignId, campaignId));

    const [project] = await db.select().from(projects).where(eq(projects.id, campaign.projectId));

    const pEvents = await EventRepository.getEventsByProject(campaign.projectId);

    const dEvents = await db.select()
        .from(demandEvents)
        .where(eq(demandEvents.campaignId, campaignId))
        .orderBy(desc(demandEvents.createdAt))
        .limit(50);

    const trackers = await db.select({
        id: shortlinks.id,
        slug: shortlinks.slug,
        destinationUrl: shortlinks.destinationUrl,
        title: shortlinks.title,
        createdAt: campaignTrackers.createdAt
    })
    .from(campaignTrackers)
    .innerJoin(shortlinks, eq(campaignTrackers.shortlinkId, shortlinks.id))
    .where(eq(campaignTrackers.campaignId, campaignId))
    .orderBy(desc(campaignTrackers.createdAt));

    const cAssets = await db.select({
        id: platformAssets.id,
        type: platformAssets.type,
        title: platformAssets.title,
        status: platformAssets.status,
        visibility: platformAssets.visibility,
        version: platformAssets.version,
        description: platformAssets.description,
        url: platformAssets.url,
        tags: platformAssets.tags,
        clicks: platformAssets.clicks,
        views: platformAssets.views,
        linkedCampaignCount: platformAssets.linkedCampaignCount,
        createdAt: campaignAssets.createdAt
    })
    .from(campaignAssets)
    .innerJoin(platformAssets, eq(campaignAssets.assetId, platformAssets.id))
    .where(eq(campaignAssets.campaignId, campaignId))
    .orderBy(desc(campaignAssets.createdAt));

    const allProjectResources = await db.select()
        .from(platformAssets)
        .where(eq(platformAssets.projectId, campaign.projectId))
        .orderBy(desc(platformAssets.createdAt));

    return {
      campaign,
      stats,
      project,
      pEvents,
      dEvents,
      trackers,
      cAssets,
      allProjectResources
    };
  }
}
