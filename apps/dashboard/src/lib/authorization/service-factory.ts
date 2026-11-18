/**
 * Fábrica de autorización de tenant (P0.1).
 *
 * `P0_1_GRANTS_ENFORCED` decide el modo de las rutas que ya soportan grants:
 *  - `true`  → la autoridad son los grants de tenant (denegación por defecto).
 *  - otro    → se conserva la autoridad previa de la ruta (rollout controlado).
 *
 * El flag es de SERVIDOR. Mientras la migración 0096 no esté aplicada, activarlo
 * haría que todo se deniegue (fail-closed), nunca que se permita de más.
 */

import type { CanonicalOrganizationResolver, TenantGrantRepository } from './authorize-tenant-capability';
import { TenantAuthorityOrganizationResolver } from './canonical-organization-resolver';
import { DrizzleTenantGrantRepository } from './drizzle-tenant-grant-repository';

export const GRANTS_ENFORCED_ENV = 'P0_1_GRANTS_ENFORCED';

export function areTenantGrantsEnforced(): boolean {
  return process.env[GRANTS_ENFORCED_ENV] === 'true';
}

export function getTenantGrantRepository(): TenantGrantRepository {
  return new DrizzleTenantGrantRepository();
}

export function getCanonicalOrganizationResolver(): CanonicalOrganizationResolver {
  return new TenantAuthorityOrganizationResolver();
}
