import { Router, type Request, type Response } from "express";
import { verifySignature } from "thirdweb/auth";
import { client } from "../lib/thirdweb-client.js";
import { db } from "../lib/db.js";
import { authChallenges } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { getContract, readContract } from "thirdweb";
import { config } from "../config.js";
import { PANDORAS_KEY_ABI } from "../lib/pandoras-key-abi.js";
import crypto from "crypto";
import { createSession, getSession, rotateRefreshToken, invalidateSession } from "../lib/session.js";

const router = Router();

// GET /auth/nonce
router.get("/nonce", async (req: Request, res: Response) => {
    try {
        const { address } = req.query;
        if (!address || typeof address !== "string") {
            return res.status(400).json({ error: "Missing address" });
        }

        const nonce = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes

        // Store in DB (upsert) - Use nonce as conflict target since it's unique
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

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
    console.log("🔐 [LOGIN] ========== REQUEST RECEIVED ==========");
    console.log("🔐 [LOGIN] Body keys:", Object.keys(req.body));
    console.log("🔐 [LOGIN] Origin:", req.headers.origin);

    try {
        // 🛡️ SECURITY: RS256 Signing
        const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
        if (!PRIVATE_KEY) {
            console.error("❌ CRITICAL: JWT_PRIVATE_KEY not set");
            return res.status(500).json({ error: "Configuration Error" });
        }

        // Decode Base64 Key
        const privateKey = Buffer.from(PRIVATE_KEY, "base64").toString("utf-8");

        const { payload, signature } = req.body;

        console.log("🔹 Login Request Received");

        // 1. Validate Structure
        if (!payload || !signature) {
            console.error("❌ Missing payload or signature");
            return res.status(400).json({ error: "Missing payload or signature" });
        }

        // Destructure Payload
        const {
            domain,
            address: payloadAddress,
            statement,
            uri,
            version,
            chainId,
            nonce,
            issuedAt,
            expirationTime,
            message: messageString
        } = payload;

        console.log(`🔐 Login Attempt: ${payloadAddress}`);
        console.log(`📦 Payload Domain: ${domain}, Setup Domain: ${config.domain}`);

        if (!messageString) {
            console.error("❌ Missing SIWE message in payload");
            return res.status(400).json({ error: "Missing SIWE message" });
        }

        // 2. Strict SIWE Validation - Domain
        if (domain !== config.domain) {
            console.error(`❌ Domain mismatch: Received ${domain}, Expected ${config.domain}`);
            return res.status(401).json({ error: "Invalid domain" });
        }

        // 3. Verify Time
        const now = new Date();
        const expirationDate = new Date(expirationTime);
        if (now > expirationDate) {
            console.error(`❌ Token expired: ${expirationDate}`);
            return res.status(401).json({ error: "Expired signature" });
        }

        // 4. Verify Signature
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

        // 5. Nonce Validation
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

        // 6. Invalidate Nonce
        await db.delete(authChallenges).where(eq(authChallenges.nonce, nonce));

        // 7. Gate Check (Server-Side)
        const contract = getContract({
            client,
            chain: config.chain,
            address: config.nftContractAddress,
            abi: PANDORAS_KEY_ABI
        });

        let hasAccess = false;
        try {
            hasAccess = await readContract({
                contract,
                method: "isGateHolder",
                params: [payloadAddress]
            });
        } catch (e) {
            console.error("Gate check error:", e);
            hasAccess = false;
        }

        // 8. Create Session with Refresh Tokens
        const tokens = await createSession(payloadAddress, hasAccess);

        // 9. Issue JWT (short-lived, for backwards compatibility)
        const jwtToken = jwt.sign({
            sub: payloadAddress,
            hasAccess,
            sid: tokens.accessToken, // Session ID
            v: Number(process.env.JWT_VERSION || 1),
            iat: Math.floor(Date.now() / 1000),
        }, privateKey, {
            algorithm: "RS256",
            expiresIn: '15m' // Short-lived: 15 minutes
        });

        // 10. Set Cookies (both access token and refresh token)
        const isProd = process.env.NODE_ENV === "production";
        const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

        // Access Token Cookie (short-lived, for API validation)
        res.cookie("access_token", tokens.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: cookieDomain,
            path: "/",
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        // Refresh Token Cookie (long-lived, for session renewal)
        res.cookie("refresh_token", tokens.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "strict" : "lax",
            domain: cookieDomain,
            path: "/auth/refresh", // Only sent to refresh endpoint
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Also keep the JWT for backwards compatibility
        res.cookie("auth_token", jwtToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: cookieDomain,
            path: "/",
            maxAge: 15 * 60 * 1000 // 15 minutes
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

// POST /auth/refresh - Rotate refresh token and get new access token
router.post("/refresh", async (req: Request, res: Response) => {
    console.log("🔄 [REFRESH] ========== REQUEST RECEIVED ==========");
    
    try {
        const refreshToken = req.cookies.refresh_token;
        
        if (!refreshToken) {
            console.warn("⚠️ [REFRESH] No refresh token found");
            return res.status(401).json({ error: "No refresh token" });
        }

        // Rotate refresh token (invalidates old, creates new)
        const newTokens = await rotateRefreshToken(refreshToken);
        
        if (!newTokens) {
            console.warn("⚠️ [REFRESH] Invalid refresh token");
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        // Get session data
        const session = await getSession(newTokens.accessToken);
        
        if (!session) {
            console.warn("⚠️ [REFRESH] Session not found");
            return res.status(401).json({ error: "Session expired" });
        }

        // Update cookies with new tokens
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

        // Invalidate session in Redis
        if (accessToken) {
            await invalidateSession(accessToken, refreshToken);
        }

        // Clear all cookies
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
        // Try to get session from Redis first (new system)
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

        // Fallback to JWT verification (backwards compatibility)
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

export default router;
