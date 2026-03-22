import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { calculatePhaseStats, fetchProjectOnChainData } from '@/lib/projects/stats';
import { unstable_cache } from 'next/cache';

// Cache project data and analytics for 60 seconds to prevent RPC bottlenecks
const getCachedProjectAnalytics = unstable_cache(
    async (project: any) => {
        const onChainData = await fetchProjectOnChainData(project);
        const phasesWithStats = calculatePhaseStats(
            project,
            onChainData.totalSupply
        );
        return { onChainData, phasesWithStats };
    },
    ['project-analytics'],
    { revalidate: 60, tags: ['analytics'] }
);

/**
 * GET /api/v1/projects/[slug]/analytics
 * 
 * Public endpoint for Growth OS Widget and external integrations.
 * Returns cached (60s) phase progress and project metrics.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        // 1. Authenticate Request
        const apiKey = req.headers.get('x-api-key');
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
        }

        const clientAuth = await IntegrationKeyService.validateKey(apiKey);
        if (!clientAuth) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
        }

        const { slug } = await params;

        // 2. Resolve Project (Prioritize ID as source of truth)
        const projectIdFromSlug = Number(slug);
        const isId = !isNaN(projectIdFromSlug);

        const projectResult = await db.query.projects.findFirst({
            where: and(
                isId ? eq(projects.id, projectIdFromSlug) : eq(projects.slug, slug),
                eq(projects.isDeleted, false)
            )
        });

        if (!projectResult) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // 3. Security: Scope API Key to specific project
        if (clientAuth.projectId && clientAuth.projectId !== projectResult.id) {
            return NextResponse.json({ error: 'API Key does not have access to this project' }, { status: 403 });
        }

        // 4. Fetch Analytics (Cached)
        const { onChainData, phasesWithStats } = await getCachedProjectAnalytics(projectResult);

        // 5. Format Response
        const analytics = {
            success: true,
            project: {
                id: projectResult.id,
                slug: projectResult.slug,
                title: projectResult.title,
                status: projectResult.status,
            },
            metrics: {
                totalSupply: onChainData.totalSupply,
                raisedAmount: projectResult.raisedAmount || "0",
                targetAmount: projectResult.targetAmount || "0",
            },
            phases: phasesWithStats.map(p => ({
                id: p.id,
                name: p.name,
                allocation: p.tokenAllocation,
                price: p.tokenPrice,
                sold: p.stats?.tokensSold || 0,
                remaining: p.stats?.remainingTokens || 0,
                progress: p.stats?.percent || 0,
                isSoldOut: p.stats?.isSoldOut || false,
                status: p.stats?.isSoldOut ? 'SOLD_OUT' : (p.isActive ? 'ACTIVE' : 'UPCOMING')
            }))
        };

        const origin = req.headers.get("origin") || "*";
        return NextResponse.json(analytics, {
            headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, x-api-key",
                "Access-Control-Allow-Credentials": "true",
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30"
            }
        });

    } catch (error) {
        console.error('❌ Project Analytics API Error:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown') : undefined
        }, { status: 500 });
    }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin") || "*";
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-api-key",
            "Access-Control-Allow-Credentials": "true",
        },
    });
}
