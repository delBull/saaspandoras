/**
 * 🛰️ Growth OS API Boundary — Overview Service
 * /api/v1/growth/overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { resolveCanonicalAuthSession } from '@/lib/hermes/auth/canonical-resolver';
import { GrowthOverviewService } from '@/lib/growth/overview/service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`growth-overview-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationId') || undefined;

    // 1. Resolve Canonical Session
    const session = await resolveCanonicalAuthSession(req, requestedSlug);
    if (!session) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Authentication required or invalid authority.' }, { status: 401 });
    }

    // 2. Delegate to Domain Handler
    const overview = await GrowthOverviewService.getOverview(session);

    return NextResponse.json(overview);
  } catch (error: any) {
    console.error('[Growth API: overview GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
