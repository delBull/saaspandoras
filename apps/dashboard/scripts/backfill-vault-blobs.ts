/**
 * 🛟 Rellena el seguro del vault (gap 4).
 *
 * Para cada artefacto ACTIVE sin sobre guardado en `knowledge_vault_blobs`,
 * descarga el sobre (del nodo o del espejo) y lo guarda en Postgres. Con eso, un
 * reinicio del nodo sin volumen deja de ser un riesgo: se re-fija sin red.
 *
 * Uso:
 *   bun run scripts/backfill-vault-blobs.ts            # reporta qué falta
 *   bun run scripts/backfill-vault-blobs.ts --apply    # guarda los sobres
 */
import crypto from 'node:crypto';
import { db } from '@saasfly/db-core';
import { hermesKnowledgeRegistry, knowledgeVaultBlobs } from '@saasfly/db-core/schema';
import { and, eq } from '@saasfly/db-core';
import { TenantIpfsVaultService } from '@saasfly/hermes-core';

const apply = process.argv.includes('--apply');

async function main() {
  const vault = new TenantIpfsVaultService();
  const rows = await db
    .select({
      tenantId: hermesKnowledgeRegistry.tenantId,
      artifactId: hermesKnowledgeRegistry.artifactId,
      version: hermesKnowledgeRegistry.version,
      cid: hermesKnowledgeRegistry.ipfsCid,
    })
    .from(hermesKnowledgeRegistry)
    .where(eq(hermesKnowledgeRegistry.governanceStatus, 'ACTIVE'));

  console.log(`\nSeguro del vault · ${rows.length} artefactos ACTIVE · modo ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

  let stored = 0;
  let exists = 0;
  let failed = 0;

  for (const row of rows) {
    const [blob] = await db
      .select({ id: knowledgeVaultBlobs.id })
      .from(knowledgeVaultBlobs)
      .where(and(
        eq(knowledgeVaultBlobs.tenantId, row.tenantId),
        eq(knowledgeVaultBlobs.artifactId, row.artifactId),
      ))
      .limit(1);

    if (blob) {
      exists++;
      continue;
    }

    try {
      // El nodo ya tiene los bloques pinneados; se lee de ahí (sin depender de Pinata).
      const envelope = await vault.ipfsOrchestrator.fetchJson<any>(row.cid);
      const envelopeJson = JSON.stringify(envelope);
      const contentHash = String(envelope?.contentHash || 'unknown');
      const ciphertextHash = envelope?.ciphertext
        ? crypto.createHash('sha256').update(String(envelope.ciphertext), 'utf8').digest('hex')
        : 'unknown';

      if (!apply) {
        stored++;
        console.log(`  + ${row.tenantId}/${row.artifactId} → se guardaría (${envelopeJson.length} chars)`);
        continue;
      }

      await db.insert(knowledgeVaultBlobs).values({
        id: crypto.randomUUID(),
        tenantId: row.tenantId,
        artifactId: row.artifactId,
        version: row.version,
        cid: row.cid,
        contentHash,
        ciphertextHash,
        envelopeJson,
      }).onConflictDoNothing();

      stored++;
      console.log(`  ✓ ${row.tenantId}/${row.artifactId} (${envelopeJson.length} chars)`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${row.tenantId}/${row.artifactId}: ${err?.message || err}`);
    }
  }

  console.log(`\nResumen: ${stored} ${apply ? 'guardados' : 'por guardar'} · ${exists} ya tenían · ${failed} fallidos\n`);
  if (failed > 0) process.exit(2);
}

main().catch((err) => {
  console.error('Error:', err?.message || err);
  process.exit(1);
});
