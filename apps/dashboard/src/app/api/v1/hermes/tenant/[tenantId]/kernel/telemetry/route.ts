import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesJobs, hermesJournal } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const tenantIdNum = Number(tenantId);

    if (!Number.isInteger(tenantIdNum) || tenantIdNum <= 0) {
        return NextResponse.json({ error: 'Invalid tenantId' }, { status: 400 });
    }

    const strTenantId = tenantIdNum.toString();

    const [journalRes] = await db.select({
        requests: sql<number>`cast(count(*) as integer)`,
        denials: sql<number>`cast(count(*) filter (where ${hermesJournal.executionStatus} = 'failed') as integer)`
    })
        .from(hermesJournal)
        .where(eq(hermesJournal.tenantId, strTenantId));

    const [jobsRes] = await db.select({
        redirects: sql<number>`cast(count(*) filter (where ${hermesJobs.providerId} is not null) as integer)`,
        queued: sql<number>`cast(count(*) filter (where ${hermesJobs.state} = 'Queued') as integer)`
    })
        .from(hermesJobs)
        .where(eq(hermesJobs.tenantId, strTenantId));

    return NextResponse.json({
        metrics: {
            requests: journalRes?.requests || 0,
            denials: journalRes?.denials || 0,
            redirects: jobsRes?.redirects || 0,
            queued: jobsRes?.queued || 0,
            averageLatencyMs: 0
        },
        healthCheck: 'HEALTHY'
    });
}
