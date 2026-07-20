import { db } from "@/db";
import { projects, platformAssets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";
import { ResourceDashboard } from "./ResourceDashboard";

export const dynamic = 'force-dynamic';

export default async function ProjectResourcesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    // Auth Check
    const { session } = await getAuth(await headers());
    if (!session?.address) {
        return <UnauthorizedAccess title="No tienes acceso a este CMS" 
                  description="Necesitas conectar tu billetera administrativa." />;
    }

    // Get Project
    const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
    
    if (!project) {
        notFound();
    }

    // Get Resources
    const resources = await db.select()
        .from(platformAssets)
        .where(eq(platformAssets.projectId, project.id))
        .orderBy(desc(platformAssets.createdAt));

    return (
        <div className="p-8 pt-24 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Project Resources</h1>
                <p className="text-muted-foreground mt-2">
                    CMS Institucional de {project.title}. Aquí nacen los documentos, podcasts y calculadoras.
                </p>
            </div>

            <ResourceDashboard project={project} resources={resources} />
        </div>
    );
}
