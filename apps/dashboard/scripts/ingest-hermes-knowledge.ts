/**
 * 🏛️ Pandora's Hermes OS — Knowledge Ingestion & IPFS Vault Ingestor CLI
 * apps/dashboard/scripts/ingest-hermes-knowledge.ts
 *
 * Usage:
 *   bun run scripts/ingest-hermes-knowledge.ts \
 *     --tenant=pandoras \
 *     --dimension=academy \
 *     --key=governance_thesis \
 *     --file=./docs/governance.md \
 *     --classification=CONFIDENTIAL \
 *     --pin-ipfs
 */

import fs from 'fs';
import path from 'path';
import { db } from '../src/db';
import { hermesKnowledge } from '../src/db/schema';
import { TenantIpfsVaultService } from '../src/lib/pandoras/core/domains/hermes/knowledge/ipfs-vault';
import { HermesIdentitySigner } from '../src/lib/pandoras/core/domains/hermes/identity/identity-signer';
import type { KnowledgeClassificationTier } from '../src/lib/pandoras/core/domains/hermes/runtime/contracts';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string, fallback: string = ''): string => {
    const found = args.find(a => a.startsWith(`--${name}=`));
    if (!found) return fallback;
    const parts = found.split('=');
    return parts[1] !== undefined ? parts[1] : fallback;
  };

  const tenantId = getArg('tenant', 'pandoras');
  const dimension = getArg('dimension', 'operational');
  const key = getArg('key', `doc_${Date.now()}`);
  const filePath = getArg('file', '');
  const text = getArg('text', '');
  const classification = (getArg('classification', 'CONFIDENTIAL').toUpperCase()) as KnowledgeClassificationTier;
  const pinIpfs = args.includes('--no-ipfs') ? false : true;

  if (!filePath && !text) {
    console.error('❌ Error: Must provide either --file=/path/to/doc.md or --text="content"');
    process.exit(1);
  }

  let content: string = text || '';
  if (filePath) {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Error: File not found at ${fullPath}`);
      process.exit(1);
    }
    content = fs.readFileSync(fullPath, 'utf8');
  }

  console.log(`\n📦 Ingesting Knowledge for Tenant [${tenantId}]...`);
  console.log(`   Key: ${key}`);
  console.log(`   Dimension: ${dimension}`);
  console.log(`   Classification: ${classification}`);
  console.log(`   Pin to IPFS: ${pinIpfs ? 'YES' : 'NO'}`);

  const vaultService = new TenantIpfsVaultService();
  const signer = new HermesIdentitySigner();

  let sourceReference = 'local://direct_upload';
  let storedContent = content;

  if (classification !== 'PUBLIC' && pinIpfs) {
    console.log(`🔐 Encrypting with Envelope Vault (AES-256-GCM + AAD) & Pinning to IPFS...`);
    const ipfsResult = await vaultService.storeEncryptedKnowledgeToIpfs(
      content,
      {
        tenantId,
        artifactId: key,
        version: 1,
        classification,
      },
      signer
    );

    storedContent = JSON.stringify(ipfsResult.encryptedMetadata);
    sourceReference = ipfsResult.ipfsUri;
    console.log(`✅ IPFS Anchor Created: ${ipfsResult.ipfsUri}`);
    console.log(`   Agent Signature: ${ipfsResult.agentSignature?.substring(0, 16)}...`);
  }

  const knowledgeId = `know_${tenantId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await (db.insert(hermesKnowledge) as any).values({
    id: knowledgeId,
    organizationId: tenantId,
    dimension,
    key,
    content: storedContent,
    status: 'ACTIVE',
    visibility: classification === 'PUBLIC' ? 'EXTERNAL' : 'INTERNAL',
    classification,
    authority: 'SYSTEM_ADMIN',
    version: 1,
    source: 'INGESTION_CLI',
    sourceReference,
    createdBy: signer.getPublicAddress(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`🎉 Knowledge Record Persisted in PostgreSQL DB:`);
  console.log(`   ID: ${knowledgeId}`);
  console.log(`   Source Reference: ${sourceReference}\n`);
}

main().catch(err => {
  console.error('❌ Ingestion Error:', err);
  process.exit(1);
});
