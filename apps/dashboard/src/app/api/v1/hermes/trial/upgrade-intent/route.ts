import { NextRequest, NextResponse } from 'next/server';
import { resolvePortalContext, tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { HermesTrialTimelineService } from '@/lib/hermes/trial/hermes-trial-timeline.service';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

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
    const planId = typeof body.planId === 'string' ? body.planId.trim() : 'growth';
    const planName = typeof body.planName === 'string' ? body.planName.trim() : 'Growth & Multimedia';

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

    const referenceId = `upg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // 2. Record UPGRADE_STARTED in forensic timeline
    try {
      await HermesTrialTimelineService.recordEvent(organizationSlug, 'UPGRADE_STARTED', {
        actorId: portalCtx.tenant.actorId,
        metadata: {
          referenceId,
          planId,
          planName,
          requestedAt: new Date().toISOString(),
        },
      });
    } catch (timelineErr) {
      console.warn('[UpgradeIntent] Notice recording timeline event:', timelineErr);
    }

    // 3. Persist upgrade intent into project extra_config
    if (db?.update) {
      try {
        await db
          .update(projects)
          .set({
            extraConfig: sql`jsonb_set(
              COALESCE(extra_config, '{}'::jsonb),
              '{upgrade_intent}',
              ${JSON.stringify({
                referenceId,
                planId,
                planName,
                status: 'REQUESTED',
                timestamp: new Date().toISOString(),
              })}::jsonb,
              true
            )`,
            updatedAt: new Date(),
          })
          .where(eq(projects.slug, organizationSlug));
      } catch (dbErr) {
        console.warn('[UpgradeIntent] Notice updating project extra_config:', dbErr);
      }
    }

    return NextResponse.json({
      ok: true,
      referenceId,
      organizationSlug,
      planId,
      planName,
      message: 'Intención de upgrade registrada exitosamente en Hermes OS.',
    });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/trial/upgrade-intent] Error:', err);
    return NextResponse.json(
      { ok: false, errorCode: 'INTERNAL_ERROR', message: err?.message || 'Error al registrar intención de upgrade.' },
      { status: 500 }
    );
  }
}
