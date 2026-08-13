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

// Memory fallback purely for local dev testing
const memoryStore = new Map<string, DeliveryState>();

export class RedisIdempotencyStore implements IdempotencyStore {
  private readonly TTL_SECONDS = 86400; // 24 hours retention for idempotency keys

  async claim(idempotencyKey: string): Promise<IdempotencyClaimResult> {
    const redis = getRedis();

    if (!redis) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[C5.20] FAIL CLOSED: Redis is required for Outbound Idempotency in production.');
      }
      
      // Memory fallback for local development only
      if (memoryStore.has(idempotencyKey)) {
        return { status: 'ALREADY_CLAIMED', state: memoryStore.get(idempotencyKey) };
      }
      memoryStore.set(idempotencyKey, 'PENDING');
      return { status: 'CLAIMED', state: 'PENDING' };
    }

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
  }

  async updateState(idempotencyKey: string, state: DeliveryState): Promise<void> {
    const redis = getRedis();

    if (!redis) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[C5.20] FAIL CLOSED: Redis is required for Outbound Idempotency in production.');
      }
      if (memoryStore.has(idempotencyKey)) {
        memoryStore.set(idempotencyKey, state);
      }
      return;
    }

    // Update state while keeping the remaining TTL
    await redis.set(idempotencyKey, state, 'KEEPTTL');
  }
}
