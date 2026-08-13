import { db } from '@/db';
import { hermesAddonInstallations, hermesAddonAudit } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ControlPlaneContext } from '../knowledge/types';
import { AddOnRegistryService } from './registry';
import { v4 as uuidv4 } from 'uuid';
import { AddOnInstallationStatus } from './contracts';

export class AddOnGovernanceService {
  
  /**
   * Helper para generar eventos de auditoría append-only
   */
  private static generateAuditRecord(
    installation: typeof hermesAddonInstallations.$inferSelect,
    context: ControlPlaneContext,
    eventType: string,
    oldStatus: AddOnInstallationStatus | null,
    newStatus: AddOnInstallationStatus,
    reason?: string,
    overrideActorType?: 'SYSTEM' | 'USER'
  ) {
    return {
      id: `evt_${uuidv4()}`,
      organizationId: installation.organizationId,
      addonId: installation.addonId,
      installationId: installation.id,
      eventType,
      actorId: context.actorId,
      actorType: overrideActorType || (context.role === 'SYSTEM' ? 'SYSTEM' : 'USER'),
      oldStatus,
      newStatus,
      version: installation.version,
      reason,
      createdAt: new Date(),
    };
  }

  /**
   * Asegura que el actor está autorizado para realizar la acción
   */
  private static assertAuthority(context: ControlPlaneContext, installationOrgId: string) {
    if (context.organizationId !== installationOrgId) {
      throw new Error(`[Governance] Unauthorized: Context organizationId mismatch. A05/A06/A07 violation.`);
    }
  }

  /**
   * Inicia el proceso de instalación de un Add-On
   */
  static async requestInstallation(addonId: string, context: ControlPlaneContext) {
    const addon = await AddOnRegistryService.getAddOn(addonId);
    if (!addon) throw new Error(`[Governance] Add-On ${addonId} not found (A01).`);
    if (addon.status === 'DEPRECATED') throw new Error(`[Governance] Add-On ${addonId} is deprecated (A02).`);

    const installationId = `inst_${uuidv4()}`;

    return await db.transaction(async (tx) => {
      // Create installation
      const newInstallation = {
        id: installationId,
        organizationId: context.organizationId,
        addonId: addon.id,
        version: addon.version,
        status: 'INSTALLING' as const,
        configuration: {},
        installedBy: context.actorId,
        installedAt: new Date(),
        updatedAt: new Date(),
        approvedBy: null,
        activatedAt: null,
        manifestSnapshot: null,
      };

      await tx.insert(hermesAddonInstallations).values(newInstallation);

      // Create Audit (A18)
      const audit = this.generateAuditRecord(
        newInstallation,
        context,
        'INSTALL_REQUESTED',
        null,
        'INSTALLING'
      );
      await tx.insert(hermesAddonAudit).values(audit);

      return newInstallation;
    });
  }

  /**
   * Configura un Add-On antes de su aprobación
   */
  static async configureAddOn(installationId: string, configuration: Record<string, unknown>, context: ControlPlaneContext) {
    return await db.transaction(async (tx) => {
      const [installation] = await tx.select().from(hermesAddonInstallations).where(eq(hermesAddonInstallations.id, installationId)).for('update');
      
      if (!installation) throw new Error('[Governance] Installation not found.');
      this.assertAuthority(context, installation.organizationId);

      if (installation.status !== 'INSTALLING' && installation.status !== 'CONFIGURING') {
        throw new Error(`[Governance] Invalid transition from ${installation.status} to CONFIGURING (A10).`);
      }

      const updated = {
        ...installation,
        status: 'CONFIGURING' as const,
        configuration,
        updatedAt: new Date(),
      };

      await tx.update(hermesAddonInstallations)
        .set({ status: 'CONFIGURING', configuration, updatedAt: updated.updatedAt })
        .where(eq(hermesAddonInstallations.id, installationId));

      await tx.insert(hermesAddonAudit).values(this.generateAuditRecord(
        updated, context, 'CONFIGURATION_UPDATED', installation.status as AddOnInstallationStatus, 'CONFIGURING'
      ));

      return updated;
    });
  }

