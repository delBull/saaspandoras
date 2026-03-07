import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql, eq, and, inArray } from "drizzle-orm";
import { projects } from "~/db/schema";
import type { DeploymentConfig } from "~/types/deployment";

// 🛡️ Edge caching enabled for 120s
export const revalidate = 120;

export async function GET() {
    console.log("🩺 Route hit: /api/home-data/global");

    // 🛡️ Strict 8s timeout for the entire handler to prevent Vercel hangs
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: Home Data API (Global) took too long")), 8000)
    );

    try {
        const handler = async () => {
            // 1. Fetch Featured Projects (Allow 'approved' or 'live', even if not deployed yet)
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
                deploymentStatus: projects.deploymentStatus,
                businessCategory: projects.businessCategory
            }).from(projects).where(
                and(
                    eq(projects.status, 'live'),
                    eq(projects.deploymentStatus, 'deployed'),
                    sql`(${projects.utilityContractAddress} IS NOT NULL OR ${projects.businessCategory} != 'infrastructure' OR ${projects.businessCategory} IS NULL)`
                )
            );

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
                accessCards.push({
                    id: `access-${project.id}`,
                    projectId: project.id,
                    title: project.title,
                    description: project.description || "Acceso exclusivo al protocolo.",
                    image: project.logoUrl || project.coverPhotoUrl || "/images/default-project.jpg",
                    slug: project.slug,
                    type: "Access Card",
                    price: "Gratis",
                    contractAddress: project.licenseContractAddress
                });

                // --- Process Artifacts (Phases) ---
                const config = project.w2eConfig as DeploymentConfig;
                if (config?.phases) {
                    for (const phase of config.phases) {
                        if (phase.isActive) {
                            artifacts.push({
                                id: `artifact-${project.id}-${phase.id}`,
                                projectId: project.id,
                                title: phase.name,
                                description: phase.description || `Participación en ${project.title}`,
                                image: phase.image || project.logoUrl || "/images/default-project.jpg",
                                slug: project.slug,
                                type: "Artifact",
                                price: phase.tokenPrice ? `$${phase.tokenPrice} USD` : "N/A",
                                tokenAllocation: phase.tokenAllocation,
                                phaseId: phase.id
                            });
                        }
                    }
                }
            }

            return {
                accessCards,
                artifacts,
                featuredProjects
            };
        };

        const result = await Promise.race([handler(), timeoutPromise]);

        return NextResponse.json(result, {
            headers: {
                // 🔥 HOBBY PLAN FIX: Cache for 1 hour, serve stale for up to 24 hours while Vercel auto-regenerates in background
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
                "CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
            }
        });

    } catch (error) {
        console.error("❌ Home Data Global API Error:", error);
        const isTimeout = error instanceof Error && error.message.includes("Timeout");
        return NextResponse.json(
            { error: isTimeout ? "Request timed out" : "Failed to fetch global home data" },
            { status: isTimeout ? 408 : 500 }
        );
    }
}
