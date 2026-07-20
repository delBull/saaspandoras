import { NextRequest, NextResponse } from 'next/server';
import { TelemetryDomainService } from '@/lib/domain/telemetry-domain-service';

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
        const result = await TelemetryDomainService.processEvent(
            body, 
            origin, 
            req.headers.get('user-agent'), 
            req.headers.get("referer")
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error }, 
                { status: result.status || 400, headers: corsHeaders(origin) }
            );
        }

        if (result.throttled) {
            return NextResponse.json(
                { success: true, throttled: true, semantic: true },
                { headers: corsHeaders(origin) }
            );
        }

        return NextResponse.json(
            { success: true, eventId: result.eventId },
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
