import { TenantAuthorityService } from '@saasfly/hermes-core';

/**
 * Authorizes a Developer Integration Key against the tenant it is targeting.
 *
 * The requested tenant is resolved through `resolveCanonicalTenant`, which for the
 * ecosystem root `pandoras` returns a deterministic sentinel (`projectId: 0`,
 * `projectSlug: 'pandoras'`). A real key's `projectId` is the concrete project row
 * (e.g. 148), so a plain `client.projectId === canonical.projectId` check can never
 * match the sentinel.
 *
 * To close that gap WITHOUT granting cross-tenant access, the KEY's own project is
 * resolved to its canonical form and both sides are required to be the SAME tenant
 * (same `projectSlug`). A key belonging to another tenant resolves to a different
 * slug and is rejected.
 *
 * Fail-closed: returns `false` when the key's project cannot be resolved.
 */
export async function integrationKeyMatchesTenant(
  clientProjectId: number | null | undefined,
  canonical: { projectId: number; projectSlug: string },
): Promise<boolean> {
  if (clientProjectId === null || clientProjectId === undefined) return false;

  // Fast path: normal tenants where the concrete project id matches directly.
  if (clientProjectId === canonical.projectId) return true;

  const keyCanonical = await TenantAuthorityService.resolveCanonicalTenant(String(clientProjectId));
  if (!keyCanonical || !keyCanonical.projectSlug) return false;

  return keyCanonical.projectSlug.toLowerCase() === canonical.projectSlug.toLowerCase();
}
