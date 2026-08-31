import { notFound } from "next/navigation";
import HermesCheckoutClient from "./HermesCheckoutClient";
import { LeadRepository } from "@/lib/domain/lead-repository";
import { ProjectRepository } from "@/lib/domain/project-repository";

export default async function HermesCheckoutPage({ searchParams }: { searchParams: Promise<{ leadId?: string, plan?: string }> }) {
    const params = await searchParams;
    const { leadId, plan = 'monthly' } = params;

    if (!leadId) {
        return notFound();
    }

    // Attempt to load the lead via Domain Repository
    const lead = await LeadRepository.findById(leadId);

    // Alternatively, attempt to load an existing project if leadId is actually a project slug
    let project = null;
    if (!lead) {
        project = await ProjectRepository.findBySlug(leadId);
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
