import { getRedis } from '@/lib/redis';

export type DeliveryState = 'PENDING' | 'DISPATCHING' | 'DELIVERED' | 'FAILED';

export interface IdempotencyClaimResult {
  status: 'CLAIMED' | 'ALREADY_CLAIMED';
  state?: DeliveryState;
}

export interface IdempotencyStore {
  claim(idempotencyKey: string): Promise<IdempotencyClaimResult>;
  updateState(idempotencyKey: string, state: DeliveryState): Promise<void>;
}

// Memory fallback with TTL for environments without dedicated Redis
const memoryStore = new Map<string, { state: DeliveryState; expiresAt: number }>();

export class RedisIdempotencyStore implements IdempotencyStore {
  private readonly TTL_SECONDS = 86400; // 24 hours retention for idempotency keys

  async claim(idempotencyKey: string): Promise<IdempotencyClaimResult> {
    const redis = getRedis();

    if (!redis) {
      // Graceful in-memory deduplication fallback when Redis is absent
      const now = Date.now();
      const existing = memoryStore.get(idempotencyKey);
      if (existing && existing.expiresAt > now) {
        return { status: 'ALREADY_CLAIMED', state: existing.state };
      }
      memoryStore.set(idempotencyKey, { state: 'PENDING', expiresAt: now + (this.TTL_SECONDS * 1000) });
      return { status: 'CLAIMED', state: 'PENDING' };
    }

    try {
      // Atomic claim via SET NX (Only set if not exists)
      const result = await redis.set(idempotencyKey, 'PENDING', 'EX', this.TTL_SECONDS, 'NX');
      
      if (result === 'OK') {
        return { status: 'CLAIMED', state: 'PENDING' };
      }

      // If already exists, fetch the current state
      const currentState = await redis.get(idempotencyKey);
      return {
        status: 'ALREADY_CLAIMED',
        state: (currentState as DeliveryState) || 'PENDING'
      };
    } catch (err: any) {
      console.warn('[RedisIdempotencyStore] Redis claim failed, falling back to memory:', err?.message);
      const now = Date.now();
      const existing = memoryStore.get(idempotencyKey);
      if (existing && existing.expiresAt > now) {
        return { status: 'ALREADY_CLAIMED', state: existing.state };
      }
      memoryStore.set(idempotencyKey, { state: 'PENDING', expiresAt: now + (this.TTL_SECONDS * 1000) });
      return { status: 'CLAIMED', state: 'PENDING' };
    }
  }

  async updateState(idempotencyKey: string, state: DeliveryState): Promise<void> {
    const redis = getRedis();

    if (!redis) {
      const existing = memoryStore.get(idempotencyKey);
      if (existing) {
        existing.state = state;
      }
      return;
    }

    try {
      // Update state while keeping the remaining TTL
      await redis.set(idempotencyKey, state, 'KEEPTTL');
    } catch (err: any) {
      console.warn('[RedisIdempotencyStore] Redis updateState failed:', err?.message);
      const existing = memoryStore.get(idempotencyKey);
      if (existing) {
        existing.state = state;
      }
    }
  }
}
