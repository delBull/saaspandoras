import { Router, type Request, type Response } from "express";
import { verifySignature } from "thirdweb/auth";
import { client } from "../lib/thirdweb-client.js";
import { db } from "../lib/db.js";
import { authChallenges, users, sessions, accountRecoveryTokens, securityEvents } from "../db/schema.js";
import { eq, and, gt, isNull } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import crypto from "crypto";
import { createSession, getSession, rotateRefreshToken, invalidateSession } from "../lib/session.js";
import { getGateHolderStatus } from "../lib/nft-cache.js";
import { authLimiter, nonceLimiter, refreshLimiter } from "../middleware/rate-limit.js";
import { checkTenantAccess, getTenantId } from "../middleware/tenant-gate.js";

const router = Router();

// ── Telegram initData HMAC Validation ─────────────────────────────────────────
// Based on: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Validate Telegram Mini App initData using HMAC-SHA256.
 * Returns the parsed user data if valid, null otherwise.
 *
 * Algorithm (from Telegram docs):
 * 1. Sort data_check_string by key
 * 2. Compute HMAC-SHA256(secret=sha256(bot_token), message=data_check_string)
 * 3. Compare with hash from initData
 */
export function validateTelegramInitData(initData: string): {
  user?: { id: number; first_name: string; username?: string; photo_url?: string };
  referralId?: string;
} | null {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[TelegramAuth] TELEGRAM_BOT_TOKEN not set — skipping HMAC validation');
    return null;
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    // Remove hash from params for check string
    params.delete('hash');

    // Sort params and build check string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Compute HMAC: secret = SHA256(bot_token), message = data_check_string
    const secret = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
    const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

    if (hmac !== hash) {
      console.warn('[TelegramAuth] HMAC mismatch — invalid initData');
      return null;
    }

    // Parse user from initData
    const userStr = params.get('user');
    const user = userStr ? JSON.parse(userStr) : undefined;

    // Extract referral from start_param
    const referralId = params.get('start_param') || undefined;

    return { user, referralId };
  } catch (err) {
    console.error('[TelegramAuth] initData validation error:', err);
    return null;
  }
}

