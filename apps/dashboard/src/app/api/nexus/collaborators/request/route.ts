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
} from '@saasfly/hermes-core';
import { notifyProvisioningRequest } from '@/lib/nexus/provisioning';

import { db } from '@saasfly/db';
import { marketingLeads } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";
import {
  NEXUS_DEFAULT_PHONE_COUNTRY_CODE,
  describePhoneFailure,
  normalizePhoneE164,
} from '@saasfly/shared/nexus-phone';
import { authRateLimiter, getTrustedClientIp } from '@saasfly/shared';

const PHONE_OPTIONS = { defaultCountryCode: NEXUS_DEFAULT_PHONE_COUNTRY_CODE };

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    if (
      origin === 'https://pandoras.finance' ||
      origin === 'https://nexus.pandoras.finance' ||
      origin === 'https://dash.pandoras.finance' ||
      origin === 'https://staging.dash.pandoras.finance' ||
      origin === 'https://staging.pandoras.finance' ||
      origin === 'https://pandoras.org' ||
      hostname.endsWith('.pandoras.finance') ||
      hostname.endsWith('.pandoras.org')
    ) {
      return true;
    }
    if (process.env.NODE_ENV !== 'production' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowed = isAllowedOrigin(origin);
  const allowOrigin = allowed && origin ? origin : 'https://nexus.pandoras.finance';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-thirdweb-address, x-user-address',
    ...(allowed ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);

  // Rate limit by IP: 5 requests / min
  const ip = getTrustedClientIp(req.headers);
  if (!(await authRateLimiter.isAllowed(`nexus-collab-request:ip:${ip}`))) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor, intenta de nuevo en un minuto.' },
      { status: 429, headers: cors }
    );
  }

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

    // Rate limit by email: 5 requests / min
    if (!(await authRateLimiter.isAllowed(`nexus-collab-request:email:${cleanEmail}`))) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes para este correo. Por favor, intenta de nuevo en un minuto.' },
        { status: 429, headers: cors }
      );
    }
    const cleanName: string = (name && typeof name === 'string' && name.trim()) ? name.trim() : (isNexusAdminEmail(cleanEmail) ? 'Admin' : (cleanEmail.split('@')[0] || 'Collaborator'));

    // Check if email already has an existing collaborator record (allows self-renewal)
    const existingCollaborator = await getCollaboratorByEmail(cleanEmail);
    const isExistingCollaborator = !!existingCollaborator;

    const isAdminCaller = await requireNexusAdmin(req);
    const isAdminTarget = isNexusAdminEmail(cleanEmail);

    // Anti-enumeración: la respuesta debe ser indistinguible exista o no el
    // colaborador. Antes un 403 "No existe un colaborador con este correo"
    // confirmaba qué correos están dados de alta (insumo perfecto para phishing
    // dirigido). El enlace sólo se envía si el registro existe.
    if (!isExistingCollaborator && !isAdminCaller) {
      return NextResponse.json(
        { ok: true, message: 'Si el correo está registrado como colaborador, recibirás un enlace de acceso.' },
        { status: 200, headers: cors }
      );
    }

    // Enforce role safety: only admin callers can assign elevated roles or custom permissions
    const effectiveRole = isAdminCaller
      ? (role || existingCollaborator?.role || 'COLLABORATOR')
      : (existingCollaborator?.role || 'COLLABORATOR');
    const effectivePermissions = isAdminCaller
      ? (permissions || existingCollaborator?.permissions || {})
      : (existingCollaborator?.permissions || {});

    // Resolve WhatsApp: provided in payload, or fallback to existing stored number, or marketing leads
    // El cliente NO es autoridad de formato: normalizamos en servidor con la misma
    // regla canónica que usa el formulario. Si no viene número, se conserva el
    // existente sin reinterpretarlo (datos legacy no se reescriben).
    let effectiveWhatsapp = existingCollaborator?.whatsappPhone ?? undefined;

    if (whatsappPhone && typeof whatsappPhone === 'string' && whatsappPhone.trim()) {
      const normalized = normalizePhoneE164(whatsappPhone, PHONE_OPTIONS);
      if (!normalized.ok) {
        return NextResponse.json(
          { error: describePhoneFailure(normalized.reason, PHONE_OPTIONS) },
          { status: 422, headers: cors }
        );
      }
      effectiveWhatsapp = normalized.value;
    }

    if (!effectiveWhatsapp) {
      try {
        const [lead] = await db
          .select({ phoneNumber: marketingLeads.phoneNumber })
          .from(marketingLeads)
          .where(eq(marketingLeads.email, cleanEmail))
          .limit(1);
        if (lead?.phoneNumber) {
          effectiveWhatsapp = lead.phoneNumber;
        }
      } catch {
        // Non-blocking lookup
      }
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

    // Misma forma de respuesta exista o no el colaborador (anti-enumeración).
    return NextResponse.json({
      ok: true,
      message: 'Si el correo está registrado como colaborador, recibirás un enlace de acceso.',
    }, { headers: cors });
  } catch (error: any) {
    console.error('[Nexus Collaborators Request] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: cors }
    );
  }
}
