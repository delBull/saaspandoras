import { DomainPackManifest } from '../../pandoras/core/contracts/pack-contracts';
import { SNARAI_DOMAIN_PACK } from './snarai-domain-pack';

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
export class DomainPackLoader {
  static async load(tenantId: string): Promise<DomainPackManifest> {
    if (tenantId === 'snarai' || tenantId === '2') { // 2 is typically snarai's projectId
      return SNARAI_DOMAIN_PACK;
    }
    
    throw new DomainPackNotFound(tenantId);
  }
}
