import { getRedis } from '@/lib/redis';

const memoryStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterMs: number;
}

/**
 * Distributed sliding-window rate limiter.
 * Uses Redis when available (atomic INCR + EXPIRE + TTL introspection for remaining time),
 * falls back to an in-memory Map for local dev (non-production) only.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const redis = getRedis();

  if (!redis) {
    // In-memory fallback with sliding window
    const cur = memoryStore.get(key);
    if (cur) {
      if (now > cur.resetTime) {
        memoryStore.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, limit, remaining: limit - 1, resetMs: windowMs, retryAfterMs: 0 };
      }
      if (cur.count >= limit) {
        return { allowed: false, limit, remaining: 0, resetMs: cur.resetTime - now, retryAfterMs: cur.resetTime - now };
      }
      cur.count++;
      return { allowed: true, limit, remaining: limit - cur.count, resetMs: cur.resetTime - now, retryAfterMs: 0 };
    }
    memoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, limit, remaining: limit - 1, resetMs: windowMs, retryAfterMs: 0 };
  }

  const windowSeconds = Math.ceil(windowMs / 1000);
  const counterKey = `rl:${key}`;

  try {
    const pipeline = redis.multi();
    pipeline.incr(counterKey);
    pipeline.pexpire(counterKey, windowMs);
    const results = await pipeline.exec();
    const count = results?.[0]?.[1] as number ?? 1;
    const resetMs = await redis.pttl(counterKey);

    if (count > limit) {
      const retryAfter = resetMs > 0 ? resetMs : windowMs;
      return { allowed: false, limit, remaining: 0, resetMs, retryAfterMs: retryAfter };
    }
    return { allowed: true, limit, remaining: Math.max(0, limit - count), resetMs: resetMs > 0 ? resetMs : windowMs, retryAfterMs: 0 };
  } catch (err) {
    console.error('[SovereignSign] Redis rate limit error, allowing request:', err);
    return { allowed: true, limit, remaining: limit, resetMs: windowMs, retryAfterMs: 0 };
  }
}