// GET /auth/nonce - with rate limiting
router.get("/nonce", nonceLimiter, async (req: Request, res: Response) => {
    try {
        const { address } = req.query;
        if (!address || typeof address !== "string") {
            return res.status(400).json({ error: "Missing address" });
        }

        const nonce = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 5);

        await db.insert(authChallenges).values({
            address: address,
            nonce: nonce,
            expiresAt: expiresAt,
        }).onConflictDoUpdate({
            target: authChallenges.address,
            set: {
                nonce: nonce,
                expiresAt: expiresAt,
                address: address
            }
        });

        return res.status(200).json({ nonce });
    } catch (error) {
        console.error("Nonce Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /auth/login - with rate limiting
router.post("/login", authLimiter, async (req: Request, res: Response) => {
    console.log("🔐 [LOGIN] ========== REQUEST RECEIVED ==========");
    console.log("🔐 [LOGIN] Body keys:", Object.keys(req.body));
    console.log("🔐 [LOGIN] Origin:", req.headers.origin);

    try {
        const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
        if (!PRIVATE_KEY) {
            console.error("❌ CRITICAL: JWT_PRIVATE_KEY not set");
            return res.status(500).json({ error: "Configuration Error" });
        }

        const privateKey = Buffer.from(PRIVATE_KEY, "base64").toString("utf-8");
        const { payload, signature } = req.body;

        console.log("🔹 Login Request Received");

        if (!payload || !signature) {
            console.error("❌ Missing payload or signature");
            return res.status(400).json({ error: "Missing payload or signature" });
        }

        const {
            domain,
            address: payloadAddress,
            executionAddress,
            nonce,
            expirationTime,
            message: messageString
        } = payload;

        if (!domain || !payloadAddress || !nonce) {
            console.error("❌ Missing required SIWE fields: domain, address, or nonce");
            return res.status(400).json({ error: "Invalid SIWE payload" });
        }

        console.log(`🔐 Login Attempt: ${payloadAddress}`);
        if (executionAddress) {
            console.log(`📱 Execution Address (Smart Wallet): ${executionAddress}`);
        }
        console.log(`📦 Payload Domain: ${domain}, Setup Domain: ${config.domain}`);

        if (!messageString) {
            console.error("❌ Missing SIWE message in payload");
            return res.status(400).json({ error: "Missing SIWE message" });
        }

        // Allow any localhost port in development
        const isLocalhost = config.domain.startsWith('localhost') && domain.startsWith('localhost');
        if (domain !== config.domain && !isLocalhost) {
            console.error(`❌ Domain mismatch: Received ${domain}, Expected ${config.domain}`);
            return res.status(401).json({ error: "Invalid domain" });
        }

        const now = new Date();
        const expirationDate = new Date(expirationTime);
        if (now > expirationDate) {
            console.error(`❌ Token expired: ${expirationDate}`);
            return res.status(401).json({ error: "Expired signature" });
        }

        const isValid = await verifySignature({
            client,
            message: messageString,
            signature,
            address: payloadAddress,
        });

        if (!isValid) {
            console.error(`❌ [LOGIN] FAIL: Invalid Signature for ${payloadAddress}`);
            return res.status(401).json({ error: "Invalid signature" });
        }
        console.log("✅ [LOGIN] Step 3: Signature verified");

        if (!messageString.includes(nonce)) {
            console.error(`❌ Nonce mismatch in message string`);
            return res.status(401).json({ error: "Nonce mismatch in message" });
        }

        const messageDomainMatch = isLocalhost ? messageString.includes('localhost') : messageString.includes(config.domain);
        if (!messageDomainMatch) {
            console.error(`❌ Domain mismatch in message string: Expected ${config.domain}`);
            return res.status(401).json({ error: "Domain mismatch in message" });
        }

        console.log(`🔎 Query Params - Nonce: ${nonce} (${typeof nonce}), Address: ${payloadAddress} (${typeof payloadAddress}), Now: ${now} (${typeof now})`);

        const challenge = await db.query.authChallenges.findFirst({
            where: and(
                eq(authChallenges.nonce, nonce),
                eq(authChallenges.address, payloadAddress),
                gt(authChallenges.expiresAt, now)
            )
        });

        if (!challenge) {
            console.error(`❌ [LOGIN] FAIL: Nonce not found or expired in DB: ${nonce}`);
            return res.status(401).json({ error: "Invalid or expired nonce" });
        }
        console.log("✅ [LOGIN] Step 4: Nonce validated");

        await db.delete(authChallenges).where(eq(authChallenges.nonce, nonce));

        // Gate Check - WITH CACHING
        const hasAccess = await getGateHolderStatus(payloadAddress);
        console.log(`🔐 [LOGIN] Gate Check: ${hasAccess ? 'GRANTED' : 'DENIED'}`);

        // 🔍 Resolve Identity (Unified Source of Truth)
        const walletAddress = payloadAddress.toLowerCase();
        let userRecord = await db.query.users.findFirst({
            where: eq(users.walletAddress, walletAddress)
        });

        let userId = "";
        // const now = new Date(); // 'now' is already defined above

        if (userRecord) {
            userId = userRecord.id;
            await db.update(users)
                .set({
                    updatedAt: now
                })
                .where(eq(users.id, userId));
        } else {
            userId = crypto.randomUUID();
            await db.insert(users).values({
                id: userId,
                walletAddress,
                createdAt: now,
                updatedAt: now,
                status: 'ACTIVE'
            });
            console.log(`🆕 User created via Wallet: ${userId} (${walletAddress})`);
        }

        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
        const userAgent = req.headers['user-agent'] as string;

        const tokens = await createSession(userId, walletAddress, hasAccess, 'web', { ip, userAgent });

        const jwtToken = jwt.sign({
            sub: userId,
            sid: tokens.sid,
            address: walletAddress,
            role: userRecord?.role || 'user',
            hasAccess,
            v: 1,
            iat: Math.floor(Date.now() / 1000),
        }, privateKey, {
            algorithm: "RS256",
            expiresIn: "24h"
        });

        const isProd = process.env.NODE_ENV === "production";
        const isRequestingLocalhost = req.headers.origin?.includes("localhost") || req.get('host')?.includes("localhost");

        // CRITICAL: Explicitly use .pandoras.finance for cross-subdomain support in prod
        // Omit domain for localhost to allow browser to accept it.
        const cookieDomain = isRequestingLocalhost ? undefined : (process.env.COOKIE_DOMAIN || ".pandoras.finance");

        const cookieOptions: any = {
            httpOnly: true,
            secure: isRequestingLocalhost ? false : true,
            sameSite: isRequestingLocalhost ? "lax" : "none",
            domain: cookieDomain,
            path: "/",
        };

        console.log(`🍪 [LOGIN] Setting cookies - Domain: ${cookieDomain} | Secure: ${cookieOptions.secure} | SameSite: ${cookieOptions.sameSite}`);

        res.cookie("access_token", tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie("refresh_token", tokens.refreshToken, {
            ...cookieOptions,
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.cookie("auth_token", jwtToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });

        console.log("✅ [LOGIN] SUCCESS: Session created for", payloadAddress, "| hasAccess:", hasAccess);
        return res.status(200).json({
            success: true,
            hasAccess,
            expiresIn: tokens.expiresIn
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /auth/refresh - with rate limiting
router.post("/refresh", refreshLimiter, async (req: Request, res: Response) => {
    console.log("🔄 [REFRESH] ========== REQUEST RECEIVED ==========");

    try {
        const refreshToken = req.cookies.refresh_token;

        if (!refreshToken) {
            console.warn("⚠️ [REFRESH] No refresh token found");
            return res.status(401).json({ error: "No refresh token" });
        }

        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
        const userAgent = req.headers['user-agent'] as string;
        const newTokens = await rotateRefreshToken(refreshToken, { ip, userAgent });

        if (!newTokens) {
            console.warn("⚠️ [REFRESH] Invalid refresh token");
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        const session = await getSession(newTokens.accessToken);

        if (!session) {
            console.warn("⚠️ [REFRESH] Session not found");
            return res.status(401).json({ error: "Session expired" });
        }

        const isProd = process.env.NODE_ENV === "production";
        const cookieDomain = process.env.COOKIE_DOMAIN || ".pandoras.finance";

        const cookieOptions: any = {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            domain: cookieDomain,
            path: "/",
        };

        res.cookie("access_token", newTokens.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refresh_token", newTokens.refreshToken, {
            ...cookieOptions,
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log("✅ [REFRESH] SUCCESS: Token rotated for", session.userId);

        return res.status(200).json({
            success: true,
            expiresIn: newTokens.expiresIn,
            userId: session.userId,
            address: session.address,
            hasAccess: session.hasAccess
        });

    } catch (error) {
        console.error("Refresh Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /auth/logout
router.post("/logout", async (req: Request, res: Response) => {
    try {
        const accessToken = req.cookies.access_token;
        const refreshToken = req.cookies.refresh_token;

        if (accessToken) {
            await invalidateSession(accessToken, refreshToken);
        }

        const isProd = process.env.NODE_ENV === "production";
        const cookieDomain = process.env.COOKIE_DOMAIN || ".pandoras.finance";

        const cookieOptions: any = {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            domain: cookieDomain,
            path: "/",
        };

        res.clearCookie("access_token", cookieOptions);

        res.clearCookie("refresh_token", {
            ...cookieOptions,
            path: "/auth/refresh",
        });

        res.clearCookie("auth_token", cookieOptions);

        console.log("✅ [LOGOUT] Session invalidated");

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /auth/me
router.get("/me", async (req: Request, res: Response) => {
    try {
        const accessToken = req.cookies.access_token;
        const authToken = req.cookies.auth_token;

        console.log("🔍 [AUTH/ME] Cookies received:", {
            hasAccessToken: !!accessToken,
            hasAuthToken: !!authToken,
            cookieNames: Object.keys(req.cookies)
        });

        let session = null;
        if (accessToken) {
            session = await getSession(accessToken);
            console.log("🔍 [AUTH/ME] Session from access_token:", session ? "FOUND" : "NOT FOUND");
        }

        const token = authToken;
        let decoded = null;

        if (!session && token) {
            try {
                const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;
                if (PUBLIC_KEY) {
                    const publicKey = Buffer.from(PUBLIC_KEY, "base64").toString("utf-8");
                    decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as any;
                    console.log("🔍 [AUTH/ME] Decoded from auth_token:", decoded ? "SUCCESS" : "FAIL");
                }
            } catch (e) {
                console.error("❌ /auth/me JWT verify failed:", e);
            }
        }

        const userId = session?.userId || decoded?.sub;
        const sid = session?.sid || decoded?.sid;

        if (!userId) {
            console.warn("⚠️ [AUTH/ME] Unauthorized: No userId found in session or token");
            return res.status(401).json({ error: "Unauthorized" });
        }

        // 🛡️ Architectural Hardening: Validate Session Status
        if (sid) {
            const sessionRecord = await db.query.sessions.findFirst({
                where: and(
                    eq(sessions.id, sid),
                    isNull(sessions.revokedAt),
                    gt(sessions.expiresAt, new Date())
                )
            });

            if (!sessionRecord) {
                console.warn(`⚠️ [AUTH/ME] Session revoked or expired sid: ${sid}`);
                return res.status(401).json({ error: "Session revoked or expired" });
            }
        }

        // 🔍 Fetch full user profile
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        if (!user) {
            console.warn(`⚠️ [AUTH/ME] User record not found for id: ${userId}`);
            return res.status(401).json({ error: "User not found" });
        }

        // 🛡️ Status Enforcement
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                error: "Identity frozen or in recovery",
                status: user.status
            });
        }

        return res.status(200).json({
            user: {
                id: user.id,
                address: user.walletAddress,
                role: user.role,
                telegramId: user.telegramId,
                email: user.email,
                image: user.image,
                name: user.name,
                hasAccess: session?.hasAccess || decoded?.hasAccess || user.hasPandorasKey,
                status: user.status
            }
        });
    } catch (error) {
        console.error("❌ /auth/me Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /auth/tenant-access - Check tenant-specific access
// Tenant ID is resolved ONLY from header/subdomain (EXP-014 compliance).
// Address is read from body for the check, but tenant scope must NOT come from client.
router.post("/tenant-access", async (req: Request, res: Response) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ error: "Missing address" });
        }

        // Tenant ID from header/subdomain ONLY — never from request body
        const resolvedTenantId = getTenantId(req);

        console.log(`🏢 [TenantAccess] Checking access for ${address} on tenant ${resolvedTenantId}`);

        const result = await checkTenantAccess(address.toLowerCase(), resolvedTenantId);

        console.log(`🏢 [TenantAccess] Result: ${result.hasAccess ? 'GRANTED' : 'DENIED'}`);

        return res.status(200).json({
            hasAccess: result.hasAccess,
            error: result.reason,
            requirements: result.requirements,
            tenantId: resolvedTenantId
        });
    } catch (error) {
        console.error("❌ [TenantAccess] Error:", error);
        // Fail closed - deny access on error (EXP-014 compliance)
        return res.status(500).json({
            hasAccess: false,
            error: 'TENANT_CHECK_FAILED'
        });
    }
});

// POST /auth/logout-all
router.post("/logout-all", async (req: Request, res: Response) => {
    try {
        const accessToken = req.cookies.access_token;
        const session = accessToken ? await getSession(accessToken) : null;

        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { invalidateAllSessionsByUserId } = await import("../lib/session.js");
        await invalidateAllSessionsByUserId(session.userId);

        return res.status(200).json({ success: true, message: "Logged out from all devices" });
    } catch (error) {
        console.error("Logout All Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /auth/logout-scope
router.post("/logout-scope", async (req: Request, res: Response) => {
    try {
        const { scope } = req.body;
        const accessToken = req.cookies.access_token;
        const session = accessToken ? await getSession(accessToken) : null;

        if (!session || !scope) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { invalidateAllSessionsByScope } = await import("../lib/session.js");
        await invalidateAllSessionsByScope(session.userId, scope);

        return res.status(200).json({ success: true, message: `Logged out from all ${scope} sessions` });
    } catch (error) {
        console.error("Logout Scope Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

function requireAdmin(req: Request, res: Response, next: any) {
    try {
        const pubBase64 = process.env.JWT_PUBLIC_KEY;
        if (!pubBase64) {
            return res.status(500).json({ error: 'Auth configuration missing' });
        }
        const publicKey = Buffer.from(pubBase64, 'base64').toString('utf-8');
        const token = (req as any).cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as any;
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        (req as any).user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// ADMIN: POST /admin/users/:id/freeze
router.post("/admin/users/:id/freeze", requireAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        await db.update(users)
            .set({ status: 'FROZEN', updatedAt: new Date() })
            .where(eq(users.id, id));

        const { invalidateAllSessionsByUserId } = await import("../lib/session.js");
        await invalidateAllSessionsByUserId(id);

        await db.insert(securityEvents).values({
            userId: id,
            type: 'USER_FROZEN',
            metadata: { reason }
        });

        return res.status(200).json({ success: true, message: "User identity frozen" });
    } catch (error) {
        console.error("Freeze User Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// ADMIN: POST /admin/users/merge
router.post("/admin/users/merge", requireAdmin, async (req: Request, res: Response) => {
    try {
        const { sourceUserId, targetUserId } = req.body;

        if (!sourceUserId || !targetUserId) {
            return res.status(400).json({ error: "Missing sourceUserId or targetUserId" });
        }

        const sourceUser = await db.query.users.findFirst({ where: eq(users.id, sourceUserId) });
        const targetUser = await db.query.users.findFirst({ where: eq(users.id, targetUserId) });

        if (!sourceUser || !targetUser) {
            return res.status(404).json({ error: "One or both users not found" });
        }

        // 1. Move attributes (if not present in target)
        const updates: any = {};
        if (!targetUser.telegramId && sourceUser.telegramId) updates.telegramId = sourceUser.telegramId;
        if (!targetUser.walletAddress && sourceUser.walletAddress) updates.walletAddress = sourceUser.walletAddress;

        if (Object.keys(updates).length > 0) {
            await db.update(users).set(updates).where(eq(users.id, targetUserId));
        }

        // 2. Revoke all sessions for both
        const { invalidateAllSessionsByUserId } = await import("../lib/session.js");
        await invalidateAllSessionsByUserId(sourceUserId);
        await invalidateAllSessionsByUserId(targetUserId);

        // 3. Deactivate Source User
        await db.update(users)
            .set({ status: 'MERGED', updatedAt: new Date() })
            .where(eq(users.id, sourceUserId));

        // 4. Log event
        await db.insert(securityEvents).values({
            userId: targetUserId,
            type: 'USER_MERGE',
            metadata: { sourceUserId, targetUserId }
        });

        return res.status(200).json({ success: true, message: "Users merged successfully" });
    } catch (error) {
        console.error("Merge Users Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /auth/recovery/request
router.post("/recovery/request", async (req: Request, res: Response) => {
    try {
        const { address, initData } = req.body;
        let userId = "";

        if (address) {
            // Proof via Wallet
            const user = await db.query.users.findFirst({
                where: eq(users.walletAddress, address.toLowerCase())
            });
            if (user) userId = user.id;
        } else if (initData) {
            // Validate Telegram initData via HMAC
            const telegramData = validateTelegramInitData(initData);
            if (telegramData?.user?.id) {
                const telegramId = String(telegramData.user.id);
                const user = await db.query.users.findFirst({
                    where: eq(users.telegramId, telegramId)
                });
                if (user) userId = user.id;
            }
        }

        if (!userId) {
            return res.status(404).json({ error: "User not found" });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        await db.insert(accountRecoveryTokens).values({
            userId,
            tokenHash,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
        });

        // Log event
        await db.insert(securityEvents).values({
            userId,
            type: 'RECOVERY_REQUEST',
            ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string,
            metadata: { method: address ? 'wallet' : 'telegram' }
        });

        return res.status(200).json({
            message: "Recovery token generated and logged"
        });
    } catch (error) {
        console.error(" Recovery Request Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /auth/recovery/confirm
router.post("/recovery/confirm", async (req: Request, res: Response) => {
    try {
        const { token, newWalletAddress } = req.body;
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const recoveryToken = await db.query.accountRecoveryTokens.findFirst({
            where: and(
                eq(accountRecoveryTokens.tokenHash, tokenHash),
                isNull(accountRecoveryTokens.usedAt),
                gt(accountRecoveryTokens.expiresAt, new Date())
            )
        });

        if (!recoveryToken) {
            return res.status(401).json({ error: "Invalid or expired recovery token" });
        }

        const userId = recoveryToken.userId;

        // 1. Mark token as used
        await db.update(accountRecoveryTokens)
            .set({ usedAt: new Date() })
            .where(eq(accountRecoveryTokens.id, recoveryToken.id));

        // 2. Revoke ALL current sessions (Security First)
        const { invalidateAllSessionsByUserId } = await import("../lib/session.js");
        await invalidateAllSessionsByUserId(userId);

        // 3. Update Status and/or Link new Wallet
        if (newWalletAddress) {
            await db.update(users)
                .set({ walletAddress: newWalletAddress.toLowerCase(), status: 'ACTIVE', updatedAt: new Date() })
                .where(eq(users.id, userId));
        }

        // 4. Log event
        await db.insert(securityEvents).values({
            userId,
            type: 'RECOVERY_COMPLETE',
            ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string,
            metadata: { newWalletAddress }
        });

        return res.status(200).json({ success: true, message: "Account recovered and secured" });
    } catch (error) {
        console.error("Recovery Confirm Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
