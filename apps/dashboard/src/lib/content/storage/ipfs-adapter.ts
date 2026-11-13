/**
 * Adaptador IPFS — SOLO INTERFAZ (P0.3).
 *
 * No se despliega Kubo ni se integra un proveedor nuevo en esta fase.
 * Cualquier intento de uso falla de forma explícita: nunca se simula un pin ni
 * se inventa un CID.
 */

import { StorageNotConfiguredError, type ReadResult, type StorageAdapter, type StoredObject } from './types';

export class IpfsStorageAdapter implements StorageAdapter {
  readonly provider = 'ipfs' as const;

  constructor() {
    throw new StorageNotConfiguredError(
      'IPFS no está habilitado en P0.3: no se despliega Kubo ni gateway. Use el adaptador blob.',
    );
  }

  async put(_bytes: Uint8Array, _options: { key: string; contentType: string }): Promise<StoredObject> {
    throw new StorageNotConfiguredError('IPFS no implementado.');
  }

  async read(_key: string): Promise<ReadResult | null> {
    throw new StorageNotConfiguredError('IPFS no implementado.');
  }

  async delete(_key: string): Promise<{ deleted: boolean }> {
    throw new StorageNotConfiguredError('IPFS no implementado.');
  }

  async head(_key: string): Promise<{ sizeBytes: number; contentType: string } | null> {
    throw new StorageNotConfiguredError('IPFS no implementado.');
  }
}
