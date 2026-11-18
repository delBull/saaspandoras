/**
 * P0.1 — Identidad de PORTAL multiusuario.
 *
 * Separa tres cosas que antes iban juntas:
 *
 *   Identidad (persona)  → colaborador Nexus (`nexus_collaborators`)
 *   Organización         → verificada por pertenencia (`project_collaborators`)
 *   Permisos             → derivados del ROL de la persona (no del producto)
 *
 * Reglas:
 *  - El rol se resuelve del colaborador, nunca de un campo del cliente.
 *  - Rol desconocido ⇒ `null` (fail-closed).
 *  - Colaborador INACTIVE, suspendido o expirado ⇒ no hay sesión.
 *  - La pertenencia al proyecto se verifica SIEMPRE contra la organización
 *    solicitada; un colaborador de otra organización no accede.
 */

import type { PortalRole } from './permissions';

/** Roles posibles en `nexus_collaborators.role` (mayúsculas). */
export const NEXUS_COLLABORATOR_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'OWNER',
  'OPERATOR',
  'COLLABORATOR',
  'VIEWER',
] as const;

export type NexusCollaboratorRole = (typeof NEXUS_COLLABORATOR_ROLES)[number];

/**
 * Mapea el rol del colaborador al rol del portal.
 *
 * `SUPER_ADMIN` NO se degrada a `owner` de un tenant: se trata como `admin`
 * (la autoridad de plataforma se ejerce por el catálogo de plataforma, no por el
 * portal del cliente).
 */
export function mapNexusRoleToPortalRole(role: string | null | undefined): PortalRole | null {
  switch ((role ?? '').trim().toUpperCase()) {
    case 'OWNER':
      return 'owner';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return 'admin';
    case 'OPERATOR':
    case 'COLLABORATOR':
      return 'operator';
    case 'VIEWER':
      return 'viewer';
    default:
      return null;
  }
}

export interface CollaboratorStatusInput {
  status: string | null | undefined;
  expiresAt: Date | number | null | undefined;
}

/**
 * `true` solo si el colaborador está ACTIVE y no expirado. Sin fecha de expiración
 * se considera NO vigente (fail-closed): la tabla la declara obligatoria.
 */
export function isCollaboratorActive(
  collaborator: CollaboratorStatusInput,
  now: Date = new Date(),
): boolean {
  if ((collaborator.status ?? '').trim().toUpperCase() !== 'ACTIVE') return false;

  const expiresAt = collaborator.expiresAt;
  if (expiresAt === null || expiresAt === undefined) return false;

  const expiresAtMs = expiresAt instanceof Date ? expiresAt.getTime() : expiresAt;
  if (!Number.isFinite(expiresAtMs)) return false;

  return expiresAtMs > now.getTime();
}
