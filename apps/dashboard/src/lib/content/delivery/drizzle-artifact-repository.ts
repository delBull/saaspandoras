/**
 * Repositorio Drizzle de P0.3.
 *
 * Implementa `ArtifactRepository` + `DeliveryTokenStore` sobre las tablas nuevas
 * de la migración 0095 (`hermes_artifact_versions`, `hermes_artifact_storage`,
 * `hermes_artifact_events`, `hermes_artifact_delivery_tokens`).
 *
 * ⚠️ ESTADO: IMPLEMENTADO — NO CABLEADO.
 * Las rutas que lo usan están detrás de `P0_3_DELIVERY_ENABLED` (por defecto
 * deshabilitado) porque la migración 0095 NO está aplicada. La lógica de dominio
 * está cubierta por pruebas con repositorio en memoria; este adaptador queda
 * pendiente de verificación contra base de datos real cuando se autorice 0095.
 */

import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from '@saasfly/db-core';
import { db } from '@saasfly/db';
import {
  hermesArtifactDeliveryTokens,
  hermesArtifactEvents,
  hermesArtifactStorage,
  hermesArtifactVersions,
} from '@saasfly/db/schema';
import type {
  ArtifactEvent,
  ArtifactRepository,
  BusinessStatus,
  PhysicalState,
  StorageRecord,
  VersionRecord,
} from './artifact-lifecycle';
import type { DeliveryTokenRecord, DeliveryTokenStore } from './delivery-token';

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function epoch(value: Date | null | undefined): number | null {
  return value ? Math.floor(value.getTime() / 1000) : null;
}

export class DrizzleArtifactRepository implements ArtifactRepository, DeliveryTokenStore {
  // ── Versiones (estado de negocio) ───────────────────────────────────────
  async createVersion(record: VersionRecord): Promise<void> {
    await db.insert(hermesArtifactVersions).values({
      id: randomUUID(),
      artifactId: record.artifactId,
      tenantId: record.tenantId,
      version: record.version,
      status: record.status,
      sha256: record.sha256,
      sizeBytes: record.sizeBytes,
      contentType: record.contentType,
      createdByKind: record.createdByKind,
      createdById: record.createdById,
      createdByOwnerId: record.createdByOwnerId,
      approvedByKind: record.approvedByKind,
      approvedById: record.approvedById,
      approvedAt: record.approvedAt ? new Date(record.approvedAt) : null,
      lastEditedByKind: record.lastEditedByKind,
      lastEditedById: record.lastEditedById,
      rejectedReason: record.rejectedReason,
      replacedByVersion: record.replacedByVersion,
    });
  }

  async getVersion(artifactId: string, version: number): Promise<VersionRecord | null> {
    const [row] = await db
      .select()
      .from(hermesArtifactVersions)
      .where(
        and(
          eq(hermesArtifactVersions.artifactId, artifactId),
          eq(hermesArtifactVersions.version, version),
        ),
      )
      .limit(1);

    return row ? this.mapVersion(row) : null;
  }

  async listVersions(artifactId: string): Promise<VersionRecord[]> {
    const rows = await db
      .select()
      .from(hermesArtifactVersions)
      .where(eq(hermesArtifactVersions.artifactId, artifactId))
      .orderBy(hermesArtifactVersions.version);
    return rows.map((row) => this.mapVersion(row));
  }

