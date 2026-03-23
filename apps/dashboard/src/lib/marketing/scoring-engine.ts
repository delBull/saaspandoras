import { db } from "@/db";
import { marketingLeads, marketingLeadEvents, marketingAttributionTouches } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export class ScoringEngine {
  /**
   * Weights for different lead actions.
   */
  private static WEIGHTS: Record<string, number> = {
    'landing_page_view': 5,
    'click': 10,
    'time_on_page_30s': 15,
    'whatsapp_redirect': 25,
    'form_submit': 30,
    'wallet_connect': 50,
    'purchase': 100,
  };

  /**
   * Updates a lead's score based on a new event.
   */
  static async updateScore(leadId: string, eventType: string): Promise<number> {
    const points = this.WEIGHTS[eventType.toLowerCase()] || 0;
    if (points === 0) return 0;

    const [updatedLead] = await db
      .update(marketingLeads)
      .set({
        score: sql`${marketingLeads.score} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(marketingLeads.id, leadId))
      .returning({ score: marketingLeads.score });

    if (updatedLead) {
      const quality = this.calculateQuality(updatedLead.score);
      await db
        .update(marketingLeads)
        .set({ quality })
        .where(eq(marketingLeads.id, leadId));
        
      return updatedLead.score;
    }

    return 0;
  }

  private static calculateQuality(score: number): "low" | "medium" | "high" {
    if (score >= 80) return "high";
    if (score >= 30) return "medium";
    return "low";
  }
}

export class AttributionManager {
  /**
   * Records a touch point for a lead.
   */
  static async logTouch(
    leadId: string, 
    campaignId: string | null, 
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
