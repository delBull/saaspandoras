type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * In-memory sliding window rate limiter.
 * In serverless environments, this serves as an active anti-abuse throttle per node.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter(t => now - t < windowMs);

  const oldest = bucket.hits[0] ?? now;
  const resetSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: resetSeconds,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (b.hits.every(t => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    limit,
    remaining: Math.max(0, limit - bucket.hits.length),
    resetSeconds,
  };
}

/**
 * Tenant-scoped rate limit (default 120 req / min)
 */
export function checkTenantRateLimit(
  tenantId: string,
  limit = 120,
  windowMs = 60_000
): RateLimitResult {
  return checkRateLimit(`tenant:${tenantId}`, limit, windowMs);
}

/**
 * Tenant + Channel scoped rate limit (e.g. telegram, whatsapp, web)
 */
export function checkChannelRateLimit(
  tenantId: string,
  channel: string,
  limit = 60,
  windowMs = 60_000
): RateLimitResult {
  return checkRateLimit(`tenant:${tenantId}:channel:${channel}`, limit, windowMs);
}

/**
 * Standard X-RateLimit-* headers constructor
 */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetSeconds.toString(),
  };
  if (!result.allowed) {
    headers['Retry-After'] = result.retryAfterSeconds.toString();
  }
  return headers;
}

export function clientIpFromHeaders(headers: Headers): string {
  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
