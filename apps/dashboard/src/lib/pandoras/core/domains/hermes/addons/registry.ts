import { db } from '@/db';
import { hermesAddons } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { HermesAddOnManifest } from './contracts';

export class AddOnRegistryService {
  
  /**
   * Registra o actualiza un Add-On en el catálogo maestro (Global)
   * Usado durante el despliegue del sistema o por un System Admin.
   */
  static async register(manifest: HermesAddOnManifest): Promise<void> {
    const addonId = manifest.id;
    const version = manifest.version;

    await db.insert(hermesAddons)
      .values({
        id: addonId,
        name: manifest.name,
        version: version,
        type: manifest.type,
        description: manifest.description,
        manifest: manifest,
        status: manifest.status,
      })
      .onConflictDoUpdate({
        target: [hermesAddons.id],
        set: {
          name: manifest.name,
          version: version,
          type: manifest.type,
          description: manifest.description,
          manifest: manifest,
          status: manifest.status,
          updatedAt: new Date(),
        }
      });
      
    console.log(`[AddOnRegistry] Registered Add-On: ${addonId}@${version}`);
  }

  /** Obtiene todos los Add-Ons disponibles y activos en el ecosistema */
  static async getAvailableAddOns(): Promise<HermesAddOnManifest[]> {
    const addons = await db.select()
      .from(hermesAddons)
      .where(eq(hermesAddons.status, 'AVAILABLE'));

    return addons.map(a => a.manifest as unknown as HermesAddOnManifest);
  }

  /** Obtiene un Add-On específico por su ID global */
  static async getAddOn(addonId: string): Promise<HermesAddOnManifest | undefined> {
    const results = await db.select()
      .from(hermesAddons)
      .where(eq(hermesAddons.id, addonId))
      .limit(1);

    const record = results[0];
    if (!record) return undefined;
    return record.manifest as unknown as HermesAddOnManifest;
  }

  /** Valida si el addon existe y está AVAILABLE */
  static async validateAddOnAvailability(addonId: string, version?: string): Promise<HermesAddOnManifest> {
    const addon = await this.getAddOn(addonId);
    if (!addon) {
      throw new Error(`AddOn ${addonId} not found in the Registry.`);
    }
    if (addon.status !== 'AVAILABLE') {
      throw new Error(`AddOn ${addonId} is DEPRECATED and cannot be installed.`);
    }
    if (version && addon.version !== version) {
      throw new Error(`AddOn ${addonId} version mismatch. Expected ${version}, but registry has ${addon.version}.`);
    }
    return addon;
  }
}
