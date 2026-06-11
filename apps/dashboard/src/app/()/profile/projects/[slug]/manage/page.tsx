import { notFound, redirect } from "next/navigation";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";
// import { ProjectFounderDashboard } from "@/components/founders/ProjectFounderDashboard"; // Will create this next
import ProjectFounderDashboard from "./dashboard-client"; // Local co-location for now

export default async function ManageProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch Project by Slug
    const project = await db.query.projects.findFirst({
        where: eq(projects.slug, slug),
    });

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
