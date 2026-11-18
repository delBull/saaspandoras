import { NextRequest, NextResponse } from 'next/server';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { hasPortalPermission } from '@/lib/portal/permissions';
import {
  areTenantGrantsEnforced,
  getCanonicalOrganizationResolver,
  getTenantGrantRepository,
} from '@/lib/authorization/service-factory';
import { authorizeTenantCapability } from '@/lib/authorization/authorize-tenant-capability';
import {
  buildTenantGrant,
  GrantError,
  MAX_GRANT_TTL_SECONDS,
  type TenantAuthorizationGrant,
} from '@/lib/authorization/tenant-grant';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ENABLED_ENV = 'P0_1_GRANTS_WRITE_ENABLED';

/**
 * POST /api/v1/authorization/grants
 *
 * Emite un grant de tenant a una identidad HUMANA.
 *
 * Autoridad:
 *  - Modo bootstrap (`P0_1_GRANTS_ENFORCED` != 'true'): exige `identity.write` en la
 *    sesión de portal (owner/admin). Permite sembrar los primeros grants; se marca
 *    `bootstrap: true` en la respuesta para auditoría.
 *  - Modo estricto: exige grant con `governance.grant.manage`, y el emisor solo
 *    puede conceder capabilities que YA posee (sin escalada).
 *
 * Body: { organizationSlug, subjectId, capabilities[], scope?: 'organization'|'project', projectId?, ttlSeconds? }
 */
