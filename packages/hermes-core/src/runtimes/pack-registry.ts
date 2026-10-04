import { PackManifest } from './pack-types';

/**
 * Hermes OS — Pack Registry
 * Auto-discovering registry of all Source Packs.
 * Packs self-register when imported. No manual wiring needed.
 */
export class PackRegistry {
  private packs: Map<string, PackManifest> = new Map();

  register(manifest: PackManifest): void {
    if (this.packs.has(manifest.id)) {
      console.warn(`[Registry] Overwriting pack: ${manifest.id}`);
    }
    this.packs.set(manifest.id, manifest);
    console.log(`[Registry] Registered pack: ${manifest.id} v${manifest.version} (${manifest.type})`);
  }

  get(packId: string): PackManifest {
    const pack = this.packs.get(packId);
    if (!pack) throw new Error(`[Registry] Pack not found: ${packId}`);
    return pack;
  }

  getByType(type: PackManifest['type']): PackManifest[] {
    return Array.from(this.packs.values()).filter(p => p.type === type);
  }

  listAll(): PackManifest[] {
    return Array.from(this.packs.values());
  }

  has(packId: string): boolean {
    return this.packs.has(packId);
  }
}

// ── Global OS Registry Singleton ─────────────────────────────────────────────
export const Registry = new PackRegistry();

// ── Auto-Discovery: Packs register themselves on OS boot ──────────────────────
// Add new packs here as the ecosystem grows.
// Each import triggers self-registration via the Registry singleton.
import { ReferralTrustPack } from '../packs/referral-trust/index';
Registry.register(ReferralTrustPack);
