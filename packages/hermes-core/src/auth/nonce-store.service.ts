/**
 * 🛡️ Nonce Replay Defense Adapter — Gate 2
 * packages/hermes-core/src/auth/nonce-store.service.ts
 *
 * Implements atomic single-use nonce consumption.
 * - In-Memory store for tests and local development.
 * - PostgreSQL store backed by existing `a2a_nonces` table for multi-instance serverless deployments.
 */

export type NonceConsumptionStatus = 'CONSUMED' | 'DUPLICATE' | 'ERROR';

export interface NonceConsumptionResult {
  status: NonceConsumptionStatus;
  error?: string;
}

export interface NonceStore {
  /**
   * Atomically consumes a nonce with a given expiration.
   * Returns CONSUMED if and only if the nonce was unused and successfully claimed.
   * Returns DUPLICATE if the nonce was already used (replay attack).
   * Returns ERROR if database/storage failed (fail-closed, must NOT be treated as replay).
   */
  consumeNonce(params: {
    nonce: string;
    purpose: string;
    tenantId: string;
    expiresAt: Date;
  }): Promise<NonceConsumptionResult> | NonceConsumptionResult;
}

export class MemoryNonceStore implements NonceStore {
  private consumed = new Map<string, number>();

  consumeNonce(params: {
    nonce: string;
    purpose: string;
    tenantId: string;
    expiresAt: Date;
  }): NonceConsumptionResult {
    const key = `${params.purpose}:${params.tenantId}:${params.nonce}`;
    const now = Date.now();

    // Check if expired in map
    const existingExpiry = this.consumed.get(key);
    if (existingExpiry && existingExpiry > now) {
      // Still active and already consumed -> Replay attack
      return { status: 'DUPLICATE' };
    }

    if (params.expiresAt.getTime() <= now) {
      // Already expired at birth -> Invalid/replay
      return { status: 'DUPLICATE', error: 'NONCE_EXPIRED_AT_BIRTH' };
    }

    this.consumed.set(key, params.expiresAt.getTime());
    return { status: 'CONSUMED' };
  }

  clear(): void {
    this.consumed.clear();
  }
}

/**
 * Helper unificado para inserción atómica anti-replay en la tabla a2a_nonces.
 * Devuelve CONSUMED si se insertó, DUPLICATE si ya existía (ON CONFLICT), o ERROR si la DB falló.
 */
export async function consumeA2aNonce(params: {
  nonceKey: string;
  expiresAt: Date;
}): Promise<NonceConsumptionResult> {
  try {
    const { db, a2aNonces } = await import('@saasfly/db-core');
    const inserted = await db
      .insert(a2aNonces)
      .values({
        nonce: params.nonceKey,
        expiresAt: params.expiresAt,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length > 0) {
      return { status: 'CONSUMED' };
    }
    return { status: 'DUPLICATE' };
  } catch (err: any) {
    console.error('[consumeA2aNonce] Database error during nonce consumption:', err?.message);
    // Fail closed: return ERROR distinctly from DUPLICATE
    return { status: 'ERROR', error: err?.message || 'DB_PERSISTENCE_ERROR' };
  }
}

export class PostgresA2aNonceStore implements NonceStore {
  /**
   * Atomically inserts into `a2a_nonces` table with ON CONFLICT DO NOTHING.
   * If row count returned is 0 -> Nonce was already consumed -> Replay detected.
   */
  async consumeNonce(params: {
    nonce: string;
    purpose: string;
    tenantId: string;
    expiresAt: Date;
  }): Promise<NonceConsumptionResult> {
    const key = `hses_${params.purpose}_${params.tenantId}_${params.nonce}`;
    return consumeA2aNonce({
      nonceKey: key,
      expiresAt: params.expiresAt,
    });
  }
}

let configuredNonceStore: NonceStore | null = null;

export function getActiveNonceStore(): NonceStore {
  // Absolute Invariant: In production, PostgresA2aNonceStore is strictly mandatory and immutable.
  // No configuration flag, environment variable, or setter can override this.
  if (process.env.NODE_ENV === 'production') {
    return new PostgresA2aNonceStore();
  }

  if (configuredNonceStore) {
    return configuredNonceStore;
  }

  // In non-production (test/dev), allow memory if explicitly requested or running tests
  const allowMemoryInDev = process.env.HERMES_ALLOW_MEMORY_NONCE_STORE === 'true' || process.env.NODE_ENV === 'test';
  if (allowMemoryInDev) {
    configuredNonceStore = new MemoryNonceStore();
    return configuredNonceStore;
  }

  configuredNonceStore = new PostgresA2aNonceStore();
  return configuredNonceStore;
}

export function setActiveNonceStore(store: NonceStore | null): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[setActiveNonceStore] CRITICAL: Mutating or replacing NonceStore is strictly forbidden in production. PostgresA2aNonceStore is mandatory and immutable.'
    );
  }
  configuredNonceStore = store;
}

