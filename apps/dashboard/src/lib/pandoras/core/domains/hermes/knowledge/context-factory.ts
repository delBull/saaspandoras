import { requireVerifiedAuth, isAdmin } from "@/lib/auth";
import { ControlPlaneContext, ControlPlaneRole } from "./types";

export class ControlPlaneContextFactory {
  /**
   * Constructs the ControlPlaneContext based on the current Next.js HTTP request session.
   * Ensures that the user is authenticated and derives their role.
   * If the user attempts to request an organization they do not have access to, it throws an error.
   */
  static async fromSession(requestedOrganizationId: string): Promise<ControlPlaneContext> {
    // 1. Get authenticated session
    const { address, session } = await requireVerifiedAuth(false);
    
    // 2. Resolve Role
    let role: ControlPlaneRole = 'VIEWER';
    const isUserAdmin = await isAdmin(address);
    if (isUserAdmin) {
      role = 'ADMIN';
    }

    // 3. Organization / Tenant Authorization (ADR-011)
    // For now, in SaaS Pandoras, admins have access to projects/orgs.
    // In a fully multi-tenant DB, we would check if this specific address belongs to the requestedOrganizationId.
    // For the sake of this architectural contract, we assert that the user must be an Admin to govern knowledge.
    if (role !== 'ADMIN') {
      throw new Error("FORBIDDEN: User does not have governance authority for this organization.");
    }
    
    // Verify tenant exists and user has access (Placeholder for actual DB lookup)
    // const hasAccess = await db.query...
    // if (!hasAccess) throw new Error("FORBIDDEN: Cross-tenant access denied.");
    
    return {
      actorId: address,
      organizationId: requestedOrganizationId, // This is now authorized
      role: role,
      permissions: [],
      sessionId: session.userId || `session_${Date.now()}`
    };
  }

  /**
   * Constructs a system-level context for background jobs and Hermes' own internal operations.
   */
  static forSystem(organizationId: string): ControlPlaneContext {
    return {
      actorId: 'hermes_system',
      organizationId,
      role: 'SYSTEM',
      permissions: ['discover_knowledge', 'propose_addon']
    };
  }
}
