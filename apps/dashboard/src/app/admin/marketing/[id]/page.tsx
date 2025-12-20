
import { db } from "@/db";
import { marketingCampaigns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CampaignEditorClient } from "./EditorClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function CampaignEditorPage(props: { params: Promise<{ id: string }> }) {
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
        <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-100px)]">
            <CampaignEditorClient campaign={campaign} />
        </div>
    );
}
