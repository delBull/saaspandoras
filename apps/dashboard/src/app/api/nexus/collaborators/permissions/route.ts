/**
 * 🔒 PATCH /api/nexus/collaborators/permissions
 * Update collaborator base role and granular capability overrides.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  updateCollaboratorPermissions,
  requireNexusAdmin,
} from '@/lib/nexus/collaborators-service';
import type { NexusPermissionsOverride } from '@/db/schema';

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-thirdweb-address, x-user-address',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function PATCH(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const isAdmin = await requireNexusAdmin(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin authorization required to modify permissions' },
        { status: 403, headers: cors }
      );
    }

    const body = await req.json();
    const { email, role, permissions } = body as {
      email?: string;
      role?: string;
      permissions?: NexusPermissionsOverride;
    };

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400, headers: cors }
      );
    }

    const result = await updateCollaboratorPermissions(
      email.trim().toLowerCase(),
      role.toUpperCase(),
      permissions || {}
    );

    if (!result.success || !result.collaborator) {
      return NextResponse.json(
        { error: 'Collaborator not found or could not be updated' },
        { status: 404, headers: cors }
      );
    }

    return NextResponse.json(
      { ok: true, collaborator: result.collaborator },
      { status: 200, headers: cors }
    );
  } catch (err: any) {
    console.error('[NexusPermissionsAPI] Error updating permissions:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error updating permissions' },
      { status: 500, headers: cors }
    );
  }
}
