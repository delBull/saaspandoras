import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { hermesArtifacts } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { hasPortalPermission } from '@/lib/portal/permissions';
import { authorizeTenantCapability } from '@/lib/authorization/authorize-tenant-capability';
import {
  areTenantGrantsEnforced,
  getCanonicalOrganizationResolver,
  getTenantGrantRepository,
} from '@/lib/authorization/service-factory';
import {
  ArtifactLifecycleError,
  ArtifactLifecycleService,
} from '@/lib/content/delivery/artifact-lifecycle';
import {
  DELIVERY_DISABLED_RESPONSE,
  getArtifactRepository,
  isDeliveryEnabled,
} from '@/lib/content/delivery/service-factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HUMAN_REQUIRED = {
  success: false as const,
  code: 'HUMAN_SESSION_REQUIRED',
  error:
    'La aprobación de contenido requiere una identidad humana autenticada por sesión de portal. Una API key no puede aprobar contenido.',
  approvalRequirements: [
    'Identidad humana autenticada (sesión de portal), no una API key.',
    'Distinta del creador y del propietario de la identidad de máquina creadora.',
    'Distinta del último editor humano de la versión.',
    'La aprobación se registra con actor, fecha, estado anterior/nuevo y motivo.',
  ],
};

function errorStatus(error: ArtifactLifecycleError): number {
  switch (error.code) {
    case 'APPROVER_IS_CREATOR':
    case 'APPROVER_IS_LAST_EDITOR':
    case 'MACHINE_CANNOT_APPROVE':
    case 'UNRESOLVED_OWNER':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
    case 'INVALID_TRANSITION':
    case 'STORAGE_NOT_READY':
    case 'MUST_UNPUBLISH_FIRST':
    case 'PUBLISH_DISABLED':
      return 409;
    case 'REASON_REQUIRED':
      return 422;
    default:
      return 400;
  }
}

