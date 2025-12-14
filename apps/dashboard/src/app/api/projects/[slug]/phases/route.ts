import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await req.json();
        const { phaseId, isActive } = body;

        if (!phaseId) {
            return NextResponse.json({ error: "Phase ID is required" }, { status: 400 });
        }

        // Try to parse as ID
        const projectId = parseInt(slug);

        let project;
        if (!isNaN(projectId)) {
            project = await db.query.projects.findFirst({
                where: eq(projects.id, projectId),
            });
        } else {
            // Find by slug if ID parsing failed
            project = await db.query.projects.findFirst({
                where: eq(projects.slug, slug),
            });
        }

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Use project.id for updates if needed, logic below uses project object so we are good.
        // Wait, the update at the end uses ID. We should use project.id from the found project.

        const config = project.w2eConfig as any;
        if (!config?.phases) {
            return NextResponse.json({ error: "No phases found in config" }, { status: 404 });
        }

        // Update phases
        const updatedPhases = config.phases.map((p: any) => {
            if (p.id === phaseId) {
                return { ...p, isActive };
            }
            return p;
        });

        const newConfig = {
            ...config,
            phases: updatedPhases,
        };

        // Save to DB
        await db.update(projects)
            .set({ w2eConfig: newConfig })
            .where(eq(projects.id, project.id));

        return NextResponse.json({ success: true, phases: updatedPhases });

    } catch (error) {
        console.error("Error updating phase:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
