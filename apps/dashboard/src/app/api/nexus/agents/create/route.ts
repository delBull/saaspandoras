import { NextRequest, NextResponse } from 'next/server';
import { requireNexusAdmin } from '@/lib/nexus/collaborators-service';
import { createAgent } from '@/lib/nexus/agents-service';

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

export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    if (!(await requireNexusAdmin(req))) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 403, headers: cors });
    }
    
    const body = await req.json();
    if (!body.agentId || !body.name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: cors });
    }

    const { agent, plainSecret } = await createAgent(body);
    
    return NextResponse.json({ ok: true, agent, plainSecret }, { headers: cors });
  } catch (error: any) {
    console.error('[Nexus Agents Create] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: cors }
    );
  }
}