  async transitionVersion(
    artifactId: string,
    version: number,
    from: BusinessStatus,
    to: BusinessStatus,
    patch: Partial<VersionRecord> = {},
  ): Promise<boolean> {
    const updated = await db
      .update(hermesArtifactVersions)
      .set({
        ...(patch.sha256 !== undefined ? { sha256: patch.sha256 } : {}),
        ...(patch.sizeBytes !== undefined ? { sizeBytes: patch.sizeBytes } : {}),
        ...(patch.contentType !== undefined ? { contentType: patch.contentType } : {}),
        ...(patch.approvedByKind !== undefined ? { approvedByKind: patch.approvedByKind } : {}),
        ...(patch.approvedById !== undefined ? { approvedById: patch.approvedById } : {}),
        ...(patch.approvedAt !== undefined
          ? { approvedAt: patch.approvedAt ? new Date(patch.approvedAt) : null }
          : {}),
        ...(patch.lastEditedByKind !== undefined ? { lastEditedByKind: patch.lastEditedByKind } : {}),
        ...(patch.lastEditedById !== undefined ? { lastEditedById: patch.lastEditedById } : {}),
        ...(patch.rejectedReason !== undefined ? { rejectedReason: patch.rejectedReason } : {}),
        ...(patch.replacedByVersion !== undefined
          ? { replacedByVersion: patch.replacedByVersion }
          : {}),
        status: to,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(hermesArtifactVersions.artifactId, artifactId),
          eq(hermesArtifactVersions.version, version),
          eq(hermesArtifactVersions.status, from),
        ),
      )
      .returning({ id: hermesArtifactVersions.id });

    return updated.length > 0;
  }

  // ── Almacenamiento (estado físico) ──────────────────────────────────────
  async createStorage(record: StorageRecord): Promise<void> {
    await db.insert(hermesArtifactStorage).values({
      id: randomUUID(),
      artifactId: record.artifactId,
      version: record.version,
      physicalState: record.physicalState,
      provider: record.provider,
      storageKey: record.storageKey,
      sha256: record.sha256,
      sizeBytes: record.sizeBytes,
      contentType: record.contentType,
      reconciliationNote: record.reconciliationNote,
    });
  }

  async getStorage(artifactId: string, version: number): Promise<StorageRecord | null> {
    const [row] = await db
      .select()
      .from(hermesArtifactStorage)
      .where(
        and(
          eq(hermesArtifactStorage.artifactId, artifactId),
          eq(hermesArtifactStorage.version, version),
        ),
      )
      .limit(1);

    if (!row) return null;
    return {
      artifactId: row.artifactId,
      version: row.version,
      physicalState: row.physicalState as PhysicalState,
      provider: row.provider as 'blob' | 'ipfs',
      storageKey: row.storageKey,
      sha256: row.sha256,
      sizeBytes: row.sizeBytes ?? null,
      contentType: row.contentType ?? null,
      reconciliationNote: row.reconciliationNote ?? null,
    };
  }

  async setPhysicalState(
    artifactId: string,
    version: number,
    state: PhysicalState,
    note?: string | null,
  ): Promise<void> {
    await db
      .update(hermesArtifactStorage)
      .set({ physicalState: state, reconciliationNote: note ?? null, updatedAt: new Date() })
      .where(
        and(
          eq(hermesArtifactStorage.artifactId, artifactId),
          eq(hermesArtifactStorage.version, version),
        ),
      );
  }

  async listStorageByState(state: PhysicalState): Promise<StorageRecord[]> {
    const rows = await db
      .select()
      .from(hermesArtifactStorage)
      .where(eq(hermesArtifactStorage.physicalState, state));

    return rows.map((row) => ({
      artifactId: row.artifactId,
      version: row.version,
      physicalState: row.physicalState as PhysicalState,
      provider: row.provider as 'blob' | 'ipfs',
      storageKey: row.storageKey,
      sha256: row.sha256,
      sizeBytes: row.sizeBytes ?? null,
      contentType: row.contentType ?? null,
      reconciliationNote: row.reconciliationNote ?? null,
    }));
  }

  // ── Eventos (append-only) ───────────────────────────────────────────────
  async appendEvent(event: ArtifactEvent): Promise<void> {
    await db.insert(hermesArtifactEvents).values({
      id: event.id,
      artifactId: event.artifactId,
      version: event.version,
      type: event.type,
      actorKind: event.actorKind,
      actorId: event.actorId,
      previousState: event.previousState,
      newState: event.newState,
      reason: event.reason,
      metadataJson: event.metadata,
    });
  }

