import { Router, type Request, type Response } from "express";
import { verifySignature } from "thirdweb/auth";
import { client } from "../lib/thirdweb-client.js";
import { db } from "../lib/db.js";
import { authChallenges } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import crypto from "crypto";
import { createSession, getSession, rotateRefreshToken, invalidateSession } from "../lib/session.js";
import { getGateHolderStatus } from "../lib/nft-cache.js";
import { authLimiter, nonceLimiter, refreshLimiter } from "../middleware/rate-limit.js";
import { checkTenantAccess, getTenantId } from "../middleware/tenant-gate.js";

const router = Router();

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
            target: authChallenges.nonce,
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
            nonce,
            expirationTime,
            message: messageString
        } = payload;

        console.log(`🔐 Login Attempt: ${payloadAddress}`);
        console.log(`📦 Payload Domain: ${domain}, Setup Domain: ${config.domain}`);

        if (!messageString) {
            console.error("❌ Missing SIWE message in payload");
            return res.status(400).json({ error: "Missing SIWE message" });
        }

        if (domain !== config.domain) {
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

        if (!messageString.includes(config.domain)) {
            console.error(`❌ Domain mismatch in message string: Expected ${config.domain}`);
            return res.status(401).json({ error: "Domain mismatch in message" });
        }

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

        const tokens = await createSession(payloadAddress, hasAccess);

        const jwtToken = jwt.sign({
            sub: payloadAddress,
            hasAccess,
            sid: tokens.accessToken,
            v: Number(process.env.JWT_VERSION || 1),
            iat: Math.floor(Date.now() / 1000),
        }, privateKey, {
            algorithm: "RS256",
            expiresIn: '15m'
        });

        const isProd = process.env.NODE_ENV === "production";
        const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

        res.cookie("access_token", tokens.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: cookieDomain,
            path: "/",
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refresh_token", tokens.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "strict" : "lax",
            domain: cookieDomain,
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie("auth_token", jwtToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: cookieDomain,
            path: "/",
            maxAge: 15 * 60 * 1000
        });

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

        const newTokens = await rotateRefreshToken(refreshToken);
        
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
        const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

        res.cookie("access_token", newTokens.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: cookieDomain,
            path: "/",
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refresh_token", newTokens.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "strict" : "lax",
            domain: cookieDomain,
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log("✅ [REFRESH] SUCCESS: Token rotated for", session.address);
        
        return res.status(200).json({
            success: true,
            expiresIn: newTokens.expiresIn,
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
        const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

        res.clearCookie("access_token", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: cookieDomain,
            path: "/",
        });

        res.clearCookie("refresh_token", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "strict" : "lax",
            domain: cookieDomain,
            path: "/auth/refresh",
        });

        res.clearCookie("auth_token", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: cookieDomain,
            path: "/",
        });

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
        
        if (accessToken) {
            const session = await getSession(accessToken);
            if (session) {
                return res.status(200).json({
                    address: session.address,
                    hasAccess: session.hasAccess,
                });
            }
        }

        const token = req.cookies.auth_token;

        if (!token) {
            console.log(`⚠️ /auth/me: No token found. Origin: ${req.headers.origin}`);
            console.log(`🍪 Cookies present: ${Object.keys(req.cookies).join(", ")}`);
            return res.status(401).json({ error: "Unauthorized" });
        }

        const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;
        if (!PUBLIC_KEY) {
            console.error("❌ CRITICAL: JWT_PUBLIC_KEY not set");
            return res.status(500).json({ error: "Configuration Error" });
        }

        const publicKey = Buffer.from(PUBLIC_KEY, "base64").toString("utf-8");
        const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as any;

        return res.status(200).json({
            address: decoded.sub,
            hasAccess: decoded.hasAccess,
        });
    } catch (error) {
        console.error("❌ /auth/me Token Verification Failed:", error);
        return res.status(401).json({ error: "Invalid token", details: String(error) });
    }
});

// POST /auth/tenant-access - Check tenant-specific access
router.post("/tenant-access", async (req: Request, res: Response) => {
    try {
        const { address, tenantId } = req.body;
        
        if (!address) {
            return res.status(400).json({ error: "Missing address" });
        }
        
        // Get tenant ID from header or use default
        const resolvedTenantId = tenantId || getTenantId(req);
        
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
        // Fail open - allow access on error
        return res.status(200).json({ hasAccess: true });
    }
});

export default router;
