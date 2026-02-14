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

        // Store in DB (upsert)
        await db.insert(authChallenges).values({
            address: address,
            nonce: nonce,
            expiresAt: expiresAt,
        }).onConflictDoUpdate({
            target: authChallenges.address,
            set: { nonce, expiresAt }
        });

        return res.status(200).json({ nonce });
    } catch (error) {
        console.error("Nonce Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
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
            invalidBefore,
            resources,
            message: messageString // Raw SIWE String
        } = payload;

        console.log(`🔐 Login Attempt: ${payloadAddress}`);
        console.log(`📦 Payload Domain: ${domain}, Setup Domain: ${config.domain}`);

        if (!messageString) {
            console.error("❌ Missing SIWE message in payload");
            return res.status(400).json({ error: "Missing SIWE message" });
        }

        // 2. Strict SIWE Validation
        // Verify Domain
        if (domain !== config.domain) {
            console.error(`❌ Domain mismatch: Recieved ${domain}, Expected ${config.domain}`);
            return res.status(401).json({ error: "Invalid domain" });
        }

        // Verify Time
        const now = new Date();
        const expirationDate = new Date(expirationTime);
        if (now > expirationDate) {
            console.error(`❌ Token expired: ${expirationDate}`);
            return res.status(401).json({ error: "Expired signature" });
        }

        // 3. Verify Signature (Strict)
        const isValid = await verifySignature({
            client,
            message: messageString, // Use RAW message from frontend
            signature,
            address: payloadAddress,
        });

        if (!isValid) {
            console.error(`❌ Invalid Signature for ${payloadAddress}`);
            return res.status(401).json({ error: "Invalid signature" });
        }

        // 4. Nonce Validation
        // Ensure the signed message actually contains the nonce we issued
        if (!messageString.includes(nonce)) {
            console.error(`❌ Nonce mismatch in message string`);
            return res.status(401).json({ error: "Nonce mismatch in message" });
        }

        // Ensure the signed message contains the domain we expect
        if (!messageString.includes(config.domain)) {
            console.error(`❌ Domain mismatch in message string: Expected ${config.domain}`);
            return res.status(401).json({ error: "Domain mismatch in message" });
        }

        const challenge = await db.query.authChallenges.findFirst({
            where: and(
                eq(authChallenges.nonce, nonce),
                eq(authChallenges.address, payloadAddress), // Atomic check
                gt(authChallenges.expiresAt, now)
            )
        });

        if (!challenge) {
            console.error(`❌ Nonce not found or expired in DB: ${nonce}`);
            return res.status(401).json({ error: "Invalid or expired nonce" });
        }

        // 5. Invalidate Nonce
        await db.delete(authChallenges).where(eq(authChallenges.nonce, nonce));

        // 6. Gate Check (Server-Side)
        // 6. Gate Check (Server-Side)
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

        // 7. Issue JWT (RS256)
        const token = jwt.sign({
            sub: payloadAddress,
            hasAccess,
            v: Number(process.env.JWT_VERSION || 1),
            iat: Math.floor(Date.now() / 1000),
        }, privateKey, {
            algorithm: "RS256",
            expiresIn: '24h'
        });

        // 8. Set Cookie
        // Cross-subdomain (api.x -> app.x) requires SameSite=None + Secure in production
        const isProd = process.env.NODE_ENV === "production";
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: isProd, // Must be true for SameSite=None
            sameSite: isProd ? "none" : "lax",
            path: "/",
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        });

        return res.status(200).json({ success: true, hasAccess });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /auth/logout
router.post("/logout", (req: Request, res: Response) => {
    res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
    });
    return res.status(200).json({ success: true });
});

// GET /auth/me
router.get("/me", async (req: Request, res: Response) => {
    try {
        const token = req.cookies.auth_token;
        if (!token) {
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
        // Return 401 for "not logged in" state
        return res.status(401).json({ error: "Invalid token", details: String(error) });
    }
});

export default router;
