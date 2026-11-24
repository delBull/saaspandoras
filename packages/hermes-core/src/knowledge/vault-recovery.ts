import crypto from 'crypto';
/**
 * 🛟 Seguro del vault (gap 4)
 *
 * El nodo IPFS puede reiniciar sin volumen, hacer GC o fallar: los pines se
 * pierden. Este servicio verifica cada artefacto ACTIVE y, si falta, lo vuelve a
 * fijar **desde el sobre cifrado guardado en Postgres** (mismos bytes ⇒ mismo CID),
 * sin depender de Pinata ni de la red.
 *
 * Si no hay sobre local, intenta el espejo externo y, al recuperarlo, guarda el
 * sobre para no volver a depender de la red.
 */
import { db } from '@saasfly/db-core';
import { hermesKnowledgeRegistry, knowledgeVaultBlobs } from '@saasfly/db-core/schema';
import { and, eq } from '@saasfly/db-core';
import { TenantIpfsVaultService } from './ipfs-vault';

export interface VaultRecoveryResult {
  total: number;
  alreadyPinned: number;
  repinned: number;
  repairedFromMirror: number;
  failed: number;
  details: Array<{ artifactId: string; tenantId: string; action: string; cid?: string; reason?: string }>;
}

const MIRROR_GATEWAY = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs').replace(/\/$/, '');

async function isPinned(cid: string): Promise<boolean> {
  try {
    const rpc = (process.env.PANDORAS_KUBO_RPC_URL || '').replace(/\/$/, '');
    const key = process.env.PANDORAS_KUBO_API_KEY;
    if (!rpc || !key) return false;
    const res = await fetch(`${rpc}/api/v0/pin/ls?arg=${encodeURIComponent(cid)}&type=all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { Keys?: Record<string, unknown> };
    return Boolean(json.Keys && Object.keys(json.Keys).includes(cid));
  } catch {
    return false;
  }
}

async function fetchFromMirror(cid: string): Promise<string | null> {
  try {
    const res = await fetch(`${MIRROR_GATEWAY}/${cid}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function verifyAndRepinVault(options?: {
  tenantId?: string;
  limit?: number;
  dryRun?: boolean;
}): Promise<VaultRecoveryResult> {
  const vault = new TenantIpfsVaultService();
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 200));
  const dryRun = options?.dryRun === true;

  const where = options?.tenantId
    ? and(eq(hermesKnowledgeRegistry.governanceStatus, 'ACTIVE'), eq(hermesKnowledgeRegistry.tenantId, options.tenantId))
    : eq(hermesKnowledgeRegistry.governanceStatus, 'ACTIVE');

  const rows = await db
    .select({
      id: hermesKnowledgeRegistry.id,
      tenantId: hermesKnowledgeRegistry.tenantId,
      artifactId: hermesKnowledgeRegistry.artifactId,
      version: hermesKnowledgeRegistry.version,
      cid: hermesKnowledgeRegistry.ipfsCid,
    })
    .from(hermesKnowledgeRegistry)
    .where(where)
    .limit(limit);

  const result: VaultRecoveryResult = {
    total: rows.length,
    alreadyPinned: 0,
    repinned: 0,
    repairedFromMirror: 0,
    failed: 0,
    details: [],
  };

  for (const row of rows) {
    try {
      if (await isPinned(row.cid)) {
        result.alreadyPinned++;
        continue;
      }

      // 1. Sobre cifrado local (no requiere red).
      const [blob] = await db
        .select({ envelopeJson: knowledgeVaultBlobs.envelopeJson })
        .from(knowledgeVaultBlobs)
        .where(and(
          eq(knowledgeVaultBlobs.tenantId, row.tenantId),
          eq(knowledgeVaultBlobs.artifactId, row.artifactId),
        ))
        .limit(1);

      let envelopeJson: string | null = blob?.envelopeJson ?? null;
      let source = 'local-blob';

      // 2. Espejo externo.
      if (!envelopeJson) {
        envelopeJson = await fetchFromMirror(row.cid);
        source = 'mirror';
        if (envelopeJson && !dryRun) {
          await db.insert(knowledgeVaultBlobs).values({
            id: crypto.randomUUID(),
            tenantId: row.tenantId,
            artifactId: row.artifactId,
            version: row.version,
            cid: row.cid,
            contentHash: 'unknown',
            ciphertextHash: 'unknown',
            envelopeJson,
          }).onConflictDoNothing();
        }
      }

      if (!envelopeJson) {
        result.failed++;
        result.details.push({ tenantId: row.tenantId, artifactId: row.artifactId, action: 'missing', cid: row.cid, reason: 'sin sobre local ni espejo' });
        continue;
      }

      if (dryRun) {
        result.repinned++;
        result.details.push({ tenantId: row.tenantId, artifactId: row.artifactId, action: `would-repin-from-${source}`, cid: row.cid });
        continue;
      }

      const envelope = JSON.parse(envelopeJson);
      const newCid = await vault.pinJsonToIpfs(envelope, `${row.artifactId}-v${row.version}.json`);

      if (newCid !== row.cid) {
        result.failed++;
        result.details.push({
          tenantId: row.tenantId,
          artifactId: row.artifactId,
          action: 'cid-mismatch',
          cid: newCid,
          reason: `esperado ${row.cid}`,
        });
        continue;
      }

      result.repinned++;
      if (source === 'mirror') result.repairedFromMirror++;
      result.details.push({ tenantId: row.tenantId, artifactId: row.artifactId, action: `repinned-from-${source}`, cid: newCid });
    } catch (err: any) {
      result.failed++;
      result.details.push({ tenantId: row.tenantId, artifactId: row.artifactId, action: 'error', cid: row.cid, reason: err?.message || 'error' });
    }
  }

  return result;
}
