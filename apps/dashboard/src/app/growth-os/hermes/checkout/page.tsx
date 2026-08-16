import { db } from "@/db";
import { marketingLeads, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import HermesCheckoutClient from "./HermesCheckoutClient";

export default async function HermesCheckoutPage({ searchParams }: { searchParams: Promise<{ leadId?: string, plan?: string }> }) {
    const params = await searchParams;
    const { leadId, plan = 'monthly' } = params;

    if (!leadId) {
        return notFound();
    }

    // Attempt to load the lead
    const lead = await db.query.marketingLeads.findFirst({
        where: eq(marketingLeads.id, leadId)
    });

    // Alternatively, attempt to load an existing project if leadId is actually a project slug
    let project = null;
    if (!lead) {
        project = await db.query.projects.findFirst({
            where: eq(projects.slug, leadId)
        });
    }

    if (!lead && !project) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
            <HermesCheckoutClient lead={lead} project={project} plan={plan} />
        </div>
    );
}
