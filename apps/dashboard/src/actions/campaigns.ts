'use server';

import { db } from "@/db";
import { 
  campaigns, 
  demandDrafts, 
  demandEvents, 
  campaignStats, 
  projects 
} from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { shortlinks, campaignTrackers } from "@/db/schema";

/**
 * Persists a content draft with its "Content DNA".
 */
export async function createDemandDraft(data: {
  projectId: number;
  hook: string;
  script: string;
  cta: string;
  angle?: string;
  emotion?: string;
  mechanism?: string;
}) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");

    const fullContent = `HOOK: ${data.hook}\n\nSCRIPT: ${data.script}\n\nCTA: ${data.cta}`;

    const [draft] = await db.insert(demandDrafts).values({
      projectId: data.projectId,
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
  } catch (error) {
    console.error("Error creating demand draft:", error);
    return { success: false, error: "Failed to create draft" };
  }
}

/**
 * Launches a unified campaign linked to a draft.
 */
export async function launchCampaign(data: {
  projectId: number;
  draftId: number;
  name: string;
  platform: string;
  type?: string;
}) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");

    // 1. Create Campaign
    const [campaign] = await db.insert(campaigns).values({
      projectId: data.projectId,
      draftId: data.draftId,
      name: data.name || `Campaign_${Date.now()}`, // Fallback naming
      source: 'demand_engine',
      platform: data.platform,
      type: data.type || 'conversion',
      status: 'active'
    }).returning();

    if (!campaign) {
      throw new Error("Failed to create campaign record");
    }

    // 2. Initialize Stats Cache
    await db.insert(campaignStats).values({
      campaignId: campaign.id,
      impressions: 0,
      clicks: 0,
      leads: 0,
      purchases: 0,
      revenue: "0",
      score: "0"
    });

    // 3. Update Draft Status
    await db.update(demandDrafts)
      .set({ status: 'campaign_ready', updatedAt: new Date() })
      .where(eq(demandDrafts.id, data.draftId));

    revalidatePath('/marketing');
    return { success: true, campaign };
  } catch (error) {
    console.error("Error launching campaign:", error);
    return { success: false, error: "Failed to launch campaign" };
  }
}

/**
 * Creates a tracker link (shortlink) for a campaign.
 */
export async function createCampaignTracker(data: {
  campaignId: number;
  slug: string;
  destinationUrl: string;
  title?: string;
  description?: string;
  source?: string;
  medium?: string;
  assetId?: number;
}) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) throw new Error("Unauthorized");

    // 1. Create shortlink
    const [shortlink] = await db.insert(shortlinks).values({
      slug: data.slug,
      destinationUrl: data.destinationUrl,
      title: data.title || "Campaign Tracker",
      description: data.description || `Tracker for campaign ${data.campaignId}`,
      type: "redirect",
      isActive: true,
      assetId: data.assetId,
      createdBy: session.address
    }).returning();

    if (!shortlink) {
      throw new Error("Failed to create shortlink");
    }

    // 2. Bind to Campaign Trackers
    await db.insert(campaignTrackers).values({
      campaignId: data.campaignId,
      shortlinkId: shortlink.id
    });

    revalidatePath('/admin/marketing');
    return { success: true, shortlink };
  } catch (error: any) {
    console.error("Error creating campaign tracker:", error);
    // Return explicit error if slug exists
    if (error.code === '23505' || error.message.includes('unique')) {
      return { success: false, error: "El slug ya está en uso. Intenta con otro." };
    }
    return { success: false, error: "Error al crear el tracker" };
  }
}

/**
 * Tracks a telemetry event and updates the performance cache.
 */
