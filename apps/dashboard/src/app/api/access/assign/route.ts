import { NextResponse } from "next/server";
import { classifyUserAccess } from "@/lib/access/service";
import { processGrowthEvent } from "@/lib/marketing/growth-engine/engine-service";
import { db } from "@/db";
import { marketingLeads } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/access/assign
 * ============================================================================
 * Triggered after a successful NFT Mint (Invisible Mint Flow).
 * 
 * 1. Classifies the user (Genesis vs Standard) based on join time.
 * 2. Bridges the user identity to the Growth OS Lead.
 * 3. Triggers the Nurturing/Reward sequence.
 * ============================================================================
 */
export async function POST(req: Request) {
  try {
    const { userId, projectId = 1 } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Core Classification (Idempotent)
    const classification = await classifyUserAccess(userId);

    // 2. Resolve Growth OS Identity
    // We link the core User ID to the Marketing Lead ID to trigger effects
    const lead = await db.query.marketingLeads.findFirst({
      where: eq(marketingLeads.userId, userId),
    });

    if (lead && !classification.alreadyClassified) {
      console.log(`🧬 [ACCESS API] Triggering Growth OS for lead ${lead.id} (Tier: ${classification.benefitsTier})`);
      
      const eventType = classification.benefitsTier === 'genesis' 
        ? 'USER_CLASSIFIED_GENESIS' 
        : 'USER_CLASSIFIED_STANDARD';

      // Fire Classification Event (Updates score + sends welcome email if Genesis)
      await processGrowthEvent(eventType, {
        id: lead.id,
        email: lead.email,
        projectId: lead.projectId,
        intent: lead.intent,
      });

      // Fire Activation Completion (Analytics/Audit)
      await processGrowthEvent('ACCESS_ACTIVATION_COMPLETED', {
        id: lead.id,
        email: lead.email,
        projectId: lead.projectId,
        intent: lead.intent,
      });
    }

    return NextResponse.json({
      success: true,
      ...classification
    });

  } catch (error: any) {
    console.error("🧬 [ACCESS API] Critical Error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error.message 
    }, { status: 500 });
  }
}
