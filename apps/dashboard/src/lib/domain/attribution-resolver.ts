import { db } from "@/db";
import { 
  campaigns, 
  shortlinks, 
  campaignTrackers, 
  platformAssets,
  ambassadors 
} from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { AttributionContext } from "./dto";

export interface ResolvedAttribution {
  campaignId: number | null;
  assetId: number | null;
  partnerId: string | null;
  creatorId: string | null;
  source: string;
}

export class AttributionResolver {
  /**
   * Encapsulates the logic to resolve a lead's attribution context into concrete DB entities.
   * Waterfall Resolution:
   * 1. Tracker ID (Shortlink) -> Campaign, Asset, Partner
   * 2. UTM Campaign -> Campaign by name
   * 3. Default Project Campaign
   */
  static async resolve(projectId: number, ctx: AttributionContext): Promise<ResolvedAttribution> {
    let result: ResolvedAttribution = {
      campaignId: null,
      assetId: null,
      partnerId: null,
      creatorId: null,
      source: "organic" // default
    };

    // 1. Resolve by Tracker ID (Pandoras Shortlink/Smart Link)
    if (ctx.trackerId) {
      try {
        const trackerUrl = await db.query.shortlinks.findFirst({
          where: eq(shortlinks.slug, ctx.trackerId)
        });

        if (trackerUrl) {
          result.source = "tracker";
          result.assetId = trackerUrl.assetId || null;
          
          // Find associated campaign
          const link = await db.query.campaignTrackers.findFirst({
            where: eq(campaignTrackers.shortlinkId, trackerUrl.id)
          });

          if (link) {
            result.campaignId = link.campaignId;
          }

          // If the shortlink was created by an ambassador/partner, attribute to them
          if (trackerUrl.createdBy) {
             result.creatorId = trackerUrl.createdBy;
             const partner = await db.query.ambassadors.findFirst({
               where: eq(ambassadors.walletAddress, trackerUrl.createdBy)
             });
             if (partner) {
               result.partnerId = partner.id;
             }
          }
        }
      } catch (e) {
        console.error("[AttributionResolver] Error resolving trackerId:", e);
      }
    }

    // 2. Resolve by UTMs (If no tracker resolved a campaign)
    if (!result.campaignId && ctx.campaign) {
      try {
        const utmCampaign = await db.query.campaigns.findFirst({
          where: and(
            eq(campaigns.projectId, projectId),
            ilike(campaigns.name, ctx.campaign)
          )
        });

        if (utmCampaign) {
          result.campaignId = utmCampaign.id;
          result.source = "utm";
        }
      } catch (e) {
        console.error("[AttributionResolver] Error resolving UTM campaign:", e);
      }
    }
    
    // 2.5 Resolve by Direct Campaign ID (Passed via body payload)
    if (!result.campaignId && ctx.campaignId && !isNaN(Number(ctx.campaignId))) {
      result.campaignId = Number(ctx.campaignId);
      result.source = "explicit_id";
    }

    // 3. Fallback: Default Project Campaign
    if (!result.campaignId) {
      try {
        const defaultCampaign = await db.query.campaigns.findFirst({
          where: and(
            eq(campaigns.projectId, projectId),
            eq(campaigns.type, "always_on") // Assuming "always_on" is the default catch-all campaign
          )
        });

        if (defaultCampaign) {
          result.campaignId = defaultCampaign.id;
          result.source = "default_fallback";
        }
      } catch (e) {
        console.error("[AttributionResolver] Error resolving default campaign:", e);
      }
    }

    return result;
  }
}
