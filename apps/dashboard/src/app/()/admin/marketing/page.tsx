import { MarketingDashboardTabs } from "@/app/()/admin/marketing/DashboardClient";
import { MarketingAnalytics } from "@/components/admin/marketing/MarketingAnalytics";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";
import { CampaignRepository } from "@/lib/domain/campaign-repository";
import { LeadRepository } from "@/lib/domain/lead-repository";

export const dynamic = 'force-dynamic';

export default async function MarketingAdminPage() {
    // 🛡️ Server-Side Check
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) {
        return <UnauthorizedAccess authError="Server-Side Verification Failed" />;
    }

    // Fetch True Campaigns (The Aggregate Root)
    const allCampaigns = await CampaignRepository.findAllCampaigns();
    
    // Fetch Automation Sequences (previously named marketingCampaigns)
    const automationSequences = await CampaignRepository.findAllAutomations();
    
    const leads = await LeadRepository.findAllLeads();

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
                        <h1 className="text-3xl font-bold tracking-tight">Growth Operations Center</h1>
                        <p className="text-muted-foreground mt-2">
                            Mission Control: Gestiona campañas comerciales, automatizaciones y embudos.
                        </p>
                    </div>
                </div>

                {/* Analytics Dashboard */}
                <MarketingAnalytics leads={leads} />

                {/* Main Content - Tabs */}
                <div className="mt-8">
                    <MarketingDashboardTabs 
                        initialCampaigns={allCampaigns} 
                        initialAutomations={automationSequences} 
                    />
                </div>
            </div>
        </AdminAuthGuard>
    );
}
