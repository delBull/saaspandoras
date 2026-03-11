import { NextResponse } from "next/server";
import { verifySignature } from "thirdweb/auth";
import { client } from "@/lib/thirdweb-client";
import { db } from "@/db";
import { authChallenges, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";

export async function POST(request: Request) {
    try {
        const token = (await cookies()).get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let verified: any;
        try {
            verified = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const userId = verified.sub;
        const body = await request.json();
        const { payload, signature } = body;

        // 1. Basic Validation
        if (!payload || !signature) {
            return NextResponse.json({ error: "Missing payload or signature" }, { status: 400 });
        }

        const { address, nonce, message } = payload;

        if (!address || !nonce || !message) {
            return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
        }

        // 2. Verify Signature
        const isValid = await verifySignature({
            client,
            message: message,
            signature,
            address,
        });

        if (!isValid) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // 3. Verify Nonce (Anti-Replay)
        const challenge = await db.query.authChallenges.findFirst({
            where: and(
                eq(authChallenges.nonce, nonce),
                eq(authChallenges.address, address.toLowerCase()),
                gt(authChallenges.expiresAt, new Date())
            )
        });

        if (!challenge) {
            return NextResponse.json({ error: "Invalid or expired nonce" }, { status: 401 });
        }

        // Invalidate used nonce
        await db.delete(authChallenges).where(eq(authChallenges.nonce, nonce));

        const walletAddress = address.toLowerCase();

        // 4. Collision Check: Is this wallet already linked to someone else?
        const existingWalletUser = await db.query.users.findFirst({
            where: eq(users.walletAddress, walletAddress)
        });

        if (existingWalletUser && existingWalletUser.id !== userId) {
            console.warn(`⚠️ Conflict: Wallet ${walletAddress} already linked to user ${existingWalletUser.id}`);
            return NextResponse.json({
                error: "Wallet already linked to another account",
                conflict: true
            }, { status: 409 });
        }

        // 5. Atomic Update
        await db.update(users)
            .set({
                walletAddress: walletAddress,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId));

        console.log(`🔗 Wallet ${walletAddress} linked to user ${userId}`);

        // 6. Refresh Session (optional: add walletAddress to claims)
        const newToken = jwt.sign({
            ...verified,
            address: walletAddress,
            iat: Math.floor(Date.now() / 1000),
        }, JWT_SECRET, { expiresIn: '24h' });

        const cookieStore = await cookies();
        cookieStore.set("auth_token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24
        });

        return NextResponse.json({
            success: true,
            userId,
            walletAddress
        });

    } catch (error) {
        console.error("❌ Link Wallet Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
