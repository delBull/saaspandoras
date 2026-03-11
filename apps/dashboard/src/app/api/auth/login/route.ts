
import { NextResponse } from "next/server";
import { verifySignature } from "thirdweb/auth";
import { client } from "@/lib/thirdweb-client";
import { db } from "@/db";
import { authChallenges, users, sessions, securityEvents } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getContract, readContract } from "thirdweb";
import { config } from "@/config";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * 🚨 CRITICAL AUTHENTICATION ROUTE 🚨
 * ============================================================================
 * WARNING: DO NOT MODIFY THE SIWE VERIFICATION LOGIC.
 * 
 * This route verifies the EIP-4361 (SIWE) signature. 
 * Because the frontend uses EIP-7702 (Gas Sponsorship), the `signature` here 
 * is signed by the EOA, NOT a Smart Account.
 * 
 * If you change the verification method to expect an ERC-1271 Smart Wallet 
 * signature, ALL SOCIAL LOGINS WILL FAIL with a 401 Unauthorized error.
 * ============================================================================
 */
export async function POST(request: Request) {
    try {
        console.log("🔐 [LOGIN] ========== REQUEST RECEIVED ==========");
        const body = await request.json();
        const { payload, signature } = body;
        console.log("🔐 [LOGIN] Body keys:", Object.keys(body));
        console.log("🔐 [LOGIN] Origin:", request.headers.get("origin"));

        // 1. Validate Structure
        if (!payload || !signature) {
            return NextResponse.json({ error: "Missing payload or signature" }, { status: 400 });
        }

        const {
            domain,
            address,
            uri,
            chainId,
            nonce,
            expirationTime,
            message,
        } = payload;

        console.log("🔹 Login Request Received");
        console.log(`🔐 Login Attempt: ${address}`);
        console.log(`📦 Payload Domain: ${domain}, Setup Domain: ${config.domain}`);

        if (!message) {
            return NextResponse.json({ error: "Missing SIWE message" }, { status: 400 });
        }

        // Domain Check
        // Domain Check
        const isLocalDev = process.env.NODE_ENV !== "production";

        if (!isLocalDev && domain !== config.domain) {
            console.error(`❌ [Login] Domain mismatch: expected ${config.domain}, got ${domain}`);
            return NextResponse.json({ error: "Invalid domain" }, { status: 401 });
        } else if (isLocalDev && domain !== config.domain && !domain.includes("localhost")) {
            // In dev allow configured domain or localhost
            console.error(`❌ [Login] Domain mismatch (Dev): expected ${config.domain} or localhost, got ${domain}`);
            return NextResponse.json({ error: "Invalid domain" }, { status: 401 });
        }

        // URI Check
        if (!isLocalDev && uri !== config.origin) {
            console.error(`❌ [Login] URI mismatch: expected ${config.origin}, got ${uri}`);
            return NextResponse.json({ error: "Invalid URI" }, { status: 401 });
        } else if (isLocalDev && uri !== config.origin && !uri.includes("localhost")) {
            // In dev allow configured origin or localhost
            console.error(`❌ [Login] URI mismatch (Dev): expected ${config.origin} or localhost, got ${uri}`);
            return NextResponse.json({ error: "Invalid URI" }, { status: 401 });
        }

        // Chain ID Check
        if (chainId !== config.chain.id) {
            console.error(`❌ [Login] Chain ID mismatch: expected ${config.chain.id}, got ${chainId}`);
            return NextResponse.json({ error: "Invalid Chain ID" }, { status: 401 });
        }

        // Expiration Check
        const now = new Date();
        if (new Date(expirationTime) < now) {
            return NextResponse.json({ error: "Signature expired" }, { status: 401 });
        }

        // 3. Verify Signature (Strict)
        const isValid = await verifySignature({
            client,
            message: message,
            signature,
            address,
        });

        if (!isValid) {
            console.error("❌ [LOGIN] Step 3: Signature verification FAILED");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
        console.log("✅ [LOGIN] Step 3: Signature verified");

        // 4. Nonce Validation (DB)
        const challenge = await db.query.authChallenges.findFirst({
            where: and(
                eq(authChallenges.nonce, nonce),
                gt(authChallenges.expiresAt, now)
            )
        });

        if (!challenge) {
            console.error("❌ [LOGIN] Step 4: Nonce not found or expired in DB:", nonce);
            return NextResponse.json({ error: "Invalid or expired nonce" }, { status: 401 });
        }
        console.log("✅ [LOGIN] Step 4: Nonce validated");

        // 5. Invalidate Nonce
        await db.delete(authChallenges).where(eq(authChallenges.nonce, nonce));

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
                params: [address]
            });
        } catch (e) {
            console.error("Gate check error:", e);
            hasAccess = false;
        }
        console.log("🔐 [LOGIN] Gate Check:", hasAccess ? "GRANTED" : "DENIED");

        // 7. Upsert User
        const walletAddress = address.toLowerCase();
        let userId = "";

        const existingUsers = await db.query.users.findMany({
            where: (users, { eq }) => eq(users.walletAddress, walletAddress),
            limit: 1
        });

        const userRecord = existingUsers[0];
        if (userRecord) {
            userId = userRecord.id;
            const currentCount = userRecord.connectionCount || 0;
            await db.update(users)
                .set({
                    lastConnectionAt: now,
                    updatedAt: now,
                    connectionCount: currentCount + 1,
                    hasPandorasKey: hasAccess
                })
                .where(eq(users.id, userId));
        } else {
            userId = crypto.randomUUID();
            await db.insert(users).values({
                id: userId,
                walletAddress,
                connectionCount: 1,
                lastConnectionAt: now,
                createdAt: now,
                updatedAt: now,
                hasPandorasKey: hasAccess
            });
            console.log(`🆕 User created with unified ID: ${userId}`);
        }

        // 8. Generate sid and Persist Session
        const sid = crypto.randomUUID();
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        await db.insert(sessions).values({
            id: sid,
            userId,
            scope: 'web',
            ip,
            userAgent,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        });

        await db.insert(securityEvents).values({
            userId,
            type: 'LOGIN',
            ip,
            userAgent,
            metadata: { scope: 'web', sid }
        });
        console.log(`✅ Session ${sid} created for user ${userId}`);

        // 9. Issue Scoped JWT with sid - REVERTED TO jsonwebtoken (HS256)
        const secret = process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY;
        if (!secret) {
            console.error("❌ CRITICAL: JWT_SECRET (or PRIVATE_KEY) is not defined");
            throw new Error("SERVER_CONFIG_ERROR");
        }

        const token = jwt.sign({
            sub: userId,
            sid: sid,
            address: walletAddress,
            scope: 'web',
            hasAccess,
            chainId: config.chain.id,
            v: parseInt(process.env.JWT_VERSION || "1"),
            iat: Math.floor(Date.now() / 1000),
        }, secret, { expiresIn: '24h' });

        const isProd = process.env.NODE_ENV === "production";
        const cookieDomain = isProd ? (process.env.COOKIE_DOMAIN || ".pandoras.finance") : undefined;
        console.log(`🍪 [LOGIN] Setting cookies - Domain: ${cookieDomain || 'localhost'} | Secure: ${isProd} | SameSite: ${isProd ? "none" : "lax"}`);

        const cookieStore = await cookies();
        cookieStore.set("auth_token", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax", // 'none' requires secure: true, handled correctly now
            ...(cookieDomain && { domain: cookieDomain }), // Only set domain if on production/staging
            path: "/",
            maxAge: 60 * 60 * 24 // 24 hours
        });

        console.log(`✅ [LOGIN] SUCCESS: Session created for ${walletAddress}`);

        return NextResponse.json({
            success: true,
            hasAccess,
            user: {
                id: userId,
                address: walletAddress,
                role: "user",
                hasAccess
            }
        });

    } catch (error: any) {
        console.error("❌ [Dashboard /api/auth/login] CRITICAL FAILURE:", error);

        let detailedError = "Internal Server Error";
        const status = 500;

        if (error.message === "SERVER_CONFIG_ERROR") {
            detailedError = "Server Configuration Error: Missing Secret";
        } else if (error.message) {
            detailedError = error.message;
        }

        return NextResponse.json({
            error: detailedError,
            details: error instanceof Error ? error.message : String(error)
        }, { status });
    }
}
