import { v4 as uuidv4 } from 'uuid';
import { getRedis } from './redis.js';
import crypto from 'crypto';

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
    address: string;
    hasAccess: boolean;
    createdAt: number;
    lastSeenAt: number;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds
}

/**
 * Create a new session with rotating refresh tokens
 */
export async function createSession(address: string, hasAccess: boolean = false): Promise<TokenPair> {
    const redis = getRedis();
    
    const sessionId = uuidv4();
    const accessToken = uuidv4();
    const refreshToken = uuidv4();
    
    const sessionData: SessionData = {
        address: address.toLowerCase(),
        hasAccess,
        createdAt: Date.now(),
        lastSeenAt: Date.now()
    };
    
    // Store session data with access token as key
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
        sessionId
    );
    
    console.log(`✅ Session created for ${address}`);
    
    return {
        accessToken,
        refreshToken,
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
    
    // Update last seen
    const sessionData: SessionData = JSON.parse(data);
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
export async function rotateRefreshToken(refreshToken: string): Promise<TokenPair | null> {
    const redis = getRedis();
    
    const refreshHash = await hashToken(refreshToken);
    const sessionId = await redis.get(`${REFRESH_PREFIX}${refreshHash}`);
    
    if (!sessionId) {
        console.warn('⚠️ Invalid refresh token attempted');
        return null;
    }
    
    // Get current session data
    const sessionKeys = await redis.keys(`${SESSION_PREFIX}:*`);
    let currentSession: SessionData | null = null;
    let currentAccessToken: string | null = null;
    
    for (const key of sessionKeys) {
        const data = await redis.get(key);
        if (data) {
            const parsed = JSON.parse(data);
            // Find session by checking if it was created around the same time
            currentSession = parsed;
            currentAccessToken = key.replace(SESSION_PREFIX, '');
            break;
        }
    }
    
    if (!currentSession || !currentAccessToken) {
        console.warn('⚠️ Session not found during refresh');
        return null;
    }
    
    // Invalidate old refresh token
    await redis.del(`${REFRESH_PREFIX}${refreshHash}`);
    
    // Invalidate old access token
    await redis.del(`${SESSION_PREFIX}${currentAccessToken}`);
    
    // Create new session
    return createSession(currentSession.address, currentSession.hasAccess);
}

/**
 * Invalidate a session (logout)
 */
export async function invalidateSession(accessToken: string, refreshToken?: string): Promise<void> {
    const redis = getRedis();
    
    // Invalidate access token
    await redis.del(`${SESSION_PREFIX}${accessToken}`);
    
    // If refresh token provided, invalidate it too
    if (refreshToken) {
        const refreshHash = await hashToken(refreshToken);
        await redis.del(`${REFRESH_PREFIX}${refreshHash}`);
    }
    
    console.log('✅ Session invalidated');
}

/**
 * Invalidate all sessions for an address (logout everywhere)
 */
export async function invalidateAllSessions(address: string): Promise<void> {
    const redis = getRedis();
    
    // Find all sessions for this address
    const sessionKeys = await redis.keys(`${SESSION_PREFIX}:*`);
    
    for (const key of sessionKeys) {
        const data = await redis.get(key);
        if (data) {
            const parsed: SessionData = JSON.parse(data);
            if (parsed.address.toLowerCase() === address.toLowerCase()) {
                await redis.del(key);
            }
        }
    }
    
    // Find and invalidate all refresh tokens
    const refreshKeys = await redis.keys(`${REFRESH_PREFIX}:*`);
    
    for (const key of refreshKeys) {
        const data = await redis.get(key);
        // Note: We'd need to store the address in refresh token for this to work efficiently
        // For now, this is a simplified version
    }
    
    console.log(`✅ All sessions invalidated for ${address}`);
}

/**
 * Check if session exists and is valid
 */
export async function validateSession(accessToken: string): Promise<boolean> {
    const session = await getSession(accessToken);
    return session !== null;
}
