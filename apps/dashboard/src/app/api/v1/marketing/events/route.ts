import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeadEvents, marketingLeads, marketingIdentities, projects } from '@/db/schema';
import { eq, and, gt, sql, or, ilike } from 'drizzle-orm';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

const corsHeaders = (origin: string | null) => ({
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-stress-test",
    "Access-Control-Allow-Credentials": "true",
});

/**
 * POST /api/v1/marketing/events
 * 
 * Lightweight endpoint for tracking widget interactions (VIEW, CLICK).
 * Used by navigator.sendBeacon and fetch.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || req.headers.get("referer");

  try {
    const body = await req.json();
    const { event, projectId, projectSlug, fingerprint, metadata } = body;

    // Robust Resolution: Check slug, then numeric ID, then fallback from projectId string
    const requestedProjectIdentifier = projectSlug || projectId;

    if (!event || !requestedProjectIdentifier) {
        return NextResponse.json(
            { error: 'Missing required fields (event, projectId/projectSlug)' }, 
            { status: 400, headers: corsHeaders(origin) }
        );
    }

    const { withRetry } = await import("@/lib/database");

    return await withRetry(async () => {
        const eventType = event.toUpperCase();
        
        // 1. Project Resolution (Audit: Multi-Tenant / Resilient)
        let project: any = null;
        let resolutionMethod = 'unknown';

        // EXPLICIT ROUTING: Generic Origin Resolution
        let autoDiscoveredProjectId: number | null = null;
        if (origin) {
          try {
            const url = new URL(origin);
            const host = url.hostname.replace('www.', '');
            const projectMatch = await db.query.projects.findFirst({
              where: (projects, { sql }) => sql`${projects.allowedDomains}::jsonb ?? ${host}`,
              columns: { id: true }
            });
            if (projectMatch) {
              autoDiscoveredProjectId = projectMatch.id;
              console.info(`[Growth Engine] 🎯 Project Auto-Discovered: ID=${autoDiscoveredProjectId}, Host=${host}`);
            }
          } catch (e) { /* Ignore parse errors */ }
        }

        if (autoDiscoveredProjectId) {
            project = await db.query.projects.findFirst({
                where: (projects, { eq }) => eq(projects.id, autoDiscoveredProjectId as number)
            });
            resolutionMethod = 'origin_autodiscovery';
        } else if (isNaN(Number(requestedProjectIdentifier))) {
            project = await db.query.projects.findFirst({
                where: (projects, { ilike }) => ilike(projects.slug, requestedProjectIdentifier)
            });
            resolutionMethod = 'slug_match';
        } else {
            project = await db.query.projects.findFirst({
                where: (projects, { eq }) => eq(projects.id, Number(requestedProjectIdentifier))
            });
            resolutionMethod = 'id_match';
        }

        if (!project) {
            console.error(`[Growth Engine] ❌ Project not found: ${requestedProjectIdentifier}. Resolution: ${resolutionMethod}`);
            return NextResponse.json(
                { error: 'Project not found' }, 
                { status: 404, headers: corsHeaders(origin) }
            );
        }

        const parsedProjectId = project.id;
        
        // 2. Resolve Identity Context
        // Handle metadata structure flexibly (Support Narai's flatter structure)
        const walletAddress = body.walletAddress || metadata?.walletAddress || metadata?.wallet || body.wallet;
        const leadEmail = (body.email || metadata?.email || body.userEmail)?.toLowerCase?.() || null;
        const effectiveFingerprint = fingerprint || `anon_${createHash('md5').update(req.headers.get('user-agent') || 'unknown').digest('hex')}`;

        // 2.1 Resolve existing Lead record (Avoiding duplication)
        const orConditions = [];
        if (leadEmail) orConditions.push(eq(marketingLeads.email, leadEmail));
        if (walletAddress) orConditions.push(eq(marketingLeads.walletAddress, walletAddress));
        if (fingerprint) orConditions.push(eq(marketingLeads.fingerprint, fingerprint));
        
        if (orConditions.length === 0) orConditions.push(eq(marketingLeads.fingerprint, effectiveFingerprint));

        const leadRecordArray = await db.select().from(marketingLeads).where(
            and(
                eq(marketingLeads.projectId, parsedProjectId),
                or(...orConditions)
            )
        ).limit(1);

        let leadRecord: any = leadRecordArray.length > 0 ? { ...leadRecordArray[0], project } : null;

        // 2.2 Auto-Capture/Update or Create (Phase 90: Identity Fusion)
        if (leadRecord) {
            const updates: any = {};
            if (!leadRecord.email && leadEmail) updates.email = leadEmail;
            if (!leadRecord.walletAddress && walletAddress) updates.walletAddress = walletAddress;
            
            if (Object.keys(updates).length > 0) {
                await db.update(marketingLeads).set({ ...updates, updatedAt: new Date() }).where(eq(marketingLeads.id, leadRecord.id));
                Object.assign(leadRecord, updates);
            }
        } else {
            console.log(`[Growth OS] 👻 Creating anonymous lead for Project ${parsedProjectId} (Event: ${eventType})`);
            
            // Resolve Unified Identity
            const idQueryCondition = [];
            if (leadEmail) idQueryCondition.push(eq(marketingIdentities.email, leadEmail));
            if (walletAddress) idQueryCondition.push(eq(marketingIdentities.walletAddress, walletAddress));
            if (effectiveFingerprint) idQueryCondition.push(eq(marketingIdentities.fingerprint, effectiveFingerprint));
            
            let resolvedIdentityId = null;
            if (idQueryCondition.length > 0) {
                const existingIdentities = await db.select().from(marketingIdentities).where(or(...idQueryCondition)).limit(1);
                if (existingIdentities.length > 0) {
                    resolvedIdentityId = existingIdentities[0]?.id;
                } else {
                    const [newId] = await db.insert(marketingIdentities).values({
                        fingerprint: effectiveFingerprint,
                        email: leadEmail,
                        walletAddress: walletAddress,
                        metadata: { source: "events_api_anonymous" }
                    }).returning({ id: marketingIdentities.id });
                    resolvedIdentityId = newId?.id || null;
                }
            }

            // Create Contextual Lead
            const [newLead] = await db.insert(marketingLeads).values({
                projectId: parsedProjectId,
                identityId: resolvedIdentityId,
                email: leadEmail,
                walletAddress: walletAddress,
                fingerprint: effectiveFingerprint,
                identityHash: leadEmail || walletAddress || effectiveFingerprint,
                origin: origin || req.headers.get("referer"),
                scope: "b2c",
                intent: "explore",
                status: "active",
                metadata: { source: "events_api_anonymous" }
            }).returning();
            
            leadRecord = { ...newLead, project };
        }

        const lead = leadRecord;

        // 3. Semantic Deduplication
        const sortedMetadata = metadata ? Object.keys(metadata).sort().reduce((acc, key) => {
            acc[key] = metadata[key];
            return acc;
        }, {} as any) : {};

        const payloadString = JSON.stringify(sortedMetadata);
        const semanticHash = createHash('sha256')
            .update(`${lead?.id || effectiveFingerprint}-${eventType}-${payloadString}`)
            .digest('hex');

        const existingSemantic = await db.query.marketingLeadEvents.findFirst({
            where: eq(marketingLeadEvents.semanticHash, semanticHash)
        });

        if (existingSemantic) {
            return NextResponse.json(
                { success: true, throttled: true, semantic: true },
                { headers: corsHeaders(origin) }
            );
        }

        // 4. Log Event
        const [eventRecord] = await db.insert(marketingLeadEvents).values({
            leadId: lead?.id || null as any,
            type: eventType,
            semanticHash,
            payload: {
                fingerprint: effectiveFingerprint,
                origin: origin || req.headers.get('origin'),
                userAgent: req.headers.get('user-agent'),
                ...metadata
            }
        }).returning();

        if (!eventRecord) {
            throw new Error("Failed to log marketing event");
        }

        // 5. Growth Engine Connectivity (Offloaded/Selective for Save CPU)
        const effectiveLeadEmail = lead?.email || leadEmail;
        const HIGH_PRIORITY_EVENTS = ['IDENTIFY', 'FORM_SUBMIT', 'LEAD_SUBMIT', 'USER_IDENTIFIED', 'PURCHASE', 'CONVERSION'];
        const isHighPriority = HIGH_PRIORITY_EVENTS.includes(eventType);

        if (effectiveLeadEmail && lead && eventRecord && isHighPriority) {
            try {
                console.log(`[Growth OS] 🧠 Triggering Engine for HIGH_PRIORITY event: ${eventType} (${effectiveLeadEmail})`);
                
                const { computeBehavioralMetrics, resolveGrowthAction } = await import("@/lib/marketing/growth-engine/engine");
                const { executeGrowthActions } = await import("@/lib/marketing/growth-engine/actions");

                const recentEvents = await db.select()
                    .from(marketingLeadEvents)
                    .where(eq(marketingLeadEvents.leadId, lead.id))
                    .orderBy(sql`created_at DESC`)
                    .limit(20);

                const { intentScore, priorityScore, engagementLevel, profile } = computeBehavioralMetrics(lead as any, recentEvents || []);

                const engineEventType = eventType === 'IDENTIFY' ? 'LEAD_CAPTURED' : eventType;
                
                const existingGrowthMeta = (lead.metadata as any)?.growth;
                const isNewLead = !existingGrowthMeta?.executedActions || 
                    Object.keys(existingGrowthMeta.executedActions).length === 0;

                const engineResult = resolveGrowthAction(engineEventType as any, {
                    ...lead as any,
                    email: effectiveLeadEmail, 
                    intentScore,
                    priorityScore,
                    engagementLevel,
                    profile,
                    metadata: lead.metadata as any
                }, project);

                if (engineResult && engineResult.actions.length > 0) {
                    await executeGrowthActions(
                        engineResult.actions, 
                        { 
                            lead: { ...lead as any, email: effectiveLeadEmail, intentScore, priorityScore, engagementLevel, profile }, 
                            project: {
                                ...project as any,
                                name: (project as any).title || 'Protocolo Ecosystem',
                                businessCategory: (project as any).businessCategory || (project as any).business_category || 'other'
                            }
                        },
                        { 
                            ruleId: engineResult.ruleId || `EVENT_${eventType}`,
                            bypassCooldown: isNewLead
                        },
                        engineResult.scoreChange,
                        engineResult
                    );
                }
            } catch (engineErr) {
                console.error('❌ Growth Engine Execution Error:', engineErr);
            }
        } else if (!isHighPriority) {
            // Low priority events don't trigger the engine, saving massive CPU
            // console.log(`[Growth OS] ⚡ Skipping Engine for low-priority event: ${eventType}`);
        }

        console.log(`📊 [Growth OS] Event tracked: ${eventType} for Project ${parsedProjectId}`);
        return NextResponse.json(
            { success: true, eventId: eventRecord.id },
            { headers: corsHeaders(origin) }
        );
    });

  } catch (error: any) {
    console.error('❌ Marketing Event Fatal Error:', error);
    return NextResponse.json({ 
        error: 'Internal Server Error', 
        details: error?.message || 'Unknown error'
    }, { status: 500, headers: corsHeaders(origin) });
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin") || "*";
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
}
