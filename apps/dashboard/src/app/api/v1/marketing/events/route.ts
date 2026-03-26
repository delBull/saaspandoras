import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeadEvents, marketingLeads } from '@/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { IntegrationKeyService } from '@/lib/integrations/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/marketing/events
 * 
 * Lightweight endpoint for tracking widget interactions (VIEW, CLICK).
 * Used by navigator.sendBeacon and fetch.
 */
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, projectId, projectSlug, fingerprint, origin, metadata } = body;

    const finalSlug = projectSlug || (isNaN(parseInt(projectId)) ? projectId : null);

    if (!event || (!projectId && !finalSlug)) {
        return NextResponse.json({ error: 'Missing required fields (event, projectId/projectSlug)' }, { status: 400 });
    }

    const { withRetry } = await import("@/lib/database");

    return await withRetry(async () => {
        const eventType = event.toUpperCase();
        
        // 0.5 Project Resolution (Audit: Multi-Tenant)
        let project: any = null;
        if (finalSlug) {
            project = await db.query.projects.findFirst({
                where: eq(sql`slug`, finalSlug)
            });
        } else if (projectId) {
            project = await db.query.projects.findFirst({
                where: eq(sql`id`, parseInt(projectId))
            });
        }

        if (!project) {
            console.warn(`[Growth Engine] ❌ Project not found: ${projectId || finalSlug}`);
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const parsedProjectId = project.id;

        // 0. Stress Test Safeguards (Audit: Surgical)
        const isStressTest = req.headers.get('x-stress-test') === 'true';
        if (isStressTest) {
        console.log(`[Growth Engine] 🧪 Stress Test Mode Active for ${projectId}`);
        // Simple throttle for stress burst (120/min)
        const now = Date.now();
        const throttleStore = (global as any).__stress_throttle || { count: 0, resetAt: now + 60000 };
        if (now > throttleStore.resetAt) {
            throttleStore.count = 1;
            throttleStore.resetAt = now + 60000;
        } else {
            throttleStore.count++;
            if (throttleStore.count > 120) {
                return NextResponse.json({ error: "Stress test throttle reached (120/min)" }, { status: 429 });
            }
        }
        (global as any).__stress_throttle = throttleStore;
        }
        
        // 1. Resolve Lead (via fingerprint + project)
        // ELITE: Fallback fingerprint if missing to avoid DB errors
        const effectiveFingerprint = fingerprint || `anon_${createHash('md5').update(req.headers.get('user-agent') || 'unknown').digest('hex')}`;
        const leadEmail = metadata?.email;

        let leadRecord = await db.query.marketingLeads.findFirst({
            where: and(
                eq(marketingLeads.projectId, parsedProjectId),
                leadEmail 
                ? sql`(${marketingLeads.fingerprint} = ${effectiveFingerprint} OR ${marketingLeads.email} = ${leadEmail})`
                : eq(marketingLeads.fingerprint, effectiveFingerprint)
            ),
            with: { project: true }
        });

        // 1.1 Create Lead if missing (Audit: Auto-Capture)
        if (!leadRecord) {
            const identityHash = createHash('sha256').update(`${parsedProjectId}-${effectiveFingerprint}-${leadEmail || ''}`).digest('hex');
            
            // ELITE FIX: Capture email/name immediately if available in metadata
            const initialEmail = leadEmail;
            const initialName = metadata?.name;

            const [newLead] = await db.insert(marketingLeads).values({
                projectId: parsedProjectId,
                fingerprint: effectiveFingerprint,
                identityHash,
                email: initialEmail,
                name: initialName,
                status: 'NEW' as any,
                intent: 'explore' as any,
                metadata: { first_origin: origin || "unknown" }
            }).returning();
            
            if (!newLead) {
                throw new Error("Failed to create anonymous lead");
            }
            
            // Refetch with project relation
            leadRecord = await db.query.marketingLeads.findFirst({
                where: eq(marketingLeads.id, newLead.id),
                with: { project: true }
            }) as any;
        }

        const lead = leadRecord;

        // 2. Semantic Deduplication (Audit 1)
        // We hash the context (Lead/Fingerprint + Event + Content) to avoid duplicates across devices/refreshes
        const sortedMetadata = metadata ? Object.keys(metadata).sort().reduce((acc, key) => {
            acc[key] = metadata[key];
            return acc;
        }, {} as any) : {};

        const payloadString = JSON.stringify(sortedMetadata);
        const semanticHash = createHash('sha256')
            .update(`${lead?.id || fingerprint}-${eventType}-${payloadString}`)
            .digest('hex');

        const existingSemantic = await db.query.marketingLeadEvents.findFirst({
            where: eq(marketingLeadEvents.semanticHash, semanticHash)
        });

        if (existingSemantic) {
            console.log(`⏭️ [Growth OS] Throttled semantic duplicate: ${eventType}`);
            return NextResponse.json({ success: true, throttled: true, semantic: true });
        }

        // 3. Time-based Throttling (Safety Net)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        if (lead) {
            const recentEvent = await db.query.marketingLeadEvents.findFirst({
                where: and(
                    eq(marketingLeadEvents.leadId, lead.id),
                    eq(marketingLeadEvents.type, eventType),
                    gt(marketingLeadEvents.createdAt, tenMinutesAgo)
                )
            });

            if (recentEvent) {
                console.log(`⏭️ [Growth OS] Throttled duplicate time-window: ${eventType}`);
                return NextResponse.json({ success: true, throttled: true });
            }
        }

        // 4. Log Event
        const [eventRecord] = await db.insert(marketingLeadEvents).values({
            leadId: lead?.id || null as any,
            type: eventType,
            semanticHash,
            payload: {
                fingerprint,
                origin: origin || req.headers.get('origin'),
                userAgent: req.headers.get('user-agent'),
                ...metadata
            }
        }).returning();

        if (!eventRecord) {
            throw new Error("Failed to log marketing event");
        }

        // 4.1. Identity Auto-Capture (Surgical: Audit 1)
        if (lead && (metadata?.email || metadata?.name)) {
            const email = metadata?.email;
            const name = metadata?.name;
            
            if ((email && lead.email !== email) || (name && lead.name !== name)) {
                console.log(`[Growth OS] Identity updated for Lead ${lead.id}: ${email || 'no-email'}`);
                await db.update(marketingLeads)
                    .set({ 
                        email: email || lead.email, 
                        name: name || lead.name,
                        updatedAt: new Date() 
                    })
                    .where(eq(marketingLeads.id, lead.id));
                
                // Update local lead object for the engine
                if (email) (lead as any).email = email;
                if (name) (lead as any).name = name;
            }
        }

        // 4.2. Bridge to Growth Engine if lead identified
        if (lead && eventRecord) {
            try {
                const { computeBehavioralMetrics, resolveGrowthAction } = await import("@/lib/marketing/growth-engine/engine");
                const { executeGrowthActions } = await import("@/lib/marketing/growth-engine/actions");

                // Fetch recent events to compute metrics
                const leadWithEvents = await db.query.marketingLeads.findFirst({
                    where: eq(marketingLeads.id, lead.id),
                    with: { 
                    events: {
                        orderBy: (events, { desc }) => [desc(events.createdAt)],
                        limit: 20
                    }
                    }
                });

                const { 
                intentScore, 
                priorityScore, 
                engagementLevel, 
                profile 
                } = computeBehavioralMetrics(lead as any, leadWithEvents?.events || []);

                const engineResult = resolveGrowthAction(eventType as any, {
                    ...lead as any,
                    intentScore,
                    priorityScore,
                    engagementLevel,
                    profile,
                    metadata: lead.metadata as any
                }, project); // Use the pre-resolved project object

                // ELITE: Trigger actions if ruleId starts with PH80 or actions exist
                if (engineResult && (engineResult.actions.length > 0 || (engineResult.ruleId?.startsWith('PH80')))) {
                    await executeGrowthActions(
                        engineResult.actions, 
                        { 
                            lead: { ...lead as any, intentScore, priorityScore, engagementLevel, profile }, 
                            project: (lead as any).project 
                        },
                        { 
                            ruleId: engineResult.ruleId || `EVENT_${eventType}`, 
                            ruleCondition: engineResult.ruleCondition,
                            isStressTest
                        },
                        engineResult.scoreChange,
                        engineResult
                    );
                }
            } catch (engineErr) {
                console.error('❌ Growth Engine Execution Error:', engineErr);
            }
        }

        console.log(`📊 [Growth OS] Event tracked: ${eventType} for Project ${projectId}`);
        return NextResponse.json({ success: true, eventId: eventRecord.id });
    });

  } catch (error: any) {
    console.error('❌ Marketing Event Fatal Error:', error);
    return NextResponse.json({ 
        error: 'Internal Server Error', 
        details: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack available',
        db_url_exists: !!process.env.DATABASE_URL
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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-stress-test",
        "Access-Control-Allow-Credentials": "true",
      },
    });
}
