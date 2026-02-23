import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
    try {
        const token = (await cookies()).get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const userId = decoded.sub;
        const sid = decoded.sid;

        // 1. Validate User
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        // Enforcement: Check status (ACTIVE, FROZEN, etc.)
        if (user.status !== 'ACTIVE') {
            return NextResponse.json({
                error: "Identity frozen or in recovery",
                status: user.status
            }, { status: 403 });
        }

        // 2. Validate Session (sid) - Architectural Hardening
        if (sid) {
            const session = await db.query.sessions.findFirst({
                where: and(
                    eq(sessions.id, sid),
                    isNull(sessions.revokedAt),
                    gt(sessions.expiresAt, new Date())
                )
            });

            if (!session) {
                console.warn(`⚠️ Revoked or expired session attempted: ${sid}`);
                return NextResponse.json({ error: "Session revoked" }, { status: 401 });
            }
        }

        return NextResponse.json({
            user: {
                id: user.id,
                address: user.walletAddress,
                telegramId: user.telegramId,
                name: user.name,
                image: user.image,
                hasAccess: decoded.hasAccess || user.hasPandorasKey,
                status: user.status
            }
        });

    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
}
