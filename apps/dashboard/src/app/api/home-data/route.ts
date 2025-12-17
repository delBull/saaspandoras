
import { NextResponse } from "next/server";
import { db } from "~/db";
// ... imports ...
import { sql, eq, and, desc, inArray } from "drizzle-orm";
import { projects, gamificationEvents, users } from "~/db/schema";
import type { DeploymentConfig } from "~/types/deployment";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get("wallet");

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

        // 3. Fetch Notifications (Recent Events) if wallet provided
        let notifications: any[] = [];
        if (wallet) {
            const user = await db.select({ id: users.id }).from(users).where(eq(users.walletAddress, wallet)).limit(1);
            if (user && user.length > 0 && user[0]) {
                const rawEvents = await db.select()
                    .from(gamificationEvents)
                    .where(eq(gamificationEvents.userId, user[0].id))
                    .orderBy(desc(gamificationEvents.createdAt))
                    .limit(5); // Last 5 events

                notifications = rawEvents.map(e => ({
                    id: e.id,
                    type: e.points > 0 ? "success" : "info",
                    title: `Event: ${e.type.replace(/_/g, ' ').toUpperCase()}`,
                    description: `You earned ${e.points} points!`,
                    category: e.category,
                    createdAt: e.createdAt,
                    dismissible: true
                }));
            }
        }

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
            if (config?.phases) { // Use optional chain
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
            featuredProjects,
            notifications
        });

    } catch (error) {
        console.error("❌ Home Data API Error:", error);
        return NextResponse.json({ error: "Failed to fetch home data" }, { status: 500 });
    }
}
