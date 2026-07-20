import { CampaignRepository } from "@/lib/domain/campaign-repository";
import { notFound } from "next/navigation";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";
import { CampaignDashboardTabs } from "./campaign-dashboard-tabs";

export const dynamic = 'force-dynamic';

export default async function CampaignDashboardPage({ params }: { params: Promise<{ id: string }> }) {
    // 🛡️ Server-Side Check
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) {
        return <UnauthorizedAccess authError="Server-Side Verification Failed" />;
    }

    const { id } = await params;
    const campaignId = parseInt(id, 10);
    if (isNaN(campaignId)) return notFound();

    const data = await CampaignRepository.getCampaignDashboardData(campaignId);
    if (!data) return notFound();

    const { campaign, stats, project, pEvents, dEvents, trackers, cAssets, allProjectResources } = data;

    return (
        <div className="p-8 pt-24 max-w-7xl mx-auto space-y-8">
            {/* Header / Breadcrumbs */}
            <div>
                <a href="/admin/marketing" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors group mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Volver a Mission Control
                </a>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-md ${campaign.status === 'active' ? 'bg-green-500/10 text-green-500' : campaign.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                {campaign.status.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-2 capitalize">
                            Proyecto: {project?.title || `ID: ${campaign.projectId}`} • Scope: {campaign.scope} • Tipo: {campaign.campaignType.replace('_', ' ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <CampaignDashboardTabs 
                campaign={campaign} 
                stats={stats} 
                projectEvents={pEvents} 
                demandEvents={dEvents} 
                trackers={trackers}
                platformAssets={cAssets}
                allProjectResources={allProjectResources}
            />
        </div>
    );
}
