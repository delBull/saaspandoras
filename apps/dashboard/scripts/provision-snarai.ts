/**
 * Provision S'Narai — Hermes OS Bootstrap Script
 * 
 * Installs the ReferralTrustConcierge Pack on S'Narai (projectId = 2).
 * Run: npx tsx scripts/provision-snarai.ts
 *
 * This script uses the PackInstaller, which:
 *   1. Fetches the Source Pack from the Registry
 *   2. Compiles it into a CompiledRuntimeManifest
 *   3. Persists it in installed_products (conceptually tenant_runtime_packs)
 */

import 'dotenv/config';
import { PackInstaller } from '../src/lib/hermes/runtimes/pack-installer';

const SNARAI_TENANT_ID = 2;

async function provision() {
  console.log('───────────────────────────────────────────────────────');
  console.log('  Hermes OS — S\'Narai Provisioning Script');
  console.log('───────────────────────────────────────────────────────');
  console.log(`Target Tenant: S'Narai (id=${SNARAI_TENANT_ID})`);
  console.log('Pack: referral_trust_concierge v1.0.0');
  console.log('Mode: existing (S\'Narai is the golden reference tenant)');
  console.log('───────────────────────────────────────────────────────');

  const installer = new PackInstaller();

  try {
    await installer.install(SNARAI_TENANT_ID, 'referral_trust_concierge', {
      // Tenant-specific overrides for the knowledge compilation
      knowledgeSlots: {
        // These will be deep-merged on top of the Source Pack defaults
        persona: {
          founderName: 'Marco',
          projectName: "S'Narai",
          currency: 'USD',
          minInvestment: 50,
        },
      },
    });

    console.log('');
    console.log('✅ S\'Narai provisioned successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Open installed_products in your DB client');
    console.log(`  2. Filter by project_id = ${SNARAI_TENANT_ID} and pack_id = 'referral_trust_concierge'`);
    console.log('  3. Verify the runtime_manifest contains a valid checksum');
    console.log('');
  } catch (error) {
    console.error('❌ Provisioning failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

provision();
