import { v4 as uuidv4 } from 'uuid';
import { getRedis } from './redis.js';
import crypto from 'crypto';
import { db } from './db.js';
import { sessions, securityEvents } from '../db/schema.js';
import { eq, and, isNull, gt } from 'drizzle-orm';

// Constants
const SESSION_PREFIX = 'session:';
const REFRESH_PREFIX = 'refresh:';
const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// Hash token for secure storage
async function hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export interface SessionData {
    sid: string;
    userId: string;
    address: string | null;
    hasAccess: boolean;
    scope: string;
    createdAt: number;
    lastSeenAt: number;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    sid: string;
    expiresIn: number; // seconds
}

/**
 * Create a new session with rotating refresh tokens
 */
export async function createSession(
    userId: string,
    address: string | null = null,
    hasAccess: boolean = false,
    scope: string = 'web',
    metadata: { ip?: string; userAgent?: string } = {}
): Promise<TokenPair> {
    const redis = getRedis();

    const sid = uuidv4();
    const accessToken = uuidv4();
    const refreshToken = uuidv4();

    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL * 1000);

    // 1. Store in PostgreSQL for persistence and revocation
    try {
        await db.insert(sessions).values({
            id: sid,
            userId,
            scope,
            ip: metadata.ip,
            userAgent: metadata.userAgent,
            expiresAt,
        });

        // Log security event
        await db.insert(securityEvents).values({
            userId,
            type: 'LOGIN',
            ip: metadata.ip,
            userAgent: metadata.userAgent,
            metadata: { scope, sid }
        });
    } catch (e) {
        console.error("❌ Failed to persist session in DB:", e);
    }

    const sessionData: SessionData = {
        sid,
        userId,
        address: address ? address.toLowerCase() : null,
        hasAccess,
        scope,
        createdAt: Date.now(),
        lastSeenAt: Date.now()
    };

    // 2. Store in Redis for high-speed validation
    await redis.setex(
        `${SESSION_PREFIX}${accessToken}`,
        ACCESS_TOKEN_TTL,
        JSON.stringify(sessionData)
    );

    // Store refresh token mapping (hashed)
    const refreshHash = await hashToken(refreshToken);
    await redis.setex(
        `${REFRESH_PREFIX}${refreshHash}`,
        REFRESH_TOKEN_TTL,
        sid
    );

    console.log(`✅ Session ${sid} created for user ${userId} [${scope}]`);

    return {
        accessToken,
        refreshToken,
        sid,
        expiresIn: ACCESS_TOKEN_TTL
    };
}

/**
 * Get session data from access token
 */
export async function getSession(accessToken: string): Promise<SessionData | null> {
    const redis = getRedis();

    const data = await redis.get(`${SESSION_PREFIX}${accessToken}`);
    if (!data) {
        return null;
    }

    const sessionData: SessionData = JSON.parse(data);

    // Verify session is still valid in DB (not revoked or expired)
    const sessionRecord = await db.query.sessions.findFirst({
        where: and(
            eq(sessions.id, sessionData.sid),
            isNull(sessions.revokedAt),
            gt(sessions.expiresAt, new Date())
        )
    });

    if (!sessionRecord) {
        console.warn(`⚠️ Session ${sessionData.sid} found in Redis but invalid in DB (revoked or expired).`);
        // Clean up Redis entry for consistency
        await redis.del(`${SESSION_PREFIX}${accessToken}`);
        return null;
    }

    // Update last seen
    sessionData.lastSeenAt = Date.now();
    await redis.setex(
        `${SESSION_PREFIX}${accessToken}`,
        ACCESS_TOKEN_TTL,
        JSON.stringify(sessionData)
    );

    return sessionData;
}

/**
 * Rotate refresh token - invalidates old token and creates new pair
 * This provides replay attack protection
 */
