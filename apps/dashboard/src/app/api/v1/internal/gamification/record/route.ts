import { NextResponse } from "next/server";
import { GamificationService } from '@pandoras/gamification/core/gamification-service';

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
        const { telegramId, walletAddress, achievementId } = body;

        if (!telegramId && !walletAddress) {
            return NextResponse.json({ error: "Missing identity (telegramId or walletAddress)" }, { status: 400 });
        }

        // Delegate to GamificationService
        const service = GamificationService.getInstance();
        const result = await service.record({
            source: 'telegram_s2s',
            walletAddress: walletAddress || '0x0',
            eventType: 'ACHIEVEMENT_UNLOCKED',
            metadata: { telegramId, achievementId },
        });

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
