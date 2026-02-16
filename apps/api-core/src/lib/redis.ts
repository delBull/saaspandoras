import { Redis } from 'ioredis';

// Singleton Redis client
let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        const redisUrl = process.env.REDIS_URL;
        
        if (!redisUrl) {
            console.warn('⚠️ REDIS_URL not configured - Session management will use fallback mode');
            // Return a mock Redis for development
            redis = new Redis({
                maxRetriesPerRequest: 0,
                enableOfflineQueue: false,
                lazyConnect: true,
            });
            return redis;
        }

        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times: number) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError(err: Error) {
                const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
                if (targetErrors.some(e => err.message.includes(e))) {
                    return true;
                }
                return false;
            }
        });

        redis.on('connect', () => {
            console.log('✅ Redis connected');
        });

        redis.on('error', (err: Error) => {
            console.error('❌ Redis error:', err.message);
        });
    }

    return redis;
}

// Close Redis connection
export async function closeRedis() {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}
