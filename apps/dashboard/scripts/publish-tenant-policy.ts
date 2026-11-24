/**
 * 🗣️ Publica reglas de comportamiento del tenant como POLÍTICA.
 *
 * `tone_of_voice`, `escalation_rules` y similares no son hechos: son reglas de
 * cómo debe hablar y cuándo escalar Hermes. Si se quedan como conocimiento
 * CONFIDENTIAL del vault, nunca llegan a WhatsApp (el techo ejecutivo del canal
 * es INTERNAL_OPERATIONAL) y Hermes atiende sin ellas.
 *
 * Este script toma el texto del sobre cifrado (seguro local, sin red) y crea una
 * fila `hermes_knowledge` con `dimension='policy'`, que el ContextAdapter inyecta
 * como restricciones de sistema. El artefacto original del vault NO se toca: sigue
 * siendo el registro sellado.
 *
 * Uso:
 *   bun run scripts/publish-tenant-policy.ts --tenant=snarai --artifacts=tone_of_voice,escalation_rules
 *   bun run scripts/publish-tenant-policy.ts --tenant=snarai --artifacts=tone_of_voice --apply
 */
import crypto from 'node:crypto';
import { db } from '@saasfly/db-core';
import { hermesKnowledge, knowledgeVaultBlobs } from '@saasfly/db-core/schema';
import { and, eq, inArray } from '@saasfly/db-core';
import { TenantIpfsVaultService } from '@saasfly/hermes-core';

const apply = process.argv.includes('--apply');
function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const tenantId = (arg('tenant') || '').toLowerCase().trim();
  const artifacts = (arg('artifacts') || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (!tenantId || artifacts.length === 0) {
    throw new Error('Uso: --tenant=<slug> --artifacts=a,b [--apply]');
  }

  const vault = new TenantIpfsVaultService();
  const blobs = await db
    .select()
    .from(knowledgeVaultBlobs)
    .where(and(eq(knowledgeVaultBlobs.tenantId, tenantId), inArray(knowledgeVaultBlobs.artifactId, artifacts)));

  console.log(`\nPolítica del tenant · ${tenantId} · ${blobs.length}/${artifacts.length} artefactos · modo ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

  for (const blob of blobs) {
    const envelope = JSON.parse(blob.envelopeJson);
    const { plaintext } = await vault.verifyAndDecryptEnvelope(
      envelope,
      { tenantId, artifactId: blob.artifactId, version: blob.version, classification: envelope.classification } as any,
      blob.ciphertextHash,
    );

    // Guarda: un "plaintext" que en realidad es otro sobre cifrado es contenido
    // corrupto (doble cifrado de una migración). Nunca debe llegar al prompt.
    const looksLikeEnvelope = plaintext.trimStart().startsWith('{"artifactId"') && plaintext.includes('"ciphertext"');
    if (looksLikeEnvelope) {
      console.warn(`  ✗ ${blob.artifactId}: el contenido es un sobre cifrado (corrupto). Se omite.`);
      continue;
    }

    const key = `${tenantId}_policy_${blob.artifactId}`;
    const [existing] = await db
      .select({ id: hermesKnowledge.id })
      .from(hermesKnowledge)
      .where(and(
        eq(hermesKnowledge.organizationId, tenantId),
        eq(hermesKnowledge.key, key),
      ))
      .limit(1);

    const values = {
      organizationId: tenantId,
      dimension: 'policy',
      key,
      content: plaintext,
      status: 'ACTIVE' as const,
      visibility: 'INTERNAL_OPERATIONAL' as const,
      classification: 'INTERNAL_OPERATIONAL' as const,
      authority: 'VERIFIED' as const,
      version: 1,
      source: 'POLICY',
      sourceReference: `vault:${blob.artifactId}@${blob.cid}`,
      createdBy: 'script:publish-tenant-policy',
      updatedAt: new Date(),
    };

    if (!apply) {
      console.log(`  → ${blob.artifactId} (${plaintext.length} chars) se publicaría como ${key}`);
      continue;
    }

    if (existing) {
      await db.update(hermesKnowledge).set(values).where(eq(hermesKnowledge.id, existing.id));
      console.log(`  ✓ ${blob.artifactId} actualizado como política (${plaintext.length} chars)`);
    } else {
      await db.insert(hermesKnowledge).values({ id: crypto.randomUUID(), ...values });
      console.log(`  ✓ ${blob.artifactId} publicado como política (${plaintext.length} chars)`);
    }
  }

  console.log('');
}

main().catch((err) => {
  console.error('Error:', err?.message || err);
  process.exit(1);
});
