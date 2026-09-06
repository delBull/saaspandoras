/**
 * 🔐 GET /api/v1/nexus/auth/me
 * Endpoint for legacy Nexus (or any other Nexus client) to resolve the actor's exact role and permissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-thirdweb-address, x-user-address, x-nexus-token',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // Resuelve el contexto exacto usando wallets en los headers o un magic link token
    const auth = await getNexusAuthContext(req.headers, token);

    return NextResponse.json({
      ok: true,
      auth: {
        isAuthenticated: auth.isAuthenticated,
        role: auth.role,
        permissions: auth.permissions,
        email: auth.email,
        name: auth.name,
      }
    }, { headers: cors });

  } catch (error: any) {
    console.error('[Nexus Auth Me] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: cors }
    );
  }
}