  /**
   * Envía un Add-On a revisión manual (o lo auto-aprueba si no requiere humano según el manifest/policy)
   */
  static async submitForApproval(installationId: string, context: ControlPlaneContext) {
    return await db.transaction(async (tx) => {
      const [installation] = await tx.select().from(hermesAddonInstallations).where(eq(hermesAddonInstallations.id, installationId)).for('update');
      
      if (!installation) throw new Error('[Governance] Installation not found.');
      this.assertAuthority(context, installation.organizationId);

      if (installation.status !== 'CONFIGURING' && installation.status !== 'INSTALLING') {
        throw new Error(`[Governance] Invalid transition from ${installation.status} to PENDING_APPROVAL (A10).`);
      }

      // Check governance requirements (A08)
      const manifest = await AddOnRegistryService.getAddOn(installation.addonId);
      const requiresHumanApproval = manifest?.governanceRequirements.requiresHumanApproval ?? true;

      const nextStatus = requiresHumanApproval ? 'PENDING_APPROVAL' : 'ACTIVE';
      const eventType = requiresHumanApproval ? 'SUBMITTED_FOR_APPROVAL' : 'AUTO_ACTIVATED';

      const updateData: any = {
        status: nextStatus,
        updatedAt: new Date(),
      };

      if (!requiresHumanApproval) {
        updateData.activatedAt = new Date();
        updateData.manifestSnapshot = manifest;
        // approvedBy remains null for AUTO activation
      }

      await tx.update(hermesAddonInstallations)
        .set(updateData)
        .where(eq(hermesAddonInstallations.id, installationId));

      await tx.insert(hermesAddonAudit).values(this.generateAuditRecord(
        { ...installation, ...updateData }, 
        context, 
        eventType, 
        installation.status as AddOnInstallationStatus, 
        nextStatus,
        undefined,
        !requiresHumanApproval ? 'SYSTEM' : undefined // AUTO_ACTIVATED is always actorType=SYSTEM
      ));

      return { ...installation, ...updateData };
    });
  }

  /**
   * Aprueba una instalación. Requiere Human Approval.
   */
  static async approveInstallation(installationId: string, context: ControlPlaneContext) {
    if (context.role === 'SYSTEM') {
      throw new Error(`[Governance] SYSTEM actors cannot approve installations (A11).`);
    }

    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      throw new Error(`[Governance] Only OWNER/ADMIN can approve installations (A09).`);
    }

