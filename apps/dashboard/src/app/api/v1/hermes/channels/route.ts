/**
 * 📡 Hermes Social Distribution Channels API
 * apps/dashboard/src/app/api/v1/hermes/channels/route.ts
 *
 * GET  /api/v1/hermes/channels
 * POST /api/v1/hermes/channels/connect
 *
 * MANDATORY INVARIANTS:
 * 1. Authority is EXCLUSIVELY derived from server-side authenticated context (canonicalOrgId).
 * 2. Client-provided tenantId is NEVER an authority (only tested for anti-spoofing mismatch).
 * 3. Never returns decrypted credentials, ciphertext, IVs, or auth tags in API responses.
 * 4. AES-256-GCM envelope vault binds canonicalOrgId into AAD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveDemandSession } from '@/app/api/v1/hermes/demand/route';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { tenantChannelService, type ConnectChannelInput } from '@/lib/hermes/channels/tenant-channel.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hermes/channels
 * Lists configured distribution channels and the channel capabilities catalog.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientHint = searchParams.get('tenantId') || searchParams.get('org') || undefined;

    const session = await resolveDemandSession(req, clientHint);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required or invalid session.' },
        { status: 401 }
      );
    }

    // Capability check
    const hasViewAccess = await CapabilityGrantService.isCapabilityGranted(
      session.projectSlug,
      'demand.view'
    );
    if (!hasViewAccess) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Tenant missing 'demand.view' capability." },
        { status: 403 }
      );
    }

    const { channels, catalog } = await tenantChannelService.listChannels(session.canonicalOrgId);

    // ZERO SECRETS GUARANTEE: channels DTOs are pre-sanitized by tenantChannelService
    return NextResponse.json({
      ok: true,
      count: channels.length,
      channels,
      catalog,
    });
  } catch (err: any) {
    console.error('[Hermes Channels API] GET error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to list channels.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/hermes/channels/connect
 * Connects and encrypts a new social channel.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clientTenantHint = body.tenantId || body.organizationSlug || undefined;

    // Resolve authenticated session with anti-spoofing verification
    const session = await resolveDemandSession(req, clientTenantHint);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required or invalid tenant authority.' },
        { status: 401 }
      );
    }

    // Capability check
    const hasDistributeAccess = await CapabilityGrantService.isCapabilityGranted(
      session.projectSlug,
      'demand.distribute'
    );
    if (!hasDistributeAccess) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Tenant missing 'demand.distribute' capability." },
        { status: 403 }
      );
    }

    const { channel, accountName, accountHandle, credentials, supportedCapabilities, metadata } = body;

    if (!channel || !accountName || !accountHandle || !credentials) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: channel, accountName, accountHandle, credentials.' },
        { status: 400 }
      );
    }

    const actorId = req.headers.get('x-actor-id') || `user_${session.projectSlug}`;

    const input: ConnectChannelInput = {
      channel,
      accountName,
      accountHandle,
      credentials,
      supportedCapabilities,
      metadata,
    };

    const newChannel = await tenantChannelService.connectChannel(
      session.canonicalOrgId,
      actorId,
      input
    );

    return NextResponse.json(
      {
        ok: true,
        channel: newChannel,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[Hermes Channels API] POST error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to connect channel.' },
      { status: 400 }
    );
  }
}
