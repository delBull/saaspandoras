/**
 * 🔐 GET /api/nexus/collaborators/verify?token=...
 * Verify collaborator token and return collaborator info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCollaboratorToken } from '@saasfly/hermes-core';
import { authRateLimiter, getTrustedClientIp } from '@saasfly/shared';

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-thirdweb-address, x-user-address',
    ...(allowed ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);

  // Rate limit: 5 token verifications per minute per IP
  const ip = getTrustedClientIp(req.headers);
  if (!(await authRateLimiter.isAllowed(`nexus-collab-verify:ip:${ip}`))) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor, intenta de nuevo en un minuto.' },
      { status: 429, headers: cors }
    );
  }
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
