/**
 * Contexto de ruta para el CRM (P0.2).
 *
 * Autoridad:
 *  - El slug de la URL es SOLO enrutamiento: `resolvePortalContext` verifica que
 *    la sesión tenga acceso a esa organización.
 *  - La organización CANÓNICA se resuelve en servidor (nunca del body).
 *  - La identidad es la de la sesión de portal.
 */

import { NextResponse } from 'next/server';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { getCanonicalOrganizationResolver } from '@/lib/authorization/service-factory';

export const CRM_ENABLED_ENV = 'P0_2_CRM_ENABLED';

export function isCrmEnabled(): boolean {
  return process.env[CRM_ENABLED_ENV] === 'true';
}

export const CRM_DISABLED_RESPONSE = {
  code: 'CRM_NOT_ENABLED',
  error:
    'El CRM (P0.2) no está habilitado en este entorno: falta aplicar la migración 0097 y activar P0_2_CRM_ENABLED.',
} as const;

export interface CrmRouteContext {
  organizationId: string;
  projectId: number;
  slug: string;
  subjectId: string;
  actorId: string;
}

export type CrmContextResult =
  | { ok: true; context: CrmRouteContext }
  | { ok: false; response: NextResponse };

export async function resolveCrmRouteContext(
  organizationSlug: string | null,
): Promise<CrmContextResult> {
  const slug = (organizationSlug ?? '').trim();
  if (!slug) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: 'TENANT_REQUIRED', error: 'Falta organizationSlug.' },
        { status: 400 },
      ),
    };
  }

  let portal;
  try {
    portal = await resolvePortalContext(slug);
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          code: 'PORTAL_SESSION_REQUIRED',
          error: 'Se requiere una sesión de portal válida con acceso a la organización.',
        },
        { status: 401 },
      ),
    };
  }

  // La organización de la sesión debe coincidir con la solicitada.
  if (portal.organization.slug.toLowerCase() !== slug.toLowerCase()) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: 'ORG_MISMATCH', error: 'La sesión no corresponde a esa organización.' },
        { status: 403 },
      ),
    };
  }

  const organization = await getCanonicalOrganizationResolver().resolve(slug);
  if (!organization) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: 'ORG_UNRESOLVED', error: 'Organización no resoluble.' },
        { status: 404 },
      ),
    };
  }

  return {
    ok: true,
    context: {
      organizationId: organization.canonicalOrgId,
      projectId: organization.projectId,
      slug: organization.slug,
      subjectId: `portal:${portal.tenant.actorId}`,
      actorId: portal.tenant.actorId,
    },
  };
}
