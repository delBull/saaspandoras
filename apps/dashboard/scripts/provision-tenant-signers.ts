/**
 * 🔑 Provisiona la identidad criptográfica de cada tenant (gap 1).
 *
 * Crea (idempotente) un par de llaves por tenant y guarda la privada cifrada con
 * la KEK. Imprime sólo direcciones públicas.
 *
 * Uso:
 *   bun run scripts/provision-tenant-signers.ts
 *   bun run scripts/provision-tenant-signers.ts --tenant=snarai
 */
import { db } from '@saasfly/db-core';
import { hermesKnowledgeRegistry, projects } from '@saasfly/db-core/schema';
import { sql } from '@saasfly/db-core';
import { ensureTenantSigner, getTenantSigner } from '@saasfly/hermes-core';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const only = arg('tenant');

  const rows = only
    ? [{ tenantId: only }]
    : await db
        .select({ tenantId: hermesKnowledgeRegistry.tenantId })
        .from(hermesKnowledgeRegistry)
        .groupBy(hermesKnowledgeRegistry.tenantId);

  const projectSlugs = only
    ? []
    : (await db
        .select({ slug: projects.slug })
        .from(projects)
        .where(sql`${projects.status} = 'live'`))
        .map((p) => p.slug)
        .filter((s): s is string => Boolean(s));

  const tenants = [...new Set([...rows.map((r) => r.tenantId), ...projectSlugs])].sort();

  console.log(`\nIdentidad por tenant · ${tenants.length} tenants\n`);
  for (const tenantId of tenants) {
    try {
      const result = await ensureTenantSigner(tenantId, 'cli:provision-tenant-signers');
      const check = await getTenantSigner(tenantId);
      const verified = check?.address === result.address;
      console.log(
        `  ${verified ? '✓' : '⚠️'} ${tenantId.padEnd(18)} ${result.address} · v${result.keyVersion}${result.created ? ' (creada)' : ' (ya existía)'}`,
      );
    } catch (err: any) {
      console.error(`  ✗ ${tenantId}: ${err?.message || err}`);
    }
  }
  console.log('');
}

main().catch((err) => {
  console.error('Error:', err?.message || err);
  process.exit(1);
});
