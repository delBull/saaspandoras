import { DomainPackManifest } from '../../pandoras/core/contracts/pack-contracts';
import { SNARAI_DOMAIN_PACK } from './snarai-domain-pack';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
export class DomainPackNotFound extends Error {
  constructor(tenantId: string) {
    super(`Domain Pack not found for tenant: ${tenantId}`);
    this.name = 'DomainPackNotFound';
  }
}

/**
 * Loads the Domain Pack configuration for a given tenant.
 * In production, this would load from DB/Storage. For now, it routes to static packs.
 */
const PACK_REGISTRY: Record<string, DomainPackManifest> = {
  'snarai': SNARAI_DOMAIN_PACK,
  '2': SNARAI_DOMAIN_PACK // legacy projectId mapping
};

export class DomainPackLoader {
  static async load(organizationId: string): Promise<DomainPackManifest> {
    // 1. Resolve from Database
    try {
      const projectRecord = await db.query.projects.findFirst({
        where: or(
          eq(projects.slug, organizationId),
          // Si el organizationId es numérico, probar buscar por id
          ...(!isNaN(Number(organizationId)) ? [eq(projects.id, Number(organizationId))] : [])
        )
      });

      if (projectRecord?.tenantRuntimeConfig) {
        const config = projectRecord.tenantRuntimeConfig as Record<string, any>;
        if (config.domainPack) {
          return config.domainPack as DomainPackManifest;
        }
      }
    } catch (error) {
      console.warn(`[DomainPackLoader] Error reading from DB for ${organizationId}:`, error);
    }

    // 2. Fallback to Local Registry
    if (PACK_REGISTRY[organizationId]) {
      return PACK_REGISTRY[organizationId];
    }
    
    throw new DomainPackNotFound(organizationId);
  }
}
