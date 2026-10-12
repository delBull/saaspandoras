/**
 * 🗑️ DELETE /api/nexus/collaborators/remove
 * Remove a collaborator by email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { removeCollaborator, requireNexusAdmin } from '@saasfly/hermes-core';
import { db } from '@saasfly/db';
import { users } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";

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

export async function DELETE(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    if (!(await requireNexusAdmin(req))) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 403, headers: cors });
    }
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email query parameter is required' },
        { status: 400, headers: cors }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 🛡️ Sincronizar revocación: demoler privilegios del usuario vinculado en users
    const [linkedUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (linkedUser) {
      await db
        .update(users)
        .set({ role: 'user' as any })
        .where(eq(users.id, linkedUser.id));
    }

    const { getNexusAuthContext } = await import('@saasfly/shared');
    const auth = await getNexusAuthContext(req.headers);
    const orgId = auth.canonicalOrgId || 'pandoras';

    const removed = await removeCollaborator(cleanEmail, orgId);
    return NextResponse.json({ ok: true, removed }, { headers: cors });
  } catch (error: any) {
    console.error('[Nexus Collaborators Remove] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: cors }
    );
  }
}
