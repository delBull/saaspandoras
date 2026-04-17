import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * POST /api/v1/internal/agora/participate
 * 
 * S2S Webhook for Pandoras Edge API to sync virtual artifact purchases
 * back into the Central SaaS Dashboard without gas fees.
 */
export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const PANDORA_CORE_KEY = process.env.PANDORA_CORE_KEY;

    if (!PANDORA_CORE_KEY || authHeader !== `Bearer ${PANDORA_CORE_KEY}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { protocolId, telegramId, amount, customPriceUsd } = body;

        let errorMessages = [];
        if (!protocolId) errorMessages.push("protocolId is required");
        if (amount === undefined || amount === null) errorMessages.push("amount is required");
        
        if (errorMessages.length > 0) {
            return NextResponse.json({ error: errorMessages.join(", ") }, { status: 400 });
        }

        const numericAmount = Number(amount) || 0;
        
        // Multiplier defaults to 1 for generic quantity decrement indexing,
        // unless it's explicitly a priced token in which we increment USD volume.
        const multiplier = customPriceUsd ? Number(customPriceUsd) : 1;
        const totalAddedValue = numericAmount * multiplier;

        console.log(`[S2S Agora Sync] Processing acquisition from TG User ${telegramId} on Protocol ${protocolId} - Amount: ${numericAmount} (Value: $${totalAddedValue})`);

        // Check if project exists by PK ID
        const targetId = Number(protocolId);
        
        if (isNaN(targetId)) {
            console.error(`[S2S Agora Sync] Invalid protocol ID format: ${protocolId}`);
            return NextResponse.json({ error: "Invalid protocol ID format" }, { status: 400 });
        }

        const existingProject = await db.query.projects.findFirst({
            where: eq(projects.id, targetId)
        });

        if (!existingProject) {
            console.error(`[S2S Agora Sync] Protocol ${targetId} not found in SaaS database.`);
            return NextResponse.json({ error: "Protocol not found" }, { status: 404 });
        }

        // Execute atomic incrementation over the raised_amount to reflect
        // the stock consumption symmetrically across Telegram UI & Dashboard.
        await db.update(projects)
            .set({ 
                raisedAmount: sql`${projects.raisedAmount} + ${totalAddedValue}`,
                updatedAt: new Date()
            })
            .where(eq(projects.id, targetId));

        return NextResponse.json({
            ok: true,
            message: "Virtual artifact acquisition successfully recorded via S2S",
            syncedValue: totalAddedValue
        });

    } catch (e: any) {
        console.error("Core S2S Agora Sync Error:", e);
        return NextResponse.json({ error: "Internal Server Error", message: e.message }, { status: 500 });
    }
}
