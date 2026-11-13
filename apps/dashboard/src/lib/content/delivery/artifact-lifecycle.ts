/**
 * Ciclo de vida de artefactos de contenido (P0.3).
 *
 * Reglas duras implementadas aquí (no en la UI):
 *  1. Estado de NEGOCIO (versión) separado del estado FÍSICO (almacenamiento).
 *  2. Aprobación por una identidad HUMANA distinta del creador, del propietario
 *     de la identidad de máquina que creó, y del último editor humano.
 *  3. Una API key NUNCA aprueba (ni su propio contenido ni el de otros).
 *  4. Concurrencia: cada transición es compare-and-set; si otra transición ganó,
 *     la segunda falla con conflicto (no se producen historiales contradictorios).
 *  5. Reemplazo: nunca se sobrescribe una versión aprobada; se crea una nueva y
 *     la anterior pasa a `replaced`.
 *  6. Borrado: idempotente y reconciliable. Si el proveedor falla, el estado
 *     físico queda `deletion_pending`; jamás se declara `deleted` en falso.
 *  7. Publicación: deshabilitada por defecto (fail-closed) hasta que se habilite
 *     explícitamente; el almacenamiento y la emisión de tokens no dependen de ella.
 */

import { createHash, randomUUID } from 'node:crypto';
import {
  StorageNotConfiguredError,
  type StorageAdapter,
} from '../storage/types';

export type BusinessStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'replaced'
  | 'deleted';

export type PhysicalState = 'stored' | 'deletion_pending' | 'deleted' | 'missing';

export type ActorKind = 'human' | 'api_key' | 'system';

export interface Actor {
  kind: ActorKind;
  id: string;
  /** Humano resoluble dueño de la API key (obligatorio para máquinas). */
  ownerId?: string | null;
}

export interface VersionRecord {
  artifactId: string;
  tenantId: string;
  version: number;
  status: BusinessStatus;
  sha256: string;
  sizeBytes: number | null;
  contentType: string | null;
  createdByKind: ActorKind;
  createdById: string;
  createdByOwnerId: string | null;
  approvedByKind: ActorKind | null;
  approvedById: string | null;
  approvedAt: string | null;
  lastEditedByKind: ActorKind | null;
  lastEditedById: string | null;
  rejectedReason: string | null;
  replacedByVersion: number | null;
}

export interface StorageRecord {
  artifactId: string;
  version: number;
  physicalState: PhysicalState;
  provider: 'blob' | 'ipfs';
  storageKey: string;
  sha256: string;
  sizeBytes: number | null;
  contentType: string | null;
  reconciliationNote: string | null;
}

export interface ArtifactEvent {
  id: string;
  artifactId: string;
  version: number | null;
  type:
    | 'generated'
    | 'stored'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'published'
    | 'unpublished'
    | 'deleted'
    | 'replaced'
    | 'delivered'
    | 'revoked';
  actorKind: ActorKind;
  actorId: string;
  previousState: string | null;
  newState: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ArtifactRepository {
  createVersion(record: VersionRecord): Promise<void>;
  getVersion(artifactId: string, version: number): Promise<VersionRecord | null>;
  listVersions(artifactId: string): Promise<VersionRecord[]>;
  /**
   * Compare-and-set: aplica el parche SOLO si el estado actual es `from`.
   * @returns `true` si esta llamada ganó la transición.
   */
  transitionVersion(
    artifactId: string,
    version: number,
    from: BusinessStatus,
    to: BusinessStatus,
    patch?: Partial<VersionRecord>,
  ): Promise<boolean>;

  createStorage(record: StorageRecord): Promise<void>;
  getStorage(artifactId: string, version: number): Promise<StorageRecord | null>;
  setPhysicalState(
    artifactId: string,
    version: number,
    state: PhysicalState,
    note?: string | null,
  ): Promise<void>;
  listStorageByState(state: PhysicalState): Promise<StorageRecord[]>;

  appendEvent(event: ArtifactEvent): Promise<void>;
  listEvents(artifactId: string): Promise<ArtifactEvent[]>;
}

export class ArtifactLifecycleError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_TRANSITION'
      | 'CONFLICT'
      | 'APPROVER_IS_CREATOR'
      | 'APPROVER_IS_LAST_EDITOR'
      | 'MACHINE_CANNOT_APPROVE'
      | 'UNRESOLVED_OWNER'
      | 'REASON_REQUIRED'
      | 'NOT_PUBLISHED'
      | 'PUBLISH_DISABLED'
      | 'STORAGE_NOT_READY'
      | 'UNSTORED'
      | 'MUST_UNPUBLISH_FIRST',
  ) {
    super(message);
    this.name = 'ArtifactLifecycleError';
  }
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function nowIso(): string {
  return new Date().toISOString();
}

