import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeadEvents, marketingLeads } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { IntegrationKeyService } from '@/lib/integrations/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/marketing/events
 * 
 * Lightweight endpoint for tracking widget interactions (VIEW, CLICK).
 * Used by navigator.sendBeacon and fetch.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, projectId, fingerprint, origin, metadata } = body;

    if (!event || !projectId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Validate Project/API Key optionally (Beacon might not send headers easily)
    // For now, we trust the projectId but log origin for verification
    
    // 2. Find the Lead if exists via fingerprint to link the event
    // This allows us to track conversion from VIEW -> CLICK -> LEAD even before they give an email
    const lead = await db.query.marketingLeads.findFirst({
        where: and(
            eq(marketingLeads.projectId, parseInt(projectId)),
            eq(marketingLeads.fingerprint, fingerprint)
        )
    });

    // 3. Log Event
    await db.insert(marketingLeadEvents).values({
        leadId: lead?.id || null as any, // If lead doesn't exist yet, it's an anonymous event
        type: event.toLowerCase(),
        payload: {
            fingerprint,
            origin: origin || req.headers.get('origin'),
            userAgent: req.headers.get('user-agent'),
            ...metadata
        }
    });

    console.log(`📊 [Growth OS] Event tracked: ${event} for Project ${projectId}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Marketing Event Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
        "Access-Control-Allow-Headers": "Content-Type, x-api-key",
        "Access-Control-Allow-Credentials": "true",
      },
    });
}
