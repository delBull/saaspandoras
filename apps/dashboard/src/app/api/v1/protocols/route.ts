import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { inArray, desc, and, ne } from "drizzle-orm";

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/protocols
 * Strictly follows CoreProjectDTO from PANDORAS_DATA_CONTRACT.md
 */
export async function GET() {
    try {
        const projectsData = await db
            .select({
                id: projects.id,
                slug: projects.slug,
                title: projects.title,
                description: projects.description,
                businessCategory: projects.businessCategory,
                status: projects.status,
                protocolVersion: projects.protocolVersion,
                pageLayoutType: projects.pageLayoutType,
                logoUrl: projects.logoUrl,
                coverPhotoUrl: projects.coverPhotoUrl,
                estimatedApy: projects.estimatedApy,
                totalValuationUsd: projects.totalValuationUsd,
                licenseContractAddress: projects.licenseContractAddress,
                contractAddress: projects.contractAddress,
                chainId: projects.chainId,
                artifacts: projects.artifacts,
                w2eConfig: projects.w2eConfig,
                featured: projects.featured,
                updatedAt: projects.updatedAt,
                createdAt: projects.createdAt,
                accessType: projects.accessType,
                price: projects.price,
            })
            .from(projects)
            .where(
                and(
                    inArray(projects.status, ['approved', 'live', 'completed']),
                    ne(projects.businessCategory, 'infrastructure')
                )
            )
            .orderBy(desc(projects.updatedAt));

        const formattedProtocols = projectsData.map(p => {
            // Fallback for artifacts from w2eConfig if the main column is empty
            let rawArtifacts = p.artifacts;
            if (!Array.isArray(rawArtifacts) || rawArtifacts.length === 0) {
                const config = typeof p.w2eConfig === 'string' ? JSON.parse(p.w2eConfig) : p.w2eConfig;
                rawArtifacts = config?.artifacts || [];
            }

            return {
                id: String(p.id),
                slug: p.slug,
                name: p.title,
                description: p.description,
                category: (p.businessCategory || 'other').toUpperCase(),
                status: (p.status || 'draft').toUpperCase(),
                version: p.protocolVersion || 1,
                pageLayoutType: (p.pageLayoutType || 'Access').toUpperCase(),
                visuals: {
                    logo_url: p.logoUrl, // Snake_case for Telegram
                    cover_photo_url: p.coverPhotoUrl,
                },
                metrics: {
                    apr: p.estimatedApy || "0%",
                    tvl: p.totalValuationUsd ? `$${p.totalValuationUsd}` : "$0",
                },
                access: {
                    type: (p.accessType || 'LICENSE').toUpperCase(),
                    licenseContractAddress: p.licenseContractAddress || p.contractAddress || "0x0",
                    chainId: p.chainId || -1, // -1 signals UNCONFIGURED/SAFE_OFFLINE
                    gasPolicy: 'SPONSORED',
                    price: p.price && Number(p.price) > 0 ? `$${p.price}` : 'FREE',
                },
                artifacts: Array.isArray(rawArtifacts) ? rawArtifacts.map((a: any) => ({
                    ...a,
                    unlockRule: a.unlockRule || { requiresAccess: true, phase: 1 }
                })) : [],
                updatedAt: (p.updatedAt || p.createdAt || new Date()).toISOString(),
            };
        });

        return NextResponse.json(formattedProtocols);
    } catch (error) {
        console.error("❌ API V1 Protocols Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
