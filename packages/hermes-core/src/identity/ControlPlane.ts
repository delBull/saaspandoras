import { db } from '@saasfly/db-core';
import { users } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';
import crypto from 'crypto';

export interface AuthorizedExecutionContext {
  identity: string;
  capabilities: string[];
}

export class ControlPlane {
  /**
   * Resolves actual admin authority from DB rather than trusting the caller.
   */
  public static async resolveAdminContext(walletAddress: string): Promise<AuthorizedExecutionContext> {
    if (!walletAddress) {
      throw new Error('Unauthorized: No identity provided');
    }
    
    // Resolve identity against the canonical directory (fail-closed)
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);

    if (!user) {
      throw new Error('Unauthorized: Identity not found in canonical directory');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error(`Unauthorized: Identity session is locked or revoked. Status: ${user.status}`);
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new Error(`Unauthorized: Identity lacks administrative capability. Role: ${user.role}`);
    }
    
    return {
      identity: user.id, // H1: Must be canonical database ID, not raw input
      capabilities: [user.role] // Exact capabilities from DB
    };
  }

  /**
   * Resolves canonical organization creation, returning a trusted canonicalOrgId.
   */
  public static async createOrganization(authContext: AuthorizedExecutionContext, data: { name: string, slug: string }): Promise<string> {
    if (!authContext.capabilities.includes('SUPER_ADMIN') && !authContext.capabilities.includes('ADMIN')) {
      throw new Error('Unauthorized: Missing capability to create canonical organization');
    }

    const { db } = await import('@saasfly/db-core');
    const { projects } = await import('@saasfly/db-core/schema');

    // Insert canonical organization (project tenant)
    const [inserted] = await db.insert(projects).values({
      title: data.name,
      slug: data.slug,
      description: "Auto-provisioned by Hermes Control Plane",
      status: 'live'
    }).returning({ slug: projects.slug });

    if (!inserted || !inserted.slug) {
      throw new Error('Failed to create canonical organization');
    }

    // Returning the deterministic, persistent canonical slug
    return inserted.slug;
  }
}
