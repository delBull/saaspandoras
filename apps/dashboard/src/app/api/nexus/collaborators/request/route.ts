/**
 * 📧 POST /api/nexus/collaborators/request
 * Create/update collaborator and send magic link email.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createOrUpdateCollaborator,
  sendCollaboratorMagicLink,
  requireNexusAdmin,
  isNexusAdminEmail,
  getCollaboratorByEmail,
} from '@/lib/nexus/collaborators-service';

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
    const body = await req.json();
    const { name, email, role, permissions } = body as {
      name?: string;
      email?: string;
      role?: string;
      permissions?: any;
    };

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: cors }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName: string = (name && typeof name === 'string' && name.trim()) ? name.trim() : (isNexusAdminEmail(cleanEmail) ? 'Admin' : (cleanEmail.split('@')[0] || 'Collaborator'));

    // Authorized if:
    // 1. Caller is an admin wallet
    // 2. Target email is in ADMIN_EMAILS env var
    // 3. Target email already exists in nexus_collaborators (self-renewal of magic link)
    const isAdminCaller = await requireNexusAdmin(req);
    const isAdminTarget = isNexusAdminEmail(cleanEmail);

    // Check if email already has an existing collaborator record (allows self-renewal)
    const existingCollaborator = await getCollaboratorByEmail(cleanEmail);
    const isExistingCollaborator = !!existingCollaborator;

    if (!isAdminCaller && !isAdminTarget && !isExistingCollaborator) {
      return NextResponse.json(
        { error: 'Admin authentication required to invite external collaborators' },
        { status: 403, headers: cors }
      );
    }

    // Preserve existing role if self-renewal (don't downgrade admins)
    const effectiveRole = role || existingCollaborator?.role || 'COLLABORATOR';
    const effectivePermissions = permissions || existingCollaborator?.permissions || {};

    const { collaborator, magicLink } = await createOrUpdateCollaborator(
      cleanName,
      cleanEmail,
      effectiveRole,
      effectivePermissions
    );

    const sendResult = await sendCollaboratorMagicLink(
      collaborator.name || cleanName || 'Collaborator',
      collaborator.email,
      magicLink
    );

    if (!sendResult.ok) {
      return NextResponse.json(
        { error: sendResult.error, collaborator },
        { status: 500, headers: cors }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Magic link sent to email',
      collaborator: {
        id: collaborator.id,
        name: collaborator.name,
        email: collaborator.email,
        expiresAt: collaborator.expiresAt,
      },
    }, { headers: cors });
  } catch (error: any) {
    console.error('[Nexus Collaborators Request] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: cors }
    );
  }
}
