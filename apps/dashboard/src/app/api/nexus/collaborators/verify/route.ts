/**
 * 🔐 GET /api/nexus/collaborators/verify?token=...
 * Verify collaborator token and return collaborator info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCollaboratorToken } from '@/lib/nexus/collaborators-service';

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-thirdweb-address, x-user-address',
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

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400, headers: cors });
    }

    const collaborator = await verifyCollaboratorToken(token);

    if (!collaborator) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401, headers: cors }
      );
    }

    return NextResponse.json({
      ok: true,
      collaborator: {
        id: collaborator.id,
        name: collaborator.name,
        email: collaborator.email,
        expiresAt: collaborator.expiresAt,
        lastAccessAt: collaborator.lastAccessAt,
      },
    }, { headers: cors });
  } catch (error: any) {
    console.error('[Nexus Collaborators Verify] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: cors }
    );
  }
}
