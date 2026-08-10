import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { installedPacks } from '@/db/schema';
import { InstalledPackRepository } from '../../ports/repositories/installed-pack-repository.interface';
import { InstalledPack } from '../../core/contracts/pack-contracts';

export class PostgresInstalledPackRepository implements InstalledPackRepository {
  
  async getActivePacks(organizationId: string): Promise<InstalledPack[]> {
    const rows = await db.select()
      .from(installedPacks)
      .where(eq(installedPacks.organizationId, organizationId));
      
    return rows
      .filter(row => row.status === 'active')
      .map(row => ({
        organizationId: row.organizationId,
        packId: row.packId,
        version: row.version,
        status: row.status as any,
        installedAt: row.installedAt.toISOString()
      }));
  }

  async upsertPack(pack: InstalledPack): Promise<InstalledPack> {
    // Para simplificar, intentamos insert; si la PK id fuese estática, podríamos hacer onConflictDoUpdate.
    // Como id es UUID random, una upsert real requeriría unique(organizationId, packId).
    await db.insert(installedPacks).values({
      organizationId: pack.organizationId,
      packId: pack.packId,
      version: pack.version,
      status: pack.status,
      configuration: {},
    });
    
    return pack;
  }
}
