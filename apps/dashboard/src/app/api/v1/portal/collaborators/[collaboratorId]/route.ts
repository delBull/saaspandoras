import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from '@saasfly/db-core';
import { db } from '@saasfly/db';
import { nexusCollaborators } from '@saasfly/db/schema';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { hasPortalPermission } from '@/lib/portal/permissions';
import { getCanonicalOrganizationResolver } from '@/lib/authorization/service-factory';
import { DEFAULT_INVITATION_TTL_DAYS } from '@/lib/portal/collaborator-invitation';
import { ResendInvitationMailer } from '@/lib/portal/drizzle-collaborator-repository';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ENABLED_ENV = 'P0_1_COLLABORATORS_ENABLED';

async function authorize(organizationSlug: string) {
  const portal = await resolvePortalContext(organizationSlug);
  if (portal.organization.slug.toLowerCase() !== organizationSlug.toLowerCase()) {
    return { ok: false as const, status: 403, code: 'ORG_MISMATCH' };
  }
  if (!hasPortalPermission(portal.tenant.permissions, 'identity.write')) {
    return { ok: false as const, status: 403, code: 'FORBIDDEN_PERMISSION' };
  }
  const organization = await getCanonicalOrganizationResolver().resolve(organizationSlug);
  if (!organization) return { ok: false as const, status: 404, code: 'ORG_UNRESOLVED' };

  return { ok: true as const, organization, organizationName: portal.organization.name };
}

/**
 * POST /api/v1/portal/collaborators/:collaboratorId
 * Reenvía la invitación: ROTA la credencial (la anterior deja de servir) y envía
 * un enlace nuevo. Body: { organizationSlug, ttlDays? }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ collaboratorId: string }> }) {
  if (process.env[ENABLED_ENV] !== 'true') {
    return NextResponse.json({ success: false, code: 'COLLABORATORS_NOT_ENABLED' }, { status: 503 });
  }

  const { collaboratorId: rawId } = await params;
  const collaboratorId = Number(rawId);
  if (!Number.isInteger(collaboratorId) || collaboratorId <= 0) {
    return NextResponse.json({ success: false, code: 'VALIDATION', error: 'Id inválido.' }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const organizationSlug = typeof body.organizationSlug === 'string' ? body.organizationSlug : '';
  if (!organizationSlug) {
    return NextResponse.json({ success: false, code: 'TENANT_REQUIRED' }, { status: 400 });
  }

  let ctx;
  try {
    ctx = await authorize(organizationSlug);
  } catch {
    return NextResponse.json({ success: false, code: 'PORTAL_SESSION_REQUIRED' }, { status: 401 });
  }
  if (!ctx.ok) return NextResponse.json({ success: false, code: ctx.code }, { status: ctx.status });

  const ttlDays = typeof body.ttlDays === 'number' ? body.ttlDays : DEFAULT_INVITATION_TTL_DAYS;

  const [row] = await db
    .select({
      id: nexusCollaborators.id,
      name: nexusCollaborators.name,
      email: nexusCollaborators.email,
      role: nexusCollaborators.role,
      canonicalOrgId: nexusCollaborators.canonicalOrgId,
    })
    .from(nexusCollaborators)
    .where(
      and(
        eq(nexusCollaborators.id, collaboratorId),
        eq(nexusCollaborators.canonicalOrgId, ctx.organization.canonicalOrgId),
      ),
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ success: false, code: 'NOT_FOUND' }, { status: 404 });
  }

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await db
    .update(nexusCollaborators)
    .set({ token, status: 'ACTIVE', expiresAt })
    .where(
      and(
        eq(nexusCollaborators.id, collaboratorId),
        eq(nexusCollaborators.canonicalOrgId, ctx.organization.canonicalOrgId),
      ),
    );

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_BASE_URL ?? new URL(req.url).origin;
  const inviteUrl = `${baseUrl.replace(/\/+$/, '')}/api/v1/portal/session/claim?credential=${encodeURIComponent(
    token,
  )}&org=${encodeURIComponent(ctx.organization.slug)}`;

  let emailSent = true;
  try {
    await new ResendInvitationMailer().send({
      to: row.email,
      name: row.name,
      organizationName: ctx.organizationName,
      role: row.role as never,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch {
    emailSent = false;
  }

  return NextResponse.json({
    success: true,
    collaboratorId,
    emailSent,
    expiresAt: expiresAt.toISOString(),
    notes: [
      'La credencial anterior quedó invalidada: el enlace previo ya no sirve.',
      emailSent ? 'Correo reenviado.' : 'No se pudo enviar el correo: reintenta más tarde.',
    ],
  });
}

/**
 * DELETE /api/v1/portal/collaborators/:collaboratorId?organizationSlug=
 * Revoca el acceso: status DISABLED y rotación de credencial. Efecto inmediato
 * (cada petición revalida el colaborador en base).
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ collaboratorId: string }> }) {
  if (process.env[ENABLED_ENV] !== 'true') {
    return NextResponse.json({ success: false, code: 'COLLABORATORS_NOT_ENABLED' }, { status: 503 });
  }

  const { collaboratorId: rawId } = await params;
  const collaboratorId = Number(rawId);
  const organizationSlug = new URL(req.url).searchParams.get('organizationSlug') ?? '';

  if (!Number.isInteger(collaboratorId) || collaboratorId <= 0 || !organizationSlug) {
    return NextResponse.json({ success: false, code: 'VALIDATION' }, { status: 400 });
  }

  let ctx;
  try {
    ctx = await authorize(organizationSlug);
  } catch {
    return NextResponse.json({ success: false, code: 'PORTAL_SESSION_REQUIRED' }, { status: 401 });
  }
  if (!ctx.ok) return NextResponse.json({ success: false, code: ctx.code }, { status: ctx.status });

  const updated = await db
    .update(nexusCollaborators)
    .set({
      status: 'DISABLED',
      token: crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''),
    })
    .where(
      and(
        eq(nexusCollaborators.id, collaboratorId),
        eq(nexusCollaborators.canonicalOrgId, ctx.organization.canonicalOrgId),
      ),
    )
    .returning({ id: nexusCollaborators.id });

  if (updated.length === 0) {
    return NextResponse.json({ success: false, code: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    collaboratorId,
    revokedAt: new Date().toISOString(),
    notes: ['Revocación efectiva en la siguiente petición: no hay caché de sesión.'],
  });
}
