import { InstalledPack } from '../../core/contracts/pack-contracts';

export interface InstalledPackRepository {
  /**
   * Obtiene todos los packs activos de una organización.
   */
  getActivePacks(organizationId: string): Promise<InstalledPack[]>;

  /**
   * Instala o actualiza un pack en la organización.
   */
  upsertPack(pack: InstalledPack): Promise<InstalledPack>;
}
