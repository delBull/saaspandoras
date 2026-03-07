
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

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        // 🛡️ SECURITY: No fallback using dev secret in production
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            if (process.env.NODE_ENV === 'production') {
                console.error("❌ CRITICAL: JWT_SECRET not set in production");
                return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
            }
            console.warn("⚠️ Warning: Using insecure dev secret for JWT");
        }
        const secret = JWT_SECRET || "super-secret-dev-key";

        const body = await request.json();
        const { payload, signature } = body;

        // 1. Validate Structure
        if (!payload || !signature) {
            return NextResponse.json({ error: "Missing payload or signature" }, { status: 400 });
        }

        // payload now contains 'message' which is the raw string
        const {
            domain,
            address,
            uri,
            chainId,
            nonce,
            expirationTime,
            message, // 🔑 Raw SIWE String
        } = payload;

        if (!message) {
            return NextResponse.json({ error: "Missing SIWE message" }, { status: 400 });
        }

        // 2. Strict SIWE Validation (Field Checks)
        // We validate the fields sent in payload align with our config.
        // Ideally we'd parse 'message' to ensure payload matches message, but verifying the signature on 'message' proves the user signed 'message'.
        // If we assume 'message' contains what 'payload' describes (which we constructed in frontend),
        // and we verify the signature against 'message', then we trust 'message'.
        // BUT we are using 'payload' fields for logic checks (domain, expiration).
        // If 'message' says "domain: evil.com" but 'payload' says "domain: app.pandoras.org",
        // and we verify 'message', we might accept it but check logic against 'payload'.
        // Risk: Payload mismatch.
        // Fix: Simple check that key fields are in the message string.

        // Domain Check
        if (domain !== config.domain) {
            console.error(`❌ Domain mismatch: expected ${config.domain}, got ${domain}`);
            return NextResponse.json({ error: "Invalid domain" }, { status: 401 });
        }
        // Simple containment check to ensure message matches payload intent
        if (!message.includes(config.domain)) {
            return NextResponse.json({ error: "Message does not contain valid domain" }, { status: 401 });
        }

        // URI Check
        if (uri !== config.origin) {
            console.error(`❌ URI mismatch: expected ${config.origin}, got ${uri}`);
            return NextResponse.json({ error: "Invalid URI" }, { status: 401 });
        }
        if (!message.includes(config.origin)) {
            return NextResponse.json({ error: "Message does not contain valid URI" }, { status: 401 });
        }

        // Chain ID Check
        if (chainId !== config.chain.id) {
            console.error(`❌ Chain ID mismatch: expected ${config.chain.id}, got ${chainId}`);
            return NextResponse.json({ error: "Invalid Chain ID" }, { status: 401 });
        }

        // Expiration Check
        const now = new Date();
        if (new Date(expirationTime) < now) {
            return NextResponse.json({ error: "Signature expired" }, { status: 401 });
        }

        // 3. Verify Signature (Strict)
        // We verify the RAW MESSAGE string.
        // verifySignature verifies that 'signature' was signed by 'address' for 'message'.
        const isValid = await verifySignature({
            client,
            message: message, // 🔑 Verify the RAW STRING
            signature,
            address, // Verify that THIS address signed the message
        });

        if (!isValid) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // 4. Nonce Validation (DB)
        // We trust 'nonce' from payload because validity check passed?
        // We should check nonce is in message too.
        if (!message.includes(nonce)) {
            return NextResponse.json({ error: "Nonce mismatch in message" }, { status: 401 });
        }

        const challenge = await db.query.authChallenges.findFirst({
            where: and(
                eq(authChallenges.nonce, nonce),
                gt(authChallenges.expiresAt, now)
            )
        });

        if (!challenge) {
            return NextResponse.json({ error: "Invalid or expired nonce" }, { status: 401 });
        }

        // Ensure address matches nonce owner
        if (challenge.address.toLowerCase() !== address.toLowerCase()) {
            return NextResponse.json({ error: "Nonce does not belong to address" }, { status: 401 });
        }

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

        // 7. Upsert User and update connection count
        const walletAddress = address.toLowerCase();
        let userId = "";

        try {
            // Find if user already exists
            const existingUsers = await db.query.users.findMany({
                where: (users, { eq }) => eq(users.walletAddress, walletAddress),
                limit: 1
            });

            const now = new Date();

            const userRecord = existingUsers[0];

            if (userRecord) {
                userId = userRecord.id;
                // Update connection count and lastConnectionAt
                const currentCount = userRecord.connectionCount || 0;
                const lastConn = userRecord.lastConnectionAt;

                // Only increment if last connection was more than 1 hour ago
                let shouldIncrement = true;
                if (lastConn) {
                    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
                    if (new Date(lastConn) > hourAgo) {
                        shouldIncrement = false;
                    }
                }

                await db.update(users)
                    .set({
                        lastConnectionAt: now,
                        updatedAt: now,
                        connectionCount: currentCount + (shouldIncrement ? 1 : 0),
                        hasPandorasKey: hasAccess
                    })
                    .where(eq(users.id, userId));
            } else {
                // Insert new user
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
                console.log(`🆕 User created with unified ID: ${userId} for wallet: ${walletAddress}`);
            }
        } catch (dbError) {
            console.error("Failed to upsert user connection tracking:", dbError);
            // Si falla la DB, no podemos obtener un userId real, 
            // pero para no romper el login usamos el address temporalmente
            userId = walletAddress;
        }

        // 8. Generate sid and Persist Session
        const sid = crypto.randomUUID();
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const userAgent = request.headers.get("user-agent");

        try {
            await db.insert(sessions).values({
                id: sid,
                userId,
                scope: 'web',
                ip,
                userAgent,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
            });

            // Log security event
            await db.insert(securityEvents).values({
                userId,
                type: 'LOGIN',
                ip,
                userAgent,
                metadata: { scope: 'web', sid }
            });
        } catch (sessionError) {
            console.error("Failed to persist session/security event:", sessionError);
        }

        // 9. Issue Scoped JWT with sid
        const token = jwt.sign({
            sub: userId,
            sid: sid,
            address: walletAddress,
            scope: 'web',
            hasAccess,
            chainId: config.chain.id,
            v: 2,
            iat: Math.floor(Date.now() / 1000),
        }, secret, { expiresIn: '24h' });

        const cookieDomain = process.env.COOKIE_DOMAIN || ".pandoras.finance";

        (await cookies()).set("auth_token", token, {
            httpOnly: true,
            secure: true, // Required for sameSite: "none"
            sameSite: "none", // Required for cross-subdomain/cross-origin calls
            domain: cookieDomain,
            path: "/",
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return NextResponse.json({
            success: true,
            hasAccess,
            user: {
                id: userId,
                address: walletAddress,
                role: "user", // Default, payload-based role could be added if needed
                hasAccess
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
