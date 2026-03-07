import { NextResponse } from "next/server";
import { db } from "~/db";
import { eq, desc } from "drizzle-orm";
import { gamificationEvents, users } from "~/db/schema";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log("🩺 Route hit: /api/home-data/user");

    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get("wallet");

        if (!wallet || wallet === 'undefined' || wallet === 'null') {
            return NextResponse.json({ notifications: [] });
        }

        const notifications: any[] = [];

        // Check if user has telegram linked
        const userRecord = await db.select({ telegramId: users.telegramId }).from(users).where(eq(users.walletAddress, wallet)).limit(1);

        if (userRecord.length > 0 && !userRecord[0]?.telegramId) {
            notifications.push({
                id: "telegram-link-reminder",
                type: "warning",
                title: "Vincula Telegram",
                description: "Conecta tu cuenta para recibir alertas y acceder a funciones exclusivas.",
                category: "system",
                createdAt: new Date(),
                dismissible: false,
                actionUrl: "/profile"
            });
        }

        const rawEvents = await db.select()
            .from(gamificationEvents)
            .where(eq(gamificationEvents.userId, wallet))
            .orderBy(desc(gamificationEvents.createdAt))
            .limit(5);

        rawEvents.forEach(e => {
            notifications.push({
                id: e.id,
                type: e.points > 0 ? "success" : "info",
                title: `Event: ${e.type.replace(/_/g, ' ').toUpperCase()}`,
                description: `You earned ${e.points} points!`,
                category: e.category,
                createdAt: e.createdAt,
                dismissible: true
            });
        });

        return NextResponse.json({
            notifications
        });

    } catch (error) {
        console.error("❌ Home Data User API Error:", error);
        return NextResponse.json({ error: "Failed to fetch user home data" }, { status: 500 });
    }
}
