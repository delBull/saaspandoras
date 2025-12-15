
import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql, eq, and, desc, inArray } from "drizzle-orm";
import { projects } from "~/db/schema";
import { DeploymentConfig } from "~/types/deployment";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Fetch Featured Projects (Allow 'approved' or 'live', even if not deployed yet, for marketing)
        const featuredProjectsRaw = await db.select({
            id: projects.id,
            title: projects.title,
            description: projects.description,
            slug: projects.slug,
            coverPhotoUrl: projects.coverPhotoUrl,
            logoUrl: projects.logoUrl,
            featured: projects.featured
        }).from(projects).where(and(eq(projects.featured, true), inArray(projects.status, ['approved', 'live', 'completed'])));

        // 2. Fetch Strictly LIVE & DEPLOYED projects for Access/Artifacts
        const liveProjects = await db.select({
            id: projects.id,
            title: projects.title,
            description: projects.description,
            slug: projects.slug,
            coverPhotoUrl: projects.coverPhotoUrl,
            logoUrl: projects.logoUrl,
            w2eConfig: projects.w2eConfig,
            contractAddress: projects.contractAddress,
            licenseContractAddress: projects.licenseContractAddress,
            status: projects.status,
            deploymentStatus: projects.deploymentStatus
        }).from(projects).where(and(eq(projects.status, 'live'), eq(projects.deploymentStatus, 'deployed')));

        // Map Featured
        const featuredProjects = featuredProjectsRaw.map(p => ({
            id: String(p.id),
            title: p.title,
            subtitle: p.description || "Proyecto Destacado",
            actionText: "Dime más",
            imageUrl: p.coverPhotoUrl || p.logoUrl || "/images/default-project.jpg",
            projectSlug: p.slug
        }));

        const accessCards = [];
        const artifacts = [];

        for (const project of liveProjects) {
            // --- Process Access Cards ---
            // Every project has an Access Card (License)
            accessCards.push({
                id: `access-${project.id}`,
                projectId: project.id,
                title: project.title, // Access Card often shares project name
                description: project.description || "Acceso exclusivo al protocolo.",
                image: project.logoUrl || project.coverPhotoUrl || "/images/default-project.jpg", // Fallback
                slug: project.slug,
                type: "Access Card",
                price: "Gratis", // Per user requirement
                contractAddress: project.licenseContractAddress
            });

            // --- Process Artifacts (Phases) ---
            const config = project.w2eConfig as DeploymentConfig;
            if (config && config.phases) {
                for (const phase of config.phases) {
                    if (phase.isActive) {
                        artifacts.push({
                            id: `artifact-${project.id}-${phase.id}`,
                            projectId: project.id,
                            title: phase.name,
                            description: phase.description || `Participación en ${project.title}`,
                            image: phase.image || project.logoUrl || "/images/default-project.jpg",
                            slug: project.slug, // Link to project page
                            type: "Artifact",
                            price: phase.tokenPrice ? `$${phase.tokenPrice} USD` : "N/A",
                            tokenAllocation: phase.tokenAllocation,
                            phaseId: phase.id
                        });
                    }
                }
            }
        }

        return NextResponse.json({
            accessCards,
            artifacts,
            featuredProjects
        });

    } catch (error) {
        console.error("❌ Home Data API Error:", error);
        return NextResponse.json({ error: "Failed to fetch home data" }, { status: 500 });
    }
}