export interface ArtifactLifecycleServiceOptions {
  repo: ArtifactRepository;
  /**
   * Adaptador de almacenamiento. OPCIONAL: las transiciones de negocio
   * (submit/approve/reject/publish) no tocan el proveedor, así que no exigen
   * credenciales de storage. Quien almacene, borre o reconcilie sí lo requiere.
   */
  storage?: StorageAdapter;
  /** Publicación habilitada por configuración de servidor. Por defecto: NO. */
  publishEnabled?: boolean;
  /** Reloj inyectable para pruebas deterministas. */
  clock?: () => string;
}

export class ArtifactLifecycleService {
  private readonly repo: ArtifactRepository;
  private readonly storage: StorageAdapter | null;
  private readonly publishEnabled: boolean;
  private readonly clock: () => string;

  constructor(options: ArtifactLifecycleServiceOptions) {
    this.repo = options.repo;
    this.storage = options.storage ?? null;
    this.publishEnabled = options.publishEnabled === true;
    this.clock = options.clock ?? nowIso;
  }

  /** Almacena bytes como versión nueva. Compensa si la persistencia falla. */
  async storeVersion(params: {
    artifactId: string;
    tenantId: string;
    version: number;
    bytes: Uint8Array;
    contentType: string;
    actor: Actor;
    keyPrefix?: string;
  }): Promise<{ stored: true; version: VersionRecord; storage: StorageRecord }> {
    const key = `${params.keyPrefix ?? 'content'}/${params.tenantId}/${params.artifactId}/v${params.version}`;

    const storage = this.requireStorage();

    let stored;
    try {
      stored = await storage.put(params.bytes, { key, contentType: params.contentType });
    } catch (error) {
      if (error instanceof StorageNotConfiguredError) {
        throw new ArtifactLifecycleError(
          'Almacenamiento no configurado: el artefacto queda UNSTORED (sin URL ni CID inventados).',
          'UNSTORED',
        );
      }
      throw error;
    }

    // Integridad: el hash del adaptador debe coincidir con el de los bytes.
    const expectedSha = sha256Hex(params.bytes);
    if (stored.sha256 !== expectedSha) {
      await this.safeDelete(stored.key);
      throw new ArtifactLifecycleError(
        'Hash inconsistente tras el almacenamiento: se descarta el objeto.',
        'UNSTORED',
      );
    }

    const versionRecord: VersionRecord = {
      artifactId: params.artifactId,
      tenantId: params.tenantId,
      version: params.version,
      status: 'draft',
      sha256: stored.sha256,
      sizeBytes: stored.sizeBytes,
      contentType: stored.contentType,
      createdByKind: params.actor.kind,
      createdById: params.actor.id,
      createdByOwnerId: params.actor.ownerId ?? null,
      approvedByKind: null,
      approvedById: null,
      approvedAt: null,
      lastEditedByKind: null,
      lastEditedById: null,
      rejectedReason: null,
      replacedByVersion: null,
    };

    const storageRecord: StorageRecord = {
      artifactId: params.artifactId,
      version: params.version,
      physicalState: 'stored',
      provider: stored.provider,
      storageKey: stored.key,
      sha256: stored.sha256,
      sizeBytes: stored.sizeBytes,
      contentType: stored.contentType,
      reconciliationNote: null,
    };

    try {
      await this.repo.createVersion(versionRecord);
      await this.repo.createStorage(storageRecord);
      await this.appendEvent({
        artifactId: params.artifactId,
        version: params.version,
        type: 'stored',
        actor: params.actor,
        previousState: null,
        newState: 'draft',
        metadata: { sha256: stored.sha256, sizeBytes: stored.sizeBytes, provider: stored.provider },
      });
    } catch (error) {
      // Compensación: nunca dejar un blob huérfano silencioso.
      await this.safeDelete(stored.key);
      throw error;
    }

    return { stored: true, version: versionRecord, storage: storageRecord };
  }

