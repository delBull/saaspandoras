/**
 * Adaptador Vercel Blob (P0.3).
 *
 * Reutiliza `@vercel/blob` (ya integrado en avatar y adjuntos de deals).
 * Almacena en modo PRIVADO: la entrega se hace por proxy firmado, nunca por URL
 * pública directa. Si el proveedor no está configurado, falla de forma explícita
 * (`StorageNotConfiguredError`) en lugar de simular éxito.
 */

import { createHash } from 'node:crypto';
import { del, get, head, list, put } from '@vercel/blob';
import {
  StorageNotConfiguredError,
  StorageOperationError,
  type ReadResult,
  type StorageAdapter,
  type StoredObject,
} from './types';

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function isNotFoundError(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name;
  return name === 'BlobNotFoundError' || name === 'BlobPathnameMismatchError';
}

export class BlobStorageAdapter implements StorageAdapter {
  readonly provider = 'blob' as const;

  constructor(private readonly token: string) {
    if (!token || token.trim().length === 0) {
      throw new StorageNotConfiguredError(
        'Blob storage no está configurado: falta BLOB_READ_WRITE_TOKEN.',
      );
    }
  }

  async put(bytes: Uint8Array, options: { key: string; contentType: string }): Promise<StoredObject> {
    const sha256 = sha256Hex(bytes);
    try {
      const result = await put(options.key, Buffer.from(bytes), {
        access: 'private',
        contentType: options.contentType,
        addRandomSuffix: false,
        token: this.token,
      });

      return {
        provider: 'blob',
        key: result.pathname,
        url: result.url ?? null,
        sha256,
        sizeBytes: bytes.byteLength,
        contentType: options.contentType,
      };
    } catch (error) {
      throw new StorageOperationError(
        `Blob put falló: ${(error as Error)?.message ?? 'error desconocido'}`,
        'put',
      );
    }
  }

  async read(key: string): Promise<ReadResult | null> {
    try {
      const result = await get(key, { access: 'private', token: this.token });
      if (!result) return null;
      // 304 Not Modified no trae cuerpo: no hay contenido que servir.
      if (result.statusCode !== 200 || !result.stream) return null;
      return {
        stream: result.stream,
        contentType: result.blob.contentType ?? 'application/octet-stream',
        sizeBytes: typeof result.blob.size === 'number' ? result.blob.size : null,
      };
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw new StorageOperationError(
        `Blob read falló: ${(error as Error)?.message ?? 'error desconocido'}`,
        'read',
      );
    }
  }

  async delete(key: string): Promise<{ deleted: boolean }> {
    try {
      await del(key, { token: this.token });
      return { deleted: true };
    } catch (error) {
      if (isNotFoundError(error)) return { deleted: false };
      throw new StorageOperationError(
        `Blob delete falló: ${(error as Error)?.message ?? 'error desconocido'}`,
        'delete',
      );
    }
  }

  async head(key: string): Promise<{ sizeBytes: number; contentType: string } | null> {
    try {
      const result = await head(key, { token: this.token });
      return { sizeBytes: result.size, contentType: result.contentType };
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw new StorageOperationError(
        `Blob head falló: ${(error as Error)?.message ?? 'error desconocido'}`,
        'head',
      );
    }
  }

  async list(prefix: string): Promise<Array<{ key: string; sizeBytes: number | null }>> {
    const results: Array<{ key: string; sizeBytes: number | null }> = [];
    let cursor: string | undefined;

    try {
      do {
        const page = await list({ prefix, cursor, token: this.token });
        for (const blob of page.blobs) {
          results.push({ key: blob.pathname, sizeBytes: typeof blob.size === 'number' ? blob.size : null });
        }
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);

      return results;
    } catch (error) {
      throw new StorageOperationError(
        `Blob list falló: ${(error as Error)?.message ?? 'error desconocido'}`,
        'head',
      );
    }
  }
}
