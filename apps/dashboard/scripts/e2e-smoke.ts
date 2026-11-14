/**
 * E2E smoke contra infraestructura REAL (DB + Vercel Blob).
 * No toca datos de tenants reales: usa identificadores `e2e-smoke-*` y limpia todo.
 *
 * Ejecutar desde apps/dashboard:
 *   bun run scripts/e2e-smoke.ts
 */
import { db } from '@saasfly/db';
import { eq } from '@saasfly/db-core';
import {
  hermesArtifactDeliveryTokens,
  hermesArtifactEvents,
  hermesArtifactStorage,
  hermesArtifactVersions,
  tenantAuthorizationGrants,
} from '@saasfly/db/schema';
import { DrizzleArtifactRepository } from '@/lib/content/delivery/drizzle-artifact-repository';
import { ArtifactLifecycleService } from '@/lib/content/delivery/artifact-lifecycle';
import { issueDeliveryToken, authorizeDelivery } from '@/lib/content/delivery/delivery-token';
import { BlobStorageAdapter } from '@/lib/content/storage/blob-adapter';
import { DrizzleTenantGrantRepository } from '@/lib/authorization/drizzle-tenant-grant-repository';
import { buildTenantGrant, evaluateTenantCapability } from '@/lib/authorization/tenant-grant';

const ORG = 'e2e-smoke-org';
const ARTIFACT = `e2e-smoke-${Date.now()}`;
const BLOB = new BlobStorageAdapter({
  token: process.env.BLOB_CONTENT_READ_WRITE_TOKEN ?? null,
  storeId: process.env.BLOB_CONTENT_READ_WRITE_TOKEN_STORE_ID ?? null,
});
const repo = new DrizzleArtifactRepository();
const grants = new DrizzleTenantGrantRepository();
const results: string[] = [];
const ok = (label: string) => results.push(`✅ ${label}`);
const fail = (label: string, e: unknown) => {
  results.push(`❌ ${label}: ${(e as Error)?.message ?? e}`);
  throw e;
};

async function cleanup() {
  await db.delete(hermesArtifactDeliveryTokens).where(eq(hermesArtifactDeliveryTokens.artifactId, ARTIFACT));
  await db.delete(hermesArtifactEvents).where(eq(hermesArtifactEvents.artifactId, ARTIFACT));
  await db.delete(hermesArtifactStorage).where(eq(hermesArtifactStorage.artifactId, ARTIFACT));
  await db.delete(hermesArtifactVersions).where(eq(hermesArtifactVersions.artifactId, ARTIFACT));
  await db.delete(tenantAuthorizationGrants).where(eq(tenantAuthorizationGrants.canonicalOrgId, ORG));
}

