/**
 * 📡 Hermes Social Distribution Channel Revocation API
 * apps/dashboard/src/app/api/v1/hermes/channels/[id]/route.ts
 *
 * DELETE /api/v1/hermes/channels/[id]
 *
 * MANDATORY INVARIANTS:
 * 1. Authority derived exclusively from authenticated server session (canonicalOrgId).
 * 2. Cross-tenant mutation blocked (strictly enforces tenantId = canonicalOrgId).
 * 3. Revocation performs logical status update AND cryptographic destruction of secret material.
 * 4. Audit trail recorded in tamper-evident hash-chained SecurityAuditLogger.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveDemandSession } from '@/app/api/v1/hermes/demand/route';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { tenantChannelService } from '@/lib/hermes/channels/tenant-channel.service';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Integration id is required.' },
        { status: 400 }
      );
    }

    // Resolve authenticated context
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

    const actorId = req.headers.get('x-actor-id') || `user_${session.projectSlug}`;

    const result = await tenantChannelService.revokeChannel(
      session.canonicalOrgId,
      id,
      actorId
    );

    return NextResponse.json({
      ok: true,
      revoked: true,
      id: result.integrationId,
    });
  } catch (err: any) {
    console.error('[Hermes Channels API] DELETE error:', err);
    const message = err?.message || 'Failed to revoke channel.';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
