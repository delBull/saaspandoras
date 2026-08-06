import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesJobs, hermesJournal } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;

    // Fetch queued jobs for scheduler state
    const [queuedRes] = await db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(hermesJobs)
        .where(and(eq(hermesJobs.tenantId, tenantId), eq(hermesJobs.state, 'Queued')));
    
    // Fetch last hour events for event bus
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const [eventsRes] = await db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(hermesJournal)
        .where(and(eq(hermesJournal.tenantId, tenantId), sql`${hermesJournal.createdAt} >= ${lastHour}`));

    // Fetch active sessions based on distinct request users in Running jobs
    const [sessionsRes] = await db.select({
        count: sql<number>`cast(count(distinct ${hermesJobs.request}->>'requester') as integer)`
    })
    .from(hermesJobs)
    .where(and(eq(hermesJobs.tenantId, tenantId), eq(hermesJobs.state, 'Running')));

    const queued = queuedRes?.count || 0;
    
    return NextResponse.json({
        engineStatus: 'ACTIVE',
        scheduler: {
            state: queued > 0 ? 'PROCESSING' : 'IDLE',
            queuedJobs: queued
        },
        eventBus: {
            subscribers: 5, // Static architecture metric
            eventsLastHour: eventsRes?.count || 0
        },
        sessions: {
            active: sessionsRes?.count || 0,
            peak: 5 // Need historical session data for real peak
        },
        executors: [
            { id: 'hermes-core-01', status: 'HEALTHY' }
        ]
    });
}
