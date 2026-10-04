/**
 * 🛡️ Full-Access Provisioning Service (shared: request + approve flows)
 */
import { db } from '@saasfly/db';
import { projects, installedProducts } from '@saasfly/db/schema';
import { eq, and } from "@saasfly/db-core";
import { NftLabActivationService } from '@saasfly/nexus-deals-sdk';

export type Family = 'GROWTH_OS' | 'HERMES' | 'CAPITAL' | 'NFT_LAB';

export const FULL_ACCESS_FAMILIES: Array<{ family: Family; product: string }> = [
  { family: 'GROWTH_OS', product: 'GROWTH_OS' },
  { family: 'HERMES', product: 'HERMES' },
  { family: 'CAPITAL', product: 'TOKENIZATION' },   // RWA vertical
  { family: 'NFT_LAB', product: 'NFT_LAB' },        // NFT Lab (Phase 3 registry)
];

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

    const [existing] = await db
      .select({ id: installedProducts.id, plan: installedProducts.plan, status: installedProducts.status })
      .from(installedProducts)
      .where(and(
        eq(installedProducts.projectId, project.id),
        eq(installedProducts.productFamily, family),
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
        productFamily: family,
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
