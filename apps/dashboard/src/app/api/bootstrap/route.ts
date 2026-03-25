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

        // 🚀 DEV_FAST MODE: Instant Mock Response
        if (process.env.NEXT_PUBLIC_DEV_FAST === "true" && process.env.NODE_ENV === "development") {
            const mockProfile = walletAddress ? {
                id: "dev-user-id",
                walletAddress: walletAddress,
                role: "admin",
                name: "Dev User",
                status: "ACTIVE"
            } : null;

            return NextResponse.json({
                featuredProjects: [{
                    id: "mock-1",
                    title: "Mock Featured Project (DEV_FAST)",
                    subtitle: "Instantly loaded for local development",
                    actionText: "Dime más",
                    imageUrl: "/images/default-project.jpg",
                    projectSlug: "mock-project"
                }],
                accessCards: [],
                artifacts: [],
                profile: mockProfile,
                notifications: []
            }, {
                headers: { "Cache-Control": "no-store" } // Don't cache dev mocks
            });
        }

        // --- GLOBAL QUERIES ---
        const globalPromise = async () => {
            console.log("🚀 [Bootstrap] Starting Global Queries");
            // 1. Fetch Featured Projects (Allow 'approved' or 'live', even if not deployed yet)
            const featuredProjectsRaw = await db.select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                slug: projects.slug,
                coverPhotoUrl: projects.coverPhotoUrl,
                logoUrl: projects.logoUrl,
                featured: projects.featured
            }).from(projects).where(and(
                eq(projects.featured, true),
                eq(projects.isDeleted, false),
                inArray(projects.status, ['approved', 'live', 'completed'])
            ));
            console.log(`🚀 [Bootstrap] Found ${featuredProjectsRaw.length} featured projects`);

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
                    eq(projects.isDeleted, false),
                    eq(projects.deploymentStatus, 'deployed'),
                    sql`(${projects.utilityContractAddress} IS NOT NULL OR ${projects.businessCategory} != 'infrastructure' OR ${projects.businessCategory} IS NULL)`
                )
            );
            console.log(`🚀 [Bootstrap] Found ${liveProjects.length} live projects`);

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
            if (!walletAddress) {
                console.log("🚀 [Bootstrap] No wallet provided, skipping user queries");
                return { profile: null, notifications: [] };
            }
            console.log(`🚀 [Bootstrap] Starting User Queries for ${walletAddress}`);

            const notifications: any[] = [];

            try {
                const [userRecords, eventRecords] = await Promise.all([
                    db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1),
                    db.select().from(gamificationEvents).where(eq(gamificationEvents.userId, walletAddress)).orderBy(desc(gamificationEvents.createdAt)).limit(5)
                ]);

                const profile = userRecords[0] || null;
                console.log(`🚀 [Bootstrap] User found: ${!!profile}`);

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
            } catch (err: any) {
                console.error(`❌ [Bootstrap] User Query Error: ${err.message}`);
                return { profile: null, notifications: [], error: err.message };
            }
        };

        console.log("🚀 [Bootstrap] Dispatching parallel promises");
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
