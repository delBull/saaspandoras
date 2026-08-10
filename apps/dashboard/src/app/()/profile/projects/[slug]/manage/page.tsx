import { notFound, redirect } from "next/navigation";
import { ProjectRepository } from "@/lib/domain/project-repository";
import ProjectFounderDashboard from "./dashboard-client";
import { getOrganizationOverview } from "@/app/growth-os/organizations/[id]/actions";

export default async function ManageProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch Project by Slug
    const project = await ProjectRepository.findBySlug(slug);

    if (!project) {
        notFound();
    }

    // Security Check: enforce that the user is authorized for this organization (founder or viewer)
    try {
        await getOrganizationOverview(`org_${slug}`);
    } catch (error: any) {
        console.error("ManageProjectPage access denied:", error);
        redirect("/");
    }

    return (
        <div className="w-full min-h-screen bg-black text-white p-4 sm:p-6 md:p-8 md:pt-10">
            <ProjectFounderDashboard project={project} />
        </div>
    );
}
