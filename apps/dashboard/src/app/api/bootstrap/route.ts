import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql, eq, and, inArray, desc } from "drizzle-orm";
import { projects, users, gamificationEvents } from "@/db/schema";
import { getProjectPhasesWithStats } from "@/lib/phase-utils";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic';

// ✅ CACHED GLOBAL DATA (Sharable across ALL users)
// This reduces CPU usage by 90% as database queries for projects are only run once every 10 mins.
const getCachedGlobalData = unstable_cache(
    async () => {
        console.log("🚀 [Bootstrap] Refreshing CACHED Global Data");
        
        // 1. Fetch Featured Projects
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
            businessCategory: projects.businessCategory,
            artifacts: projects.artifacts,
            utilityContractAddress: projects.utilityContractAddress
        }).from(projects).where(
            and(
                eq(projects.status, 'live'),
                eq(projects.isDeleted, false),
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

            const phasesWithStats = getProjectPhasesWithStats(project as any, 0); 
            
            for (const phase of phasesWithStats) {
                if (phase.isActive || phase.status === 'active' || phase.status === 'upcoming') {
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

        return { featuredProjects, accessCards, artifacts };
    },
    ["dashboard-global-bootstrap-v2"],
    { revalidate: 600, tags: ["projects", "bootstrap"] }
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get("wallet");
        const walletAddress = wallet && wallet !== 'undefined' && wallet !== 'null' ? wallet.toLowerCase() : null;

        // 🚀 DEV_FAST MODE
        if (process.env.NEXT_PUBLIC_DEV_FAST === "true" && process.env.NODE_ENV === "development") {
            return NextResponse.json({
                featuredProjects: [],
                accessCards: [],
                artifacts: [],
                profile: null,
                notifications: []
            });
        }

        // --- CONCURRENT RESOLUTION ---
        const globalDataPromise = getCachedGlobalData();
        
        const userDataPromise = (async () => {
            if (!walletAddress) return { profile: null, notifications: [] };
            
            try {
                const [userRecords, eventRecords] = await Promise.all([
                    db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1),
                    db.select().from(gamificationEvents).where(eq(gamificationEvents.userId, walletAddress)).orderBy(desc(gamificationEvents.createdAt)).limit(5)
                ]);

                const profile = userRecords[0] || null;
                const notifications: any[] = [];

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
            } catch (err) {
                console.error("❌ User Query Error:", err);
                return { profile: null, notifications: [] };
            }
        })();

        const [globalData, userData] = await Promise.all([globalDataPromise, userDataPromise]);

        return NextResponse.json({
            ...globalData,
            ...userData
        }, {
            headers: {
                // We cache at the browser level for a short time to prevent double-fetches
                "Cache-Control": "private, max-age=30, stale-while-revalidate=60"
            }
        });

    } catch (error) {
        console.error("❌ Bootstrap API Error:", error);
        return NextResponse.json({ error: "Failed to load dashboard bootstrap data" }, { status: 500 });
    }
}