/**
 * POST /api/v1/content/assets/:assetId/approval
 *
 * Aprobación editorial por IDENTIDAD HUMANA (sesión de portal).
 *
 * Frontera de seguridad (P0.3):
 *  - Una API key NO puede aprobar: responde 403 HUMAN_SESSION_REQUIRED.
 *  - La identidad humana se resuelve de la sesión (`resolvePortalContext`), nunca
 *    del body ni de un header.
 *  - El tenant se resuelve del ARTEFACTO; la sesión debe tener acceso a esa
 *    organización, y el aprobador debe ser distinto del creador, del propietario
 *    de la identidad de máquina creadora y del último editor humano.
 *  - La regla vive en el dominio (`ArtifactLifecycleService`): ocultar botones no
 *    es un control.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  // 1. Si viene autenticado por API key, se rechaza explícitamente (sin tocar DB).
  const authorization = req.headers.get('authorization');
  if (authorization && authorization.trim().length > 0) {
    return NextResponse.json(HUMAN_REQUIRED, { status: 403 });
  }

  // 2. Capacidad habilitada en servidor (migración 0095 aplicada + flag).
  if (!isDeliveryEnabled()) {
    return NextResponse.json({ success: false, ...DELIVERY_DISABLED_RESPONSE }, { status: 503 });
  }

  const { assetId } = await params;
  if (!assetId) {
    return NextResponse.json({ success: false, error: 'Missing assetId.' }, { status: 400 });
  }

  let body: { status?: unknown; version?: unknown; note?: unknown } = {};
  try {
    body = (await req.json()) as { status?: unknown; version?: unknown; note?: unknown };
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const status = typeof body.status === 'string' ? body.status.trim().toLowerCase() : '';
  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json(
      { success: false, error: "status must be 'approved' or 'rejected'." },
      { status: 422 },
    );
  }
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : '';
  const requestedVersion =
    typeof body.version === 'number' && Number.isInteger(body.version) && body.version > 0
      ? body.version
      : null;

  try {
    // 3. Tenant resuelto del artefacto (nunca del cliente).
    const [artifact] = await db
      .select({ artifactId: hermesArtifacts.artifactId, tenantId: hermesArtifacts.tenantId })
      .from(hermesArtifacts)
      .where(eq(hermesArtifacts.artifactId, assetId))
      .limit(1);

    if (!artifact) {
      return NextResponse.json({ success: false, error: 'Asset not found.' }, { status: 404 });
    }

    // 4. Sesión de portal verificada para ESA organización (fail-closed).
    let context;
    try {
      context = await resolvePortalContext(artifact.tenantId);
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: 'PORTAL_SESSION_REQUIRED',
          error:
            'Se requiere una sesión de portal válida con acceso a la organización del artefacto.',
        },
        { status: 401 },
      );
    }

    // 5. La organización de la sesión debe ser la del artefacto.
    if (context.organization.slug.toLowerCase() !== artifact.tenantId.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Asset not found.' },
        { status: 404 },
      );
    }

    // 6. Autorización.
    //    Modo `P0_1_GRANTS_ENFORCED=true`: la autoridad es el GRANT de tenant
    //    (capability canónica + identidad + scope). Si no hay grant, se deniega.
    //    Modo por defecto: se conserva la autoridad previa del portal (rollout).
    if (areTenantGrantsEnforced()) {
      const outcome = await authorizeTenantCapability({
        actor: { kind: 'human', subjectId: `portal:${context.tenant.actorId}` },
        requestedTenant: { canonicalOrgId: context.tenant.organizationId },
        capability: 'content.asset.approve',
        deps: {
          grants: getTenantGrantRepository(),
          organizations: getCanonicalOrganizationResolver(),
        },
      });

      if (!outcome.allowed) {
        return NextResponse.json(
          {
            success: false,
            code: 'FORBIDDEN_TENANT_CAPABILITY',
            reason: outcome.reason,
            error: `La identidad no tiene la capability 'content.asset.approve' en esta organización (${outcome.reason}).`,
          },
          { status: 403 },
        );
      }
    } else if (!hasPortalPermission(context.tenant.permissions, 'growth.content')) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_PERMISSION',
          error: "La sesión no tiene el permiso 'growth.content'.",
        },
        { status: 403 },
      );
    }

    const approver = { kind: 'human' as const, id: `portal:${context.tenant.actorId}` };
    const repo = getArtifactRepository();
    // Las transiciones de negocio no requieren adaptador de storage.
    const service = new ArtifactLifecycleService({ repo, publishEnabled: false });

    const versions = await repo.listVersions(assetId);
    if (versions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El artefacto no tiene versiones gestionadas.',
          code: 'NO_VERSION',
        },
        { status: 409 },
      );
    }

    const targetVersion =
      requestedVersion ??
      versions.filter((v) => v.status === 'in_review').reduce<number | null>(
        (max, v) => (max === null || v.version > max ? v.version : max),
        null,
      );

    if (targetVersion === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay ninguna versión en revisión para aprobar o rechazar.',
          code: 'NO_PENDING_VERSION',
        },
        { status: 409 },
      );
    }

    if (status === 'approved') {
      const approved = await service.approve({
        artifactId: assetId,
        version: targetVersion,
        approver,
        note: note || undefined,
      });

      return NextResponse.json({
        success: true,
        assetId,
        version: approved.version,
        status: approved.status,
        approval: {
          approvedBy: approved.approvedById,
          approvedAt: approved.approvedAt,
          note: note || null,
          onChain: null,
        },
        anchoring: {
          anchored: false,
          reason:
            'La aprobación queda registrada en el sistema. El anclaje criptográfico on-chain (Knowledge Vault) no está habilitado en este endpoint.',
        },
      });
    }

    const rejected = await service.reject({
      artifactId: assetId,
      version: targetVersion,
      approver,
      reason: note,
    });

    return NextResponse.json({
      success: true,
      assetId,
      version: rejected.version,
      status: rejected.status,
      rejection: { rejectedBy: approver.id, reason: rejected.rejectedReason },
    });
  } catch (error: unknown) {
    if (error instanceof ArtifactLifecycleError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: errorStatus(error) },
      );
    }
    console.error('[ContentAPI] POST /assets/:id/approval failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error recording approval.',
      },
      { status: 500 },
    );
  }
}