  async listEvents(artifactId: string): Promise<ArtifactEvent[]> {
    const rows = await db
      .select()
      .from(hermesArtifactEvents)
      .where(eq(hermesArtifactEvents.artifactId, artifactId))
      .orderBy(desc(hermesArtifactEvents.createdAt));

    return rows.map((row) => ({
      id: row.id,
      artifactId: row.artifactId,
      version: row.version ?? null,
      type: row.type as ArtifactEvent['type'],
      actorKind: row.actorKind as ArtifactEvent['actorKind'],
      actorId: row.actorId,
      previousState: row.previousState ?? null,
      newState: row.newState ?? null,
      reason: row.reason ?? null,
      metadata: (row.metadataJson as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  // ── Tokens de entrega ───────────────────────────────────────────────────
  async create(record: DeliveryTokenRecord): Promise<void> {
    await db.insert(hermesArtifactDeliveryTokens).values({
      id: record.id,
      artifactId: record.artifactId,
      version: record.version,
      tenantId: record.tenantId,
      issuedByKind: record.issuedByKind,
      issuedById: record.issuedById,
      expiresAt: new Date(record.expiresAt * 1000),
    });
  }

  async findById(jti: string): Promise<DeliveryTokenRecord | null> {
    const [row] = await db
      .select()
      .from(hermesArtifactDeliveryTokens)
      .where(eq(hermesArtifactDeliveryTokens.id, jti))
      .limit(1);

    if (!row) return null;
    return {
      id: row.id,
      artifactId: row.artifactId,
      version: row.version,
      tenantId: row.tenantId,
      issuedByKind: row.issuedByKind as DeliveryTokenRecord['issuedByKind'],
      issuedById: row.issuedById,
      expiresAt: epoch(row.expiresAt) ?? 0,
      revokedAt: epoch(row.revokedAt),
      lastUsedAt: epoch(row.lastUsedAt),
    };
  }

  async revoke(jti: string, revokedAt: number): Promise<boolean> {
    const updated = await db
      .update(hermesArtifactDeliveryTokens)
      .set({ revokedAt: new Date(revokedAt * 1000) })
      .where(
        and(
          eq(hermesArtifactDeliveryTokens.id, jti),
          sql`${hermesArtifactDeliveryTokens.revokedAt} IS NULL`,
        ),
      )
      .returning({ id: hermesArtifactDeliveryTokens.id });

    return updated.length > 0;
  }

  async touch(jti: string, usedAt: number): Promise<void> {
    await db
      .update(hermesArtifactDeliveryTokens)
      .set({
        lastUsedAt: new Date(usedAt * 1000),
        useCount: sql`${hermesArtifactDeliveryTokens.useCount} + 1`,
      })
      .where(eq(hermesArtifactDeliveryTokens.id, jti));
  }

  private mapVersion(row: typeof hermesArtifactVersions.$inferSelect): VersionRecord {
    return {
      artifactId: row.artifactId,
      tenantId: row.tenantId,
      version: row.version,
      status: row.status as BusinessStatus,
      sha256: row.sha256,
      sizeBytes: row.sizeBytes ?? null,
      contentType: row.contentType ?? null,
      createdByKind: row.createdByKind as VersionRecord['createdByKind'],
      createdById: row.createdById,
      createdByOwnerId: row.createdByOwnerId ?? null,
      approvedByKind: (row.approvedByKind as VersionRecord['approvedByKind']) ?? null,
      approvedById: row.approvedById ?? null,
      approvedAt: toIso(row.approvedAt),
      lastEditedByKind: (row.lastEditedByKind as VersionRecord['lastEditedByKind']) ?? null,
      lastEditedById: row.lastEditedById ?? null,
      rejectedReason: row.rejectedReason ?? null,
      replacedByVersion: row.replacedByVersion ?? null,
    };
  }
}
