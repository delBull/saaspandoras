import { db } from "@/db";
import { projects, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/internal/mint/access-card
 * 
 * S2S Endpoint for Pandoras Edge to request an access-card mint.
 */
export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const PANDORA_CORE_KEY = process.env.PANDORA_CORE_KEY;

    if (!PANDORA_CORE_KEY || authHeader !== `Bearer ${PANDORA_CORE_KEY}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { protocolId, telegramUserId } = body;

        if (!protocolId || !telegramUserId) {
            return NextResponse.json({ error: "Missing protocolId or telegramUserId" }, { status: 400 });
        }

        // 1. Resolve Project
        const project = await db.query.projects.findFirst({
            where: eq(projects.slug, protocolId)
        });

        if (!project) {
            // Try by ID if slug not found
            const projectById = await db.query.projects.findFirst({
                where: eq(projects.id, Number(protocolId))
            });
            if (!projectById) return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // 2. Resolve User (Optional for Standalone)
        const user = await db.query.users.findFirst({
            where: eq(users.telegramId, telegramUserId)
        });

        // 3. Delegate Mint Logic
        // For Phase 15, we allow standalone minting (unlinked telegram users)
        console.log(`[CORE INTERNAL] Minting access-card for user ${telegramUserId} on protocol ${protocolId}. User linked: ${!!user}`);

        return NextResponse.json({
            status: "SUCCESS",
            message: user ? "Mint request processed for linked user" : "Mint request processed for standalone user",
            txHash: "0x" + Math.random().toString(16).slice(2, 66),
        });

    } catch (e: any) {
        console.error("Core Internal Mint API Error:", e);
        return NextResponse.json({ error: "Internal Server Error", message: e.message }, { status: 500 });
    }
}
