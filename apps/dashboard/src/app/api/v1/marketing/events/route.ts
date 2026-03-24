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
    const { event, projectId, fingerprint, origin, metadata } = body;

    if (!event || !projectId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const eventType = event.toUpperCase();
    const parsedProjectId = parseInt(projectId);

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
    let leadRecord = await db.query.marketingLeads.findFirst({
        where: and(
            eq(marketingLeads.projectId, parsedProjectId),
            eq(marketingLeads.fingerprint, fingerprint)
        ),
        with: { project: true }
    });

    // 1.1 Create Lead if missing (Audit: Auto-Capture)
    if (!leadRecord) {
        const identityHash = createHash('sha256').update(`${parsedProjectId}-${fingerprint}`).digest('hex');
        const [newLead] = await db.insert(marketingLeads).values({
            projectId: parsedProjectId,
            fingerprint,
            identityHash,
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
    // Elite Normalization: Sort metadata keys for deterministic signature
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

    // 4. Bridge to Growth Engine if lead identified
    if (lead && eventRecord) {
        try {
            const { resolveGrowthAction } = await import("@/lib/marketing/growth-engine/engine");
            const { executeGrowthActions } = await import("@/lib/marketing/growth-engine/actions");

            const engineResult = resolveGrowthAction(eventType as any, {
                ...lead,
                metadata: lead.metadata as any
            });

            if (engineResult && engineResult.actions.length > 0) {
                await executeGrowthActions(
                    engineResult.actions, 
                    { lead: lead as any, project: (lead as any).project },
                    { 
                        ruleId: engineResult.ruleId || `EVENT_${eventType}`, 
                        ruleCondition: engineResult.ruleCondition,
                        isStressTest
                    },
                    engineResult.scoreChange
                );
            }
        } catch (engineErr) {
            console.error('❌ Growth Engine Execution Error:', engineErr);
            // We don't fail the event if the engine fails
        }
    }

    console.log(`📊 [Growth OS] Event tracked: ${eventType} for Project ${projectId}`);
    return NextResponse.json({ success: true, eventId: eventRecord.id });

  } catch (error: any) {
    console.error('❌ Marketing Event Fatal Error:', error);
    return NextResponse.json({ 
        error: 'Internal Server Error', 
        details: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
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
