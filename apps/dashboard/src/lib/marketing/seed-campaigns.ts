import { db } from "@saasfly/db-core";
import { marketingCampaigns } from "@saasfly/db-core";
import { APPLY_PROTOCOL_CAMPAIGNS } from "./seeds";
import { eq } from "@saasfly/db-core";

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
            // Update config to ensure latest seeds are applied
            await db.update(marketingCampaigns)
                .set({
                    config: campaignData.config as any,
                    updatedAt: new Date()
                })
                .where(eq(marketingCampaigns.name, campaignData.name));
            console.log(`🔄 [Marketing] Campaign "${campaignData.name}" updated with latest config.`);
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
