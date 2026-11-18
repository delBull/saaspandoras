/**
 * 🛡️ Full-Access Provisioning Service (shared: request + approve flows)
 */
import { db } from '@saasfly/db';
import { projects, installedProducts } from '@saasfly/db/schema';
import { eq, and, inArray } from "@saasfly/db-core";
import { productFamilyOf } from '@saasfly/shared';
import { NftLabActivationService } from '@saasfly/nexus-deals-sdk';

export type Family = 'GROWTH_OS' | 'HERMES' | 'CAPITAL' | 'NFT_LAB';

export const FULL_ACCESS_FAMILIES: Array<{ family: Family; product: string }> = [
  { family: 'GROWTH_OS', product: 'GROWTH_OS' },
  { family: 'HERMES', product: 'HERMES' },
  { family: 'CAPITAL', product: 'TOKENIZATION' },   // RWA vertical
  { family: 'NFT_LAB', product: 'NFT_LAB' },        // NFT Lab (Phase 3 registry)
];

/**
 * Claves legacy que la DB todavía tiene y deben reconocerse como el MISMO
 * producto al buscar si ya está instalado.
 *
 * Importante: la búsqueda se hace por `product`, NO por `productFamily`.
 * `HERMES` y `GROWTH_OS` comparten la familia 'GROWTH_OS', así que filtrar por
 * familia hacía que "instalar Growth OS" encontrara la fila de Hermes (y
 * viceversa), dejando tenants con el producto equivocado.
 */
const PRODUCT_LEGACY_ALIASES: Record<string, string[]> = {
  HERMES: ['HERMES_OS'],
  GROWTH_OS: [],
  TOKENIZATION: ['PANDORAS_RWA', 'RWA'],
};

function productCandidates(product: string): string[] {
  return [product, ...(PRODUCT_LEGACY_ALIASES[product] ?? [])];
}

export interface FullAccessResult { family: Family; action: string; plan?: string; status?: string }

export async function provisionFullAccess(
  slug: string,
  authorizedBy: string,
): Promise<{ project: any; results: Array<FullAccessResult> }> {
  const [project] = await db
    .select({ id: projects.id, organizationId: projects.organizationId, title: projects.title })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);
  if (!project) throw new Error(`Project not found: ${slug}`);

  const results: Array<FullAccessResult> = [];
  for (const { family, product } of FULL_ACCESS_FAMILIES) {
    if (family === 'NFT_LAB') {
      // Phase 3 registry owns provisioning + capability grants for NFT Lab
      const activation = await NftLabActivationService.activate({
        organizationId: project.organizationId,
        plan: 'enterprise',
        authorizedBy,
      });
      results.push({ family, action: activation.alreadyActive ? 'already_full' : 'installed', plan: 'enterprise' });
      continue;
    }

    // Match por PRODUCTO (con alias legacy), nunca por familia.
    const [existing] = await db
      .select({ id: installedProducts.id, plan: installedProducts.plan, status: installedProducts.status })
      .from(installedProducts)
      .where(and(
        eq(installedProducts.projectId, project.id),
        inArray(installedProducts.product, productCandidates(product)),
      ))
      .limit(1);

    if (existing) {
      if (existing.plan !== 'enterprise' || existing.status !== 'active') {
        await db.update(installedProducts)
          .set({ plan: 'enterprise', status: 'active' })
          .where(eq(installedProducts.id, existing.id));
        results.push({ family, action: 'upgraded', plan: 'enterprise' });
      } else {
        results.push({ family, action: 'already_full', plan: existing.plan });
      }
    } else {
      await db.insert(installedProducts).values({
        projectId: project.id,
        product,
        // Familia canónica del registry (single source of truth), no la etiqueta local.
        productFamily: productFamilyOf(product as any),
        plan: 'enterprise',
        status: 'active',
        bindingMode: 'provisioned',
        hermesInstanceId: `hermes_inst_${project.id}`,
        capabilities: {},
        connectors: {},
        config: {
          provisionedVia: 'admin_full_access',
          billingExempt: true,
          provisionedBy: authorizedBy,
        },
      } as any);
      results.push({ family, action: 'installed', plan: 'enterprise' });
    }
  }
  return { project, results };
}
