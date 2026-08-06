import { db } from '@/db';
import { installedProducts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { PackManifest } from './pack-types';
import { PackCompiler } from './pack-compiler';
import { Registry } from './pack-registry';

/**
 * Hermes OS - Pack Installer Engine
 * Orchestrates the lifecycle of Packs within a Tenant.
 * Resolves source -> Compiles -> Validates Capabilities -> Installs.
 */
export class PackInstaller {
  private compiler = new PackCompiler();

  /**
   * Installs or upgrades a Pack for a Tenant.
   */
  async install(tenantId: number, packId: string, tenantOverrides: Record<string, any> = {}): Promise<void> {
    // 1. Resolve Source Pack from Registry
    const sourceManifest = Registry.get(packId);

    // 2. Validate Runtime Capabilities (Stubbed)
    await this.validateCapabilities(tenantId, sourceManifest);

    // 3. Compile the Pack
    const compiledManifest = await this.compiler.compile(tenantId, sourceManifest, tenantOverrides);

    // 4. Check if already installed
    const [existing] = await db
      .select({ id: installedProducts.id })
      .from(installedProducts)
      .where(and(
        eq(installedProducts.projectId, tenantId),
        eq(installedProducts.packId, packId)
      ))
      .limit(1);

    if (existing) {
      // ── Upgrade / Additive Install ──────────────────────────────────────────
      // SAFE: Read existing config first and deep-merge the pack on top.
      // We NEVER overwrite existing tenant configuration — we only add/update pack-specific keys.
      const [currentRow] = await db
        .select({ config: installedProducts.config, runtimeManifest: installedProducts.runtimeManifest })
        .from(installedProducts)
        .where(eq(installedProducts.id, existing.id))
        .limit(1);

      const existingConfig = (currentRow?.config as Record<string, any>) || {};
      const existingManifest = (currentRow?.runtimeManifest as Record<string, any>) || {};

      // Merge: existing config wins except for pack-specific keys we're explicitly installing
      const mergedConfig = {
        ...existingConfig,
        packs: {
          ...(existingConfig.packs || {}),
          [packId]: compiledManifest.resolvedOverrides,
        },
      };

      // Append to runtimeManifest history, don't replace it
      const mergedManifest = {
        ...existingManifest,
        [packId]: {
          checksum: compiledManifest.checksum,
          compiledAt: compiledManifest.compiledAt,
          compiledBy: compiledManifest.compiledBy,
        },
      };

      await db.update(installedProducts)
        .set({
          packId: packId, // Update to latest pack
          version: compiledManifest.manifestVersion,
          status: 'active',
          capabilities: {
            ...((currentRow?.config as any)?.capabilities || {}),
            ...Object.fromEntries(sourceManifest.capabilities.map(c => [c.runtime, true])),
          } as any,
          config: mergedConfig as any,
          runtimeManifest: mergedManifest as any,
        })
        .where(eq(installedProducts.id, existing.id));
      
      console.log(`[Installer] Additive install: merged ${packId} into existing tenant config (existing data preserved).`);
    } else {
      // Fresh install
      await db.insert(installedProducts).values({
        projectId: tenantId,
        product: 'HERMES',
        productFamily: 'GROWTH_OS',
        packId: packId,
        version: compiledManifest.manifestVersion,
        status: 'active',
        plan: 'sandbox',
        bindingMode: tenantId === 2 ? 'existing' : 'provisioned', // S'Narai is always 'existing'
        hermesInstanceId: `hermes_inst_${tenantId}`,
        capabilities: sourceManifest.capabilities as any,
        connectors: {} as any,
        config: compiledManifest.resolvedOverrides as any,
        runtimeManifest: {
          checksum: compiledManifest.checksum,
          compiledAt: compiledManifest.compiledAt,
          compiledBy: compiledManifest.compiledBy,
        } as any,
      });
    }

    console.log(`[Installer] Successfully installed Pack ${packId} for tenant ${tenantId}.`);
  }

  /**
   * Validates if the Tenant's environment satisfies the Pack's requirements.
   * Does NOT run DB migrations.
   */
  private async validateCapabilities(tenantId: number, sourceManifest: PackManifest): Promise<void> {
    for (const req of sourceManifest.capabilities) {
      // Stub: Here we would check if the Tenant's OS instance has this capability enabled
      console.log(`[Installer] Validating capability ${req.runtime}@${req.version} for Tenant ${tenantId}...`);
    }
  }

  /**
   * Uninstalls a Pack from a Tenant (Marks as inactive).
   */
  async uninstall(tenantId: number, packId: string): Promise<void> {
    await db.update(installedProducts)
      .set({ status: 'inactive' })
      .where(and(
        eq(installedProducts.projectId, tenantId),
        eq(installedProducts.packId, packId)
      ));

    console.log(`[Installer] Uninstalled Pack ${packId} from tenant ${tenantId}.`);
  }
}
