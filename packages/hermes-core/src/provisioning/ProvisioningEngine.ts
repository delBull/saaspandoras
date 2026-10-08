import { db } from '@saasfly/db-core';
import { projects, projectCollaborators, users, nexusCollaborators } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';
import crypto from 'crypto';

export interface ResolvedProductEntitlement {
  permissions: Record<string, boolean>;
}

export interface ProvisioningConfig {
  title: string;
  slug: string;
  adminEmail: string;
  canonicalOrgId: string; // H4: Must be passed from Control Plane, never random
  entitlement: ResolvedProductEntitlement; // H12: Engine agnostic to product
  description?: string;
  extraProjectData?: any; 
}

export class ProvisioningEngine {


  /**
   * Internal transaction logic to provision a tenant.
   * Do NOT call this directly from routes unless passing through PaymentCore or Admin.
   */
  private static async executeProvisioningTx(config: ProvisioningConfig) {
    return await db.transaction(async (tx) => {
      // 1. Resolve Identity
      let user = await tx.query.users.findFirst({
        where: eq(users.email, config.adminEmail)
      });
      if (!user) {
        throw new Error(`User not found for email: ${config.adminEmail}. Must register first.`);
      }

      // 2. Resolve Nexus Collaborator
      let collab = await tx.query.nexusCollaborators.findFirst({
        where: eq(nexusCollaborators.email, config.adminEmail)
      });
      if (!collab) {
        const insertCollab = await tx.insert(nexusCollaborators).values({
          name: user.name ?? 'Admin',
          email: config.adminEmail,
          role: 'TENANT_ADMIN',
          status: 'ACTIVE',
          token: crypto.randomUUID(), // Required by schema
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          permissions: config.entitlement.permissions
        }).returning();
        collab = insertCollab[0];
      } else {
        // Upgrade collaborator role/permissions if necessary
        await tx.update(nexusCollaborators).set({
          role: collab.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TENANT_ADMIN',
          permissions: config.entitlement.permissions
        }).where(eq(nexusCollaborators.id, collab.id));
      }

      if (!collab) {
        throw new Error('Failed to resolve collaborator.');
      }

      // 3. Check Slug Collision
      const existingProject = await tx.query.projects.findFirst({
        where: eq(projects.slug, config.slug)
      });
      if (existingProject) {
        throw new Error(`Tenant slug '${config.slug}' is already taken.`);
      }

      // 4. Create the Tenant (Project)
      const newProject = await tx.insert(projects).values({
        title: config.title,
        slug: config.slug,
        description: config.description || `Autoprovisioned tenant for ${config.title}`,
        status: 'live', // Must match projectStatusEnum
        isSimulationMode: false,
        organizationId: config.canonicalOrgId,
        ...(config.extraProjectData || {})
      }).returning({ id: projects.id, slug: projects.slug });

      if (!newProject || newProject.length === 0 || !newProject[0]) {
        throw new Error('Failed to create project.');
      }

      // 5. Assign Collaborator to Tenant
      await tx.insert(projectCollaborators).values({
        projectId: newProject[0].slug, // Warning: projectCollaborators.projectId refers to the SLUG currently
        collaboratorId: collab.id
      });

      return {
        tenantId: newProject[0].slug,
        collaboratorId: collab.id,
        success: true
      };
    });
  }

  /**
   * PATH 1: Paid Provisioning (Triggered ONLY by PaymentCoreService)
   * The Inbox Event must have been verified as a successful settlement.
   */
  public static async executePaidProvisioning(
    paymentInboxEventId: string,
    config: ProvisioningConfig
  ) {
    console.info(`[ProvisioningEngine] Executing PAID provisioning triggered by Inbox Event: ${paymentInboxEventId}`);
    return await this.executeProvisioningTx(config);
  }

  /**
   * PATH 2: Admin Free Provisioning (Manual Override)
   * Must be called by a validated SUPER_ADMIN or ADMIN from a secure route.
   */
  public static async executeAdminProvisioning(
    authContext: { identity: string; capabilities: string[] },
    config: ProvisioningConfig
  ) {
    console.info(`[ProvisioningEngine] Executing ADMIN (Free) provisioning. Executor: ${authContext.identity}`);
    if (!authContext.capabilities.includes('SUPER_ADMIN') && !authContext.capabilities.includes('ADMIN')) {
      throw new Error('Unauthorized: Missing ADMIN capability to execute free provisioning.');
    }
    
    return await this.executeProvisioningTx(config);
  }
}
