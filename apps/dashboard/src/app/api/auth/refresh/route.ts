import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getContract, readContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "No session token" }, { status: 401 });
        }

        const secret = process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY;
        if (!secret) throw new Error("Missing secret");

        let payload: any;
        try {
            payload = jwt.verify(token, secret);
        } catch (e) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const address = payload.address || payload.sub;
        if (!address) return NextResponse.json({ error: "Invalid token structure" }, { status: 401 });

        console.log(`🔄 [API Refresh] Re-verifying access for ${address}`);

        // Check Blockchain
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
            console.error("Gate check error in refresh:", e);
            hasAccess = false;
        }

        if (!hasAccess) {
             console.log(`❌ [API Refresh] Still no access on-chain for ${address}`);
             return NextResponse.json({ error: "Access denied on-chain" }, { status: 403 });
        }

        // Update DB
        const walletAddressLower = typeof address === 'string' ? address.toLowerCase() : String(address).toLowerCase();
        
        await db.update(users)
            .set({ hasPandorasKey: true })
            .where(eq(users.walletAddress, walletAddressLower));

        // Re-issue Token
        const newToken = jwt.sign({
            ...payload,
            hasAccess: true,
            iat: Math.floor(Date.now() / 1000)
        }, secret, { expiresIn: '24h' });

        const isProd = process.env.NODE_ENV === "production";
        const cookieDomain = isProd ? (process.env.COOKIE_DOMAIN || ".pandoras.finance") : undefined;

        (await cookies()).set("auth_token", newToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            ...(cookieDomain && { domain: cookieDomain }),
            path: "/",
            maxAge: 60 * 60 * 24 
        });

        console.log(`✅ [API Refresh] Session refreshed for ${address}. Access Granted.`);

        return NextResponse.json({
            authenticated: true,
            hasAccess: true,
            user: {
                id: payload.sub || payload.userId,
                address: address,
                role: payload.role || "user",
                scope: payload.scope,
                hasAccess: true,
            }
        });

    } catch (error) {
        console.error("Refresh route error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
