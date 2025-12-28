
import { seedMarketingCampaigns } from "../src/lib/marketing/seed-campaigns";
import { db } from "../src/db";

async function main() {
    try {
        await seedMarketingCampaigns();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
