import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { hermesArtifacts } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { hasPortalPermission } from '@/lib/portal/permissions';
import { ArtifactLifecycleError, ArtifactLifecycleService } from '@/lib/content/delivery/artifact-lifecycle';
import {
  DELIVERY_DISABLED_RESPONSE,
  getArtifactRepository,
  isDeliveryEnabled,
} from '@/lib/content/delivery/service-factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v1/content/assets/:assetId/publish
 *
 * Publica una versión APROBADA. Requiere identidad humana (sesión de portal) y
 * permiso de contenido: publicar no es una acción de máquina.
 *
 * Doble interruptor: `P0_3_DELIVERY_ENABLED` (sistema) y `P0_3_PUBLISH_ENABLED`
 * (publicación). Sin ambos, 503.
 *
 * Al publicar una versión nueva, la anterior pasa a `replaced` y deja de servirse
 * automáticamente: el proxy exige `currentVersion`, así que los tokens de la
 * versión reemplazada quedan inútiles aunque no hayan expirado.
 *
 * Body: { version: number, note?: string }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  if (!isDeliveryEnabled() || process.env.P0_3_PUBLISH_ENABLED !== 'true') {
    return NextResponse.json(
      {
        success: false,
        ...DELIVERY_DISABLED_RESPONSE,
        code: 'PUBLISH_NOT_ENABLED',
        error:
          'La publicación no está habilitada: requiere P0_3_DELIVERY_ENABLED y P0_3_PUBLISH_ENABLED.',
      },
      { status: 503 },
    );
  }

  const { assetId } = await params;
  if (!assetId) {
    return NextResponse.json({ success: false, error: 'Missing assetId.' }, { status: 400 });
  }

  let body: { version?: unknown; note?: unknown } = {};
  try {
    body = (await req.json()) as { version?: unknown; note?: unknown };
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const version = typeof body.version === 'number' && Number.isInteger(body.version) ? body.version : null;
  if (version === null || version <= 0) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION', error: 'version debe ser un entero positivo.' },
      { status: 422 },
    );
  }

  try {
    const [artifact] = await db
      .select({ tenantId: hermesArtifacts.tenantId })
      .from(hermesArtifacts)
      .where(eq(hermesArtifacts.artifactId, assetId))
      .limit(1);

    if (!artifact) {
      return NextResponse.json({ success: false, error: 'Asset not found.' }, { status: 404 });
    }

    let portal;
    try {
      portal = await resolvePortalContext(artifact.tenantId);
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: 'PORTAL_SESSION_REQUIRED',
          error: 'Publicar exige una sesión de portal válida para la organización del artefacto.',
        },
        { status: 401 },
      );
    }

    if (portal.organization.slug.toLowerCase() !== artifact.tenantId.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Asset not found.' }, { status: 404 });
    }

    if (!hasPortalPermission(portal.tenant.permissions, 'growth.content')) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN_PERMISSION', error: "Falta 'growth.content'." },
        { status: 403 },
      );
    }

    const service = new ArtifactLifecycleService({
      repo: getArtifactRepository(),
      publishEnabled: true,
    });

    const published = await service.publish({
      artifactId: assetId,
      version,
      actor: { kind: 'human', id: `portal:${portal.tenant.actorId}` },
    });

    return NextResponse.json({
      success: true,
      assetId,
      version: published.version,
      status: published.status,
      notes: [
        'La versión publicada es la ÚNICA servible por el proxy firmado.',
        'Al publicar una nueva versión, la anterior queda `replaced` y sus tokens dejan de servir.',
      ],
    });
  } catch (error: unknown) {
    if (error instanceof ArtifactLifecycleError) {
      const status =
        error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'PUBLISH_DISABLED'
            ? 503
            : error.code === 'INVALID_TRANSITION' || error.code === 'STORAGE_NOT_READY' || error.code === 'CONFLICT'
              ? 409
              : 422;
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status },
      );
    }
    console.error('[ContentAPI] POST /assets/:id/publish failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}
