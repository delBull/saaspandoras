import { Redis } from 'ioredis';

/**
 * 🧱 RESILIENCE LAYER
 * ============================================================================
 * Stripe-Tier safeguards for critical paths.
 * ============================================================================
 */

/**
 * ⏱️ Execution Timeout Wrapper
 * Prevents hanging RPC/DB calls from blocking the request.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 500,
  fallback?: T
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (fallback !== undefined) {
        resolve(fallback);
      } else {
        reject(new Error(`Timeout: Operation exceeded ${ms}ms`));
      }
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * 🛡️ Circuit Breaker Pattern
 * Tracks failure rates to avoid saturating degraded services.
 */
export class CircuitBreaker {
    private failures = 0;
    private lastFailure = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    
    constructor(
        private threshold: number = 5, 
        private timeoutMs: number = 30000
    ) {}

    isOpen(): boolean {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailure > this.timeoutMs) {
                this.state = 'HALF_OPEN';
                return false;
            }
            return true;
        }
        return false;
    }

    recordFailure() {
        this.failures++;
        this.lastFailure = Date.now();
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
        }
    }

    recordSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }
}

// Singletons for key services
export const dbBreaker = new CircuitBreaker(10, 60000);
export const rpcBreaker = new CircuitBreaker(5, 30000);

/**
 * 🧊 Distributed Cache (Stripe Grade)
 * Uses Redis if available, falls back to in-memory singleton.
 */
class GlobalCache {
  private local = new Map<string, { data: any; expires: number }>();
  private redis: Redis | null = null;

  constructor() {
    if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. Try Local first (L1)
    const entry = this.local.get(key);
    if (entry && Date.now() < entry.expires) return entry.data as T;

    // 2. Try Redis (L2)
    if (this.redis) {
        try {
            const val = await this.redis.get(key);
            if (val) return JSON.parse(val) as T;
        } catch (e) { 
            console.error("Redis Cache Get Error", e);
            this.redis = null; // Fault tolerance
        }
    }
    return null;
  }

  async set(key: string, data: any, ttlSeconds: number = 30): Promise<void> {
    this.local.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
    if (this.redis) {
       try { await this.redis.set(key, JSON.stringify(data), 'EX', ttlSeconds); }
       catch (e) { 
           console.error("Redis Cache Set Error", e);
           this.redis = null;
       }
    }
  }
}

const globalForCache = globalThis as unknown as { accessCache: GlobalCache };
export const accessCache = globalForCache.accessCache || new GlobalCache();
if (process.env.NODE_ENV !== "production") globalForCache.accessCache = accessCache;

/**
 * 🚫 Distributed Rate Limiter
 */
export async function isRateLimited(key: string, limit: number = 10, windowMs: number = 60000): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return isRateLimitedLocal(key, limit, windowMs);
  }

  try {
     const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
     const count = await redis.incr(key);
     if (count === 1) await redis.expire(key, Math.ceil(windowMs / 1000));
     await redis.quit(); // Short-lived connection for stateless limiter
     return count > limit;
  } catch {
     return isRateLimitedLocal(key, limit, windowMs);
  }
}

const localRateLimitMap = new Map<string, { count: number; lastReset: number }>();
function isRateLimitedLocal(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = localRateLimitMap.get(key) || { count: 0, lastReset: now };
  if (now - entry.lastReset > windowMs) {
    entry.count = 1;
    entry.lastReset = now;
  } else {
    entry.count++;
  }
  localRateLimitMap.set(key, entry);
  return entry.count > limit;
}
