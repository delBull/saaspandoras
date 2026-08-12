import { NextResponse } from 'next/server';
import { db } from '@/db';
import { installedProducts, projects, hermesJobs, hermesJournal } from '@/db/schema';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { DomainPackLoader } from '@/lib/hermes/packs/domain-pack-loader';

type Profile = 'operator' | 'tenant';

/**
 * Resolves the Workbench profile from the request context.
 *  - Hermes Portal magic-link session (Bearer ps_...) → tenant
 *  - Pandoras Dashboard session (thirdweb JWT cookie)   → operator
 *  - No auth context (demo)                             → operator fallback
 *
 * This is read-only: it consumes the existing auth flows without modifying them.
 */
async function resolveProfile(request: Request, tenantId: number): Promise<{ profile: Profile }> {
    // 1. Hermes Portal Session (magic link) → tenant
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.startsWith('Bearer ps_') ? authHeader.slice(7) : null;

    if (sessionToken) {
        const session = await validatePortalSession(sessionToken);
        if (session && session.projectId === tenantId) {
            return { profile: 'tenant' };
        }
        console.warn('[Workbench] Portal session token present but does not match tenantId.');
    }

    // 2. Pandoras Dashboard Session (thirdweb JWT cookie) → operator
    try {
        const auth = await getAuth();
        if (auth.isVerified && auth.session?.address) {
            return { profile: 'operator' };
        }
    } catch (e) {
        console.warn('[Workbench] getAuth failed:', e);
    }

    // 3. Fallback: preserve current demo behaviour without an auth context
    console.warn('[Workbench] No authenticated context resolved; defaulting to operator (demo).');
    return { profile: 'operator' };
}

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const tenantIdNum = Number(tenantId);

    if (!Number.isInteger(tenantIdNum) || tenantIdNum <= 0) {
        return NextResponse.json({ error: 'Invalid tenantId' }, { status: 400 });
    }

    const [project] = await db.select()
        .from(projects)
        .where(eq(projects.id, tenantIdNum));

    if (!project) {
        return NextResponse.json({ error: 'Tenant project not found' }, { status: 404 });
    }

    const [hermes] = await db.select()
        .from(installedProducts)
        .where(and(
            eq(installedProducts.projectId, tenantIdNum),
            eq(installedProducts.product, 'HERMES')
        ));

    if (!hermes) {
        return NextResponse.json({ error: 'Hermes Kernel not provisioned' }, { status: 404 });
    }

    const { profile } = await resolveProfile(request, tenantIdNum);

    const strTenantId = tenantIdNum.toString();

    // Fetch real metrics from Postgres
    const [runningRes] = await db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(hermesJobs)
        .where(and(eq(hermesJobs.tenantId, strTenantId), inArray(hermesJobs.state, ['Running', 'Waiting Callback'])));
    
    const [pendingRes] = await db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(hermesJobs)
        .where(and(eq(hermesJobs.tenantId, strTenantId), eq(hermesJobs.state, 'Queued')));

    const [sessionsRes] = await db.select({
        count: sql<number>`cast(count(distinct ${hermesJobs.request}->>'requester') as integer)`
    })
        .from(hermesJobs)
        .where(and(eq(hermesJobs.tenantId, strTenantId), inArray(hermesJobs.state, ['Queued', 'Running', 'Waiting Callback'])));

    const [journalRes] = await db.select({
        total: sql<number>`cast(count(*) as integer)`,
        errors: sql<number>`cast(count(*) filter (where ${hermesJournal.executionStatus} = 'failed') as integer)`
    })
    .from(hermesJournal)
    .where(eq(hermesJournal.tenantId, strTenantId));

    const recentEvents = journalRes?.total || 0;
    const errorRate = recentEvents > 0 ? (journalRes?.errors || 0) / recentEvents : 0;

    // Real capability mesh derived from journal executions (no fabricated providers/latencies)
    const meshRows = await db.select({
        capability: hermesJournal.capability,
        provider: hermesJournal.resolvedProvider
    })
        .from(hermesJournal)
        .where(eq(hermesJournal.tenantId, strTenantId));

    const meshMap = new Map<string, Map<string, Record<string, unknown>>>();
    for (const row of meshRows) {
        if (!row.capability) continue;
        const providerName = typeof row.provider === 'string'
            ? row.provider
            : (row.provider as any)?.name || 'kernel';
        if (!meshMap.has(row.capability)) meshMap.set(row.capability, new Map());
        meshMap.get(row.capability)!.set(providerName, {
            resolver: 'primary',
            implementation: providerName,
            health: 'HEALTHY',
            latencyMs: null
        });
    }
    const capabilityMesh = Array.from(meshMap.entries()).map(([capability, bindings]) => ({
        capability,
        bindings: Array.from(bindings.values())
    }));

    // Real recent executions for the console dock / trace graph
    const recentJournal = await db.select({
        requestId: hermesJournal.requestId,
        capability: hermesJournal.capability,
        executionStatus: hermesJournal.executionStatus,
        resolvedProvider: hermesJournal.resolvedProvider,
        createdAt: hermesJournal.createdAt
    })
        .from(hermesJournal)
        .where(eq(hermesJournal.tenantId, strTenantId))
        .orderBy(desc(hermesJournal.createdAt))
        .limit(8);

    let domainPack;
    try {
        domainPack = await DomainPackLoader.load(project.slug);
    } catch (e) {
        console.warn(`[Workbench] Failed to load domain pack for ${project.slug}:`, e);
    }

    // This is the Projection Model adapted for the Workbench.
    // Profile is now derived from the request auth context, not hardcoded.
    return NextResponse.json({
        profile,
        tenant: {
            id: project.id,
            slug: project.slug,
            name: project.title
        },
        system: {
            health: hermes.status === 'active' || hermes.status === 'trial' ? 'HEALTHY' : 'SUSPENDED',
            version: 'v1.0-STABLE'
        },
        identityRuntime: {
            brandName: project.title,
            baseCurrency: 'USD',
            voice: 'assistant',
            installedPacks: domainPack?.soul?.proactivity 
                ? ['snarai-core', 'objection-handler', 'concierge']
                : []
        },
        knowledgeRuntime: {
            indexes: domainPack?.knowledgeDef?.documents 
                ? [
                    { id: 'master_dossier', name: 'Master Dossier', status: 'ACTIVE', size: '24KB' },
                    { id: 'fideicomiso', name: 'Fideicomiso & Legal', status: 'ACTIVE', size: '12KB' }
                  ]
                : []
        },
        capabilityMesh,
        operationsSnapshot: {
            activeSessions: sessionsRes?.count || 0,
            runningExecutions: runningRes?.count || 0,
            pendingJobs: pendingRes?.count || 0,
            errorRate: Number(errorRate.toFixed(4)),
            recentEvents: recentEvents
        },
        recentJournal
    });
}
