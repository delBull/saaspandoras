import { Redis } from 'ioredis';

let redis: Redis | null = null;
let redisHealthy = false;

export function getRedis(): Redis | null {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('⚠️ REDIS_URL not configured — rate limiting uses in-memory fallback');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err: Error) {
        return err.message.includes('READONLY') ||
               err.message.includes('ECONNRESET') ||
               err.message.includes('ETIMEDOUT');
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on('connect', () => {
      redisHealthy = true;
      console.log('✅ Redis connected for rate limiting');
    });

    redis.on('error', (err: Error) => {
      redisHealthy = false;
      console.error('❌ Redis error:', err.message);
    });

    redis.on('close', () => {
      redisHealthy = false;
    });

    return redis;
  } catch (e) {
    console.error('❌ Redis initialization failed:', e);
    redisHealthy = false;
    return null;
  }
}

export function isRedisHealthy(): boolean {
  return redisHealthy && redis !== null;
}

export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    redisHealthy = false;
  }
}
