import { NextResponse } from "next/server";
import { GamificationService } from "@/lib/gamification/service";

/**
 * POST /api/v1/internal/gamification/record
 * 
 * S2S Endpoint for Pandoras Edge to sync achievements and activity.
 */
export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const PANDORA_CORE_KEY = process.env.PANDORA_CORE_KEY;

    if (!PANDORA_CORE_KEY || authHeader !== `Bearer ${PANDORA_CORE_KEY}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { telegramId, walletAddress, achievementId, eventType } = body;

        if (!telegramId && !walletAddress) {
            return NextResponse.json({ error: "Missing identity (telegramId or walletAddress)" }, { status: 400 });
        }

        const targetWallet = walletAddress || '0x0';

        // Delegate to the Dashboard's REAL GamificationService
        const result = await GamificationService.trackEvent(
            targetWallet,
            eventType || 'ACHIEVEMENT_UNLOCKED',
            { telegramId, achievementId, source: 'telegram_s2s' }
        );

        return NextResponse.json({
            ok: true,
            message: "Gamification event recorded via S2S",
            result
        });

    } catch (e: any) {
        console.error("Core Internal Gamification API Error:", e);
        return NextResponse.json({ error: "Internal Server Error", message: e.message }, { status: 500 });
    }
}
