import { Registry } from '../runtimes/pack-registry';
import { PackInstaller } from '../runtimes/pack-installer';

/**
 * Hermes Platform Compiler — HermesBuilder
 *
 * Fluent builder API that compiles a complete tenant runtime from Source Packs.
 * This is the top-level orchestrator of Hermes OS.
 *
 * Usage:
 *   await HermesBuilder
 *     .tenant('snarai')
 *     .install('referral_trust_concierge')
 *     .install('identity_core')
 *     .compile();
 *
 * What happens:
 *   ┌─────────────────────────────────────────────────────┐
 *   │                  Source Packs                       │
 *   │   (Knowledge, Journey, Discovery, Media, Events)    │
 *   └───────────────────────┬─────────────────────────────┘
 *                           ↓
 *                    Registry.get()
 *                           ↓
 *                    PackCompiler.compile()
 *                           ↓
 *                    PackInstaller.install()
 *                           ↓
 *   ┌─────────────────────────────────────────────────────┐
 *   │             Compiled Tenant Runtime                 │
 *   │   Conversation + Discovery + SEO + Media +          │
 *   │   Analytics + Widget + LLMs.txt + Connectors        │
 *   └─────────────────────────────────────────────────────┘
 */
export class HermesBuilder {
  private tenantId: number | null = null;
  private tenantSlug: string | null = null;
  private packIds: string[] = [];
  private overrides: Record<string, Record<string, any>> = {};

  private constructor() {}

  /**
   * Initialize a builder for a specific tenant.
   */
  static tenant(slugOrId: string | number): HermesBuilder {
    const builder = new HermesBuilder();
    if (typeof slugOrId === 'number') {
      builder.tenantId = slugOrId;
    } else {
      builder.tenantSlug = slugOrId;
    }
    return builder;
  }

  /**
   * Add a pack to the build queue.
   */
  install(packId: string, packOverrides: Record<string, any> = {}): this {
    if (!Registry.has(packId)) {
      throw new Error(`[HermesBuilder] Pack not found in Registry: ${packId}`);
    }
    this.packIds.push(packId);
    this.overrides[packId] = packOverrides;
    return this;
  }

  /**
   * Execute the full compilation and installation pipeline.
   * This resolves all dependencies, compiles each pack, and persists the runtime.
   */
  async compile(): Promise<{ tenantId: number; packs: string[]; success: boolean }> {
    const tid = await this.resolveTenantId();
    const installer = new PackInstaller();

    console.log(`\n[HermesBuilder] Compiling runtime for Tenant ${tid}...`);
    console.log(`[HermesBuilder] Packs queue: ${this.packIds.join(', ')}\n`);

    const results: string[] = [];

    for (const packId of this.packIds) {
      console.log(`[HermesBuilder] → Installing ${packId}...`);
      await installer.install(tid, packId, this.overrides[packId] || {});
      results.push(packId);
      console.log(`[HermesBuilder] ✓ ${packId} installed.\n`);
    }

    console.log(`[HermesBuilder] ✅ Compilation complete for Tenant ${tid}.`);
    console.log(`[HermesBuilder] Installed packs: ${results.join(', ')}`);

    return { tenantId: tid, packs: results, success: true };
  }

  private async resolveTenantId(): Promise<number> {
    if (this.tenantId) return this.tenantId;

    // If we have a slug, we need to resolve it to an ID
    if (this.tenantSlug) {
      const { db } = await import('@/db');
      const { projects } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, this.tenantSlug))
        .limit(1);

      if (!project) {
        throw new Error(`[HermesBuilder] Tenant not found: ${this.tenantSlug}`);
      }

      this.tenantId = project.id;
      return project.id;
    }

    throw new Error('[HermesBuilder] No tenant specified. Use .tenant(slug|id)');
  }
}
