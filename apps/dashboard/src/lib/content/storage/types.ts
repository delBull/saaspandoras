/**
 * Adaptador de almacenamiento desacoplado (P0.3).
 *
 * Contrato mínimo y neutral al proveedor: `put / read / delete / head`.
 * La selección de proveedor se resuelve SIEMPRE en servidor (config del tenant),
 * nunca desde el body del cliente.
 */

export type StorageProvider = 'blob' | 'ipfs';

export interface StoredObject {
  provider: StorageProvider;
  /** Clave interna del objeto (pathname). No es una URL pública. */
  key: string;
  /** URL del proveedor, si la hay. NO se usa como mecanismo de autorización. */
  url?: string | null;
  /** SHA-256 en hex de los bytes almacenados. */
  sha256: string;
  sizeBytes: number;
  contentType: string;
}

export interface ReadResult {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  sizeBytes: number | null;
}

export interface StorageAdapter {
  readonly provider: StorageProvider;

  /** Almacena bytes. Debe fallar si no hay credenciales: nunca inventar un resultado. */
  put(bytes: Uint8Array, options: { key: string; contentType: string }): Promise<StoredObject>;

  /** Lee un objeto. `null` si no existe (no es un error de autorización). */
  read(key: string): Promise<ReadResult | null>;

  /**
   * Elimina un objeto. IDEMPOTENTE: si el objeto ya no existe devuelve
   * `{ deleted: false }` en lugar de lanzar, para que el borrado sea reconciliable.
   */
  delete(key: string): Promise<{ deleted: boolean }>;

  /** Metadatos del objeto, o `null` si no existe. */
  head(key: string): Promise<{ sizeBytes: number; contentType: string } | null>;

  /**
   * Lista objetos bajo un prefijo. OPCIONAL: si el proveedor no lo soporta, la
   * reconciliación debe reportar `unsupported` — nunca "sin huérfanos".
   */
  list?(prefix: string): Promise<Array<{ key: string; sizeBytes: number | null }>>;
}

/** El proveedor no está configurado. Fail-closed: el llamador debe reportar UNSTORED. */
export class StorageNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageNotConfiguredError';
  }
}

/** Error del proveedor al ejecutar una operación. */
export class StorageOperationError extends Error {
  constructor(
    message: string,
    readonly operation: 'put' | 'read' | 'delete' | 'head',
  ) {
    super(message);
    this.name = 'StorageOperationError';
  }
}
