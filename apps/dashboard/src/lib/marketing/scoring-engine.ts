import { db } from "@/db";
import { marketingLeads, marketingLeadEvents, marketingAttributionTouches } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export class ScoringEngine {
  /**
   * (DEPRECATED) Static weights are deprecated in favor of Hermes Cognitive Profiles.
   * HermesLearningLoop will now asynchronously evaluate the transactional intent of this lead.
   */
  static async updateScore(leadId: string, eventType: string): Promise<number> {
    try {
      // Import dynamically to avoid circular dependencies
      const { HermesLearningLoop } = await import("@/lib/hermes/memory/learning-loop");
      
      // We pass the leadId. Since it's a web event, Hermes will fetch the recent web events
      // and update the cognitive profile without needing chat context.
      // We do NOT await this to avoid blocking the main thread (Fire-and-forget)
      HermesLearningLoop.processLeadEvents(leadId).catch(err => {
        console.error(`[ScoringEngine] Failed to process Hermes learning loop for lead ${leadId}:`, err);
      });
      
      return 0; // Legacy score is no longer meaningful
    } catch (err) {
      console.error(`[ScoringEngine] Failed to import HermesLearningLoop:`, err);
      return 0;
    }
  }
}

export class AttributionManager {
  /**
   * Records a touch point for a lead.
   */
  static async logTouch(
    leadId: string, 
    campaignId: number | null, 
    touchType: string, 
    metadata: any = {}
  ) {
    await db.insert(marketingAttributionTouches).values({
      leadId,
      campaignId: campaignId || null,
      touchType,
      weight: "1.00", // Start with simple 1.0 weight for linear modeling later
      metadata: metadata || {},
      createdAt: new Date(),
    });
    
    // Trigger scoring update for this touch
    await ScoringEngine.updateScore(leadId, touchType);
  }
}
