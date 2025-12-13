import { NextRequest, NextResponse } from "next/server";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { phaseId, isActive } = body;

        if (!phaseId) {
            return NextResponse.json({ error: "Phase ID is required" }, { status: 400 });
        }

        // Fetch project
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, parseInt(id)),
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const config = project.w2eConfig as any;
        if (!config || !config.phases) {
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
            .where(eq(projects.id, parseInt(id)));

        return NextResponse.json({ success: true, phases: updatedPhases });

    } catch (error) {
        console.error("Error updating phase:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
