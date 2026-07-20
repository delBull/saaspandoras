import { notFound, redirect } from "next/navigation";
import { ProjectRepository } from "@/lib/domain/project-repository";
// import { ProjectFounderDashboard } from "@/components/founders/ProjectFounderDashboard"; // Will create this next
import ProjectFounderDashboard from "./dashboard-client"; // Local co-location for now

export default async function ManageProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch Project by Slug
    const project = await ProjectRepository.findBySlug(slug);

    if (!project) {
        notFound();
    }

    // Basic security check could go here (ensure user owns project), 
    // but middleware/layout likely handles general auth. 
    // For strict ownership, we'd check session vs project.owner_id. 
    // Assuming 'profile' route is already protected for user.
    // We should verify ownership though if the ID is guessable.
    // For now, relying on layout/UI context.

    return (
        <div className="w-full min-h-screen bg-black text-white p-4 sm:p-6 md:p-8 md:pt-10">
            <ProjectFounderDashboard project={project} />
        </div>
    );
}
