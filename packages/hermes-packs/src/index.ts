import { DomainPack } from './types';
import { SNARAI_DOMAIN_PACK } from './snarai';

export * from './types';
export { SNARAI_DOMAIN_PACK } from './snarai';

export class DomainPackLoader {
  private static registry: Map<string, DomainPack> = new Map([
    ['snarai', SNARAI_DOMAIN_PACK]
  ]);

  static loadPack(packId: string): DomainPack {
    const id = packId.toLowerCase();
    const pack = this.registry.get(id);
    if (!pack) {
      console.warn(`[Hermes Packs] DomainPack '${packId}' not found, falling back to 'snarai'`);
      return SNARAI_DOMAIN_PACK;
    }
    return pack;
  }

  static registerPack(pack: DomainPack): void {
    this.registry.set(pack.manifest.id.toLowerCase(), pack);
  }
}
