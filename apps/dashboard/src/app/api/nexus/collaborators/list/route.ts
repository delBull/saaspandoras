/**
 * 📋 GET /api/nexus/collaborators/list
 * List all active collaborators.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listCollaborators, requireNexusAdmin } from '@/lib/nexus/collaborators-service';

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    if (!(await requireNexusAdmin(req))) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 403, headers: cors });
    }
    const collaborators = await listCollaborators();
    return NextResponse.json({ ok: true, collaborators }, { headers: cors });
  } catch (error: any) {
    console.error('[Nexus Collaborators List] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: cors }
    );
  }
}