async function main() {
  const now = Math.floor(Date.now() / 1000);

  // ── 1. Grants: emisión real, evaluación, revocación ────────────────────────
  const grant = buildTenantGrant({
    id: `e2e-${Date.now()}`,
    organizationId: ORG,
    subjectId: 'e2e-human',
    requestedCapabilities: ['content.asset.approve', 'Media.Image'],
    resourceScope: { kind: 'organization' },
    issuer: { subjectId: 'e2e-admin', capabilities: ['content.asset.approve', 'media.image.create'] },
    ttlSeconds: 600,
    nowSeconds: now,
  });
  await grants.create(grant);
  ok(`grant creado (capabilities canónicas: ${grant.capabilities.join(', ')})`);

  const listed = await grants.listBySubject(ORG, 'e2e-human');
  if (listed.length !== 1) fail('listBySubject', new Error(`esperado 1, got ${listed.length}`));
  ok('grant leído de Postgres');

  const allowed = evaluateTenantCapability({
    grant: listed[0]!, subjectId: 'e2e-human', organizationId: ORG,
    capability: 'media.image.create', nowSeconds: now,
  });
  if (!allowed.allowed) fail('evaluación', new Error(String(allowed.reason)));
  ok('evaluación autoriza capability canónica');

  const revoked = await grants.revoke(grant.id, now);
  if (!revoked) fail('revoke', new Error('no revocó'));
  const after = evaluateTenantCapability({
    grant: (await grants.listBySubject(ORG, 'e2e-human'))[0]!, subjectId: 'e2e-human',
    organizationId: ORG, capability: 'media.image.create', nowSeconds: now + 1,
  });
  if (after.allowed) fail('revocación', new Error('seguía autorizando'));
  ok('revocación efectiva en la siguiente evaluación');

  // ── 2. Contenido: ingesta real a Blob → aprobar → publicar ────────────────
  const service = new ArtifactLifecycleService({ repo, storage: BLOB, publishEnabled: true });
  const bytes = new TextEncoder().encode(`e2e ${ARTIFACT}`);

  const stored = await service.storeVersion({
    artifactId: ARTIFACT, tenantId: ORG, version: 1, bytes,
    contentType: 'text/plain', actor: { kind: 'api_key', id: 'e2e-key', ownerId: 'e2e-owner' },
  });
  ok(`bytes en Blob (sha256=${stored.version.sha256.slice(0, 12)}…, key=${stored.storage.storageKey})`);

  await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: { kind: 'api_key', id: 'e2e-key' } });
  ok('enviado a revisión');

  // El creador no puede aprobar
  try {
    await service.approve({ artifactId: ARTIFACT, version: 1, approver: { kind: 'human', id: 'e2e-owner' } });
    fail('aprobación del propietario', new Error('debió rechazarse'));
  } catch (e) {
    if ((e as { code?: string })?.code !== 'APPROVER_IS_CREATOR') throw e;
    ok('aprobador = propietario de la key → rechazado');
  }

  const approved = await service.approve({
    artifactId: ARTIFACT, version: 1, approver: { kind: 'human', id: 'e2e-human' }, note: 'ok',
  });
  ok(`aprobada por humano distinto (${approved.approvedById})`);

  const published = await service.publish({ artifactId: ARTIFACT, version: 1, actor: { kind: 'human', id: 'e2e-human' } });
  ok(`publicada (status=${published.status})`);

  // ── 3. Entrega: token firmado → proxy → descarga ──────────────────────────
  process.env.CONTENT_DELIVERY_TOKEN_SECRET ??= 'e2e-secret-with-at-least-32-characters-long!!';
  const { token } = await issueDeliveryToken({
    store: repo, artifactId: ARTIFACT, version: 1, tenantId: ORG,
    issuedByKind: 'api_key', issuedById: 'e2e-key', ttlSeconds: 300,
  });
  ok('token de entrega emitido');

  await authorizeDelivery({
    token, store: repo, tenantId: ORG, artifactId: ARTIFACT, version: 1,
    context: { artifactPublished: true, currentVersion: 1 },
  });
  ok('token autorizado contra estado real de Postgres');

  const storageRow = await repo.getStorage(ARTIFACT, 1);
  if (!storageRow) throw new Error('sin fila de almacenamiento');
  const object = await BLOB.read(storageRow.storageKey);
  if (!object) throw new Error('objeto no encontrado en Blob');
  const downloaded = new TextDecoder().decode(new Uint8Array(await new Response(object.stream).arrayBuffer()));
  if (downloaded !== new TextDecoder().decode(bytes)) fail('integridad', new Error('contenido distinto'));
  ok('descarga desde Blob con contenido idéntico');

  // ── 4. Borrado idempotente + reconciliación ───────────────────────────────
  const del1 = await service.delete({ artifactId: ARTIFACT, version: 1, actor: { kind: 'human', id: 'e2e-human' } });
  ok(`borrado (deleted=${del1.deleted}, physical=${del1.physicalState})`);
  const del2 = await service.delete({ artifactId: ARTIFACT, version: 1, actor: { kind: 'human', id: 'e2e-human' } });
  ok(`borrado repetido idempotente (deleted=${del2.deleted})`);

  const report = await service.reconcile({ artifactId: ARTIFACT, limit: 10 });
  ok(`reconciliación (scanned=${report.scanned}, truncated=${report.truncated}, huérfanos=${report.orphanBlobs.length})`);

  await cleanup();
  ok('limpieza completa (0 residuos en DB y Blob)');
}

try {
  await main();
  console.log(results.join('\n'));
  console.log(`\nE2E SMOKE: ${results.filter(r => r.startsWith('✅')).length} pasos OK`);
} catch (error) {
  console.log(results.join('\n'));
  console.log('ERROR:', (error as Error)?.name, '|', (error as Error)?.message);
  await cleanup().catch(() => {});
  console.log('\nE2E SMOKE: FALLÓ');
  process.exit(1);
}
process.exit(0);
