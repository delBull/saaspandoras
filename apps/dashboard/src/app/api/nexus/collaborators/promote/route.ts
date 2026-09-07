import { NextRequest, NextResponse } from 'next/server';
import { requireNexusAdmin } from '@/lib/nexus/collaborators-service';
import { db } from '@/db';
import { nexusCollaborators } from '@/db/schema';
import { eq } from 'drizzle-orm';

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-thirdweb-address',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const isAdmin = await requireNexusAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Requires SUPER_ADMIN' }, { status: 401, headers: cors });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400, headers: cors });
    }

    const [updated] = await db.update(nexusCollaborators)
      .set({ role: 'ADMIN' })
      .where(eq(nexusCollaborators.email, email.toLowerCase()))
      .returning({ id: nexusCollaborators.id, email: nexusCollaborators.email, role: nexusCollaborators.role });

    if (!updated) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404, headers: cors });
    }

    return NextResponse.json({ ok: true, updated }, { headers: cors });
  } catch (err: any) {
    console.error('Error promoting collaborator:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: cors });
  }
}
