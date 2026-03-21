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
     * Format: {pk|sk}_{live|test}_{random_hex}
     */
    static generateKey(env: 'staging' | 'production', type: 'public' | 'secret' = 'public'): { key: string, hash: string, fingerprint: string } {
        const typePrefix = type === 'public' ? 'pk' : 'sk';
        const envPrefix = env === 'production' ? 'live' : 'test';
        const prefix = `${typePrefix}_${envPrefix}_`;
        
        const randomPart = crypto.randomBytes(24).toString('hex');
        const key = `${prefix}${randomPart}`;

        // Hash using SHA256
        const hash = crypto.createHash('sha256').update(key).digest('hex');

        // Fingerprint: first char sets + ellipsis (safe to log)
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
     * Returns augmented client with type and env
     */
    static async validateKey(rawKey: string) {
        const hash = this.hashKey(rawKey);

        // 1. Determine environment and type from key prefix
        // Format: [pk|sk]_[live|test]_
        const isPublic = rawKey.startsWith('pk_');
        const isSecret = rawKey.startsWith('sk_');
        const isLive = rawKey.includes('_live_');
        const isTest = rawKey.includes('_test_');

        if (!(isPublic || isSecret) || !(isLive || isTest)) {
            console.warn(`[SECURITY] Invalid API Key format attempt: ${rawKey.substring(0, 12)}...`);
            return null;
        }

        const keyType = isPublic ? 'public' : 'secret';
        const keyEnv = isLive ? 'production' : 'staging';

        // 2. Lookup Client
        const client = await db.query.integrationClients.findFirst({
            where: eq(integrationClients.apiKeyHash, hash)
        });

        if (!client) return null;

        // 3. Security Checks
        if (!client.isActive || client.revokedAt) return null;

        // 4. Strict Environment Enforcement
        if (client.environment !== keyEnv) {
            console.warn(`[SECURITY] Integration Key Environment Mismatch! KeyEnv: ${keyEnv}, ClientEnv: ${client.environment}, ID: ${client.id}`);
            return null;
        }

        // 5. Update Usage Stats
        await db.update(integrationClients)
            .set({ lastUsedAt: new Date() })
            .where(eq(integrationClients.id, client.id));

        return {
            ...client,
            keyType,
            keyEnv
        };
    }

    /**
     * Ensures a project has an API key for the given environment.
     * Returns the existing key (if available as fingerprint) or a new one.
     */
    static async ensureKeyForProject(projectId: number, env: 'staging' | 'production', clientName?: string) {
        // 1. Check for existing active client for this project/env
        const existing = await db.query.integrationClients.findFirst({
            where: (clients, { and, eq, isNull }) => and(
                eq(clients.projectId, projectId),
                eq(clients.environment, env),
                eq(clients.isActive, true),
                isNull(clients.revokedAt)
            )
        });

        if (existing) {
            return {
                id: existing.id,
                fingerprint: existing.keyFingerprint,
                isNew: false
            };
        }

        // 2. Generate new key
        const { key, hash, fingerprint } = this.generateKey(env);

        // 3. Save to DB
        const [inserted] = await db.insert(integrationClients).values({
            name: clientName || `Project ${projectId} - ${env}`,
            projectId,
            environment: env,
            apiKeyHash: hash,
            keyFingerprint: fingerprint,
            isActive: true,
            permissions: ['read', 'deploy'] // Default permissions
        }).returning();

        if (!inserted) {
            throw new Error('Failed to create integration client');
        }

        return {
            id: inserted.id,
            key, // THIS IS THE ONLY TIME WE SHOW THE RAW KEY
            fingerprint,
            isNew: true
        };
    }
}