export async function trackCampaignEvent(data: {
  campaignId: number;
  eventType: 'impression' | 'click' | 'lead' | 'purchase';
  value?: number;
  source?: string;
  metadata?: any;
}) {
  try {
    // Note: No auth check here to allow public tracking via shortlinks/widgets
    
    // 1. Log Event
    await db.insert(demandEvents).values({
      campaignId: data.campaignId,
      eventType: data.eventType,
      value: data.value?.toString(),
      source: data.source || 'direct',
      metadata: data.metadata || {}
    });

    // 2. Atomic Update of Stats Cache
    const incrementField = data.eventType === 'click' ? campaignStats.clicks :
                          data.eventType === 'lead' ? campaignStats.leads :
                          data.eventType === 'purchase' ? campaignStats.purchases :
                          data.eventType === 'impression' ? campaignStats.impressions :
                          null;

    if (incrementField || data.eventType === 'purchase') {
      const updateObj: any = {};
      if (incrementField) {
        updateObj[incrementField.name] = sql`${incrementField} + 1`;
      }
      if (data.eventType === 'purchase' && data.value) {
        // High-precision revenue update using Number() to avoid coercion bugs
        updateObj.revenue = sql`${campaignStats.revenue} + ${Number(data.value)}`;
      }

      // 3. Recalculate Performance Score Atomically
      // Score = (clicks * 0.1) + (leads * 0.4) + (purchases * 0.8) + (revenue * 0.05)
      updateObj.score = sql`
        LEAST(100,
          (${campaignStats.clicks} * 0.1) +
          (${campaignStats.leads} * 0.4) +
          (${campaignStats.purchases} * 0.8) +
          (${campaignStats.revenue} * 0.05)
        )
      `;
      
      const [updatedStats] = await db.update(campaignStats)
        .set(updateObj)
        .where(eq(campaignStats.campaignId, data.campaignId))
        .returning();

      // 4. Feedback Loop (Milestone Dopamine)
      if (data.eventType === 'lead' && updatedStats && updatedStats.leads % 10 === 0) {
        console.log(`[Campaign Milestone] Campaign ${data.campaignId} reached ${updatedStats.leads} leads! ⚡`);
        // In a real app, this could trigger a push notification or Discord webhook
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error tracking event:", error);
    return { success: false };
  }
}

/**
 * Fetches high-performance metrics for the dashboard.
 */
export async function getCampaignPerformance(projectId: number) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");

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
      score: campaignStats.score
    })
    .from(campaigns)
    .leftJoin(demandDrafts, eq(campaigns.draftId, demandDrafts.id))
    .leftJoin(campaignStats, eq(campaigns.id, campaignStats.campaignId))
    .where(eq(campaigns.projectId, projectId))
    .orderBy(desc(campaigns.createdAt));

    return { success: true, performance };
  } catch (error) {
    console.error("Error fetching performance:", error);
    return { success: false, performance: [] };
  }
}

/**
 * Analyzes strategic patterns (Winning DNA) across projects.
 */
export async function getWinningPatterns(projectId: number) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");

    // Aggregate by Angle
    const anglePatterns = await db.select({
      angle: demandDrafts.angle,
      campaignsCount: sql<number>`count(${campaigns.id})`,
      avgLeads: sql<number>`avg(${campaignStats.leads})`,
      totalRevenue: sql<number>`sum(${campaignStats.revenue})`
    })
    .from(campaigns)
    .innerJoin(demandDrafts, eq(campaigns.draftId, demandDrafts.id))
    .innerJoin(campaignStats, eq(campaigns.id, campaignStats.campaignId))
    .where(eq(campaigns.projectId, projectId))
    .groupBy(demandDrafts.angle)
    .orderBy(sql`sum(${campaignStats.revenue}) DESC`);

    return { success: true, patterns: anglePatterns };
  } catch (error) {
    console.error("Error fetching winning patterns:", error);
    return { success: false, patterns: [] };
  }
}

// ==========================================
// GOC Mission Control Actions
// ==========================================

export async function createTrueCampaign(data: { name: string; projectId: number; campaignType?: string; scope?: string; budget?: string }) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
            throw new Error("Unauthorized");
        }

        const { name, projectId, campaignType = 'user_acquisition', scope = 'b2c', budget } = data;

        const [newCampaign] = await db.insert(campaigns).values({
            name,
            projectId,
            campaignType: campaignType as any,
            scope: scope as any,
            budget: budget ? budget : null,
            source: 'manual', // since it's created from GOC
            status: 'active',
        }).returning();

        if (!newCampaign) {
            throw new Error("Failed to create campaign");
        }

        // Initialize Stats Cache
        await db.insert(campaignStats).values({
            campaignId: newCampaign.id,
            impressions: 0,
            clicks: 0,
            leads: 0,
            purchases: 0,
            revenue: "0",
            score: "0"
        });

        revalidatePath('/admin/marketing');
        return { success: true, campaign: newCampaign };
    } catch (error) {
        console.error("Error creating true campaign:", error);
        return { success: false, error: "Failed to create campaign" };
    }
}

export async function toggleTrueCampaignStatus(id: number, status: 'active' | 'paused' | 'archived') {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
            throw new Error("Unauthorized");
        }

        await db.update(campaigns)
            .set({ status })
            .where(eq(campaigns.id, id));
            
        revalidatePath('/admin/marketing');
        return { success: true };
    } catch (error) {
        console.error("Error toggling true campaign:", error);
        return { success: false, error: "Failed to update campaign status" };
    }
}
