/**
 * 🛡️ Pandora's Academy — Persistent Nonce Stores (Fase 2.1)
 * packages/academy-sdk/src/security/nonce-stores.ts
 *
 * InMemoryNonceStore (key-distribution-service.ts) solo es válido para una
 * instancia. En serverless multi-instancia el anti-replay REQUIERE persistencia.
 * Implementación atómica con Upstash REST: `SET key val NX EX ttl` — true solo
 * si la clave no existía. Fail-closed: si el store falla, se DENIEGA (no replay
 * window) y la firma del cliente sigue siendo válida para un próximo intento.
 */

import { NonceStore } from './key-distribution-service';

/**
 * IoredisNonceStore — Railway Redis (REDISS_URL/REDIS_URL) o cualquier Redis TCP.
 * Atomic anti-replay: `SET key val NX EX ttl` (true solo si la clave no existía).
 * Fail-closed: si Redis no responde, se DENIEGA el nonce (no abre replay window).
 */
export class IoredisNonceStore implements NonceStore {
  private readonly client: any;
  private readonly keyPrefix: string;
  private readonly ttlSeconds: number;

  constructor(redisUrl = process.env.ACADEMY_REDIS_URL || process.env.REDIS_URL, ttlSeconds = 5 * 60) {
    if (!redisUrl) {
      throw new Error('[IoredisNonceStore] REDIS_URL / ACADEMY_REDIS_URL is required. Fail-closed: no fallback to memory.');
    }
    // Lazy require so pure-client bundles never pull ioredis.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    this.client = new Redis(redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });
    this.client.on('error', (err: Error) => {
      console.error('[IoredisNonceStore] Redis connection error:', err?.message || err);
    });
    this.keyPrefix = 'academy:nonce:';
    this.ttlSeconds = ttlSeconds;
  }

  public async registerNonce(nonce: string, timestamp: number): Promise<boolean> {
    try {
      const result = await this.client.set(
        `${this.keyPrefix}${nonce}`,
        String(timestamp),
        'EX',
        this.ttlSeconds,
        'NX'
      );
      return result === 'OK';
    } catch (err: any) {
      // Fail-closed: transport failure must never open a replay window.
      console.error('[IoredisNonceStore] Nonce registration failed, denying (fail-closed):', err?.message || err);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    await this.client?.quit?.();
  }
}

export class UpstashRestNonceStore implements NonceStore {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly ttlSeconds: number;

  constructor(ttlSeconds = 5 * 60) {
    const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!baseUrl || !token) {
      throw new Error(
        '[UpstashRestNonceStore] UPSTASH_REDIS_REST_URL/TOKEN are required. Fail-closed: no fallback to memory.'
      );
    }
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.ttlSeconds = ttlSeconds;
  }

  public async registerNonce(nonce: string, timestamp: number): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/set/${encodeURIComponent(`academy:nonce:${nonce}`)}/${encodeURIComponent(String(timestamp))}?EX=${this.ttlSeconds}&NX`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!res.ok) {
      // Fail-closed: transport failure must never open a replay window.
      console.error('[UpstashRestNonceStore] Persistent store unavailable, denying nonce (fail-closed).', res.status);
      return false;
    }

    const data = (await res.json().catch(() => null)) as { result?: string | null } | null;
    return data?.result === 'OK';
  }
}