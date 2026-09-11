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
import { notifyProvisioningRequest } from '@/lib/nexus/provisioning';

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
    const { name, email, role, permissions, whatsappPhone } = body as {
      name?: string;
      email?: string;
      role?: string;
      permissions?: any;
      whatsappPhone?: string;
    };

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: cors }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName: string = (name && typeof name === 'string' && name.trim()) ? name.trim() : (isNexusAdminEmail(cleanEmail) ? 'Admin' : (cleanEmail.split('@')[0] || 'Collaborator'));

    // Check if email already has an existing collaborator record (allows self-renewal)
    const existingCollaborator = await getCollaboratorByEmail(cleanEmail);
    const isExistingCollaborator = !!existingCollaborator;

    const isAdminCaller = await requireNexusAdmin(req);
    const isAdminTarget = isNexusAdminEmail(cleanEmail);

    // Enforce role safety: only admin callers can assign elevated roles or custom permissions
    const effectiveRole = isAdminCaller
      ? (role || existingCollaborator?.role || 'COLLABORATOR')
      : (existingCollaborator?.role || 'COLLABORATOR');
    const effectivePermissions = isAdminCaller
      ? (permissions || existingCollaborator?.permissions || {})
      : (existingCollaborator?.permissions || {});

    // Resolve WhatsApp: provided in payload, or fallback to existing stored number
    const effectiveWhatsapp = (whatsappPhone && typeof whatsappPhone === 'string' && whatsappPhone.trim())
      ? whatsappPhone.trim()
      : (existingCollaborator?.whatsappPhone || undefined);

    // Require WhatsApp phone number if not already present in the existing profile or admin target
    if (!effectiveWhatsapp && !isExistingCollaborator && !isAdminTarget) {
      return NextResponse.json(
        { error: 'WhatsApp phone number is required for Hermes notifications' },
        { status: 400, headers: cors }
      );
    }

    const { collaborator, magicLink } = await createOrUpdateCollaborator(
      cleanName,
      cleanEmail,
      effectiveRole,
      effectivePermissions,
      effectiveWhatsapp
    );

    // New collaborator invito → PENDING until admin approves. Notify #pandoras-alerts
    // so the provisioning request shows up in the admin queue. Renewals of an
    // existing ACTIVE collaborator are not re-notified.
    const isFreshPending = collaborator.status === 'PENDING' && (!existingCollaborator || existingCollaborator.status !== 'PENDING');
    if (isFreshPending) {
      void notifyProvisioningRequest({
        name: collaborator.name || cleanName || 'Collaborator',
        email: collaborator.email,
        whatsappPhone: effectiveWhatsapp || null,
        role: effectiveRole,
      });
    }

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
