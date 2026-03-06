import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql, eq, and, inArray, desc } from "drizzle-orm";
import { projects, users, gamificationEvents } from "~/db/schema";
import type { DeploymentConfig } from "~/types/deployment";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get("wallet");
        const walletAddress = wallet && wallet !== 'undefined' && wallet !== 'null' ? wallet.toLowerCase() : null;

        // --- GLOBAL QUERIES ---
        const globalPromise = async () => {
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
            return { featuredProjects, accessCards, artifacts };
        };

        // --- USER QUERIES ---
        const userPromise = async () => {
            if (!walletAddress) return { profile: null, notifications: [] };

            const notifications: any[] = [];

            const [userRecords, eventRecords] = await Promise.all([
                db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1),
                db.select().from(gamificationEvents).where(eq(gamificationEvents.userId, walletAddress)).orderBy(desc(gamificationEvents.createdAt)).limit(5)
            ]);

            const profile = userRecords[0] || null;

            if (profile && !profile.telegramId) {
                notifications.push({
                    id: "telegram-link-reminder",
                    type: "warning",
                    title: "Vincula Telegram",
                    description: "Conecta tu cuenta para recibir alertas y acceder a funciones exclusivas.",
                    category: "system",
                    createdAt: new Date(),
                    dismissible: false,
                    actionUrl: "/profile"
                });
            }

            eventRecords.forEach(e => {
                notifications.push({
                    id: e.id,
                    type: e.points > 0 ? "success" : "info",
                    title: `Event: ${e.type.replace(/_/g, ' ').toUpperCase()}`,
                    description: `You earned ${e.points} points!`,
                    category: e.category,
                    createdAt: e.createdAt,
                    dismissible: true
                });
            });

            return { profile, notifications };
        };

        const [globalData, userData] = await Promise.all([globalPromise(), userPromise()]);

        return NextResponse.json({
            ...globalData,
            ...userData
        }, {
            headers: {
                "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59"
            }
        });

    } catch (error) {
        console.error("❌ Bootstrap API Error:", error);
        return NextResponse.json({ error: "Failed to load dashboard bootstrap data" }, { status: 500 });
    }
}
