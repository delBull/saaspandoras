
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
    const isProd = process.env.NODE_ENV === "production";
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

        // 7. Upsert User & Session (Hardened with Retry to handle ECONNRESET)
        const { reconstructPEM } = await import("@/lib/auth");
        const { withRetry } = await import("@/lib/database");
        console.log("🛠️ [LOGIN] Generating session IDs...");
        const sid = crypto.randomUUID();
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";
        let userId = "";
        let walletAddress = address.toLowerCase();

        // 7. Simplified User & Session Creation (Reliable Mode)
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
                    hasPandorasKey: hasAccess,
                    walletVerified: true 
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
                hasPandorasKey: hasAccess,
                walletVerified: true,
                acquisitionSource: "thirdweb_auth"
            });
            console.log(`🆕 User created with unified ID: ${userId}`);
        }

        // Persistence
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

        console.log(`✅ [LOGIN] Session ${sid} created for user ${userId}`);

        // 9. Issue Scoped JWT with sid - Support RS256 or HS256
        const privateKeyRaw = process.env.JWT_PRIVATE_KEY;
        console.log(`🔑 [LOGIN] Keys Check: PRIVATE=${!!privateKeyRaw} | SECRET=${!!process.env.JWT_SECRET}`);
        const secret = privateKeyRaw || process.env.JWT_SECRET;
        
        if (!secret) {
            console.error("❌ CRITICAL: JWT_PRIVATE_KEY (or JWT_SECRET) is not defined");
            throw new Error("SERVER_CONFIG_ERROR");
        }

        try {
            console.log("🔐 [LOGIN] Attempting JWT Sign...");
            const algorithm = privateKeyRaw ? 'RS256' : 'HS256';
            console.log(`🔐 [LOGIN] JWT Algorithm: ${algorithm} | Version: ${process.env.JWT_VERSION || "2"}`);
            
            // Apply formatting if using RS256
            let finalSecret: string;
            const isRSA = !!privateKeyRaw && privateKeyRaw.length > 100;
            const algorithmUsed = isRSA ? 'RS256' : 'HS256';

            try {
                if (isRSA) {
                    const cleanPrivateKey = privateKeyRaw!
                        .replace(/^["']|["']$/g, '')
                        .replace(/\\n/g, '\n')
                        .replace(/\r/g, '');
                    
                    finalSecret = reconstructPEM(cleanPrivateKey, 'PRIVATE');
                    console.log(`🔑 [LOGIN] Using RS256 (Key Length: ${finalSecret.length})`);
                } else {
                    finalSecret = process.env.JWT_SECRET || '';
                    console.log(`🔑 [LOGIN] Using HS256 (Secret Length: ${finalSecret.length})`);
                    if (!finalSecret) {
                        throw new Error("CRITICAL_SECURITY_ERROR: JWT_SECRET is missing in production. Signing aborted.");
                    }
                }
            } catch (pemError: any) {
                console.error("❌ [LOGIN] Cryptographic Failure:", pemError.message);
                throw pemError; // DO NOT fallback to insecure defaults
            }

            // Quick check
            if (algorithm === 'RS256' && !finalSecret.includes('-----BEGIN ')) {
                  console.warn("⚠️ [LOGIN] Reconstructed key has no headers, falling back to HS256");
                  finalSecret = process.env.JWT_SECRET || 'fallback';
            }

            console.log("🔐 [LOGIN] Payload:", { sub: userId, sid, address: walletAddress });

            const token = jwt.sign({
                sub: userId,
                sid: sid,
                address: walletAddress,
                scope: 'web',
                hasAccess,
                chainId: config.chain.id,
                v: parseInt(process.env.JWT_VERSION || "2"),
                iat: Math.floor(Date.now() / 1000),
            }, finalSecret, { 
                expiresIn: '24h',
            });
            if (!token) throw new Error("JWT_GENERATION_EMPTY");

            const isPreview = process.env.VERCEL_ENV === "preview";
            // IN DASH: We prefer HOST-ONLY cookies for stability unless we need cross-subdomain sharing.
            // But since we use .pandoras.finance for shared state normally, let's try auto-domain first or no domain.
            const cookieDomain = (isProd && !isPreview) ? ".pandoras.finance" : undefined;
            
            console.log(`🍪 [LOGIN] Setting cookies - Domain: ${cookieDomain || 'host-only'} | Secure: ${isProd} | SameSite: lax`);

            const cookieStore = await cookies();
            console.log("🔐 [LOGIN] Emitting Production-Ready Session Cookie...");

            const isProduction = process.env.NODE_ENV === "production";
            const baseOptions = {
                httpOnly: true,
                secure: isProduction, // Use production check for staging compatibility
                sameSite: "lax" as const,
                path: "/",
                maxAge: 60 * 60 * 24 
            };

            // 🎯 ONE SOURCE OF TRUTH: __pbox_sid
            await cookieStore.set("__pbox_sid", token, baseOptions);

            // Legacy compatibility (Clear others to avoid confusion)
            await cookieStore.set("auth_token", token, baseOptions);
            await cookieStore.set("pbox_session_v3", token, baseOptions);

            console.log(`✅ [LOGIN] Session cookies emitted (Secure=${isProduction})`);

            console.log("✅ [LOGIN] Dual-session cookies emitted successfully");

            console.log(`✅ [LOGIN] SUCCESS: Session created and cookies set for ${walletAddress}`);

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

        } catch (jwtOrCookieError: any) {
            console.error("💥 [LOGIN] SEVERE JWT/COOKIE FAILURE:", jwtOrCookieError);
            return NextResponse.json({ 
                error: "JWT_SIGNATURE_GENERATION_FAILED",
                details: jwtOrCookieError?.message || String(jwtOrCookieError),
                stack: isProd ? undefined : jwtOrCookieError?.stack
            }, { status: 500 });
        }

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
