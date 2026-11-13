/**
 * 🧪 TESTS: ciclo de vida de artefactos (P0.3)
 *
 * Prueban comportamiento real del dominio: compensación, aprobación por identidad
 * distinta, concurrencia, reemplazo, borrado reconciliable y fail-closed.
 * No tocan base de datos ni proveedores reales.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ArtifactLifecycleError, ArtifactLifecycleService, type Actor } from '../artifact-lifecycle';
import { InMemoryArtifactRepository } from '../memory-repository';
import { InMemoryStorageAdapter } from '../../storage/memory-adapter';
import { StorageNotConfiguredError, type StorageAdapter } from '../../storage/types';

const TENANT = 'celeste';
const ARTIFACT = 'art_001';

const apiKeyActor: Actor = { kind: 'api_key', id: 'key_123', ownerId: 'human_owner_1' };
const humanCreator: Actor = { kind: 'human', id: 'human_creator' };
const humanApprover: Actor = { kind: 'human', id: 'human_approver' };
const humanEditor: Actor = { kind: 'human', id: 'human_editor' };

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe('ArtifactLifecycleService (P0.3)', () => {
  let repo: InMemoryArtifactRepository;
  let storage: InMemoryStorageAdapter;
  let service: ArtifactLifecycleService;

  beforeEach(() => {
    repo = new InMemoryArtifactRepository();
    storage = new InMemoryStorageAdapter();
    service = new ArtifactLifecycleService({ repo, storage, publishEnabled: true });
  });

  async function storeDraft(version = 1, actor: Actor = humanCreator) {
    return service.storeVersion({
      artifactId: ARTIFACT,
      tenantId: TENANT,
      version,
      bytes: bytes(`contenido-${version}`),
      contentType: 'image/png',
      actor,
    });
  }

  it('MD-01: almacenar crea estado de negocio `draft`, estado físico `stored` y evento', async () => {
    const result = await storeDraft();

    expect(result.version.status).toBe('draft');
    expect(result.storage.physicalState).toBe('stored');
    expect(result.storage.provider).toBe('blob');
    expect(result.version.sha256).toHaveLength(64);
    expect(storage.has(result.storage.storageKey)).toBe(true);

    const events = await repo.listEvents(ARTIFACT);
    expect(events.map((e) => e.type)).toEqual(['stored']);
    expect(events[0]!.newState).toBe('draft');
  });

  it('MD-02: sin almacenamiento configurado devuelve UNSTORED explícito (sin URL ni CID inventados)', async () => {
    const failing = new InMemoryStorageAdapter();
    failing.failNext('put', new StorageNotConfiguredError('sin token'));

    const svc = new ArtifactLifecycleService({ repo, storage: failing });

    await expect(
      svc.storeVersion({
        artifactId: ARTIFACT,
        tenantId: TENANT,
        version: 1,
        bytes: bytes('x'),
        contentType: 'image/png',
        actor: humanCreator,
      }),
    ).rejects.toMatchObject({ code: 'UNSTORED' });

    expect(await repo.listVersions(ARTIFACT)).toHaveLength(0);
    expect(await repo.listEvents(ARTIFACT)).toHaveLength(0);
  });

  it('MD-03: el creador no puede aprobar su propio contenido', async () => {
    await storeDraft();
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: humanCreator });

    await expect(
      service.approve({ artifactId: ARTIFACT, version: 1, approver: humanCreator }),
    ).rejects.toMatchObject({ code: 'APPROVER_IS_CREATOR' });

    expect((await repo.getVersion(ARTIFACT, 1))?.status).toBe('in_review');
  });

  it('MD-04: una identidad distinta aprueba y el evento registra actor, estados y nota', async () => {
    await storeDraft();
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: humanCreator });

    const approved = await service.approve({
      artifactId: ARTIFACT,
      version: 1,
      approver: humanApprover,
      note: 'revisado',
    });

    expect(approved.status).toBe('approved');
    expect(approved.approvedByKind).toBe('human');
    expect(approved.approvedById).toBe('human_approver');
    expect(approved.approvedAt).not.toBeNull();

    const event = (await repo.listEvents(ARTIFACT)).find((e) => e.type === 'approved');
    expect(event).toMatchObject({
      actorKind: 'human',
      actorId: 'human_approver',
      previousState: 'in_review',
      newState: 'approved',
      reason: 'revisado',
    });
  });

  it('MD-06/MD-20: el último editor humano tampoco puede aprobar', async () => {
    await storeDraft(1, humanCreator);
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: humanEditor });

    await expect(
      service.approve({ artifactId: ARTIFACT, version: 1, approver: humanEditor }),
    ).rejects.toMatchObject({ code: 'APPROVER_IS_LAST_EDITOR' });
  });

  it('MD-03b: una API key no puede aprobar (ni su propio contenido)', async () => {
    await storeDraft(1, apiKeyActor);
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: apiKeyActor });

    await expect(
      service.approve({
        artifactId: ARTIFACT,
        version: 1,
        approver: { kind: 'api_key', id: 'key_123', ownerId: 'human_owner_1' },
      }),
    ).rejects.toMatchObject({ code: 'MACHINE_CANNOT_APPROVE' });
  });

  it('MD-03c: el propietario de la API key que creó tampoco aprueba', async () => {
    await storeDraft(1, apiKeyActor);
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: apiKeyActor });

    await expect(
      service.approve({
        artifactId: ARTIFACT,
        version: 1,
        approver: { kind: 'human', id: 'human_owner_1' },
      }),
    ).rejects.toMatchObject({ code: 'APPROVER_IS_CREATOR' });
  });

  it('MD-03d: si el dueño de la máquina creadora no se resuelve, no hay aprobación', async () => {
    await storeDraft(1, { kind: 'api_key', id: 'key_orphan', ownerId: null });
    await service.submitForReview({
      artifactId: ARTIFACT,
      version: 1,
      actor: { kind: 'api_key', id: 'key_orphan', ownerId: null },
    });

    await expect(
      service.approve({ artifactId: ARTIFACT, version: 1, approver: humanApprover }),
    ).rejects.toMatchObject({ code: 'UNRESOLVED_OWNER' });
  });

  it('MD-21: dos aprobaciones concurrentes: solo una gana y la otra falla con conflicto', async () => {
    await storeDraft();
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: humanCreator });

    const first = service.approve({ artifactId: ARTIFACT, version: 1, approver: humanApprover });
    const second = service.approve({
      artifactId: ARTIFACT,
      version: 1,
      approver: { kind: 'human', id: 'human_approver_2' },
    });

    const results = await Promise.allSettled([first, second]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ArtifactLifecycleError);
    expect((rejected[0] as PromiseRejectedResult).reason.code).toBe('CONFLICT');

    const approvedEvents = (await repo.listEvents(ARTIFACT)).filter((e) => e.type === 'approved');
    expect(approvedEvents).toHaveLength(1);
  });

  it('MD-05b/MD-16: rechazar exige motivo y registra el estado', async () => {
    await storeDraft();
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: humanCreator });

    await expect(
      service.reject({ artifactId: ARTIFACT, version: 1, approver: humanApprover, reason: '   ' }),
    ).rejects.toMatchObject({ code: 'REASON_REQUIRED' });

    const rejected = await service.reject({
      artifactId: ARTIFACT,
      version: 1,
      approver: humanApprover,
      reason: 'marca incorrecta',
    });
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectedReason).toBe('marca incorrecta');
  });

  it('MD-07: publicar una nueva versión reemplaza la anterior sin sobrescribirla', async () => {
    await storeDraft(1);
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: humanCreator });
    await service.approve({ artifactId: ARTIFACT, version: 1, approver: humanApprover });
    await service.publish({ artifactId: ARTIFACT, version: 1, actor: humanApprover });

    await storeDraft(2);
    await service.submitForReview({ artifactId: ARTIFACT, version: 2, actor: humanCreator });
    await service.approve({ artifactId: ARTIFACT, version: 2, approver: humanApprover });

    const revoked: number[] = [];
    await service.publish({
      artifactId: ARTIFACT,
      version: 2,
      actor: humanApprover,
      onPreviousVersionReplaced: async (previous) => {
        revoked.push(previous);
      },
    });

    expect((await repo.getVersion(ARTIFACT, 1))?.status).toBe('replaced');
    expect((await repo.getVersion(ARTIFACT, 1))?.replacedByVersion).toBe(2);
    expect((await repo.getVersion(ARTIFACT, 2))?.status).toBe('published');
    expect(revoked).toEqual([1]);
    // La versión 1 conserva su propio objeto físico: no se sobrescribió.
    expect(await repo.getStorage(ARTIFACT, 1)).not.toBeNull();
  });

  it('MD-18b: publicar sin almacenamiento `stored` falla', async () => {
    await storeDraft();
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: humanCreator });
    await service.approve({ artifactId: ARTIFACT, version: 1, approver: humanApprover });
    await repo.setPhysicalState(ARTIFACT, 1, 'missing', 'objeto ausente');

    await expect(
      service.publish({ artifactId: ARTIFACT, version: 1, actor: humanApprover }),
    ).rejects.toMatchObject({ code: 'STORAGE_NOT_READY' });
  });

  it('MD-04b: la publicación está deshabilitada por defecto (fail-closed)', async () => {
    const gated = new ArtifactLifecycleService({ repo, storage });
    await storeDraft();
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: humanCreator });
    await service.approve({ artifactId: ARTIFACT, version: 1, approver: humanApprover });

    await expect(
      gated.publish({ artifactId: ARTIFACT, version: 1, actor: humanApprover }),
    ).rejects.toMatchObject({ code: 'PUBLISH_DISABLED' });
  });

  it('MD-11: si la persistencia falla después de subir, el objeto se compensa (sin huérfanos)', async () => {
    const flakyRepo = new InMemoryArtifactRepository();
    const svc = new ArtifactLifecycleService({ repo: flakyRepo, storage });
    const original = flakyRepo.createStorage.bind(flakyRepo);
    flakyRepo.createStorage = async () => {
      throw new Error('DB caída');
    };

    await expect(
      svc.storeVersion({
        artifactId: ARTIFACT,
        tenantId: TENANT,
        version: 1,
        bytes: bytes('contenido'),
        contentType: 'image/png',
        actor: humanCreator,
      }),
    ).rejects.toThrow('DB caída');

    expect(storage.keys()).toHaveLength(0);
    flakyRepo.createStorage = original;
  });

  it('MD-17: si el proveedor falla al borrar, queda `deletion_pending` y NO se declara borrado', async () => {
    await storeDraft();
    const key = (await repo.getStorage(ARTIFACT, 1))!.storageKey;

    storage.failNext('delete', new Error('proveedor no disponible'));

    const result = await service.delete({ artifactId: ARTIFACT, version: 1, actor: humanCreator });

    expect(result).toEqual({ deleted: false, physicalState: 'deletion_pending' });
    expect((await repo.getStorage(ARTIFACT, 1))?.physicalState).toBe('deletion_pending');
    expect((await repo.getVersion(ARTIFACT, 1))?.status).not.toBe('deleted');
    expect(storage.has(key)).toBe(true);
  });

  it('MD-06b: el borrado es idempotente y marca el estado de negocio', async () => {
    await storeDraft();

    const first = await service.delete({ artifactId: ARTIFACT, version: 1, actor: humanCreator });
    expect(first).toEqual({ deleted: true, physicalState: 'deleted' });
    expect((await repo.getVersion(ARTIFACT, 1))?.status).toBe('deleted');

    const second = await service.delete({ artifactId: ARTIFACT, version: 1, actor: humanCreator });
    expect(second).toEqual({ deleted: true, physicalState: 'deleted' });
  });

  it('MD-06c: no se puede borrar un artefacto publicado sin despublicar', async () => {
    await storeDraft();
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: humanCreator });
    await service.approve({ artifactId: ARTIFACT, version: 1, approver: humanApprover });
    await service.publish({ artifactId: ARTIFACT, version: 1, actor: humanApprover });

    await expect(
      service.delete({ artifactId: ARTIFACT, version: 1, actor: humanCreator }),
    ).rejects.toMatchObject({ code: 'MUST_UNPUBLISH_FIRST' });
  });

  it('MD-19: la reconciliación detecta `missing_blob` y la inconsistencia con `published`', async () => {
    await storeDraft();
    await service.submitForReview({ artifactId: ARTIFACT, version: 1, actor: humanCreator });
    await service.approve({ artifactId: ARTIFACT, version: 1, approver: humanApprover });
    await service.publish({ artifactId: ARTIFACT, version: 1, actor: humanApprover });

    // El objeto desaparece del proveedor por fuera del sistema.
    const key = (await repo.getStorage(ARTIFACT, 1))!.storageKey;
    await storage.delete(key);

    const report = await service.reconcile({ artifactId: ARTIFACT });

    expect(report.missingBlobs).toEqual([{ artifactId: ARTIFACT, version: 1 }]);
    expect(report.inconsistentBusinessState).toHaveLength(1);
    expect(report.inconsistentBusinessState[0]!.reason).toContain('publicada');
    expect((await repo.getStorage(ARTIFACT, 1))?.physicalState).toBe('missing');
  });

  it('MD-18: la reconciliación no reporta nada si el objeto existe', async () => {
    await storeDraft();
    const report = await service.reconcile({ artifactId: ARTIFACT });
    expect(report.missingBlobs).toHaveLength(0);
    expect(report.inconsistentBusinessState).toHaveLength(0);
    expect(report.orphanBlobs).toHaveLength(0);
    expect(report.orphanDetection).toBe('checked');
  });

  it('MD-18c: detecta objetos HUÉRFANOS (blob sin fila en la DB)', async () => {
    await storeDraft();

    // Objeto subido por fuera del ciclo de vida (p. ej. job interrumpido).
    await storage.put(bytes('huerfano'), {
      key: `content/${TENANT}/${ARTIFACT}/v99`,
      contentType: 'image/png',
    });

    const report = await service.reconcile({ artifactId: ARTIFACT });

    expect(report.orphanDetection).toBe('checked');
    expect(report.orphanBlobs).toEqual([`content/${TENANT}/${ARTIFACT}/v99`]);
    expect(report.missingBlobs).toHaveLength(0);
  });

  it('MD-18d: si el proveedor no soporta listar, se reporta `unsupported` (nunca "sin huérfanos")', async () => {
    await storeDraft();

    const base = new InMemoryStorageAdapter();
    // Adaptador que NO expone `list` (contrato mínimo).
    const noList: StorageAdapter = {
      provider: 'blob',
      put: (b, o) => base.put(b, o),
      read: (k) => base.read(k),
      delete: (k) => base.delete(k),
      head: (k) => base.head(k),
    };

    const svc = new ArtifactLifecycleService({ repo, storage: noList });
    const report = await svc.reconcile({ artifactId: ARTIFACT });

    expect(report.orphanDetection).toBe('unsupported');
    expect(report.orphanBlobs).toEqual([]);
  });
});
