/**
 * Adaptador de almacenamiento en memoria — SOLO para pruebas y simulación.
 *
 * Implementa el mismo contrato que Blob, de modo que la lógica de ciclo de vida
 * (versiones, borrado idempotente, reconciliación) se prueba de verdad sin tocar
 * ningún proveedor real ni la base de datos.
 */

import { createHash } from 'node:crypto';
import type { ReadResult, StorageAdapter, StoredObject } from './types';

export class InMemoryStorageAdapter implements StorageAdapter {
  readonly provider = 'blob' as const;
  private readonly objects = new Map<string, { bytes: Uint8Array; contentType: string }>();
  private readonly failures: Partial<Record<'put' | 'read' | 'delete' | 'head', Error>> = {};

  /** Inyecta un fallo determinista para probar compensación y estados intermedios. */
  failNext(operation: 'put' | 'read' | 'delete' | 'head', error: Error): void {
    this.failures[operation] = error;
  }

  clearFailures(): void {
    for (const key of Object.keys(this.failures) as Array<keyof typeof this.failures>) {
      delete this.failures[key];
    }
  }

  private assertHealthy(operation: 'put' | 'read' | 'delete' | 'head'): void {
    const failure = this.failures[operation];
    if (failure) {
      delete this.failures[operation];
      throw failure;
    }
  }

  async put(bytes: Uint8Array, options: { key: string; contentType: string }): Promise<StoredObject> {
    this.assertHealthy('put');
    this.objects.set(options.key, { bytes, contentType: options.contentType });
    return {
      provider: 'blob',
      key: options.key,
      url: null,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      sizeBytes: bytes.byteLength,
      contentType: options.contentType,
    };
  }

  async read(key: string): Promise<ReadResult | null> {
    this.assertHealthy('read');
    const found = this.objects.get(key);
    if (!found) return null;
    return {
      stream: new Blob([found.bytes]).stream() as unknown as ReadableStream<Uint8Array>,
      contentType: found.contentType,
      sizeBytes: found.bytes.byteLength,
    };
  }

  async delete(key: string): Promise<{ deleted: boolean }> {
    this.assertHealthy('delete');
    return { deleted: this.objects.delete(key) };
  }

  async head(key: string): Promise<{ sizeBytes: number; contentType: string } | null> {
    this.assertHealthy('head');
    const found = this.objects.get(key);
    if (!found) return null;
    return { sizeBytes: found.bytes.byteLength, contentType: found.contentType };
  }

  /** Utilidades de inspección para aserciones de prueba. */
  has(key: string): boolean {
    return this.objects.has(key);
  }

  keys(): string[] {
    return [...this.objects.keys()];
  }

  async list(prefix: string): Promise<Array<{ key: string; sizeBytes: number | null }>> {
    this.assertHealthy('head');
    return this.keys()
      .filter((key) => key.startsWith(prefix))
      .map((key) => ({ key, sizeBytes: this.objects.get(key)!.bytes.byteLength }));
  }
}
