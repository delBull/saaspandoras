import { PackManifest } from '../contracts';

export class PackRegistry {
  private static instance: PackRegistry;
  private packs = new Map<string, PackManifest>();

  private constructor() {}

  public static getInstance(): PackRegistry {
    if (!PackRegistry.instance) {
      PackRegistry.instance = new PackRegistry();
    }
    return PackRegistry.instance;
  }

  public register(pack: PackManifest): void {
    this.packs.set(pack.id, pack);
  }

  public get(packId: string): PackManifest | undefined {
    return this.packs.get(packId);
  }

  public getPacks(): PackManifest[] {
    return Array.from(this.packs.values());
  }
}
