import { NextRequest, NextResponse } from 'next/server';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { HermesTrialTimelineService } from '@/lib/hermes/trial/hermes-trial-timeline.service';
import { db } from '@/db';
import { projects, installedProducts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * 🚫 POST /api/v1/hermes/trial/cancel
 *
 * Allows an authorized user or admin to cancel an ongoing trial early.
 * Updates project trialStatus to 'CANCELLED', suspends trial products,
 * and records the immutable event in the Sovereign Trial Timeline.
 */
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, errorCode: 'INVALID_JSON', message: 'Cuerpo de solicitud JSON inválido.' },
        { status: 400 }
      );
    }

    const organizationSlug = typeof body.organizationSlug === 'string' ? body.organizationSlug.trim() : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim() : 'User requested early trial cancellation';

    if (!organizationSlug) {
      return NextResponse.json(
        { ok: false, errorCode: 'VALIDATION_ERROR', message: 'organizationSlug es requerido.' },
        { status: 400 }
      );
    }

    // 1. Authorize via portal context
    const portalCtx = await tryResolvePortalContext(organizationSlug);
    if (!portalCtx) {
      return NextResponse.json(
        { ok: false, errorCode: 'UNAUTHORIZED', message: 'Acceso no autorizado al tenant.' },
        { status: 403 }
      );
    }

    const now = new Date();

    // 2. Audit and update projects table
    if (db) {
      try {
        await db
          .update(projects)
          .set({
            trialStatus: 'CANCELLED',
            updatedAt: now,
          })
          .where(and(eq(projects.slug, organizationSlug), eq(projects.tenantType, 'TRIAL')));

        // Suspend installed product
        await db
          .update(installedProducts)
          .set({
            status: 'suspended',
            updatedAt: now,
          })
          .where(eq(installedProducts.projectId, portalCtx.organization.projectId));
      } catch (dbErr) {
        console.warn('[TrialCancel] Notice updating project/product status in DB:', dbErr);
      }
    }

    // 3. Record TRIAL_CANCELLED event in timeline
    try {
      await HermesTrialTimelineService.recordEvent(organizationSlug, 'TRIAL_CANCELLED', {
        actorId: portalCtx.tenant.actorId,
        metadata: {
          cancelledAt: now.toISOString(),
          reason,
        },
      });
    } catch (timelineErr) {
      console.warn('[TrialCancel] Notice recording timeline event:', timelineErr);
    }

    return NextResponse.json({
      ok: true,
      organizationSlug,
      status: 'CANCELLED',
      message: `El periodo de prueba de '${organizationSlug}' ha sido cancelado exitosamente. Tus datos permanecen preservados en el Sovereign Vault.`,
    });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/trial/cancel] Error:', err);
    return NextResponse.json(
      { ok: false, errorCode: 'INTERNAL_ERROR', message: err?.message || 'Error al cancelar periodo de prueba.' },
      { status: 500 }
    );
  }
}
