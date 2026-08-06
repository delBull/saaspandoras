/**
 * Discovery Router — resolves a tenant slug to a compiled DiscoveryManifest.
 * Used internally by all Discovery API routes.
 * 
 * Pipeline:
 *   slug → projectId → installed_products → CompiledRuntimeManifest
 *                                                ↓
 *                                      DiscoveryCompiler
 *                                                ↓
 *                                   CompiledDiscoveryManifest
 *                                                ↓
 *                                     Caller renders output
 */
import { db } from '@/db';
import { projects, installedProducts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DiscoveryCompiler } from '../../lib/hermes/runtimes/discovery-compiler';
import { CompiledDiscoveryManifest } from '../../lib/hermes/runtimes/discovery-types';

// In-memory cache: avoid recompiling on every request
const manifestCache = new Map<string, { manifest: CompiledDiscoveryManifest; checksum: string }>();

export async function resolveDiscoveryManifest(slug: string): Promise<{
  manifest: CompiledDiscoveryManifest;
  tenantContext: Record<string, any>;
}> {
  // 1. Resolve tenant
  const [project] = await db.select({
    id: projects.id,
    title: projects.title,
    website: projects.website,
    description: projects.description,
    slug: projects.slug,
  })
  .from(projects)
  .where(eq(projects.slug, slug))
  .limit(1);

  if (!project) throw new Error(`Tenant not found: ${slug}`);

  // 2. Load Compiled Runtime Manifest from DB
  const [installed] = await db.select({
    config: installedProducts.config,
    runtimeManifest: installedProducts.runtimeManifest,
    version: installedProducts.version,
  })
  .from(installedProducts)
  .where(eq(installedProducts.projectId, project.id))
  .limit(1);

  if (!installed) throw new Error(`No installed packs for tenant: ${slug}`);

  // 3. Build the fake CompiledRuntimeManifest shape the compiler expects
  const runtimeManifest = {
    manifestVersion: installed.version || '1.0.0',
    resolvedOverrides: installed.config as Record<string, any>,
    checksum: (installed.runtimeManifest as any)?.checksum || 'unknown',
    compiledAt: new Date(),
    compiledBy: 'hermes-compiler-v1.0.0',
    status: 'installed' as const,
  };

  // 4. Cache check — recompile only if runtimeManifest changed
  const cached = manifestCache.get(slug);
  if (cached && cached.checksum === runtimeManifest.checksum) {
    return { manifest: cached.manifest, tenantContext: buildContext(project) };
  }

  // 5. Compile fresh DiscoveryManifest
  const compiler = new DiscoveryCompiler();
  const manifest = await compiler.compile(project.id, runtimeManifest as any);

  manifestCache.set(slug, { manifest, checksum: runtimeManifest.checksum });

  return { manifest, tenantContext: buildContext(project) };
}

function buildContext(project: { title: string; website: string | null; description: string }) {
  return {
    projectName: project.title,
    website: project.website || '',
    description: project.description,
  };
}
