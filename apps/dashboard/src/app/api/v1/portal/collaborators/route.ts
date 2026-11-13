import { NextRequest, NextResponse } from 'next/server';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { getCanonicalOrganizationResolver } from '@/lib/authorization/service-factory';
import { hasPortalPermission } from '@/lib/portal/permissions';
import {
  CollaboratorInvitationService,
  InvitationError,
} from '@/lib/portal/collaborator-invitation';
import {
  DrizzleCollaboratorRepository,
  ResendInvitationMailer,
} from '@/lib/portal/drizzle-collaborator-repository';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ENABLED_ENV = 'P0_1_COLLABORATORS_ENABLED';

function disabled() {
  return NextResponse.json(
    {
      success: false,
      code: 'COLLABORATORS_NOT_ENABLED',
      error:
        'La gestión de colaboradores no está habilitada: activa P0_1_COLLABORATORS_ENABLED tras revisar el flujo de invitación.',
    },
    { status: 503 },
  );
}

function baseUrlOf(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_BASE_URL;
  if (configured && configured.trim().length > 0) return configured.trim();
  return new URL(req.url).origin;
}

async function context(organizationSlug: string, requiredPermission: 'identity.read' | 'identity.write') {
  let portal;
  try {
    portal = await resolvePortalContext(organizationSlug);
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, code: 'PORTAL_SESSION_REQUIRED', error: 'Sesión de portal requerida.' },
        { status: 401 },
      ),
    };
  }

  if (portal.organization.slug.toLowerCase() !== organizationSlug.toLowerCase()) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, code: 'ORG_MISMATCH', error: 'La sesión no corresponde a esa organización.' },
        { status: 403 },
      ),
    };
  }

  if (!hasPortalPermission(portal.tenant.permissions, requiredPermission)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_PERMISSION',
          error: `La sesión no tiene el permiso '${requiredPermission}'.`,
        },
        { status: 403 },
      ),
    };
  }

  const organization = await getCanonicalOrganizationResolver().resolve(organizationSlug);
  if (!organization) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, code: 'ORG_UNRESOLVED', error: 'Organización no resoluble.' },
        { status: 404 },
      ),
    };
  }

  return {
    ok: true as const,
    organization,
    organizationName: portal.organization.name,
    actorId: portal.tenant.actorId,
  };
}

function service(req: NextRequest) {
  return new CollaboratorInvitationService({
    repository: new DrizzleCollaboratorRepository(),
    mailer: new ResendInvitationMailer(),
    baseUrl: baseUrlOf(req),
  });
}

/** GET /api/v1/portal/collaborators?organizationSlug= — requiere `identity.read`. */
export async function GET(req: NextRequest) {
  if (process.env[ENABLED_ENV] !== 'true') return disabled();

  const organizationSlug = new URL(req.url).searchParams.get('organizationSlug') ?? '';
  const ctx = await context(organizationSlug, 'identity.read');
  if (!ctx.ok) return ctx.response;

  try {
    const collaborators = await service(req).list({ organizationId: ctx.organization.canonicalOrgId });
    // Nunca se exponen credenciales ni tokens.
    return NextResponse.json({ success: true, collaborators });
  } catch (error: unknown) {
    console.error('[Portal] GET /collaborators failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}

/**
 * POST /api/v1/portal/collaborators — requiere `identity.write` (owner/admin).
 * Body: { organizationSlug, email, name, role: 'ADMIN'|'OPERATOR'|'VIEWER', ttlDays? }
 */
export async function POST(req: NextRequest) {
  if (process.env[ENABLED_ENV] !== 'true') return disabled();

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const organizationSlug = typeof body.organizationSlug === 'string' ? body.organizationSlug : '';
  const ctx = await context(organizationSlug, 'identity.write');
  if (!ctx.ok) return ctx.response;

  try {
    const result = await service(req).invite({
      organizationId: ctx.organization.canonicalOrgId,
      organizationSlug: ctx.organization.slug,
      organizationName: ctx.organizationName,
      actorId: ctx.actorId,
      email: typeof body.email === 'string' ? body.email : '',
      name: typeof body.name === 'string' ? body.name : '',
      role: typeof body.role === 'string' ? body.role : '',
      ttlDays: typeof body.ttlDays === 'number' ? body.ttlDays : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        collaborator: {
          id: result.collaboratorId,
          email: result.email,
          role: result.role,
          expiresAt: result.expiresAt,
        },
        emailSent: result.emailSent,
        notes: [
          'La credencial no se devuelve en la respuesta ni se registra en logs.',
          result.emailSent
            ? 'El enlace es personal e intransferible y caduca en la fecha indicada.'
            : 'La credencial existe pero el correo no pudo enviarse: reenvía la invitación.',
        ],
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof InvitationError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error('[Portal] POST /collaborators failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}