export async function POST(req: NextRequest) {
  if (process.env[ENABLED_ENV] !== 'true') {
    return NextResponse.json(
      {
        success: false,
        code: 'GRANTS_WRITE_NOT_ENABLED',
        error: 'La emisión de grants no está habilitada: activa P0_1_GRANTS_WRITE_ENABLED.',
      },
      { status: 503 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const organizationSlug =
    typeof body.organizationSlug === 'string' ? body.organizationSlug.trim() : '';
  if (!organizationSlug) {
    return NextResponse.json(
      { success: false, code: 'TENANT_REQUIRED', error: 'Falta organizationSlug.' },
      { status: 400 },
    );
  }

  let portal;
  try {
    portal = await resolvePortalContext(organizationSlug);
  } catch {
    return NextResponse.json(
      { success: false, code: 'PORTAL_SESSION_REQUIRED', error: 'Sesión de portal requerida.' },
      { status: 401 },
    );
  }

  if (portal.organization.slug.toLowerCase() !== organizationSlug.toLowerCase()) {
    return NextResponse.json(
      { success: false, code: 'ORG_MISMATCH', error: 'La sesión no corresponde a esa organización.' },
      { status: 403 },
    );
  }

  const organization = await getCanonicalOrganizationResolver().resolve(organizationSlug);
  if (!organization) {
    return NextResponse.json(
      { success: false, code: 'ORG_UNRESOLVED', error: 'Organización no resoluble.' },
      { status: 404 },
    );
  }

  const subjectId = typeof body.subjectId === 'string' ? body.subjectId.trim() : '';
  if (!subjectId) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION', error: 'Falta subjectId (identidad humana).' },
      { status: 422 },
    );
  }

  const requested = Array.isArray(body.capabilities)
    ? body.capabilities.filter((c): c is string => typeof c === 'string')
    : [];
  if (requested.length === 0) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION', error: 'Falta capabilities[].' },
      { status: 422 },
    );
  }

  const scope: 'organization' | 'project' = body.scope === 'project' ? 'project' : 'organization';
  const projectId = typeof body.projectId === 'number' ? body.projectId : null;
  if (scope === 'project' && projectId === null) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION', error: 'scope=project exige projectId.' },
      { status: 422 },
    );
  }

  const ttlSeconds =
    typeof body.ttlSeconds === 'number' && Number.isInteger(body.ttlSeconds)
      ? body.ttlSeconds
      : null;

  const repo = getTenantGrantRepository();
  const enforced = areTenantGrantsEnforced();
  const actorSubjectId = `portal:${portal.tenant.actorId}`;

  let issuerCapabilities: string[];

  if (enforced) {
    const auth = await authorizeTenantCapability({
      actor: { kind: 'human', subjectId: actorSubjectId },
      requestedTenant: { canonicalOrgId: organization.canonicalOrgId },
      capability: 'governance.grant.manage',
      deps: { grants: repo, organizations: getCanonicalOrganizationResolver() },
    });

    if (!auth.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_TENANT_CAPABILITY',
          reason: auth.reason,
          error: `Se requiere 'governance.grant.manage' (${auth.reason}).`,
        },
        { status: 403 },
      );
    }

    // Sin escalada: el emisor solo concede lo que ya posee.
    const own = await repo.listBySubject(organization.canonicalOrgId, actorSubjectId);
    issuerCapabilities = own
      .filter((grant: TenantAuthorizationGrant) => grant.revokedAt === null)
      .flatMap((grant: TenantAuthorizationGrant) => grant.capabilities);
  } else {
    // Bootstrap: siembra inicial de grants por owner/admin del portal.
    if (!hasPortalPermission(portal.tenant.permissions, 'identity.write')) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_PERMISSION',
          error: "El modo bootstrap exige el permiso 'identity.write'.",
        },
        { status: 403 },
      );
    }
    issuerCapabilities = requested;
  }

  try {
    const grant = buildTenantGrant({
      id: crypto.randomUUID(),
      organizationId: organization.canonicalOrgId,
      subjectId,
      requestedCapabilities: requested,
      resourceScope:
        scope === 'project' ? { kind: 'project', projectId: projectId! } : { kind: 'organization' },
      issuer: { subjectId: actorSubjectId, capabilities: issuerCapabilities },
      ttlSeconds,
      nowSeconds: Math.floor(Date.now() / 1000),
    });

    await repo.create(grant);

    return NextResponse.json(
      {
        success: true,
        bootstrap: !enforced,
        grant: {
          id: grant.id,
          organizationId: grant.organizationId,
          subjectId: grant.subjectId,
          capabilities: grant.capabilities,
          resourceScope: grant.resourceScope,
          expiresAt: grant.expiresAt,
          maxTtlSeconds: MAX_GRANT_TTL_SECONDS,
        },
        notes: [
          'Las capabilities se guardan en forma canónica; los aliases solo se aceptan al entrar.',
          'La revocación surte efecto en la siguiente petición.',
        ],
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof GrantError) {
      const status =
        error.code === 'PRIVILEGE_ESCALATION' || error.code === 'NOT_A_TENANT_CAPABILITY'
          ? 403
          : 422;
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status },
      );
    }
    console.error('[Authorization] POST /grants failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}

/** DELETE /api/v1/authorization/grants?grantId=&organizationSlug= — revoca. */
export async function DELETE(req: NextRequest) {
  if (process.env[ENABLED_ENV] !== 'true') {
    return NextResponse.json(
      { success: false, code: 'GRANTS_WRITE_NOT_ENABLED', error: 'Emisión de grants deshabilitada.' },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const organizationSlug = (url.searchParams.get('organizationSlug') ?? '').trim();
  const grantId = (url.searchParams.get('grantId') ?? '').trim();

  if (!organizationSlug || !grantId) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION', error: 'Faltan organizationSlug y grantId.' },
      { status: 400 },
    );
  }

  let portal;
  try {
    portal = await resolvePortalContext(organizationSlug);
  } catch {
    return NextResponse.json(
      { success: false, code: 'PORTAL_SESSION_REQUIRED', error: 'Sesión de portal requerida.' },
      { status: 401 },
    );
  }

  if (!hasPortalPermission(portal.tenant.permissions, 'identity.write')) {
    return NextResponse.json(
      { success: false, code: 'FORBIDDEN_PERMISSION', error: "Falta 'identity.write'." },
      { status: 403 },
    );
  }

  const repo = getTenantGrantRepository();
  const organization = await getCanonicalOrganizationResolver().resolve(organizationSlug);
  if (!organization) {
    return NextResponse.json(
      { success: false, code: 'ORG_UNRESOLVED', error: 'Organización no resoluble.' },
      { status: 404 },
    );
  }

  const revoked = await repo.revoke(grantId, Math.floor(Date.now() / 1000));
  if (!revoked) {
    return NextResponse.json(
      { success: false, code: 'GRANT_NOT_FOUND', error: 'Grant inexistente o ya revocado.' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    grantId,
    revokedAt: new Date().toISOString(),
    notes: ['La revocación es efectiva en la siguiente petición; no hay caché de permisos.'],
  });
}
