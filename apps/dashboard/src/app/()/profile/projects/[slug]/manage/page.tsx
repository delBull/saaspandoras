import { notFound, redirect } from "next/navigation";
import { ProjectRepository } from "@/lib/domain/project-repository";
import ProjectFounderDashboard from "./dashboard-client";
import { getOrganizationOverview } from "@/app/growth-os/organizations/[id]/actions";
import { db } from "@/db";
import { installedProducts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

    // Check if Growth OS is installed for this tenant
    const growthOsInstall = await db.query.installedProducts.findFirst({
        where: and(
            eq(installedProducts.projectId, project.id),
            eq(installedProducts.productFamily, 'GROWTH_OS')
        )
    });

    const hasGrowthOs = !!growthOsInstall;

    return (
        <div className="w-full min-h-screen bg-black text-white p-4 sm:p-6 md:p-8 md:pt-10">
            <ProjectFounderDashboard project={project} hasGrowthOs={hasGrowthOs} />
        </div>
    );
}
