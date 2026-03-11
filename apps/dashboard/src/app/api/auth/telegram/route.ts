import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, sessions, securityEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateTelegramInitData } from "@/lib/telegram";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";

export async function POST(req: Request) {
    try {
        const { initData } = await req.json();

        if (!initData) {
            return NextResponse.json({ error: "Missing initData" }, { status: 400 });
        }

        const { isValid, user: tgUser } = validateTelegramInitData(initData);

        if (!isValid || !tgUser) {
            return NextResponse.json({ error: "Invalid Telegram data" }, { status: 401 });
        }

        const telegramId = String(tgUser.id);
        const name = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim();

        // 🔍 Resolve Identity (Unified Source of Truth)
        const userRecord = await db.query.users.findFirst({
            where: eq(users.telegramId, telegramId)
        });

        const now = new Date();
        let userId = "";

        if (userRecord) {
            userId = userRecord.id;
            await db.update(users)
                .set({
                    name: userRecord.name || name,
                    lastConnectionAt: now,
                    updatedAt: now
                })
                .where(eq(users.id, userId));
        } else {
            // New User via Telegram
            userId = crypto.randomUUID();
            await db.insert(users).values({
                id: userId,
                telegramId,
                name,
                connectionCount: 1,
                lastConnectionAt: now,
                createdAt: now,
                updatedAt: now,
                status: 'ACTIVE'
            });
            console.log(`🆕 User created via Telegram: ${userId} (TG: ${telegramId})`);
        }

        // 🎫 Generate sid and Persist Session
        const sid = crypto.randomUUID();
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const userAgent = req.headers.get("user-agent");

        try {
            await db.insert(sessions).values({
                id: sid,
                userId,
                scope: 'telegram',
                ip,
                userAgent,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            });

            // Log security event
            await db.insert(securityEvents).values({
                userId,
                type: 'LOGIN',
                ip,
                userAgent,
                metadata: { scope: 'telegram', sid, method: 'telegram' }
            });
        } catch (sessionError) {
            console.error("Failed to persist session/security event:", sessionError);
        }

        // 🎫 Issue Scoped JWT (telegram scope) with sid
        const token = jwt.sign({
            sub: userId,
            sid: sid,
            telegramId: telegramId,
            scope: 'telegram',
            v: 1,
            iat: Math.floor(Date.now() / 1000),
        }, JWT_SECRET, { expiresIn: '7d' });

        const cookieStore = await cookies();
        cookieStore.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({
            success: true,
            userId,
            telegramId,
            scope: 'telegram'
        });

    } catch (error) {
        console.error("❌ Telegram Auth Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
