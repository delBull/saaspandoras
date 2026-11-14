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

/**
 * El contenido gestionado (P0.3) usa un store PRIVADO con token propio.
 *
 * No se reutiliza `BLOB_READ_WRITE_TOKEN`: ese store es público y lo usan
 * avatares y adjuntos de deals. Mezclarlos rompería la invariante de P0.3
 * (entrega solo por proxy firmado) o rompería esas features.
 *
 * Sin token propio ⇒ StorageNotConfiguredError (UNSTORED). Nunca se cae al
 * store público en silencio.
 */
function readContentBlobConfig(): { token: string | null; storeId: string | null } {
  const token = process.env.BLOB_CONTENT_READ_WRITE_TOKEN?.trim() ?? '';
  const storeId =
    process.env.BLOB_CONTENT_READ_WRITE_TOKEN_STORE_ID?.trim() ??
    process.env.BLOB_STORE_ID?.trim() ??
    '';
  return {
    token: token.length > 0 ? token : null,
    storeId: storeId.length > 0 ? storeId : null,
  };
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
    const { token, storeId } = readContentBlobConfig();
    if (!token && !storeId) {
      throw new StorageNotConfiguredError(
        'Almacenamiento de contenido no configurado: falta BLOB_CONTENT_READ_WRITE_TOKEN o BLOB_CONTENT_READ_WRITE_TOKEN_STORE_ID (store privado).',
      );
    }
    return new BlobStorageAdapter({ token, storeId });
  }

  throw new StorageNotConfiguredError(
    `Proveedor de almacenamiento no soportado: '${provider}'. Valores válidos: 'blob' | 'ipfs'.`,
  );
}

export function isKnownProvider(value: string): value is StorageProvider {
  return value === 'blob' || value === 'ipfs';
}
