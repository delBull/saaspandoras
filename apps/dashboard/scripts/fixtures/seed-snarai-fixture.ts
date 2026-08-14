import { db } from '../src/db';
import { hermesKnowledge, hermesAddonInstallations } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

const ORG_SLUG = 'snarai';
const ORG_ID = 'snarai';

async function main() {
  console.log(`🚀 Seeding Hermes G3 Tenant config for: ${ORG_SLUG}`);

  // 1. Identity Pack
  console.log('Inserting Identity Pack...');
  await db.insert(hermesKnowledge).values([
    {
      id: crypto.randomUUID(),
      organizationId: ORG_ID,
      dimension: 'IDENTITY',
      key: 'core_persona',
      content: 'You are Hermes, the cognitive agent for S\'Narai. You guide users through the tokenized real estate investment process in Tulum, Mexico.',
      status: 'ACTIVE',
      visibility: 'INTERNAL',
      authority: 100,
      version: 1,
      source: 'SEED',
    }
  ]).onConflictDoNothing();

  // 2. Knowledge Pack
  console.log('Inserting Knowledge Pack...');
  await db.insert(hermesKnowledge).values([
    {
      id: crypto.randomUUID(),
      organizationId: ORG_ID,
      dimension: 'DOMAIN',
      key: 'project_info',
      content: 'S\'Narai is a premium tokenized real estate project in Tulum. It offers fractions of a luxury property through the blockchain. Token price is determined by the active funding phase.',
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      authority: 90,
      version: 1,
      source: 'SEED',
    }
  ]).onConflictDoNothing();

  // 3. Addons / Capabilities
  console.log('Inserting Portal Channel Addon & Core Governance...');
  await db.insert(hermesAddonInstallations).values([
    {
      id: crypto.randomUUID(),
      organizationId: ORG_ID,
      addonId: 'hermes.channel.portal',
      version: '1.0.0',
      status: 'ACTIVE',
      configuration: { enabled: true },
      manifestSnapshot: {},
      installedBy: 'system',
      approvedBy: 'system',
      installedAt: new Date(),
      activatedAt: new Date(),
    },
    {
      id: crypto.randomUUID(),
      organizationId: ORG_ID,
      addonId: 'hermes.capability.investment_guide',
      version: '1.0.0',
      status: 'ACTIVE',
      configuration: { enabled: true },
      manifestSnapshot: {},
      installedBy: 'system',
      approvedBy: 'system',
      installedAt: new Date(),
      activatedAt: new Date(),
    }
  ]).onConflictDoNothing();

  console.log('✅ Seeding complete.');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
