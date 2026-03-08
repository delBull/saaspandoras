
import { db } from "@/db";
import { marketingCampaigns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CampaignEditorClient } from "./EditorClient";
import { notFound } from "next/navigation";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";

export const dynamic = 'force-dynamic';

export default async function CampaignEditorPage(props: { params: Promise<{ id: string }> }) {
    // 🛡️ Server-Side Check
    const { session } = await getAuth(await headers());
    if (!session?.userId || !await isAdmin(session.userId)) {
        return <UnauthorizedAccess authError="Server-Side Verification Failed" />;
    }

    const params = await props.params;
    const campaignId = parseInt(params.id, 10);

    const [campaign] = await db
        .select()
        .from(marketingCampaigns)
        .where(eq(marketingCampaigns.id, campaignId))
        .limit(1);

    if (!campaign) {
        notFound();
    }

    return (
        <AdminAuthGuard>
            <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-100px)]">
                <CampaignEditorClient campaign={campaign} />
            </div>
        </AdminAuthGuard>
    );
}
