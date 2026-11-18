/**
 * Adaptador de resolución de organización canónica (P0.1).
 *
 * Reutiliza `TenantAuthorityService.resolveCanonicalTenant` (Hermes): acepta slug,
 * UUID o id numérico y devuelve la identidad canónica con `canonicalOrgId`.
 * No se crea un resolver paralelo.
 */

import { TenantAuthorityService } from '@saasfly/hermes-core';
import type { CanonicalOrganizationResolver, ResolvedOrganization } from './authorize-tenant-capability';

export class TenantAuthorityOrganizationResolver implements CanonicalOrganizationResolver {
  async resolve(slugOrId: string): Promise<ResolvedOrganization | null> {
    if (!slugOrId || typeof slugOrId !== 'string') return null;

    const canonical = await TenantAuthorityService.resolveCanonicalTenant(slugOrId);
    if (!canonical) return null;

    return {
      canonicalOrgId: canonical.canonicalOrgId,
      projectId: canonical.projectId,
      slug: canonical.projectSlug,
    };
  }
}
