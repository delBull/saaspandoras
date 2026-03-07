import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // 1. Fetch source project
        const sourceProject = await db.query.projects.findFirst({
            where: (projects, { eq }) => eq(projects.slug, slug)
        });

        if (!sourceProject) {
            return NextResponse.json({ error: "Source project not found" }, { status: 404 });
        }

        // 2. Prepare new project data
        // We omit ID and other system fields, and reset deployment-specific fields
        const {
            id,
            createdAt,
            updatedAt,
            slug: oldSlug,
            status,
            deploymentStatus,
            contractAddress,
            treasuryAddress,
            licenseContractAddress,
            utilityContractAddress,
            loomContractAddress,
            governorContractAddress,
            registryContractAddress,
            artifacts,
            raisedAmount,
            returnsPaid,
            votingContractAddress,
            ...cloneData
        } = sourceProject;

        // Generate new unique slug
        const newSlug = `${oldSlug}-clone-${Date.now().toString().slice(-4)}`;
        const newTitle = `${sourceProject.title} (Clone)`;

        // 3. Insert new project
        const [newProject] = await db.insert(projects).values({
            ...cloneData,
            title: newTitle,
            slug: newSlug,
            status: 'draft',
            deploymentStatus: 'pending',
            raisedAmount: '0.00',
            returnsPaid: '0.00',
            artifacts: [],
            // Everything else from cloneData is preserved (description, config, team, etc.)
        }).returning();

        if (!newProject) {
            throw new Error("Failed to create cloned project");
        }

        return NextResponse.json({
            success: true,
            message: "Project cloned successfully",
            newSlug: newProject.slug
        });

    } catch (error) {
        console.error("❌ API: Error cloning project:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