  async submitForReview(params: {
    artifactId: string;
    version: number;
    actor: Actor;
  }): Promise<VersionRecord> {
    const version = await this.requireVersion(params.artifactId, params.version);
    if (version.status !== 'draft' && version.status !== 'rejected') {
      throw new ArtifactLifecycleError(
        `No se puede enviar a revisión desde '${version.status}'.`,
        'INVALID_TRANSITION',
      );
    }

    const won = await this.repo.transitionVersion(params.artifactId, params.version, version.status, 'in_review', {
      lastEditedByKind: params.actor.kind,
      lastEditedById: params.actor.id,
      rejectedReason: null,
    });
    if (!won) throw new ArtifactLifecycleError('Transición concurrente detectada.', 'CONFLICT');

    await this.appendEvent({
      artifactId: params.artifactId,
      version: params.version,
      type: 'submitted',
      actor: params.actor,
      previousState: version.status,
      newState: 'in_review',
    });

    return this.requireVersion(params.artifactId, params.version);
  }

  /**
   * Aprobación. Exige identidad HUMANA distinta del creador, del dueño de la
   * identidad de máquina creadora y del último editor humano.
   */
  async approve(params: {
    artifactId: string;
    version: number;
    approver: Actor;
    note?: string;
  }): Promise<VersionRecord> {
    const version = await this.requireVersion(params.artifactId, params.version);

    if (params.approver.kind !== 'human') {
      throw new ArtifactLifecycleError(
        'Solo una identidad humana autenticada puede aprobar contenido.',
        'MACHINE_CANNOT_APPROVE',
      );
    }
    if (version.createdByKind === 'api_key' && !version.createdByOwnerId) {
      throw new ArtifactLifecycleError(
        'No se puede resolver el propietario de la identidad de máquina creadora: no se publica.',
        'UNRESOLVED_OWNER',
      );
    }
    if (
      params.approver.id === version.createdById ||
      (version.createdByOwnerId !== null && params.approver.id === version.createdByOwnerId)
    ) {
      throw new ArtifactLifecycleError(
        'El aprobador es el creador (o el propietario de la identidad de máquina creadora).',
        'APPROVER_IS_CREATOR',
      );
    }
    if (version.lastEditedByKind === 'human' && params.approver.id === version.lastEditedById) {
      throw new ArtifactLifecycleError(
        'El aprobador es el último editor humano de la versión.',
        'APPROVER_IS_LAST_EDITOR',
      );
    }
    if (version.status !== 'in_review') {
      throw new ArtifactLifecycleError(
        `Solo se aprueba desde 'in_review' (estado actual: '${version.status}').`,
        'INVALID_TRANSITION',
      );
    }

    const at = this.clock();
    const won = await this.repo.transitionVersion(params.artifactId, params.version, 'in_review', 'approved', {
      approvedByKind: 'human',
      approvedById: params.approver.id,
      approvedAt: at,
    });
    if (!won) throw new ArtifactLifecycleError('Transición concurrente detectada.', 'CONFLICT');

    await this.appendEvent({
      artifactId: params.artifactId,
      version: params.version,
      type: 'approved',
      actor: params.approver,
      previousState: 'in_review',
      newState: 'approved',
      reason: params.note ?? null,
      metadata: { approvedAt: at },
    });

    return this.requireVersion(params.artifactId, params.version);
  }

  async reject(params: {
    artifactId: string;
    version: number;
    approver: Actor;
    reason: string;
  }): Promise<VersionRecord> {
    const version = await this.requireVersion(params.artifactId, params.version);

    if (params.approver.kind !== 'human') {
      throw new ArtifactLifecycleError('Solo una identidad humana puede rechazar.', 'MACHINE_CANNOT_APPROVE');
    }
    if (!params.reason || params.reason.trim().length === 0) {
      throw new ArtifactLifecycleError('El rechazo exige un motivo.', 'REASON_REQUIRED');
    }
    if (version.status !== 'in_review') {
      throw new ArtifactLifecycleError(
        `Solo se rechaza desde 'in_review' (estado actual: '${version.status}').`,
        'INVALID_TRANSITION',
      );
    }

    const won = await this.repo.transitionVersion(params.artifactId, params.version, 'in_review', 'rejected', {
      rejectedReason: params.reason,
    });
    if (!won) throw new ArtifactLifecycleError('Transición concurrente detectada.', 'CONFLICT');

    await this.appendEvent({
      artifactId: params.artifactId,
      version: params.version,
      type: 'rejected',
      actor: params.approver,
      previousState: 'in_review',
      newState: 'rejected',
      reason: params.reason,
    });

    return this.requireVersion(params.artifactId, params.version);
  }

