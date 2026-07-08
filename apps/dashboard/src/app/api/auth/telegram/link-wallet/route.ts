import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, userIdentities } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifySignature } from "thirdweb/auth";
import { client } from "@/lib/thirdweb-client";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";

export async function POST(req: Request) {
    try {
        // We accept auth_token from cookies OR X-Telegram-Auth header
        const token = (await cookies()).get("auth_token")?.value || req.headers.get("X-Telegram-Auth");
        
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
        const telegramId = verified.telegramId;
        const { walletAddress, message, signature } = await req.json();

        if (!walletAddress || !message || !signature) {
            return NextResponse.json({ error: "Missing identity proof (wallet, message, signature)" }, { status: 400 });
        }

        const cleanWallet = walletAddress.toLowerCase().trim();

        // 1. Verify cryptographic ownership of the wallet
        const isValid = await verifySignature({
            client,
            message: message,
            signature,
            address: cleanWallet,
        });

        if (!isValid) {
            return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 401 });
        }

        // 2. Check if wallet is already linked to another user
        const existingWalletUser = await db.query.users.findFirst({
            where: eq(users.walletAddress, cleanWallet)
        });

        if (existingWalletUser && existingWalletUser.id !== userId) {
            console.warn(`⚠️ Conflict: Wallet ${cleanWallet} already linked to user ${existingWalletUser.id}`);
            return NextResponse.json({
                error: "Wallet already linked to another account",
                conflict: true
            }, { status: 409 });
        }

        // 3. Link wallet to current user in Users table (Primary identity)
        await db.update(users)
            .set({
                walletAddress: cleanWallet,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId));

        // 4. Record association in user_identities table (for future account linking)
        if (telegramId) {
            const existingIdentity = await db.query.userIdentities.findFirst({
                where: and(
                    eq(userIdentities.userId, userId),
                    eq(userIdentities.provider, 'telegram'),
                    eq(userIdentities.providerId, telegramId)
                )
            });

            if (!existingIdentity) {
                await db.insert(userIdentities).values({
                    userId,
                    provider: 'telegram',
                    providerId: telegramId,
                    walletAddress: cleanWallet
                });
            } else if (existingIdentity.walletAddress !== cleanWallet) {
                await db.update(userIdentities)
                    .set({ walletAddress: cleanWallet })
                    .where(eq(userIdentities.id, existingIdentity.id));
            }
        }

        console.log(`🔗 Identity Association: Wallet ${cleanWallet} linked to user ${userId} (Provider: telegram)`);

        return NextResponse.json({
            success: true,
            userId,
            walletAddress: cleanWallet
        });

    } catch (error) {
        console.error("❌ Identity Association Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
