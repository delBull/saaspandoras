export type ControlPlanePermission = 
  | 'view_overview'
  | 'view_missions'
  | 'view_audit'
  | 'view_governance'
  | 'approve_intent'
  | 'reject_intent'
  | 'change_policy';

export type ControlPlaneRole = 'founder' | 'admin' | 'operator' | 'viewer' | 'auditor';

export interface AuthorizedOrganization {
  organizationId: string;
  role: ControlPlaneRole;
}

export interface TenantScope {
  readonly organizationId: string;
}

export class ControlPlaneContext {
  constructor(
    public readonly sessionId: string,
    public readonly actorId: string,
    public readonly role: ControlPlaneRole,
    public readonly permissions: ControlPlanePermission[],
    public readonly authorizedOrganizations: AuthorizedOrganization[]
  ) {}

  /**
   * Verifies if the actor has access to the requested organization.
   * Throws AuthorizationError if access is denied.
   */
  assertOrganizationAccess(requestedOrganizationId: string): void {
    const org = this.authorizedOrganizations.find(o => o.organizationId === requestedOrganizationId);
    if (!org) {
      throw new AuthorizationError(`FORBIDDEN: Actor ${this.actorId} does not have access to organization ${requestedOrganizationId}`);
    }
  }

  /**
   * Validates access and returns a TenantScope object that can be passed
   * to infrastructure to prove authorization.
   */
  requireOrganizationScope(requestedOrganizationId: string): TenantScope {
    this.assertOrganizationAccess(requestedOrganizationId);
    return { organizationId: requestedOrganizationId };
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(`AuthorizationError: ${message}`);
    this.name = 'AuthorizationError';
  }
}
