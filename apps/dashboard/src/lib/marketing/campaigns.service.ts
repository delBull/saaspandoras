import { db } from "@/db";
import { 
  campaigns, 
  demandDrafts, 
  demandEvents, 
  campaignStats, 
  projects 
} from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { PortalTenantContext } from "@/lib/portal/portal-types";
import { assertPortalPermission } from "@/lib/portal/permissions";

export class CampaignDomainService {
  constructor(private context: PortalTenantContext) {
    // Basic verification - this service operates solely within the bound organizationId (projectId)
    if (!context.organizationId) {
      throw new Error("CampaignDomainService requires a valid organizationId in context");
    }
  }

  /**
   * Persists a content draft with its "Content DNA".
   */
  async createDemandDraft(data: {
    hook: string;
    script: string;
    cta: string;
    angle?: string;
    emotion?: string;
    mechanism?: string;
  }) {
    // 1. Authorize Capability
    assertPortalPermission(this.context.permissions, 'growth.market_attack');

    // 2. We resolve projectId from the organizationId (tenantId)
    const projectId = await this.resolveProjectId();

    const fullContent = `HOOK: ${data.hook}\n\nSCRIPT: ${data.script}\n\nCTA: ${data.cta}`;

    // 3. Persist scoped to this project
    const [draft] = await db.insert(demandDrafts).values({
      projectId,
      hook: data.hook,
      script: data.script,
      cta: data.cta,
      fullContent,
      angle: data.angle || 'direct',
      emotion: data.emotion || 'neutral',
      mechanism: data.mechanism || 'manual',
      status: 'draft'
    }).returning();

    return { success: true, draft };
  }

  /**
   * Launches a unified campaign linked to a draft.
   */
  async launchCampaign(data: {
    draftId: number;
    name: string;
    platform: string;
    type?: string;
  }) {
    // 1. Authorize Capability
    assertPortalPermission(this.context.permissions, 'growth.market_attack');

    const projectId = await this.resolveProjectId();

    // Verify draft belongs to this tenant
    const [draft] = await db.select().from(demandDrafts).where(
      and(
        eq(demandDrafts.id, data.draftId),
        eq(demandDrafts.projectId, projectId)
      )
    );

    if (!draft) {
      throw new Error("Draft not found or unauthorized");
    }

    // 2. Create Campaign scoped to this project
    const [campaign] = await db.insert(campaigns).values({
      projectId,
      draftId: data.draftId,
      name: data.name || `Campaign_${Date.now()}`,
      source: 'manual', // or demand_engine based on logic
      platform: data.platform,
      type: data.type || 'conversion',
      status: 'active'
    }).returning();

    if (!campaign) {
      throw new Error("Failed to create campaign record");
    }

    // 3. Initialize Stats Cache
    await db.insert(campaignStats).values({
      campaignId: campaign.id,
      impressions: 0,
      clicks: 0,
      leads: 0,
      purchases: 0,
      revenue: "0",
      score: "0"
    });

    // 4. Update Draft Status
    await db.update(demandDrafts)
      .set({ status: 'campaign_ready', updatedAt: new Date() })
      .where(eq(demandDrafts.id, data.draftId));

    return { success: true, campaign };
  }

  /**
   * Fetch campaign performance analytics.
   */
  async getCampaignPerformance() {
    // 1. Authorize Capability
    assertPortalPermission(this.context.permissions, 'growth.analytics');

    const projectId = await this.resolveProjectId();

    const performance = await db.select({
      id: campaigns.id,
      name: campaigns.name,
      platform: campaigns.platform,
      source: campaigns.source,
      status: campaigns.status,
      // Content DNA
      hook: demandDrafts.hook,
      angle: demandDrafts.angle,
      emotion: demandDrafts.emotion,
      mechanism: demandDrafts.mechanism,
      // Stats
      impressions: campaignStats.impressions,
      clicks: campaignStats.clicks,
      leads: campaignStats.leads,
      purchases: campaignStats.purchases,
      revenue: campaignStats.revenue,
      score: campaignStats.score,
    })
    .from(campaigns)
    .leftJoin(demandDrafts, eq(campaigns.draftId, demandDrafts.id))
    .leftJoin(campaignStats, eq(campaigns.id, campaignStats.campaignId))
    .where(eq(campaigns.projectId, projectId)) // SECURE SCOPING
    .orderBy(desc(campaignStats.score));

    return performance;
  }

  /**
   * Helper to resolve the numerical projectId from the organizationId/tenantId UUID.
   * Growth OS tables currently use `projectId` instead of `tenantId`.
   */
  private async resolveProjectId(): Promise<number> {
    // Because organizationId is already verified by canonical auth, we just lookup the numeric ID.
    // If the canonical context already has projectId, use it. Otherwise fetch.
    const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, this.context.organizationSlug)).limit(1);
    if (!project) throw new Error("Project not found for organization");
    return project.id;
  }
}
