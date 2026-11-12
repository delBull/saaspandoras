import React from 'react';
import { MediaStudioDashboard } from '@/components/hermes-portal/media/MediaStudioDashboard';

export const dynamic = 'force-dynamic';

/**
 * /portal/[organizationSlug]/media — Media Studio del tenant.
 *
 * Antes esta ruta redirigía a `/demand`, lo que dejaba el Media Studio
 * (`MediaStudioDashboard`, con la recarga de saldo) sin ninguna página que lo
 * montara: el tenant no podía recargar créditos desde el Portal.
 *
 * La autorización NO depende de esta página: el `layout` del portal resuelve la
 * sesión (`resolvePortalContext`) y redirige a login/unauthorized, y las APIs
 * que consume el dashboard (`/api/v1/hermes/media/*`) validan sesión de portal.
 */
export default async function MediaStudioPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  return <MediaStudioDashboard organizationSlug={organizationSlug} />;
}
