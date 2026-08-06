import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

// This script provisions a Tenant with the Hermes Kernel (V5 Architecture)
// Usage: DATABASE_URL=... bun run scripts/provision-tenant-v5.ts 17

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function provisionTenant() {
  const tenantIdStr = process.argv[2];
  if (!tenantIdStr) {
    console.error("Usage: bun run provision-tenant-v5.ts <TENANT_ID>");
    process.exit(1);
  }
  const tenantId = parseInt(tenantIdStr, 10);
  console.log(`🚀 Provisioning Tenant ID: ${tenantId}...`);

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, tenantId)
  });

  if (!project) {
    console.error(`❌ Project ${tenantId} not found`);
    process.exit(1);
  }
  console.log(`Found Project: ${project.slug}`);

  // Construct Identity & Bindings
  const capabilities = {
    voice: false,
    runtime: true,
    identity: true,
    analytics: true,
    knowledge: true,
    multiagent: false
  };

  const runtimeManifest = {
    compiledAt: new Date().toISOString(),
    artifacts: [
      { type: 'Discovery', status: 'COMPILED', version: 'v2.1', engine: 'Hermes' },
      { type: 'Knowledge', status: 'COMPILED', version: 'v2.1', engine: 'Hermes' },
      { type: 'Workflow', status: 'COMPILED', version: 'v1.0', engine: 'Hermes' }
    ],
    bindings: {
      'language.generate': 'ollama',
      'security.authorize': 'kernel',
      'routing.navigate': 'kernel'
    },
    identityContext: {
      name: project.title || "S'Narai",
      baseCurrency: 'USD'
    }
  };

  // Upsert into installed_products
  const existing = await db.query.installedProducts.findFirst({
    where: and(
      eq(schema.installedProducts.projectId, tenantId),
      eq(schema.installedProducts.product, 'HERMES')
    )
  });

  if (existing) {
    console.log(`🔄 Updating existing Hermes OS installation for Tenant ${tenantId}...`);
    await db.update(schema.installedProducts)
      .set({
        packId: 'referral_trust_concierge',
        capabilities,
        runtimeManifest,
        bindingMode: 'existing'
      })
      .where(eq(schema.installedProducts.id, existing.id));
  } else {
    console.log(`🌱 Installing new Hermes OS for Tenant ${tenantId}...`);
    await db.insert(schema.installedProducts).values({
      projectId: tenantId,
      product: 'HERMES',
      productFamily: 'GROWTH_OS',
      plan: 'enterprise',
      status: 'active',
      capabilities,
      runtimeManifest,
      packId: 'referral_trust_concierge',
      bindingMode: 'provisioned'
    });
  }

  console.log(`✅ Tenant ${tenantId} successfully provisioned on Hermes Kernel OS.`);
}

provisionTenant().catch((err) => {
  console.error("Provisioning failed:", err);
  process.exit(1);
});
