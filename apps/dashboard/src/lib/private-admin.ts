import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateAdminSession } from '@/lib/admin-auth';
import { getNexusAuthContext } from '@saasfly/shared';

/**
 * Autoridad de la Private Pay & Finance Terminal.
 *
 * Acepta dos vías, ambas server-side:
 *  1. Sesión de admin verificada por wallet (`validateAdminSession`).
 *  2. Sesión Nexus (cookie httpOnly / header) con rol SUPER_ADMIN o ADMIN.
 *
 * Devuelve un identificador de auditoría (`actor`). Nunca inventa una wallet: si la
 * sesión Nexus no expone wallet (magic link), se usa email o rol como trazabilidad.
 */
export async function resolvePrivateAdmin(
  req: NextRequest
): Promise<{ actor: string | null; errorResponse: NextResponse | null }> {
  try {
    const adminCheck = await validateAdminSession(req.headers);
    if (adminCheck.session?.address) {
      return { actor: adminCheck.session.address, errorResponse: null };
    }
  } catch (error: unknown) {
    console.warn('[PrivatePayments API] validateAdminSession no resolvió sesión:', error);
  }

  try {
    const nexusAuth = await getNexusAuthContext(req.headers);
    if (
      nexusAuth.isAuthenticated &&
      (nexusAuth.role === 'SUPER_ADMIN' || nexusAuth.role === 'ADMIN')
    ) {
      const actor = nexusAuth.wallet ?? nexusAuth.email ?? nexusAuth.role ?? 'nexus_admin';
      return { actor, errorResponse: null };
    }
  } catch (error: unknown) {
    console.warn('[PrivatePayments API] getNexusAuthContext no resolvió sesión:', error);
  }

  return {
    actor: null,
    errorResponse: NextResponse.json(
      { error: 'Forbidden: Super Admin session required.' },
      { status: 403 }
    ),
  };
}
