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

    // Authorized if caller is an admin wallet OR if target email is an admin email
    const isAdminCaller = await requireNexusAdmin(req);
    const isAdminTarget = isNexusAdminEmail(cleanEmail);

    if (!isAdminCaller && !isAdminTarget) {
      return NextResponse.json(
        { error: 'Admin authentication required to invite external collaborators' },
        { status: 403, headers: cors }
      );
    }

    const { collaborator, magicLink } = await createOrUpdateCollaborator(
      cleanName,
      cleanEmail,
      role || 'COLLABORATOR',
      permissions || {}
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