    return await db.transaction(async (tx) => {
      // SELECT FOR UPDATE evita race conditions (A26)
      const [installation] = await tx.select()
        .from(hermesAddonInstallations)
        .where(eq(hermesAddonInstallations.id, installationId))
        .for('update');
      
      if (!installation) throw new Error('[Governance] Installation not found.');
      this.assertAuthority(context, installation.organizationId);

      if (installation.status !== 'PENDING_APPROVAL') {
        throw new Error(`[Governance] Invalid transition from ${installation.status} to ACTIVE (A10).`);
      }

      if (installation.installedBy === context.actorId) {
        throw new Error('[Governance] Installer cannot approve their own installation (A11).');
      }

      const manifest = await AddOnRegistryService.getAddOn(installation.addonId);

      const updateData = {
        status: 'ACTIVE' as const,
        approvedBy: context.actorId,
        activatedAt: new Date(),
        updatedAt: new Date(),
        manifestSnapshot: manifest || null,
      };

      await tx.update(hermesAddonInstallations)
        .set(updateData)
        .where(eq(hermesAddonInstallations.id, installationId));

      await tx.insert(hermesAddonAudit).values(this.generateAuditRecord(
        { ...installation, ...updateData }, context, 'APPROVED', 'PENDING_APPROVAL', 'ACTIVE'
      ));

      return { ...installation, ...updateData };
    });
  }

  static async suspendAddOn(installationId: string, context: ControlPlaneContext) {
    return await db.transaction(async (tx) => {
      const [installation] = await tx.select().from(hermesAddonInstallations).where(eq(hermesAddonInstallations.id, installationId)).for('update');
      if (!installation) throw new Error('[Governance] Installation not found.');
      this.assertAuthority(context, installation.organizationId);

      if (installation.status !== 'ACTIVE') {
        throw new Error(`[Governance] Cannot suspend from ${installation.status} (A10).`);
      }

      const updateData = { status: 'SUSPENDED' as const, updatedAt: new Date() };
      
      await tx.update(hermesAddonInstallations).set(updateData).where(eq(hermesAddonInstallations.id, installationId));
      await tx.insert(hermesAddonAudit).values(this.generateAuditRecord(
        { ...installation, ...updateData }, context, 'SUSPENDED', 'ACTIVE', 'SUSPENDED'
      ));

      return { ...installation, ...updateData };
    });
  }

  static async deactivateAddOn(installationId: string, context: ControlPlaneContext) {
    return await db.transaction(async (tx) => {
      const [installation] = await tx.select().from(hermesAddonInstallations).where(eq(hermesAddonInstallations.id, installationId)).for('update');
      if (!installation) throw new Error('[Governance] Installation not found.');
      this.assertAuthority(context, installation.organizationId);

      if (installation.status !== 'ACTIVE' && installation.status !== 'SUSPENDED') {
        throw new Error(`[Governance] Cannot deactivate from ${installation.status} (A10).`);
      }

      const updateData = { status: 'DEACTIVATED' as const, updatedAt: new Date() };
      
      await tx.update(hermesAddonInstallations).set(updateData).where(eq(hermesAddonInstallations.id, installationId));
      await tx.insert(hermesAddonAudit).values(this.generateAuditRecord(
        { ...installation, ...updateData }, context, 'DEACTIVATED', installation.status as AddOnInstallationStatus, 'DEACTIVATED'
      ));

      return { ...installation, ...updateData };
    });
  }

  static async rejectInstallation(installationId: string, context: ControlPlaneContext) {
    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      throw new Error(`[Governance] Only OWNER/ADMIN can reject installations (A09).`);
    }

    return await db.transaction(async (tx) => {
      const [installation] = await tx.select().from(hermesAddonInstallations).where(eq(hermesAddonInstallations.id, installationId)).for('update');
      if (!installation) throw new Error('[Governance] Installation not found.');
      this.assertAuthority(context, installation.organizationId);

      if (installation.status !== 'PENDING_APPROVAL') {
        throw new Error(`[Governance] Cannot reject from ${installation.status} (A10).`);
      }

      const updateData = { status: 'REJECTED' as const, updatedAt: new Date() };
      
      await tx.update(hermesAddonInstallations).set(updateData).where(eq(hermesAddonInstallations.id, installationId));
      await tx.insert(hermesAddonAudit).values(this.generateAuditRecord(
        { ...installation, ...updateData }, context, 'REJECTED', 'PENDING_APPROVAL', 'REJECTED'
      ));

      return { ...installation, ...updateData };
    });
  }

  static async activateAddOn(installationId: string, context: ControlPlaneContext) {
    return await db.transaction(async (tx) => {
      const [installation] = await tx.select().from(hermesAddonInstallations).where(eq(hermesAddonInstallations.id, installationId)).for('update');
      if (!installation) throw new Error('[Governance] Installation not found.');
      this.assertAuthority(context, installation.organizationId);

      if (installation.status !== 'SUSPENDED') {
        throw new Error(`[Governance] Cannot activate from ${installation.status} (A10).`);
      }

      const updateData = { status: 'ACTIVE' as const, updatedAt: new Date() };
      
      await tx.update(hermesAddonInstallations).set(updateData).where(eq(hermesAddonInstallations.id, installationId));
      await tx.insert(hermesAddonAudit).values(this.generateAuditRecord(
        { ...installation, ...updateData }, context, 'ACTIVATED', 'SUSPENDED', 'ACTIVE'
      ));

      return { ...installation, ...updateData };
    });
  }
}
