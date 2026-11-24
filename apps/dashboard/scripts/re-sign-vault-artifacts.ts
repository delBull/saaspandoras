/**
 * ✍️ Re-firma los artefactos existentes con la identidad de su tenant (gap 1).
 *
 * Las filas anteriores se firmaron con la llave de plataforma porque sólo había
 * una. Este script descifra el sobre (con la KEK), lo vuelve a cifrar y firmar con
 * la llave del tenant, y actualiza CID, hashes, firmante y el seguro local.
 *
 * El plaintext vive sólo en memoria: nunca se escribe en disco ni en logs.
 *
 * Uso:
 *   bun run scripts/re-sign-vault-artifacts.ts --tenant=snarai
 *   bun run scripts/re-sign-vault-artifacts.ts --tenant=snarai --apply
 */
import crypto from 'node:crypto';
import { db } from '@saasfly/db-core';
import { hermesKnowledgeRegistry, knowledgeVaultBlobs } from '@saasfly/db-core/schema';
import { and, eq, ne } from '@saasfly/db-core';
import { TenantIpfsVaultService, getSignerForTenant } from '@saasfly/hermes-core';

const apply = process.argv.includes('--apply');
function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

/** El nodo aborta si se le manda una ráfaga: reintento con pausa. */
async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: any;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || '');
      const transient = /aborted|timeout|ECONNRESET|socket hang up|502|503|504/i.test(msg);
      console.warn(`    ↻ ${label} intento ${i}/${attempts}: ${msg.slice(0, 80)}`);
      if (!transient || i === attempts) break;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw lastErr;
}

async function main() {
  const tenantId = (arg('tenant') || '').toLowerCase().trim();
  if (!tenantId) throw new Error('Falta --tenant=<slug>');

  const signerInfo = await getSignerForTenant(tenantId);
  if (signerInfo.isPlatformFallback) {
    throw new Error(`El tenant '${tenantId}' no tiene llave propia. Corre provision-tenant-signers primero.`);
  }

  const vault = new TenantIpfsVaultService();
  const rows = await db
    .select({
      id: hermesKnowledgeRegistry.id,
      artifactId: hermesKnowledgeRegistry.artifactId,
      domain: hermesKnowledgeRegistry.domain,
      classification: hermesKnowledgeRegistry.classification,
      version: hermesKnowledgeRegistry.version,
      cid: hermesKnowledgeRegistry.ipfsCid,
      ciphertextHash: hermesKnowledgeRegistry.ciphertextHash,
      signedBy: hermesKnowledgeRegistry.signedByAddress,
    })
    .from(hermesKnowledgeRegistry)
    .where(and(
      eq(hermesKnowledgeRegistry.tenantId, tenantId),
      eq(hermesKnowledgeRegistry.governanceStatus, 'ACTIVE'),
      ne(hermesKnowledgeRegistry.signedByAddress, signerInfo.address),
    ));

  console.log(`\nRe-firma ${tenantId} → ${signerInfo.address}\nartefactos a migrar: ${rows.length} · modo ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

  let done = 0;
  let failed = 0;

  for (const row of rows) {
    const ctx = {
      tenantId,
      artifactId: row.artifactId,
      version: row.version,
      classification: row.classification as any,
    };

    try {
      const verified = await withRetry(`${row.artifactId} (lectura)`, () =>
        vault.retrieveVerifiedFromIpfs(row.cid, ctx, row.ciphertextHash),
      );

      if (!apply) {
        done++;
        console.log(`  → ${row.artifactId} (${verified.plaintext.length} chars) se re-firmaría`);
        continue;
      }

      const pinned = await withRetry(`${row.artifactId} (pin)`, () =>
        vault.storeEncryptedKnowledgeToIpfs(verified.plaintext, ctx, signerInfo.signer),
      );
      const ciphertextHash = sha256(pinned.encryptedMetadata.ciphertext);
      if (!pinned.agentSignature) throw new Error('sin firma');

      await withRetry(`${row.artifactId} (verificación)`, () =>
        vault.retrieveVerifiedFromIpfs(pinned.cid, ctx, ciphertextHash),
      );
      await new Promise((r) => setTimeout(r, 800));

      await db
        .update(hermesKnowledgeRegistry)
        .set({
          ipfsCid: pinned.cid,
          ipfsUri: `ipfs://${pinned.cid}`,
          contentHash: verified.contentHash,
          ciphertextHash,
          signedByAddress: signerInfo.address,
          agentSignature: pinned.agentSignature,
          updatedAt: new Date(),
        })
        .where(eq(hermesKnowledgeRegistry.id, row.id));

      const [blob] = await db
        .select({ id: knowledgeVaultBlobs.id })
        .from(knowledgeVaultBlobs)
        .where(and(
          eq(knowledgeVaultBlobs.tenantId, tenantId),
          eq(knowledgeVaultBlobs.artifactId, row.artifactId),
        ))
        .limit(1);

      const blobValues = {
        tenantId,
        artifactId: row.artifactId,
        version: row.version,
        cid: pinned.cid,
        contentHash: verified.contentHash,
        ciphertextHash,
        envelopeJson: JSON.stringify(pinned.encryptedMetadata),
        updatedAt: new Date(),
      };

      if (blob) await db.update(knowledgeVaultBlobs).set(blobValues).where(eq(knowledgeVaultBlobs.id, blob.id));
      else await db.insert(knowledgeVaultBlobs).values({ id: crypto.randomUUID(), ...blobValues });

      done++;
      console.log(`  ✓ ${row.artifactId} → ${pinned.cid}`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${row.artifactId}: ${err?.message || err}`);
    }
  }

  console.log(`\nResumen: ${done} ${apply ? 're-firmados' : 'por re-firmar'} · ${failed} fallidos\n`);
  if (failed > 0) process.exit(2);
}

main().catch((err) => {
  console.error('Error:', err?.message || err);
  process.exit(1);
});
