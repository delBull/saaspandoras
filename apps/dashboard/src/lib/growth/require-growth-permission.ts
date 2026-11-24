import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getNexusAuthContext, validatePortalSession } from '@saasfly/shared';
import type { NexusRole } from '@saasfly/shared';

export type GrowthPermission = 'growth.manage' | 'marketing.manage';

export interface GrowthGuardOptions {
  permission: GrowthPermission;
  /** Roles que nunca pasan, aunque el permiso esté concedido (defensa en profundidad). */
  denyRoles?: NexusRole[];
  /** El portal del tenant entra sin wallet; se puede desactivar por ruta. */
  allowPortalSession?: boolean;
}

/**
 * Guard determinista de permisos para las APIs de Growth.
 *
 * Antes estas rutas sólo resolvían la organización: cualquier sesión válida
 * entraba. Ahora:
 *
 *  1. Portal del tenant (cookie propia) → permitido: ya está dentro de SU org.
 *  2. Sesión de wallet (thirdweb) → se resuelve rol y permisos canónicos:
 *     SUPER_ADMIN/ADMIN pasan; el resto necesita el permiso concreto.
 *  3. Sin sesión → 401.
 *
 * Devuelve una respuesta para cortar la petición, o `null` si puede continuar.
 */
export async function requireGrowthPermission(
  req: NextRequest,
  options: GrowthGuardOptions,
): Promise<NextResponse | null> {
  if (options.allowPortalSession !== false) {
    const portalCookie = req.cookies.get('pandoras_portal_session')?.value;
    if (portalCookie) {
      const session = await validatePortalSession(portalCookie);
      if (session) return null;
    }
  }

  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated || !auth.role) {
    return NextResponse.json(
      { code: 'UNAUTHENTICATED', message: 'Se requiere sesión para operar el Growth OS.' },
      { status: 401 },
    );
  }

  if (options.denyRoles?.includes(auth.role)) {
    return NextResponse.json(
      { code: 'FORBIDDEN_ROLE', message: `El rol ${auth.role} no tiene acceso a este módulo.` },
      { status: 403 },
    );
  }

  if (auth.permissions?.[options.permission]) return null;

  return NextResponse.json(
    {
      code: 'FORBIDDEN_PERMISSION',
      message: `Tu rol (${auth.role}) no incluye el permiso ${options.permission} en este módulo.`,
    },
    { status: 403 },
  );
}
