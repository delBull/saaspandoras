import { NextResponse } from "next/server";
import { db } from "@/db";
import { authChallenges } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { withRetry } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get("address");

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 });
        }

        const normalizedAddress = address.toLowerCase();

        // 1. Generate Nonce
        const nonce = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // 2. Invalidate previous nonces for this address (upsert/delete logic)
        // Wrapped in withRetry to handle transient DB connectivity issues (ECONNRESET)
        await withRetry(async () => {
            await db
                .insert(authChallenges)
                .values({
                    address: normalizedAddress,
                    nonce: nonce,
                    expiresAt: expiresAt,
                })
                .onConflictDoUpdate({
                    target: authChallenges.address,
                    set: {
                        nonce: nonce,
                        expiresAt: expiresAt,
                        createdAt: new Date(),
                    },
                });
        });

        return NextResponse.json({ nonce });
    } catch (error: any) {
        console.error("Error generating nonce:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
