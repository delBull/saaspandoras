import { InstalledPackRepository } from '../../ports/repositories/installed-pack-repository.interface';
import { InstalledPack } from '../../core/contracts/pack-contracts';

export class MemoryInstalledPackRepository implements InstalledPackRepository {
  private packs: InstalledPack[] = [];

  async getActivePacks(organizationId: string): Promise<InstalledPack[]> {
    return this.packs.filter(p => p.organizationId === organizationId && p.status === 'active');
  }

  async upsertPack(pack: InstalledPack): Promise<InstalledPack> {
    const existingIndex = this.packs.findIndex(p => p.organizationId === pack.organizationId && p.packId === pack.packId);
    if (existingIndex >= 0) {
      this.packs[existingIndex] = { ...pack };
    } else {
      this.packs.push({ ...pack });
    }
    return pack;
  }
}
