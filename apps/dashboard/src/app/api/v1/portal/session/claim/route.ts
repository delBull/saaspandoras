import { NextRequest, NextResponse } from 'next/server';
import {
  COLLABORATOR_SESSION_TTL_SECONDS,
  collaboratorBelongsToOrganization,
  mintCollaboratorSessionToken,
  resolveCollaboratorSession,
  rotateInvitationCredential,
} from '@/lib/portal/collaborator-session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PORTAL_SESSION_COOKIE = 'pandoras_portal_session';

/**
 * GET /api/v1/portal/session/claim?credential=…&org=<slug>
 *
 * Canjea la credencial personal de un colaborador por una cookie de sesión de
 * portal (httpOnly). La credencial se valida contra la base, el colaborador debe
 * pertenecer a la organización indicada y la cookie caduca como máximo en 7 días.
 *
 * Fail-closed: cualquier fallo redirige al login con error; nunca abre sesión.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const credential = url.searchParams.get('credential') ?? '';
  const org = url.searchParams.get('org') ?? '';

  const invalid = NextResponse.redirect(
    new URL('/portal/login?error=invalid_credential', url.origin),
    { status: 302 },
  );

  if (!credential || !org) return invalid;

  const session = await resolveCollaboratorSession(credential);
  if (!session) return invalid;

  const belongs = await collaboratorBelongsToOrganization(session, org);
  if (!belongs) return invalid;

  // El enlace es de UN SOLO USO: se invalida la credencial antes de abrir sesión.
  // Si la rotación falla, no se abre sesión (fail-closed): el enlace no queda
  // reutilizable a medias.
  const rotated = await rotateInvitationCredential(session.collaboratorId);
  if (!rotated) return invalid;

  let minted;
  try {
    minted = mintCollaboratorSessionToken({
      collaboratorId: session.collaboratorId,
      canonicalOrgId: session.canonicalOrgId,
    });
  } catch {
    // Sin secreto configurado no se emite sesión (nunca se degrada).
    return NextResponse.json(
      {
        success: false,
        code: 'SESSION_SECRET_NOT_CONFIGURED',
        error: 'El secreto de sesión del portal no está configurado.',
      },
      { status: 503 },
    );
  }

  const response = NextResponse.redirect(
    new URL(`/portal/${encodeURIComponent(org)}`, url.origin),
    { status: 302 },
  );

  response.cookies.set({
    name: PORTAL_SESSION_COOKIE,
    value: minted.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COLLABORATOR_SESSION_TTL_SECONDS,
  });

  return response;
}
