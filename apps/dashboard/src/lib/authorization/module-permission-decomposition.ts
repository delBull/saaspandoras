/**
 * P0.1 — Descomposición de permisos de MÓDULO (RBAC legacy de Nexus).
 *
 * `CANONICAL_CAPABILITIES` (users.manage, growth.manage, …) son permisos de
 * módulo booleanos guardados por colaborador. NO son capabilities y NO se
 * traducen automáticamente:
 *
 *   growth.manage  ≠  crm.opportunity.write
 *
 * Traducir "por parecido" concedería permisos que nadie otorgó. Por eso la tabla
 * de descomposición está VACÍA por defecto y debe poblarse con una decisión
 * explícita y auditada por capability.
 *
 * Mientras un permiso de módulo no tenga descomposición declarada, cualquier
 * comprobación de capability de tenant que dependa de él se DENIEGA.
 */

import type { TenantCapability } from '@saasfly/shared';
import { isLegacyModulePermission } from '@saasfly/shared';

/**
 * Tabla de descomposición explícita: permiso de módulo → capabilities canónicas.
 * VACÍA por diseño. Añadir entradas requiere decisión de producto/seguridad.
 */
export const MODULE_PERMISSION_DECOMPOSITION: Readonly<
  Record<string, readonly TenantCapability[]>
> = Object.freeze({});

export type ModuleDecomposition =
  | { kind: 'not_a_module_permission' }
  | { kind: 'undeclared' }
  | { kind: 'declared'; capabilities: readonly TenantCapability[] };

/**
 * Resuelve la descomposición declarada de un permiso de módulo.
 * Nunca infiere: si no está en la tabla, es `undeclared`.
 */
export function decomposeModulePermission(permission: string): ModuleDecomposition {
  if (!isLegacyModulePermission(permission)) {
    return { kind: 'not_a_module_permission' };
  }
  const declared = MODULE_PERMISSION_DECOMPOSITION[permission];
  if (!declared || declared.length === 0) {
    return { kind: 'undeclared' };
  }
  return { kind: 'declared', capabilities: declared };
}

/**
 * Capabilities efectivas aportadas por un conjunto de permisos de módulo.
 * Solo devuelve las declaradas explícitamente; lo no declarado no aporta nada.
 */
export function capabilitiesFromModulePermissions(
  permissions: readonly string[],
): { capabilities: TenantCapability[]; undeclared: string[] } {
  const capabilities: TenantCapability[] = [];
  const undeclared: string[] = [];

  for (const permission of permissions) {
    const decomposition = decomposeModulePermission(permission);
    if (decomposition.kind === 'declared') {
      for (const capability of decomposition.capabilities) {
        if (!capabilities.includes(capability)) capabilities.push(capability);
      }
    } else if (decomposition.kind === 'undeclared') {
      undeclared.push(permission);
    }
  }

  return { capabilities, undeclared };
}
