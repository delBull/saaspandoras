import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesMediaRequests } from '@/db/schema';
import { TenantAuthorityService } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { CapabilityGrantService, SUPPORTED_MEDIA_CAPABILITIES } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { sendBusinessNotification } from '@/lib/discord/business-notifier';
import { HermesNotificationDispatcher } from '@/lib/hermes/notifications/notification-dispatcher';

export const dynamic = 'force-dynamic';

export const ACTIVATION_CAPABILITY = 'hermes.media.activation';

/**
 * POST /api/v1/hermes/media/activate
 * Tenant-facing "Solicitud de Activación" for Media Co capabilities.
 *
 * The tenant (via its authorized portal session) requests activation of a Media
 * Co capability. The request is persisted (status=REQUESTED) and routed to the
 * Hermes OS operations team via:
 *   1. Discord (sendBusinessNotification → DISCORD_WEBHOOK_PANDORAS_ALERTS)
 *   2. Hermes OS bot (HermesNotificationDispatcher → @pandorasHermes_bot)
 *
 * This is a PREVIEW of a future paid capability: today it only records the
 * request and notifies; the actual grant is approved by an admin from the
 * Hermes Tenants tab (POST /api/v1/hermes/tenants/grants).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, capability } = body;

    if (!tenantId || !capability) {
      return NextResponse.json(
        { ok: false, error: 'tenantId and capability are required' },
        { status: 400 }
      );
    }

    // Capability must be a known Media Co capability.
    const known = SUPPORTED_MEDIA_CAPABILITIES.find(c => c.id === capability);
    if (!known) {
      return NextResponse.json(
        { ok: false, error: `Capability '${capability}' is not a supported Media Co capability.` },
        { status: 400 }
      );
    }

    // 1. Resolve canonical tenant server-side (fail-closed).
    const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantId);
    if (!canonical) {
      return NextResponse.json(
        { ok: false, error: `Tenant '${tenantId}' does not exist or is not provisioned.` },
        { status: 404 }
      );
    }

    // 2. Portal session boundary: the tenant can only request activation for its OWN tenant.
    let ctx;
    try {
      ctx = await resolvePortalContext(canonical.projectSlug);
    } catch (err: any) {
      return NextResponse.json(
        {
          ok: false,
          error: `Not authorized to request activation for tenant '${canonical.projectSlug}'.`,
          code: err?.code || 'PORTAL_SESSION_UNAUTHORIZED',
        },
        { status: err?.code === 'NO_SESSION' || err?.code === 'INVALID_SESSION' ? 401 : 403 }
      );
    }

    const authorizedSlug = ctx.organization.slug.toLowerCase();

    // 3. If already granted, nothing to do.
    const alreadyGranted = await CapabilityGrantService.isCapabilityGranted(authorizedSlug, capability);
    if (alreadyGranted) {
      return NextResponse.json(
        { ok: false, error: `Capability '${capability}' is already active for '${authorizedSlug}'.`, code: 'ALREADY_GRANTED' },
        { status: 409 }
      );
    }

    // 4. Persist the activation request.
    const requestId = `req_act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const correlationId = `corr_act_${requestId}`;

    try {
      if (db) {
        await db.insert(hermesMediaRequests).values({
          id: requestId,
          requestId,
          correlationId,
          tenantId: authorizedSlug,
          capability,
          requestedBy: ctx.tenant.actorId,
          provider: 'sofia',
          status: 'REQUESTED',
          prompt: `[ACTIVATION_REQUEST] ${known.label} (${capability})`,
          briefJson: { activationRequest: true, capability, label: known.label },
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error(`[MediaActivateAPI] DB insert failed for tenant ${authorizedSlug}:`, err);
      return NextResponse.json(
        { ok: false, error: 'Failed to record activation request.' },
        { status: 500 }
      );
    }

    // 5. Fire operations notifications (non-blocking, best-effort).
    const displayTitle = canonical.title || authorizedSlug;
    sendBusinessNotification(
      'HERMES_MEDIA_CO_ACTIVATION_REQUESTED',
      {
        workspace: displayTitle,
        tenant: authorizedSlug,
        capability: known.label,
        capabilityId: capability,
        requestedBy: ctx.tenant.actorId,
        requestId,
        action: 'Approve in Admin → Hermes Tenants',
      },
      'info'
    ).catch(err => console.error('[MediaActivateAPI] Discord notify error:', err));

    try {
      const dispatcher = new HermesNotificationDispatcher();
      await dispatcher.dispatchMediaCoActivationRequest(
        ctx.organization.id,
        displayTitle,
        { capability, label: known.label, requestedBy: ctx.tenant.actorId, requestId }
      );
    } catch (err: any) {
      console.warn('[MediaActivateAPI] Hermes bot notification failed:', err?.message);
    }

    return NextResponse.json(
      {
        ok: true,
        requestId,
        tenantId: authorizedSlug,
        capability,
        status: 'REQUESTED',
        message: `Activación de '${known.label}' solicitada. El equipo Hermes recibirá la notificación y podrá aprobarla.`,
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to request Media Co activation' },
      { status: 500 }
    );
  }
}