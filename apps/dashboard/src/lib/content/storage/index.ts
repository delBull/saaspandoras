/**
 * Resolución del adaptador de almacenamiento (P0.3).
 *
 * El proveedor se decide en SERVIDOR desde la configuración del tenant
 * (`projects.tenantRuntimeConfig.storage.provider`). Nunca se acepta desde el
 * body, un query param ni un header del cliente.
 *
 * Fail-closed: si no hay proveedor utilizable, se lanza
 * `StorageNotConfiguredError` y la capa superior debe reportar UNSTORED.
 */

import { BlobStorageAdapter } from './blob-adapter';
import { IpfsStorageAdapter } from './ipfs-adapter';
import { StorageNotConfiguredError, type StorageAdapter, type StorageProvider } from './types';

export interface TenantStorageConfig {
  provider?: string | null;
}

function readBlobToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return token && token.trim().length > 0 ? token : null;
}

/**
 * @param config configuración resuelta en servidor para el tenant.
 * @throws StorageNotConfiguredError si el proveedor no está disponible.
 */
export function resolveStorageAdapter(config: TenantStorageConfig | null): StorageAdapter {
  const provider = (config?.provider ?? '').trim().toLowerCase();

  if (provider === 'ipfs') {
    // Interfaz declarada, no habilitada en P0.3.
    return new IpfsStorageAdapter();
  }

  if (provider === 'blob' || provider === '') {
    const token = readBlobToken();
    if (!token) {
      throw new StorageNotConfiguredError(
        'Blob storage no está configurado: falta BLOB_READ_WRITE_TOKEN.',
      );
    }
    return new BlobStorageAdapter(token);
  }

  throw new StorageNotConfiguredError(
    `Proveedor de almacenamiento no soportado: '${provider}'. Valores válidos: 'blob' | 'ipfs'.`,
  );
}

export function isKnownProvider(value: string): value is StorageProvider {
  return value === 'blob' || value === 'ipfs';
}