  /**
   * Publica una versión aprobada. La versión publicada anterior pasa a `replaced`
   * y sus tokens de entrega deben revocarse (lo hace el llamador con el callback).
   */
  async publish(params: {
    artifactId: string;
    version: number;
    actor: Actor;
    onPreviousVersionReplaced?: (previousVersion: number) => Promise<void>;
  }): Promise<VersionRecord> {
    if (!this.publishEnabled) {
      throw new ArtifactLifecycleError(
        'La publicación está deshabilitada por configuración (fail-closed).',
        'PUBLISH_DISABLED',
      );
    }

    const version = await this.requireVersion(params.artifactId, params.version);
    if (version.status !== 'approved') {
      throw new ArtifactLifecycleError(
        `Solo se publica una versión aprobada (estado actual: '${version.status}').`,
        'INVALID_TRANSITION',
      );
    }

    const storage = await this.repo.getStorage(params.artifactId, params.version);
    if (!storage || storage.physicalState !== 'stored') {
      throw new ArtifactLifecycleError(
        `El almacenamiento no está listo (estado físico: '${storage?.physicalState ?? 'missing'}').`,
        'STORAGE_NOT_READY',
      );
    }

    const previous = (await this.repo.listVersions(params.artifactId)).find(
      (v) => v.status === 'published' && v.version !== params.version,
    );

    const won = await this.repo.transitionVersion(params.artifactId, params.version, 'approved', 'published');
    if (!won) throw new ArtifactLifecycleError('Transición concurrente detectada.', 'CONFLICT');

    if (previous) {
      const replaced = await this.repo.transitionVersion(
        params.artifactId,
        previous.version,
        'published',
        'replaced',
        { replacedByVersion: params.version },
      );
      if (!replaced) throw new ArtifactLifecycleError('Transición concurrente detectada.', 'CONFLICT');

      await this.appendEvent({
        artifactId: params.artifactId,
        version: previous.version,
        type: 'replaced',
        actor: params.actor,
        previousState: 'published',
        newState: 'replaced',
        metadata: { replacedByVersion: params.version },
      });

      if (params.onPreviousVersionReplaced) {
        await params.onPreviousVersionReplaced(previous.version);
      }
    }

    await this.appendEvent({
      artifactId: params.artifactId,
      version: params.version,
      type: 'published',
      actor: params.actor,
      previousState: 'approved',
      newState: 'published',
    });

    return this.requireVersion(params.artifactId, params.version);
  }

  /**
   * Borrado idempotente y reconciliable.
   * - Si está publicado, exige despublicar primero.
   * - Marca `deletion_pending` ANTES de llamar al proveedor.
   * - Si el proveedor falla, permanece `deletion_pending` y se informa el fallo.
   */
  async delete(params: {
    artifactId: string;
    version: number;
    actor: Actor;
  }): Promise<{ deleted: boolean; physicalState: PhysicalState }> {
    const version = await this.requireVersion(params.artifactId, params.version);
    const storage = await this.repo.getStorage(params.artifactId, params.version);

    if (!storage) {
      throw new ArtifactLifecycleError('No hay registro de almacenamiento para la versión.', 'NOT_FOUND');
    }
    if (version.status === 'published') {
      throw new ArtifactLifecycleError(
        'El artefacto está publicado: debe despublicarse antes de borrarse.',
        'MUST_UNPUBLISH_FIRST',
      );
    }
    if (storage.physicalState === 'deleted' && version.status === 'deleted') {
      return { deleted: true, physicalState: 'deleted' }; // idempotente
    }

    await this.repo.setPhysicalState(params.artifactId, params.version, 'deletion_pending');

    let providerDeleted: boolean;
    try {
      const result = await this.requireStorage().delete(storage.storageKey);
      providerDeleted = result.deleted;
    } catch (error) {
      // No se declara borrado: el estado físico refleja la realidad.
      await this.repo.setPhysicalState(
        params.artifactId,
        params.version,
        'deletion_pending',
        `Fallo del proveedor al borrar: ${(error as Error)?.message ?? 'error desconocido'}`,
      );
      return { deleted: false, physicalState: 'deletion_pending' };
    }

    await this.repo.setPhysicalState(
      params.artifactId,
      params.version,
      'deleted',
      providerDeleted ? null : 'El objeto ya no existía en el proveedor (borrado idempotente).',
    );

    if (version.status !== 'deleted') {
      await this.repo.transitionVersion(params.artifactId, params.version, version.status, 'deleted', {
        replacedByVersion: version.replacedByVersion,
      });
    }

    await this.appendEvent({
      artifactId: params.artifactId,
      version: params.version,
      type: 'deleted',
      actor: params.actor,
      previousState: version.status,
      newState: 'deleted',
      metadata: { providerDeleted },
    });

    return { deleted: true, physicalState: 'deleted' };
  }

