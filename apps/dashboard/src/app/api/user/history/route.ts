import { NextResponse } from "next/server";
import { db } from "~/db";
import { gamificationEvents, users } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get("wallet");
        const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;

        if (!wallet) {
            return NextResponse.json({ error: "Wallet required" }, { status: 400 });
        }

        const user = await db.select({ id: users.id }).from(users).where(eq(users.walletAddress, wallet)).limit(1);

        if (!user || user.length === 0 || !user[0]) {
            return NextResponse.json({ events: [] });
        }

        const events = await db.select()
            .from(gamificationEvents)
            .where(eq(gamificationEvents.userId, user[0].id))
            .orderBy(desc(gamificationEvents.createdAt))
            .limit(limit);

        return NextResponse.json({ events });

    } catch (error) {
        console.error("Error fetching user history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
