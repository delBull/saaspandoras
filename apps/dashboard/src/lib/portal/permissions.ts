/**
 * Portal Permissions — Phase 6.1
 * 
 * Vocabulary of permissions the Customer Operating Console uses.
 * These extend the ControlPlanePermission set from ADR-010/011.
 * 
 * Hierarchy:
 *   authenticated ≠ authorized
 *   authorized ≠ all permissions
 * 
 * Hiding a nav item is UX only — server must still reject unauthorized commands.
 */

export type PortalPermission =
  // Organization
  | 'organization.read'
  | 'organization.update'

  // Identity
  | 'identity.read'
  | 'identity.write'

  // Knowledge
  | 'knowledge.read'
  | 'knowledge.write'
  | 'knowledge.delete'

  // Channels
  | 'channels.read'
  | 'channels.write'
  | 'channels.connect'
  | 'channels.disconnect'

  // Conversations
  | 'conversations.read'

  // Activity / Event Spine
  | 'activity.read'

  // Policies — limited write (within Pandora's global boundary only)
  | 'policies.read'
  | 'policies.write'

  // Journeys
  | 'journeys.read'
  | 'journeys.write'

  // Settings
  | 'settings.read'
  | 'settings.write';

export type PortalRole = 'owner' | 'admin' | 'operator' | 'viewer';

/**
 * Default permission set per role.
 * Owners get everything, viewers get read-only.
 */
export const PORTAL_ROLE_PERMISSIONS: Record<PortalRole, PortalPermission[]> = {
  owner: [
    'organization.read', 'organization.update',
    'identity.read', 'identity.write',
    'knowledge.read', 'knowledge.write', 'knowledge.delete',
    'channels.read', 'channels.write', 'channels.connect', 'channels.disconnect',
    'conversations.read',
    'activity.read',
    'policies.read', 'policies.write',
    'journeys.read', 'journeys.write',
    'settings.read', 'settings.write',
  ],
  admin: [
    'organization.read', 'organization.update',
    'identity.read', 'identity.write',
    'knowledge.read', 'knowledge.write', 'knowledge.delete',
    'channels.read', 'channels.write', 'channels.connect', 'channels.disconnect',
    'conversations.read',
    'activity.read',
    'policies.read', 'policies.write',
    'journeys.read', 'journeys.write',
    'settings.read',
  ],
  operator: [
    'organization.read',
    'identity.read',
    'knowledge.read', 'knowledge.write',
    'channels.read',
    'conversations.read',
    'activity.read',
    'journeys.read',
    'settings.read',
  ],
  viewer: [
    'organization.read',
    'identity.read',
    'knowledge.read',
    'channels.read',
    'conversations.read',
    'activity.read',
    'journeys.read',
  ],
};

export function hasPortalPermission(
  permissions: PortalPermission[],
  required: PortalPermission
): boolean {
  return permissions.includes(required);
}

export function assertPortalPermission(
  permissions: PortalPermission[],
  required: PortalPermission
): void {
  if (!hasPortalPermission(permissions, required)) {
    throw new Error(`PERMISSION_DENIED: Missing permission '${required}'`);
  }
}
