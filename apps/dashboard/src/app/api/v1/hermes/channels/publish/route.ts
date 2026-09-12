/**
 * 📡 Hermes Sovereign Direct Channel Publishing Endpoint (FASE 2)
 * apps/dashboard/src/app/api/v1/hermes/channels/publish/route.ts
 *
 * POST /api/v1/hermes/channels/publish
 *
 * MANDATORY INVARIANTS:
 * 1. Authority derived exclusively from authenticated server session (canonicalOrgId).
 * 2. Requires active 'demand.distribute' capability grant.
 * 3. Never returns decrypted credentials, tokens, or plaintext secrets.
 * 4. Returns formal, uniform PublicationReceipt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveDemandSession } from '@/app/api/v1/hermes/demand/route';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { directChannelPublisher } from '@/lib/hermes/channels/publishers/direct-channel-publisher';
import type { PublicationPayload } from '@/lib/hermes/channels/publishers/publisher.types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await resolveDemandSession(req);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required.' },
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

    const body = await req.json().catch(() => ({}));
    const { integrationId, payload } = body;

    if (!integrationId || !payload) {
      return NextResponse.json(
        { ok: false, error: 'integrationId and payload are required.' },
        { status: 400 }
      );
    }

    const typedPayload: PublicationPayload = {
      text: payload.text || '',
      mediaUrls: payload.mediaUrls,
      contentType: payload.contentType || 'text',
      ctaUrl: payload.ctaUrl,
      idempotencyKey: payload.idempotencyKey,
    };

    const receipt = await directChannelPublisher.publishToChannel(
      session.canonicalOrgId,
      integrationId,
      typedPayload
    );

    return NextResponse.json(
      {
        ok: receipt.success,
        receipt,
      },
      { status: receipt.success ? 200 : 422 }
    );
  } catch (err: any) {
    console.error('[Hermes Publish API] Error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Publishing operation failed.' },
      { status: 500 }
    );
  }
}
