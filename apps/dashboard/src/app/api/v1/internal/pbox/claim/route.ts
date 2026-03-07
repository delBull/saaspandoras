import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/v1/internal/pbox/claim
 * 
 * S2S Endpoint for Pandoras Edge to request a PBOX claim payload.
 */
export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const PANDORA_CORE_KEY = process.env.PANDORA_CORE_KEY;

    if (!PANDORA_CORE_KEY || authHeader !== `Bearer ${PANDORA_CORE_KEY}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { walletAddress, telegramUserId } = body;

        if (!walletAddress || !telegramUserId) {
            return NextResponse.json({ error: "Missing walletAddress or telegramUserId" }, { status: 400 });
        }

        // 1. Resolve User
        const user = await db.query.users.findFirst({
            where: eq(users.telegramId, telegramUserId)
        });

        if (!user) {
            return NextResponse.json({ error: "User not found in Core" }, { status: 404 });
        }

        // 2. Prepare Mock Signature Data (for Phase 15 Simulation)
        const amount = 100; // Simulated available amount
        const nonce = crypto.randomBytes(16).toString('hex');
        const signature = "0x" + crypto.randomBytes(65).toString('hex');
        const claimId = `CLM-${Date.now()}`;

        return NextResponse.json({
            claimId,
            amount,
            nonce,
            signature,
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
        });

    } catch (e: any) {
        console.error("Core Internal Claim API Error:", e);
        return NextResponse.json({ error: "Internal Server Error", message: e.message }, { status: 500 });
    }
}
