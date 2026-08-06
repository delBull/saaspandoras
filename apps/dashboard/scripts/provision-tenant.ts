/**
 * Hermes OS — Provision Tenant Script
 *
 * Generic provisioning script using HermesBuilder.
 * Uses direct DB connection (same pattern as other scripts in this project).
 *
 * Usage:
 *   npx tsx scripts/provision-tenant.ts --tenant=snarai --packs=referral_trust_concierge
 *   npx tsx scripts/provision-tenant.ts --tenant=2 --packs=referral_trust_concierge,identity_core
 *   npx tsx scripts/provision-tenant.ts --tenant=snarai --packs=referral_trust_concierge --env=staging
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

// ── Arg Parser ──────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (const arg of args) {
    const [key, value] = arg.replace('--', '').split('=');
    parsed[key] = value;
  }
  return parsed;
}

// ── Direct DB connection (same pattern as other scripts) ───────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ── Mini Pack Installer (standalone — no @/ imports needed) ────────────────
async function installPack(tenantId: number, packId: string, packManifest: any, overrides: Record<string, any> = {}) {
  const resolvedOverrides = { ...packManifest.knowledgeSlots, ...overrides };
  const checksumInput = JSON.stringify({ packId, version: packManifest.version, overrides: resolvedOverrides });
  const checksum = crypto.createHash('sha256').update(checksumInput).digest('hex');

  const [existing] = await db
    .select({ id: schema.installedProducts.id, config: schema.installedProducts.config, runtimeManifest: schema.installedProducts.runtimeManifest })
    .from(schema.installedProducts)
    .where(eq(schema.installedProducts.projectId, tenantId))
    .limit(1);

  const compiledManifest = {
    manifestVersion: packManifest.version,
    resolvedOverrides,
    checksum,
    compiledAt: new Date().toISOString(),
    compiledBy: 'hermes-compiler-v1.0.0',
  };

  if (existing) {
    // ── SAFE ADDITIVE MERGE — never overwrite existing data ──
    const existingConfig = (existing.config as Record<string, any>) || {};
    const existingManifest = (existing.runtimeManifest as Record<string, any>) || {};

    const mergedConfig = {
      ...existingConfig,
      packs: { ...(existingConfig.packs || {}), [packId]: resolvedOverrides },
    };
    const mergedManifest = {
      ...existingManifest,
      [packId]: { checksum, compiledAt: compiledManifest.compiledAt, compiledBy: compiledManifest.compiledBy },
    };

    await db.update(schema.installedProducts)
      .set({
        packId,
        version: packManifest.version,
        status: 'active',
        config: mergedConfig as any,
        runtimeManifest: mergedManifest as any,
      })
      .where(eq(schema.installedProducts.id, existing.id));

    console.log(`  ✓ Merged '${packId}' into existing config (all previous data preserved).`);
  } else {
    // ── Fresh install ─────────────────────────────────────────
    await db.insert(schema.installedProducts).values({
      projectId: tenantId,
      product: 'HERMES',
      productFamily: 'GROWTH_OS',
      packId,
      version: packManifest.version,
      status: 'active',
      plan: 'sandbox',
      bindingMode: tenantId === 2 ? 'existing' : 'provisioned',
      hermesInstanceId: `hermes_inst_${tenantId}`,
      capabilities: {} as any,
      connectors: {} as any,
      config: { packs: { [packId]: resolvedOverrides } } as any,
      runtimeManifest: { [packId]: { checksum, compiledAt: compiledManifest.compiledAt } } as any,
    });
    console.log(`  ✓ Fresh install of '${packId}' complete.`);
  }

  return checksum;
}

// ── Pack definitions (inline to avoid @/ alias issues in tsx) ──────────────
const PACK_REGISTRY: Record<string, any> = {
  referral_trust_concierge: {
    id: 'referral_trust_concierge',
    version: '2.0.0',
    type: 'solution_pack',
    publisher: 'pandoras_core',
    knowledgeSlots: {
      founder_story: 'knowledge/founder-story.md',
      investment_thesis: 'knowledge/investment-thesis.md',
      faq: 'knowledge/faq.md',
      qualification: 'knowledge/qualification.md',
      family_context: 'knowledge/family-context.md',
      objections_family: 'knowledge/objections/family.md',
    },
  },
};

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs();

  if (!args.tenant || !args.packs) {
    console.error('Usage: npx tsx scripts/provision-tenant.ts --tenant=<slug|id> --packs=<pack1,pack2>');
    process.exit(1);
  }

  const packs = args.packs.split(',').map(p => p.trim());

  console.log('\n──────────────────────────────────────────────────────────');
  console.log('  Hermes OS — Tenant Provisioning');
  console.log('──────────────────────────────────────────────────────────');
  console.log(`  Tenant  : ${args.tenant}`);
  console.log(`  Packs   : ${packs.join(', ')}`);
  console.log('──────────────────────────────────────────────────────────\n');

  // Resolve tenant ID from slug if needed
  let tenantId: number;
  if (isNaN(Number(args.tenant))) {
    const [project] = await db.select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.slug, args.tenant))
      .limit(1);
    if (!project) { console.error(`❌ Tenant not found: ${args.tenant}`); process.exit(1); }
    tenantId = project.id;
    console.log(`  Resolved '${args.tenant}' → project_id=${tenantId}\n`);
  } else {
    tenantId = Number(args.tenant);
  }

  for (const packId of packs) {
    const manifest = PACK_REGISTRY[packId];
    if (!manifest) { console.error(`❌ Pack not found in registry: ${packId}`); process.exit(1); }
    console.log(`  → Installing ${packId}...`);
    const checksum = await installPack(tenantId, packId, manifest);
    console.log(`    Checksum: ${checksum.substring(0, 16)}...`);
  }

  console.log('\n──────────────────────────────────────────────────────────');
  console.log(`  ✅ Provisioning complete for tenant_id=${tenantId}`);
  console.log('\n  Verify in DB:');
  console.log(`    SELECT pack_id, version, status, config->'packs' FROM installed_products WHERE project_id=${tenantId};`);
  console.log('──────────────────────────────────────────────────────────\n');

  await pool.end();
  process.exit(0);
}

main().catch(err => { console.error('❌ Fatal:', err); pool.end(); process.exit(1); });
