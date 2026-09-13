/**
 * 🏛️ Universal Identity SDK (F2 Facade)
 * apps/dashboard/src/lib/identity/index.ts
 *
 * Exposes the unified, authoritative Identity Layer for Pandoras Growth OS.
 *
 * Core Boundary:
 * Canonical Identity ≠ Tenant Membership ≠ Role ≠ Capability ≠ Execution Authority
 */

import { CanonicalIdentityGraph } from './canonical-identity-graph';
import { TenantContextResolver } from './tenant-context-resolver';
import type { CanonicalIdentifierInput, ResolveIdentityOptions, CanonicalIdentityRecord } from './types';

export * from './types';
export * from './canonical-identity-graph';
export * from './tenant-context-resolver';

/**
 * Universal Identity Resolution Facade
 */
export async function resolveCanonicalIdentity(
  input: CanonicalIdentifierInput,
  options?: ResolveIdentityOptions
): Promise<CanonicalIdentityRecord | null> {
  return CanonicalIdentityGraph.resolveCanonicalIdentity(input, options);
}

/**
 * Universal Tenant Context Resolution Facade
 */
export async function resolveTenantContext(
  identityOrId: CanonicalIdentityRecord | string,
  organizationIdentifier: string
) {
  return TenantContextResolver.resolveTenantContext(identityOrId, organizationIdentifier);
}
