/**
 * Repositorio y almacén de tokens EN MEMORIA — SOLO para pruebas.
 *
 * Implementa el contrato real (`ArtifactRepository`, `DeliveryTokenStore`) para
 * probar el ciclo de vida completo sin base de datos ni migraciones aplicadas.
 */

import type { DeliveryTokenRecord, DeliveryTokenStore } from './delivery-token';
import type {
  ArtifactEvent,
  ArtifactRepository,
  BusinessStatus,
  PhysicalState,
  StorageRecord,
  VersionRecord,
} from './artifact-lifecycle';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class InMemoryArtifactRepository implements ArtifactRepository, DeliveryTokenStore {
  private readonly versions = new Map<string, VersionRecord>();
  private readonly storage = new Map<string, StorageRecord>();
  private readonly events: ArtifactEvent[] = [];
  private readonly tokens = new Map<string, DeliveryTokenRecord>();

  private versionKey(artifactId: string, version: number): string {
    return `${artifactId}::${version}`;
  }

  async createVersion(record: VersionRecord): Promise<void> {
    const key = this.versionKey(record.artifactId, record.version);
    if (this.versions.has(key)) {
      throw new Error(`Versión duplicada: ${record.artifactId} v${record.version}`);
    }
    this.versions.set(key, clone(record));
  }

  async getVersion(artifactId: string, version: number): Promise<VersionRecord | null> {
    const found = this.versions.get(this.versionKey(artifactId, version));
    return found ? clone(found) : null;
  }

  async listVersions(artifactId: string): Promise<VersionRecord[]> {
    return [...this.versions.values()]
      .filter((v) => v.artifactId === artifactId)
      .sort((a, b) => a.version - b.version)
      .map(clone);
  }

  async transitionVersion(
    artifactId: string,
    version: number,
    from: BusinessStatus,
    to: BusinessStatus,
    patch: Partial<VersionRecord> = {},
  ): Promise<boolean> {
    const key = this.versionKey(artifactId, version);
    const current = this.versions.get(key);
    if (!current || current.status !== from) return false;
    this.versions.set(key, { ...current, ...clone(patch), status: to });
    return true;
  }

  async createStorage(record: StorageRecord): Promise<void> {
    this.storage.set(this.versionKey(record.artifactId, record.version), clone(record));
  }

  async getStorage(artifactId: string, version: number): Promise<StorageRecord | null> {
    const found = this.storage.get(this.versionKey(artifactId, version));
    return found ? clone(found) : null;
  }

  async setPhysicalState(
    artifactId: string,
    version: number,
    state: PhysicalState,
    note?: string | null,
  ): Promise<void> {
    const key = this.versionKey(artifactId, version);
    const current = this.storage.get(key);
    if (!current) throw new Error(`Storage inexistente: ${artifactId} v${version}`);
    this.storage.set(key, { ...current, physicalState: state, reconciliationNote: note ?? null });
  }

  async listStorageByState(state: PhysicalState): Promise<StorageRecord[]> {
    return [...this.storage.values()].filter((s) => s.physicalState === state).map(clone);
  }

  async appendEvent(event: ArtifactEvent): Promise<void> {
    this.events.push(clone(event));
  }

  async listEvents(artifactId: string): Promise<ArtifactEvent[]> {
    return this.events.filter((e) => e.artifactId === artifactId).map(clone);
  }

  // ── DeliveryTokenStore ──────────────────────────────────────────────────
  async create(record: DeliveryTokenRecord): Promise<void> {
    if (this.tokens.has(record.id)) throw new Error(`Token duplicado: ${record.id}`);
    this.tokens.set(record.id, clone(record));
  }

  async findById(jti: string): Promise<DeliveryTokenRecord | null> {
    const found = this.tokens.get(jti);
    return found ? clone(found) : null;
  }

  async revoke(jti: string, revokedAt: number): Promise<boolean> {
    const found = this.tokens.get(jti);
    if (!found) return false;
    this.tokens.set(jti, { ...found, revokedAt });
    return true;
  }

  async touch(jti: string, usedAt: number): Promise<void> {
    const found = this.tokens.get(jti);
    if (!found) return;
    this.tokens.set(jti, { ...found, lastUsedAt: usedAt } as DeliveryTokenRecord);
  }

  // ── Utilidades de prueba ────────────────────────────────────────────────
  eventsOf(artifactId: string): ArtifactEvent[] {
    return this.events.filter((e) => e.artifactId === artifactId).map(clone);
  }
}
