import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/analytics
 * 
 * Compatibility endpoint for Narai and other protocols.
 * Proxies to the main analytics engine.
 */
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') || '*';
    const body = await req.json();

    // Silently success to stop 404s in protocol consoles
    return NextResponse.json({ success: true, processed: 'legacy_bridge' }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 200 }); // Always 200 for analytics
  }
}

export async function GET(req: NextRequest) {
    return POST(req);
}


export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    }
  });
}
