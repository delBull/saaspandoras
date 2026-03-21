import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { calculatePhaseStats, fetchProjectOnChainData } from '@/lib/projects/stats';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/projects/[slug]/analytics
 * 
 * Public endpoint for Growth OS Widget and external integrations.
 * Returns real-time phase progress and project metrics.
 * 
 * Header: x-api-key - Validated against integration_clients
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

        // 2. Resolve Project
        const projectId = Number(slug);
        const isId = !isNaN(projectId);

        const projectResult = await db.query.projects.findFirst({
            where: and(
                isId ? eq(projects.id, projectId) : eq(projects.slug, slug),
                eq(projects.isDeleted, false)
            )
        });

        if (!projectResult) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // 3. Security: Check if API Key belongs to this project OR is a global/admin key
        // Note: IntegrationKeyService.validateKey returns the client. 
        // We should check if clientAuth.projectId matches projectResult.id if it's not a platform key.
        if (clientAuth.projectId && clientAuth.projectId !== projectResult.id) {
            return NextResponse.json({ error: 'API Key does not have access to this project' }, { status: 403 });
        }

        // 4. Fetch On-Chain Data (Real-time Supply)
        const onChainData = await fetchProjectOnChainData(projectResult);

        // 5. Calculate Phase Stats
        const phasesWithStats = calculatePhaseStats(
            projectResult,
            onChainData.totalSupply
        );

        // 6. Format Response
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
            }
        });

    } catch (error) {
        console.error('❌ Project Analytics API Error:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown'
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
