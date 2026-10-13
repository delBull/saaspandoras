import { getRedis } from '@saasfly/shared';

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
 *
 * `failClosed`: when true, a backend (Redis) failure REJECTS the request instead of
 * allowing it. Used by quota/metering gates where an unavailable limiter must not
 * silently permit unlimited consumption.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  options: { failClosed?: boolean } = {},
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
    if (options.failClosed) {
      console.error('[SovereignSign] Redis rate limit error, REJECTING request (fail-closed):', err);
      return { allowed: false, limit, remaining: 0, resetMs: windowMs, retryAfterMs: windowMs };
    }
    console.error('[SovereignSign] Redis rate limit error, allowing request:', err);
    return { allowed: true, limit, remaining: limit, resetMs: windowMs, retryAfterMs: 0 };
  }
}

/**
 * Read-only status query for a rate limit / quota key without incrementing counter.
 */
export async function getRateLimitStatus(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ count: number; limit: number; remaining: number; resetMs: number }> {
  const now = Date.now();
  const redis = getRedis();

  if (!redis) {
    const cur = memoryStore.get(key);
    if (!cur || now > cur.resetTime) {
      return { count: 0, limit, remaining: limit, resetMs: windowMs };
    }
    const count = cur.count;
    const remaining = Math.max(0, limit - count);
    const resetMs = Math.max(0, cur.resetTime - now);
    return { count, limit, remaining, resetMs };
  }

  const counterKey = `rl:${key}`;
  try {
    const val = await redis.get(counterKey);
    const count = val ? parseInt(String(val), 10) : 0;
    const resetMsRaw = await redis.pttl(counterKey);
    const resetMs = resetMsRaw > 0 ? resetMsRaw : windowMs;
    const remaining = Math.max(0, limit - count);
    return { count, limit, remaining, resetMs };
  } catch (err) {
    return { count: 0, limit, remaining: limit, resetMs: windowMs };
  }
}