  /**
   * Reconciliación: detecta objetos huérfanos y referencias inconsistentes.
   * No borra nada por sí sola: informa para que la limpieza sea explícita.
   *
   * Si el adaptador no soporta `list`, la detección de huérfanos se reporta como
   * `unsupported` — nunca como "no hay huérfanos".
   */
  async reconcile(params: { artifactId?: string; keyPrefix?: string } = {}): Promise<{
    orphanBlobs: string[];
    orphanDetection: 'checked' | 'unsupported';
    missingBlobs: Array<{ artifactId: string; version: number }>;
    inconsistentBusinessState: Array<{ artifactId: string; version: number; reason: string }>;
  }> {
    const states: PhysicalState[] = ['stored', 'deletion_pending', 'deleted', 'missing'];
    const allRows = (
      await Promise.all(states.map((state) => this.repo.listStorageByState(state)))
    ).flat();

    const scopedRows = params.artifactId
      ? allRows.filter((row) => row.artifactId === params.artifactId)
      : allRows;

    const missingBlobs: Array<{ artifactId: string; version: number }> = [];
    const inconsistentBusinessState: Array<{ artifactId: string; version: number; reason: string }> = [];

    const adapter = this.requireStorage();

    for (const row of scopedRows.filter((r) => r.physicalState === 'stored')) {
      const exists = await adapter.head(row.storageKey);
      if (!exists) {
        missingBlobs.push({ artifactId: row.artifactId, version: row.version });
        await this.repo.setPhysicalState(
          row.artifactId,
          row.version,
          'missing',
          'Reconciliación: la DB declara `stored` pero el objeto no existe en el proveedor.',
        );

        const version = await this.repo.getVersion(row.artifactId, row.version);
        if (version?.status === 'published') {
          inconsistentBusinessState.push({
            artifactId: row.artifactId,
            version: row.version,
            reason: 'Versión publicada sin objeto físico: entrega imposible.',
          });
        }
      }
    }

    // Estado físico `deleted`/`deletion_pending` no puede convivir con `published`.
    for (const row of scopedRows.filter(
      (r) => r.physicalState === 'deleted' || r.physicalState === 'deletion_pending',
    )) {
      const version = await this.repo.getVersion(row.artifactId, row.version);
      if (version?.status === 'published') {
        inconsistentBusinessState.push({
          artifactId: row.artifactId,
          version: row.version,
          reason: `physical_state='${row.physicalState}' con negocio 'published'.`,
        });
      }
    }

    // Huérfanos: objetos del proveedor sin fila en la DB.
    let orphanBlobs: string[] = [];
    let orphanDetection: 'checked' | 'unsupported' = 'unsupported';

    const storageAdapter = this.storage;
    if (storageAdapter && typeof storageAdapter.list === 'function') {
      const knownKeys = new Set(
        allRows.filter((r) => r.physicalState !== 'deleted').map((r) => r.storageKey),
      );
      const objects = await storageAdapter.list(params.keyPrefix ?? 'content/');
      orphanBlobs = objects.map((o) => o.key).filter((key) => !knownKeys.has(key));
      orphanDetection = 'checked';
    }

    return { orphanBlobs, orphanDetection, missingBlobs, inconsistentBusinessState };
  }

  /** Storage obligatorio: fail-closed si el llamador no lo configuró. */
  private requireStorage(): StorageAdapter {
    if (!this.storage) {
      throw new ArtifactLifecycleError(
        'Operación de almacenamiento sin adaptador configurado.',
        'UNSTORED',
      );
    }
    return this.storage;
  }

  private async safeDelete(key: string): Promise<void> {
    if (!this.storage) return;
    try {
      await this.storage.delete(key);
    } catch {
      // Compensación best-effort: el fallo se reporta vía reconciliación.
    }
  }

  private async requireVersion(artifactId: string, version: number): Promise<VersionRecord> {
    const record = await this.repo.getVersion(artifactId, version);
    if (!record) {
      throw new ArtifactLifecycleError(
        `Versión inexistente: ${artifactId} v${version}.`,
        'NOT_FOUND',
      );
    }
    return record;
  }

  private async appendEvent(params: {
    artifactId: string;
    version: number | null;
    type: ArtifactEvent['type'];
    actor: Actor;
    previousState: string | null;
    newState: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    await this.repo.appendEvent({
      id: randomUUID(),
      artifactId: params.artifactId,
      version: params.version,
      type: params.type,
      actorKind: params.actor.kind,
      actorId: params.actor.id,
      previousState: params.previousState,
      newState: params.newState,
      reason: params.reason ?? null,
      metadata: params.metadata ?? null,
      createdAt: this.clock(),
    });
  }
}
