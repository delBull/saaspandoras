import crypto from 'crypto';
import { db } from '@/db';
import { integrationClients, integrationPermissionEnum } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Service to handle Integration Key Logic
 * - Hashing (SHA256)
 * - Verification
 * - Environment Enforcement
 */
export class IntegrationKeyService {
    /**
     * Generates a secure API Key and its Hash
     * Format: pk_{env}_{random_hex}
     */
    static generateKey(env: 'staging' | 'production'): { key: string, hash: string, fingerprint: string } {
        const prefix = env === 'production' ? 'pk_live_' : 'pk_test_';
        const randomPart = crypto.randomBytes(24).toString('hex');
        const key = `${prefix}${randomPart}`;

        // Hash using SHA256
        const hash = crypto.createHash('sha256').update(key).digest('hex');

        // Fingerprint: first 8 chars of the key (safe to log)
        const fingerprint = key.substring(0, 12) + '...';

        return { key, hash, fingerprint };
    }

    /**
     * Hashes a raw key for comparison
     */
    static hashKey(rawKey: string): string {
        return crypto.createHash('sha256').update(rawKey).digest('hex');
    }

    /**
     * Validates an API Key and returns the Client if valid
     * Enforces:
     * 1. Existence
     * 2. Active Status
     * 3. Environment Match (Key Env vs Client Env)
     * 4. Not Revoked
     */
    static async validateKey(rawKey: string) {
        const hash = this.hashKey(rawKey);

        // 1. Determine environment from key prefix
        const isProdKey = rawKey.startsWith('pk_live_');
        const isTestKey = rawKey.startsWith('pk_test_');

        if (!isProdKey && !isTestKey) return null; // Invalid format

        // 2. Lookup Client
        const client = await db.query.integrationClients.findFirst({
            where: eq(integrationClients.apiKeyHash, hash)
        });

        if (!client) return null;

        // 3. Security Checks
        if (!client.isActive) return null;
        if (client.revokedAt) return null;

        // 4. Strict Environment Enforcement
        // A Staging Key MUST belong to a Staging Client
        // A Production Key MUST belong to a Production Client
        const keyEnv = isProdKey ? 'production' : 'staging';
        if (client.environment !== keyEnv) {
            console.warn(`[SECURITY] Integration Key Environment Mismatch! Key: ${keyEnv}, Client: ${client.environment}, ID: ${client.id}`);
            return null;
        }

        // 5. Update Usage Stats (Async, fire and forget)
        await db.update(integrationClients)
            .set({ lastUsedAt: new Date() })
            .where(eq(integrationClients.id, client.id));

        return client;
    }
}
