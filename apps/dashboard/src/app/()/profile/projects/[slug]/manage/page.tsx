import { notFound, redirect } from "next/navigation";
import { ProjectRepository } from "@/lib/domain/project-repository";
import ProjectFounderDashboard from "./dashboard-client";
import { DashApi } from "@/lib/dash-api";

export default async function ManageProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch Project by Slug
    const project = await ProjectRepository.findBySlug(slug);

    if (!project) {
        notFound();
    }

    // Security Check: enforce that the user is authorized for this organization (founder or viewer)
    let hasGrowthOs = false;
    try {
        const overview = await DashApi.controlPlane.getOverview(`org_${slug}`);
        hasGrowthOs = overview.hasHermes || true;
    } catch (error: any) {
        console.error("ManageProjectPage access denied:", error);
        redirect("/");
    }

    return (
        <div className="w-full min-h-screen bg-black text-white p-4 sm:p-6 md:p-8 md:pt-10">
            <ProjectFounderDashboard project={project} hasGrowthOs={hasGrowthOs} />
        </div>
    );
}
