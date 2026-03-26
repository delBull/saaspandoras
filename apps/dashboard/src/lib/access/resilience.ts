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
  private isRedisHealthy = true;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    if (process.env.REDIS_URL) {
        try {
            this.redis = new Redis(process.env.REDIS_URL, { 
                maxRetriesPerRequest: 1,
                connectTimeout: 500, // Fail fast if unreachable
                commandTimeout: 500,
                lazyConnect: true // Don't block startup
            });
            this.redis.on('error', (err) => {
                console.error("🚫 [Redis] Connection Error:", err.message);
                this.isRedisHealthy = false;
            });
            this.redis.on('connect', () => {
                this.isRedisHealthy = true;
                console.log("✅ [Redis] Connected to Resilience Layer");
            });
        } catch (e) {
            console.error("🚫 [Redis] Initialization Failed:", e);
        }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. Try Local first (L1)
    const entry = this.local.get(key);
    if (entry && Date.now() < entry.expires) return entry.data as T;

    // 2. Try Redis (L2)
    if (this.redis && this.isRedisHealthy) {
        try {
            const val = await this.redis.get(key);
            if (val) return JSON.parse(val) as T;
        } catch (e) { 
            console.error("Redis Cache Get Error", e);
            // Don't kill the instance, just skip for this request
        }
    }
    return null;
  }

  async set(key: string, data: any, ttlSeconds: number = 30): Promise<void> {
    this.local.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
    if (this.redis && this.isRedisHealthy) {
       try { await this.redis.set(key, JSON.stringify(data), 'EX', ttlSeconds); }
       catch (e) { console.error("Redis Cache Set Error", e); }
    }
  }

  // Exposed for rate-limiting to reuse the same singleton connection
  getRedis() { return (this.redis && this.isRedisHealthy) ? this.redis : null; }
}

const globalForCache = globalThis as unknown as { accessCache: GlobalCache };
export const accessCache = globalForCache.accessCache || new GlobalCache();
if (process.env.NODE_ENV !== "production") globalForCache.accessCache = accessCache;

/**
 * 🚫 Distributed Rate Limiter (Stripe Grade Singleton)
 */
export async function isRateLimited(key: string, limit: number = 20, windowMs: number = 60000): Promise<boolean> {
  const redis = accessCache.getRedis();
  
  // FALLBACK TO LOCAL if Redis is unreachable or unconfigured
  if (!redis) {
    return isRateLimitedLocal(key, limit, windowMs);
  }

  try {
     // Use the shared Singleton instance (No new connections per request)
     const count = await withTimeout(redis.incr(key), 300, 1);
     if (count === 1) await redis.expire(key, Math.ceil(windowMs / 1000));
     return count > limit;
  } catch (err) {
     console.error("⚠️ [RateLimit] Redis Error, falling back to Local:", err);
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
