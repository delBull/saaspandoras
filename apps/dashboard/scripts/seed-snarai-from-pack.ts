/**
 * 🏛️ S'Narai — Siembra del knowledge desde el pack versionado (K25)
 * apps/dashboard/scripts/seed-snarai-from-pack.ts
 *
 * Fuente única: `packages/hermes-core/src/packs/snarai_knowledge_v1.1/*.md`
 * (frontmatter gobernado: organizationId, visibility, authority, status, version, sourceId).
 *
 * Por qué existe: `ingest-snarai-knowledge.ts` apuntaba a
 * `apps/dashboard/src/lib/hermes/packs/...`, una ruta que ya no existe, y escribía
 * plaintext en `hermes_knowledge`. Este script:
 *   1. cifra el cuerpo con el envelope vault (AES-256-GCM + AAD por artefacto),
 *   2. lo fija en IPFS (Pinata como primario; Kubo está sin bloques y con RPC 401),
 *   3. actualiza `hermes_knowledge_registry` con content_hash, ciphertext_hash y CID,
 *   4. NO escribe plaintext en Postgres (el runtime hidrata desde el vault),
 *   5. verifica el artefacto antes de marcarlo ACTIVE.
 *
 * Uso:
 *   bun run scripts/seed-snarai-from-pack.ts                      # dry-run (cifra y verifica en memoria)
 *   bun run scripts/seed-snarai-from-pack.ts --apply              # cifra, fija y actualiza el registro
 *   bun run scripts/seed-snarai-from-pack.ts --only=snarai-brand  # un artefacto
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from '@saasfly/db-core';
import { hermesKnowledgeRegistry, hermesKnowledge } from '@saasfly/db-core/schema';
import { and, eq } from '@saasfly/db-core';
import { TenantIpfsVaultService, KnowledgeEnvelopeVault, SecurityAuditLogger } from '@saasfly/hermes-core';

const TENANT = 'snarai';
const ACTOR = 'pack:snarai_knowledge_v1.1';

// Los 4 artefactos que estaban literalmente en `MISSING`. Se puede ampliar con --only.
const DEFAULT_TARGETS = ['snarai-brand', 'snarai-market', 'snarai-projects', 'snarai-operations'];

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
const apply = process.argv.includes('--apply');
const only = arg('only');
const targets = only ? [only] : DEFAULT_TARGETS;

function resolvePackDir(): string {
  const candidates = [
    path.resolve(process.cwd(), '../../packages/hermes-core/src/packs/snarai_knowledge_v1.1'),
    path.resolve(process.cwd(), 'packages/hermes-core/src/packs/snarai_knowledge_v1.1'),
    path.resolve(__dirname, '../../../packages/hermes-core/src/packs/snarai_knowledge_v1.1'),
  ];
  for (const dir of candidates) if (fs.existsSync(dir)) return dir;
  throw new Error(`No se encontró el pack de S'Narai. Probé:\n${candidates.join('\n')}`);
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw.trim() };
  const meta: Record<string, string> = {};
  for (const line of (match[1] || '').split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: (match[2] || '').trim() };
}

/** visibility del pack → classification del registro (lattice canónico). */
function classificationFor(visibility?: string): 'PUBLIC' | 'TENANT_RESTRICTED' | 'CONFIDENTIAL' {
  switch ((visibility || 'PUBLIC').toUpperCase()) {
    case 'INTERNAL':
      return 'TENANT_RESTRICTED';
    case 'RESTRICTED':
      return 'CONFIDENTIAL';
    default:
      return 'PUBLIC';
  }
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

/**
 * La key del nodo vive en el `.env.local` de la RAÍZ del monorepo (no en
 * apps/dashboard). Bun sólo carga el `.env` del cwd, así que la resolvemos aquí
 * para que el script corra sin exportar variables a mano. En producción las
 * variables llegan por entorno y este bloque no hace nada.
 */
function loadKuboEnvFromRoot(): void {
  if (process.env.PANDORAS_KUBO_RPC_URL && process.env.PANDORAS_KUBO_API_KEY) return;
  const candidates = [
    path.resolve(process.cwd(), '../../.env.local'),
    path.resolve(process.cwd(), '.env.local'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^(PANDORAS_KUBO_[A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]!]) {
        process.env[match[1]!] = (match[2] || '').replace(/^["']|["']$/g, '').trim();
      }
    }
  }
  // El RPC/gateway públicos no siempre están en .env.local; se fijan por defecto.
  if (!process.env.PANDORAS_KUBO_RPC_URL) process.env.PANDORAS_KUBO_RPC_URL = 'https://rpc.ipfs.pandoras.finance';
  if (!process.env.PANDORAS_KUBO_GATEWAY_URL) process.env.PANDORAS_KUBO_GATEWAY_URL = 'https://ipfs.pandoras.finance/ipfs';
}

async function main() {
  loadKuboEnvFromRoot();
  const dir = resolvePackDir();

  // El nodo propio (Kubo) es el primario; Pinata queda como espejo/fallback.
  // `--via=pinata` fuerza el espejo (útil si el nodo está caído).
  const via = (arg('via') || '').toUpperCase();
  const kuboConfigured = Boolean(process.env.PANDORAS_KUBO_RPC_URL && process.env.PANDORAS_KUBO_API_KEY);
  const primaryProvider = (via === 'PINATA' ? 'PINATA' : via === 'KUBO' ? 'KUBO' : kuboConfigured ? 'KUBO' : 'PINATA') as
    | 'KUBO'
    | 'PINATA';
  if (primaryProvider === 'KUBO' && !kuboConfigured) {
    throw new Error(
      'Kubo seleccionado como primario pero falta PANDORAS_KUBO_RPC_URL o PANDORAS_KUBO_API_KEY. ' +
      'La key vive en .env.local de la raíz del repo.',
    );
  }

  const vault = new TenantIpfsVaultService({ primaryProvider });
  const envelopeVault = new KnowledgeEnvelopeVault();

  console.log(
    `\nS'Narai · siembra desde pack\norigen: ${dir}\nprimario: ${primaryProvider} · modo: ${apply ? 'APPLY' : 'DRY-RUN'}\nartefactos: ${targets.join(', ')}\n`,
  );

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const { meta, body } = parseFrontmatter(fs.readFileSync(path.join(dir, file), 'utf8'));
    const sourceId = meta.sourceId;
    if (!sourceId || !targets.includes(sourceId)) continue;

    const dimension = file.replace(/^\d+_/, '').replace(/\.md$/, '');
    const classification = classificationFor(meta.visibility);
    const version = Number(meta.version || 1);
    const contentHash = sha256(body);

    const [existing] = await db
      .select()
      .from(hermesKnowledgeRegistry)
      .where(and(eq(hermesKnowledgeRegistry.tenantId, TENANT), eq(hermesKnowledgeRegistry.artifactId, sourceId)))
      .limit(1);

    if (existing && existing.contentHash === contentHash && existing.governanceStatus === 'ACTIVE') {
      skipped++;
      console.log(`= ${sourceId}: sin cambios (hash ${contentHash.slice(0, 10)}…)`);
      continue;
    }

    try {
      const ctx = { tenantId: TENANT, artifactId: sourceId, version, classification } as const;
      const envelope = await envelopeVault.encryptArtifact(body, ctx as any);
      const ciphertextHash = sha256(envelope.ciphertext);

      if (!apply) {
        // Verificación criptográfica sin red: el sobre debe descifrar y cuadrar.
        const check = await vault.verifyAndDecryptEnvelope(envelope, ctx as any, ciphertextHash);
        if (check.plaintext !== body) throw new Error('roundtrip distinto');
        processed++;
        console.log(`✓ ${sourceId} [${classification}] ${body.length} chars → listo para fijar (dry-run)`);
        continue;
      }

      const cid = await vault.pinJsonToIpfs(envelope, `snarai-${sourceId}-v${version}.json`);
      if (!/^baf[a-z0-9]{50,}$|^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid)) {
        throw new Error(`CID inválido o simulado (${cid}). El proveedor no fijó el contenido de verdad.`);
      }

      // Verificación real contra lo fijado: si no descifra e íntegro, no se promueve.
      await vault.retrieveVerifiedFromIpfs(cid, ctx as any, ciphertextHash);

      const values = {
        tenantId: TENANT,
        domain: dimension,
        artifactId: sourceId,
        classification,
        version,
        contentHash,
        ciphertextHash,
        ipfsCid: cid,
        ipfsUri: `ipfs://${cid}`,
        governanceStatus: 'ACTIVE' as const,
        updatedAt: new Date(),
      };

      if (existing) {
        await db.update(hermesKnowledgeRegistry).set(values).where(eq(hermesKnowledgeRegistry.id, existing.id));
      } else {
        await db.insert(hermesKnowledgeRegistry).values({ id: crypto.randomUUID(), ...values });
      }

      // La fila de conocimiento queda sin plaintext: el runtime hidrata del vault.
      const [knowledgeRow] = await db
        .select({ id: hermesKnowledge.id })
        .from(hermesKnowledge)
        .where(and(eq(hermesKnowledge.organizationId, TENANT), eq(hermesKnowledge.key, sourceId)))
        .limit(1);

      if (knowledgeRow) {
        await db
          .update(hermesKnowledge)
          .set({ content: null, version, updatedAt: new Date(), sourceReference: `pack:${file}` })
          .where(eq(hermesKnowledge.id, knowledgeRow.id));
      } else {
        await db.insert(hermesKnowledge).values({
          id: crypto.randomUUID(),
          organizationId: TENANT,
          dimension,
          key: sourceId,
          content: null,
          status: 'ACTIVE',
          visibility: (meta.visibility || 'PUBLIC').toUpperCase() === 'INTERNAL' ? 'INTERNAL' : 'PUBLIC',
          classification,
          authority: meta.authority || 'VERIFIED',
          version,
          source: 'PACK',
          sourceReference: `pack:${file}`,
          createdBy: ACTOR,
        });
      }

      await SecurityAuditLogger.logEvent({
        organizationId: TENANT,
        actorId: ACTOR,
        eventType: 'KNOWLEDGE_PROMOTED',
        severity: 'INFO',
        policyDecision: 'ALLOW',
        correlationId: `pack_seed_${sourceId}_${Date.now()}`,
        artifactId: sourceId,
        classification: classification as any,
        metadata: { source: 'PACK', file, cid, contentHash, ciphertextHash, version },
      });

      processed++;
      console.log(`✓ ${sourceId} [${classification}] ${body.length} chars → ${cid}`);
    } catch (err: any) {
      failed++;
      console.error(`✗ ${sourceId}: ${err?.message || err}`);
    }
  }

  console.log(`\nResumen: ${processed} procesados · ${skipped} sin cambios · ${failed} fallidos${apply ? '' : ' (dry-run, nada escrito)'}\n`);
  if (failed > 0) process.exit(2);
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
