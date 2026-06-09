import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimiter } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';

const ALLOWED_ORIGINS = [
  /^https:\/\/[a-zA-Z0-9-]*\.?pandoras\.finance$/,
  /^https:\/\/[a-zA-Z0-9-]*\.?pandoras\.org$/,
  /^https:\/\/[a-zA-Z0-9-]*\.?vercel\.app$/,
];

function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.some((re) => re.test(origin))
    || origin.startsWith('http://localhost:');
}

function getCorsOrigin(origin: string | null): string {
  if (origin && isOriginAllowed(origin)) return origin;
  return 'https://dash.pandoras.finance';
}

function corsHeaders(origin: string | null) {
  const allowedOrigin = getCorsOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

/**
 * POST /api/v1/analytics
 *
 * Compatibility endpoint for Narai and other protocols.
 * Silently success to stop 404s in protocol consoles.
 */
const MAX_BODY_BYTES = 50 * 1024; // 50KB — reject oversized payloads early

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';

    // Reject oversized payloads before any processing
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413, headers: corsHeaders(origin) }
      );
    }

    if (!(await apiRateLimiter.isAllowed(`analytics:${ip}`))) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json({ success: true, processed: 'legacy_bridge' }, {
      status: 200,
      headers: corsHeaders(origin),
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
    return POST(req);
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
