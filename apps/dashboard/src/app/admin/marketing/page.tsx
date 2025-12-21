
import { db } from "@/db";
import { marketingCampaigns } from "@/db/schema";
import { desc } from "drizzle-orm";
import { MarketingHeaderActions, MarketingCampaignList } from "@/app/admin/marketing/DashboardClient";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";

export const dynamic = 'force-dynamic';

export default async function MarketingAdminPage() {
    // 🛡️ Server-Side Check
    const { session } = await getAuth(await headers());
    if (!session?.userId || !await isAdmin(session.userId)) {
        return <UnauthorizedAccess authError="Server-Side Verification Failed" />;
    }

    const campaigns = await db.select().from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt));

    return (
        <AdminAuthGuard>
            <div className="p-8 pt-24 max-w-7xl mx-auto">
                {/* Back to Home */}
                <div className="mb-6">
                    <a href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors group">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Volver al Inicio
                    </a>
                </div>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Marketing Suite</h1>
                        <p className="text-muted-foreground mt-2">
                            Gestiona campañas de correo y WhatsApp.
                        </p>
                    </div>
                    {/* Header Actions - Aligned Right */}
                    <div className="flex gap-2">
                        <MarketingHeaderActions />
                    </div>
                </div>

                {/* Main Content - Full Width Grid */}
                <MarketingCampaignList initialCampaigns={campaigns} />
            </div>
        </AdminAuthGuard>
    );
}
