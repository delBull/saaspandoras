import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { resolveCanonicalAuthSession } from '@/lib/hermes/auth/canonical-resolver';
import { HermesOverviewService } from '@/lib/hermes/overview/service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-overview-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationSlug') || undefined;

    // 1. Resolve Canonical Session (Authentication & Authorization)
    const session = await resolveCanonicalAuthSession(req, requestedSlug);
    if (!session) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required or invalid tenant authority.' }, { status: 401 });
    }

    // 2. Delegate to Domain Handler
    const { overview, organizationName } = await HermesOverviewService.getOverview(session);

    return NextResponse.json({ overview, organizationName });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/overview GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch overview' }, { status: 500 });
  }
}
