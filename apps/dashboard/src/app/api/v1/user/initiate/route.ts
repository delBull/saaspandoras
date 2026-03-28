import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/v1/user/initiate
 * 
 * Persistent "Iniciado" Status Marker.
 * Marks the authenticated user as having completed the ritual.
 */
export async function POST(req: Request) {
    try {
        const { session, isVerified } = await getAuth(req);

        if (!isVerified || !session.address) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const walletAddress = session.address.toLowerCase();

        // Find user by wallet
        const user = await db.query.users.findFirst({
            where: eq(users.walletAddress, walletAddress)
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only update if not already initiated (idempotency)
        if (!user.ritualCompletedAt) {
            await db.update(users)
                .set({ 
                    ritualCompletedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(users.id, user.id));
            
            console.log(`✅ [User API] User ${walletAddress} marked as INICIADO`);
        }

        return NextResponse.json({ 
            success: true, 
            status: "INICIADO",
            ritualCompletedAt: user.ritualCompletedAt || new Date()
        });

    } catch (e: any) {
        console.error("❌ [User API] Initiation Error:", e);
        return NextResponse.json({ error: "Internal Server Error", message: e.message }, { status: 500 });
    }
}
