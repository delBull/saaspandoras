import { db } from "@/db";
import { marketingCampaigns } from "@/db/schema";
import { APPLY_PROTOCOL_CAMPAIGNS } from "./seeds";
import { eq } from "drizzle-orm";

/**
 * Seeds the marketing_campaigns table with ApplyProtocol strategies
 * Can be run from server-side admin endpoint or local script
 */
export async function seedMarketingCampaigns() {
    console.log('🌱 [Marketing] Seeding campaigns...');

    for (const campaignData of APPLY_PROTOCOL_CAMPAIGNS) {
        // Check if exists
        const existing = await db
            .select()
            .from(marketingCampaigns)
            .where(eq(marketingCampaigns.name, campaignData.name))
            .limit(1);

        if (existing.length > 0) {
            console.log(`✓ [Marketing] Campaign "${campaignData.name}" already exists. Skipping.`);
            continue;
        }

        // Insert
        await db.insert(marketingCampaigns).values({
            name: campaignData.name,
            triggerType: campaignData.triggerType as "manual" | "auto_registration" | "api_event",
            isActive: true,
            config: campaignData.config as any
        });

        console.log(`✅ [Marketing] Seeded campaign: "${campaignData.name}"`);
    }

    console.log('🎉 [Marketing] Campaign seeding complete!');
}
