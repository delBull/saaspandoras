import { db } from '@/db';
import { hermesAddonInstallations, hermesAddonAudit } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { AddOnRegistryService } from './registry';
import { ControlPlaneContext } from '../knowledge/types';
import { AddOnInstallation, AddOnInstallationStatus, HermesAddOnManifest } from './contracts';

export class AddOnInstallationManager {
  
  /**
   * Obtiene una instalación por tenant y addonId
   */
  static async getInstallation(organizationId: string, addonId: string): Promise<AddOnInstallation | undefined> {
    const results = await db.select()
      .from(hermesAddonInstallations)
      .where(
        and(
          eq(hermesAddonInstallations.organizationId, organizationId),
          eq(hermesAddonInstallations.addonId, addonId)
        )
      )
      .limit(1);

    if (results.length === 0) return undefined;

    const record = results[0];
    if (!record) return undefined;
    return {
      installationId: record.id,
      organizationId: record.organizationId,
      addonId: record.addonId,
      version: record.version,
      status: record.status as AddOnInstallationStatus,
      configuration: record.configuration as Record<string, unknown>,
      installedBy: record.installedBy,
      approvedBy: record.approvedBy || undefined,
      installedAt: record.installedAt,
      activatedAt: record.activatedAt || undefined,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Obtiene todos los Add-Ons activos para un tenant
   */
  static async getActiveAddOns(organizationId: string): Promise<{ installation: AddOnInstallation, manifest: HermesAddOnManifest }[]> {
    const activeInstallations = await db.select()
      .from(hermesAddonInstallations)
      .where(
        and(
          eq(hermesAddonInstallations.organizationId, organizationId),
          eq(hermesAddonInstallations.status, 'ACTIVE')
        )
      );

    const result = [];
    for (const record of activeInstallations) {
      const manifest = await AddOnRegistryService.getAddOn(record.addonId);
      if (manifest) {
        result.push({
          installation: {
            installationId: record.id,
            organizationId: record.organizationId,
            addonId: record.addonId,
            version: record.version,
            status: record.status as AddOnInstallationStatus,
            configuration: record.configuration as Record<string, unknown>,
            installedBy: record.installedBy,
            approvedBy: record.approvedBy || undefined,
            installedAt: record.installedAt,
            activatedAt: record.activatedAt || undefined,
            updatedAt: record.updatedAt,
          },
          manifest
        });
      }
    }
    return result;
  }
}