export async function rotateRefreshToken(refreshToken: string, metadata: { ip?: string; userAgent?: string } = {}): Promise<TokenPair | null> {
    const redis = getRedis();

    const refreshHash = await hashToken(refreshToken);
    const sid = await redis.get(`${REFRESH_PREFIX}${refreshHash}`);

    if (!sid) {
        console.warn('⚠️ Invalid refresh token attempted');
        return null;
    }

    // Verify sid is still valid in DB (not revoked)
    const sessionRecord = await db.query.sessions.findFirst({
        where: and(
            eq(sessions.id, sid),
            isNull(sessions.revokedAt),
            gt(sessions.expiresAt, new Date())
        )
    });

    if (!sessionRecord) {
        console.warn(`⚠️ Attempted refresh for revoked or expired sid: ${sid}`);
        return null;
    }

    // Find current active session in Redis to get data
    // (A bit hacky without a sid -> accessToken reverse map in Redis, but doable via scan or just re-resolving user)
    // Actually, we can just re-create it from sessionRecord

    // Invalidate old refresh token
    await redis.del(`${REFRESH_PREFIX}${refreshHash}`);

    // Create new pair
    return createSession(
        sessionRecord.userId,
        null, // We don't have address here unless we lookup user, but userId is enough
        false, // hasAccess will be checked via guard
        sessionRecord.scope,
        metadata
    );
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(accessToken: string, refreshToken?: string): Promise<void> {
    const redis = getRedis();

    const data = await redis.get(`${SESSION_PREFIX}${accessToken}`);
    if (data) {
        const sessionData: SessionData = JSON.parse(data);
        await revokeSessionBySid(sessionData.sid, 'LOGOUT');
        await redis.del(`${SESSION_PREFIX}${accessToken}`);
    }

    if (refreshToken) {
        const refreshHash = await hashToken(refreshToken);
        await redis.del(`${REFRESH_PREFIX}${refreshHash}`);
    }
}

/**
 * Revoke session by Sid
 */
export async function revokeSessionBySid(sid: string, reason: string = 'REVOKED'): Promise<void> {
    await db.update(sessions)
        .set({ revokedAt: new Date(), revokedReason: reason })
        .where(eq(sessions.id, sid));

    // Note: We'd need to clear Redis access tokens as well. 
    // Since we don't have sid -> accessToken map, 
    // the getSession guard (DB check) will handle it on next request.
}

/**
 * Invalidate all sessions for an address (legacy)
 */
export async function invalidateAllSessions(address: string): Promise<void> {
    const redis = getRedis();
    const sessionKeys = await redis.keys(`${SESSION_PREFIX}:*`);

    for (const key of sessionKeys) {
        const data = await redis.get(key);
        if (data) {
            const parsed: SessionData = JSON.parse(data);
            if (parsed.address && parsed.address.toLowerCase() === address.toLowerCase()) {
                await revokeSessionBySid(parsed.sid, 'LOGOUT_ALL');
                await redis.del(key);
            }
        }
    }
}

/**
 * Invalidate all sessions for a specific userId
 */
export async function invalidateAllSessionsByUserId(userId: string): Promise<void> {
    const redis = getRedis();
    const sessionKeys = await redis.keys(`${SESSION_PREFIX}:*`);

    for (const key of sessionKeys) {
        const data = await redis.get(key);
        if (data) {
            const parsed: SessionData = JSON.parse(data);
            if (parsed.userId === userId) {
                await revokeSessionBySid(parsed.sid, 'LOGOUT_ALL');
                await redis.del(key);
            }
        }
    }
}

/**
 * Invalidate all sessions for a specific userId and scope
 */
export async function invalidateAllSessionsByScope(userId: string, scope: string): Promise<void> {
    const redis = getRedis();
    const sessionKeys = await redis.keys(`${SESSION_PREFIX}:*`);

    for (const key of sessionKeys) {
        const data = await redis.get(key);
        if (data) {
            const parsed: SessionData = JSON.parse(data);
            if (parsed.userId === userId && parsed.scope === scope) {
                await revokeSessionBySid(parsed.sid, `LOGOUT_${scope.toUpperCase()}`);
                await redis.del(key);
            }
        }
    }
}

/**
 * Check if session exists and is valid
 */
export async function validateSession(accessToken: string): Promise<boolean> {
    const session = await getSession(accessToken);
    return session !== null;
}
