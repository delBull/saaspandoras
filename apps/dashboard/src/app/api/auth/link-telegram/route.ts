import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateTelegramInitData } from "@/lib/telegram";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";

export async function POST(req: Request) {
    try {
        const token = (await cookies()).get("auth_token")?.value;
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
        const { initData } = await req.json();

        if (!initData) {
            return NextResponse.json({ error: "Missing initData" }, { status: 400 });
        }

        const { isValid, user: tgUser } = validateTelegramInitData(initData);

        if (!isValid || !tgUser) {
            return NextResponse.json({ error: "Invalid Telegram data" }, { status: 401 });
        }

        const telegramId = String(tgUser.id);

        // 🔍 Collision Check: ¿Este Telegram ID ya está vinculado a otro usuario?
        const existingTelegramUser = await db.query.users.findFirst({
            where: eq(users.telegramId, telegramId)
        });

        if (existingTelegramUser && existingTelegramUser.id !== userId) {
            console.warn(`⚠️ Conflict: Telegram ${telegramId} already linked to user ${existingTelegramUser.id}`);
            return NextResponse.json({
                error: "Telegram account already linked to another user",
                conflict: true
            }, { status: 409 });
        }

        // 🔗 Link to current user
        await db.update(users)
            .set({
                telegramId,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId));

        console.log(`🔗 Telegram ${telegramId} linked to user ${userId}`);

        return NextResponse.json({
            success: true,
            userId,
            telegramId
        });

    } catch (error) {
        console.error("❌ Link Telegram Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
