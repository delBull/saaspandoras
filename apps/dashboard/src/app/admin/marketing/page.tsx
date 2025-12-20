
import { db } from "@/db";
import { marketingCampaigns } from "@/db/schema";
import { desc } from "drizzle-orm";
import { MarketingDashboardClient } from "./DashboardClient";

export const dynamic = 'force-dynamic';

export default async function MarketingAdminPage() {
    const campaigns = await db.select().from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt));

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketing Suite</h1>
                    <p className="text-muted-foreground mt-2">
                        Gestiona campañas de correo y WhatsApp.
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Client component handles the interactions */}
                    <MarketingDashboardClient initialCampaigns={campaigns} />
                </div>
            </div>

            {/* Campaign List Rendered by Client Component or Server? 
           Let's pass data to client component for search/filter interaction, 
           or render a simple table here. Client component is better for the Sync Button state.
       */}
        </div>
    );
}
