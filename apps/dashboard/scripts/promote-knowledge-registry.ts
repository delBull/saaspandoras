/**
 * 🏛️ K25-A — Promoción gobernada del registro de conocimiento (SHADOW_VERIFIED → ACTIVE)
 * apps/dashboard/scripts/promote-knowledge-registry.ts
 *
 * El runtime sólo hidrata artefactos con `governance_status = 'ACTIVE'`
 * (`context-merger.ts`). No existía ningún camino implementado a ese estado: el
 * registro quedó en SHADOW_VERIFIED y por eso Hermes no leía el vault.
 *
 * Este script es ese camino, y es deliberadamente estricto:
 *   1. Verifica el artefacto de verdad (fetch + descifrado + hashes) ANTES de promover.
 *   2. Si la verificación falla, NO promueve (fail-closed).
 *   3. Deja evento de auditoría con actor, CID y hashes.
 *   4. Permite revertir (`--demote`) sin tocar el contenido.
 *
 * Uso:
 *   bun run scripts/promote-knowledge-registry.ts --tenant=pandoras --artifacts=security_whitepaper,editorial_constitution --actor=marco_founder --dry-run
 *   bun run scripts/promote-knowledge-registry.ts --tenant=pandoras --all --actor=marco_founder --apply
 *   bun run scripts/promote-knowledge-registry.ts --tenant=pandoras --artifacts=security_whitepaper --actor=marco_founder --apply --demote
 */

import { db } from '@saasfly/db-core';
import { hermesKnowledgeRegistry } from '@saasfly/db-core/schema';
import { and, eq, inArray } from '@saasfly/db-core';
import { TenantIpfsVaultService } from '@saasfly/hermes-core';
import { SecurityAuditLogger } from '@saasfly/hermes-core';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const tenantId = arg('tenant');
const actor = arg('actor');
const apply = flag('apply');
const demote = flag('demote');
const all = flag('all');
const artifactsArg = arg('artifacts');
const artifacts = artifactsArg ? artifactsArg.split(',').map((s) => s.trim()).filter(Boolean) : [];

function usage(): never {
  console.error(
    [
      'Uso:',
      '  bun run scripts/promote-knowledge-registry.ts --tenant=<id> (--artifacts=a,b | --all) --actor=<identidad> [--apply] [--demote]',
      '',
      'Sin --apply sólo verifica y reporta (dry-run).',
    ].join('\n'),
  );
  process.exit(1);
}

async function main() {
  if (!tenantId || !actor) usage();
  if (!all && artifacts.length === 0) usage();

  const where = all
    ? eq(hermesKnowledgeRegistry.tenantId, tenantId)
    : and(
        eq(hermesKnowledgeRegistry.tenantId, tenantId),
        inArray(hermesKnowledgeRegistry.artifactId, artifacts),
      );

  const rows = await db.select().from(hermesKnowledgeRegistry).where(where);
  if (rows.length === 0) {
    console.error(`No hay artefactos para tenant='${tenantId}' con esos filtros.`);
    process.exit(1);
  }

  console.log(
    `\n${demote ? 'DEMOTE' : 'PROMOTE'} · tenant=${tenantId} · actor=${actor} · modo=${apply ? 'APPLY' : 'DRY-RUN'}\n`,
  );

  const vault = new TenantIpfsVaultService();
  let ok = 0;
  let failed = 0;

  for (const row of rows) {
    const target = demote ? 'SHADOW_VERIFIED' : 'ACTIVE';
    const label = `${row.artifactId} [${row.classification}]`;

    if (row.governanceStatus === target) {
      console.log(`= ${label}: ya está en ${target}`);
      continue;
    }

    if (!demote) {
      try {
        // Verificación real: no se promueve nada que no descifre e íntegro.
        await vault.retrieveVerifiedFromIpfs(
          row.ipfsCid,
          {
            tenantId: row.tenantId,
            artifactId: row.artifactId,
            version: row.version,
            classification: (row.classification || 'PUBLIC') as any,
          },
          row.ciphertextHash,
        );
      } catch (err: any) {
        failed++;
        console.error(`✗ ${label}: VERIFICACIÓN FALLIDA → no se promueve. ${err?.message}`);
        continue;
      }
    }

    if (!apply) {
      ok++;
      console.log(`✓ ${label}: verificado (${row.governanceStatus} → ${target}) [dry-run]`);
      continue;
    }

    await db
      .update(hermesKnowledgeRegistry)
      .set({ governanceStatus: target, updatedAt: new Date() })
      .where(eq(hermesKnowledgeRegistry.id, row.id));

    await SecurityAuditLogger.logEvent({
      organizationId: row.tenantId,
      actorId: actor,
      eventType: demote ? 'KNOWLEDGE_DEMOTED' : 'KNOWLEDGE_PROMOTED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: `registry_${demote ? 'demote' : 'promote'}_${row.id}`,
      artifactId: row.artifactId,
      classification: row.classification as any,
      metadata: {
        from: row.governanceStatus,
        to: target,
        cid: row.ipfsCid,
        ciphertextHash: row.ciphertextHash,
        verified: !demote,
      },
    });

    ok++;
    console.log(`✓ ${label}: ${row.governanceStatus} → ${target}`);
  }

  console.log(`\nResumen: ${ok} procesados · ${failed} rechazados por verificación.\n`);
  if (failed > 0) process.exit(2);
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
